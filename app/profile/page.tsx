"use client";

import React from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useProfile } from "@/hooks/useProfile";
import { Award, ShieldAlert, User } from "lucide-react";

export default function ProfilePage() {
  const { profile, loading } = useProfile();
  const breadcrumbs = [{ label: "Profile" }];

  if (loading || !profile) {
    return <SkeletonCard className="h-[360px] w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="User Profile" subtitle="Your current body stats and targets come directly from Supabase." breadcrumbs={breadcrumbs} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="md:col-span-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-neonPurple" />
            Profile Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-white/40 block">Goal</span>
              <span className="text-sm font-semibold text-white mt-1 block">{profile.goal ?? "fat_loss"}</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-white/40 block">Experience</span>
              <span className="text-sm font-semibold text-white mt-1 block">{profile.experience ?? "intermediate"}</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-white/40 block">Height</span>
              <span className="text-sm font-semibold text-white mt-1 block">{profile.height_cm ?? 162.5} cm</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-white/40 block">Weight</span>
              <span className="text-sm font-semibold text-white mt-1 block">{profile.weight_kg ?? 63} kg</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-white/40 block">Weekly Training Frequency</span>
              <span className="text-sm font-semibold text-white mt-1 block">{profile.workout_days_per_week ?? 5} days / week</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-white/40 block">Maintenance / Target</span>
              <span className="text-sm font-semibold text-white mt-1 block">{profile.maintenance_kcal ?? 2200} / {profile.target_kcal ?? 1800} kcal</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link href="/dashboard/settings">
              <NeonButton variant="gradient">Edit Profile</NeonButton>
            </Link>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-neonCyan" />
              FitCore Status
            </h2>
            <div className="p-4 rounded-xl bg-neonCyan/5 border border-neonCyan/15 flex flex-col gap-2">
              <span className="text-xs text-neonCyan font-bold uppercase tracking-wider">Plan</span>
              <span className="text-lg font-black text-white">{profile.goal ?? "fat_loss"}</span>
              <p className="text-xs text-white/50 leading-relaxed mt-2">
                Your macro targets, water target, and step goal are read from the profile row and can be updated from settings.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-xs text-white/30 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-neonPurple" />
            <span>Profile settings flow through dashboard, diet, and analytics.</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
