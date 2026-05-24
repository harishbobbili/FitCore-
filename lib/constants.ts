import type { BadgeDefinition, ExerciseDefinition, FoodDefinition, MealSlot } from "@/lib/types";

export const USER_PROFILE = {
  name: "Gym Goer",
  heightCm: 162.5,
  weightKg: 63,
  level: "Intermediate",
  goal: "Fat Loss + Visible Abs",
  trainingDaysPerWeek: "5-6",
};

export const DAILY_GOALS = {
  MAINTENANCE_CALORIES: 2200,
  DEFICIT_CALORIES: 1800,
  PROTEIN_GOAL: 120,
  WATER_GOAL: 3000,
  STEP_GOAL: 9000,
};

export const MACRO_RATIOS = {
  PROTEIN: 120,
  FATS: 60,
  CARBS: 195,
};

export const FOOD_DATABASE: FoodDefinition[] = [
  { name: "Oats", calories: 366, protein: 13, carbs: 56, fat: 7, defaultWeightGrams: 77 },
  { name: "Chicken breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, defaultWeightGrams: 100 },
  { name: "Brown rice (cooked)", calories: 112, protein: 2.3, carbs: 23, fat: 0.9, defaultWeightGrams: 80 },
  { name: "Whole eggs", calories: 155, protein: 13, carbs: 1.1, fat: 11, defaultWeightGrams: 100 },
  { name: "Egg whites", calories: 52, protein: 11, carbs: 0.7, fat: 0.2, defaultWeightGrams: 150 },
  { name: "Soya chunks dry", calories: 345, protein: 52, carbs: 26, fat: 0.5, defaultWeightGrams: 50 },
  { name: "Curd low-fat", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, defaultWeightGrams: 100 },
  { name: "Peanut butter", calories: 588, protein: 25, carbs: 20, fat: 50, defaultWeightGrams: 15 },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, defaultWeightGrams: 120 },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, defaultWeightGrams: 150 },
  { name: "Whey protein", calories: 400, protein: 80, carbs: 8, fat: 5, defaultWeightGrams: 30 },
  { name: "Mixed Vegetables", calories: 35, protein: 2, carbs: 7, fat: 0.2, defaultWeightGrams: 100 },
  { name: "Paneer", calories: 265, protein: 18, carbs: 2, fat: 20, defaultWeightGrams: 100 },
  { name: "Tofu", calories: 144, protein: 17, carbs: 3, fat: 8, defaultWeightGrams: 100 },
  { name: "Greek yogurt", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, defaultWeightGrams: 100 },
  { name: "Rajma", calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5, defaultWeightGrams: 100 },
  { name: "Moong dal", calories: 105, protein: 7, carbs: 19, fat: 0.4, defaultWeightGrams: 100 },
  { name: "Poha", calories: 110, protein: 2.4, carbs: 23, fat: 1.0, defaultWeightGrams: 100 },
  { name: "Roti", calories: 297, protein: 8.8, carbs: 49, fat: 7.5, defaultWeightGrams: 60 },
  { name: "Idli", calories: 146, protein: 4.2, carbs: 28, fat: 0.7, defaultWeightGrams: 50 },
  { name: "Dosa", calories: 181, protein: 3.5, carbs: 27, fat: 6.8, defaultWeightGrams: 100 },
  { name: "Upma", calories: 119, protein: 3.1, carbs: 22, fat: 2.9, defaultWeightGrams: 100 },
  { name: "Millet", calories: 378, protein: 11, carbs: 73, fat: 4.2, defaultWeightGrams: 100 },
  { name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, defaultWeightGrams: 100 },
  { name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, defaultWeightGrams: 100 },
];

export const MEAL_SLOTS: MealSlot[] = [
  "breakfast",
  "pre_workout",
  "lunch",
  "post_workout",
  "dinner",
  "snack",
];

export const EXERCISE_LIST: Record<string, ExerciseDefinition[]> = {
  "chest-triceps": [
    { name: "Incline Dumbbell Press", muscleGroup: "Upper Chest", type: "compound" },
    { name: "Pec Fly", muscleGroup: "Chest / Inner Chest", type: "isolation" },
    { name: "Lower Chest Machine", muscleGroup: "Lower Chest", type: "isolation" },
    { name: "Push-ups", muscleGroup: "Chest / Triceps", type: "isolation" },
    { name: "Tricep Pushdown", muscleGroup: "Triceps / Lateral Head", type: "isolation" },
    { name: "Skull Crushers", muscleGroup: "Triceps / Long Head", type: "isolation" },
  ],
  "back-biceps": [
    { name: "Pull-ups", muscleGroup: "Lats", type: "compound" },
    { name: "Lat Pulldown", muscleGroup: "Lats", type: "compound" },
    { name: "Barbell Row", muscleGroup: "Mid Back", type: "compound" },
    { name: "Seated Cable Row", muscleGroup: "Mid Back", type: "compound" },
    { name: "Barbell Curl", muscleGroup: "Biceps", type: "isolation" },
    { name: "Hammer Curl", muscleGroup: "Biceps / Brachialis", type: "isolation" },
  ],
  "shoulders-abs": [
    { name: "Overhead Press", muscleGroup: "Anterior Delts", type: "compound" },
    { name: "Lateral Raise", muscleGroup: "Side Delts", type: "isolation" },
    { name: "Rear Delt Fly", muscleGroup: "Rear Delts", type: "isolation" },
    { name: "Cable Crunch", muscleGroup: "Abs", type: "isolation" },
    { name: "Hanging Leg Raise", muscleGroup: "Lower Abs", type: "isolation" },
    { name: "Plank", muscleGroup: "Core", type: "isolation" },
  ],
  legs: [
    { name: "Squat", muscleGroup: "Quads", type: "compound" },
    { name: "Romanian Deadlift", muscleGroup: "Hamstrings", type: "compound" },
    { name: "Leg Press", muscleGroup: "Quads", type: "compound" },
    { name: "Lunge", muscleGroup: "Glutes / Quads", type: "compound" },
    { name: "Leg Curl", muscleGroup: "Hamstrings", type: "isolation" },
    { name: "Calf Raise", muscleGroup: "Calves", type: "isolation" },
  ],
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first-step", title: "First Step", icon: "🏃", description: "Log your first workout session.", triggerType: "workout_count", threshold: 1 },
  { id: "week-warrior", title: "Week Warrior", icon: "🔥", description: "Maintain a 7-day workout streak.", triggerType: "streak", threshold: 7 },
  { id: "iron-will", title: "Iron Will", icon: "💪", description: "Maintain a 30-day workout streak.", triggerType: "streak", threshold: 30 },
  { id: "protein-king", title: "Protein King", icon: "🥩", description: "Hit protein goal 7 days in a row.", triggerType: "protein_streak", threshold: 7 },
  { id: "calorie-crusher", title: "Calorie Crusher", icon: "⚡", description: "Stay in calorie deficit 14 days straight.", triggerType: "deficit_streak", threshold: 14 },
  { id: "pr-machine", title: "PR Machine", icon: "🏆", description: "Log 5 personal records.", triggerType: "pr_count", threshold: 5 },
  { id: "ab-sculptor", title: "Ab Sculptor", icon: "🎯", description: "Complete abs routine 10 times.", triggerType: "abs_sessions", threshold: 10 },
  { id: "cardio-fiend", title: "Cardio Fiend", icon: "🏅", description: "Log 10 cardio sessions.", triggerType: "cardio_count", threshold: 10 },
  { id: "step-master", title: "10K Steps", icon: "👟", description: "Hit step goal 5 days in a row.", triggerType: "steps_streak", threshold: 5 },
  { id: "transformation", title: "Transformation", icon: "📸", description: "Upload 10 progress photos.", triggerType: "photo_count", threshold: 10 },
  { id: "hydration-hero", title: "Hydration Hero", icon: "💧", description: "Log 3L water 7 days straight.", triggerType: "water_streak", threshold: 7 },
  { id: "century", title: "Century", icon: "💯", description: "Log 100 total workouts.", triggerType: "workout_count", threshold: 100 },
  { id: "dream-physique", title: "Dream Physique", icon: "✨", description: "Reach your goal weight.", triggerType: "goal_weight", threshold: 1 },
  { id: "night-owl", title: "Night Owl", icon: "😴", description: "Log sleep 30 days straight.", triggerType: "sleep_streak", threshold: 30 },
  { id: "diet-master", title: "Diet Master", icon: "🥗", description: "Log all 6 meals for 7 days straight.", triggerType: "full_meal_day_streak", threshold: 7 },
];
