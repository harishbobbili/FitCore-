import { useMemo } from "react";
import { useWorkout } from "@/hooks/useWorkout";

export const useWorkoutSession = () => {
  const { activeSession, startSession, finishSession, exerciseSets } = useWorkout();

  // Memoize expensive Set calculation to prevent recalculation on every render
  const totalExercises = useMemo(() => {
    return exerciseSets.length > 0 ? new Set(exerciseSets.map((set) => set.exercise_name)).size : 0;
  }, [exerciseSets]);

  const completedSets = exerciseSets.length;
  const totalSets = exerciseSets.length;

  // Memoize progress percentage calculation
  const progressPercentage = useMemo(() => {
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  }, [completedSets, totalSets]);

  return {
    activeSession,
    startSession,
    endSession: finishSession,
    addExerciseToSession: async () => null,
    updateSetDetails: async () => null,
    totalExercises,
    completedSets,
    totalSets,
    progressPercentage,
  };
};

export default useWorkoutSession;
