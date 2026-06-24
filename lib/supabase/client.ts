import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { isSupabaseReady } from "@/lib/env";

export const isSupabaseConfigured = isSupabaseReady;

export const getSupabasePublishableKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ─── Mock client ──────────────────────────────────────────────────────────────

const createMockClient = () => {
  // Only log in development — never expose infrastructure state in production
  if (process.env.NODE_ENV === "development") {
    console.info(
      "[FitCore] Supabase not configured — running in demo mode.\n" +
        "Add your Supabase credentials to .env.local to enable full functionality."
    );
  }

  const mockError = { message: "Supabase not configured" };
  const mockChain = {
    select: () => Promise.resolve({ data: null, error: mockError }),
    insert: () => Promise.resolve({ data: null, error: mockError }),
    update: () => Promise.resolve({ data: null, error: mockError }),
    delete: () => Promise.resolve({ data: null, error: mockError }),
    upsert: () => Promise.resolve({ data: null, error: mockError }),
    eq: () => mockChain,
    single: () => Promise.resolve({ data: null, error: mockError }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };

  return {
    from: (_table: string) => mockChain,
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: mockError }),
      signOut: () => Promise.resolve({ error: null }),
      signUp: () => Promise.resolve({ data: null, error: mockError }),
      resetPasswordForEmail: () => Promise.resolve({ error: mockError }),
    },
  };
};

// ─── Real client ──────────────────────────────────────────────────────────────

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabasePublishableKey();

  if (!isSupabaseReady()) {
    return createMockClient();
  }

  return createBrowserClient<Database>(url as string, key as string);
}

// Lazy proxy so we don't call getSupabaseClient() at module load time
// (which would log the mock warning on every import in development)
export const supabase = new Proxy({} as ReturnType<typeof getSupabaseClient>, {
  get(_target, property) {
    const client = getSupabaseClient();
    const value = (client as Record<PropertyKey, unknown>)[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
