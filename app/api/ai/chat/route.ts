import { NextResponse } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { AiChatSchema } from "@/lib/validation";
import { handleApiError, unauthorized, tooManyRequests } from "@/lib/api-response";
import { checkAiChatLimit } from "@/lib/rate-limit";
import { getAnthropicKey } from "@/lib/env";

interface DailyLogItem {
  calories_consumed?: number | null;
  protein_g?: number | null;
  steps?: number | null;
  sleep_hours?: number | null;
  water_ml?: number | null;
  weight_kg?: number | null;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    // Rate limiting
    const limit = checkAiChatLimit(user.id);
    if (!limit.allowed) {
      const retryAfter = Math.ceil((limit.resetAt - Date.now()) / 1000);
      return tooManyRequests(retryAfter);
    }

    // Validate request body
    const body = await request.json();
    const { messages } = AiChatSchema.parse(body);

    // Build weekly summary for context
    let weeklySummaryText = "Last 7 days data unavailable.";
    try {
      if (!isSupabaseConfigured()) {
        const analytics = await mockDb.getWeeklyAnalytics(user.id);
        const s = analytics.summary;
        weeklySummaryText = buildSummaryText(s);
      } else {
        const supabase = createClient();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: logs } = await supabase
          .from("daily_logs")
          .select("calories_consumed, protein_g, steps, sleep_hours, water_ml, weight_kg")
          .eq("user_id", user.id)
          .gte("date", sevenDaysAgo.toISOString().split("T")[0]);

        const { count: workoutCount } = await supabase
          .from("workout_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("date", sevenDaysAgo.toISOString().split("T")[0]);

        // Also fetch user profile for personalized context
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, goal, target_kcal, protein_goal_g, step_goal, dietary_preference, experience, weight_kg, height_cm")
          .eq("id", user.id)
          .maybeSingle();

        if (logs && logs.length > 0) {
          const n = logs.length;
          const avg = (field: keyof DailyLogItem) =>
            Math.round((logs as DailyLogItem[]).reduce((a, c) => a + (Number(c[field]) || 0), 0) / n);
          const weights = (logs as DailyLogItem[]).map(l => l.weight_kg).filter((w): w is number => w != null);
          const avgWeight = weights.length
            ? Number((weights.reduce((a, c) => a + c, 0) / weights.length).toFixed(1))
            : null;

          weeklySummaryText = `
Last 7 Days Summary:
- Avg Calories: ${avg("calories_consumed")} kcal/day (Target: ${profile?.target_kcal ?? "?"} kcal)
- Avg Protein: ${avg("protein_g")}g/day (Target: ${profile?.protein_goal_g ?? "?"}g)
- Avg Steps: ${avg("steps")} steps/day (Target: ${profile?.step_goal ?? "?"})
- Avg Sleep: ${((logs as DailyLogItem[]).reduce((a, c) => a + (c.sleep_hours || 0), 0) / n).toFixed(1)} hrs/night
- Avg Water: ${avg("water_ml")} ml/day
- Avg Weight: ${avgWeight ?? "N/A"} kg
- Workouts Completed: ${workoutCount ?? 0} sessions
${profile ? `
User Profile:
- Name: ${profile.name ?? "User"}
- Goal: ${profile.goal ?? "general fitness"}
- Experience: ${profile.experience ?? "intermediate"}
- Current Weight: ${profile.weight_kg ?? "?"} kg
- Height: ${profile.height_cm ?? "?"} cm
- Dietary preference: ${profile.dietary_preference ?? "none"}
` : ""}`;
        }
      }
    } catch (e) {
      console.warn("Failed to build weekly summary for AI context:", e);
    }

    const systemPrompt = `You are FitCore Coach, an elite AI personal trainer and sports dietitian.

${weeklySummaryText}

Guidelines:
- Give clear, concise, evidence-based fitness and nutrition advice.
- Personalise your response based on the user's goal and profile above.
- Be encouraging but realistic — don't make medical claims.
- Suggest exercises and foods that are practical and widely available.
- Keep responses focused; avoid filler phrases.`;

    const apiKey = getAnthropicKey();

    if (!apiKey) {
      // Rule-based fallback
      const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() ?? "";
      let reply =
        "Great question! Focus on progressive overload on compound lifts, keep protein high, and let the weekly trend guide any adjustments. What specifically would you like to work on?";

      if (lastMsg.includes("post-workout") || lastMsg.includes("recovery")) {
        reply = "For post-workout recovery: aim for 20–40 g protein within 1–2 hours, replenish carbs based on training intensity, and stay hydrated. A shake with fruit is a simple and effective option.";
      } else if (lastMsg.includes("deficit") || lastMsg.includes("calorie")) {
        reply = "A moderate deficit of 300–500 kcal/day is optimal for fat loss while preserving muscle. Keep protein at 1.6–2.2 g/kg of body weight, strength train 3–5 days/week, and reassess every 2 weeks.";
      } else if (lastMsg.includes("abs") || lastMsg.includes("core")) {
        reply = "Core work: cable crunches, hanging leg raises, and planks are the most effective. Train abs 2–3× per week with controlled reps. Visible abs come primarily from low body-fat — nutrition matters more than ab exercises.";
      } else if (lastMsg.includes("sleep") || lastMsg.includes("recovery")) {
        reply = "Sleep is when muscle is built. Aim for 7–9 hours. Poor sleep raises cortisol, reduces testosterone, and impairs fat loss. Prioritise it as much as your training.";
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = reply.split(" ");
          for (const word of words) {
            const chunk = `data: ${JSON.stringify({ type: "content_block_delta", delta: { text: word + " " } })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
            await new Promise(r => setTimeout(r, 40 + Math.random() * 30));
          }
          controller.enqueue(encoder.encode("event: message_stop\ndata: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Stream from Claude
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
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        system: systemPrompt,
        stream: true,
      }),
    });

    if (!apiResponse.ok) {
      throw new Error(`Anthropic API error: ${apiResponse.status}`);
    }

    const rawStream = apiResponse.body;
    if (!rawStream) throw new Error("No response body from Claude");

    const reader = rawStream.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const forwardStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(encoder.encode(decoder.decode(value)));
          }
          controller.close();
        } catch (err) {
          console.error("Error forwarding Claude stream:", err);
          controller.error(err);
        }
      },
    });

    return new Response(forwardStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function buildSummaryText(s: {
  avg_calories: number;
  avg_protein: number;
  avg_steps: number;
  avg_sleep: number;
  avg_water: number;
  avg_weight: number | null;
  workout_count: number;
}) {
  return `
Last 7 Days Summary:
- Avg Calories: ${s.avg_calories} kcal/day
- Avg Protein: ${s.avg_protein}g/day
- Avg Steps: ${s.avg_steps} steps/day
- Avg Sleep: ${s.avg_sleep} hrs/night
- Avg Water: ${s.avg_water} ml/day
- Avg Weight: ${s.avg_weight ?? "N/A"} kg
- Workouts Completed: ${s.workout_count} sessions`;
}
