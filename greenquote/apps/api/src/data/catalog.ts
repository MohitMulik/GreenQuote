export const FALLBACK_EQUIPMENT = [
  {
    _id: "eq_mitsubishi_msz_fs12na",
    brand: "Mitsubishi Electric",
    modelNumber: "MSZ-FS12NA",
    ahriRefNumber: "20893412",
    category: "heat_pump",
    ratings: { seer2: 26.1, eer2: 15.0, hspf2: 11.5, coolingCapacityBtu: 12000, heatingCapacityBtu: 13600 },
    isColdClimate: true,
    isEnergyStar: true,
    verificationSource: "ahri",
  },
  {
    _id: "eq_daikin_fit",
    brand: "Daikin",
    modelNumber: "FIT-DZ17VSA",
    ahriRefNumber: "20678129",
    category: "heat_pump",
    ratings: { seer2: 17.5, eer2: 11.2, hspf2: 9.5, coolingCapacityBtu: 36000, heatingCapacityBtu: 34000 },
    isColdClimate: true,
    isEnergyStar: true,
    verificationSource: "ahri",
  },
];

export const FALLBACK_INCENTIVES = [
  {
    programmeId: "inc_mass_save_hp",
    name: "Mass Save Whole-Home Heat Pump Rebate",
    amountMinor: 1_000_000,
    paymentTiming: "instant" as const,
    conditions: "Instant contractor point-of-sale deduction.",
    state: "MA",
    equipmentCategories: ["heat_pump"],
    requireColdClimate: true,
  },
];
