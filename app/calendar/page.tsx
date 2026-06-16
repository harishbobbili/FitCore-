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
type DailyLogRow = { date: string; calories_consumed: number | null; protein_g: number | null; water_ml: number | null; sleep_hours: number | null; weight_kg: number | null };
type WorkoutRow = { date: string; split_name: string };
type CardioRow = { date: string; type: string; duration_mins: number };
type WeekSummary = { weekStart: string; workouts: number; cardio: number; avgCalories: number };

// Helper to get local date string (YYYY-MM-DD) in local timezone
const getLocalDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to calculate activity intensity level (0-3)
const getActivityIntensity = (
  hasWorkout: boolean,
  hasCardio: boolean,
  hasCalories: boolean,
  hasMeals: boolean
): number => {
  const activityCount = (hasWorkout ? 1 : 0) + (hasCardio ? 1 : 0) + (hasCalories ? 1 : 0) + (hasMeals ? 1 : 0);
  if (activityCount === 0) return 0;
  if (activityCount === 1) return 1;
  if (activityCount === 2) return 2;
  return 3; // 3+ activities or calorie goal met
};

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<DayDetails | null>(null);
  const [workouts, setWorkouts] = useState<Set<string>>(new Set());
  const [cardio, setCardio] = useState<Set<string>>(new Set());
  const [calories, setCalories] = useState<Map<string, number>>(new Map());
  const [meals, setMeals] = useState<Set<string>>(new Set());
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;
      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const startDateStr = getLocalDateStr(start);
      const endDateStr = getLocalDateStr(end);

      const [workoutRows, cardioRows, logRows, mealRows] = await Promise.all([
        supabase.from("workout_sessions").select("date, split_name").eq("user_id", userId).gte("date", startDateStr).lte("date", endDateStr),
        supabase.from("cardio_logs").select("date").eq("user_id", userId).gte("date", startDateStr).lte("date", endDateStr),
        supabase.from("daily_logs").select("date, calories_consumed, protein_g, water_ml, sleep_hours, weight_kg").eq("user_id", userId).gte("date", startDateStr).lte("date", endDateStr),
        supabase.from("meals").select("date").eq("user_id", userId).gte("date", startDateStr).lte("date", endDateStr),
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

  // Calculate weekday offset (Monday = 0)
  const weekdayOffset = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const day = firstDay.getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return day === 0 ? 6 : day - 1;
  }, [month]);

  // Calculate month stats
  const monthStats = useMemo(() => {
    const workoutDays = workouts.size;
    const cardioSessions = cardio.size;
    const activeDays = new Set([...Array.from(workouts), ...Array.from(cardio), ...Array.from(calories.keys())]).size;
    return { workoutDays, cardioSessions, activeDays };
  }, [workouts, cardio, calories]);

  const breadcrumbs = [{ label: "Calendar" }];

  // Get today's date in local timezone
  const todayStr = getLocalDateStr(new Date());

  // Handler to fetch detailed data when a day is clicked
  const handleDayClick = async (date: string) => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    const [workoutData, cardioData, dailyLogData] = await Promise.all([
      supabase.from("workout_sessions").select("split_name").eq("user_id", userId).eq("date", date).single(),
      supabase.from("cardio_logs").select("type, duration_mins").eq("user_id", userId).eq("date", date).single(),
      supabase.from("daily_logs").select("protein_g, water_ml, sleep_hours, weight_kg, calories_consumed").eq("user_id", userId).eq("date", date).single(),
    ]);

    setSelected({
      date,
      workout: workoutData.data?.split_name,
      cardio: cardioData.data ? `${cardioData.data.type} (${cardioData.data.duration_mins} min)` : undefined,
      calories: dailyLogData.data?.calories_consumed ?? 0,
      target: 1800,
      protein: dailyLogData.data?.protein_g ?? 0,
      water: dailyLogData.data?.water_ml ?? 0,
      sleep: dailyLogData.data?.sleep_hours ?? 0,
      weight: dailyLogData.data?.weight_kg ?? 0,
    });

    // Calculate week summary for the clicked day's week
    const clickedDate = new Date(date);
    const dayOfWeek = clickedDate.getDay();
    const weekStart = new Date(clickedDate);
    weekStart.setDate(clickedDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekStartStr = getLocalDateStr(weekStart);
    const weekEndStr = getLocalDateStr(weekEnd);

    const [weekWorkouts, weekCardio, weekLogs] = await Promise.all([
      supabase.from("workout_sessions").select("date").eq("user_id", userId).gte("date", weekStartStr).lte("date", weekEndStr),
      supabase.from("cardio_logs").select("date").eq("user_id", userId).gte("date", weekStartStr).lte("date", weekEndStr),
      supabase.from("daily_logs").select("date, calories_consumed").eq("user_id", userId).gte("date", weekStartStr).lte("date", weekEndStr),
    ]);

    const workoutCount = (weekWorkouts.data ?? []).length;
    const cardioCount = (weekCardio.data ?? []).length;
    const totalCalories = (weekLogs.data ?? []).reduce((sum: number, row: any) => sum + (Number(row.calories_consumed) || 0), 0);
    const avgCalories = workoutCount + cardioCount > 0 ? Math.round(totalCalories / 7) : 0;

    setWeekSummary({
      weekStart: weekStartStr,
      workouts: workoutCount,
      cardio: cardioCount,
      avgCalories,
    });
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
        <PageHeader title="Fitness Calendar" subtitle="Browse your month of workouts, cardio, meals, and daily logs." breadcrumbs={breadcrumbs} />
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"><ChevronLeft className="h-4 w-4" /></button>
          <div className="text-lg font-semibold text-white">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"><ChevronRight className="h-4 w-4" /></button>
        </div>

        {/* FEATURE 3: Month stats bar */}
        <div className="text-sm text-white/60">
          This month: <span className="text-white font-semibold">{monthStats.workoutDays}</span> workout days · <span className="text-white font-semibold">{monthStats.cardioSessions}</span> cardio sessions · <span className="text-white font-semibold">{monthStats.activeDays}</span> active days
        </div>

        <GlassCard>
          <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.3em] text-white/40">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {/* Empty cells for weekday offset */}
            {Array.from({ length: weekdayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-24" />
            ))}
            {days.map((day) => {
              const date = getLocalDateStr(day);
              const isToday = date === todayStr;
              const future = day > new Date();
              const hasWorkout = workouts.has(date);
              const hasCardio = cardio.has(date);
              const hasCalories = (calories.get(date) ?? 0) > 0;
              const hasMeals = meals.has(date);
              const intensity = getActivityIntensity(hasWorkout, hasCardio, hasCalories, hasMeals);

              // FEATURE 1: Heatmap intensity background colors
              const intensityBg = intensity === 0 ? "bg-white/[0.02]" : intensity === 1 ? "bg-emerald-500/5" : intensity === 2 ? "bg-emerald-500/10" : "bg-emerald-500/20";
              const intensityBorder = intensity === 3 ? "border-emerald-500/20" : isToday ? "border-white" : "border-white/10";

              return (
                <button key={date} onClick={() => handleDayClick(date)} className={`min-h-24 rounded-2xl border p-3 text-left ${intensityBg} ${intensityBorder} ${future ? "opacity-30" : ""}`}>
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

          {/* FEATURE 4: Legend row */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/60">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span>Workout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Cardio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span>Calories</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              <span>Meals</span>
            </div>
          </div>

          {/* FEATURE 2: Weekly summary footer row */}
          {weekSummary && (
            <div className="mt-4 pt-4 border-t border-white/10 text-sm text-white/60 text-center">
              Week of {weekSummary.weekStart}: <span className="text-white font-semibold">{weekSummary.workouts}</span> workouts · <span className="text-white font-semibold">{weekSummary.cardio}</span> cardio sessions · Avg <span className="text-white font-semibold">{weekSummary.avgCalories}</span> kcal/day
            </div>
          )}
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