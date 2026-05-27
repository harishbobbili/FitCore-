"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

type DayDetails = { date: string; workout?: string; cardio?: string; calories?: number; target?: number; protein?: number; water?: number; sleep?: number; weight?: number };
type RowWithDate = { date: string };
type DailyLogRow = { date: string; calories_consumed: number | null };

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<DayDetails | null>(null);
  const [workouts, setWorkouts] = useState<Set<string>>(new Set());
  const [cardio, setCardio] = useState<Set<string>>(new Set());
  const [calories, setCalories] = useState<Map<string, number>>(new Map());
  const [meals, setMeals] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;
      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const [workoutRows, cardioRows, logRows, mealRows] = await Promise.all([
        supabase.from("workout_sessions").select("date, split_name").eq("user_id", userId).gte("date", start.toISOString().split("T")[0]).lte("date", end.toISOString().split("T")[0]),
        supabase.from("cardio_logs").select("date").eq("user_id", userId).gte("date", start.toISOString().split("T")[0]).lte("date", end.toISOString().split("T")[0]),
        supabase.from("daily_logs").select("date, calories_consumed, protein_g, water_ml, sleep_hours, weight_kg").eq("user_id", userId).gte("date", start.toISOString().split("T")[0]).lte("date", end.toISOString().split("T")[0]),
        supabase.from("meals").select("date").eq("user_id", userId).gte("date", start.toISOString().split("T")[0]).lte("date", end.toISOString().split("T")[0]),
      ]);

      setWorkouts(new Set((workoutRows.data ?? []).map((row: RowWithDate) => row.date)));
      setCardio(new Set((cardioRows.data ?? []).map((row: RowWithDate) => row.date)));
      setMeals(new Set((mealRows.data ?? []).map((row: RowWithDate) => row.date)));
      setCalories(new Map((logRows.data ?? []).map((row: DailyLogRow) => [row.date, Number(row.calories_consumed ?? 0)])));
    };

    void load();
  }, [month]);

  const days = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const cells: Date[] = [];
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) cells.push(new Date(day));
    return cells;
  }, [month]);

  const breadcrumbs = [{ label: "Calendar" }];

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
        <PageHeader title="Fitness Calendar" subtitle="Browse your month of workouts, cardio, meals, and daily logs." breadcrumbs={breadcrumbs} />
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"><ChevronLeft className="h-4 w-4" /></button>
          <div className="text-lg font-semibold text-white">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"><ChevronRight className="h-4 w-4" /></button>
        </div>

        <GlassCard>
          <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.3em] text-white/40">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {days.map((day) => {
              const date = day.toISOString().split("T")[0];
              const isToday = date === new Date().toISOString().split("T")[0];
              const future = day > new Date();
              return (
                <button key={date} onClick={() => setSelected({ date, calories: calories.get(date) ?? 0, target: 1800, water: 0, protein: 0, sleep: 0, weight: 0 })} className={`min-h-24 rounded-2xl border p-3 text-left ${isToday ? "border-white" : "border-white/10"} ${future ? "opacity-30" : ""}`}>
                  <div className="text-sm text-white">{day.getDate()}</div>
                  <div className="mt-6 flex gap-1">
                    {workouts.has(date) ? <span className="h-2 w-2 rounded-full bg-sky-400" /> : null}
                    {cardio.has(date) ? <span className="h-2 w-2 rounded-full bg-emerald-400" /> : null}
                    {(calories.get(date) ?? 0) ? <span className="h-2 w-2 rounded-full bg-orange-400" /> : null}
                    {meals.has(date) ? <span className="h-2 w-2 rounded-full bg-violet-400" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <AnimatePresence>
          {selected ? (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0A0A0F] p-6 shadow-2xl border-l border-white/10">
              <div className="flex items-center justify-between"><h3 className="text-xl font-bold text-white">{selected.date}</h3><button onClick={() => setSelected(null)}><X className="h-5 w-5" /></button></div>
              <div className="mt-6 space-y-3 text-sm text-white/70">
                <div>Workout: {selected.workout ?? "Rest Day"}</div>
                <div>Cardio: {selected.cardio ?? "None"}</div>
                <div>Calories: {selected.calories ?? 0} / {selected.target ?? 1800}</div>
                <div>Protein: {selected.protein ?? 0} / goal</div>
                <div>Water: {selected.water ?? 0} ml</div>
                <div>Sleep: {selected.sleep ?? 0} h</div>
                <div>Weight: {selected.weight ?? 0} kg</div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}