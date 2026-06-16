import { test, expect } from "vitest";
import { WorkoutBusinessService } from "./WorkoutBusinessService";

test("isPersonalRecord detects first-time exercise as PR", () => {
  const result = WorkoutBusinessService.isPersonalRecord(80, 5, null);
  expect(result.isPR).toBe(true);
});

test("isPersonalRecord detects higher weight as PR", () => {
  const result = WorkoutBusinessService.isPersonalRecord(85, 5, { weight_kg: 80, reps: 5 });
  expect(result.isPR).toBe(true);
});

test("isPersonalRecord detects same weight more reps as PR", () => {
  const result = WorkoutBusinessService.isPersonalRecord(80, 6, { weight_kg: 80, reps: 5 });
  expect(result.isPR).toBe(true);
});

test("isPersonalRecord rejects non-PR", () => {
  const result = WorkoutBusinessService.isPersonalRecord(75, 5, { weight_kg: 80, reps: 5 });
  expect(result.isPR).toBe(false);
});

test("calculateStreakUpdate continues streak on consecutive day", () => {
  const current = { currentStreak: 3, longestStreak: 5, lastWorkoutDate: "2024-01-01" };
  const update = WorkoutBusinessService.calculateStreakUpdate(current, "2024-01-02");
  expect(update.current_streak).toBe(4);
  expect(update.longest_streak).toBe(5);
});

test("calculateStreakUpdate resets on broken streak", () => {
  const current = { currentStreak: 3, longestStreak: 5, lastWorkoutDate: "2024-01-01" };
  const update = WorkoutBusinessService.calculateStreakUpdate(current, "2024-01-05");
  expect(update.current_streak).toBe(1);
  expect(update.longest_streak).toBe(5);
});

test("calculateStreakUpdate starts fresh with no history", () => {
  const update = WorkoutBusinessService.calculateStreakUpdate(null, "2024-01-01");
  expect(update.current_streak).toBe(1);
  expect(update.longest_streak).toBe(1);
});

test("checkWorkoutAchievements returns correct badges", () => {
  const earned = new Set<string>();
  const unlocked = WorkoutBusinessService.checkWorkoutAchievements(10, 7, 5, earned);
  expect(unlocked.length).toBeGreaterThan(0);
});

test("checkWorkoutAchievements excludes already earned", () => {
  const earned = new Set(["first_workout"]);
  const unlocked = WorkoutBusinessService.checkWorkoutAchievements(1, 1, 0, earned);
  expect(unlocked).not.toContain("first_workout");
});
