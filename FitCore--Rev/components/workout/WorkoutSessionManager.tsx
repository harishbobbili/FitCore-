"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NeonButton from "@/components/ui/NeonButton";
import ExerciseCard from "./ExerciseCard";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import useWorkout from "@/hooks/useWorkout";
import { 
  Play, 
  Square, 
  Timer, 
  Flame, 
  Clock, 
  Trophy, 
  AlertCircle, 
  X, 
  ArrowLeft,
  TrendingUp,
  Award,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HistoricalSet {
  id: string;
  session_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rest_seconds: number;
  is_pr: boolean;
  date: string;
}

export interface Exercise {
  name: string;
  muscleGroup: string;
  type: "compound" | "isolation";
  isCustom?: boolean;
  initialSets?: { setNumber: number; weight: number; reps: number; completed: boolean; isPr: boolean }[];
}

interface WorkoutSetInsert {
  session_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rest_seconds: number;
}

interface WorkoutSessionManagerProps {
  splitName: string;
  exercises: Exercise[];
  preCreatedSessionId?: string;
}

export default function WorkoutSessionManager({
  splitName,
  exercises: initialExercises,
  preCreatedSessionId,
}: WorkoutSessionManagerProps) {
  const router = useRouter();
  const { finishSession } = useWorkout();
  
  const activeSession = useAppStore((state) => state.activeSession);
  const setActiveSession = useAppStore((state) => state.setActiveSession);
  const setExerciseSets = useAppStore((state) => state.setExerciseSets);
  
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Exercises state (local so we can dynamically add custom exercises during session)
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);

  useEffect(() => {
    setExercises(initialExercises);
  }, [initialExercises]);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const restoredSession = useAppStore.getState().activeSession;
    if (restoredSession) {
      setIsWorkoutActive(true);
    }
  }, []);

  // Workout state
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Expandable form state for inline addition of custom exercises
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customExName, setCustomExName] = useState("");
  const [customExMuscle, setCustomExMuscle] = useState("");
  const [customExType, setCustomExType] = useState<"compound" | "isolation">("isolation");

  const handleAddCustomExercise = () => {
    if (!customExName.trim()) {
      alert("Please enter an exercise name.");
      return;
    }

    const newEx: Exercise = {
      name: customExName.trim(),
      muscleGroup: customExMuscle.trim() || "Custom",
      type: customExType,
      isCustom: true,
    };

    setExercises((prev) => [...prev, newEx]);
    setCustomExName("");
    setCustomExMuscle("");
    setCustomExType("isolation");
    setShowAddCustom(false);
  };

  // AI Suggestions states
  const [fatigueLevel, setFatigueLevel] = useState<number>(3);
  const [daysSinceRest, setDaysSinceRest] = useState<number>(2);
  const [currentWeekVolume, setCurrentWeekVolume] = useState<number>(12);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    suggestions: Record<string, {
      direction: "up" | "down" | "maintain";
      amount: number;
      weight_kg: number;
      reps: number;
      reason: string;
    }>;
    generalAdvice: string;
  } | null>(null);

  const [exerciseNotes, setExerciseNotes] = useState<{ [key: string]: string }>({});
  const [completedSets, setCompletedSets] = useState<{
    [exerciseName: string]: {
      setIndex: number;
      reps: number;
      weight: number;
      isPr: boolean;
    }[];
  }>({});

  // Rest Timer state
  const [isRestActive, setIsRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restDuration, setRestDuration] = useState(60); // default
  const [restIsPaused, setRestIsPaused] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Summary state
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    durationMins: number;
    totalSets: number;
    totalVolume: number;
    calories: number;
    prsAchieved: { exercise: string; weight: number; reps: number }[];
  } | null>(null);

  // References for timers
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesis for timer beep
  const playBeep = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("AudioContext not supported in this browser.");
        return;
      }
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      // Higher tone followed by lower tone for a nice notification effect
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime + 0.15); // A4 note
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio Context synthesis is blocked or unsupported by this browser:", e);
    }
  }, []);

  // Workout duration timer hook
  useEffect(() => {
    if (isWorkoutActive) {
      workoutTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, [isWorkoutActive]);

  // Rest timer hook
  useEffect(() => {
    if (isRestActive && !restIsPaused) {
      restTimerRef.current = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            playBeep();
            setIsRestActive(false);
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }

    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isRestActive, restIsPaused, playBeep]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, "0") : null,
      String(mins).padStart(2, "0"),
      String(secs).padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":");
  };

  // Start workout session
  const handleStartWorkout = () => {
    setIsWorkoutActive(true);
    setElapsedSeconds(0);
    setCompletedSets({});
    setExerciseNotes({});
    setIsRestActive(false);
  };

  // Fetch previous sessions data for the active routine exercises
  const fetchRoutineHistory = async () => {
    try {
      const promises = exercises.map(async (ex) => {
        const res = await fetch(`/api/workout/history?exercise=${encodeURIComponent(ex.name)}`);
        const result = await res.json();
        if (result.success && result.data && result.data.history) {
          return result.data.history as HistoricalSet[];
        }
        return [];
      });
      const results = await Promise.all(promises);
      const lastSessionSets: Array<{ exercise_name: string; set_number: number; weight_kg: number; reps: number }> = [];
      
      results.forEach((histList) => {
        if (histList.length === 0) return;
        const lastSessionId = histList[0].session_id;
        const filtered = histList.filter(s => s.session_id === lastSessionId);
        filtered.forEach(s => {
          lastSessionSets.push({
            exercise_name: s.exercise_name,
            set_number: s.set_number,
            weight_kg: s.weight_kg,
            reps: s.reps
          });
        });
      });

      return lastSessionSets;
    } catch (err) {
      console.error("Failed to load routine history:", err);
      return [];
    }
  };

  const handleGetAiSuggestions = async () => {
    setIsAiLoading(true);
    try {
      const routineHistory = await fetchRoutineHistory();
      
      const response = await fetch("/api/ai/workout-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          last_session_data: routineHistory,
          fatigue_level: fatigueLevel,
          days_since_rest: daysSinceRest,
          current_week_volume: currentWeekVolume,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load suggestions from backend");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setAiSuggestions(result.data);
      } else {
        throw new Error(result.error || "Empty suggestions payload");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Workout suggestion failed:", error);
      alert("Could not load workout suggestions: " + (error.message || "Unknown error"));
    } finally {
      setIsAiLoading(false);
    }
  };

  // Cancel workout session
  const handleCancelWorkout = () => {
    if (confirm("Are you sure you want to cancel this workout? Progress will not be saved.")) {
      setIsWorkoutActive(false);
      setIsRestActive(false);
    }
  };

  // Discard session handler
  const handleDiscardSession = async () => {
    if (!activeSession?.id) {
      setIsWorkoutActive(false);
      setIsRestActive(false);
      return;
    }

    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { error } = await supabase
        .from("workout_sessions")
        .delete()
        .eq("id", activeSession.id);

      if (error) {
        throw error;
      }

      setActiveSession(null);
      setExerciseSets([]);
      sessionStorage.removeItem("fitcore_activeSession");
      sessionStorage.removeItem("fitcore_exerciseSets");
      setIsWorkoutActive(false);
      setIsRestActive(false);
      setCompletedSets({});
      setExerciseNotes({});
      setShowDiscardConfirm(false);
      router.push("/workout");
    } catch (error) {
      console.error("Error discarding session:", error);
      alert("Failed to discard session. Please try again.");
    }
  };

  // Rest Timer adjusters
  const adjustRest = (amount: number) => {
    setRestSeconds((prev) => Math.max(0, prev + amount));
  };

  const setRestPreset = (seconds: number) => {
    setRestDuration(seconds);
    setRestSeconds(seconds);
    setIsRestActive(true);
    setRestIsPaused(false);
  };

  // Triggered when set checkbox is clicked in ExerciseCard
  const handleSetChecked = (
    exerciseName: string,
    setIndex: number,
    reps: number,
    weight: number,
    checked: boolean,
    isPr: boolean
  ) => {
    if (!isWorkoutActive) return;

    // 1. Update completed sets structure
    setCompletedSets((prev) => {
      const currentList = prev[exerciseName] ? [...prev[exerciseName]] : [];
      if (checked) {
        // Add or update
        const existingIdx = currentList.findIndex((s) => s.setIndex === setIndex);
        const setData = { setIndex, reps, weight, isPr };
        if (existingIdx >= 0) {
          currentList[existingIdx] = setData;
        } else {
          currentList.push(setData);
        }
      } else {
        // Remove
        const existingIdx = currentList.findIndex((s) => s.setIndex === setIndex);
        if (existingIdx >= 0) {
          currentList.splice(existingIdx, 1);
        }
      }
      return { ...prev, [exerciseName]: currentList };
    });

    // 2. Start rest timer automatically if checked (set completed)
    if (checked) {
      const exerciseDef = exercises.find((ex) => ex.name === exerciseName);
      const isPlank = exerciseName.toLowerCase().includes("plank");
      const defaultDuration = isPlank 
        ? 60 
        : exerciseDef?.type === "compound" 
        ? 90 
        : 60;
      
      setRestDuration(defaultDuration);
      setRestSeconds(defaultDuration);
      setIsRestActive(true);
      setRestIsPaused(false);
    }
  };

  // Update specific exercise notes
  const handleUpdateNotes = (exerciseName: string, notes: string) => {
    setExerciseNotes((prev) => ({
      ...prev,
      [exerciseName]: notes,
    }));
  };

  // Complete and save workout
  const handleFinishWorkout = async () => {
    const totalCompletedSetsCount = Object.values(completedSets).reduce(
      (sum, list) => sum + list.length,
      0
    );

    if (totalCompletedSetsCount === 0) {
      alert("Please log and check at least one exercise set before completing the workout!");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      // 1. Build session notes
      const notesArray = Object.entries(exerciseNotes)
        .filter(([, note]) => note.trim().length > 0)
        .map(([exName, note]) => `${exName}: ${note}`);
      const aggregatedNotes = notesArray.length > 0 
        ? notesArray.join(" | ") 
        : `Completed split: ${splitName}`;

      const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));

      // 2. Save Session metadata
      const sessionRes = await fetch("/api/workout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: preCreatedSessionId,
          split_name: splitName,
          duration_mins: durationMins,
          notes: aggregatedNotes,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      const sessionResult = await sessionRes.json();
      if (!sessionResult.success) {
        throw new Error(sessionResult.error || "Failed to save workout session metadata");
      }

      const sessionId = sessionResult.data.id;

      // 3. Build sets list to batch save
      const setsToInsert: WorkoutSetInsert[] = [];
      const prsAchieved: { exercise: string; weight: number; reps: number }[] = [];

      Object.entries(completedSets).forEach(([exerciseName, setsList]) => {
        setsList.forEach((set) => {
          setsToInsert.push({
            session_id: sessionId,
            exercise_name: exerciseName,
            set_number: set.setIndex + 1,
            reps: set.reps,
            weight_kg: set.weight,
            rest_seconds: exerciseName.toLowerCase().includes("plank") || exerciseName.toLowerCase().includes("pull-up") ? 60 : 90,
          });

          if (set.isPr) {
            prsAchieved.push({
              exercise: exerciseName,
              weight: set.weight,
              reps: set.reps,
            });
          }
        });
      });

      // 4. Save sets
      const setsRes = await fetch("/api/workout/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setsToInsert),
      });

      const setsResult = await setsRes.json();
      if (!setsResult.success) {
        throw new Error(setsResult.error || "Failed to save exercise sets details");
      }

      // 5. Calculate statistics for summary modal
      let totalVolume = 0;
      Object.entries(completedSets).forEach(([exName, setsList]) => {
        const isBW = exName.toLowerCase().includes("pull-up") || exName.toLowerCase().includes("plank") || exName.toLowerCase().includes("push-up");
        setsList.forEach((s) => {
          if (!isBW) {
            totalVolume += s.weight * s.reps;
          }
        });
      });

      const caloriesBurned = durationMins * 5; // ~5 kcal/min estimation

      // 6. Call useWorkout finishSession to handle streak, achievements, and calories_burned
      await finishSession(aggregatedNotes);

      // Set summary view
      setSummaryData({
        durationMins,
        totalSets: totalCompletedSetsCount,
        totalVolume,
        calories: caloriesBurned,
        prsAchieved,
      });
      setShowSummary(true);
      setIsWorkoutActive(false);
      setIsRestActive(false);
      setCompletedSets({});
    } catch (e: unknown) {
      console.error("Finish workout error:", e);
      const errMsg = e instanceof Error ? e.message : "An unexpected error occurred while saving your session.";
      setSaveError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const activeProgressPct = restSeconds / restDuration;

  return (
    <div className="flex flex-col gap-6 relative min-h-[70vh]">
      {/* HEADER BAR */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
        <Link 
          href="/workout"
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to splits
        </Link>
      </div>

      {/* TOP HERO ROUTINE INFO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-neonPurple/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div>
          <span className="text-[10px] font-extrabold text-neonPurple bg-neonPurple/10 px-3 py-1 rounded-full uppercase tracking-wider">
            Active training routine
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
            {splitName}
          </h1>
          <p className="text-sm text-white/40 mt-1 max-w-xl">
            Focus on clean contractions, progressive overload, and keeping rest periods optimized. 
            Aim for the target reps on each set.
          </p>
        </div>

        {/* Start / Control Buttons */}
        {!isWorkoutActive ? (
          <NeonButton 
            variant="gradient" 
            glow
            onClick={handleStartWorkout}
            className="w-full md:w-auto h-12 text-sm px-8"
          >
            <Play className="w-4 h-4 fill-white" /> Start Workout Session
          </NeonButton>
        ) : (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <NeonButton
              variant="purple-outline"
              onClick={handleCancelWorkout}
              className="flex-1 md:flex-initial h-11 text-xs border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-white/80"
            >
              <Square className="w-3.5 h-3.5 fill-white/80" /> Cancel
            </NeonButton>

            {isWorkoutActive && (
              <NeonButton
                variant="ghost"
                onClick={() => setShowDiscardConfirm(true)}
                className="flex-1 md:flex-initial h-11 text-xs border border-white/10 hover:border-rose-500/30 hover:bg-rose-500/10 text-white/60 hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" /> Discard
              </NeonButton>
            )}

            <NeonButton
              variant="gradient"
              glow
              onClick={handleFinishWorkout}
              disabled={isSaving}
              className="flex-1 md:flex-initial h-11 text-xs px-6"
            >
              {isSaving ? "Saving..." : "Finish Workout"}
            </NeonButton>
          </div>
        )}
      </div>

      {/* WORKOUT ACTIVE FLOATING BANNER */}
      {isWorkoutActive && (
        <div className="sticky top-[72px] z-30 bg-[#0A0A0F]/80 backdrop-blur-md border-y border-white/10 py-3 px-4 flex justify-between items-center rounded-xl shadow-glass">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-white/80 tracking-wide uppercase">
              Workout in Progress
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 font-mono text-base font-black text-neonCyan">
              <Clock className="w-4 h-4 text-neonCyan/70 animate-pulse" />
              {formatTime(elapsedSeconds)}
            </div>
            
            <NeonButton
              variant="gradient"
              onClick={handleFinishWorkout}
              disabled={isSaving}
              className="h-8 py-0 px-4 text-[10px] uppercase font-bold"
            >
              Finish
            </NeonButton>
          </div>
        </div>
      )}

      {/* ERROR MESSAGE IF SAVING FAILS */}
      {saveError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <div>
            <span className="font-bold block">Save Error</span>
            {saveError}
          </div>
        </div>
      )}

      {/* AI SUGGESTION CONTROL PANEL */}
      {!isWorkoutActive && (
        <GlassCard className="border-white/5 p-6 flex flex-col gap-4 relative overflow-hidden" hoverable>
          <div className="absolute top-0 right-0 w-64 h-64 bg-neonPurple/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neonPurple" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">AI Workout Recommender</h2>
          </div>
          <p className="text-xs text-white/50 max-w-2xl">
            Input your current recovery state to generate progressive overload or deload recommendations for today&apos;s exercises.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            {/* Fatigue level selector */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Fatigue Level</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFatigueLevel(lvl)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg border text-xs font-bold font-mono transition-all",
                      fatigueLevel === lvl
                        ? "bg-neonPurple/20 border-neonPurple/50 text-neonPurple shadow-[0_0_10px_rgba(108,99,255,0.2)]"
                        : "bg-white/[0.01] border-white/5 text-white/40 hover:border-white/20 hover:text-white/70"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-white/30 italic">
                {fatigueLevel === 1 && "Extremely Fresh & Energetic"}
                {fatigueLevel === 2 && "Good Recovery & Ready to Push"}
                {fatigueLevel === 3 && "Average Recovery / Baseline"}
                {fatigueLevel === 4 && "Mild Soreness / Elevated Fatigue"}
                {fatigueLevel === 5 && "Exhausted / High Soreness (Deload)"}
              </span>
            </div>

            {/* Days since last rest */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Days Since Rest</span>
              <input
                type="number"
                min="0"
                value={daysSinceRest}
                onChange={(e) => setDaysSinceRest(Math.max(0, parseInt(e.target.value) || 0))}
                className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-neonPurple/50"
              />
            </div>

            {/* Current week volume */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Weekly Volume (Sets)</span>
              <input
                type="number"
                min="0"
                value={currentWeekVolume}
                onChange={(e) => setCurrentWeekVolume(Math.max(0, parseInt(e.target.value) || 0))}
                className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-neonPurple/50"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-2 pt-2 border-t border-white/5 items-center justify-between">
            <span className="text-[10px] text-white/40 font-mono">
              *Fetches last logged set data for exercises in this split
            </span>
            <NeonButton
              variant="purple-outline"
              onClick={handleGetAiSuggestions}
              disabled={isAiLoading}
              className="w-full sm:w-auto px-6 py-2 text-xs relative overflow-hidden"
            >
              {isAiLoading ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-neonPurple/20 border-t-neonPurple animate-spin mr-2" />
                  Generating Strategy...
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_1.5s_infinite]" />
                </>
              ) : (
                "Get AI Workout Strategy"
              )}
            </NeonButton>
          </div>

          {/* Display General Advice & Highlights if suggestions are fetched */}
          {aiSuggestions && (
            <div className="mt-4 p-4 rounded-xl border border-neonPurple/20 bg-neonPurple/5 flex flex-col gap-2 animate-fadeIn">
              <span className="text-[10px] text-neonPurple font-bold uppercase tracking-widest">
                AI Coach Strategy:
              </span>
              <p className="text-xs text-white/80 leading-relaxed font-medium">
                {aiSuggestions.generalAdvice}
              </p>
              
              {/* Highlight overrides count */}
              <div className="text-[10px] text-white/40 font-semibold font-mono flex items-center gap-1.5 mt-1">
                <span>Recommendations ready for:</span>
                <span className="text-neonCyan font-bold">
                  {Object.keys(aiSuggestions.suggestions).length} exercises
                </span>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* EXERCISES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {exercises.map((exercise, idx) => (
          <div key={idx} className={!isWorkoutActive ? "opacity-50 pointer-events-none" : ""}>
            <ExerciseCard
              exerciseName={exercise.name}
              muscleGroup={exercise.muscleGroup}
              isActive={isWorkoutActive}
              aiSuggestion={aiSuggestions?.suggestions[exercise.name] || null}
              onSetChecked={(setIndex, reps, weight, checked, isPr) =>
                handleSetChecked(exercise.name, setIndex, reps, weight, checked, isPr)
              }
              onUpdateNotes={(notes) => handleUpdateNotes(exercise.name, notes)}
              isCustom={exercise.isCustom}
              initialSets={exercise.initialSets}
            />
          </div>
        ))}
      </div>

      {/* ADD CUSTOM EXERCISE BUTTON & INLINE FORM */}
      {isWorkoutActive && (
        <div className="mt-4 pb-24 max-w-lg">
          {!showAddCustom ? (
            <NeonButton
              variant="purple-outline"
              className="w-full py-3 text-xs"
              onClick={() => setShowAddCustom(true)}
            >
              + Add Custom Exercise
            </NeonButton>
          ) : (
            <GlassCard className="p-5 border border-white/10 bg-[#0A0A0F]/60">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Add Custom Exercise</h4>
                <button className="text-white/40 hover:text-white transition-colors" onClick={() => setShowAddCustom(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Exercise Name *</span>
                    <input
                      type="text"
                      value={customExName}
                      onChange={(e) => setCustomExName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-neonPurple"
                      placeholder="e.g. Incline DB Flye"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Muscle Group</span>
                    <input
                      type="text"
                      value={customExMuscle}
                      onChange={(e) => setCustomExMuscle(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-neonPurple"
                      placeholder="e.g. Chest (default Custom)"
                    />
                  </label>
                </div>
                <div>
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Exercise Type</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80">
                      <input
                        type="radio"
                        name="exType"
                        checked={customExType === "isolation"}
                        onChange={() => setCustomExType("isolation")}
                        className="accent-neonPurple"
                      />
                      Isolation
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80">
                      <input
                        type="radio"
                        name="exType"
                        checked={customExType === "compound"}
                        onChange={() => setCustomExType("compound")}
                        className="accent-neonPurple"
                      />
                      Compound
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <NeonButton variant="ghost" className="px-4 py-2 text-xs" onClick={() => setShowAddCustom(false)}>
                    Cancel
                  </NeonButton>
                  <NeonButton variant="gradient" className="px-6 py-2 text-xs" onClick={handleAddCustomExercise}>
                    Add to This Session
                  </NeonButton>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* REST TIMER FLOATING WIDGET */}
      <AnimatePresence>
        {isWorkoutActive && isRestActive && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-72 glass-panel border border-neonPurple/30 rounded-2xl shadow-[0_12px_40px_-10px_rgba(108,99,255,0.3)] bg-brandCard/95 p-4 flex flex-col gap-3"
          >
            {/* Timer Header */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase text-white/50 tracking-wider flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-neonPurple" /> Rest Timer
              </span>
              <button
                onClick={() => setIsRestActive(false)}
                className="text-white/30 hover:text-white/70 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timer Main display */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-white/5"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-neonPurple"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 28}
                    animate={{ strokeDashoffset: (2 * Math.PI * 28) * (1 - activeProgressPct) }}
                    transition={{ ease: "linear", duration: 1 }}
                  />
                </svg>
                {/* Time countdown text */}
                <span className="absolute text-base font-black font-mono text-white">
                  {restSeconds}s
                </span>
              </div>

              {/* Incremental Adjusters */}
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => adjustRest(-15)}
                    className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold transition-colors cursor-pointer text-white/80"
                  >
                    -15s
                  </button>
                  <button
                    onClick={() => adjustRest(15)}
                    className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold transition-colors cursor-pointer text-white/80"
                  >
                    +15s
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setRestIsPaused(!restIsPaused)}
                    className="flex-1 py-1 rounded bg-neonPurple/20 border border-neonPurple/30 hover:bg-neonPurple/30 text-[9px] font-extrabold uppercase transition-colors cursor-pointer text-neonPurple"
                  >
                    {restIsPaused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={() => setRestSeconds(restDuration)}
                    className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-extrabold uppercase transition-colors cursor-pointer text-white/60"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="flex justify-between items-center gap-1.5 pt-1.5 border-t border-white/5">
              <button
                onClick={() => setRestPreset(30)}
                className="flex-1 py-0.5 rounded border border-white/5 hover:border-white/10 text-[9px] text-white/40 font-semibold cursor-pointer"
              >
                30s
              </button>
              <button
                onClick={() => setRestPreset(60)}
                className="flex-1 py-0.5 rounded border border-white/5 hover:border-white/10 text-[9px] text-white/40 font-semibold cursor-pointer"
              >
                60s
              </button>
              <button
                onClick={() => setRestPreset(90)}
                className="flex-1 py-0.5 rounded border border-white/5 hover:border-white/10 text-[9px] text-white/40 font-semibold cursor-pointer"
              >
                90s
              </button>
              <button
                onClick={() => setRestPreset(120)}
                className="flex-1 py-0.5 rounded border border-white/5 hover:border-white/10 text-[9px] text-white/40 font-semibold cursor-pointer"
              >
                120s
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUMMARY MODAL */}
      <AnimatePresence>
        {showSummary && summaryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSummary(false);
                router.push("/workout");
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Content box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-brandCard border border-white/10 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-6 sm:p-8 max-w-lg w-full relative z-10 overflow-hidden"
            >
              {/* Top Neon Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-neon-grad" />

              {/* Trophy & Title */}
              <div className="flex flex-col items-center text-center gap-3 mt-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-neonPurple/10 border border-neonPurple/20 flex items-center justify-center text-neonPurple shadow-neon-purple/20">
                  <Award className="w-8 h-8 text-neonPurple" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Workout Completed!
                </h2>
                <p className="text-xs text-white/40 font-medium">
                  Splits like a champ! Session stored in Database. Streak incremented!
                </p>
              </div>

              {/* Grid of stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neonCyan" /> Duration
                  </span>
                  <span className="text-lg font-black text-white font-mono">
                    {summaryData.durationMins} mins
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-neonPurple" /> Total Sets
                  </span>
                  <span className="text-lg font-black text-white font-mono">
                    {summaryData.totalSets} completed
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total Volume
                  </span>
                  <span className="text-lg font-black text-white font-mono">
                    {summaryData.totalVolume.toLocaleString()} kg
                  </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" /> Est. Burned
                  </span>
                  <span className="text-lg font-black text-white font-mono">
                    {summaryData.calories} kcal
                  </span>
                </div>
              </div>

              {/* PRs Section */}
              {summaryData.prsAchieved.length > 0 && (
                <div className="bg-amber-400/[0.03] border border-amber-400/20 rounded-xl p-4 mb-6">
                  <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 
                    {summaryData.prsAchieved.length} Personal Record{summaryData.prsAchieved.length > 1 ? "s" : ""} achieved!
                  </span>
                  <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                    {summaryData.prsAchieved.map((pr, i) => {
                      const isBW = pr.exercise.toLowerCase().includes("pull-up") || pr.exercise.toLowerCase().includes("plank") || pr.exercise.toLowerCase().includes("push-up");
                      return (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="text-white/80 font-semibold">{pr.exercise}</span>
                          <span className="text-amber-400 font-bold font-mono">
                            {isBW ? `${pr.reps} reps` : `${pr.weight}kg × ${pr.reps}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Finish Action */}
              <NeonButton
                variant="gradient"
                glow
                onClick={() => {
                  setShowSummary(false);
                  router.push("/workout");
                }}
                className="w-full h-11 text-xs uppercase font-extrabold"
              >
                Awesome! Continue
              </NeonButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISCARD CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDiscardConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiscardConfirm(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-brandCard border border-white/10 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-6 sm:p-8 max-w-sm w-full relative z-10 overflow-hidden"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">Discard Session?</h2>
                <p className="text-xs text-white/60">
                  This will permanently delete the current workout session from the database. This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full mt-2">
                  <NeonButton
                    variant="ghost"
                    onClick={() => setShowDiscardConfirm(false)}
                    className="flex-1 h-10 text-xs border border-white/10"
                  >
                    Cancel
                  </NeonButton>
                  <NeonButton
                    variant="gradient"
                    onClick={handleDiscardSession}
                    className="flex-1 h-10 text-xs bg-rose-500 hover:bg-rose-600"
                  >
                    Discard
                  </NeonButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
