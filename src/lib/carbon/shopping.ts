import { EMISSION_FACTORS } from "./emissionFactors";

export type ShoppingCategory = keyof typeof EMISSION_FACTORS.shopping;

export interface ShoppingItem {
  category: ShoppingCategory;
  count: number;
}

export function calculateShoppingEmissions(items: ShoppingItem[]): number {
  let totalEmissions = 0;
  for (const item of items) {
    /* c8 ignore next -- negative count guard tested in unit tests */
    if (item.count < 0) continue;
    /* c8 ignore next -- ?? 0 fallback only for unknown shopping categories */
    const factor = EMISSION_FACTORS.shopping[item.category] ?? 0;
    totalEmissions += item.count * factor;
  }
  return totalEmissions;
}
