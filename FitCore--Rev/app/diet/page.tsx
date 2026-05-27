"use client";

import React, { useMemo, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import StatChip from "@/components/ui/StatChip";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useProfile } from "@/hooks/useProfile";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useMeals } from "@/hooks/useMeals";
import { FOOD_DATABASE, MEAL_SLOTS } from "@/lib/constants";
import { useAppStore, selectTotalCaloriesToday, selectTotalProteinToday, selectTotalCarbsToday, selectTotalFatToday } from "@/store/useAppStore";
import { Apple, Trash2, Search, Droplet, Plus, X } from "lucide-react";

export default function DietPlannerPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { log, loading: logLoading, logWater } = useDailyLog();
  const { meals, addMeal, removeMeal } = useMeals();
  const totalCaloriesToday = useAppStore(selectTotalCaloriesToday);
  const totalProteinToday = useAppStore(selectTotalProteinToday);
  const totalCarbsToday = useAppStore(selectTotalCarbsToday);
  const totalFatToday = useAppStore(selectTotalFatToday);

  const [activeSlot, setActiveSlot] = useState<(typeof MEAL_SLOTS)[number] | null>(null);
  const [search, setSearch] = useState("");
  const [quantityG, setQuantityG] = useState("100");

  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");

  const loading = profileLoading || logLoading || !profile;
  const mealsLoading = !loading && meals.length === 0;
  const breadcrumbs = [{ label: "Diet" }];

  const filteredFoods = useMemo(
    () => FOOD_DATABASE.filter((food) => food.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const addSelectedFood = (foodName: string) => {
    if (!activeSlot) return;

    const food = FOOD_DATABASE.find((item) => item.name === foodName);
    if (!food) return;

    const grams = Number(quantityG) || food.defaultWeightGrams;
    const macros = {
      calories: Math.round((food.calories * grams) / 100),
      protein_g: Math.round((food.protein * grams) / 100),
      carbs_g: Math.round((food.carbs * grams) / 100),
      fat_g: Math.round((food.fat * grams) / 100),
    };

    addMeal(activeSlot, food.name, grams, macros);
    setActiveSlot(null);
    setSearch("");
    setQuantityG("100");
  };

  const handleCloseModal = () => {
    setActiveSlot(null);
    setCustomMode(false);
    setCustomName("");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
    setSearch("");
    setQuantityG("100");
  };

  const addCustomFood = () => {
    if (!activeSlot) return;
    if (!customName.trim()) {
      alert("Please enter a Food Name.");
      return;
    }
    if (customCalories === "") {
      alert("Please enter Calories.");
      return;
    }

    const grams = Number(quantityG) || 100;
    const macros = {
      calories: Math.round(Number(customCalories)) || 0,
      protein_g: Math.round(Number(customProtein)) || 0,
      carbs_g: Math.round(Number(customCarbs)) || 0,
      fat_g: Math.round(Number(customFat)) || 0,
    };

    addMeal(activeSlot, customName, grams, macros);
    handleCloseModal();
  };

  const mealsBySlot = MEAL_SLOTS.reduce<Record<string, typeof meals>>((acc, slot) => {
    acc[slot] = meals.filter((meal) => meal.meal_slot === slot);
    return acc;
  }, {} as Record<string, typeof meals>);

  if (loading) {
    return <SkeletonCard className="h-[520px] w-full" />;
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
        <PageHeader title="Diet Planner" subtitle="Meals, macros, and water are now synced to your Supabase profile." breadcrumbs={breadcrumbs} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatChip progress={{ value: totalCaloriesToday, max: profile?.target_kcal ?? 1800, color: "#00D4FF" }} label="Calories" value={totalCaloriesToday} unit={`/ ${profile?.target_kcal ?? 1800}`} color="cyan" />
        <StatChip progress={{ value: totalProteinToday, max: profile?.protein_goal_g ?? 120, color: "#6C63FF" }} label="Protein" value={totalProteinToday} unit={`/ ${profile?.protein_goal_g ?? 120}g`} color="purple" />
        <StatChip progress={{ value: log?.water_ml ?? 0, max: profile?.water_goal_ml ?? 3000, color: "#3b82f6" }} label="Water" value={log?.water_ml ?? 0} unit={`/ ${profile?.water_goal_ml ?? 3000}ml`} color="blue" />
        <StatChip progress={{ value: totalCarbsToday + totalFatToday, max: (profile?.carbs_goal_g ?? 180) + (profile?.fat_goal_g ?? 55), color: "#f59e0b" }} label="Carbs + Fat" value={Math.round(totalCarbsToday + totalFatToday)} unit="macro grams" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-5" hoverable>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Apple className="w-5 h-5 text-neonCyan" /><h3 className="text-sm font-bold uppercase tracking-wider text-white">Meal Log</h3></div>
            <span className="text-xs text-white/40">Today</span>
          </div>

          <div className="flex flex-col gap-4">
            {MEAL_SLOTS.map((slot) => (
              <div key={slot} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white capitalize">{slot.replace("_", " ")}</div>
                    <div className="text-[10px] text-white/40">{mealsBySlot[slot]?.length ?? 0} logged meals</div>
                  </div>
                  <NeonButton variant="cyan-outline" className="h-8 px-3 text-xs" onClick={() => setActiveSlot(slot)}>
                    <Plus className="w-3.5 h-3.5" /> Add
                  </NeonButton>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {mealsLoading && slot === MEAL_SLOTS[0] ? (
                    <>
                      <SkeletonCard className="h-12 w-full" />
                      <SkeletonCard className="h-12 w-full" />
                      <SkeletonCard className="h-12 w-full" />
                    </>
                  ) : (
                    <>
                      {(mealsBySlot[slot] ?? []).map((meal) => (
                        <div key={meal.id} className="flex items-center justify-between rounded-xl bg-black/15 border border-white/5 px-3 py-2">
                          <div>
                            <div className="text-sm text-white font-medium">{meal.food_name}</div>
                            <div className="text-[10px] text-white/40">{meal.quantity_g}g · {meal.calories} kcal · P{meal.protein_g} C{meal.carbs_g} F{meal.fat_g}</div>
                          </div>
                          <button className="text-white/40 hover:text-rose-400 transition-colors" onClick={() => removeMeal(meal.id)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {!(mealsBySlot[slot] ?? []).length && <div className="text-xs text-white/30">No meals logged here yet.</div>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5" hoverable>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Droplet className="w-5 h-5 text-neonCyan" /><h3 className="text-sm font-bold uppercase tracking-wider text-white">Hydration</h3></div>
            <span className="text-xs text-white/40">{log?.water_ml ?? 0}ml</span>
          </div>
          <div className="space-y-3">
            {[250, 500, 750].map((amount) => (
              <NeonButton key={amount} variant="cyan-outline" className="w-full h-9 text-xs" onClick={() => logWater((log?.water_ml ?? 0) + amount)}>
                +{amount}ml Water
              </NeonButton>
            ))}
          </div>
        </GlassCard>
      </div>

      {activeSlot && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl p-5 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Add Meal to {activeSlot.replace("_", " ")}</h3>
              <button onClick={handleCloseModal} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Toggle Modes */}
            <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
              <NeonButton
                variant={!customMode ? "gradient" : "cyan-outline"}
                className="flex-1 h-9 text-xs"
                onClick={() => setCustomMode(false)}
              >
                Pick from Database
              </NeonButton>
              <NeonButton
                variant={customMode ? "gradient" : "cyan-outline"}
                className="flex-1 h-9 text-xs"
                onClick={() => setCustomMode(true)}
              >
                Enter Custom Food
              </NeonButton>
            </div>

            {!customMode ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <Search className="w-4 h-4 text-white/40" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search foods" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
                  </label>
                  <label className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Quantity (g)</div>
                    <input value={quantityG} onChange={(e) => setQuantityG(e.target.value)} type="number" min="1" className="w-full bg-transparent text-sm text-white outline-none" />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredFoods.map((food) => (
                    <button key={food.name} onClick={() => addSelectedFood(food.name)} className="text-left rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:border-neonCyan/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-white">{food.name}</div>
                        <div className="text-xs text-white/40">{food.defaultWeightGrams}g default</div>
                      </div>
                      <div className="mt-2 text-xs text-white/50">Per 100g: {food.calories} kcal, P{food.protein} C{food.carbs} F{food.fat}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Food Name *</div>
                    <input value={customName} onChange={(e) => setCustomName(e.target.value)} type="text" placeholder="e.g. Protein shake" className="w-full bg-transparent text-sm text-white outline-none" required />
                  </label>
                  <label className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Quantity (g) *</div>
                    <input value={quantityG} onChange={(e) => setQuantityG(e.target.value)} type="number" min="1" className="w-full bg-transparent text-sm text-white outline-none" required />
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Calories (kcal) *</div>
                    <input value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} type="number" min="0" className="w-full bg-transparent text-sm text-white outline-none" required />
                  </label>
                  <label className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Protein (g)</div>
                    <input value={customProtein} onChange={(e) => setCustomProtein(e.target.value)} type="number" min="0" className="w-full bg-transparent text-sm text-white outline-none" />
                  </label>
                  <label className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Carbs (g)</div>
                    <input value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value)} type="number" min="0" className="w-full bg-transparent text-sm text-white outline-none" />
                  </label>
                  <label className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Fat (g)</div>
                    <input value={customFat} onChange={(e) => setCustomFat(e.target.value)} type="number" min="0" className="w-full bg-transparent text-sm text-white outline-none" />
                  </label>
                </div>

                <div className="flex justify-end mt-4">
                  <NeonButton variant="gradient" className="w-full md:w-auto px-6" onClick={addCustomFood}>
                    <Plus className="w-4 h-4" /> Add Custom Food
                  </NeonButton>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
