/**
 * Environment variable validation.
 * Validates required env vars at startup so the app fails fast with a clear
 * message instead of silently misbehaving at runtime.
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string | undefined;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string | undefined;
  ANTHROPIC_API_KEY: string | undefined;
  NODE_ENV: string;
}

function getEnv(): EnvConfig {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    NODE_ENV: process.env.NODE_ENV ?? "development",
  };
}

/**
 * Validates that all required environment variables are present and well-formed.
 * Call this in server-side code where you need to confirm the env is sane.
 * Returns a list of human-readable warnings (non-fatal) and errors (fatal).
 */
export function validateEnv(): { warnings: string[]; errors: string[] } {
  const env = getEnv();
  const warnings: string[] = [];
  const errors: string[] = [];

  // Supabase URL
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    warnings.push("NEXT_PUBLIC_SUPABASE_URL is not set — running in mock mode");
  } else if (!env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must start with https://");
  }

  // Supabase anon key
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    warnings.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — running in mock mode"
    );
  }

  // Anthropic API key
  if (!env.ANTHROPIC_API_KEY) {
    warnings.push(
      "ANTHROPIC_API_KEY is not set — AI features will use rule-based fallbacks"
    );
  } else if (!env.ANTHROPIC_API_KEY.startsWith("sk-")) {
    warnings.push("ANTHROPIC_API_KEY looks malformed (expected to start with 'sk-')");
  }

  // Production-specific checks
  if (env.NODE_ENV === "production") {
    if (!env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push("NEXT_PUBLIC_SUPABASE_URL is required in production");
    }
    if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required in production"
      );
    }
    if (!env.ANTHROPIC_API_KEY) {
      errors.push("ANTHROPIC_API_KEY is required in production");
    }
  }

  return { warnings, errors };
}

/**
 * Returns true when all Supabase environment variables look valid.
 * Keeps a single source of truth so we don't scatter the same regex checks
 * across server.ts, client.ts, and middleware.ts.
 */
export function isSupabaseReady(): boolean {
  const env = getEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const hasPublishableKey = key.startsWith("sb_publishable_") && key.length > "sb_publishable_".length;
  const hasLegacyAnonJwt = key.startsWith("eyJ") && key.length > 50;

  return (
    url.startsWith("https://") &&
    !url.includes("invalid") &&
    !url.includes("your_project") &&
    (hasPublishableKey || hasLegacyAnonJwt) &&
    !key.includes("invalid") &&
    !key.includes("your_anon")
  );
}

/**
 * Returns the Anthropic API key or null.
 * Centralised so we never scatter `process.env.ANTHROPIC_API_KEY` through
 * route handlers.
 */
export function getAnthropicKey(): string | null {
  return process.env.ANTHROPIC_API_KEY ?? null;
}
