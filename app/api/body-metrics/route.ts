import { NextResponse, NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    const data = await mockDb.getBodyMetrics(user.id);
    return NextResponse.json({ success: true, data });
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("body_metrics")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

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
    const { date, weight_kg, body_fat_pct, chest_cm, waist_cm, hip_cm, notes } = body;

    if (weight_kg === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required field: weight_kg" },
        { status: 400 }
      );
    }

    const logDate = date || new Date().toISOString().split("T")[0];
    const weightVal = Number(weight_kg);
    const bodyFat = body_fat_pct !== undefined ? Number(body_fat_pct) : null;
    const chest = chest_cm !== undefined ? Number(chest_cm) : null;
    const waist = waist_cm !== undefined ? Number(waist_cm) : null;
    const hip = hip_cm !== undefined ? Number(hip_cm) : null;

    if (!isSupabaseConfigured()) {
      const data = await mockDb.logBodyMetrics(user.id, {
        date: logDate,
        weight_kg: weightVal,
        body_fat_pct: bodyFat,
        chest_cm: chest,
        waist_cm: waist,
        hip_cm: hip,
        notes: notes || null,
      });
      return NextResponse.json({ success: true, data });
    }

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    // 1. Insert body metric
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { data: metricData, error: insertError } = await sb
      .from("body_metrics")
      .insert({
        user_id: user.id,
        date: logDate,
        weight_kg: weightVal,
        body_fat_pct: bodyFat,
        chest_cm: chest,
        waist_cm: waist,
        hip_cm: hip,
        notes: notes || null,
      } as any)
      .select()
      .single();
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (insertError) throw insertError;

    // 2. Proactively update users table current weight
    /* eslint-disable @typescript-eslint/no-explicit-any */
    await sb
      .from("users")
      .update({ weight_kg: weightVal } as any)
      .eq("id", user.id);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // 3. Proactively upsert into daily logs to reflect weight logged
    const { data: existingLog } = await sb
      .from("daily_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", logDate)
      .maybeSingle();

    if (existingLog) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      await sb
        .from("daily_logs")
        .update({ weight_kg: weightVal } as any)
        .eq("id", existingLog.id);
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } else {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      await sb
        .from("daily_logs")
        .insert({
          user_id: user.id,
          date: logDate,
          weight_kg: weightVal,
          calories_consumed: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
          water_ml: 0,
          steps: 0,
          sleep_hours: 0,
        } as any);
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }

    return NextResponse.json({ success: true, data: metricData });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
