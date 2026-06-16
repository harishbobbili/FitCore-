import type { IAuthProvider, AuthUser } from "./types";

/**
 * Demo authentication provider
 * Provides mock authentication for demo/testing purposes
 * Prevents access to production Supabase operations
 */
export class DemoAuthProvider implements IAuthProvider {
  private static readonly DEMO_USER: AuthUser = {
    id: "00000000-0000-0000-0000-000000000000",
    email: "gymgoer@fitcore.app",
    name: "Gym Goer",
    isMock: true,
  };

  async getUser(): Promise<AuthUser | null> {
    // Demo provider always returns the mock user
    return DemoAuthProvider.DEMO_USER;
  }

  async getUserId(): Promise<string | null> {
    return DemoAuthProvider.DEMO_USER.id;
  }

  isDemo(): boolean {
    return true;
  }
}
