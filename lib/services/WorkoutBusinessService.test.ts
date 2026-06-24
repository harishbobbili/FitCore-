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

test("checkWorkoutAchievements returns correct badges", () => {
  const earned = new Set<string>();
  const unlocked = WorkoutBusinessService.checkWorkoutAchievements(10, 7, 5, earned);
  expect(unlocked.length).toBeGreaterThan(0);
});

test("checkWorkoutAchievements excludes already earned", () => {
  const earned = new Set(["first-step"]);
  const unlocked = WorkoutBusinessService.checkWorkoutAchievements(1, 1, 0, earned);
  expect(unlocked).not.toContain("first-step");
});
