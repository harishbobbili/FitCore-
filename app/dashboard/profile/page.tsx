"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, User, Calendar, Ruler, Scale, Target, TrendingUp, Droplets, Footprints, Dumbbell, X } from "lucide-react";
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
  const [gender, setGender] = useState<"male" | "female">("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ workouts: 0, volume: 0, streak: 0, cardio: 0, meals: 0, daysSinceStart: 0 });
  const [confirmDelete, setConfirmDelete] = useState("");

  useEffect(() => {
    if (!profile) return;
    setNameValue(profile.name ?? "");
    setForm({
      height_cm: String(profile.height_cm ?? ""),
      weight_kg: String(profile.weight_kg ?? ""),
      target_weight_kg: String(profile.weight_kg ?? ""),
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

  // Calculate age from date of birth
  const age = useMemo(() => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [dateOfBirth]);

  // Calculate estimated macros using Katch-McArdle formula
  const estimatedMacros = useMemo(() => {
    const weight = parseFloat(form.weight_kg) || 0;
    const height = parseFloat(form.height_cm) || 0;
    const goal = form.goal || "Fat Loss";
    const genderValue = gender;

    if (!weight || !height) return null;

    // Estimate body fat percentage (simplified formula)
    let bodyFatPercent: number;
    if (genderValue === "male") {
      bodyFatPercent = (1.20 * (weight / (height / 100) ** 2)) + (0.23 * (age || 30)) - 16.2;
    } else {
      bodyFatPercent = (1.20 * (weight / (height / 100) ** 2)) + (0.23 * (age || 30)) - 5.4;
    }
    bodyFatPercent = Math.max(10, Math.min(30, bodyFatPercent)); // Clamp between 10-30%

    // Lean Body Mass (LBM)
    const lbm = weight * (1 - bodyFatPercent / 100);

    // Katch-McArdle BMR
    const bmr = 370 + (21.6 * lbm);

    // Activity multiplier (assuming moderate activity)
    const activityMultiplier = 1.55;

    // Maintenance calories
    const maintenanceKcal = Math.round(bmr * activityMultiplier);

    // Target calories based on goal
    let targetKcal: number;
    let deficitSurplus: number;
    switch (goal) {
      case "Fat Loss":
        deficitSurplus = -500;
        break;
      case "Muscle Gain":
        deficitSurplus = 300;
        break;
      case "Body Recomposition":
        deficitSurplus = -200;
        break;
      case "Maintenance":
        deficitSurplus = 0;
        break;
      case "Endurance":
        deficitSurplus = 200;
        break;
      default:
        deficitSurplus = -500;
    }
    targetKcal = maintenanceKcal + deficitSurplus;

    // Protein goal (2.2g per kg of body weight)
    const proteinGoal = Math.round(weight * 2.2);

    // Calculate remaining calories for carbs and fats
    const proteinCalories = proteinGoal * 4;
    const remainingCalories = targetKcal - proteinCalories;

    // Split remaining between carbs and fats (40% carbs, 60% fats for simplicity)
    const fatGoal = Math.round((remainingCalories * 0.6) / 9);
    const carbsGoal = Math.round((remainingCalories * 0.4) / 4);

    // Water goal (35ml per kg)
    const waterGoal = Math.round(weight * 35);

    // Step goal
    const stepGoal = 10000;

    return {
      maintenance_kcal: maintenanceKcal,
      target_kcal: targetKcal,
      protein_goal_g: proteinGoal,
      carbs_goal_g: carbsGoal,
      fat_goal_g: fatGoal,
      water_goal_ml: waterGoal,
      step_goal: stepGoal,
    };
  }, [form.weight_kg, form.height_cm, form.goal, gender, age]);

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

  const handleAvatarSelect = (file: File) => {
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const uploadPhoto = async () => {
    if (!avatarFile) return;
    
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;
    
    const path = `${userId}/${Date.now()}-${avatarFile.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
    if (error) {
      showErrorToast(error.message);
      return;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    
    // Update profile with avatar URL
    await updateProfile({ avatar_url: publicUrl });
    showSuccessToast("Photo uploaded");
    setAvatarFile(null);
    setAvatarPreview(null);
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

        {/* Real-time Macro Preview */}
        {estimatedMacros && (
          <GlassCard className="border-neonCyan/20 bg-neonCyan/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-neonCyan" />
              <span className="text-xs font-bold uppercase tracking-wider text-neonCyan">Estimated Macros</span>
            </div>
            <div className="text-sm text-white/80">
              {estimatedMacros.target_kcal || 0} kcal, {estimatedMacros.protein_goal_g || 0}g protein, {estimatedMacros.carbs_goal_g || 0}g carbs, {estimatedMacros.fat_goal_g || 0}g fat
            </div>
          </GlassCard>
        )}

        <GlassCard>
          <div className="grid gap-6 md:grid-cols-[240px_1fr]">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              {avatarPreview || profile?.avatar_url ? (
                <div className="relative">
                  <img
                    src={avatarPreview || profile?.avatar_url}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover border-2 border-white/20"
                  />
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarPreview(null);
                        setAvatarFile(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-rose-500 rounded-full text-white hover:bg-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl font-bold text-white">
                  {initials}
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20 transition-colors">
                <Camera className="h-4 w-4" /> Upload photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => event.target.files?.[0] && handleAvatarSelect(event.target.files[0])}
                />
              </label>
              {avatarPreview && (
                <NeonButton variant="gradient" className="w-full text-xs" onClick={uploadPhoto}>
                  Save Photo
                </NeonButton>
              )}
              <div className="text-lg font-semibold text-white">{nameValue || "Click to add name"}</div>
              <div className="text-sm text-white/60">{email}</div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">
                Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "today"}
              </div>
            </div>

            {/* Form Sections */}
            <div className="space-y-6">
              {/* Group 1: Personal Info */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-neonPurple" />
                  Personal Info
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Name</span>
                    <input
                      value={nameValue}
                      onChange={(event) => setNameValue(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Gender</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setGender("male")}
                        className={`flex-1 py-2 px-4 rounded-xl border-2 transition-all ${
                          gender === "male"
                            ? "border-neonPurple bg-neonPurple/20 text-white"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender("female")}
                        className={`flex-1 py-2 px-4 rounded-xl border-2 transition-all ${
                          gender === "female"
                            ? "border-neonPurple bg-neonPurple/20 text-white"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Date of Birth</span>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(event) => setDateOfBirth(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                    {age && <div className="mt-1 text-xs text-white/40">Age: {age} years</div>}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Height (cm)</span>
                    <input
                      type="number"
                      value={form.height_cm ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, height_cm: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Current Weight (kg)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={form.weight_kg ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, weight_kg: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                </div>
              </div>

              {/* Group 2: Goals */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-neonCyan" />
                  Goals
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Goal</span>
                    <select
                      value={form.goal ?? "Fat Loss"}
                      onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    >
                      <option value="Fat Loss">Fat Loss</option>
                      <option value="Muscle Gain">Muscle Gain</option>
                      <option value="Body Recomposition">Body Recomposition</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Endurance">Endurance</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Experience Level</span>
                    <select
                      value={form.experience ?? "Intermediate"}
                      onChange={(event) => setForm((current) => ({ ...current, experience: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Target Weight (kg)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={form.target_weight_kg ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, target_weight_kg: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Workout Days/Week</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="7"
                        value={form.workout_days_per_week ?? "5"}
                        onChange={(event) => setForm((current) => ({ ...current, workout_days_per_week: event.target.value }))}
                        className="flex-1"
                      />
                      <span className="text-white font-mono w-8 text-center">{form.workout_days_per_week ?? "5"}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Group 3: Daily Targets */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-neonCyan" />
                  Daily Targets
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Maintenance Calories</span>
                    <input
                      type="number"
                      value={form.maintenance_kcal ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, maintenance_kcal: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Target Calories</span>
                    <input
                      type="number"
                      value={form.target_kcal ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, target_kcal: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Protein Goal (g)</span>
                    <input
                      type="number"
                      value={form.protein_goal_g ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, protein_goal_g: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Carbs Goal (g)</span>
                    <input
                      type="number"
                      value={form.carbs_goal_g ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, carbs_goal_g: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Fat Goal (g)</span>
                    <input
                      type="number"
                      value={form.fat_goal_g ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, fat_goal_g: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Water Goal (ml)</span>
                    <input
                      type="number"
                      value={form.water_goal_ml ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, water_goal_ml: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-white/40">Step Goal</span>
                    <input
                      type="number"
                      value={form.step_goal ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, step_goal: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-neonPurple/50"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <NeonButton onClick={save} variant="gradient">
                  Save Changes
                </NeonButton>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Workout sessions", stats.workouts],
            ["Total volume", `${stats.volume} kg`],
            ["Longest streak", `${stats.streak} days`],
            ["Cardio hours", `${stats.cardio} h`],
            ["Days since app start", stats.daysSinceStart],
            ["Meals logged", stats.meals],
          ].map(([label, value]) => (
            <GlassCard key={String(label)}>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">{label}</div>
              <div className="mt-2 text-2xl font-bold text-white">{String(value)}</div>
            </GlassCard>
          ))}
        </div>

        {/* Danger Zone */}
        <GlassCard className="border border-rose-500/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-rose-300">
                <Trash2 className="h-4 w-4" /> Danger Zone
              </div>
              <p className="text-sm text-white/60">Type DELETE to permanently remove your account.</p>
            </div>
            <div className="flex gap-3">
              <input
                value={confirmDelete}
                onChange={(event) => setConfirmDelete(event.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                placeholder="DELETE"
              />
              <NeonButton onClick={deleteAccount} variant="purple-outline">
                Delete Account
              </NeonButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </ErrorBoundary>
  );
}