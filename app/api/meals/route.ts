import { NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { CreateMealSchema, DeleteMealSchema } from "@/lib/validation";
import { ok, unauthorized, badRequest, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    // Basic date format validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return badRequest("Invalid date format. Use YYYY-MM-DD.");
    }

    if (!isSupabaseConfigured()) {
      const data = await mockDb.getMeals(user.id, date);
      return ok(data);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("time_logged", `${date}T00:00:00.000Z`)
      .lte("time_logged", `${date}T23:59:59.999Z`)
      .order("time_logged", { ascending: true });

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
    const validated = CreateMealSchema.parse(body);

    const finalFoodName = validated.food_name ?? validated.name!;
    const time = validated.time_logged ?? new Date().toISOString();
    const dateStr = time.split("T")[0];
    const cal = Math.round(validated.calories);
    const p = Math.round(validated.protein_g);
    const c = Math.round(validated.carbs_g);
    const f = Math.round(validated.fat_g);

    if (!isSupabaseConfigured()) {
      const data = await mockDb.addMeal(user.id, {
        meal_slot: validated.meal_slot,
        name: finalFoodName,
        food_name: finalFoodName,
        calories: cal,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
        log_id: null,
        time_logged: time,
      });
      return ok(data, 201);
    }

    const supabase = createClient();

    // Upsert daily log
    let logId: string;
    const { data: existingLog, error: logFetchError } = await supabase
      .from("daily_logs")
      .select("id, calories_consumed, protein_g, carbs_g, fat_g")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle();

    if (logFetchError) throw logFetchError;

    if (existingLog) {
      logId = existingLog.id;
      const { error } = await supabase
        .from("daily_logs")
        .update({
          calories_consumed: (existingLog.calories_consumed ?? 0) + cal,
          protein_g: (existingLog.protein_g ?? 0) + p,
          carbs_g: (existingLog.carbs_g ?? 0) + c,
          fat_g: (existingLog.fat_g ?? 0) + f,
        })
        .eq("id", logId);
      if (error) throw error;
    } else {
      const { data: newLog, error } = await supabase
        .from("daily_logs")
        .insert({ user_id: user.id, date: dateStr, calories_consumed: cal, protein_g: p, carbs_g: c, fat_g: f, water_ml: 0, steps: 0, sleep_hours: 0 })
        .select()
        .single();
      if (error) throw error;
      logId = newLog.id;
    }

    const { data: mealData, error: mealError } = await supabase
      .from("meals")
      .insert({ user_id: user.id, log_id: logId, meal_slot: validated.meal_slot, name: finalFoodName, food_name: finalFoodName, calories: cal, protein_g: p, carbs_g: c, fat_g: f, time_logged: time })
      .select()
      .single();

    if (mealError) throw mealError;
    return ok(mealData, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const body = await request.json();
    const { id } = DeleteMealSchema.parse(body);

    if (!isSupabaseConfigured()) {
      await mockDb.deleteMeal(user.id, id);
      return ok({ deleted: true });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("meals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
