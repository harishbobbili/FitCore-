import type { AchievementData } from "./types";

/**
 * AchievementService - handles achievement logic and validation
 */
export class AchievementService {
  /**
   * Check if an achievement should be unlocked
   */
  static shouldUnlock(
    achievement: AchievementData,
    currentValue: number,
    earnedBadges: Set<string>
  ): boolean {
    // Already earned
    if (earnedBadges.has(achievement.badgeId)) return false;

    // Check threshold
    return currentValue >= achievement.threshold;
  }

  /**
   * Calculate achievement progress percentage
   */
  static calculateProgress(currentValue: number, threshold: number): number {
    return Math.min(100, Math.round((currentValue / threshold) * 100));
  }

  /**
   * Get achievement rarity based on threshold
   */
  static getAchievementRarity(threshold: number): {
    label: string;
    color: string;
    multiplier: number;
  } {
    if (threshold >= 100) {
      return { label: "Legendary", color: "gold", multiplier: 5 };
    }
    if (threshold >= 50) {
      return { label: "Epic", color: "purple", multiplier: 3 };
    }
    if (threshold >= 20) {
      return { label: "Rare", color: "blue", multiplier: 2 };
    }
    if (threshold >= 10) {
      return { label: "Uncommon", color: "green", multiplier: 1.5 };
    }
    return { label: "Common", color: "gray", multiplier: 1 };
  }

  /**
   * Calculate total achievement score
   */
  static calculateTotalScore(earnedBadges: string[]): number {
    // This would integrate with BADGE_DEFINITIONS from constants
    // For now, return count as a simple score
    return earnedBadges.length;
  }

  /**
   * Group achievements by category
   */
  static groupAchievementsByCategory(achievements: AchievementData[]): Map<string, AchievementData[]> {
    const grouped = new Map<string, AchievementData[]>();
    
    achievements.forEach(achievement => {
      const category = achievement.triggerType;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(achievement);
    });

    return grouped;
  }

  /**
   * Get next achievement to unlock
   */
  static getNextAchievement(
    allAchievements: AchievementData[],
    earnedBadges: Set<string>,
    currentValue: number
  ): AchievementData | null {
    const available = allAchievements
      .filter(a => !earnedBadges.has(a.badgeId))
      .filter(a => a.triggerType === allAchievements[0]?.triggerType)
      .sort((a, b) => a.threshold - b.threshold);

    return available.find(a => a.threshold > currentValue) || null;
  }
}
