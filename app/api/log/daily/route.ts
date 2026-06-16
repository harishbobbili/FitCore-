import { NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { UpsertDailyLogSchema } from "@/lib/validation";
import { ok, unauthorized, badRequest, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return badRequest("Invalid date format. Use YYYY-MM-DD.");

    if (!isSupabaseConfigured()) {
      const data = await mockDb.getDailyLog(user.id, date);
      return ok(data);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();

    if (error) throw error;
    return ok(data ?? null);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const body = await request.json();
    const validated = UpsertDailyLogSchema.parse(body);
    const logDate = validated.date ?? new Date().toISOString().split("T")[0];

    if (!isSupabaseConfigured()) {
      const data = await mockDb.upsertDailyLog(user.id, logDate, validated);
      return ok(data);
    }

    const supabase = createClient();
    const { data: existingLog, error: fetchError } = await supabase
      .from("daily_logs")
      .select("id, protein_g, carbs_g, fat_g")
      .eq("user_id", user.id)
      .eq("date", logDate)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let result;

    if (existingLog) {
      // Recalculate calories from macros if any macro was updated
      const p = validated.protein_g ?? existingLog.protein_g ?? 0;
      const c = validated.carbs_g ?? existingLog.carbs_g ?? 0;
      const f = validated.fat_g ?? existingLog.fat_g ?? 0;
      const cal = (p * 4) + (c * 4) + (f * 9);

      const updatePayload: Record<string, number | null> = { calories_consumed: cal };
      if (validated.protein_g !== undefined) updatePayload.protein_g = p;
      if (validated.carbs_g !== undefined) updatePayload.carbs_g = c;
      if (validated.fat_g !== undefined) updatePayload.fat_g = f;
      if (validated.water_ml !== undefined) updatePayload.water_ml = validated.water_ml;
      if (validated.steps !== undefined) updatePayload.steps = validated.steps;
      if (validated.sleep_hours !== undefined) updatePayload.sleep_hours = validated.sleep_hours;
      if (validated.mood_score !== undefined) updatePayload.mood_score = validated.mood_score;
      if (validated.weight_kg !== undefined) updatePayload.weight_kg = validated.weight_kg;

      const { data, error } = await supabase
        .from("daily_logs")
        .update(updatePayload)
        .eq("id", existingLog.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const p = validated.protein_g ?? 0;
      const c = validated.carbs_g ?? 0;
      const f = validated.fat_g ?? 0;
      const cal = (p * 4) + (c * 4) + (f * 9);

      const { data, error } = await supabase
        .from("daily_logs")
        .insert({
          user_id: user.id, date: logDate,
          calories_consumed: cal, protein_g: p, carbs_g: c, fat_g: f,
          water_ml: validated.water_ml ?? 0,
          steps: validated.steps ?? 0,
          sleep_hours: validated.sleep_hours ?? 0,
          mood_score: validated.mood_score ?? null,
          weight_kg: validated.weight_kg ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
