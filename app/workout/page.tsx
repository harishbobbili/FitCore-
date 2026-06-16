"use client";

import React from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { Dumbbell, Play, Flame, Trophy, TrendingUp, Sparkles, Award, Plus } from "lucide-react";
import { EXERCISE_LIST } from "@/lib/constants";
import { useStreak } from "@/hooks/useStreak";
import { useProfile } from "@/hooks/useProfile";

interface SplitRoutine {
  name: string;
  slug: keyof typeof EXERCISE_LIST;
  focus: string;
  description: string;
  color: "cyan" | "purple" | "rose" | "amber";
}

const splits: SplitRoutine[] = [
  { name: "Chest + Triceps Split", slug: "chest-triceps", focus: "Horizontal / Incline Pressing & Lockout", description: "Build thickness and upper-chest shelf. Complete with direct triceps isolation.", color: "cyan" },
  { name: "Back + Biceps Split", slug: "back-biceps", focus: "Vertical / Horizontal Pulling & Arm Width", description: "Develop lat width and mid-back density. Focuses on strict pull-up progression.", color: "purple" },
  { name: "Shoulders + Abs Split", slug: "shoulders-abs", focus: "Overhead Strength, Lateral Width & Core Density", description: "Create width and roundness in lateral delts, combined with deep core stability and planks.", color: "rose" },
  { name: "Leg Day Split", slug: "legs", focus: "Quad Hypertrophy & Posterior Chain Power", description: "Focus on clean knee extension volume, lunging depth, and direct calf loading.", color: "amber" },
];

export default function WorkoutPage() {
  const { streak } = useStreak();
  const { profile } = useProfile();
  const breadcrumbs = [{ label: "Workout" }];

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
        <PageHeader title="Workout Split Routines" subtitle="Your weekly training volume is aligned to your live profile settings." breadcrumbs={breadcrumbs} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-5 flex items-center justify-between border-white/5 relative overflow-hidden" hoverable>
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">Active Streak</span>
            <span className="text-2xl font-black text-white mt-1.5 font-mono">{streak?.current_streak ?? 0} Days</span>
            <span className="text-[11px] text-white/40 font-medium">Keep checking off your workout splits</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <Flame className="w-6 h-6 fill-rose-500" />
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between border-white/5 relative overflow-hidden" hoverable>
          <div className="absolute top-0 right-0 w-32 h-32 bg-neonCyan/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-neonCyan bg-neonCyan/10 px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">Target Split Rate</span>
            <span className="text-2xl font-black text-white mt-1.5 font-mono">{profile?.workout_days_per_week ?? 5}-6 Days / Wk</span>
            <span className="text-[11px] text-white/40 font-medium">Rest days scheduled dynamically</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neonCyan/10 flex items-center justify-center text-neonCyan shadow-[0_0_15px_rgba(0,212,255,0.1)]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center justify-between border-white/5 relative overflow-hidden" hoverable>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C63FF]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-neonPurple bg-neonPurple/10 px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">Weekly Goal</span>
            <span className="text-2xl font-black text-white mt-1.5 font-mono">Overload Focus</span>
            <span className="text-[11px] text-white/40 font-medium">Beat your previous weight or reps</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neonPurple/10 flex items-center justify-center text-neonPurple shadow-[0_0_15px_rgba(108,99,255,0.1)]">
            <Trophy className="w-6 h-6" />
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-2"><Dumbbell className="w-5 h-5 text-neonCyan" /> Training Splits</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {splits.map((split, idx) => {
              const borderColors = {
                cyan: "hover:border-neonCyan/30 focus:border-neonCyan/30",
                purple: "hover:border-neonPurple/30 focus:border-neonPurple/30",
                rose: "hover:border-rose-500/30 focus:border-rose-500/30",
                amber: "hover:border-amber-500/30 focus:border-amber-500/30",
              };

              const badgeColors = {
                cyan: "text-neonCyan bg-neonCyan/10 border-neonCyan/20",
                purple: "text-neonPurple bg-neonPurple/10 border-neonPurple/20",
                rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
                amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              };

              const glowStyles = {
                cyan: "hover:shadow-[0_0_20px_rgba(0,212,255,0.08)]",
                purple: "hover:shadow-[0_0_20px_rgba(108,99,255,0.08)]",
                rose: "hover:shadow-[0_0_20px_rgba(244,63,94,0.08)]",
                amber: "hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]",
              };

              return (
                <GlassCard key={idx} className={`p-5 flex flex-col justify-between border-white/5 transition-all duration-300 ${borderColors[split.color]} ${glowStyles[split.color]}`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-base font-bold text-white tracking-wide">{split.name}</h3>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${badgeColors[split.color]}`}>{EXERCISE_LIST[split.slug].length} Exercises</span>
                    </div>

                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-1 block">Focus: {split.focus}</span>

                    <p className="text-xs text-white/40 mt-3 leading-relaxed">{split.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-white/30 font-medium">Progressive Overload Tracking</span>
                    <Link href={`/workout/${split.slug}`}>
                      <NeonButton variant={split.color === "cyan" ? "cyan-outline" : split.color === "purple" ? "purple-outline" : "ghost"} glow={false} className="py-1 px-4 text-xs h-8 border-white/10">
                        <Play className="w-3 h-3 fill-white" /> Start
                      </NeonButton>
                    </Link>
                  </div>
                </GlassCard>
              );
            })}

            <GlassCard className="p-5 flex flex-col justify-between border-white/5 transition-all duration-300 hover:border-rose-500/30 focus:border-rose-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.08)]">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-base font-bold text-white tracking-wide">Custom Plan</h3>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 text-rose-400 bg-rose-500/10 border-rose-500/20">Customized</span>
                </div>

                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-1 block">Focus: Personalized Routine</span>

                <p className="text-xs text-white/40 mt-3 leading-relaxed">Build a completely personalized workout plan with customized exercises and targeted rep/set structures.</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-white/30 font-medium">Fully customizable tracker</span>
                <Link href="/workout/custom">
                  <NeonButton variant="ghost" glow={false} className="py-1 px-4 text-xs h-8 border-white/10 text-rose-400 hover:text-white">
                    <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Start</span>
                  </NeonButton>
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-2"><Sparkles className="w-5 h-5 text-neonPurple" /> Hypertrophy Science</h2>

          <GlassCard className="p-5 border-white/5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-400" /> Abdominal Hypertrophy</h3>
            <p className="text-xs text-white/50 leading-relaxed">For visible abs, fat loss is critical. However, hypertrophying the rectus abdominis increases the size and depth of the muscle blocks. This makes them pop and remain visible even at slightly higher body fat percentages.</p>
            <div className="flex flex-col gap-3.5 mt-2">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-xs font-bold text-white/80">Spinal Flexion (Rectus Abdominis)</span>
                <span className="text-[10px] text-white/40">Crunches / Cable Crunches: load with slow eccentric phase.</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-xs font-bold text-white/80">Posterior Pelvic Tilt (Lower Abs)</span>
                <span className="text-[10px] text-white/40">Hanging Leg Raises: control swing, tilt the pelvis up.</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-xs font-bold text-white/80">Anti-Extension (Deep Core Stability)</span>
                <span className="text-[10px] text-white/40">Plank / Ab Rollout: contract glutes and focus on isometric time.</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
