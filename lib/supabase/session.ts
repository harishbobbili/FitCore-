import { getAuthProvider } from "@/lib/auth/provider-factory";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Safely gets the current authenticated user.
 * Never throws - returns null if auth fails.
 * Uses the configured auth provider (Supabase or Demo).
 * 
 * @returns The authenticated user or null if not authenticated/unavailable
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const provider = getAuthProvider();
    return await provider.getUser();
  } catch (error) {
    // Log error in development but never throw in production
    if (process.env.NODE_ENV === "development") {
      console.error("getSessionUser error:", error);
    }
    return null;
  }
}

/**
 * Safely gets the current authenticated user's ID.
 * Never throws - returns null if auth fails.
 * Uses the configured auth provider (Supabase or Demo).
 * 
 * @returns The user ID string or null if not authenticated/unavailable
 */
export async function getSessionUserId(): Promise<string | null> {
  try {
    const provider = getAuthProvider();
    return await provider.getUserId();
  } catch (error) {
    // Log error in development but never throw in production
    if (process.env.NODE_ENV === "development") {
      console.error("getSessionUserId error:", error);
    }
    return null;
  }
}
