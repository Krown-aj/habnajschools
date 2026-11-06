import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult =
    | { success: true }
    | { success: false; reason: "limited" | "unavailable" };

const configured = () =>
    Boolean(
        (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
        (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
    );

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(namespace: string, maxRequests: number, windowSeconds: number) {
    const cacheKey = `${namespace}:${maxRequests}:${windowSeconds}`;
    const cached = limiterCache.get(cacheKey);
    if (cached) return cached;

    const limiter = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
        prefix: `habnaj:${namespace}`,
        analytics: false,
    });
    limiterCache.set(cacheKey, limiter);
    return limiter;
}

/**
 * Uses a shared Upstash Redis counter suitable for Vercel/serverless instances.
 * Identifiers are hashed before they are sent to the rate-limit store.
 * In production, missing or unreachable Redis fails closed for protected flows.
 */
export async function checkRateLimit(
    namespace: string,
    identifier: string,
    maxRequests: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    if (!configured()) {
        // Keep local work usable before the developer provisions a Redis store;
        // production auth must not silently run without the shared limiter.
        return process.env.NODE_ENV === "production"
            ? { success: false, reason: "unavailable" }
            : { success: true };
    }

    try {
        const safeIdentifier = createHash("sha256").update(identifier).digest("hex");
        const result = await getLimiter(namespace, maxRequests, windowSeconds).limit(safeIdentifier);
        return result.success
            ? { success: true }
            : { success: false, reason: "limited" };
    } catch {
        return { success: false, reason: "unavailable" };
    }
}
