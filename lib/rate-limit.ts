/**
 * Simple in-memory rate limiter for AI endpoints.
 *
 * Keeps a per-user sliding-window counter.  Because Next.js serverless functions
 * can spin up fresh instances, this won't protect against distributed abuse across
 * many concurrent instances.  For an MVP it is perfectly adequate — a single user
 * hammering the endpoint from one browser tab is the primary threat.
 *
 * Limits are intentionally generous to avoid blocking legitimate power users.
 */

interface WindowEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

// Module-level map — survives multiple requests in the same Node process / warm lambda
const store = new Map<string, WindowEntry>();

// Prune entries that have already reset to avoid memory leaks
function prune() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  store.forEach((entry, key) => {
    if (entry.resetAt <= now) keysToDelete.push(key);
  });
  keysToDelete.forEach(k => store.delete(k));
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed per window */
  limit: number;
  /** Window size in seconds */
  windowSecs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (ms)
}

/**
 * Check whether `identifier` (typically `userId:endpoint`) is within its limit.
 * Increments the counter on each call.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  // Prune occasionally (every ~100 checks) to avoid unbounded growth
  if (Math.random() < 0.01) prune();

  const now = Date.now();
  const windowMs = options.windowSecs * 1000;

  let entry = store.get(identifier);

  if (!entry || entry.resetAt <= now) {
    // Start a fresh window
    entry = { count: 1, resetAt: now + windowMs };
    store.set(identifier, entry);
    return { allowed: true, remaining: options.limit - 1, resetAt: entry.resetAt };
  }

  entry.count += 1;

  if (entry.count > options.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: options.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ─── Pre-configured limiters ──────────────────────────────────────────────────

/** AI chat — 30 messages per hour per user */
export function checkAiChatLimit(userId: string): RateLimitResult {
  return checkRateLimit(`ai-chat:${userId}`, { limit: 30, windowSecs: 3600 });
}

/** AI workout suggest — 20 requests per hour per user */
export function checkAiWorkoutLimit(userId: string): RateLimitResult {
  return checkRateLimit(`ai-workout:${userId}`, { limit: 20, windowSecs: 3600 });
}

/** AI meal suggest — 20 requests per hour per user */
export function checkAiMealLimit(userId: string): RateLimitResult {
  return checkRateLimit(`ai-meal:${userId}`, { limit: 20, windowSecs: 3600 });
}

/** Calorie adjust — 10 requests per hour per user (it's a GET, called automatically) */
export function checkCalorieAdjustLimit(userId: string): RateLimitResult {
  return checkRateLimit(`ai-calorie:${userId}`, { limit: 10, windowSecs: 3600 });
}
