"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getSupabaseClient, isSupabaseClientConfigured } from "@/lib/supabase/client";

const goals = ["Fat Loss", "Muscle Gain", "Body Recomposition", "Maintenance"];
const experiences = ["Beginner", "Intermediate", "Advanced"];
const accountFields = [
  { key: "name", label: "Full Name", type: "text", name: "name", autoComplete: "name" },
  { key: "email", label: "Email", type: "email", name: "email", autoComplete: "email" },
  { key: "password", label: "Password", type: "password", name: "password", autoComplete: "new-password" },
  {
    key: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    name: "confirm-password",
    autoComplete: "new-password",
  },
] as const;

type ProfileWriter = {
  from(table: "profiles"): {
    upsert(values: Record<string, unknown>): Promise<unknown>;
  };
};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    height_cm: 162.5,
    weight_kg: 63,
    goal: "Fat Loss",
    experience: "Intermediate",
    age: 25,
    maintenance_kcal: 0,
    target_kcal: 0,
    protein_goal_g: 0,
    water_goal_ml: 3000,
    step_goal: 9000,
    workout_days_per_week: 5,
  });

  const calculations = useMemo(() => {
    const bmr = 10 * form.weight_kg + 6.25 * form.height_cm - 5 * form.age + 5;
    const maintenance = Math.round(bmr * 1.55);
    const deficit = maintenance - 400;
    return {
      bmr: Math.round(bmr),
      maintenance,
      deficit,
    };
  }, [form.age, form.height_cm, form.weight_kg]);

  const update = (field: string, value: string | number) => setForm((current) => ({ ...current, [field]: value }));

  const next = () => {
    setDirection(1);
    setStep((current) => Math.min(3, current + 1));
  };

  const back = () => {
    setDirection(-1);
    setStep((current) => Math.max(1, current - 1));
  };

  const complete = async () => {
    setLoading(true);
    setError("");

    if (!isSupabaseClientConfigured) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env.local file.");
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const maintenance = form.maintenance_kcal || calculations.maintenance;
    const target = form.target_kcal || calculations.deficit;
    const protein = form.protein_goal_g || Math.round(form.weight_kg * 1.9);

    let signUpResult;
    try {
      const client = getSupabaseClient();
      signUpResult = await client.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { name: form.name },
          emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        },
      });
    } catch {
      setError("Unable to reach Supabase. Check your internet connection and Supabase URL in .env.local.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = signUpResult;

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const client = getSupabaseClient() as unknown as ProfileWriter;
      await client.from("profiles").upsert({
        id: userId,
        name: form.name,
        height_cm: form.height_cm,
        weight_kg: form.weight_kg,
        goal: form.goal,
        experience: form.experience,
        maintenance_kcal: maintenance,
        target_kcal: target,
        protein_goal_g: protein,
        carbs_goal_g: Math.round((target - protein * 4) / 4),
        fat_goal_g: 55,
        water_goal_ml: form.water_goal_ml,
        step_goal: form.step_goal,
        workout_days_per_week: form.workout_days_per_week,
      });
    }

    router.push("/dashboard");
  };

  const slide = {
    initial: { opacity: 0, x: direction > 0 ? 24 : -24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction > 0 ? -24 : 24 },
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center px-4 py-12">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (step < 3) {
              next();
              return;
            }
            void complete();
          }}
          autoComplete="on"
          className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8"
        >
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-3xl font-black tracking-[0.3em] text-white">FITCORE</div>
                <p className="mt-2 text-sm text-white/60">Create your account and training profile.</p>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((dot) => (
                  <span key={dot} className={`h-3 w-3 rounded-full ${dot <= step ? "bg-neonPurple" : "bg-white/15"}`} />
                ))}
              </div>
            </div>
            <div className="h-1 rounded-full bg-white/10">
              <div className="h-1 rounded-full bg-gradient-to-r from-neonPurple to-neonCyan transition-all" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} variants={slide} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              {step === 1 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 text-lg font-semibold text-white">Step 1 / 3 - Account</div>
                  {accountFields.map((field) => (
                    <label key={field.key} className="block">
                      <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">{field.label}</span>
                      <input
                        name={field.name}
                        autoComplete={field.autoComplete}
                        type={field.type}
                        value={form[field.key]}
                        onChange={(event) => update(field.key, event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple focus:ring-2 focus:ring-neonPurple/30"
                      />
                    </label>
                  ))}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="text-lg font-semibold text-white">Step 2 / 3 - Your Body</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Height (cm)</span><input type="number" value={form.height_cm} onChange={(event) => update("height_cm", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Current Weight (kg)</span><input type="number" value={form.weight_kg} onChange={(event) => update("weight_kg", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {goals.map((goal) => (
                      <button key={goal} type="button" onClick={() => update("goal", goal)} className={`rounded-2xl border px-4 py-3 text-left ${form.goal === goal ? "border-neonPurple bg-neonPurple/15" : "border-white/10 bg-white/5"}`}>{goal}</button>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {experiences.map((experience) => (
                      <button key={experience} type="button" onClick={() => update("experience", experience)} className={`rounded-2xl border px-4 py-3 text-left ${form.experience === experience ? "border-neonCyan bg-neonCyan/15" : "border-white/10 bg-white/5"}`}>{experience}</button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">Progress bar: 2/3</div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-5">
                  <div className="text-lg font-semibold text-white">Step 3 / 3 - Your Targets</div>
                  <div className="grid gap-3 md:grid-cols-3 text-sm text-white/70">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">BMR: {calculations.bmr}</div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Maintenance: {calculations.maintenance}</div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Deficit: {calculations.deficit}</div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Maintenance calories</span><input type="number" value={form.maintenance_kcal || calculations.maintenance} onChange={(event) => update("maintenance_kcal", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Daily calorie target</span><input type="number" value={form.target_kcal || calculations.deficit} onChange={(event) => update("target_kcal", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Protein goal (g)</span><input type="number" value={form.protein_goal_g || Math.round(form.weight_kg * 1.9)} onChange={(event) => update("protein_goal_g", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Water goal (ml)</span><input type="number" value={form.water_goal_ml} onChange={(event) => update("water_goal_ml", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Daily step goal</span><input type="number" value={form.step_goal} onChange={(event) => update("step_goal", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Workout days/week</span><input type="number" min={1} max={7} value={form.workout_days_per_week} onChange={(event) => update("workout_days_per_week", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">Progress bar: 3/3</div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {error ? <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button type="button" onClick={back} disabled={step === 1} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Back</button>
            {step < 3 ? (
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neonPurple to-neonCyan px-4 py-3 text-sm font-semibold text-black"><span>Continue</span><ChevronRight className="h-4 w-4" /></button>
            ) : (
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-neonPurple to-neonCyan px-4 py-3 text-sm font-semibold text-black disabled:opacity-70">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Complete Setup 🚀</button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
}
