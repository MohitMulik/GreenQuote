export const FALLBACK_EQUIPMENT = [
  // Indian Clean Energy / Rooftop Solar & Hybrid Inverters
  {
    _id: "eq_waaree_bifacial_540",
    brand: "Waaree Energies",
    modelNumber: "WS-540-BIFACIAL",
    ahriRefNumber: "BIS-R-41123456",
    category: "solar_pv",
    ratings: {
      seer2: 24.0,
      peakPowerWatts: 540,
      efficiencyPct: 21.3,
      bifacialityFactor: 0.70,
      temperatureCoefficient: -0.35,
    },
    isAlmmApproved: true,
    isBisCertified: true,
    verificationSource: "almm_portal",
  },
  {
    _id: "eq_tata_power_solar_450",
    brand: "Tata Power Solar",
    modelNumber: "TP-MONO-PERC-450",
    ahriRefNumber: "BIS-R-41189012",
    category: "solar_pv",
    ratings: {
      seer2: 22.0,
      peakPowerWatts: 450,
      efficiencyPct: 20.8,
      temperatureCoefficient: -0.36,
    },
    isAlmmApproved: true,
    isBisCertified: true,
    verificationSource: "almm_portal",
  },
  {
    _id: "eq_havells_hybrid_inverter",
    brand: "Havells Enviro",
    modelNumber: "ENV-HYB-5KW",
    ahriRefNumber: "BIS-R-41209876",
    category: "inverter",
    ratings: {
      seer2: 20.0,
      ratedOutputKw: 5.0,
      maxEfficiencyPct: 97.6,
      gridTiedWithStorage: true,
    },
    isAlmmApproved: true,
    isBisCertified: true,
    verificationSource: "mnre_approved",
  },
  // Certified Heat Pumps
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
  // Indian PM Surya Ghar Muft Bijli Yojana & State Clean Energy Incentives
  {
    programmeId: "inc_pm_surya_ghar_3kw",
    name: "PM Surya Ghar: Muft Bijli Yojana (Up to 3 kW CFA)",
    amountMinor: 7_800_000, // ₹78,000 Central Financial Assistance
    paymentTiming: "instant" as const,
    conditions: "Direct Benefit Transfer (DBT) upfront subsidy deducted at point-of-sale via National Portal.",
    state: "NATIONAL",
    equipmentCategories: ["solar_pv", "inverter", "heat_pump"],
    requireColdClimate: false,
    requiresDomesticContentRequirement: true,
  },
  {
    programmeId: "inc_pm_surya_ghar_2kw",
    name: "PM Surya Ghar: Muft Bijli Yojana (Up to 2 kW CFA)",
    amountMinor: 6_000_000, // ₹60,000 Central Financial Assistance
    paymentTiming: "instant" as const,
    conditions: "Direct Benefit Transfer (DBT) upfront subsidy for systems up to 2 kW.",
    state: "NATIONAL",
    equipmentCategories: ["solar_pv", "inverter", "heat_pump"],
    requireColdClimate: false,
    requiresDomesticContentRequirement: true,
  },
  {
    programmeId: "inc_state_discom_solar",
    name: "State DISCOM Clean Energy Top-up Incentive",
    amountMinor: 2_000_000, // ₹20,000 additional state subsidy
    paymentTiming: "after_installation" as const,
    conditions: "Claimed post-commissioning directly through State Electricity Regulatory Commission (SERC) portal.",
    state: "MH",
    equipmentCategories: ["solar_pv"],
    requireColdClimate: false,
    requiresDomesticContentRequirement: true,
  },
  // Utility and Clean Energy Rebates
  {
    programmeId: "inc_mass_save_hp",
    name: "Clean Energy Whole-Home Heat Pump Rebate",
    amountMinor: 1_000_000,
    paymentTiming: "instant" as const,
    conditions: "Instant contractor point-of-sale deduction.",
    state: "MA",
    equipmentCategories: ["heat_pump"],
    requireColdClimate: true,
    requiresDomesticContentRequirement: false,
  },
];
