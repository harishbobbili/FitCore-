import { useWorkout } from "@/hooks/useWorkout";

export const useWorkoutSession = () => {
  const { activeSession, startSession, finishSession, exerciseSets } = useWorkout();

  const totalExercises = exerciseSets.length > 0 ? new Set(exerciseSets.map((set) => set.exercise_name)).size : 0;
  const completedSets = exerciseSets.length;
  const totalSets = exerciseSets.length;

  return {
    activeSession,
    startSession,
    endSession: finishSession,
    addExerciseToSession: async () => null,
    updateSetDetails: async () => null,
    totalExercises,
    completedSets,
    totalSets,
    progressPercentage: totalSets > 0 ? (completedSets / totalSets) * 100 : 0,
  };
};

export default useWorkoutSession;
