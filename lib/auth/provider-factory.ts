import { isSupabaseReady } from "@/lib/env";
import { SupabaseAuthProvider } from "./supabase-provider";
import { DemoAuthProvider } from "./demo-provider";
import type { IAuthProvider } from "./types";

/**
 * Factory function to create the appropriate auth provider based on configuration
 * @returns The configured auth provider instance
 */
export function createAuthProvider(): IAuthProvider {
  if (!isSupabaseReady() && process.env.NODE_ENV === 'production') {
    throw new Error('Supabase env vars missing in production. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }

  if (isSupabaseReady()) {
    return new SupabaseAuthProvider();
  }
  
  return new DemoAuthProvider();
}

/**
 * Get a new auth provider instance (stateless, safe to create per-request)
 * @returns The auth provider instance
 */
export function getAuthProvider(): IAuthProvider {
  return createAuthProvider();
}
