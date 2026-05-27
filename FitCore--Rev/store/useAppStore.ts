import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Profile, DailyLog, Meal, WorkoutSession, ExerciseSet, Streak } from "@/lib/types";

// Non-persisted store for profile, meals, todayLog, streak, and cache
interface NonPersistedStore {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  todayLog: DailyLog | null;
  setTodayLog: (log: DailyLog | null) => void;
  updateTodayLog: (fields: Partial<DailyLog>) => void;

  meals: Meal[];
  setMeals: (meals: Meal[]) => void;
  addMeal: (meal: Meal) => void;
  removeMeal: (id: string) => void;

  streak: Streak | null;
  setStreak: (streak: Streak | null) => void;

  // Cache layer
  lastFetched: Record<string, number>;
  updateLastFetched: (key: string) => void;
  invalidateCache: (key?: string) => void;
}

export const useNonPersistedStore = create<NonPersistedStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  todayLog: null,
  setTodayLog: (todayLog) => set({ todayLog }),
  updateTodayLog: (fields) =>
    set((state) => ({
      todayLog: state.todayLog ? { ...state.todayLog, ...fields } : state.todayLog,
    })),

  meals: [],
  setMeals: (meals) => set({ meals }),
  addMeal: (meal) => set((state) => ({ meals: [...state.meals, meal] })),
  removeMeal: (id) => set((state) => ({ meals: state.meals.filter((meal) => meal.id !== id) })),

  streak: null,
  setStreak: (streak) => set({ streak }),

  // Cache layer
  lastFetched: {},
  updateLastFetched: (key) => set((state) => ({ lastFetched: { ...state.lastFetched, [key]: Date.now() } })),
  invalidateCache: (key) => set((state) => {
    if (key) {
      return { lastFetched: { ...state.lastFetched, [key]: 0 } };
    }
    return { lastFetched: {} };
  }),
}));

// Persisted store for activeSession and exerciseSets only
interface PersistedStore {
  activeSession: WorkoutSession | null;
  setActiveSession: (session: WorkoutSession | null) => void;
  exerciseSets: ExerciseSet[];
  setExerciseSets: (sets: ExerciseSet[]) => void;
  addExerciseSet: (exerciseSet: ExerciseSet) => void;
}

export const usePersistedStore = create<PersistedStore>()(
  persist(
    (set) => ({
      activeSession: null,
      setActiveSession: (activeSession) => set({ activeSession }),
      exerciseSets: [],
      setExerciseSets: (exerciseSets) => set({ exerciseSets }),
      addExerciseSet: (exerciseSet) =>
        set((state) => ({ exerciseSets: [...state.exerciseSets, exerciseSet] })),
    }),
    {
      name: "fitcore-workout-session",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Combined store interface for backward compatibility
interface AppStore {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  todayLog: DailyLog | null;
  setTodayLog: (log: DailyLog | null) => void;
  updateTodayLog: (fields: Partial<DailyLog>) => void;

  meals: Meal[];
  setMeals: (meals: Meal[]) => void;
  addMeal: (meal: Meal) => void;
  removeMeal: (id: string) => void;

  activeSession: WorkoutSession | null;
  setActiveSession: (session: WorkoutSession | null) => void;
  exerciseSets: ExerciseSet[];
  setExerciseSets: (sets: ExerciseSet[]) => void;
  addExerciseSet: (exerciseSet: ExerciseSet) => void;

  streak: Streak | null;
  setStreak: (streak: Streak | null) => void;

  // Cache layer
  lastFetched: Record<string, number>;
  updateLastFetched: (key: string) => void;
  invalidateCache: (key?: string) => void;
}

// Combined store that merges both stores
export const useAppStore = create<AppStore>((set) => ({
  // From non-persisted store
  profile: useNonPersistedStore.getState().profile,
  setProfile: (profile) => {
    useNonPersistedStore.getState().setProfile(profile);
    set({ profile });
  },

  todayLog: useNonPersistedStore.getState().todayLog,
  setTodayLog: (todayLog) => {
    useNonPersistedStore.getState().setTodayLog(todayLog);
    set({ todayLog });
  },
  updateTodayLog: (fields) => {
    useNonPersistedStore.getState().updateTodayLog(fields);
    set((state) => ({
      todayLog: state.todayLog ? { ...state.todayLog, ...fields } : state.todayLog,
    }));
  },

  meals: useNonPersistedStore.getState().meals,
  setMeals: (meals) => {
    useNonPersistedStore.getState().setMeals(meals);
    set({ meals });
  },
  addMeal: (meal) => {
    useNonPersistedStore.getState().addMeal(meal);
    set((state) => ({ meals: [...state.meals, meal] }));
  },
  removeMeal: (id) => {
    useNonPersistedStore.getState().removeMeal(id);
    set((state) => ({ meals: state.meals.filter((meal) => meal.id !== id) }));
  },

  streak: useNonPersistedStore.getState().streak,
  setStreak: (streak) => {
    useNonPersistedStore.getState().setStreak(streak);
    set({ streak });
  },

  // Cache layer
  lastFetched: useNonPersistedStore.getState().lastFetched,
  updateLastFetched: (key) => {
    useNonPersistedStore.getState().updateLastFetched(key);
    set((state) => ({ lastFetched: { ...state.lastFetched, [key]: Date.now() } }));
  },
  invalidateCache: (key) => {
    useNonPersistedStore.getState().invalidateCache(key);
    set((state) => {
      if (key) {
        return { lastFetched: { ...state.lastFetched, [key]: 0 } };
      }
      return { lastFetched: {} };
    });
  },

  // From persisted store
  activeSession: usePersistedStore.getState().activeSession,
  setActiveSession: (activeSession) => {
    usePersistedStore.getState().setActiveSession(activeSession);
    set({ activeSession });
  },
  exerciseSets: usePersistedStore.getState().exerciseSets,
  setExerciseSets: (exerciseSets) => {
    usePersistedStore.getState().setExerciseSets(exerciseSets);
    set({ exerciseSets });
  },
  addExerciseSet: (exerciseSet) => {
    usePersistedStore.getState().addExerciseSet(exerciseSet);
    set((state) => ({ exerciseSets: [...state.exerciseSets, exerciseSet] }));
  },
}));

export const selectTotalCaloriesToday = (state: AppStore) =>
  state.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

export const selectTotalProteinToday = (state: AppStore) =>
  state.meals.reduce((sum, meal) => sum + (meal.protein_g || 0), 0);

export const selectTotalCarbsToday = (state: AppStore) =>
  state.meals.reduce((sum, meal) => sum + (meal.carbs_g || 0), 0);

export const selectTotalFatToday = (state: AppStore) =>
  state.meals.reduce((sum, meal) => sum + (meal.fat_g || 0), 0);

export const selectCaloriesRemaining = (state: AppStore) =>
  (state.profile?.target_kcal ?? 1800) - selectTotalCaloriesToday(state);

export const selectProteinRemaining = (state: AppStore) =>
  (state.profile?.protein_goal_g ?? 120) - selectTotalProteinToday(state);

export const selectWaterProgress = (state: AppStore) => {
  const water = state.todayLog?.water_ml ?? 0;
  const target = state.profile?.water_goal_ml ?? 3000;
  return target > 0 ? water / target : 0;
};

export default useAppStore;
