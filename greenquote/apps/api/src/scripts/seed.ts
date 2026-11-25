import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../config/index.js";
import { EquipmentModel } from "../modules/equipment/equipment.model.js";
import { IncentiveProgramModel } from "../modules/incentives/incentive.model.js";
import { ContractorModel } from "../modules/contractors/contractor.model.js";
import { UserModel } from "../modules/auth/user.model.js";
import { QuoteModel } from "../modules/quotes/quote.model.js";
import { PrequalificationModel } from "../modules/prequal/prequal.model.js";
import { OfferModel } from "../modules/offers/offer.model.js";
import { MilestoneModel } from "../modules/milestones/milestone.model.js";
import { AuditEventModel } from "../modules/admin/audit.model.js";
import { encryptPii } from "../security/pii-vault.js";

export async function seedDatabase(disconnectAfter = false) {
  if (mongoose.connection.readyState !== 1) {
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(config.mongoUri);
  }

  console.log("Seeding Equipment Directory (AHRI & Solar)...");
  await EquipmentModel.deleteMany({});
  await EquipmentModel.create([
    {
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
      brand: "Daikin",
      modelNumber: "FIT-DZ17VSA",
      ahriRefNumber: "20678129",
      category: "heat_pump",
      ratings: { seer2: 17.5, eer2: 11.2, hspf2: 9.5, coolingCapacityBtu: 36000, heatingCapacityBtu: 34000 },
      isColdClimate: true,
      isEnergyStar: true,
      verificationSource: "ahri",
    },
    {
      brand: "Bosch",
      modelNumber: "BOVA-36HDN1",
      ahriRefNumber: "20549103",
      category: "heat_pump",
      ratings: { seer2: 20.0, eer2: 12.5, hspf2: 10.0, coolingCapacityBtu: 36000, heatingCapacityBtu: 35000 },
      isColdClimate: true,
      isEnergyStar: true,
      verificationSource: "ahri",
    },
    {
      brand: "Carrier",
      modelNumber: "25VNA436A003",
      ahriRefNumber: "20784912",
      category: "heat_pump",
      ratings: { seer2: 24.0, eer2: 14.0, hspf2: 11.0, coolingCapacityBtu: 36000, heatingCapacityBtu: 36000 },
      isColdClimate: true,
      isEnergyStar: true,
      verificationSource: "ahri",
    },
    {
      brand: "Tata Power Solar",
      modelNumber: "TP-DCR-550W",
      category: "solar_panel",
      ratings: { solarWattage: 550 },
      isColdClimate: false,
      isEnergyStar: true,
      verificationSource: "manual",
    },
    {
      brand: "Enphase",
      modelNumber: "IQ8PLUS-72-2-US",
      category: "inverter",
      ratings: {},
      isColdClimate: true,
      isEnergyStar: true,
      verificationSource: "manual",
    },
  ]);

  console.log("Seeding Active Incentive Programs (Post-Dec 2025 Compliant)...");
  await IncentiveProgramModel.collection.drop().catch(() => {});
  await IncentiveProgramModel.create([
    {
      name: "Mass Save Whole-Home Heat Pump Rebate",
      authorityType: "utility",
      state: "MA",
      utilityProvider: "Eversource / National Grid",
      rules: { equipmentCategories: ["heat_pump"], requireColdClimate: true, minSeer2: 16 },
      amountStructure: { type: "fixed", valueMinor: 1000000 }, // $10,000
      paymentTiming: "instant",
      startDate: new Date("2026-01-01"),
      isActive: true,
    },
    {
      name: "NYS Clean Heat Cold-Climate Incentive",
      authorityType: "state",
      state: "NY",
      utilityProvider: "ConEdison",
      rules: { equipmentCategories: ["heat_pump"], requireColdClimate: true, minSeer2: 16 },
      amountStructure: { type: "fixed", valueMinor: 800000 }, // $8,000
      paymentTiming: "after_installation",
      startDate: new Date("2026-01-01"),
      isActive: true,
    },
    {
      name: "Colorado Clean Energy Heat Pump Rebate",
      authorityType: "state",
      state: "CO",
      utilityProvider: "Xcel Energy",
      rules: { equipmentCategories: ["heat_pump"], minSeer2: 15 },
      amountStructure: { type: "fixed", valueMinor: 400000 }, // $4,000
      paymentTiming: "after_installation",
      startDate: new Date("2026-01-01"),
      isActive: true,
    },
    {
      name: "PM Surya Ghar: Muft Bijli Yojana (Central Subsidy)",
      authorityType: "federal",
      state: "IN",
      rules: { equipmentCategories: ["solar_panel"] },
      amountStructure: { type: "fixed", valueMinor: 7800000 }, // ₹78,000 for 3kW
      paymentTiming: "after_installation",
      startDate: new Date("2024-02-15"),
      isActive: true,
    },
  ]);

  console.log("Seeding Contractors & Users...");
  await ContractorModel.deleteMany({});
  await UserModel.deleteMany({});

  const einHash = await bcrypt.hash("12-3456789", 8);
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const contractor = await ContractorModel.create({
    legalName: "SunVolt Green Energy Pvt. Ltd.",
    tradeName: "SunVolt Solar Systems",
    einHash,
    businessAddress: { street: "B-42, Sector 62", city: "Noida", state: "UP", zipCode: "201309", isPoBox: false },
    ownerDetails: { fullName: "Sanjay Patel", email: "sanjay@sunvoltsolar.in", phone: "+91 98110 54321" },
    tradeCategories: ["solar", "heat_pump", "battery"],
    kybStatus: "passed",
    status: "active",
    plan: "pro",
  });

  // Contractor Owner (Sanjay)
  await UserModel.create({
    fullName: "Sanjay Patel",
    email: "sanjay@apexhvac.com",
    passwordHash,
    role: "contractor_owner",
    contractorId: contractor._id.toString(),
    mfaEnabled: false,
    status: "active",
  });

  // Contractor Advisor (Rahul)
  const advisor = await UserModel.create({
    fullName: "Rahul Sharma",
    email: "rahul@apexhvac.com",
    passwordHash,
    role: "contractor_advisor",
    contractorId: contractor._id.toString(),
    mfaEnabled: false,
    status: "active",
  });

  // Operations User (Ayesha)
  await UserModel.create({
    fullName: "Ayesha Khan",
    email: "ayesha@greenquote.io",
    passwordHash,
    role: "operations",
    mfaEnabled: false,
    status: "active",
  });

  console.log("Seeding End-to-End Sample Quote & Loan Lifecycle...");
  await QuoteModel.deleteMany({});
  await PrequalificationModel.deleteMany({});
  await OfferModel.deleteMany({});
  await MilestoneModel.deleteMany({});
  await AuditEventModel.deleteMany({});

  const sampleQuote = await QuoteModel.create({
    contractorId: contractor._id.toString(),
    advisorId: advisor._id.toString(),
    currency: "INR",
    status: "signed",
    version: 1,
    linkToken: "demo-token",
    linkExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    homeowner: {
      fullName: "Rajesh Kumar Sharma",
      phone: "+91 98765 43210",
      email: "rajesh.sharma@example.in",
    },
    property: {
      streetAddress: "B-42, Sector 62",
      city: "Noida",
      state: "UP",
      zipCode: "201309",
      existingHeatingFuel: "electric",
      electricUtility: "PVVNL (Paschimanchal Vidyut Vitran Nigam)",
    },
    options: [
      {
        tier: "good",
        title: "Good: 2 kW Grid-Tied Rooftop Solar + 5-Star Inverter AC",
        priceMinor: 15000000, // ₹1,50,000
        lineItems: [
          { type: "equipment", label: "Waaree 2 kW Monocrystalline ALMM Tier-1 Panels", amountMinor: 9000000 },
          { type: "labour", label: "Turnkey Installation & Mounting Structure", amountMinor: 4500000 },
          { type: "permits", label: "DISCOM Net-Metering & CEIG Approvals", amountMinor: 1500000 },
        ],
        incentives: [
          { programmeId: "prog_surya_ghar_2kw", name: "PM Surya Ghar Muft Bijli Yojana Central Subsidy", amountMinor: 6000000, paid: "instant", conditions: "Residential consumer with grid connection" },
        ],
        estimatedSavings: { minAnnualMinor: 2400000, maxAnnualMinor: 3600000, assumptions: "Based on PVVNL DISCOM tariffs and 8 units/day solar generation" },
        exampleEmi: { ratePct: 7.00, termMonths: 60, downPaymentMinor: 1500000, emiMinor: 178200 },
      },
      {
        tier: "better",
        title: "Better: 3 kW High-Efficiency Bifacial Solar System",
        priceMinor: 22000000, // ₹2,20,000
        lineItems: [
          { type: "equipment", label: "Tata Power Solar 3 kW Dual-Glass Bifacial System", amountMinor: 14000000 },
          { type: "labour", label: "3.3 kVA Smart Solar Hybrid Inverter & Wiring", amountMinor: 4500000 },
          { type: "electrical", label: "GI Structure, Earthing Pit & Lightning Arrestor (IS 3043)", amountMinor: 2500000 },
          { type: "permits", label: "CEIG Inspection & DISCOM Sync Approvals", amountMinor: 1000000 },
        ],
        incentives: [
          { programmeId: "prog_surya_ghar_3kw", name: "PM Surya Ghar Muft Bijli Yojana Maximum Subsidy", amountMinor: 7800000, paid: "instant", conditions: "National Portal DBT scheme registered" },
        ],
        estimatedSavings: { minAnnualMinor: 4200000, maxAnnualMinor: 6000000, assumptions: "Based on 3kW generating ~4,380 kWh/year at ₹8/unit" },
        exampleEmi: { ratePct: 7.00, termMonths: 60, downPaymentMinor: 2000000, emiMinor: 241500 },
      },
    ],
  });

  const prequal = await PrequalificationModel.create({
    quoteId: sampleQuote._id.toString(),
    selectedTier: "better",
    amountRequestedMinor: 12200000, // ₹1,22,000 financed
    downPaymentMinor: 2000000, // ₹20,000 down payment
    applicant: {
      dateOfBirthEncrypted: encryptPii("1984-07-16"),
      annualIncomeEncrypted: encryptPii("120000000"), // ₹12,00,000 annual income
      housingPaymentEncrypted: encryptPii("2500000"), // ₹25,000 rent/mortgage
      panLastFourEncrypted: encryptPii("1234"),
    },
    consent: {
      softPullAgreed: true,
      tcpaAgreed: true,
      consentVersion: "2026-v1",
      timestamp: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "Demo Browser",
    },
    status: "offers_ready",
    idempotencyKey: `idemp_seed_${Date.now()}`,
  });

  const sampleOffer = await OfferModel.create({
    prequalificationId: prequal._id.toString(),
    lenderId: "lnd_sbi",
    lenderName: "State Bank of India (Surya Ghar Solar Loan)",
    aprPct: 7.00,
    termMonths: 60,
    monthlyPaymentMinor: 241500, // ₹2,415 / mo
    amountFinancedMinor: 12200000, // ₹1,22,000
    totalCostOfCreditMinor: 14490000, // ₹1,44,900
    contractorBuyDownMinor: 0,
    status: "selected",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  await MilestoneModel.create({
    loanId: sampleOffer._id.toString(),
    contractorId: contractor._id.toString(),
    homeownerId: sampleQuote.homeowner.phone,
    type: "final_completion",
    amountMinor: 12200000,
    status: "pending",
    evidenceUrls: [],
    equipmentVerified: false,
  });

  await AuditEventModel.create({
    actor: { userId: "seed_script", role: "operations", ipAddress: "127.0.0.1" },
    action: "DATABASE_INITIALIZED_AND_SEEDED",
    entityType: "system",
    entityId: "seed_init",
  });

  console.log("Seeding completed successfully!");
  console.log("\nDemo Credentials (Password: Password123!):");
  console.log("- Contractor Owner: sanjay@apexhvac.com");
  console.log("- Contractor Advisor: rahul@apexhvac.com");
  console.log("- GreenQuote Operations: ayesha@greenquote.io");
  console.log("\nLive Demo URL: http://localhost:3000/quote/demo-token");
  console.log("Contractor Pipeline URL: http://localhost:3000/contractor/pipeline");
  console.log("Milestones URL: http://localhost:3000/contractor/milestones/" + sampleOffer._id.toString());

  if (disconnectAfter) {
    await mongoose.disconnect();
  }
}

const isDirectRun =
  process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js");
if (isDirectRun) {
  seedDatabase(true).catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}
