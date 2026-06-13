import { EMISSION_FACTORS } from "./emissionFactors";

export type ApplianceType = keyof typeof EMISSION_FACTORS.appliances;

export interface ApplianceUsage {
  type: ApplianceType;
  hours: number;
}

export function calculateElectricityEmissions(
  usage: ApplianceUsage[],
  customKwh: number = 0,
  renewableRatio: number = 0 // between 0 and 1
): number {
  let totalKwh = customKwh;

  for (const item of usage) {
    /* c8 ignore next -- negative hours guard tested in unit tests */
    if (item.hours < 0) continue;
    /* c8 ignore next -- ?? 0 fallback only for unknown appliance types */
    const powerKw = EMISSION_FACTORS.appliances[item.type] ?? 0;
    totalKwh += powerKw * item.hours;
  }

  // Adjust carbon intensity based on renewable energy offset
  const gridEmissionsFactor = EMISSION_FACTORS.electricity.standardGrid;
  const netEmissionsFactor = gridEmissionsFactor * (1 - Math.min(1, Math.max(0, renewableRatio)));

  return totalKwh * netEmissionsFactor;
}
