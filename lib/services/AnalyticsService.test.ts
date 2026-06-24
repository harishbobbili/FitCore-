import { test, expect } from "vitest";
import { AnalyticsService } from "./AnalyticsService";

test("calcConsistencyScore returns correct percentage", () => {
  expect(AnalyticsService.calcConsistencyScore(3, 5)).toBe(60);
  expect(AnalyticsService.calcConsistencyScore(5, 5)).toBe(100);
  expect(AnalyticsService.calcConsistencyScore(0, 5)).toBe(0);
  expect(AnalyticsService.calcConsistencyScore(7, 7)).toBe(100);
});

test("calcConsistencyScore falls back to 7 when plannedDays is missing", () => {
  expect(AnalyticsService.calcConsistencyScore(3, null)).toBe(43);
  expect(AnalyticsService.calcConsistencyScore(3, undefined)).toBe(43);
});

test("buildWeeklyChartPoints creates 7 days of data", () => {
  const logs = [
    { id: "1", user_id: "u1", date: new Date().toISOString().split("T")[0], calories_consumed: 2000, protein_g: 120, carbs_g: 200, fat_g: 60, water_ml: 3000, steps: 8000, sleep_hours: 8, weight_kg: 70, mood_score: 4 },
  ];
  const points = AnalyticsService.buildWeeklyChartPoints(logs as any);
  expect(points).toHaveLength(7);
  expect(points[6].calories).toBe(2000); // Today should have the log
});

test("calculateBMI returns correct value", () => {
  expect(AnalyticsService.calculateBMI(70, 175)).toBeCloseTo(22.9, 1);
  expect(AnalyticsService.calculateBMI(null, 175)).toBeNull();
  expect(AnalyticsService.calculateBMI(70, null)).toBeNull();
});

test("calculateWeightTrend detects trends correctly", () => {
  const downTrend = [
    { date: "2024-01-01", weight_kg: 70 },
    { date: "2024-01-07", weight_kg: 68 },
  ];
  expect(AnalyticsService.calculateWeightTrend(downTrend)).toBe("down");

  const stableTrend = [
    { date: "2024-01-01", weight_kg: 70 },
    { date: "2024-01-07", weight_kg: 70.2 },
  ];
  expect(AnalyticsService.calculateWeightTrend(stableTrend)).toBe("stable");

  const upTrend = [
    { date: "2024-01-01", weight_kg: 70 },
    { date: "2024-01-07", weight_kg: 72 },
  ];
  expect(AnalyticsService.calculateWeightTrend(upTrend)).toBe("up");
});
