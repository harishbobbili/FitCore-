import { NextResponse } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";

const USER_CONTEXT = `
User profile and goals are loaded from Supabase at runtime.
Use the live training, nutrition, and body-log data provided below.
Preferred Indian foods: oats, chicken, rice, eggs, soya chunks, curd, peanut butter.
`;

interface DailyLogItem {
  calories_consumed?: number | null;
  protein_g?: number | null;
  steps?: number | null;
  sleep_hours?: number | null;
  water_ml?: number | null;
  weight_kg?: number | null;
}

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { messages } = await request.json();

    // 1. Fetch last 7 days data for system prompt injection
    let weeklySummaryText = "Last 7 days data unavailable.";
    try {
      if (!isSupabaseConfigured()) {
        const analytics = await mockDb.getWeeklyAnalytics(user.id);
        const s = analytics.summary;
        weeklySummaryText = `
        Last 7 Days Summary Stats:
        - Avg Calories: ${s.avg_calories} kcal/day (Target: current calorie target)
        - Avg Protein: ${s.avg_protein}g/day (Target: current protein target)
        - Avg Steps: ${s.avg_steps} steps/day (Target: current step goal)
        - Avg Sleep: ${s.avg_sleep} hrs/night
        - Avg Water: ${s.avg_water} ml/day
        - Avg Weight: ${s.avg_weight ?? 0} kg
        - Workouts Completed: ${s.workout_count} sessions
        `;
      } else {
        const supabase = createClient();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch logs
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

        if (logs && logs.length > 0) {
          const totalLogs = logs.length;
          const avgCal = Math.round((logs as DailyLogItem[]).reduce((acc: number, curr: DailyLogItem) => acc + (curr.calories_consumed || 0), 0) / totalLogs);
          const avgProt = Math.round((logs as DailyLogItem[]).reduce((acc: number, curr: DailyLogItem) => acc + (curr.protein_g || 0), 0) / totalLogs);
          const avgSteps = Math.round((logs as DailyLogItem[]).reduce((acc: number, curr: DailyLogItem) => acc + (curr.steps || 0), 0) / totalLogs);
          const avgSleep = Number(((logs as DailyLogItem[]).reduce((acc: number, curr: DailyLogItem) => acc + (curr.sleep_hours || 0), 0) / totalLogs).toFixed(1));
          const avgWater = Math.round((logs as DailyLogItem[]).reduce((acc: number, curr: DailyLogItem) => acc + (curr.water_ml || 0), 0) / totalLogs);
          const weights = (logs as DailyLogItem[]).map((l: DailyLogItem) => l.weight_kg).filter((w: number | null | undefined): w is number => w !== null && w !== undefined);
          const avgWeight = weights.length ? Number((weights.reduce((acc: number, curr: number) => acc + curr, 0) / weights.length).toFixed(1)) : 63.0;

          weeklySummaryText = `
          Last 7 Days Summary Stats:
          - Avg Calories: ${avgCal} kcal/day (Target: current calorie target)
          - Avg Protein: ${avgProt}g/day (Target: current protein target)
          - Avg Steps: ${avgSteps} steps/day (Target: current step goal)
          - Avg Sleep: ${avgSleep} hrs/night
          - Avg Water: ${avgWater} ml/day
          - Avg Weight: ${avgWeight} kg
          - Workouts Completed: ${workoutCount || 0} sessions
          `;
        }
      }
    } catch (e) {
      console.warn("Failed to generate weekly summary for system prompt:", e);
    }

    const systemPrompt = `You are FitCore Coach, an elite AI trainer and sports dietitian.
    ${USER_CONTEXT}
    
    Current Progress Metrics:
    ${weeklySummaryText}
    
    Answer the user's question clearly, concisely, and supportively. Support Indian food alternatives, direct compound exercise tips, recovery advice, supplements, or motivation. Be conversational and precise.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Stream a mock response
      const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
      let mockReply = "";

      if (lastUserMsg.includes("post-workout") || lastUserMsg.includes("post workout")) {
        mockReply = "For post-workout, keep it simple: a whey protein shake with a piece of fruit will support recovery without pushing you out of your deficit.";
      } else if (lastUserMsg.includes("deficit") || lastUserMsg.includes("aggressive")) {
        mockReply = "Your current deficit is in a solid range. Keep protein high, keep strength work in place, and let the weekly trend guide any adjustment.";
      } else if (lastUserMsg.includes("abs") || lastUserMsg.includes("finisher")) {
        mockReply = "Here is a quick abs finisher: hanging leg raises paired with planks. Keep the form strict, move with control, and stop one rep before your technique breaks down.";
      } else {
        mockReply = "That is a good question. Keep your protein intake high, stay consistent with your target deficit, and focus on progressive overload on compound lifts. What would you like to adjust today?";
      }

      // Stream encoder
      const encoder = new TextEncoder();
      const customReadableStream = new ReadableStream({
        async start(controller) {
          const words = mockReply.split(" ");
          for (let i = 0; i < words.length; i++) {
            const word = words[i] + " ";
            const chunk = `data: ${JSON.stringify({ type: "content_block_delta", delta: { text: word } })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 30));
          }
          controller.enqueue(encoder.encode("event: message_stop\ndata: [DONE]\n\n"));
          controller.close();
        }
      });

      return new Response(customReadableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }

    // Direct Claude API Stream call
    const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
        system: systemPrompt,
        stream: true
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`Anthropic stream API error: status ${apiResponse.status}`);
    }

    // Forward Claude stream
    const rawStream = apiResponse.body;
    if (!rawStream) {
      throw new Error("No response body received from Claude stream");
    }

    const reader = rawStream.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const forwardStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Forward value directly
            const text = decoder.decode(value);
            controller.enqueue(encoder.encode(text));
          }
         controller.close();
        } catch (streamError) {
          console.error("Error reading Claude response stream:", streamError);
          controller.error(streamError);
        }
      }
    });

    return new Response(forwardStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    const err = error as Error;
    console.error("Chat streaming API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
