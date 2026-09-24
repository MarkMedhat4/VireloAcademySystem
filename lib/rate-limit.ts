import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort in-memory rate limiter (per server instance).
 * On serverless platforms each instance keeps its own counters, so this slows down
 * casual abuse but is not a substitute for Supabase Auth limits / a WAF (see README → Security).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function rateLimit(scope: string, limit: number, windowMs: number, extraKey = ""): Promise<boolean> {
  const key = `${scope}:${await clientIp()}:${extraKey}`;
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export const TOO_MANY_MESSAGE = "محاولات كثيرة خلال وقت قصير. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.";
