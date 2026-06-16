import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseReady } from "@/lib/env";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Bucket size in seconds.  Smaller = more granular sliding window, but more rows. */
const BUCKET_SECS = 60;

/** Maximum age of stale in-memory entries (ms) */
const MEMORY_PRUNE_MS = 60_000;

// ─── In-memory fallback ────────────────────────────────────────────────────────

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

function memoryPrune() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  memoryStore.forEach((entry, key) => {
    if (entry.resetAt <= now) keysToDelete.push(key);
  });
  keysToDelete.forEach((k) => memoryStore.delete(k));
}

function memoryCheck(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  if (Math.random() < 0.01) memoryPrune();

  const now = Date.now();
  const windowMs = options.windowSecs * 1000;

  let entry = memoryStore.get(identifier);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    memoryStore.set(identifier, entry);
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

// ─── Supabase-backed sliding window ───────────────────────────────────────────

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

function getBucketStart(timestampMs: number): Date {
  const bucketMs = BUCKET_SECS * 1000;
  const startMs = Math.floor(timestampMs / bucketMs) * bucketMs;
  return new Date(startMs);
}

function getWindowStart(timestampMs: number, windowSecs: number): Date {
  const windowMs = windowSecs * 1000;
  return new Date(timestampMs - windowMs);
}

/**
 * Check rate limit using Supabase-backed sliding-window buckets.
 *
 * Strategy:
 *  - Time is divided into fixed buckets (default 60 s).
 *  - Each bucket stores a count per identifier.
 *  - A request is allowed if the sum of counts in all buckets overlapping the
 *    sliding window is below the limit.
 *  - An `expires_at` column enables TTL cleanup via cron / Edge Function.
 *
 * Falls back to the in-memory store when Supabase is unavailable (demo mode).
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions,
  supabase?: SupabaseClient<Database>
): Promise<RateLimitResult> {
  // ── Fallback (demo / unconfigured) ─────────────────────────────────────
  if (!isSupabaseReady()) {
    return memoryCheck(identifier, options);
  }

  const client = supabase ?? createClient();
  const now = Date.now();
  const windowMs = options.windowSecs * 1000;
  const bucketStart = getBucketStart(now);
  const windowStart = getWindowStart(now, options.windowSecs);

  try {
    // 1. Sum counts from all buckets inside the sliding window
    const { data: rows, error: countError } = await client
      .from("rate_limits")
      .select("count")
      .eq("identifier", identifier)
      .gte("window_start", windowStart.toISOString())
      .lte("window_start", new Date(now).toISOString());

    if (countError) throw countError;

    const currentCount =
      (rows ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

    // 2. Reject if over limit
    if (currentCount >= options.limit) {
      const resetAt = now + windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }

    // 3. Increment current bucket (UPSERT)
    const { error: upsertError } = await client
      .from("rate_limits")
      .upsert(
        {
          identifier,
          window_start: bucketStart.toISOString(),
          count: currentCount + 1,
          expires_at: new Date(now + windowMs + BUCKET_SECS * 1000).toISOString(),
        },
        { onConflict: "identifier,window_start" }
      );

    if (upsertError) throw upsertError;

    return {
      allowed: true,
      remaining: options.limit - (currentCount + 1),
      resetAt: now + windowMs,
    };
  } catch (error) {
    // On any Supabase failure, degrade gracefully to in-memory limiter
    // so the API remains usable even during DB outages.
    if (process.env.NODE_ENV === "development") {
      console.warn("[RateLimit] Supabase failed, falling back to memory:", error);
    }
    return memoryCheck(identifier, options);
  }
}

/**
 * Delete expired rate-limit rows from Supabase.
 * Call this from a cron job, Vercel cron, or Supabase Edge Function.
 *
 * @returns Number of rows deleted, or `null` when Supabase is unavailable.
 */
export async function cleanupRateLimits(
  supabase?: SupabaseClient<Database>
): Promise<number | null> {
  if (!isSupabaseReady()) return null;

  const client = supabase ?? createClient();

  try {
    const { error } = await client
      .from("rate_limits")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (error) throw error;

    // Note: Supabase JS client doesn't return a count for DELETE without
    // a select clause, so we return 0 here.  For accurate counts, use the
    // stored procedure `cleanup_expired_rate_limits()` defined in the migration.
    return 0;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[RateLimit] Cleanup failed:", error);
    }
    return null;
  }
}

/**
 * Run the PostgreSQL cleanup procedure and return the number of rows removed.
 * Requires `rpc` privileges (service role or function exposed via postgREST).
 */
export async function cleanupRateLimitsViaRpc(
  supabase?: SupabaseClient<Database>
): Promise<number | null> {
  if (!isSupabaseReady()) return null;

  const client = supabase ?? createClient();

  try {
    const { data, error } = await client.rpc("cleanup_expired_rate_limits");
    if (error) throw error;
    return data ?? 0;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[RateLimit] RPC cleanup failed:", error);
    }
    return null;
  }
}

// ─── Pre-configured limiters ──────────────────────────────────────────────────

/** AI chat — 30 messages per hour per user */
export async function checkAiChatLimit(
  userId: string,
  supabase?: SupabaseClient<Database>
): Promise<RateLimitResult> {
  return checkRateLimit(`ai-chat:${userId}`, { limit: 30, windowSecs: 3600 }, supabase);
}

/** AI workout suggest — 20 requests per hour per user */
export async function checkAiWorkoutLimit(
  userId: string,
  supabase?: SupabaseClient<Database>
): Promise<RateLimitResult> {
  return checkRateLimit(
    `ai-workout:${userId}`,
    { limit: 20, windowSecs: 3600 },
    supabase
  );
}

/** AI meal suggest — 20 requests per hour per user */
export async function checkAiMealLimit(
  userId: string,
  supabase?: SupabaseClient<Database>
): Promise<RateLimitResult> {
  return checkRateLimit(
    `ai-meal:${userId}`,
    { limit: 20, windowSecs: 3600 },
    supabase
  );
}

/** Calorie adjust — 10 requests per hour per user (it's a GET, called automatically) */
export async function checkCalorieAdjustLimit(
  userId: string,
  supabase?: SupabaseClient<Database>
): Promise<RateLimitResult> {
  return checkRateLimit(
    `ai-calorie:${userId}`,
    { limit: 10, windowSecs: 3600 },
    supabase
  );
}
