import { NextResponse } from "next/server";

const USER_CONTEXT = `
User profile and goals are loaded from Supabase at runtime.
Use the live calorie, protein, and meal-slot targets below.
Preferred Indian foods: oats, chicken, rice, eggs, soya chunks, curd, peanut butter.
`;

const MOCK_MEALS: Record<string, Array<{
  title: string;
  suggestion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTip: string;
}>> = {
  breakfast: [
    {
      title: "Masala Egg White Oats",
      suggestion: "60g Oats cooked in water with turmeric, cumin, onions, tomatoes, and mixed with 150g scrambled egg whites (about 4-5 egg whites) and 10g peanut butter stirred in at the end.",
      calories: 360,
      protein: 28,
      carbs: 42,
      fat: 8.5,
      prepTip: "Sauté vegetables first, add water and oats, cook until soft, then stir in egg whites and stir continuously on low heat until cooked. Finish by mixing in peanut butter."
    },
    {
      title: "Protein Oats Bowl",
      suggestion: "65g Rolled oats cooked in water, topped with 1 medium sliced banana (100g) and served with 3 boiled egg whites on the side.",
      calories: 380,
      protein: 26,
      carbs: 58,
      fat: 4.5,
      prepTip: "Cook oats in water, let cool, and top with banana. Boil eggs separately, discard yolks, and season whites with black pepper."
    }
  ],
  pre_workout: [
    {
      title: "Whey & Apple Charger",
      suggestion: "1 scoop Whey Protein (30g) in water + 1 medium crisp Apple (150g) sliced.",
      calories: 198,
      protein: 24.5,
      carbs: 23,
      fat: 1.5,
      prepTip: "Take the whey protein 30 minutes before your workout and chew the apple slowly to get slow-releasing carbs for sustained energy."
    }
  ],
  lunch: [
    {
      title: "Sautéed Soya Chunks & Curd Rice",
      suggestion: "50g dry Soya chunks (rehydrated and boiled) pan-sautéed with mustard seeds, curry leaves, and green chillies, served with 70g cooked Brown rice and 150g low-fat Curd.",
      calories: 395,
      protein: 36,
      carbs: 48,
      fat: 6.5,
      prepTip: "Squeeze all water out of rehydrated soya chunks before sautéing to ensure they absorb spices. Mix curd with cold brown rice and a pinch of salt."
    },
    {
      title: "Indian Chicken Breast Rice Bowl",
      suggestion: "120g grilled Chicken breast marinated in ginger-garlic paste and curd, served with 80g cooked Brown rice and 100g cucumber-tomato salad.",
      calories: 375,
      protein: 41,
      carbs: 38,
      fat: 5.2,
      prepTip: "Marinate chicken for at least 1 hour for maximum tenderness, then grill or pan-sear with minimal oil spray."
    }
  ],
  post_workout: [
    {
      title: "Anabolic Whey-Banana Shake",
      suggestion: "1 scoop Whey Protein (30g) blended with 1 medium Banana (120g) and water.",
      calories: 227,
      protein: 25.5,
      carbs: 29,
      fat: 1.6,
      prepTip: "Blend with ice cubes for a thick, refreshing shake immediately post-workout to kickstart recovery."
    }
  ],
  dinner: [
    {
      title: "High-Protein Chicken & Veggie Sauté",
      suggestion: "130g Chicken breast strips stir-fried with onions, bell peppers, broccoli, and served with 60g cooked Brown rice.",
      calories: 350,
      protein: 42,
      carbs: 30,
      fat: 4.8,
      prepTip: "Use a non-stick pan with 1/2 teaspoon of olive oil. Cook chicken first, then add vegetables so they remain crunchy."
    },
    {
      title: "Spiced Soya & Egg White Scramble",
      suggestion: "40g Soya chunks (rehydrated and minced) scrambled with 4 egg whites, onions, green chillies, tomatoes, served with 1 slice of whole wheat toast or 50g cooked rice.",
      calories: 330,
      protein: 35,
      carbs: 32,
      fat: 3.2,
      prepTip: "Mince the boiled soya chunks in a mixer, then cook them with spices before adding the egg whites to create a bhurji-style texture."
    }
  ],
  snack: [
    {
      title: "Peanut Butter Curd Spread",
      suggestion: "15g peanut butter swirled into 150g low-fat Curd, served with a sliced Apple.",
      calories: 220,
      protein: 11,
      carbs: 24,
      fat: 8.5,
      prepTip: "Whisk the peanut butter into curd until it reaches a smooth, mousse-like consistency. Cool in the freezer for 10 mins before eating."
    }
  ]
};

export async function POST(request: Request) {
  try {
    const { meal_slot, remaining_kcal, remaining_protein } = await request.json();
    const slot = (meal_slot || "lunch").toLowerCase();

    // Standardize slot name
    let mappedSlot = slot;
    if (slot.includes("break")) mappedSlot = "breakfast";
    else if (slot.includes("pre")) mappedSlot = "pre_workout";
    else if (slot.includes("post")) mappedSlot = "post_workout";
    else if (slot.includes("lunch")) mappedSlot = "lunch";
    else if (slot.includes("dinner")) mappedSlot = "dinner";
    else if (slot.includes("snack")) mappedSlot = "snack";

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Fallback: Pick a mock meal for this slot that roughly fits the criteria
      const options = MOCK_MEALS[mappedSlot] || MOCK_MEALS.lunch;
      // Filter options to fit under remaining_kcal if possible, or select the best one
      const selected = options.find(m => m.calories <= (remaining_kcal || 500) && m.protein >= (remaining_protein || 20)) || options[0];
      
      // Delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      return NextResponse.json({
        success: true,
        source: "mock",
        data: selected
      });
    }

    // Call Anthropic Claude API
    const systemPrompt = `You are a professional sports nutritionist. ${USER_CONTEXT}
    Respond ONLY with a raw JSON object. Do NOT wrap it in markdown codeblocks (e.g. \`\`\`json ... \`\`\`), and do NOT include any other text before or after the JSON.
    JSON schema format:
    {
      "title": "Short descriptive Indian meal name",
      "suggestion": "Detailed description of the meal with exact quantities in grams",
      "calories": integer,
      "protein": number,
      "carbs": number,
      "fat": number,
      "prepTip": "Brief preparation tip"
    }`;

    const prompt = `Suggest a specific Indian meal for the slot: "${meal_slot}" that fits within the remaining targets: ${remaining_kcal || 400} kcal and ${remaining_protein || 25}g protein.
    Use the user's preferred foods (oats, chicken, rice, eggs, soya chunks, curd, peanut butter).
    Make sure the macros are strictly within the constraints and mathematically correct. Give exact quantities in grams.`;

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
    
    // Parse JSON
    try {
      const parsedData = JSON.parse(textContent);
      return NextResponse.json({
        success: true,
        source: "claude",
        data: parsedData
      });
    } catch (parseError) {
      console.error("Failed to parse Claude JSON response:", textContent, parseError);
      // Fallback on parse failure
      const options = MOCK_MEALS[mappedSlot] || MOCK_MEALS.lunch;
      return NextResponse.json({
        success: true,
        source: "fallback_after_parse_error",
        data: options[0]
      });
    }

  } catch (error) {
    const err = error as Error;
    console.error("Meal suggest route error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
