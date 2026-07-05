import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { redis, isRedisAvailable } from "@/lib/redis";

// Never cache the health check — it must reflect live state.
export const dynamic = "force-dynamic";

/**
 * Lightweight liveness/readiness probe for uptime monitors and load balancers.
 *
 *   GET /api/health  →  200 { status: "ok", ... }   when DB is reachable
 *                       503 { status: "degraded" }  when DB is down
 *
 * Redis is reported but non-fatal (the app degrades gracefully without it),
 * so its absence does not fail the check unless it is expected in production.
 */
export async function GET() {
  const startedAt = Date.now();

  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // --- Database ---
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: error instanceof Error ? error.message : "unknown",
    };
  }

  // --- Redis (informational) ---
  const redisStart = Date.now();
  if (!redis) {
    checks.redis = { ok: false, error: "not configured" };
  } else {
    try {
      const ok = await isRedisAvailable();
      checks.redis = { ok, latencyMs: Date.now() - redisStart };
    } catch (error) {
      checks.redis = {
        ok: false,
        latencyMs: Date.now() - redisStart,
        error: error instanceof Error ? error.message : "unknown",
      };
    }
  }

  const healthy = checks.database.ok;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      uptimeMs: process.uptime() * 1000,
      totalLatencyMs: Date.now() - startedAt,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
