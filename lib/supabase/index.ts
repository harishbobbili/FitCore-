// Centralized Supabase exports
// Use this barrel file to import all Supabase utilities consistently

export { supabase, getSupabaseClient, getSupabasePublishableKey } from "./client";
export { createClient, getAuthUser, getAuthUserId, isSupabaseConfigured } from "./server";
export { getSessionUser, getSessionUserId } from "./session";
export { mockDb } from "./mockDb";
