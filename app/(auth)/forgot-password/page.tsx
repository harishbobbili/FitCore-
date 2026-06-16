"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2 } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!isSupabaseConfigured()) {
      setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.");
      setLoading(false);
      return;
    }

    let resetResult;
    try {
      const client = getSupabaseClient();
      resetResult = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
    } catch {
      setMessage("Unable to reach Supabase. Check your internet connection and Supabase URL.");
      setLoading(false);
      return;
    }

    const { error } = resetResult;

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Reset link sent. Check your inbox.");
    }

    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <form onSubmit={sendReset} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-white">Reset password</h1>
          <p className="mt-2 text-sm text-white/60">We&apos;ll send a link to your email.</p>

          <label className="mt-6 block">
            <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40"><Mail className="h-3.5 w-3.5" /> Email</span>
            <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-neonPurple focus:ring-2 focus:ring-neonPurple/30" type="email" name="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          {message ? <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">{message}</div> : null}

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neonPurple to-neonCyan px-4 py-3 font-semibold text-black" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send reset link
          </button>
        </form>
      </div>
    </motion.div>
  );
}
