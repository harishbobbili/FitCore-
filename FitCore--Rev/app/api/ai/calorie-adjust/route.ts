import { NextResponse } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";

const USER_CONTEXT = `
User profile and goals are loaded from Supabase at runtime.
Use the live body-weight trend and profile targets below.
Preferred Indian foods: oats, chicken, rice, eggs, soya chunks, curd, peanut butter.
`;

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

      if (error) {
        throw error;
      }
      dailyLogs = data || [];
    }

    // Extract valid weights and dates
    const weightsWithDates = dailyLogs
      .filter((log) => log.weight_kg !== null && log.weight_kg !== undefined)
      .map((log) => ({
        weight: Number(log.weight_kg),
        date: log.date
      }));

    // Calculate weight change rate
    let weightLossRate = 0; // kg/week
    let startWeight = 0;
    let endWeight = 0;

    if (weightsWithDates.length >= 2) {
      startWeight = weightsWithDates[0].weight;
      endWeight = weightsWithDates[weightsWithDates.length - 1].weight;
      const weightDiff = startWeight - endWeight; // Positive means weight lost
      
      // Calculate days difference
      const start = new Date(weightsWithDates[0].date);
      const end = new Date(weightsWithDates[weightsWithDates.length - 1].date);
      const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Extrapolate to 7 days (1 week)
      weightLossRate = Number(((weightDiff / diffDays) * 7).toFixed(2));
    } else {
      // Fallback weight loss rate for visual demonstration (e.g. 0.7kg/week to show adjustment)
      // We will simulate that the user has a -0.7 kg change over the last 7 days
      startWeight = 0;
      endWeight = 0;
      weightLossRate = 0;
    }

    // Determine adjustment programmatically as a base/fallback
    let baseAdjustment = 0;
    let baseExplanation = "";
    let showBanner = false;

    if (weightLossRate > 0.6) {
      baseAdjustment = 100;
      showBanner = true;
      baseExplanation = `You have lost ${weightLossRate} kg in the past week, which is faster than the recommended rate of 0.4–0.5 kg for intermediate lifters. Suggesting a +100 kcal adjustment to 1900 kcal/day to prevent muscle tissue catabolism and support recovery.`;
    } else if (weightLossRate < 0.2) {
      baseAdjustment = -100;
      showBanner = true;
      baseExplanation = `Your weight loss rate of ${weightLossRate} kg in the past week is slower than your target range. Suggesting a -100 kcal adjustment to 1700 kcal/day to keep your fat loss deficit optimized.`;
    } else {
      baseAdjustment = 0;
      showBanner = false;
      baseExplanation = `Your weight loss is stable at ${weightLossRate} kg/week, which is perfectly within the 0.2–0.6 kg/week sweet spot. No calorie adjustment needed.`;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        source: "mock",
        data: {
          showBanner,
          weightChangeRate: -weightLossRate, // negative for loss
          suggestedAdjustment: baseAdjustment,
          explanation: baseExplanation
        }
      });
    }

    // Call Anthropic Claude API
    const systemPrompt = `You are a professional sports endocrinologist and nutrition coach. ${USER_CONTEXT}
    Analyze the user's weekly weight logs and calculate weight change rate.
    Provide recommendations.
    Rules:
    - If weight loss rate > 0.6 kg/week: suggest +100 kcal.
    - If weight loss rate < 0.2 kg/week: suggest -100 kcal.
    - If weight loss rate is between 0.2 and 0.6 kg/week: suggest 0 kcal adjustment.
    
    Respond ONLY with a raw JSON object matching the schema. Do NOT wrap it in markdown codeblocks and do NOT add any text before or after the JSON:
    {
      "showBanner": boolean,
      "weightChangeRate": number (negative for weight lost, positive for weight gained),
      "suggestedAdjustment": number (+100, -100, or 0),
      "explanation": "Descriptive explanation explaining the physiological reason for the calorie adjustment based on their profile."
    }`;

    const prompt = `
    Input data:
    - Starting weight: ${startWeight} kg
    - Ending weight: ${endWeight} kg
    - Calculated weekly rate: ${weightLossRate} kg weight loss.
    - Current Calorie Target: use the profile's live target.
    `;

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
        messages: [{ role: "user", content: prompt }],
        system: systemPrompt
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`Anthropic API returned status ${apiResponse.status}`);
    }

    const result = await apiResponse.json();
    const textContent = result.content?.[0]?.text?.trim() || "";

    try {
      const parsedData = JSON.parse(textContent);
      return NextResponse.json({
        success: true,
        source: "claude",
        data: parsedData
      });
    } catch (parseError) {
      console.error("Failed to parse Claude JSON response for calorie adjustment:", textContent, parseError);
      return NextResponse.json({
        success: true,
        source: "fallback_after_parse_error",
        data: {
          showBanner,
          weightChangeRate: -weightLossRate,
          suggestedAdjustment: baseAdjustment,
          explanation: baseExplanation
        }
      });
    }

  } catch (error) {
    const err = error as Error;
    console.error("Calorie adjust route error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
