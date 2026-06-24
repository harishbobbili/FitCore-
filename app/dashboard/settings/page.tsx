"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useProfile } from "@/hooks/useProfile";

export default function SettingsPage() {
  const { profile, loading, updateProfile } = useProfile();
  const [form, setForm] = useState({
    name: "",
    height_cm: "",
    weight_kg: "",
    goal: "fat_loss",
    experience: "intermediate",
    maintenance_kcal: "",
    target_kcal: "",
    protein_goal_g: "",
    carbs_goal_g: "",
    fat_goal_g: "",
    water_goal_ml: "",
    step_goal: "",
    workout_days_per_week: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? "",
      height_cm: String(profile.height_cm ?? ""),
      weight_kg: String(profile.weight_kg ?? ""),
      goal: profile.goal ?? "fat_loss",
      experience: profile.experience ?? "intermediate",
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

  const breadcrumbs = [{ label: "Dashboard" }, { label: "Settings" }];

  if (loading || !profile) {
    return <SkeletonCard className="h-[420px] w-full" />;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await updateProfile({
      name: form.name || null,
      height_cm: form.height_cm ? Number(form.height_cm) : profile.height_cm,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : profile.weight_kg,
      goal: form.goal,
      experience: form.experience,
      maintenance_kcal: form.maintenance_kcal ? Number(form.maintenance_kcal) : profile.maintenance_kcal,
      target_kcal: form.target_kcal ? Number(form.target_kcal) : profile.target_kcal,
      protein_goal_g: form.protein_goal_g ? Number(form.protein_goal_g) : profile.protein_goal_g,
      carbs_goal_g: form.carbs_goal_g ? Number(form.carbs_goal_g) : profile.carbs_goal_g,
      fat_goal_g: form.fat_goal_g ? Number(form.fat_goal_g) : profile.fat_goal_g,
      water_goal_ml: form.water_goal_ml ? Number(form.water_goal_ml) : profile.water_goal_ml,
      step_goal: form.step_goal ? Number(form.step_goal) : profile.step_goal,
      workout_days_per_week: form.workout_days_per_week ? Number(form.workout_days_per_week) : profile.workout_days_per_week,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile Settings" subtitle="Edit the target values that power the rest of the app." breadcrumbs={breadcrumbs} />

      <GlassCard className="p-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["name", "Name"],
            ["height_cm", "Height (cm)"],
            ["weight_kg", "Weight (kg)"],
            ["maintenance_kcal", "Maintenance kcal"],
            ["target_kcal", "Target kcal"],
            ["protein_goal_g", "Protein goal (g)"],
            ["carbs_goal_g", "Carbs goal (g)"],
            ["fat_goal_g", "Fat goal (g)"],
            ["water_goal_ml", "Water goal (ml)"],
            ["step_goal", "Step goal"],
            ["workout_days_per_week", "Workout days / week"],
          ].map(([key, label]) => (
            <label key={key} className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wider text-white/40">{label}</span>
              <input
                value={(form as Record<string, string>)[key]}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none"
              />
            </label>
          ))}

          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-xs uppercase tracking-wider text-white/40">Goal</span>
            <select value={form.goal} onChange={(event) => setForm((prev) => ({ ...prev, goal: event.target.value }))} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none">
              <option value="fat_loss">fat_loss</option>
              <option value="muscle_gain">muscle_gain</option>
              <option value="recomp">recomp</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-xs uppercase tracking-wider text-white/40">Experience</span>
            <select value={form.experience} onChange={(event) => setForm((prev) => ({ ...prev, experience: event.target.value }))} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none">
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </label>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <NeonButton type="submit" variant="gradient">Save Changes</NeonButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
