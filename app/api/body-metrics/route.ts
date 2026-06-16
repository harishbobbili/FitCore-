import { NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { CreateBodyMetricSchema } from "@/lib/validation";
import { ok, unauthorized, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    if (!isSupabaseConfigured()) {
      const data = await mockDb.getBodyMetrics(user.id);
      return ok(data);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("body_metrics")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

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
    const validated = CreateBodyMetricSchema.parse(body);
    const logDate = validated.date ?? new Date().toISOString().split("T")[0];

    if (!isSupabaseConfigured()) {
      const data = await mockDb.logBodyMetrics(user.id, {
        date: logDate,
        weight_kg: validated.weight_kg,
        body_fat_pct: validated.body_fat_pct ?? null,
        chest_cm: validated.chest_cm ?? null,
        waist_cm: validated.waist_cm ?? null,
        hip_cm: validated.hip_cm ?? null,
        notes: validated.notes ?? null,
      });
      return ok(data, 201);
    }

    const supabase = createClient();

    const { data: metricData, error: insertError } = await supabase
      .from("body_metrics")
      .insert({
        user_id: user.id,
        date: logDate,
        weight_kg: validated.weight_kg,
        body_fat_pct: validated.body_fat_pct ?? null,
        chest_cm: validated.chest_cm ?? null,
        waist_cm: validated.waist_cm ?? null,
        hip_cm: validated.hip_cm ?? null,
        notes: validated.notes ?? null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update current weight in profiles and daily_logs (non-fatal if they fail)
    await Promise.allSettled([
      supabase.from("profiles").update({ weight_kg: validated.weight_kg }).eq("id", user.id),
      (async () => {
        const { data: existingLog } = await supabase
          .from("daily_logs")
          .select("id")
          .eq("user_id", user.id)
          .eq("date", logDate)
          .maybeSingle();

        if (existingLog) {
          await supabase.from("daily_logs").update({ weight_kg: validated.weight_kg }).eq("id", existingLog.id);
        } else {
          await supabase.from("daily_logs").insert({
            user_id: user.id, date: logDate, weight_kg: validated.weight_kg,
            calories_consumed: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 0, steps: 0, sleep_hours: 0,
          });
        }
      })(),
    ]);

    return ok(metricData, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
