import { NextResponse, NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!isSupabaseConfigured()) {
    const data = await mockDb.getMeals(user.id, date);
    return NextResponse.json({ success: true, data });
  }

  try {
    const supabase = createClient();
    
    // Select meals logged on the specific date
    // Supporting timezone offsets by querying the date string in the ISO timestamp
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("time_logged", `${date}T00:00:00.000Z`)
      .lte("time_logged", `${date}T23:59:59.999Z`);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { meal_slot, name, food_name, calories, protein_g, carbs_g, fat_g, time_logged } = body;
    const finalFoodName = food_name || name;

    if (!meal_slot || !finalFoodName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: meal_slot, name or food_name" },
        { status: 400 }
      );
    }

    const time = time_logged || new Date().toISOString();
    const dateStr = time.split("T")[0];

    const cal = calories !== undefined ? Math.round(Number(calories)) : 0;
    const p = protein_g !== undefined ? Math.round(Number(protein_g)) : 0;
    const c = carbs_g !== undefined ? Math.round(Number(carbs_g)) : 0;
    const f = fat_g !== undefined ? Math.round(Number(fat_g)) : 0;

    if (!isSupabaseConfigured()) {
      const data = await mockDb.addMeal(user.id, {
        meal_slot,
        name: finalFoodName,
        food_name: finalFoodName,
        calories: cal,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
        log_id: null,
        time_logged: time,
      });
      return NextResponse.json({ success: true, data });
    }

    const supabase = createClient();

    // 1. Check if daily log exists, or create one
    let logId: string;
    const { data: existingLog, error: logFetchError } = await supabase
      .from("daily_logs")
      .select("id, calories_consumed, protein_g, carbs_g, fat_g")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle();

    if (logFetchError) {
      return NextResponse.json({ success: false, error: logFetchError.message }, { status: 500 });
    }

    if (existingLog) {
      logId = existingLog.id;

      // Update daily log with new macros
      const { error: logUpdateError } = await supabase
        .from("daily_logs")
        .update({
          calories_consumed: existingLog.calories_consumed + cal,
          protein_g: existingLog.protein_g + p,
          carbs_g: existingLog.carbs_g + c,
          fat_g: existingLog.fat_g + f,
        })
        .eq("id", logId);

      if (logUpdateError) {
        return NextResponse.json({ success: false, error: logUpdateError.message }, { status: 500 });
      }
    } else {
      // Create new daily log
      const { data: newLog, error: logInsertError } = await supabase
        .from("daily_logs")
        .insert({
          user_id: user.id,
          date: dateStr,
          calories_consumed: cal,
          protein_g: p,
          carbs_g: c,
          fat_g: f,
          water_ml: 0,
          steps: 0,
          sleep_hours: 0,
        })
        .select()
        .single();

      if (logInsertError) {
        return NextResponse.json({ success: false, error: logInsertError.message }, { status: 500 });
      }
      logId = newLog.id;
    }

    // 2. Insert the meal
    const { data: mealData, error: mealInsertError } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        log_id: logId,
        meal_slot,
        name: finalFoodName,
        food_name: finalFoodName,
        calories: cal,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
        time_logged: time,
      })
      .select()
      .single();

    if (mealInsertError) {
      return NextResponse.json({ success: false, error: mealInsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mealData });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing required field: id" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      await mockDb.deleteMeal(user.id, id);
      return NextResponse.json({ success: true });
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("meals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
