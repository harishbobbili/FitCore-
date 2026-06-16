import { isSupabaseReady } from "@/lib/env";
import { SupabaseAuthProvider } from "./supabase-provider";
import { DemoAuthProvider } from "./demo-provider";
import type { IAuthProvider } from "./types";

/**
 * Factory function to create the appropriate auth provider based on configuration
 * @returns The configured auth provider instance
 */
export function createAuthProvider(): IAuthProvider {
  if (isSupabaseReady()) {
    return new SupabaseAuthProvider();
  }
  
  return new DemoAuthProvider();
}

/**
 * Singleton instance of the auth provider
 * Reuse the same instance throughout the application
 */
let authProviderInstance: IAuthProvider | null = null;

/**
 * Get or create the singleton auth provider instance
 * @returns The auth provider instance
 */
export function getAuthProvider(): IAuthProvider {
  if (!authProviderInstance) {
    authProviderInstance = createAuthProvider();
  }
  return authProviderInstance;
}

/**
 * Reset the auth provider instance (useful for testing)
 */
export function resetAuthProvider(): void {
  authProviderInstance = null;
}
