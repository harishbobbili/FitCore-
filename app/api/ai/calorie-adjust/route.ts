import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { handleApiError, ok, unauthorized, tooManyRequests } from "@/lib/api-response";
import { checkCalorieAdjustLimit } from "@/lib/rate-limit";
import { getAnthropicKey } from "@/lib/env";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const limit = checkCalorieAdjustLimit(user.id);
    if (!limit.allowed) {
      return tooManyRequests(Math.ceil((limit.resetAt - Date.now()) / 1000));
    }

    let dailyLogs: { weight_kg: number | null; date: string }[] = [];

    if (!isSupabaseConfigured()) {
      const analytics = await mockDb.getWeeklyAnalytics(user.id);
      dailyLogs = analytics.daily_history;
    } else {
      const supabase = createClient();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data, error } = await supabase
        .from("daily_logs")
        .select("weight_kg, date")
        .eq("user_id", user.id)
        .gte("date", sevenDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (error) throw error;
      dailyLogs = data ?? [];
    }

    const withWeights = dailyLogs
      .filter(l => l.weight_kg != null)
      .map(l => ({ weight: Number(l.weight_kg), date: l.date }));

    let weeklyRate = 0;
    let startWeight = 0;
    let endWeight = 0;

    if (withWeights.length >= 2) {
      startWeight = withWeights[0].weight;
      endWeight = withWeights[withWeights.length - 1].weight;
      const days = Math.max(
        1,
        Math.round(
          (new Date(withWeights[withWeights.length - 1].date).getTime() -
            new Date(withWeights[0].date).getTime()) /
            86_400_000
        )
      );
      weeklyRate = Number((((startWeight - endWeight) / days) * 7).toFixed(2));
    }

    const { showBanner, adjustment, explanation } = getAdjustment(weeklyRate);

    const apiKey = getAnthropicKey();

    if (!apiKey) {
      return ok({
        source: "rule-based",
        data: {
          showBanner,
          weightChangeRate: -weeklyRate,
          suggestedAdjustment: adjustment,
          explanation,
        },
      });
    }

    const systemPrompt = `You are a sports nutritionist.
Rules:
- Weight loss > 0.6 kg/week → suggest +100 kcal (too aggressive).
- Weight loss < 0.2 kg/week → suggest -100 kcal (too slow).
- Weight loss 0.2–0.6 kg/week → suggest 0 kcal (on track).
Respond ONLY with raw JSON — no markdown, no surrounding text:
{
  "showBanner": boolean,
  "weightChangeRate": number (negative = lost weight),
  "suggestedAdjustment": number (+100, -100, or 0),
  "explanation": "Physiological reason for the recommendation."
}`;

    const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        messages: [{ role: "user", content: `Start weight: ${startWeight} kg. End weight: ${endWeight} kg. Weekly rate: ${weeklyRate} kg/week loss.` }],
        system: systemPrompt,
      }),
    });

    if (!apiResponse.ok) throw new Error(`Anthropic API error: ${apiResponse.status}`);

    const result = await apiResponse.json();
    const text = result.content?.[0]?.text?.trim() ?? "";

    try {
      const parsed = JSON.parse(text);
      return ok({ source: "claude", data: parsed });
    } catch {
      return ok({
        source: "rule-based",
        data: { showBanner, weightChangeRate: -weeklyRate, suggestedAdjustment: adjustment, explanation },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

function getAdjustment(weeklyRate: number) {
  if (weeklyRate > 0.6) {
    return {
      showBanner: true,
      adjustment: 100,
      explanation: `You're losing ${weeklyRate} kg/week — faster than the recommended 0.4–0.6 kg for muscle preservation. Consider adding +100 kcal/day to protect lean mass.`,
    };
  }
  if (weeklyRate < 0.2 && weeklyRate >= 0) {
    return {
      showBanner: true,
      adjustment: -100,
      explanation: `Your weight loss rate of ${weeklyRate} kg/week is below target. A -100 kcal/day adjustment should accelerate progress without sacrificing muscle.`,
    };
  }
  return {
    showBanner: false,
    adjustment: 0,
    explanation: `Your weight loss rate of ${weeklyRate} kg/week is in the ideal 0.2–0.6 kg/week range. No change needed — keep doing what you're doing.`,
  };
}
