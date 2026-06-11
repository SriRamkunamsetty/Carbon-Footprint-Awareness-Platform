import { EMISSION_FACTORS } from "./emissionFactors";

export type ShoppingCategory = keyof typeof EMISSION_FACTORS.shopping;

export interface ShoppingItem {
  category: ShoppingCategory;
  count: number;
}

export function calculateShoppingEmissions(items: ShoppingItem[]): number {
  let totalEmissions = 0;
  for (const item of items) {
    if (item.count < 0) continue;
    const factor = EMISSION_FACTORS.shopping[item.category] ?? 0;
    totalEmissions += item.count * factor;
  }
  return totalEmissions;
}
