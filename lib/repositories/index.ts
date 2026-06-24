import { getAuthProvider } from "@/lib/auth/provider-factory";
import { DailyLogsRepository } from "./daily-logs.repository";
import { UserProfileRepository } from "./user-profile.repository";
import { WorkoutsRepository } from "./workouts.repository";
import { MealsRepository } from "./meals.repository";
import { StreakRepository } from "./streaks.repository";
import { AchievementsRepository } from "./achievements.repository";
import { BodyMetricsRepository } from "./body-metrics.repository";
import { AnalyticsRepository } from "./analytics.repository";

/**
 * Repository factory - creates repository instances based on auth provider
 */
let dailyLogsRepo: DailyLogsRepository | null = null;
let userProfileRepo: UserProfileRepository | null = null;
let workoutsRepo: WorkoutsRepository | null = null;
let mealsRepo: MealsRepository | null = null;
let streakRepo: StreakRepository | null = null;
let achievementsRepo: AchievementsRepository | null = null;
let bodyMetricsRepo: BodyMetricsRepository | null = null;
let analyticsRepo: AnalyticsRepository | null = null;

export function getDailyLogsRepository(): DailyLogsRepository {
  if (!dailyLogsRepo) {
    const provider = getAuthProvider();
    dailyLogsRepo = new DailyLogsRepository(provider.isDemo());
  }
  return dailyLogsRepo;
}

export function getUserProfileRepository(): UserProfileRepository {
  if (!userProfileRepo) {
    const provider = getAuthProvider();
    userProfileRepo = new UserProfileRepository(provider.isDemo());
  }
  return userProfileRepo;
}

export function getWorkoutsRepository(): WorkoutsRepository {
  if (!workoutsRepo) {
    const provider = getAuthProvider();
    workoutsRepo = new WorkoutsRepository(provider.isDemo());
  }
  return workoutsRepo;
}

export function getMealsRepository(): MealsRepository {
  if (!mealsRepo) {
    const provider = getAuthProvider();
    mealsRepo = new MealsRepository(provider.isDemo());
  }
  return mealsRepo;
}

export function getStreakRepository(): StreakRepository {
  if (!streakRepo) {
    const provider = getAuthProvider();
    streakRepo = new StreakRepository(provider.isDemo());
  }
  return streakRepo;
}

export function getAchievementsRepository(): AchievementsRepository {
  if (!achievementsRepo) {
    const provider = getAuthProvider();
    achievementsRepo = new AchievementsRepository(provider.isDemo());
  }
  return achievementsRepo;
}

export function getBodyMetricsRepository(): BodyMetricsRepository {
  if (!bodyMetricsRepo) {
    const provider = getAuthProvider();
    bodyMetricsRepo = new BodyMetricsRepository(provider.isDemo());
  }
  return bodyMetricsRepo;
}

export function getAnalyticsRepository(): AnalyticsRepository {
  if (!analyticsRepo) {
    const provider = getAuthProvider();
    analyticsRepo = new AnalyticsRepository(provider.isDemo());
  }
  return analyticsRepo;
}

/**
 * Reset repository instances (useful for testing)
 */
export function resetRepositories(): void {
  dailyLogsRepo = null;
  userProfileRepo = null;
  workoutsRepo = null;
  mealsRepo = null;
  streakRepo = null;
  achievementsRepo = null;
  bodyMetricsRepo = null;
  analyticsRepo = null;
}
