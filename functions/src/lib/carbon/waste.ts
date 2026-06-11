import { EMISSION_FACTORS } from "./emissionFactors";

export function calculateWasteEmissions(
  landfillKg: number,
  recycledKg: number,
  compostKg: number
): number {
  const landfillEmissions = Math.max(0, landfillKg) * EMISSION_FACTORS.waste.landfill;
  const recycledEmissions = Math.max(0, recycledKg) * EMISSION_FACTORS.waste.recycled;
  const compostEmissions = Math.max(0, compostKg) * EMISSION_FACTORS.waste.compost;
  return landfillEmissions + recycledEmissions + compostEmissions;
}
