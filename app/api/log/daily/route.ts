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
    const data = await mockDb.getDailyLog(user.id, date);
    return NextResponse.json({ success: true, data });
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || null });
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
    const { 
      date, 
      calories_consumed, 
      protein_g, 
      carbs_g, 
      fat_g, 
      water_ml, 
      steps, 
      sleep_hours, 
      mood_score, 
      weight_kg 
    } = body;

    const logDate = date || new Date().toISOString().split("T")[0];

    if (!isSupabaseConfigured()) {
      const data = await mockDb.upsertDailyLog(user.id, logDate, {
        calories_consumed,
        protein_g,
        carbs_g,
        fat_g,
        water_ml: water_ml !== undefined ? Number(water_ml) : undefined,
        steps: steps !== undefined ? Number(steps) : undefined,
        sleep_hours: sleep_hours !== undefined ? Number(sleep_hours) : undefined,
        mood_score: mood_score !== undefined ? Number(mood_score) : undefined,
        weight_kg: weight_kg !== undefined ? Number(weight_kg) : undefined,
      });
      return NextResponse.json({ success: true, data });
    }

    const supabase = createClient();
    
    // Check if the daily log exists
    const { data: existingLog, error: fetchError } = await supabase
      .from("daily_logs")
      .select("id, calories_consumed, protein_g, carbs_g, fat_g")
      .eq("user_id", user.id)
      .eq("date", logDate)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    let result;
    if (existingLog) {
      // Calculate updated calories if macros are changing
      const p = protein_g !== undefined ? Number(protein_g) : existingLog.protein_g;
      const c = carbs_g !== undefined ? Number(carbs_g) : existingLog.carbs_g;
      const f = fat_g !== undefined ? Number(fat_g) : existingLog.fat_g;
      const cal = (p * 4) + (c * 4) + (f * 9);

      const { data, error } = await supabase
        .from("daily_logs")
        .update({
          calories_consumed: cal,
          protein_g: protein_g !== undefined ? Number(protein_g) : undefined,
          carbs_g: carbs_g !== undefined ? Number(carbs_g) : undefined,
          fat_g: fat_g !== undefined ? Number(fat_g) : undefined,
          water_ml: water_ml !== undefined ? Number(water_ml) : undefined,
          steps: steps !== undefined ? Number(steps) : undefined,
          sleep_hours: sleep_hours !== undefined ? Number(sleep_hours) : undefined,
          mood_score: mood_score !== undefined ? Number(mood_score) : null,
          weight_kg: weight_kg !== undefined ? Number(weight_kg) : null,
        })
        .eq("id", existingLog.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      const p = protein_g !== undefined ? Number(protein_g) : 0;
      const c = carbs_g !== undefined ? Number(carbs_g) : 0;
      const f = fat_g !== undefined ? Number(fat_g) : 0;
      const cal = (p * 4) + (c * 4) + (f * 9);

      const { data, error } = await supabase
        .from("daily_logs")
        .insert({
          user_id: user.id,
          date: logDate,
          calories_consumed: cal,
          protein_g: p,
          carbs_g: c,
          fat_g: f,
          water_ml: water_ml !== undefined ? Number(water_ml) : 0,
          steps: steps !== undefined ? Number(steps) : 0,
          sleep_hours: sleep_hours !== undefined ? Number(sleep_hours) : 0,
          mood_score: mood_score !== undefined ? Number(mood_score) : null,
          weight_kg: weight_kg !== undefined ? Number(weight_kg) : null,
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
