import { NextResponse } from "next/server";

const USER_CONTEXT = `
User profile and goals are loaded from Supabase at runtime.
Use the live training history and recovery data provided below.
Preferred Indian foods: oats, chicken, rice, eggs, soya chunks, curd, peanut butter.
`;

interface ExerciseSetData {
  exercise_name: string;
  set_number: number;
  weight_kg: number;
  reps: number;
}

export async function POST(request: Request) {
  try {
    const { last_session_data, fatigue_level, days_since_rest, current_week_volume } = await request.json();

    const fatigue = Number(fatigue_level) || 3;
    const daysSinceRest = Number(days_since_rest) || 2;
    const weekVolume = Number(current_week_volume) || 12; // sets
    const sessionData = (last_session_data || []) as ExerciseSetData[];

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Rule-based high-quality fallback generator
      const suggestions: Record<string, {
        direction: "up" | "down" | "maintain";
        amount: number;
        reps: number;
        weight_kg: number;
        reason: string;
      }> = {};

      // Group sets by exercise
      const exercisesLogged = Array.from(new Set(sessionData.map(s => s.exercise_name)));
      
      exercisesLogged.forEach(exName => {
        const exSets = sessionData.filter(s => s.exercise_name === exName).sort((a,b) => a.set_number - b.set_number);
        if (exSets.length === 0) return;

        // Take max weight and reps from previous sets as baseline
        const maxWeight = Math.max(...exSets.map(s => s.weight_kg));
        const maxReps = Math.max(...exSets.map(s => s.reps));

        const isBW = exName.toLowerCase().includes("pull-up") || exName.toLowerCase().includes("push-up") || exName.toLowerCase().includes("plank");

        if (fatigue >= 4) {
          // DELOAD
          const weightChange = isBW ? 0 : Math.round(maxWeight * 0.1 * 2) / 2; // 10% deload
          suggestions[exName] = {
            direction: "down",
            amount: -weightChange,
            weight_kg: isBW ? 0 : Math.max(0, maxWeight - weightChange),
            reps: isBW ? Math.max(1, maxReps - 2) : maxReps,
            reason: `Deload suggestion: lower intensity by ~10% because your fatigue is high (${fatigue}/5) and you are on day ${daysSinceRest} of training.`
          };
        } else if (fatigue <= 2 && daysSinceRest <= 3) {
          // PROGRESSIVE OVERLOAD
          const weightChange = isBW ? 0 : maxWeight < 15 ? 1 : 2.5; // +1kg or +2.5kg
          suggestions[exName] = {
            direction: "up",
            amount: weightChange,
            weight_kg: isBW ? 0 : maxWeight + weightChange,
            reps: isBW ? maxReps + 1 : maxReps,
            reason: isBW 
              ? "Overload suggestion: attempt +1 rep on your top set. Fatigue is low, energy is high!" 
              : `Overload suggestion: increase weight by +${weightChange}kg. Your recovery is optimal, push for progressive load.`
          };
        } else {
          // MAINTAIN
          suggestions[exName] = {
            direction: "maintain",
            amount: 0,
            weight_kg: maxWeight,
            reps: maxReps,
            reason: "Maintain suggestion: match last session's load and focus on strict form and a slow eccentric phase."
          };
        }
      });

      const generalAdvice = fatigue >= 4 
        ? "Systemic fatigue is high. Recommend a deload session (reduce weights by 10% and focus on perfect contraction) or schedule a rest day."
        : fatigue <= 2
        ? "Fatigue is low and rest is adequate. Perfect conditions for pushing progressive overload. Aim to beat your previous weights/reps!"
        : "Moderate fatigue. Keep weights stable, match previous performance, and focus on Mind-Muscle connection.";

      // Delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      return NextResponse.json({
        success: true,
        source: "mock",
        data: {
          suggestions,
          generalAdvice
        }
      });
    }

    // Call Anthropic Claude API
    const systemPrompt = `You are an elite bodybuilding coach. ${USER_CONTEXT}
    Analyze the user's fatigue level, days since rest, and last session's exercise sets.
    Return ONLY a raw JSON object matching this schema. Do NOT wrap it in markdown codeblocks and do NOT add any text before or after the JSON:
    {
      "suggestions": {
        "Exercise Name Exact Match": {
          "direction": "up" | "down" | "maintain",
          "amount": number (kg difference or 0),
          "weight_kg": number (new suggested target weight),
          "reps": number (new suggested target reps),
          "reason": "Brief scientific reason for overload/deload"
        }
      },
      "generalAdvice": "Overview recommendation for today's session"
    }`;

    const prompt = `
    Inputs:
    - Fatigue Level (1-5, where 5 is exhausted): ${fatigue}
    - Days Since Last Rest Day: ${daysSinceRest}
    - Current Week Volume (completed sets): ${weekVolume}
    - Previous Session Data: ${JSON.stringify(sessionData)}
    
    Recommend progressive overload (increase weight by 1-2.5kg or reps by 1-2 if fatigue is low) or a deload (reduce weight by 10-15% or reps if fatigue is high, i.e., 4 or 5).
    Ensure the keys in the "suggestions" object match the exercise names in the inputs exactly.`;

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
      console.error("Failed to parse Claude JSON response for workout suggestion:", textContent, parseError);
      return NextResponse.json(
        { success: false, error: "Failed to parse AI output" },
        { status: 500 }
      );
    }

  } catch (error) {
    const err = error as Error;
    console.error("Workout suggest route error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
