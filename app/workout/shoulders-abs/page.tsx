"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import ExerciseCard from "@/components/workout/ExerciseCard";
import WorkoutSessionManager from "@/components/workout/WorkoutSessionManager";
import { EXERCISE_LIST } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import { useWorkout } from "@/hooks/useWorkout";

export default function ShouldersAbsPage() {
  const activeSession = useAppStore((state) => state.activeSession);
  const { startSession } = useWorkout();
  const [isStarting, setIsStarting] = useState(false);
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [completedSets, setCompletedSets] = useState<Record<string, { setIndex: number; reps: number; weight: number; isPr: boolean }[]>>({});

  const exercises = EXERCISE_LIST["shoulders-abs"];
  const splitName = "Shoulders + Abs Split";

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      await startSession(splitName);
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSetChecked = (exerciseName: string, setIndex: number, reps: number, weight: number, checked: boolean, isPr: boolean) => {
    setCompletedSets((prev) => {
      const currentList = prev[exerciseName] ? [...prev[exerciseName]] : [];
      if (checked) {
        const existingIdx = currentList.findIndex((s) => s.setIndex === setIndex);
        const setData = { setIndex, reps, weight, isPr };
        if (existingIdx >= 0) {
          currentList[existingIdx] = setData;
        } else {
          currentList.push(setData);
        }
      } else {
        const existingIdx = currentList.findIndex((s) => s.setIndex === setIndex);
        if (existingIdx >= 0) {
          currentList.splice(existingIdx, 1);
        }
      }
      return { ...prev, [exerciseName]: currentList };
    });
  };

  const handleUpdateNotes = (exerciseName: string, notes: string) => {
    setExerciseNotes((prev) => ({
      ...prev,
      [exerciseName]: notes,
    }));
  };

  // If session is active, show WorkoutSessionManager
  if (activeSession) {
    return <WorkoutSessionManager splitName={splitName} exercises={exercises} />;
  }

  const breadcrumbs = [
    { label: "Workout", href: "/workout" },
    { label: "Shoulders + Abs" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Shoulders + Abs"
        subtitle="Upper body and core session targeting shoulders, rear delts, and abs for definition."
        breadcrumbs={breadcrumbs}
      />

      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
        <Link
          href="/workout"
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to splits
        </Link>
      </div>

      <GlassCard className="py-4 px-6 flex items-center justify-between border-neonPurple/20 bg-brandCard/40">
        <div>
          <h2 className="text-sm font-bold text-white">Ready to train?</h2>
          <p className="text-xs text-white/40 mt-0.5">Start your Shoulders + Abs session</p>
        </div>
        <NeonButton
          variant="gradient"
          glow
          onClick={handleStartSession}
          disabled={isStarting}
          className="h-10 px-6 text-sm"
        >
          <Play className="w-4 h-4 fill-white mr-2" />
          {isStarting ? "Starting..." : "Start Session"}
        </NeonButton>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {exercises.map((exercise, idx) => (
          <ExerciseCard
            key={idx}
            exerciseName={exercise.name}
            muscleGroup={exercise.muscleGroup}
            isActive={false}
            onSetChecked={(setIndex, reps, weight, checked, isPr) =>
              handleSetChecked(exercise.name, setIndex, reps, weight, checked, isPr)
            }
            onUpdateNotes={(notes) => handleUpdateNotes(exercise.name, notes)}
          />
        ))}
      </div>
    </div>
  );
}
