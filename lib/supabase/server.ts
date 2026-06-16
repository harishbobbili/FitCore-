import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { isSupabaseReady } from "@/lib/env";
import { getAuthProvider } from "@/lib/auth/provider-factory";
import type { AuthUser } from "@/lib/auth/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient<Database> {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://invalid.supabase.co",
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "invalid-anon-key"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot always mutate cookies — safe to ignore.
          }
        },
      },
    }
  );
}

/**
 * Get the authenticated user using the configured auth provider
 * Works for both Supabase and Demo providers
 * Never throws — returns null on any error
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const provider = getAuthProvider();
    
    // For server-side, we need to use Supabase directly if not in demo mode
    // because the demo provider is client-side only
    if (provider.isDemo()) {
      return {
        id: "00000000-0000-0000-0000-000000000000",
        email: "gymgoer@fitcore.app",
        name: "Gym Goer",
        isMock: true,
      };
    }

    // Use Supabase for real authentication
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return {
      id: user.id as string,
      email: (user.email ?? "unknown@example.com") as string,
      name: (user.user_metadata?.name ?? "FitCore Athlete") as string,
      isMock: false,
    };
  } catch {
    return null;
  }
}

/**
 * Safely gets the current authenticated user ID.
 * Never throws — returns null if auth fails.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const user = await getAuthUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return isSupabaseReady();
}
