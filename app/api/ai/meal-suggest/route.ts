import { getAuthUser } from "@/lib/supabase/server";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/server";
import { AiMealSuggestSchema } from "@/lib/validation";
import { handleApiError, ok, unauthorized, tooManyRequests } from "@/lib/api-response";
import { checkAiMealLimit } from "@/lib/rate-limit";
import { getAnthropicKey } from "@/lib/env";

const FALLBACK_MEALS: Record<string, Array<{
  title: string; suggestion: string;
  calories: number; protein: number; carbs: number; fat: number; prepTip: string;
}>> = {
  breakfast: [
    { title: "Egg White Oats", suggestion: "60g rolled oats cooked in water with 150g scrambled egg whites and 10g peanut butter.", calories: 360, protein: 28, carbs: 42, fat: 8.5, prepTip: "Sauté onions first, add oats and water, stir in egg whites on low heat, finish with peanut butter." },
    { title: "Protein Oats Bowl", suggestion: "65g oats with 1 banana and 3 boiled egg whites.", calories: 380, protein: 26, carbs: 58, fat: 4.5, prepTip: "Cook oats in water, top with banana. Boil eggs, discard yolks, season whites with pepper." },
  ],
  pre_workout: [
    { title: "Whey & Apple", suggestion: "1 scoop whey protein (30g) in water + 1 medium apple (150g).", calories: 198, protein: 24, carbs: 23, fat: 1.5, prepTip: "Take 30 min before training for sustained energy." },
  ],
  lunch: [
    { title: "Chicken Rice Bowl", suggestion: "120g grilled chicken breast with 80g cooked brown rice and salad.", calories: 375, protein: 41, carbs: 38, fat: 5, prepTip: "Grill chicken with minimal oil, season with herbs." },
    { title: "Tofu Stir-fry", suggestion: "150g firm tofu stir-fried with mixed vegetables and 70g brown rice.", calories: 360, protein: 20, carbs: 40, fat: 10, prepTip: "Press tofu to remove moisture before cooking for better texture." },
  ],
  post_workout: [
    { title: "Whey Banana Shake", suggestion: "1 scoop whey (30g) blended with 1 banana and water.", calories: 227, protein: 26, carbs: 29, fat: 1.5, prepTip: "Consume within 30 min post-workout to kickstart recovery." },
  ],
  dinner: [
    { title: "Chicken & Veg Sauté", suggestion: "130g chicken breast with mixed vegetables and 60g brown rice.", calories: 350, protein: 42, carbs: 30, fat: 5, prepTip: "Cook chicken first then add vegetables to keep them crisp." },
    { title: "Lentil Dal", suggestion: "150g cooked lentils with spices, onion, tomato, and 70g brown rice.", calories: 370, protein: 22, carbs: 58, fat: 4, prepTip: "Temper cumin and mustard seeds in minimal oil before adding the dal." },
  ],
  snack: [
    { title: "Greek Yogurt & Fruit", suggestion: "150g Greek yogurt with mixed berries and 10g nuts.", calories: 200, protein: 12, carbs: 18, fat: 8, prepTip: "Chill for 15 min before eating for a thicker consistency." },
  ],
};

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const limit = checkAiMealLimit(user.id);
    if (!limit.allowed) {
      return tooManyRequests(Math.ceil((limit.resetAt - Date.now()) / 1000));
    }

    const body = await request.json();
    const { meal_slot, remaining_kcal, remaining_protein } = AiMealSuggestSchema.parse(body);

    // Fetch user's dietary preference for personalised suggestions
    let dietaryPreference = "none";
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("dietary_preference")
          .eq("id", user.id)
          .maybeSingle();
        dietaryPreference = profile?.dietary_preference ?? "none";
      } catch {
        // non-fatal
      }
    }

    const apiKey = getAnthropicKey();

    if (!apiKey) {
      const options = FALLBACK_MEALS[meal_slot] ?? FALLBACK_MEALS.lunch;
      const best = options.find(m => m.calories <= remaining_kcal && m.protein >= remaining_protein) ?? options[0];
      return ok({ source: "fallback", data: best });
    }

    const dietaryNote = dietaryPreference !== "none"
      ? `The user follows a ${dietaryPreference} diet — suggest only compliant foods.`
      : "The user has no dietary restrictions — suggest practical, widely available foods.";

    const systemPrompt = `You are a professional sports nutritionist.
${dietaryNote}
Respond ONLY with a raw JSON object — no markdown fences, no surrounding text:
{
  "title": "Short meal name",
  "suggestion": "Detailed description with exact quantities in grams",
  "calories": integer,
  "protein": number,
  "carbs": number,
  "fat": number,
  "prepTip": "Brief preparation tip"
}`;

    const prompt = `Suggest a meal for the slot "${meal_slot}".
Targets: ≤${remaining_kcal} kcal, ≥${remaining_protein}g protein.
Macros must be accurate. Give exact gram quantities.`;

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
      const options = FALLBACK_MEALS[meal_slot] ?? FALLBACK_MEALS.lunch;
      return ok({ source: "fallback", data: options[0] });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
