import { NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { CreateCardioSchema } from "@/lib/validation";
import { ok, unauthorized, badRequest, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate dates if provided
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (date && !dateRe.test(date)) return badRequest("Invalid date format. Use YYYY-MM-DD.");
    if (startDate && !dateRe.test(startDate)) return badRequest("Invalid startDate format. Use YYYY-MM-DD.");
    if (endDate && !dateRe.test(endDate)) return badRequest("Invalid endDate format. Use YYYY-MM-DD.");

    if (!isSupabaseConfigured()) {
      const data = await mockDb.getCardioLogs(
        user.id,
        date ?? new Date().toISOString().split("T")[0],
        startDate ?? undefined,
        endDate ?? undefined
      );
      return ok(data);
    }

    const supabase = createClient();
    let query = supabase.from("cardio_logs").select("*").eq("user_id", user.id);

    if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate);
    } else {
      query = query.eq("date", date ?? new Date().toISOString().split("T")[0]);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const body = await request.json();
    const validated = CreateCardioSchema.parse(body);

    const logDate = validated.date ?? new Date().toISOString().split("T")[0];

    if (!isSupabaseConfigured()) {
      const data = await mockDb.logCardio(user.id, {
        date: logDate,
        type: validated.type,
        duration_mins: validated.duration_mins,
        distance_km: validated.distance_km ?? 0,
        calories_burned: validated.calories_burned ?? 0,
        avg_heart_rate: validated.avg_heart_rate ?? null,
        incline_pct: validated.incline_pct ?? 0,
      });
      return ok(data, 201);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("cardio_logs")
      .insert({
        user_id: user.id,
        date: logDate,
        type: validated.type,
        duration_mins: validated.duration_mins,
        distance_km: validated.distance_km ?? 0,
        calories_burned: validated.calories_burned ?? 0,
        avg_heart_rate: validated.avg_heart_rate ?? null,
        incline_pct: validated.incline_pct ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return ok(data, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
