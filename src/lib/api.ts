import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RbacError } from "./rbac";
import { log } from "./log";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Wraps a route handler with consistent error mapping. */
export function handle<T extends unknown[]>(
  fn: (...args: T) => Promise<Response>,
): (...args: T) => Promise<Response> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail("Échec de la validation", 422, { issues: err.flatten() });
      }
      if (err instanceof RbacError) {
        return fail(err.message, err.status);
      }
      log.error("api.unhandled", err);
      return fail("Erreur interne du serveur", 500);
    }
  };
}

// ---------------------------------------------------------------------------
// In-memory rate limiter (per-instance). Good enough for a single-node deploy;
// swap for Redis if you scale horizontally.
// ---------------------------------------------------------------------------

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

export function assertRateLimit(req: Request, name: string, limit = 20, windowMs = 60_000) {
  const key = `${name}:${clientIp(req)}`;
  if (!rateLimit(key, limit, windowMs)) {
    const e = new RbacError("Trop de requêtes. Merci de ralentir.");
    e.status = 429;
    throw e;
  }
}

export function pageParams(url: URL, defaultPageSize = 12) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSizeRaw = parseInt(url.searchParams.get("pageSize") ?? "", 10);
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw || defaultPageSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
