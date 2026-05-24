"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/Skeleton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useProfile } from "@/hooks/useProfile";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type ExerciseSetRow = { weight_kg: number | null; reps: number | null };
type CardioRow = { duration_mins: number | null };

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loading, updateProfile } = useProfile();
  const [email, setEmail] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ workouts: 0, volume: 0, streak: 0, cardio: 0, meals: 0, daysSinceStart: 0 });
  const [confirmDelete, setConfirmDelete] = useState("");

  useEffect(() => {
    if (!profile) return;
    setNameValue(profile.name ?? "");
    setForm({
      height_cm: String(profile.height_cm ?? ""),
      weight_kg: String(profile.weight_kg ?? ""),
      goal: profile.goal ?? "Fat Loss",
      experience: profile.experience ?? "Intermediate",
      maintenance_kcal: String(profile.maintenance_kcal ?? ""),
      target_kcal: String(profile.target_kcal ?? ""),
      protein_goal_g: String(profile.protein_goal_g ?? ""),
      carbs_goal_g: String(profile.carbs_goal_g ?? ""),
      fat_goal_g: String(profile.fat_goal_g ?? ""),
      water_goal_ml: String(profile.water_goal_ml ?? ""),
      step_goal: String(profile.step_goal ?? ""),
      workout_days_per_week: String(profile.workout_days_per_week ?? ""),
    });
  }, [profile]);

  useEffect(() => {
    const loadIdentity = async () => {
      const { data: auth } = await supabase.auth.getUser();
      setEmail(auth.user?.email ?? "");
    };

    const loadStats = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const [{ count: workouts }, { data: sets }, { data: streakRow }, { data: cardioRows }, { count: meals }] = await Promise.all([
        supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("exercise_sets").select("weight_kg, reps").eq("user_id", userId),
        supabase.from("streaks").select("longest_streak").eq("user_id", userId).maybeSingle(),
        supabase.from("cardio_logs").select("duration_mins").eq("user_id", userId),
        supabase.from("meals").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      const volume = (sets ?? []).reduce((sum: number, set: ExerciseSetRow) => sum + Number(set.weight_kg ?? 0) * Number(set.reps ?? 0), 0);
      const cardio = (cardioRows ?? []).reduce((sum: number, row: CardioRow) => sum + Number(row.duration_mins ?? 0), 0) / 60;
      const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
      const daysSinceStart = Math.max(1, Math.ceil((Date.now() - createdAt.getTime()) / 86400000));

      setStats({
        workouts: workouts ?? 0,
        volume: Math.round(volume),
        streak: streakRow?.longest_streak ?? 0,
        cardio: Math.round(cardio * 10) / 10,
        meals: meals ?? 0,
        daysSinceStart,
      });
    };

    void loadIdentity();
    void loadStats();
  }, [profile?.created_at]);

  const initials = useMemo(() => (nameValue || email || "U").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(), [email, nameValue]);

  const save = async () => {
    await updateProfile({
      name: nameValue || null,
      height_cm: form.height_cm ? Number(form.height_cm) : profile?.height_cm,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : profile?.weight_kg,
      goal: form.goal,
      experience: form.experience,
      maintenance_kcal: form.maintenance_kcal ? Number(form.maintenance_kcal) : profile?.maintenance_kcal,
      target_kcal: form.target_kcal ? Number(form.target_kcal) : profile?.target_kcal,
      protein_goal_g: form.protein_goal_g ? Number(form.protein_goal_g) : profile?.protein_goal_g,
      carbs_goal_g: form.carbs_goal_g ? Number(form.carbs_goal_g) : profile?.carbs_goal_g,
      fat_goal_g: form.fat_goal_g ? Number(form.fat_goal_g) : profile?.fat_goal_g,
      water_goal_ml: form.water_goal_ml ? Number(form.water_goal_ml) : profile?.water_goal_ml,
      step_goal: form.step_goal ? Number(form.step_goal) : profile?.step_goal,
      workout_days_per_week: form.workout_days_per_week ? Number(form.workout_days_per_week) : profile?.workout_days_per_week,
    });
    showSuccessToast("Profile updated");
  };

  const uploadPhoto = async (file: File) => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      showErrorToast(error.message);
      return;
    }
    showSuccessToast("Photo uploaded");
  };

  const deleteAccount = async () => {
    if (confirmDelete !== "DELETE") return;
    const { error } = await supabase.rpc("delete_user_account");
    if (error) {
      showErrorToast(error.message);
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  const breadcrumbs = [{ label: "Dashboard" }, { label: "Profile" }];

  if (loading || !profile) {
    return <SkeletonCard className="h-[480px] w-full" />;
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
        <PageHeader title="Profile" subtitle="Manage your identity, targets, and account." breadcrumbs={breadcrumbs} />

        <GlassCard>
          <div className="grid gap-6 md:grid-cols-[240px_1fr]">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl font-bold text-white">{initials}</div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80">
                <Camera className="h-4 w-4" /> Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && void uploadPhoto(event.target.files[0])} />
              </label>
              <div className="text-lg font-semibold text-white">{nameValue || "Click to add name"}</div>
              <div className="text-sm text-white/60">{email}</div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "today"}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Display Name</span><input value={nameValue} onChange={(event) => setNameValue(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
              {[
                ["height_cm", "Height (cm)"],
                ["weight_kg", "Current Weight (kg)"],
                ["maintenance_kcal", "Maintenance kcal"],
                ["target_kcal", "Daily target kcal"],
                ["protein_goal_g", "Protein (g)"],
                ["carbs_goal_g", "Carbs (g)"],
                ["fat_goal_g", "Fats (g)"],
                ["water_goal_ml", "Water goal (ml)"],
                ["step_goal", "Step goal"],
                ["workout_days_per_week", "Workout days/week"],
              ].map(([key, label]) => (
                <label key={key} className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">{label}</span><input value={form[key] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label>
              ))}
              <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Goal</span><select value={form.goal ?? "Fat Loss"} onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"><option>Fat Loss</option><option>Muscle Gain</option><option>Body Recomposition</option><option>Maintenance</option></select></label>
              <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Experience</span><select value={form.experience ?? "Intermediate"} onChange={(event) => setForm((current) => ({ ...current, experience: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
              <div className="md:col-span-2 flex justify-end gap-3"><NeonButton onClick={save}>Save Changes</NeonButton></div>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Workout sessions", stats.workouts],
            ["Total volume", `${stats.volume} kg`],
            ["Longest streak", `${stats.streak} days`],
            ["Cardio hours", `${stats.cardio} h`],
            ["Days since app start", stats.daysSinceStart],
            ["Meals logged", stats.meals],
          ].map(([label, value]) => (
            <GlassCard key={String(label)}><div className="text-xs uppercase tracking-[0.3em] text-white/40">{label}</div><div className="mt-2 text-2xl font-bold text-white">{String(value)}</div></GlassCard>
          ))}
        </div>

        <GlassCard className="border border-rose-500/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-rose-300"><Trash2 className="h-4 w-4" /> Danger Zone</div>
              <p className="text-sm text-white/60">Type DELETE to permanently remove your account.</p>
            </div>
            <div className="flex gap-3">
              <input value={confirmDelete} onChange={(event) => setConfirmDelete(event.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" placeholder="DELETE" />
              <NeonButton onClick={deleteAccount} variant="purple-outline">Delete Account</NeonButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </ErrorBoundary>
  );
}