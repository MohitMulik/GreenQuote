export interface EnergySavingsInput {
  category: "heat_pump" | "solar_panel";
  state: string;
  existingFuel?: string;
  homeSizeSqFt?: number;
  solarCapacityKw?: number;
  seer2?: number;
}

export interface EnergySavingsResult {
  minAnnualSavingsMinor: number;
  maxAnnualSavingsMinor: number;
  assumptions: string;
}

export class SavingsService {
  calculateSavings(input: EnergySavingsInput): EnergySavingsResult {
    // 1. Rooftop Solar Calculation
    if (input.category === "solar_panel" || input.solarCapacityKw) {
      const kw = input.solarCapacityKw || 3;
      // 4 units/kWh per kW per day = 120 units/month per kW
      const annualKwh = kw * 4 * 365;
      const ratePerKwhMinor = input.state === "US" ? 25 : 800; // 8 INR (800 paise) average DISCOM tariff
      const expectedAnnualMinor = annualKwh * ratePerKwhMinor;

      const minAnnualSavingsMinor = Math.round(expectedAnnualMinor * 0.85);
      const maxAnnualSavingsMinor = Math.round(expectedAnnualMinor * 1.15);

      return {
        minAnnualSavingsMinor,
        maxAnnualSavingsMinor,
        assumptions: `Based on ${kw}kW array generating ~${Math.round(annualKwh)} kWh/year with conservative solar insolation.`,
      };
    }

    // 2. Heat Pump Calculation (Degree-day engineering model)
    const sqFt = input.homeSizeSqFt || 2000;
    const seer2 = input.seer2 || 16;
    
    // Baseline costs depending on existing heating fuel
    let baselineFactor = 1.0;
    if (input.existingFuel === "electric_resistance") baselineFactor = 1.6;
    if (input.existingFuel === "fuel_oil") baselineFactor = 1.4;
    if (input.existingFuel === "propane") baselineFactor = 1.3;

    // Estimated heating + cooling savings in USD cents:
    // Typical baseline annual HVAC bill: ~$2,200 ($1.10/sq ft)
    const baselineBillCents = sqFt * 110 * baselineFactor;
    // High-efficiency heat pump saves 25% to 45% over baseline
    const efficiencyFactor = Math.min(0.45, 0.20 + (seer2 - 14) * 0.02);

    const midSavingsCents = baselineBillCents * efficiencyFactor;
    const minAnnualSavingsMinor = Math.round(midSavingsCents * 0.8);
    const maxAnnualSavingsMinor = Math.round(midSavingsCents * 1.2);

    return {
      minAnnualSavingsMinor,
      maxAnnualSavingsMinor,
      assumptions: `Assumes ~${sqFt} sq ft living area replacing ${input.existingFuel || "legacy system"} with SEER2 ${seer2} heat pump.`,
    };
  }
}

export const savingsService = new SavingsService();
