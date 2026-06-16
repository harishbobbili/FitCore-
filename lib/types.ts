export type MealSlot =
  | "breakfast"
  | "pre_workout"
  | "lunch"
  | "post_workout"
  | "dinner"
  | "snack";

export type WorkoutSplitKey =
  | "chest-triceps"
  | "back-biceps"
  | "shoulders-abs"
  | "legs";

export interface Profile {
  id: string;
  name: string | null;
  gender?: "male" | "female";
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  experience: string | null;
  maintenance_kcal: number | null;
  target_kcal: number | null;
  protein_goal_g: number | null;
  carbs_goal_g: number | null;
  fat_goal_g: number | null;
  water_goal_ml: number | null;
  step_goal: number | null;
  workout_days_per_week: number | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  calories_consumed: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  steps: number;
  sleep_hours: number;
  weight_kg: number | null;
  mood_score: number | null;
}

export interface Meal {
  id: string;
  user_id: string;
  log_id: string | null;
  date: string;
  meal_slot: MealSlot;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  date: string;
  split_name: string;
  started_at: string;
  finished_at: string | null;
  duration_mins: number | null;
  calories_burned: number | null;
  notes: string | null;
}

export interface ExerciseSet {
  id: string;
  session_id: string;
  user_id: string;
  exercise_name: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_secs: number | null;
  is_pr: boolean;
  logged_at: string;
}

export interface CardioLog {
  id: string;
  user_id: string;
  date: string;
  type: "walk" | "run" | "hiit" | "jump_rope" | null;
  duration_mins: number | null;
  distance_km: number | null;
  incline_pct: number | null;
  calories_burned: number | null;
  avg_heart_rate: number | null;
  logged_at: string;
}

export interface BodyMetric {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  hip_cm: number | null;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  icon?: string;
  description: string;
  triggerType:
    | "workout_count"
    | "streak"
    | "protein_streak"
    | "deficit_streak"
    | "pr_count"
    | "abs_sessions"
    | "cardio_count"
    | "steps_streak"
    | "photo_count"
    | "water_streak"
    | "goal_weight"
    | "sleep_streak"
    | "full_meal_day_streak";
  threshold: number;
}

export interface FoodDefinition {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  defaultWeightGrams: number;
}

export interface ExerciseDefinition {
  name: string;
  muscleGroup: string;
  type: "compound" | "isolation";
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  date: string;
  photo_url: string;
  angle: 'front' | 'back' | 'side_left' | 'side_right';
  weight_kg: number | null;
  notes: string | null;
  ai_analysis: BodyAnalysisResult | null;
  created_at: string;
  signed_url?: string; // Added by API response for temporary access
}

export interface BodyAnalysisResult {
  estimated_body_fat_pct: number | null;
  muscle_visibility: 'low' | 'medium' | 'high';
  posture_notes: string;
  progress_summary: string;
  recommendations: string[];
  comparison_to_previous: string | null;
  analyzed_at: string;
}
