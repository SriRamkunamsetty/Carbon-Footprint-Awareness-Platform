import { EMISSION_FACTORS } from "./emissionFactors";

export type TransportMode = keyof typeof EMISSION_FACTORS.transport;

export function calculateTransportEmissions(
  mode: TransportMode,
  distanceKm: number
): number {
  if (distanceKm < 0) return 0;
  const factor = EMISSION_FACTORS.transport[mode] ?? 0;
  return distanceKm * factor;
}
