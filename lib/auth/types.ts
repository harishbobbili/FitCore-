import type { User } from "@supabase/supabase-js";

/**
 * Auth user interface that works across both Supabase and Demo providers
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isMock: boolean;
}

/**
 * Auth provider interface - abstracts authentication logic
 */
export interface IAuthProvider {
  /**
   * Get the current authenticated user
   * @returns The authenticated user or null if not authenticated
   */
  getUser(): Promise<AuthUser | null>;

  /**
   * Get the current user ID
   * @returns The user ID string or null if not authenticated
   */
  getUserId(): Promise<string | null>;

  /**
   * Check if this is a demo/mock provider
   */
  isDemo(): boolean;
}

/**
 * Configuration for auth provider selection
 */
export interface AuthConfig {
  provider: "supabase" | "demo";
}
