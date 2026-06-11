import { EMISSION_FACTORS } from "./emissionFactors";

export function calculateWaterEmissions(
  tapLiters: number,
  bottlesCount: number
): number {
  const tapEmissions = Math.max(0, tapLiters) * EMISSION_FACTORS.water.tapWater;
  const bottledEmissions = Math.max(0, bottlesCount) * EMISSION_FACTORS.water.bottledWater;
  return tapEmissions + bottledEmissions;
}
