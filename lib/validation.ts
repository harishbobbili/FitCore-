import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const positiveNumber = z.number().nonnegative("Must be a non-negative number");
const positiveInt = z.number().int().nonnegative("Must be a non-negative integer");

// ─── Auth-related ─────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const SignupSchema = LoginSchema.extend({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

// ─── Meals ────────────────────────────────────────────────────────────────────

const MealSlotEnum = z.enum([
  "breakfast",
  "pre_workout",
  "lunch",
  "post_workout",
  "dinner",
  "snack",
]);

export const CreateMealSchema = z.object({
  meal_slot: MealSlotEnum,
  food_name: z.string().min(1, "Food name is required").max(200, "Food name too long").optional(),
  name: z.string().min(1, "Name is required").max(200, "Name too long").optional(),
  calories: z.number().nonnegative("Calories must be a non-negative number").max(9999, "Calories value is too high"),
  protein_g: positiveNumber.max(999, "Protein value is too high"),
  carbs_g: positiveNumber.max(999, "Carbs value is too high"),
  fat_g: positiveNumber.max(999, "Fat value is too high"),
  time_logged: z.string().optional(),
}).refine((data) => data.food_name || data.name, {
  message: "Either food_name or name must be provided",
  path: ["food_name"],
});

export const DeleteMealSchema = z.object({
  id: z.string().uuid("Invalid meal ID"),
});

// ─── Daily Log ────────────────────────────────────────────────────────────────

export const UpsertDailyLogSchema = z.object({
  date: dateString.optional(),
  calories_consumed: positiveNumber.max(10000, "Daily calories over 10,000 seems unrealistic").optional(),
  protein_g: positiveNumber.max(500, "Protein over 500g seems unrealistic").optional(),
  carbs_g: positiveNumber.max(1500, "Carbs over 1500g seems unrealistic").optional(),
  fat_g: positiveNumber.max(500, "Fat over 500g seems unrealistic").optional(),
  water_ml: positiveInt.max(99999).optional(),
  steps: positiveInt.max(999999).optional(),
  sleep_hours: z.number().min(0).max(24, "Sleep hours must be between 0 and 24").optional(),
  mood_score: z.number().int().min(1).max(10, "Mood score must be between 1 and 10").optional(),
  weight_kg: z.number().positive("Weight must be positive").max(999, "Weight value is too high").optional(),
});

// ─── Cardio ───────────────────────────────────────────────────────────────────

const CardioTypeEnum = z.enum(["walk", "run", "hiit", "jump_rope"]);

export const CreateCardioSchema = z.object({
  date: dateString.optional(),
  type: CardioTypeEnum,
  duration_mins: z
    .number()
    .positive("Duration must be greater than 0")
    .max(1440, "Duration cannot exceed 24 hours"),
  distance_km: positiveNumber.max(9999).optional(),
  calories_burned: positiveNumber.max(99999).optional(),
  avg_heart_rate: z.number().int().min(30).max(250, "Heart rate seems unrealistic").optional().nullable(),
  incline_pct: z.number().min(0).max(100, "Incline cannot exceed 100%").optional(),
});

// ─── Body Metrics ─────────────────────────────────────────────────────────────

export const CreateBodyMetricSchema = z.object({
  date: dateString.optional(),
  weight_kg: z
    .number()
    .positive("Weight must be positive")
    .max(999, "Weight value is too high"),
  body_fat_pct: z.number().min(3, "Body fat % below 3% is physiologically impossible").max(60, "Above 60% seems unrealistic").optional().nullable(),
  chest_cm: positiveNumber.max(999).optional().nullable(),
  waist_cm: positiveNumber.max(999).optional().nullable(),
  hip_cm: positiveNumber.max(999).optional().nullable(),
  notes: z.string().max(500, "Notes too long").optional().nullable(),
});

// ─── Workout ─────────────────────────────────────────────────────────────────

const WorkoutSplitEnum = z.enum([
  "chest-triceps",
  "back-biceps",
  "shoulders-abs",
  "legs",
  "custom",
  "full-body",
  "push",
  "pull",
  "upper",
  "lower",
]);

export const CreateWorkoutSessionSchema = z.object({
  id: z.string().uuid("Invalid session ID").optional(),
  date: dateString.optional(),
  split_name: WorkoutSplitEnum.or(z.string().min(1).max(100)),
  duration_mins: z.number().positive().max(1440).optional(),
  notes: z.string().max(1000, "Notes too long").optional().nullable(),
  weight_kg: z.number().positive().max(999).optional(),
});

export const CreateExerciseSetSchema = z.object({
  session_id: z.string().uuid("Invalid session ID"),
  exercise_name: z.string().min(1, "Exercise name is required").max(100, "Exercise name too long"),
  set_number: z.number().int().positive("Set number must be positive").max(99),
  reps: z.number().int().nonnegative("Reps must be non-negative").max(9999),
  weight_kg: positiveNumber.max(9999, "Weight seems unrealistic"),
  rest_seconds: z.number().int().nonnegative().max(3600).optional(),
});

export const CreateExerciseSetsSchema = z
  .union([CreateExerciseSetSchema, z.array(CreateExerciseSetSchema)])
  .transform((val) => (Array.isArray(val) ? val : [val]));

// ─── AI endpoints ─────────────────────────────────────────────────────────────

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message content cannot be empty").max(8000, "Message too long"),
});

export const AiChatSchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Too many messages in history"),
});

export const AiWorkoutSuggestSchema = z.object({
  last_session_data: z
    .array(
      z.object({
        exercise_name: z.string().max(100),
        set_number: z.number().int().positive(),
        weight_kg: positiveNumber,
        reps: positiveInt,
      })
    )
    .max(100, "Too many sets provided")
    .optional()
    .default([]),
  fatigue_level: z.number().min(1).max(5).optional().default(3),
  days_since_rest: z.number().int().min(0).max(30).optional().default(2),
  current_week_volume: positiveInt.max(500).optional().default(12),
});

export const AiMealSuggestSchema = z.object({
  meal_slot: MealSlotEnum,
  remaining_kcal: positiveNumber.max(9999).optional().default(400),
  remaining_protein: positiveNumber.max(999).optional().default(25),
});

// ─── Progress photos ──────────────────────────────────────────────────────────

export const PhotoAngleEnum = z.enum(["front", "back", "side_left", "side_right"]);

// ─── Profile ──────────────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  height_cm: z.number().positive().max(300).optional(),
  weight_kg: z.number().positive().max(999).optional(),
  goal: z
    .enum(["fat_loss", "muscle_gain", "recomp", "maintenance", "endurance"])
    .optional(),
  experience: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  maintenance_kcal: positiveInt.max(99999).optional(),
  target_kcal: positiveInt.max(99999).optional(),
  protein_goal_g: positiveInt.max(9999).optional(),
  carbs_goal_g: positiveInt.max(9999).optional(),
  fat_goal_g: positiveInt.max(9999).optional(),
  water_goal_ml: positiveInt.max(99999).optional(),
  step_goal: positiveInt.max(999999).optional(),
  workout_days_per_week: z.number().int().min(0).max(7).optional(),
  dietary_preference: z
    .enum(["none", "vegetarian", "vegan", "keto", "paleo", "mediterranean", "indian"])
    .optional(),
  age: z.number().int().min(13).max(120).optional(),
  fitness_goal_detail: z.string().max(500).optional(),
});
