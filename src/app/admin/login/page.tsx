import type { Metadata } from "next";

import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = {
  title: { absolute: "Admin Login | Saaj Tradition" },
};

function getSafeRedirect(value: string | undefined): string {
  if (!value) return "/admin";
  if (value.includes("\\") || value.startsWith("//")) return "/admin";
  if (value !== "/admin" && !value.startsWith("/admin/")) return "/admin";
  if (value === "/admin/login" || value.startsWith("/admin/login/")) return "/admin";
  return value;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = getSafeRedirect(
    Array.isArray(redirect) ? redirect[0] : redirect,
  );

  return (
    <div className="min-h-screen w-full">
      <AdminLoginForm redirect={redirectTo} />
    </div>
  );
}
