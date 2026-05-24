"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Globe } from "lucide-react";
import { getSupabaseClient, isSupabaseClientConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!isSupabaseClientConfigured) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.");
      setLoading(false);
      return;
    }

    let authResult;
    try {
      const client = getSupabaseClient();
      authResult = await client.auth.signInWithPassword({ email, password });
    } catch {
      setError("Unable to reach Supabase. Check your internet connection and Supabase URL.");
      setLoading(false);
      return;
    }

    const { error: authError } = authResult;
    if (authError) {
      setError(authError.message === "Email not confirmed" ? "Email not confirmed. Open the confirmation link Supabase sent to your inbox, then sign in again." : authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");

    if (!isSupabaseClientConfigured) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.");
      setLoading(false);
      return;
    }

    let authResult;
    try {
      const client = getSupabaseClient();
      authResult = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
    } catch {
      setError("Unable to reach Supabase. Check your internet connection and Supabase URL.");
      setLoading(false);
      return;
    }

    const { error: authError } = authResult;

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mb-3 text-3xl font-black tracking-[0.3em] text-white">FITCORE</div>
            <p className="text-sm text-white/60">Sign in to continue your training streak.</p>
          </div>

          <form onSubmit={signIn} autoComplete="on" className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40"><Mail className="h-3.5 w-3.5" /> Email</span>
              <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-neonPurple focus:ring-2 focus:ring-neonPurple/30" value={email} onChange={(event) => setEmail(event.target.value)} type="email" name="email" autoComplete="email" required />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40"><Lock className="h-3.5 w-3.5" /> Password</span>
              <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-neonPurple focus:ring-2 focus:ring-neonPurple/30" value={password} onChange={(event) => setPassword(event.target.value)} type="password" name="password" autoComplete="current-password" required />
            </label>

            {error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neonPurple to-neonCyan px-4 py-3 font-semibold text-black transition disabled:opacity-70">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign In
            </button>

            <button type="button" onClick={signInWithGoogle} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white transition hover:bg-white/15 disabled:opacity-70">
              <Globe className="h-4 w-4" /> Continue with Google
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-white/60">
            <a href="/forgot-password" className="hover:text-white">Forgot password?</a>
            <a href="/signup" className="hover:text-white">Don&apos;t have an account? Sign up</a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
