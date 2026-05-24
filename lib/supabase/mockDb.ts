import { 
  UserRow, 
  DailyLogRow, 
  MealRow, 
  WorkoutSessionRow, 
  ExerciseSetRow, 
  CardioLogRow, 
  BodyMetricsRow, 
  StreakRow, 
  AchievementRow 
} from "@/types/database.types";

// Helper to format date strings as YYYY-MM-DD relative to today
const getRelativeDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
};

// --- INITIAL SEED DATA ---
const mockUsers: UserRow[] = [
  {
    id: "00000000-0000-0000-0000-000000000000",
    email: "gymgoer@fitcore.app",
    name: "Gym Goer",
    height_cm: 162.5,
    weight_kg: 63.0,
    goal: "Fat Loss + Visible Abs",
    experience_level: "Intermediate",
    avatar_url: null,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const mockDailyLogs: DailyLogRow[] = [];
const mockMeals: MealRow[] = [];
const mockWorkoutSessions: WorkoutSessionRow[] = [];
const mockExerciseSets: ExerciseSetRow[] = [];
const mockCardioLogs: CardioLogRow[] = [];
const mockBodyMetrics: BodyMetricsRow[] = [];
const mockStreaks: StreakRow[] = [
  {
    id: "streak-1",
    user_id: "00000000-0000-0000-0000-000000000000",
    current_streak: 5,
    longest_streak: 12,
    last_workout_date: getRelativeDateString(-1),
  }
];
const mockAchievements: AchievementRow[] = [
  {
    id: "ach-1",
    user_id: "00000000-0000-0000-0000-000000000000",
    badge_id: "first_workout",
    earned_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ach-2",
    user_id: "00000000-0000-0000-0000-000000000000",
    badge_id: "perfect_week_nutrition",
    earned_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ach-3",
    user_id: "00000000-0000-0000-0000-000000000000",
    badge_id: "step_master",
    earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Prepopulate last 7 days of daily logs (Day -6 to Day 0/Today)
const seedMockData = () => {
  const userId = "00000000-0000-0000-0000-000000000000";
  
  // Weights over the week trending down slightly from 63.5 to 63.0
  const weights = [63.5, 63.4, 63.4, 63.2, 63.3, 63.1, 63.0];
  const steps = [9200, 10500, 8900, 9400, 11200, 9800, 9100];
  const sleep = [7.5, 8.0, 7.0, 7.8, 8.2, 6.8, 7.5];
  const water = [3100, 2800, 3000, 3300, 2900, 3200, 3000];
  
  // Macros around the 1800 deficit target: protein ~120, carbs ~195, fats ~60
  const protein = [121, 118, 125, 120, 122, 119, 120];
  const carbs = [190, 185, 205, 195, 200, 192, 195];
  const fats = [58, 62, 57, 60, 59, 61, 60];

  for (let i = -6; i <= 0; i++) {
    const idx = i + 6;
    const dateStr = getRelativeDateString(i);
    const dayCalories = (protein[idx] * 4) + (carbs[idx] * 4) + (fats[idx] * 9);
    
    const logId = `log-${idx}`;
    mockDailyLogs.push({
      id: logId,
      user_id: userId,
      date: dateStr,
      calories_consumed: dayCalories,
      protein_g: protein[idx],
      carbs_g: carbs[idx],
      fat_g: fats[idx],
      water_ml: water[idx],
      steps: steps[idx],
      sleep_hours: sleep[idx],
      mood_score: 4 + (idx % 2),
      weight_kg: weights[idx],
    });

    // Let's seed meals for yesterday and today
    if (i === -1 || i === 0) {
      mockMeals.push(
        {
          id: `meal-${idx}-breakfast`,
          user_id: userId,
          log_id: logId,
          meal_slot: "breakfast",
          name: "Egg White Omelette with Oats",
          food_name: "Egg White Omelette with Oats",
          calories: 420,
          protein_g: 35,
          carbs_g: 45,
          fat_g: 10,
          time_logged: `${dateStr}T08:30:00Z`
        },
        {
          id: `meal-${idx}-lunch`,
          user_id: userId,
          log_id: logId,
          meal_slot: "lunch",
          name: "Grilled Chicken Salad with Rice",
          food_name: "Grilled Chicken Salad with Rice",
          calories: 550,
          protein_g: 45,
          carbs_g: 65,
          fat_g: 12,
          time_logged: `${dateStr}T13:15:00Z`
        },
        {
          id: `meal-${idx}-snack`,
          user_id: userId,
          log_id: logId,
          meal_slot: "snack",
          name: "Whey Protein Shake & Almonds",
          food_name: "Whey Protein Shake & Almonds",
          calories: 280,
          protein_g: 30,
          carbs_g: 10,
          fat_g: 13,
          time_logged: `${dateStr}T16:30:00Z`
        },
        {
          id: `meal-${idx}-dinner`,
          user_id: userId,
          log_id: logId,
          meal_slot: "dinner",
          name: "Baked Salmon & Broccoli",
          food_name: "Baked Salmon & Broccoli",
          calories: 520,
          protein_g: 38,
          carbs_g: 42,
          fat_g: 22,
          time_logged: `${dateStr}T19:45:00Z`
        }
      );
    }
  }

  // Seed some workout sessions
  // Session 1: Pull Day 4 days ago
  const s1Id = "session-1";
  mockWorkoutSessions.push({
    id: s1Id,
    user_id: userId,
    date: getRelativeDateString(-4),
    split_name: "Pull (Back, Biceps)",
    duration_mins: 60,
    calories_burned: 350,
    notes: "Felt strong on lat pulldowns today.",
  });
  
  mockExerciseSets.push(
    { id: "set-1", session_id: s1Id, exercise_name: "Weighted Pull-ups", set_number: 1, reps: 8, weight_kg: 5, rest_seconds: 90, is_pr: false },
    { id: "set-2", session_id: s1Id, exercise_name: "Weighted Pull-ups", set_number: 2, reps: 8, weight_kg: 5, rest_seconds: 90, is_pr: false },
    { id: "set-3", session_id: s1Id, exercise_name: "Weighted Pull-ups", set_number: 3, reps: 6, weight_kg: 5, rest_seconds: 90, is_pr: false },
    { id: "set-4", session_id: s1Id, exercise_name: "Lat Pulldowns", set_number: 1, reps: 10, weight_kg: 55, rest_seconds: 75, is_pr: false },
    { id: "set-5", session_id: s1Id, exercise_name: "Lat Pulldowns", set_number: 2, reps: 10, weight_kg: 55, rest_seconds: 75, is_pr: false },
    { id: "set-6", session_id: s1Id, exercise_name: "Lat Pulldowns", set_number: 3, reps: 8, weight_kg: 60, rest_seconds: 75, is_pr: true }
  );

  // Session 2: Push Day 2 days ago
  const s2Id = "session-2";
  mockWorkoutSessions.push({
    id: s2Id,
    user_id: userId,
    date: getRelativeDateString(-2),
    split_name: "Push (Chest, Shoulders, Triceps)",
    duration_mins: 65,
    calories_burned: 400,
    notes: "Hit a PR on Dumbbell Shoulder Press!",
  });

  mockExerciseSets.push(
    { id: "set-7", session_id: s2Id, exercise_name: "Incline Dumbbell Press", set_number: 1, reps: 10, weight_kg: 22, rest_seconds: 90, is_pr: false },
    { id: "set-8", session_id: s2Id, exercise_name: "Incline Dumbbell Press", set_number: 2, reps: 9, weight_kg: 22, rest_seconds: 90, is_pr: false },
    { id: "set-9", session_id: s2Id, exercise_name: "Incline Dumbbell Press", set_number: 3, reps: 8, weight_kg: 22, rest_seconds: 90, is_pr: false },
    { id: "set-10", session_id: s2Id, exercise_name: "Dumbbell Shoulder Press", set_number: 1, reps: 10, weight_kg: 18, rest_seconds: 90, is_pr: false },
    { id: "set-11", session_id: s2Id, exercise_name: "Dumbbell Shoulder Press", set_number: 2, reps: 8, weight_kg: 20, rest_seconds: 90, is_pr: true }
  );

  // Session 3: Legs Day Yesterday
  const s3Id = "session-3";
  mockWorkoutSessions.push({
    id: s3Id,
    user_id: userId,
    date: getRelativeDateString(-1),
    split_name: "Legs (Quads, Hamstrings)",
    duration_mins: 70,
    calories_burned: 450,
    notes: "Squats felt deep and controlled.",
  });

  mockExerciseSets.push(
    { id: "set-12", session_id: s3Id, exercise_name: "Barbell Squats", set_number: 1, reps: 8, weight_kg: 70, rest_seconds: 120, is_pr: false },
    { id: "set-13", session_id: s3Id, exercise_name: "Barbell Squats", set_number: 2, reps: 8, weight_kg: 70, rest_seconds: 120, is_pr: false },
    { id: "set-14", session_id: s3Id, exercise_name: "Barbell Squats", set_number: 3, reps: 6, weight_kg: 75, rest_seconds: 120, is_pr: true }
  );

  // Seed cardio logs
  mockCardioLogs.push(
    {
      id: "cardio-1",
      user_id: userId,
      date: getRelativeDateString(-5),
      type: "walk",
      duration_mins: 45,
      distance_km: 4.2,
      calories_burned: 220,
      avg_heart_rate: 105,
      incline_pct: 4.0
    },
    {
      id: "cardio-2",
      user_id: userId,
      date: getRelativeDateString(-3),
      type: "hiit",
      duration_mins: 20,
      distance_km: 2.5,
      calories_burned: 250,
      avg_heart_rate: 155,
      incline_pct: 0.0
    },
    {
      id: "cardio-3",
      user_id: userId,
      date: getRelativeDateString(-1),
      type: "run",
      duration_mins: 30,
      distance_km: 5.0,
      calories_burned: 320,
      avg_heart_rate: 145,
      incline_pct: 1.0
    }
  );

  // Seed weekly body metrics
  mockBodyMetrics.push(
    {
      id: "metrics-1",
      user_id: userId,
      date: getRelativeDateString(-21),
      weight_kg: 64.5,
      body_fat_pct: 14.2,
      chest_cm: 94.0,
      waist_cm: 77.0,
      hip_cm: 91.0,
      notes: "Starting metrics."
    },
    {
      id: "metrics-2",
      user_id: userId,
      date: getRelativeDateString(-14),
      weight_kg: 63.8,
      body_fat_pct: 13.5,
      chest_cm: 94.0,
      waist_cm: 76.0,
      hip_cm: 90.0,
      notes: "Nice drop in waist size."
    },
    {
      id: "metrics-3",
      user_id: userId,
      date: getRelativeDateString(-7),
      weight_kg: 63.3,
      body_fat_pct: 13.0,
      chest_cm: 93.8,
      waist_cm: 75.2,
      hip_cm: 89.5,
      notes: "Feeling leaner."
    },
    {
      id: "metrics-4",
      user_id: userId,
      date: getRelativeDateString(0),
      weight_kg: 63.0,
      body_fat_pct: 12.5,
      chest_cm: 93.8,
      waist_cm: 74.5,
      hip_cm: 89.0,
      notes: "Target weight hit! Abs starting to peak through."
    }
  );
};

// Run seed immediately
seedMockData();

// --- MOCK DATABASE OPERATIONS ---

export const mockDb = {
  // USERS
  getUser: async (id: string): Promise<UserRow | null> => {
    return mockUsers.find(u => u.id === id) || null;
  },

  updateUser: async (id: string, updates: Partial<UserRow>): Promise<UserRow> => {
    const idx = mockUsers.findIndex(u => u.id === id);
    if (idx === -1) throw new Error("User not found");
    mockUsers[idx] = { ...mockUsers[idx], ...updates };
    return mockUsers[idx];
  },

  // DAILY LOGS
  getDailyLog: async (userId: string, date: string): Promise<DailyLogRow | null> => {
    return mockDailyLogs.find(l => l.user_id === userId && l.date === date) || null;
  },

  upsertDailyLog: async (userId: string, date: string, data: Partial<DailyLogRow>): Promise<DailyLogRow> => {
    const existingIdx = mockDailyLogs.findIndex(l => l.user_id === userId && l.date === date);
    
    if (existingIdx !== -1) {
      mockDailyLogs[existingIdx] = {
        ...mockDailyLogs[existingIdx],
        ...data,
        // Make sure we update calculated calories if macros changed
        calories_consumed: (
          (data.protein_g ?? mockDailyLogs[existingIdx].protein_g) * 4 +
          (data.carbs_g ?? mockDailyLogs[existingIdx].carbs_g) * 4 +
          (data.fat_g ?? mockDailyLogs[existingIdx].fat_g) * 9
        )
      };
      return mockDailyLogs[existingIdx];
    } else {
      const newLog: DailyLogRow = {
        id: `log-${Date.now()}`,
        user_id: userId,
        date: date,
        calories_consumed: ((data.protein_g ?? 0) * 4) + ((data.carbs_g ?? 0) * 4) + ((data.fat_g ?? 0) * 9),
        protein_g: data.protein_g ?? 0,
        carbs_g: data.carbs_g ?? 0,
        fat_g: data.fat_g ?? 0,
        water_ml: data.water_ml ?? 0,
        steps: data.steps ?? 0,
        sleep_hours: data.sleep_hours ?? 0,
        mood_score: data.mood_score ?? null,
        weight_kg: data.weight_kg ?? null,
      };
      mockDailyLogs.push(newLog);
      return newLog;
    }
  },

  // MEALS
  getMeals: async (userId: string, date: string): Promise<MealRow[]> => {
    // Extract date prefix for comparison YYYY-MM-DD
    return mockMeals.filter(m => m.user_id === userId && m.time_logged.startsWith(date));
  },

  addMeal: async (userId: string, meal: Omit<MealRow, "id" | "user_id" | "time_logged"> & { time_logged?: string }): Promise<MealRow> => {
    const newMeal: MealRow = {
      id: `meal-${Date.now()}`,
      user_id: userId,
      log_id: meal.log_id || null,
      meal_slot: meal.meal_slot,
      name: meal.name,
      food_name: meal.food_name || meal.name || "Meal",
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      time_logged: meal.time_logged || new Date().toISOString(),
    };
    mockMeals.push(newMeal);

    // If log_id is provided, automatically aggregate macros for that log
    if (newMeal.log_id) {
      const logIdx = mockDailyLogs.findIndex(l => l.id === newMeal.log_id);
      if (logIdx !== -1) {
        mockDailyLogs[logIdx].calories_consumed += newMeal.calories;
        mockDailyLogs[logIdx].protein_g += newMeal.protein_g;
        mockDailyLogs[logIdx].carbs_g += newMeal.carbs_g;
        mockDailyLogs[logIdx].fat_g += newMeal.fat_g;
      }
    } else {
      // Find or create daily log for the meal's date
      const mealDate = newMeal.time_logged.split("T")[0];
      const log = await mockDb.upsertDailyLog(userId, mealDate, {});
      newMeal.log_id = log.id;
      
      // Update log macros
      const logIdx = mockDailyLogs.findIndex(l => l.id === log.id);
      if (logIdx !== -1) {
        mockDailyLogs[logIdx].calories_consumed += newMeal.calories;
        mockDailyLogs[logIdx].protein_g += newMeal.protein_g;
        mockDailyLogs[logIdx].carbs_g += newMeal.carbs_g;
        mockDailyLogs[logIdx].fat_g += newMeal.fat_g;
      }
    }

    return newMeal;
  },

  deleteMeal: async (userId: string, mealId: string): Promise<void> => {
    const mealIdx = mockMeals.findIndex(m => m.id === mealId && m.user_id === userId);
    if (mealIdx === -1) throw new Error("Meal not found");
    
    const meal = mockMeals[mealIdx];
    
    // If log_id is provided, subtract macros from that log
    if (meal.log_id) {
      const logIdx = mockDailyLogs.findIndex(l => l.id === meal.log_id);
      if (logIdx !== -1) {
        mockDailyLogs[logIdx].calories_consumed -= meal.calories;
        mockDailyLogs[logIdx].protein_g -= meal.protein_g;
        mockDailyLogs[logIdx].carbs_g -= meal.carbs_g;
        mockDailyLogs[logIdx].fat_g -= meal.fat_g;
      }
    }
    
    mockMeals.splice(mealIdx, 1);
  },

  // WORKOUT SESSIONS
  createWorkoutSession: async (userId: string, date: string, splitName: string, durationMins: number, notes?: string): Promise<WorkoutSessionRow> => {
    // Check if session for date and split already exists
    const newSession: WorkoutSessionRow = {
      id: `session-${Date.now()}`,
      user_id: userId,
      date: date,
      split_name: splitName,
      duration_mins: durationMins,
      calories_burned: durationMins * 6, // rough estimate: 6 kcal/min
      notes: notes || null,
    };
    mockWorkoutSessions.push(newSession);

    // Update streak when workout is created
    await mockDb.updateStreak(userId, date);

    return newSession;
  },

  // EXERCISE SETS
  logExerciseSets: async (sessionId: string, sets: Omit<ExerciseSetRow, "id" | "session_id">[]): Promise<ExerciseSetRow[]> => {
    const loggedSets: ExerciseSetRow[] = [];

    // Find parent session to get user_id (for historical PR check)
    const session = mockWorkoutSessions.find(s => s.id === sessionId);
    const userId = session?.user_id || "00000000-0000-0000-0000-000000000000";

    for (const setData of sets) {
      // PR logic: check if weight_kg is greater than any past weight logged for this exercise
      const history = await mockDb.getExerciseHistory(userId, setData.exercise_name);
      
      let isPr = false;
      if (history.length === 0) {
        isPr = true; // First time logging this exercise is a PR
      } else {
        const maxPastWeight = Math.max(...history.map(s => s.weight_kg));
        if (setData.weight_kg > maxPastWeight) {
          isPr = true;
        } else if (setData.weight_kg === maxPastWeight) {
          // If weight is same, check if reps are higher at this weight
          const maxRepsAtWeight = Math.max(...history.filter(s => s.weight_kg === maxPastWeight).map(s => s.reps));
          if (setData.reps > maxRepsAtWeight) {
            isPr = true;
          }
        }
      }

      const newSet: ExerciseSetRow = {
        id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        session_id: sessionId,
        exercise_name: setData.exercise_name,
        set_number: setData.set_number,
        reps: setData.reps,
        weight_kg: setData.weight_kg,
        rest_seconds: setData.rest_seconds ?? 90,
        is_pr: isPr,
      };

      mockExerciseSets.push(newSet);
      loggedSets.push(newSet);
    }

    return loggedSets;
  },

  // EXERCISE HISTORY & PR CALCULATIONS
  getExerciseHistory: async (userId: string, exerciseName: string): Promise<ExerciseSetRow[]> => {
    // Find all sessions for this user
    const userSessionIds = mockWorkoutSessions
      .filter(s => s.user_id === userId)
      .map(s => s.id);
    
    // Return sets associated with these sessions matching the exercise name
    return mockExerciseSets.filter(s => userSessionIds.includes(s.session_id) && s.exercise_name.toLowerCase() === exerciseName.toLowerCase());
  },

  // CARDIO LOGS
  getCardioLogs: async (userId: string, date: string, startDate?: string, endDate?: string): Promise<CardioLogRow[]> => {
    if (startDate && endDate) {
      return mockCardioLogs.filter(l => l.user_id === userId && l.date >= startDate && l.date <= endDate);
    }
    return mockCardioLogs.filter(l => l.user_id === userId && l.date === date);
  },

  logCardio: async (userId: string, data: Omit<CardioLogRow, "id" | "user_id">): Promise<CardioLogRow> => {
    const newCardio: CardioLogRow = {
      id: `cardio-${Date.now()}`,
      user_id: userId,
      date: data.date || getRelativeDateString(0),
      type: data.type,
      duration_mins: data.duration_mins || 0,
      distance_km: data.distance_km || 0,
      calories_burned: data.calories_burned || 0,
      avg_heart_rate: data.avg_heart_rate || null,
      incline_pct: data.incline_pct || 0,
    };
    mockCardioLogs.push(newCardio);
    return newCardio;
  },

  // BODY METRICS
  getBodyMetrics: async (userId: string): Promise<BodyMetricsRow[]> => {
    return mockBodyMetrics.filter(m => m.user_id === userId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  logBodyMetrics: async (userId: string, data: Omit<BodyMetricsRow, "id" | "user_id">): Promise<BodyMetricsRow> => {
    const newMetric: BodyMetricsRow = {
      id: `metrics-${Date.now()}`,
      user_id: userId,
      date: data.date || getRelativeDateString(0),
      weight_kg: data.weight_kg,
      body_fat_pct: data.body_fat_pct || null,
      chest_cm: data.chest_cm || null,
      waist_cm: data.waist_cm || null,
      hip_cm: data.hip_cm || null,
      notes: data.notes || null,
    };
    mockBodyMetrics.push(newMetric);

    // Also update current weight on user row and daily log
    const userIdx = mockUsers.findIndex(u => u.id === userId);
    if (userIdx !== -1) {
      mockUsers[userIdx].weight_kg = data.weight_kg;
    }

    const logDate = data.date.split("T")[0];
    await mockDb.upsertDailyLog(userId, logDate, { weight_kg: data.weight_kg });

    return newMetric;
  },

  // STREAKS
  getStreak: async (userId: string): Promise<StreakRow> => {
    let streak = mockStreaks.find(s => s.user_id === userId);
    if (!streak) {
      streak = {
        id: `streak-${Date.now()}`,
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_workout_date: null,
      };
      mockStreaks.push(streak);
    }
    return streak;
  },

  updateStreak: async (userId: string, date: string): Promise<StreakRow> => {
    const streak = await mockDb.getStreak(userId);
    const lastWorkout = streak.last_workout_date;
    
    if (!lastWorkout) {
      streak.current_streak = 1;
      streak.longest_streak = Math.max(streak.longest_streak, 1);
    } else {
      const last = new Date(lastWorkout);
      const current = new Date(date);
      const diffTime = Math.abs(current.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        streak.current_streak += 1;
        streak.longest_streak = Math.max(streak.longest_streak, streak.current_streak);
      } else if (diffDays > 1) {
        // Streak broken
        streak.current_streak = 1;
      }
      // If diffDays === 0, same day workout, streak stays same
    }

    streak.last_workout_date = date;
    
    const idx = mockStreaks.findIndex(s => s.user_id === userId);
    if (idx !== -1) {
      mockStreaks[idx] = streak;
    }
    
    return streak;
  },

  // ACHIEVEMENTS
  getAchievements: async (userId: string): Promise<AchievementRow[]> => {
    return mockAchievements.filter(a => a.user_id === userId);
  },

  // WEEKLY ANALYTICS AGGREGATION
  getWeeklyAnalytics: async (userId: string) => {
    // Get last 7 days of daily logs (including today)
    const dates = Array.from({ length: 7 }, (_, i) => getRelativeDateString(-6 + i));
    
    const logs = dates.map(date => {
      const log = mockDailyLogs.find(l => l.user_id === userId && l.date === date);
      if (log) return log;
      
      // Return empty stats log if no entry
      return {
        id: "",
        user_id: userId,
        date: date,
        calories_consumed: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        water_ml: 0,
        steps: 0,
        sleep_hours: 0,
        mood_score: null,
        weight_kg: null,
      };
    });

    // Calculate averages and totals
    const activeLogs = logs.filter(l => l.id !== "");
    const loggedDays = activeLogs.length || 1;

    const totalCalories = activeLogs.reduce((acc, curr) => acc + curr.calories_consumed, 0);
    const totalProtein = activeLogs.reduce((acc, curr) => acc + curr.protein_g, 0);
    const totalSteps = activeLogs.reduce((acc, curr) => acc + curr.steps, 0);
    const totalSleepHours = activeLogs.reduce((acc, curr) => acc + curr.sleep_hours, 0);
    const totalWater = activeLogs.reduce((acc, curr) => acc + curr.water_ml, 0);

    const weights = activeLogs.map(l => l.weight_kg).filter((w): w is number => w !== null);
    const avgWeight = weights.length ? (weights.reduce((acc, curr) => acc + curr, 0) / weights.length) : null;

    // Get workout count for the last 7 days
    const sevenDaysAgo = new Date(getRelativeDateString(-6));
    const weeklyWorkouts = mockWorkoutSessions.filter(s => {
      return s.user_id === userId && new Date(s.date) >= sevenDaysAgo;
    });

    return {
      daily_history: logs,
      summary: {
        avg_calories: Math.round(totalCalories / loggedDays),
        avg_protein: Math.round(totalProtein / loggedDays),
        avg_steps: Math.round(totalSteps / loggedDays),
        avg_sleep: Number((totalSleepHours / loggedDays).toFixed(1)),
        avg_water: Math.round(totalWater / loggedDays),
        avg_weight: avgWeight ? Number(avgWeight.toFixed(1)) : null,
        workout_count: weeklyWorkouts.length,
      }
    };
  }
};
