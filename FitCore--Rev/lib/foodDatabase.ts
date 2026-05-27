export interface FoodDefinition {
  name: string;
  calories: number; // kcal per 100g
  protein: number;  // g per 100g
  carbs: number;    // g per 100g
  fat: number;      // g per 100g
  defaultWeightGrams: number;
}

export const FOOD_DATABASE: FoodDefinition[] = [
  { name: "Oats", calories: 366, protein: 13, carbs: 56, fat: 7, defaultWeightGrams: 77 },
  { name: "Chicken breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, defaultWeightGrams: 100 },
  { name: "Brown rice (cooked)", calories: 216, protein: 4.5, carbs: 45, fat: 1.8, defaultWeightGrams: 80 },
  { name: "Whole eggs", calories: 155, protein: 13, carbs: 1.1, fat: 11, defaultWeightGrams: 100 },
  { name: "Egg whites", calories: 52, protein: 11, carbs: 0.7, fat: 0.2, defaultWeightGrams: 150 },
  { name: "Soya chunks dry", calories: 345, protein: 52, carbs: 26, fat: 0.5, defaultWeightGrams: 50 },
  { name: "Curd low-fat", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, defaultWeightGrams: 100 },
  { name: "Peanut butter", calories: 588, protein: 25, carbs: 20, fat: 50, defaultWeightGrams: 15 },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, defaultWeightGrams: 120 },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, defaultWeightGrams: 150 },
  { name: "Whey protein", calories: 400, protein: 80, carbs: 8, fat: 5, defaultWeightGrams: 30 },
  { name: "Mixed Vegetables", calories: 35, protein: 2, carbs: 7, fat: 0.2, defaultWeightGrams: 100 },
];
