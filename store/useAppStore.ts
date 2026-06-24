import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Profile, DailyLog, Meal, WorkoutSession, ExerciseSet, Streak, WeeklyAnalytics } from "@/lib/types";

// Unified store interface
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

  streak: Streak | null;
  setStreak: (streak: Streak | null) => void;

  weeklyAnalytics: WeeklyAnalytics | null;
  setWeeklyAnalytics: (data: WeeklyAnalytics | null) => void;

  // Cache layer
  lastFetched: Record<string, number>;
  updateLastFetched: (key: string) => void;
  invalidateCache: (key?: string) => void;
}

// Cache TTL: 5 minutes (300 seconds)
const CACHE_TTL_MS = 300000;

// Unified non-persisted store with subscribeWithSelector
export const useAppStore = create<AppStore>((set) => ({
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

  weeklyAnalytics: null,
  setWeeklyAnalytics: (weeklyAnalytics: WeeklyAnalytics | null) => set({ weeklyAnalytics }),

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

type FitCoreWindow = Window & {
  __fitcoreCacheFocusListenersAttached?: boolean;
  __fitcoreLastBlurTime?: number | null;
};

if (typeof window !== "undefined") {
  const fitcoreWindow = window as FitCoreWindow;

  if (!fitcoreWindow.__fitcoreCacheFocusListenersAttached) {
    fitcoreWindow.__fitcoreCacheFocusListenersAttached = true;
    fitcoreWindow.__fitcoreLastBlurTime = null;

    window.addEventListener("blur", () => {
      fitcoreWindow.__fitcoreLastBlurTime = Date.now();
    });

    window.addEventListener("focus", () => {
      const lastBlurTime = fitcoreWindow.__fitcoreLastBlurTime;

      if (lastBlurTime && Date.now() - lastBlurTime > CACHE_TTL_MS) {
        const keysToInvalidate = ["profile", "daily_log", "meals", "streak"];
        keysToInvalidate.forEach((key) => {
          useAppStore.getState().invalidateCache(key);
        });
      }

      fitcoreWindow.__fitcoreLastBlurTime = null;
    });
  }
}

// Persisted store for workout session only (sessionStorage)
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
