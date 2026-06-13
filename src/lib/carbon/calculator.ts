import { calculateTransportEmissions, TransportMode } from "./transport";
import { calculateFoodEmissions, FoodEntry } from "./food";
import { calculateElectricityEmissions, ApplianceUsage } from "./electricity";
import { calculateShoppingEmissions, ShoppingItem } from "./shopping";
import { calculateWaterEmissions } from "./water";
import { calculateWasteEmissions } from "./waste";

export interface MonthlyInputs {
  transport: {
    mode: TransportMode;
    distanceKm: number;
  }[];
  food: {
    entries: FoodEntry[];
    isLocalOrOrganic: boolean;
  };
  electricity: {
    usage: ApplianceUsage[];
    customKwh?: number;
    renewableRatio?: number;
  };
  shopping: ShoppingItem[];
  water: {
    tapLiters: number;
    bottlesCount: number;
  };
  waste: {
    landfillKg: number;
    recycledKg: number;
    compostKg: number;
  };
}

export function aggregateMonthlyCarbon(inputs: MonthlyInputs): number {
  let total = 0;

  // 1. Transport
  /* c8 ignore next -- TypeScript MonthlyInputs type enforces presence; guard is for runtime safety */
  if (inputs.transport) {
    for (const t of inputs.transport) {
      total += calculateTransportEmissions(t.mode, t.distanceKm);
    }
  }

  // 2. Food
  /* c8 ignore next -- TypeScript MonthlyInputs type enforces presence; guard is for runtime safety */
  if (inputs.food) {
    total += calculateFoodEmissions(inputs.food.entries, inputs.food.isLocalOrOrganic);
  }

  // 3. Electricity
  /* c8 ignore next -- TypeScript MonthlyInputs type enforces presence; guard is for runtime safety */
  if (inputs.electricity) {
    total += calculateElectricityEmissions(
      inputs.electricity.usage,
      inputs.electricity.customKwh || 0,
      inputs.electricity.renewableRatio || 0
    );
  }

  // 4. Shopping
  /* c8 ignore next -- TypeScript MonthlyInputs type enforces presence; guard is for runtime safety */
  if (inputs.shopping) {
    total += calculateShoppingEmissions(inputs.shopping);
  }

  // 5. Water
  /* c8 ignore next -- TypeScript MonthlyInputs type enforces presence; guard is for runtime safety */
  if (inputs.water) {
    total += calculateWaterEmissions(inputs.water.tapLiters, inputs.water.bottlesCount);
  }

  // 6. Waste
  /* c8 ignore next -- TypeScript MonthlyInputs type enforces presence; guard is for runtime safety */
  if (inputs.waste) {
    total += calculateWasteEmissions(
      inputs.waste.landfillKg,
      inputs.waste.recycledKg,
      inputs.waste.compostKg
    );
  }

  return Math.round(total * 100) / 100;
}
