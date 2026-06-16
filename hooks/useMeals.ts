"use client";

import { useMemo } from "react";
import type { Meal, MealSlot } from "@/lib/types";
import { useAppStore, selectTotalCaloriesToday, selectTotalProteinToday, selectTotalCarbsToday, selectTotalFatToday } from "@/store/useAppStore";
import { showErrorToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";
import { getMealsRepository } from "@/lib/repositories";

function refreshDailyTotals() {
  const state = useAppStore.getState();
  if (!state.todayLog) return;

  useAppStore.setState({
    todayLog: {
      ...state.todayLog,
      calories_consumed: selectTotalCaloriesToday(state),
      protein_g: selectTotalProteinToday(state),
      carbs_g: selectTotalCarbsToday(state),
      fat_g: selectTotalFatToday(state),
    },
  });
}

function normalizeMacros(macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number }) {
  return {
    calories: Math.round(macros.calories),
    protein_g: Math.round(macros.protein_g),
    carbs_g: Math.round(macros.carbs_g),
    fat_g: Math.round(macros.fat_g),
  };
}

export function useMeals() {
  const meals = useAppStore((state) => state.meals);
  const addMealToStore = useAppStore((state) => state.addMeal);
  const removeMealFromStore = useAppStore((state) => state.removeMeal);
  const setMeals = useAppStore((state) => state.setMeals);

  const addMeal = async (
    mealSlot: MealSlot,
    foodName: string,
    quantityG: number,
    macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number }
  ) => {
    const userId = await getSessionUserId();
    const snapshotMeals = useAppStore.getState().meals;

    if (!userId) {
      return null;
    }

    const normalizedMacros = normalizeMacros(macros);
    const today = new Date().toISOString().split("T")[0];
    const optimisticMeal: Meal = {
      id: crypto.randomUUID(),
      user_id: userId,
      log_id: useAppStore.getState().todayLog?.id ?? null,
      date: today,
      meal_slot: mealSlot,
      food_name: foodName,
      quantity_g: quantityG,
      calories: normalizedMacros.calories,
      protein_g: normalizedMacros.protein_g,
      carbs_g: normalizedMacros.carbs_g,
      fat_g: normalizedMacros.fat_g,
      logged_at: new Date().toISOString(),
    };

    addMealToStore(optimisticMeal);
    refreshDailyTotals();

    const repo = getMealsRepository();
    const { data, error } = await repo.add(userId, {
      log_id: optimisticMeal.log_id,
      date: today,
      meal_slot: mealSlot,
      food_name: foodName,
      quantity_g: quantityG,
      calories: normalizedMacros.calories,
      protein_g: normalizedMacros.protein_g,
      carbs_g: normalizedMacros.carbs_g,
      fat_g: normalizedMacros.fat_g,
      logged_at: new Date().toISOString(),
    });

    if (error) {
      setMeals(snapshotMeals);
      showErrorToast(error.message);
      return null;
    }

    const nextMeals = [...snapshotMeals, data as Meal];
    setMeals(nextMeals);
    refreshDailyTotals();
    return data as Meal;
  };

  const removeMeal = async (id: string) => {
    const snapshotMeals = useAppStore.getState().meals;
    const remaining = snapshotMeals.filter((meal) => meal.id !== id);
    setMeals(remaining);
    refreshDailyTotals();

    try {
      const res = await fetch(`/api/meals?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete meal');
      }
    } catch (error) {
      setMeals(snapshotMeals);
      refreshDailyTotals();
      showErrorToast(error instanceof Error ? error.message : 'Failed to delete meal');
    }
  };

  return useMemo(
    () => ({ meals, addMeal, removeMeal }),
    [meals]
  );
}

export default useMeals;
