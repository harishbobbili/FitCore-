export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          height_cm: number;
          weight_kg: number | null;
          goal: string;
          experience_level: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          height_cm?: number;
          weight_kg?: number | null;
          goal?: string;
          experience_level?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          height_cm?: number;
          weight_kg?: number | null;
          goal?: string;
          experience_level?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_logs: {
        Row: {
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
          mood_score: number | null;
          weight_kg: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          calories_consumed?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          water_ml?: number;
          steps?: number;
          sleep_hours?: number;
          mood_score?: number | null;
          weight_kg?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          calories_consumed?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          water_ml?: number;
          steps?: number;
          sleep_hours?: number;
          mood_score?: number | null;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          log_id: string | null;
          meal_slot: "breakfast" | "lunch" | "dinner" | "pre_workout" | "post_workout" | "snack";
          name: string;
          food_name: string | null;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          time_logged: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          log_id?: string | null;
          meal_slot: "breakfast" | "lunch" | "dinner" | "pre_workout" | "post_workout" | "snack";
          name: string;
          food_name?: string | null;
          calories?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          time_logged?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          log_id?: string | null;
          meal_slot?: "breakfast" | "lunch" | "dinner" | "pre_workout" | "post_workout" | "snack";
          name?: string;
          food_name?: string | null;
          calories?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          time_logged?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meals_log_id_fkey";
            columns: ["log_id"];
            referencedRelation: "daily_logs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meals_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          split_name: string;
          duration_mins: number;
          calories_burned: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          split_name: string;
          duration_mins?: number;
          calories_burned?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          split_name?: string;
          duration_mins?: number;
          calories_burned?: number;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      exercise_sets: {
        Row: {
          id: string;
          session_id: string;
          exercise_name: string;
          set_number: number;
          reps: number;
          weight_kg: number;
          rest_seconds: number;
          is_pr: boolean;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_name: string;
          set_number: number;
          reps: number;
          weight_kg: number;
          rest_seconds?: number;
          is_pr?: boolean;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_name?: string;
          set_number?: number;
          reps?: number;
          weight_kg?: number;
          rest_seconds?: number;
          is_pr?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_sets_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      cardio_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          type: "walk" | "run" | "hiit" | "jump_rope";
          duration_mins: number;
          distance_km: number;
          calories_burned: number;
          avg_heart_rate: number | null;
          incline_pct: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          type: "walk" | "run" | "hiit" | "jump_rope";
          duration_mins?: number;
          distance_km?: number;
          calories_burned?: number;
          avg_heart_rate?: number | null;
          incline_pct?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          type?: "walk" | "run" | "hiit" | "jump_rope";
          duration_mins?: number;
          distance_km?: number;
          calories_burned?: number;
          avg_heart_rate?: number | null;
          incline_pct?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cardio_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      body_metrics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight_kg: number;
          body_fat_pct: number | null;
          chest_cm: number | null;
          waist_cm: number | null;
          hip_cm: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          weight_kg: number;
          body_fat_pct?: number | null;
          chest_cm?: number | null;
          waist_cm?: number | null;
          hip_cm?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          weight_kg?: number;
          body_fat_pct?: number | null;
          chest_cm?: number | null;
          waist_cm?: number | null;
          hip_cm?: number | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "body_metrics_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_workout_date: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_workout_date?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_workout_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
  };
}

// Helper types for easy usage
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type DailyLogRow = Database["public"]["Tables"]["daily_logs"]["Row"];
export type DailyLogInsert = Database["public"]["Tables"]["daily_logs"]["Insert"];
export type DailyLogUpdate = Database["public"]["Tables"]["daily_logs"]["Update"];

export type MealRow = Database["public"]["Tables"]["meals"]["Row"];
export type MealInsert = Database["public"]["Tables"]["meals"]["Insert"];
export type MealUpdate = Database["public"]["Tables"]["meals"]["Update"];

export type WorkoutSessionRow = Database["public"]["Tables"]["workout_sessions"]["Row"];
export type WorkoutSessionInsert = Database["public"]["Tables"]["workout_sessions"]["Insert"];
export type WorkoutSessionUpdate = Database["public"]["Tables"]["workout_sessions"]["Update"];

export type ExerciseSetRow = Database["public"]["Tables"]["exercise_sets"]["Row"];
export type ExerciseSetInsert = Database["public"]["Tables"]["exercise_sets"]["Insert"];
export type ExerciseSetUpdate = Database["public"]["Tables"]["exercise_sets"]["Update"];

export type CardioLogRow = Database["public"]["Tables"]["cardio_logs"]["Row"];
export type CardioLogInsert = Database["public"]["Tables"]["cardio_logs"]["Insert"];
export type CardioLogUpdate = Database["public"]["Tables"]["cardio_logs"]["Update"];

export type BodyMetricsRow = Database["public"]["Tables"]["body_metrics"]["Row"];
export type BodyMetricsInsert = Database["public"]["Tables"]["body_metrics"]["Insert"];
export type BodyMetricsUpdate = Database["public"]["Tables"]["body_metrics"]["Update"];

export type StreakRow = Database["public"]["Tables"]["streaks"]["Row"];
export type StreakInsert = Database["public"]["Tables"]["streaks"]["Insert"];
export type StreakUpdate = Database["public"]["Tables"]["streaks"]["Update"];

export type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"];
export type AchievementInsert = Database["public"]["Tables"]["achievements"]["Insert"];
export type AchievementUpdate = Database["public"]["Tables"]["achievements"]["Update"];
