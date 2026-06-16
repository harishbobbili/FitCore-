/**
 * MET-based calorie burn calculations.
 *
 * Formula: calories = MET × weight_kg × duration_hours
 * (Equivalent to: MET × weight_kg × duration_mins / 60)
 *
 * MET values sourced from the Compendium of Physical Activities (Ainsworth et al.)
 *
 * The old formula was: calories = duration_mins × 6
 * That assumed a 60 kg person doing moderate resistance training, producing
 * roughly 360 kcal/hour regardless of bodyweight, gender, age, or intensity.
 * This is replaced with weight-adjusted MET calculations.
 */

// ─── MET table ────────────────────────────────────────────────────────────────

/**
 * MET values for workout splits (resistance training).
 * These are conservative estimates for typical gym work including rest periods.
 */
const WORKOUT_MET: Record<string, number> = {
  "chest-triceps":  5.0,  // moderate weight training, upper body push
  "back-biceps":    5.2,  // moderate weight training, upper body pull
  "shoulders-abs":  4.8,  // moderate weight training, delts + core
  "legs":           6.0,  // squats, deadlifts — highest metabolic demand
  "push":           5.0,
  "pull":           5.2,
  "upper":          5.0,
  "lower":          6.0,
  "full-body":      5.5,
  "custom":         5.0,
  "default":        5.0,  // fallback
};

/**
 * MET values for cardio activities.
 */
const CARDIO_MET: Record<string, number> = {
  walk:       3.5,   // brisk walking ~5 km/h
  run:        9.8,   // running ~8 km/h
  hiit:       12.0,  // high-intensity interval training
  jump_rope:  11.0,  // jumping rope, moderate pace
};

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Calories burned during a resistance training session.
 *
 * @param splitName   workout split name (e.g. "chest-triceps", "legs")
 * @param durationMins total session duration in minutes (including rest periods)
 * @param weightKg    user's body weight in kg
 * @returns           estimated calories burned (integer, minimum 1)
 */
export function workoutCaloriesBurned(
  splitName: string,
  durationMins: number,
  weightKg: number
): number {
  const met = WORKOUT_MET[splitName.toLowerCase()] ?? WORKOUT_MET["default"];
  const durationHours = durationMins / 60;
  return Math.max(1, Math.round(met * weightKg * durationHours));
}

/**
 * Calories burned during a cardio session.
 *
 * @param type        cardio type ("walk" | "run" | "hiit" | "jump_rope")
 * @param durationMins session duration in minutes
 * @param weightKg    user's body weight in kg
 * @returns           estimated calories burned (integer, minimum 1)
 */
export function cardioCaloriesBurned(
  type: string,
  durationMins: number,
  weightKg: number
): number {
  const met = CARDIO_MET[type.toLowerCase()] ?? 5.0;
  const durationHours = durationMins / 60;
  return Math.max(1, Math.round(met * weightKg * durationHours));
}

/**
 * Returns a human-readable MET label for UI display.
 */
export function getActivityIntensityLabel(met: number): string {
  if (met >= 12) return "Very High Intensity";
  if (met >= 9) return "High Intensity";
  if (met >= 6) return "Moderate-High Intensity";
  if (met >= 4) return "Moderate Intensity";
  return "Light Intensity";
}

/**
 * Estimates daily Total Daily Energy Expenditure (TDEE) using Mifflin-St Jeor.
 * Used to give users a starting point for their calorie targets.
 *
 * @param weightKg  body weight in kg
 * @param heightCm  height in cm
 * @param age       age in years
 * @param gender    "male" | "female"
 * @param activityMultiplier  1.2=sedentary, 1.375=light, 1.55=moderate, 1.725=very active
 */
export function estimateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female",
  activityMultiplier = 1.55
): number {
  // Mifflin-St Jeor BMR
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  return Math.round(bmr * activityMultiplier);
}

/**
 * Calculates recommended macro targets from calorie goal.
 * Uses a protein-first approach appropriate for gym-goers.
 *
 * @param targetKcal     total calorie target
 * @param weightKg       body weight (for protein calculation)
 * @param goal           user goal — affects macro split
 */
export function recommendedMacros(
  targetKcal: number,
  weightKg: number,
  goal: string
): { protein_g: number; fat_g: number; carbs_g: number } {
  // Protein: 2.0–2.2 g/kg for fat loss/recomp, 1.8 g/kg for muscle gain
  const proteinMultiplier =
    goal === "muscle_gain" ? 1.8 : goal === "fat_loss" || goal === "recomp" ? 2.2 : 2.0;
  const protein_g = Math.round(weightKg * proteinMultiplier);

  // Fat: 25–30% of total calories
  const fatPct = goal === "keto" ? 0.70 : 0.28;
  const fat_g = Math.round((targetKcal * fatPct) / 9);

  // Carbs: remainder after protein and fat
  const proteinKcal = protein_g * 4;
  const fatKcal = fat_g * 9;
  const carbs_g = Math.max(0, Math.round((targetKcal - proteinKcal - fatKcal) / 4));

  return { protein_g, fat_g, carbs_g };
}
