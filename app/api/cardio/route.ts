import { NextResponse, NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!isSupabaseConfigured()) {
    const data = await mockDb.getCardioLogs(
      user.id,
      date || new Date().toISOString().split("T")[0],
      startDate || undefined,
      endDate || undefined
    );
    return NextResponse.json({ success: true, data });
  }

  try {
    const supabase = createClient();
    let query = supabase.from("cardio_logs").select("*").eq("user_id", user.id);

    if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate);
    } else {
      const targetDate = date || new Date().toISOString().split("T")[0];
      query = query.eq("date", targetDate);
    }

    const { data, error } = await query;

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
    const { date, type, duration_mins, distance_km, calories_burned, avg_heart_rate, incline_pct } = body;

    if (!type || duration_mins === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: type, duration_mins" },
        { status: 400 }
      );
    }

    const logDate = date || new Date().toISOString().split("T")[0];
    const duration = Number(duration_mins);
    const distance = distance_km !== undefined ? Number(distance_km) : 0;
    const calories = calories_burned !== undefined ? Number(calories_burned) : 0;
    const heartRate = avg_heart_rate !== undefined ? Number(avg_heart_rate) : null;
    const incline = incline_pct !== undefined ? Number(incline_pct) : 0;

    if (!isSupabaseConfigured()) {
      const data = await mockDb.logCardio(user.id, {
        date: logDate,
        type,
        duration_mins: duration,
        distance_km: distance,
        calories_burned: calories,
        avg_heart_rate: heartRate,
        incline_pct: incline,
      });
      return NextResponse.json({ success: true, data });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("cardio_logs")
      .insert({
        user_id: user.id,
        date: logDate,
        type,
        duration_mins: duration,
        distance_km: distance,
        calories_burned: calories,
        avg_heart_rate: heartRate,
        incline_pct: incline,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
