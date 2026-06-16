import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { AiWorkoutSuggestSchema } from "@/lib/validation";
import { handleApiError, ok, unauthorized, tooManyRequests } from "@/lib/api-response";
import { checkAiWorkoutLimit } from "@/lib/rate-limit";
import { getAnthropicKey } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const limit = checkAiWorkoutLimit(user.id);
    if (!limit.allowed) {
      return tooManyRequests(Math.ceil((limit.resetAt - Date.now()) / 1000));
    }

    const body = await request.json();
    const { last_session_data, fatigue_level, days_since_rest, current_week_volume } =
      AiWorkoutSuggestSchema.parse(body);

    const apiKey = getAnthropicKey();

    if (!apiKey) {
      return ok({
        source: "rule-based",
        data: generateRuleBasedSuggestions(last_session_data, fatigue_level, days_since_rest),
      });
    }

    const systemPrompt = `You are an elite strength coach specialising in progressive overload.
Analyse the user's fatigue, rest days, and previous session data.
Return ONLY a raw JSON object — no markdown, no text before or after:
{
  "suggestions": {
    "Exercise Name": {
      "direction": "up" | "down" | "maintain",
      "amount": number,
      "weight_kg": number,
      "reps": number,
      "reason": "Brief scientific reason"
    }
  },
  "generalAdvice": "string"
}`;

    const prompt = `
Fatigue (1-5, 5=exhausted): ${fatigue_level}
Days since last rest day: ${days_since_rest}
Week volume (completed sets): ${current_week_volume}
Previous session: ${JSON.stringify(last_session_data)}

Apply progressive overload if fatigue ≤ 2 and rest ≤ 3 days.
Apply deload (−10-15% weight or −1-2 reps) if fatigue ≥ 4.
Otherwise maintain.`;

    const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
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
      // Parse failed — fall back to rule-based
      console.warn("Failed to parse Claude workout suggestion JSON, using rule-based fallback");
      return ok({
        source: "rule-based",
        data: generateRuleBasedSuggestions(last_session_data, fatigue_level, days_since_rest),
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── Rule-based fallback ──────────────────────────────────────────────────────

interface SetData {
  exercise_name: string;
  set_number: number;
  weight_kg: number;
  reps: number;
}

function generateRuleBasedSuggestions(
  sessionData: SetData[],
  fatigue: number,
  daysSinceRest: number
) {
  const suggestions: Record<string, {
    direction: "up" | "down" | "maintain";
    amount: number;
    weight_kg: number;
    reps: number;
    reason: string;
  }> = {};

  const exercises = Array.from(new Set(sessionData.map(s => s.exercise_name)));

  for (const name of exercises) {
    const sets = sessionData.filter(s => s.exercise_name === name);
    const maxWeight = Math.max(...sets.map(s => s.weight_kg));
    const maxReps = Math.max(...sets.map(s => s.reps));
    const isBW = /pull-up|push-up|plank/i.test(name);

    if (fatigue >= 4) {
      const cut = isBW ? 0 : Math.round(maxWeight * 0.1 * 2) / 2;
      suggestions[name] = {
        direction: "down",
        amount: -cut,
        weight_kg: isBW ? 0 : Math.max(0, maxWeight - cut),
        reps: isBW ? Math.max(1, maxReps - 2) : maxReps,
        reason: `Fatigue is high (${fatigue}/5). Deload by ~10% to support recovery.`,
      };
    } else if (fatigue <= 2 && daysSinceRest <= 3) {
      const add = isBW ? 0 : maxWeight < 15 ? 1 : 2.5;
      suggestions[name] = {
        direction: "up",
        amount: add,
        weight_kg: isBW ? 0 : maxWeight + add,
        reps: isBW ? maxReps + 1 : maxReps,
        reason: isBW
          ? "Low fatigue — attempt +1 rep on top set."
          : `Low fatigue and adequate rest — increase load by +${add} kg.`,
      };
    } else {
      suggestions[name] = {
        direction: "maintain",
        amount: 0,
        weight_kg: maxWeight,
        reps: maxReps,
        reason: "Moderate fatigue. Match last session and focus on form.",
      };
    }
  }

  const generalAdvice =
    fatigue >= 4
      ? "High fatigue detected. Consider a deload session or rest day before pushing intensity."
      : fatigue <= 2
      ? "Recovery is optimal. Ideal conditions for progressive overload — push for a new PR."
      : "Moderate fatigue. Maintain current loads, prioritise mind-muscle connection and controlled reps.";

  return { suggestions, generalAdvice };
}
