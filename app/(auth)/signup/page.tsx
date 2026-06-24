"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

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
    gender: "male" as "male" | "female",
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
    // BMR formula (Mifflin-St Jeor)
    // Male:   BMR = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    // Female: BMR = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    //
    // Example calculation for male, 71kg, 175cm, age 25, goal "Fat Loss", 5 workout days/week:
    // BMR = 10*71 + 6.25*175 - 5*25 + 5 = 1684 kcal
    // TDEE (maint) = 1684 * 1.55 = 2610 kcal
    // Target = 2610 - 400 = 2210 kcal
    // Protein = 71 * 1.8 = 128g
    // Fat = 55g (fixed)
    // Fat kcal = 55 * 9 = 495
    // Protein kcal = 128 * 4 = 512
    // Carbs = (2210 - 512 - 495) / 4 = 301g
    const bmr = form.gender === "male"
      ? 10 * form.weight_kg + 6.25 * form.height_cm - 5 * form.age + 5
      : 10 * form.weight_kg + 6.25 * form.height_cm - 5 * form.age - 161;

    // Activity multiplier based on workout days per week
    // 0-1 days → 1.2 (sedentary)
    // 2-3 days → 1.375 (lightly active)
    // 4-5 days → 1.55 (moderately active)
    // 6-7 days → 1.725 (very active)
    let activityMultiplier: number;
    if (form.workout_days_per_week <= 1) {
      activityMultiplier = 1.2;
    } else if (form.workout_days_per_week <= 3) {
      activityMultiplier = 1.375;
    } else if (form.workout_days_per_week <= 5) {
      activityMultiplier = 1.55;
    } else {
      activityMultiplier = 1.725;
    }

    const maintenance = Math.round(bmr * activityMultiplier);

    // Goal-based calorie adjustment
    // "Fat Loss" → target = maintenance - 400
    // "Muscle Gain" → target = maintenance + 300
    // "Body Recomposition" → target = maintenance
    // "Maintenance" → target = maintenance
    let target: number;
    switch (form.goal) {
      case "Fat Loss":
        target = maintenance - 400;
        break;
      case "Muscle Gain":
        target = maintenance + 300;
        break;
      case "Body Recomposition":
      case "Maintenance":
        target = maintenance;
        break;
      default:
        target = maintenance - 400;
    }

    // Protein formula: 2.0g/kg for Muscle Gain, 1.8g/kg for others
    const protein_g = form.goal === "Muscle Gain"
      ? Math.round(form.weight_kg * 2.0)
      : Math.round(form.weight_kg * 1.8);

    // Carbs formula: subtract fat and protein calories first
    const fat_g = 55;
    const fat_kcal = fat_g * 9;
    const protein_kcal = protein_g * 4;
    const carbs_g = Math.max(50, Math.round((target - protein_kcal - fat_kcal) / 4));

    return {
      bmr: Math.round(bmr),
      maintenance,
      target,
      protein_g,
      carbs_g,
      fat_g,
    };
  }, [form.age, form.height_cm, form.weight_kg, form.gender, form.workout_days_per_week, form.goal]);

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

    if (!isSupabaseConfigured()) {
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
    const target = form.target_kcal || calculations.target;
    const protein = form.protein_goal_g || calculations.protein_g;
    const carbs = calculations.carbs_g;
    const fat = calculations.fat_g;

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
        gender: form.gender,
        height_cm: form.height_cm,
        weight_kg: form.weight_kg,
        goal: form.goal,
        experience: form.experience,
        maintenance_kcal: maintenance,
        target_kcal: target,
        protein_goal_g: protein,
        carbs_goal_g: carbs,
        fat_goal_g: fat,
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
                  <div className="grid gap-3 md:grid-cols-2">
                    <button type="button" onClick={() => update("gender", "male")} className={`rounded-2xl border px-4 py-3 text-left ${form.gender === "male" ? "border-neonPurple bg-neonPurple/15" : "border-white/10 bg-white/5"}`}>Male</button>
                    <button type="button" onClick={() => update("gender", "female")} className={`rounded-2xl border px-4 py-3 text-left ${form.gender === "female" ? "border-neonPurple bg-neonPurple/15" : "border-white/10 bg-white/5"}`}>Female</button>
                  </div>
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
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Target: {calculations.target}</div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Maintenance calories</span><input type="number" value={form.maintenance_kcal || calculations.maintenance} onChange={(event) => update("maintenance_kcal", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Daily calorie target</span><input type="number" value={form.target_kcal || calculations.target} onChange={(event) => update("target_kcal", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Protein goal (g)</span><input type="number" value={form.protein_goal_g || calculations.protein_g} onChange={(event) => update("protein_goal_g", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Water goal (ml)</span><input type="number" value={form.water_goal_ml} onChange={(event) => update("water_goal_ml", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Daily step goal</span><input type="number" value={form.step_goal} onChange={(event) => update("step_goal", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
                    <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Workout days/week</span><input type="number" min={0} max={7} value={form.workout_days_per_week} onChange={(event) => update("workout_days_per_week", Number(event.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
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
