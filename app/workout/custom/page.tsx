"use client";

import React, { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import WorkoutSessionManager, { Exercise } from "@/components/workout/WorkoutSessionManager";
import { Plus, Trash2, Dumbbell, Play, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CustomExerciseInput {
  name: string;
  muscleGroup: string;
  type: "compound" | "isolation";
  sets: number;
  reps: number;
  weight: number;
}

export default function CustomWorkoutPage() {
  const [planName, setPlanName] = useState("");
  const [exercises, setExercises] = useState<CustomExerciseInput[]>([
    { name: "", muscleGroup: "", type: "isolation", sets: 3, reps: 10, weight: 0 },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [managerExercises, setManagerExercises] = useState<Exercise[]>([]);

  const breadcrumbs = [
    { label: "Workout", href: "/workout" },
    { label: "Custom Plan" }
  ];

  const handleAddExerciseRow = () => {
    setExercises((prev) => [
      ...prev,
      { name: "", muscleGroup: "", type: "isolation", sets: 3, reps: 10, weight: 0 },
    ]);
  };

  const handleRemoveExerciseRow = (index: number) => {
    if (exercises.length === 1) return;
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = <K extends keyof CustomExerciseInput>(
    index: number,
    field: K,
    value: CustomExerciseInput[K]
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const handleStartWorkout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!planName.trim()) {
      alert("Please enter a custom plan name.");
      return;
    }

    const invalidEx = exercises.some((ex) => !ex.name.trim());
    if (invalidEx) {
      alert("Please fill in the exercise name for all added exercises.");
      return;
    }

    try {
      setIsLoading(true);

      // Pre-create the workout session in database
      const response = await fetch("/api/workout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          split_name: planName.trim(),
          notes: "Started custom workout plan.",
          duration_mins: 60,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create workout session");
      }

      const sessionId = result.data.id;

      // Map dynamic custom exercises to initialSets property of WorkoutSessionManager Exercise structure
      const mappedExercises = exercises.map((ex) => {
        const initialSets = Array.from({ length: ex.sets }, (_, setIdx) => ({
          setNumber: setIdx + 1,
          weight: ex.weight,
          reps: ex.reps,
          completed: false,
          isPr: false,
        }));

        return {
          name: ex.name.trim(),
          muscleGroup: ex.muscleGroup.trim() || "Custom",
          type: ex.type,
          isCustom: true,
          initialSets,
        };
      });

      setManagerExercises(mappedExercises);
      setActiveSessionId(sessionId);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An error occurred while creating the workout session.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  // If activeSessionId is set, render the WorkoutSessionManager
  if (activeSessionId) {
    return (
      <WorkoutSessionManager
        splitName={planName.trim()}
        exercises={managerExercises}
        preCreatedSessionId={activeSessionId}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/workout"
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to splits
        </Link>
      </div>

      <PageHeader
        title="Custom Workout Plan"
        subtitle="Design your personalized workout routine and track it in real-time."
        breadcrumbs={breadcrumbs}
      />

      <GlassCard className="p-6 border-white/5 relative overflow-hidden max-w-4xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

        <form onSubmit={handleStartWorkout} className="flex flex-col gap-6">
          {/* Plan Name */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-extrabold uppercase tracking-widest text-white/60">
              Plan Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. My Heavy Pull Day"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full sm:w-1/2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-neonPurple/50"
            />
          </div>

          <div className="border-t border-white/5 my-2" />

          {/* Exercises Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-rose-400" /> Plan Exercises
            </h3>

            <div className="flex flex-col gap-4">
              {exercises.map((exercise, index) => (
                <GlassCard key={index} className="p-4 border-white/5 bg-white/[0.01] hover:border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    
                    {/* Exercise Name */}
                    <div className="flex flex-col gap-2 md:col-span-4">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Exercise Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Incline Bench Press"
                        value={exercise.name}
                        onChange={(e) => handleUpdateExercise(index, "name", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-neonPurple/50"
                      />
                    </div>

                    {/* Muscle Group */}
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Muscle Group
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chest"
                        value={exercise.muscleGroup}
                        onChange={(e) => handleUpdateExercise(index, "muscleGroup", e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-neonPurple/50"
                      />
                    </div>

                    {/* Sets */}
                    <div className="flex flex-col gap-2 md:col-span-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Sets
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={exercise.sets}
                        onChange={(e) => handleUpdateExercise(index, "sets", Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white text-center font-mono outline-none focus:border-neonPurple/50"
                      />
                    </div>

                    {/* Target Reps */}
                    <div className="flex flex-col gap-2 md:col-span-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Reps
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={exercise.reps}
                        onChange={(e) => handleUpdateExercise(index, "reps", Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white text-center font-mono outline-none focus:border-neonPurple/50"
                      />
                    </div>

                    {/* Target Weight */}
                    <div className="flex flex-col gap-2 md:col-span-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={exercise.weight}
                        onChange={(e) => handleUpdateExercise(index, "weight", Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white text-center font-mono outline-none focus:border-neonPurple/50"
                      />
                    </div>

                    {/* Remove Action */}
                    <div className="flex justify-end md:col-span-1 pb-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveExerciseRow(index)}
                        disabled={exercises.length === 1}
                        className="p-2.5 rounded-lg border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 text-red-400 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-red-500/20 disabled:hover:text-red-400 cursor-pointer animate-fadeIn"
                        title="Remove Exercise"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </GlassCard>
              ))}
            </div>

            <NeonButton
              type="button"
              variant="purple-outline"
              onClick={handleAddExerciseRow}
              className="w-full md:w-fit py-2.5 px-6 text-xs flex items-center justify-center gap-1.5 self-start border-dashed hover:border-solid mt-2"
            >
              <Plus className="w-4 h-4" /> Add Exercise
            </NeonButton>
          </div>

          <div className="border-t border-white/5 my-4" />

          {/* Submit */}
          <div className="flex justify-end">
            <NeonButton
              type="submit"
              variant="gradient"
              glow
              disabled={isLoading}
              className="w-full md:w-auto px-8 h-12 text-sm uppercase tracking-wider font-extrabold flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              {isLoading ? "Starting..." : "Start This Workout"}
            </NeonButton>
          </div>

        </form>
      </GlassCard>
    </div>
  );
}
