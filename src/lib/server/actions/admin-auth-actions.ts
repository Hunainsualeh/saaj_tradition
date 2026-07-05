"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "../helpers/password";
import { ServerActionResponse } from "@/types/server";
import { wrapServerCall } from "../helpers/generic-helpers";
import { AdminRoleEnum } from "@prisma/client";
import { rateLimitLogin } from "@/lib/rate-limit";
import { createSession, deleteSession, denylistToken } from "@/lib/redis-session";

const ADMIN_COOKIE_NAME = "admin_session";

/** Throws if ADMIN_SESSION_SECRET is missing or still set to the insecure default. */
function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET env var is required but not set.");
  }
  if (secret === "saaj-default-session-secret-change-me") {
    throw new Error("ADMIN_SESSION_SECRET must be changed from the default value.");
  }
  return secret;
}

/** Sign a base64 payload with HMAC-SHA256 → "payload.signature" */
function signSession(payload: string): string {
  const sig = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

/** Verify and extract payload from a signed cookie value */
function verifySession(token: string): string | null {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  const expected = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  return payload;
}
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// =====================================
// AUTH
// =====================================

/** Login with email + password */
export async function adminLogin(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Rate limit: 10 login attempts per 15 minutes per IP
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  const rl = await rateLimitLogin(ip);
  if (!rl.allowed) {
    return { error: "Too many login attempts. Please try again later." };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!admin || !admin.isActive) {
    return { error: "Invalid email or password" };
  }

  const valid = verifyPassword(password, admin.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  // Store admin ID + role + expiry in cookie (JSON encoded, base64, HMAC-signed).
  // `exp` makes the signed token self-expiring even if the cookie is replayed.
  const sessionData = JSON.stringify({
    id: admin.id,
    role: admin.role,
    exp: Date.now() + COOKIE_MAX_AGE * 1000,
  });
  const payload = Buffer.from(sessionData).toString("base64");
  const token = signSession(payload);

  // Store session in Redis for server-side tracking / invalidation
  await createSession(admin.id, { id: admin.id, role: admin.role }, COOKIE_MAX_AGE);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  redirect(redirectTo || "/admin");
}

/** Logout — clear session cookie and Redis session */
export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  // Delete Redis session + denylist this cookie so it can't be replayed if copied
  if (token) {
    try {
      const verified = verifySession(token);
      if (verified) {
        const decoded = JSON.parse(Buffer.from(verified, "base64").toString("utf-8"));
        if (decoded.id) await deleteSession(decoded.id);
        const ttl = decoded.exp
          ? Math.ceil((decoded.exp - Date.now()) / 1000)
          : COOKIE_MAX_AGE;
        await denylistToken(token, ttl);
      }
    } catch {
      // Non-critical — cookie will be cleared anyway
    }
  }

  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

/** Get the currently logged-in admin from cookie */
export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = verifySession(token);
    if (!payload) return null;

    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    if (!decoded.id || !decoded.role) return null;
    // Reject expired tokens (legacy tokens without `exp` remain valid, bounded
    // by the cookie's own maxAge).
    if (decoded.exp && Date.now() > decoded.exp) return null;

    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    if (!admin || !admin.isActive) return null;
    return admin;
  } catch {
    return null;
  }
}

// =====================================
// PASSWORD UPDATE
// =====================================

/** Update own password */
export async function updateAdminPassword(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, message: "All fields are required" };
  }

  if (newPassword.length < 10) {
    return { success: false, message: "New password must be at least 10 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: "New passwords do not match" };
  }

  const admin = await getCurrentAdmin();
  if (!admin) {
    return { success: false, message: "Not authenticated" };
  }

  const fullAdmin = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!fullAdmin) {
    return { success: false, message: "Admin not found" };
  }

  const valid = verifyPassword(currentPassword, fullAdmin.passwordHash);
  if (!valid) {
    return { success: false, message: "Current password is incorrect" };
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: hashPassword(newPassword) },
  });

  return { success: true, message: "Password updated successfully" };
}

// =====================================
// ADMIN MANAGEMENT (Super Admin only)
// =====================================

/** Create a new admin user (Super Admin only) */
export async function createAdminUser(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!name || !email || !password) {
    return { success: false, message: "All fields are required" };
  }

  if (password.length < 10) {
    return { success: false, message: "Password must be at least 10 characters" };
  }

  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin || currentAdmin.role !== AdminRoleEnum.SUPER_ADMIN) {
    return { success: false, message: "Only Super Admins can create new admins" };
  }

  const existing = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) {
    return { success: false, message: "An admin with this email already exists" };
  }

  await prisma.adminUser.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hashPassword(password),
      role: role === "SUPER_ADMIN" ? AdminRoleEnum.SUPER_ADMIN : AdminRoleEnum.ADMIN,
      isActive: true,
    },
  });

  return { success: true, message: `Admin "${name}" created successfully` };
}

/** Toggle admin active status (Super Admin only) */
export async function toggleAdminStatus(
  adminId: string,
): Promise<ServerActionResponse<{ id: string }>> {
  return wrapServerCall(async () => {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || currentAdmin.role !== AdminRoleEnum.SUPER_ADMIN) {
      throw new Error("Only Super Admins can manage admins");
    }

    if (currentAdmin.id === adminId) {
      throw new Error("You cannot deactivate yourself");
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) throw new Error("Admin not found");

    await prisma.adminUser.update({
      where: { id: adminId },
      data: { isActive: !admin.isActive },
    });

    return { id: adminId };
  });
}

/** Delete admin user (Super Admin only) */
export async function deleteAdminUser(
  adminId: string,
): Promise<ServerActionResponse<{ id: string }>> {
  return wrapServerCall(async () => {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || currentAdmin.role !== AdminRoleEnum.SUPER_ADMIN) {
      throw new Error("Only Super Admins can delete admins");
    }

    if (currentAdmin.id === adminId) {
      throw new Error("You cannot delete yourself");
    }

    await prisma.adminUser.delete({ where: { id: adminId } });
    return { id: adminId };
  });
}

/** Get all admin users (Super Admin only) */
export async function getAllAdminUsers(): Promise<
  ServerActionResponse<
    Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      isActive: boolean;
      createdAt: Date;
    }>
  >
> {
  return wrapServerCall(async () => {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin || currentAdmin.role !== AdminRoleEnum.SUPER_ADMIN) {
      throw new Error("Only Super Admins can view admin users");
    }

    return prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  });
}
