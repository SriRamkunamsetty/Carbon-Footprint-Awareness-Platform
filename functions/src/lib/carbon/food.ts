import { EMISSION_FACTORS } from "./emissionFactors";

export type FoodType = keyof typeof EMISSION_FACTORS.food;

export interface FoodEntry {
  type: FoodType;
  servings: number;
}

export function calculateFoodEmissions(
  entries: FoodEntry[],
  isLocalOrOrganic: boolean = false
): number {
  let totalEmissions = 0;

  for (const entry of entries) {
    if (entry.servings < 0) continue;
    const factor = EMISSION_FACTORS.food[entry.type] ?? 0;
    totalEmissions += entry.servings * factor;
  }

  // Sourcing locally or organically reduces transport/production emissions slightly
  if (isLocalOrOrganic) {
    totalEmissions *= 0.9; // 10% reduction
  }

  return totalEmissions;
}
