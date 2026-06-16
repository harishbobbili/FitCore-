import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { IAuthProvider, AuthUser } from "./types";

/**
 * Supabase authentication provider
 * Handles real authentication using Supabase Auth
 */
export class SupabaseAuthProvider implements IAuthProvider {
  async getUser(): Promise<AuthUser | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) return null;

      return {
        id: user.id,
        email: user.email ?? "unknown@example.com",
        name: user.user_metadata?.name ?? "FitCore Athlete",
        isMock: false,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Supabase auth error:", error);
      }
      return null;
    }
  }

  async getUserId(): Promise<string | null> {
    try {
      const user = await this.getUser();
      return user?.id ?? null;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Supabase getUserId error:", error);
      }
      return null;
    }
  }

  isDemo(): boolean {
    return false;
  }
}
