import type { DailyLog, WorkoutSession, Streak } from "@/lib/types";

export interface WeeklyChartPoint {
  date: string;
  calories: number;
  protein: number;
  weight: number;
}

export interface WeeklySummary {
  chartPoints: WeeklyChartPoint[];
  consistencyScore: number;
  workoutsThisWeek: number;
  avgCalories: number;
  avgProtein: number;
  avgSteps: number;
  avgSleep: number;
  avgWater: number;
  avgWeight: number | null;
}

/**
 * AnalyticsService - handles all dashboard analytics calculations
 * Pure functions, no side effects, no Supabase dependencies
 */
export class AnalyticsService {
  /**
   * Calculate consistency score
   */
  static calcConsistencyScore(workoutDays: number, plannedDaysPerWeek: number | null | undefined): number {
    const target = plannedDaysPerWeek && plannedDaysPerWeek > 0 ? plannedDaysPerWeek : 7;
    return Math.min(100, Math.round((workoutDays / target) * 100));
  }

  /**
   * Build 7-day chart points from daily logs
   */
  static buildWeeklyChartPoints(logs: DailyLog[]): WeeklyChartPoint[] {
    const logMap = new Map(logs.map((l) => [l.date, l]));
    const chartPoints: WeeklyChartPoint[] = [];

    for (let i = -6; i <= 0; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const log = logMap.get(dateStr);
      chartPoints.push({
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        calories: log?.calories_consumed ?? 0,
        protein: log?.protein_g ?? 0,
        weight: log?.weight_kg ?? 0,
      });
    }

    return chartPoints;
  }

  /**
   * Calculate weekly summary from data
   */
  static calculateWeeklySummary(
    logs: DailyLog[],
    workoutDates: string[],
    plannedDaysPerWeek: number | null | undefined
  ): WeeklySummary {
    const chartPoints = this.buildWeeklyChartPoints(logs);
    const uniqueWorkoutDays = new Set(workoutDates).size;
    const consistencyScore = this.calcConsistencyScore(uniqueWorkoutDays, plannedDaysPerWeek);

    const activeLogs = logs.filter((l) => l.id !== "");
    const n = activeLogs.length || 1;

    const sum = (field: keyof DailyLog) =>
      activeLogs.reduce((a, c) => a + (Number(c[field]) || 0), 0);

    const weights = activeLogs.map((l) => l.weight_kg).filter((w): w is number => w != null);
    const avgWeight = weights.length ? Number((weights.reduce((a, c) => a + c, 0) / weights.length).toFixed(1)) : null;

    return {
      chartPoints,
      consistencyScore,
      workoutsThisWeek: uniqueWorkoutDays,
      avgCalories: Math.round(sum("calories_consumed") / n),
      avgProtein: Math.round(sum("protein_g") / n),
      avgSteps: Math.round(sum("steps") / n),
      avgSleep: Number((sum("sleep_hours") / n).toFixed(1)),
      avgWater: Math.round(sum("water_ml") / n),
      avgWeight,
    };
  }

  /**
   * Calculate deficit target calories
   */
  static calculateDeficitTarget(maintenanceKcal: number | null | undefined): number {
    return (maintenanceKcal ?? 2400) - 400;
  }

  /**
   * Calculate BMI
   */
  static calculateBMI(weightKg: number | null, heightCm: number | null): number | null {
    if (!weightKg || !heightCm || heightCm <= 0) return null;
    return Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));
  }

  /**
   * Calculate weight trend over time
   */
  static calculateWeightTrend(weights: { date: string; weight_kg: number }[]): "up" | "down" | "stable" {
    if (weights.length < 2) return "stable";
    const first = weights[0].weight_kg;
    const last = weights[weights.length - 1].weight_kg;
    const diff = last - first;
    if (diff < -0.5) return "down";
    if (diff > 0.5) return "up";
    return "stable";
  }
}
