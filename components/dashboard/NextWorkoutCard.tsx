"use client";

import React, { useMemo } from "react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { Dumbbell, Clock, Calendar, Play, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface NextWorkoutCardProps {
  workoutDaysPerWeek: number;
  lastWorkoutDate?: string | null;
  hasActiveSession: boolean;
}

export default function NextWorkoutCard({
  workoutDaysPerWeek,
  lastWorkoutDate,
  hasActiveSession,
}: NextWorkoutCardProps) {
  const router = useRouter();

  const todaySplit = useMemo(() => {
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Rotation schedule:
    // Mon/Thu = Chest & Triceps
    // Tue/Fri = Back & Biceps
    // Wed/Sat = Shoulders & Abs
    // Sun = Rest & Recovery
    
    if (dayOfWeek === 0) return { name: "Rest & Recovery", split: "rest", icon: "🛋️" };
    if (dayOfWeek === 1 || dayOfWeek === 4) return { name: "Chest & Triceps", split: "chest-triceps", icon: "💪" };
    if (dayOfWeek === 2 || dayOfWeek === 5) return { name: "Back & Biceps", split: "back-biceps", icon: "🏋️" };
    if (dayOfWeek === 3 || dayOfWeek === 6) return { name: "Shoulders & Abs", split: "shoulders-abs", icon: "🎯" };
    
    return { name: "Rest & Recovery", split: "rest", icon: "🛋️" };
  }, []);

  const lastWorkoutText = useMemo(() => {
    if (!lastWorkoutDate) return "No workouts logged yet";
    
    const lastDate = new Date(lastWorkoutDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Last workout: Today";
    if (diffDays === 1) return "Last workout: Yesterday";
    if (diffDays < 7) return `Last workout: ${diffDays} days ago`;
    return `Last workout: ${lastDate.toLocaleDateString()}`;
  }, [lastWorkoutDate]);

  const handleStartWorkout = () => {
    if (hasActiveSession) {
      router.push("/workout");
    } else if (todaySplit.split !== "rest") {
      router.push(`/workout?split=${todaySplit.split}`);
    }
  };

  const isRestDay = todaySplit.split === "rest";

  return (
    <GlassCard className="p-5" hoverable>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-neonPurple" />
          Today's Workout
        </h3>
        <div className="text-2xl">{todaySplit.icon}</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-white">{todaySplit.name}</div>
            <div className="text-xs text-white/50 flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {new Date().toLocaleDateString("en-US", { weekday: "long" })}
            </div>
          </div>
          {!isRestDay && (
            <div className="text-right">
              <div className="text-xs text-white/40 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastWorkoutText}
              </div>
            </div>
          )}
        </div>

        {isRestDay ? (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-white/60 text-sm">Rest day! Focus on recovery and nutrition.</div>
          </div>
        ) : (
          <NeonButton
            variant="gradient"
            className="w-full"
            onClick={handleStartWorkout}
          >
            {hasActiveSession ? (
              <>
                <Play className="w-4 h-4" />
                Resume Session
              </>
            ) : (
              <>
                <Dumbbell className="w-4 h-4" />
                Start Workout
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </NeonButton>
        )}

        <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/5">
          <span>Workout days/week: {workoutDaysPerWeek}</span>
          <span className="text-neonCyan">Schedule: {workoutDaysPerWeek >= 5 ? "5-Day Split" : workoutDaysPerWeek >= 3 ? "3-Day Split" : "Custom"}</span>
        </div>
      </div>
    </GlassCard>
  );
}
