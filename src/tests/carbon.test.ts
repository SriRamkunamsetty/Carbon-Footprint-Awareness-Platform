import { describe, it, expect } from "vitest";
import { calculateTransportEmissions } from "../lib/carbon/transport";
import { calculateFoodEmissions } from "../lib/carbon/food";
import { calculateElectricityEmissions } from "../lib/carbon/electricity";
import { calculateCarbonScore } from "../lib/carbon/score";
import { aggregateMonthlyCarbon } from "../lib/carbon/calculator";

describe("Carbon Calculations Engine Unit Tests", () => {
  
  describe("Transport Emissions", () => {
    it("should calculate correct emissions for gasoline cars", () => {
      // Gasoline car factor is 0.21 kg per km
      const result = calculateTransportEmissions("gasolineCar", 100);
      expect(result).toBe(21);
    });

    it("should calculate correct emissions for electric cars", () => {
      // Electric car factor is 0.05 kg per km
      const result = calculateTransportEmissions("electricCar", 100);
      expect(result).toBe(5);
    });

    it("should return 0 emissions for active travel (walking/biking)", () => {
      const bikeResult = calculateTransportEmissions("bicycle", 50);
      const walkResult = calculateTransportEmissions("walking", 12);
      expect(bikeResult).toBe(0);
      expect(walkResult).toBe(0);
    });
  });

  describe("Food/Dietary Emissions", () => {
    it("should calculate correct emissions for beef servings", () => {
      // Beef is 6.5 kg CO2 per serving
      const result = calculateFoodEmissions([{ type: "beef", servings: 3 }]);
      expect(result).toBe(19.5);
    });

    it("should apply 10% local/organic sourcing discount correctly", () => {
      const standard = calculateFoodEmissions([{ type: "beef", servings: 10 }]);
      const local = calculateFoodEmissions([{ type: "beef", servings: 10 }], true);
      expect(local).toBe(standard * 0.9);
    });
  });

  describe("Electricity & Home Appliance Emissions", () => {
    it("should calculate correct emissions for standard grid appliances", () => {
      // AC draws 1.5 kW. 10 hours = 15 kWh. Standard grid intensity is 0.47 kg CO2 / kWh.
      // 15 * 0.47 = 7.05 kg CO2
      const result = calculateElectricityEmissions([{ type: "airConditioner", hours: 10 }]);
      expect(result).toBe(7.05);
    });

    it("should offset emissions correctly when renewable offset is applied", () => {
      // 100% renewable offset should result in 0 net emissions
      const result = calculateElectricityEmissions([{ type: "airConditioner", hours: 10 }], 0, 1.0);
      expect(result).toBe(0);
    });
  });

  describe("Carbon Score Normalization", () => {
    it("should return 100 score for 0 emissions", () => {
      const score = calculateCarbonScore(0);
      expect(score).toBe(100);
    });

    it("should return 0 score for emissions exceeding the baseline cap", () => {
      const score = calculateCarbonScore(700, 600);
      expect(score).toBe(0);
    });

    it("should calculate a linear rating correctly between 0 and baseline", () => {
      const score = calculateCarbonScore(300, 600); // 50% of baseline
      expect(score).toBe(50);
    });
  });

  describe("Aggregate Calculator", () => {
    it("should sum emissions from multiple sectors correctly", () => {
      const aggregate = aggregateMonthlyCarbon({
        transport: [{ mode: "gasolineCar", distanceKm: 100 }], // 21 kg
        food: { entries: [{ type: "beef", servings: 2 }], isLocalOrOrganic: false }, // 13 kg
        electricity: { usage: [{ type: "airConditioner", hours: 10 }], renewableRatio: 0 }, // 7.05 kg
        shopping: [],
        water: { tapLiters: 0, bottlesCount: 0 },
        waste: { landfillKg: 0, recycledKg: 0, compostKg: 0 }
      });
      // 21 + 13 + 7.05 = 41.05 kg CO2
      expect(aggregate).toBe(41.05);
    });
  });
});
