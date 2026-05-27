import { isSupabaseClientConfigured, supabase } from "@/lib/supabase/client";

export async function getSessionUser() {
  if (!isSupabaseClientConfigured) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user ?? null;
}

export async function getSessionUserId() {
  const user = await getSessionUser();
  return user?.id ?? null;
}
