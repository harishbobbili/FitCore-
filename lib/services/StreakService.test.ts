import { test, expect } from "vitest";
import { StreakService } from "./StreakService";

test("continuesStreak returns true for consecutive days", () => {
  expect(StreakService.continuesStreak("2024-01-01", "2024-01-02")).toBe(true);
});

test("continuesStreak returns true for same day", () => {
  expect(StreakService.continuesStreak("2024-01-01", "2024-01-01")).toBe(true);
});

test("continuesStreak returns false for gap > 2 days", () => {
  expect(StreakService.continuesStreak("2024-01-01", "2024-01-04")).toBe(false);
});

test("continuesStreak returns true for first workout", () => {
  expect(StreakService.continuesStreak(null, "2024-01-01")).toBe(true);
});

test("calculateUpdatedStreak increments on consecutive day", () => {
  const current = { currentStreak: 3, longestStreak: 5, lastWorkoutDate: "2024-01-01" };
  const result = StreakService.calculateUpdatedStreak(current, "2024-01-02");
  expect(result.currentStreak).toBe(4);
  expect(result.longestStreak).toBe(5);
});

test("calculateUpdatedStreak resets on broken streak", () => {
  const current = { currentStreak: 3, longestStreak: 5, lastWorkoutDate: "2024-01-01" };
  const result = StreakService.calculateUpdatedStreak(current, "2024-01-05");
  expect(result.currentStreak).toBe(1);
  expect(result.longestStreak).toBe(5);
});

test("getStreakStatus returns correct labels", () => {
  expect(StreakService.getStreakStatus(0).label).toBe("No streak");
  expect(StreakService.getStreakStatus(3).label).toBe("3 day streak");
  expect(StreakService.getStreakStatus(14).label).toBe("14 day streak");
  expect(StreakService.getStreakStatus(50).label).toBe("50 day streak");
  expect(StreakService.getStreakStatus(100).label).toBe("100 day legend");
});

test("getNextMilestone returns correct milestones", () => {
  expect(StreakService.getNextMilestone(0)).toBe(7);
  expect(StreakService.getNextMilestone(7)).toBe(14);
  expect(StreakService.getNextMilestone(30)).toBe(60);
  expect(StreakService.getNextMilestone(365)).toBe(365);
});

test("getDaysToMilestone calculates correctly", () => {
  expect(StreakService.getDaysToMilestone(3, 7)).toBe(4);
  expect(StreakService.getDaysToMilestone(7, 7)).toBe(0);
  expect(StreakService.getDaysToMilestone(10, 7)).toBe(0);
});
