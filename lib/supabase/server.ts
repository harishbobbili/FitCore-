import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(
    url &&
    key &&
    !url.includes("invalid") &&
    !url.includes("your_project") &&
    url.startsWith("https://") &&
    !key.includes("invalid") &&
    !key.includes("your_anon") &&
    (key.startsWith("sb_publishable_") || (key.startsWith("eyJ") && key.length >= 100))
  );
};

export function createClient() {
  const cookieStore = cookies();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://invalid.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "invalid-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot always mutate cookies.
          }
        },
      },
    }
  ) as unknown as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function getAuthUser() {
  const mockUser = {
    id: "00000000-0000-0000-0000-000000000000",
    email: "gymgoer@fitcore.app",
    name: "Gym Goer",
    isMock: true,
  };

  if (!isSupabaseConfigured()) {
    return mockUser;
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || mockUser.email,
      name: user.user_metadata?.name || mockUser.name,
      isMock: false,
    };
  } catch {
    return null;
  }
}
