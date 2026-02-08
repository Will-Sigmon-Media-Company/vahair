/**
 * Tiny in-memory rate limiter.
 *
 * Notes:
 * - Works best-effort on serverless (per-instance).
 * - Still helps against accidental hammering / basic scraping.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds?: number;
}

type Bucket = { count: number; resetAtMs: number };

const buckets = new Map<string, Bucket>();

function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export function rateLimit(
  request: Request,
  {
    key,
    limit,
    windowMs,
  }: {
    key: string;
    limit: number;
    windowMs: number;
  }
): RateLimitResult {
  const ip = getClientIp(request);
  const now = Date.now();
  const bucketKey = `${key}:${ip}`;

  const existing = buckets.get(bucketKey);
  if (!existing || now >= existing.resetAtMs) {
    const resetAtMs = now + windowMs;
    buckets.set(bucketKey, { count: 1, resetAtMs });
    return { allowed: true, limit, remaining: Math.max(0, limit - 1), resetAtMs };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAtMs: existing.resetAtMs,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  buckets.set(bucketKey, existing);
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAtMs: existing.resetAtMs,
  };
}

