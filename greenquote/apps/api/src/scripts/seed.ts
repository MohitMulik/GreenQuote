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

async function seed() {
  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(config.mongoUri);

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
  await IncentiveProgramModel.deleteMany({});
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
    legalName: "Apex Clean Energy & HVAC LLC",
    tradeName: "Apex Comfort Systems",
    einHash,
    businessAddress: { street: "500 Innovation Way", city: "Boston", state: "MA", zipCode: "02108", isPoBox: false },
    ownerDetails: { fullName: "Sanjay Patel", email: "sanjay@apexhvac.com", phone: "+16175550100" },
    tradeCategories: ["hvac", "heat_pump", "solar"],
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
    currency: "USD",
    status: "signed",
    version: 1,
    linkToken: "demo-token",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    homeowner: {
      fullName: "Sarah Jenkins",
      phone: "+16175550188",
      email: "sarah@example.com",
    },
    property: {
      streetAddress: "42 Commonwealth Ave",
      city: "Boston",
      state: "MA",
      zipCode: "02108",
      existingHeatingFuel: "fuel_oil",
      electricUtility: "Eversource",
    },
    options: [
      {
        tier: "good",
        title: "Good: 15.2 SEER2 Standard Heat Pump",
        priceMinor: 1040000,
        lineItems: [
          { type: "equipment", label: "Daikin Standard 3-Ton Heat Pump", amountMinor: 750000 },
          { type: "labour", label: "System Installation & Duct Hookup", amountMinor: 250000 },
          { type: "permits", label: "City Mechanical & Electrical Permits", amountMinor: 40000 },
        ],
        incentives: [
          { programmeId: "prog_mass_save", name: "Mass Save Standard Rebate", amountMinor: 400000, paid: "instant", conditions: "Active utility customer" },
        ],
        estimatedSavings: { minAnnualMinor: 40000, maxAnnualMinor: 65000, assumptions: "Based on replacing fuel oil in Boston, MA" },
        exampleEmi: { ratePct: 7.99, termMonths: 60, downPaymentMinor: 104000, emiMinor: 18900 },
      },
      {
        tier: "better",
        title: "Better: Cold-Climate Hyper-Heat Pump (NEEP Certified)",
        priceMinor: 1540000,
        lineItems: [
          { type: "equipment", label: "Mitsubishi H2i Cold-Climate 3-Ton (MSZ-FS12NA)", amountMinor: 1050000 },
          { type: "labour", label: "Certified Hyper-Heat Installation", amountMinor: 320000 },
          { type: "electrical", label: "200A Electrical Sub-Panel Upgrade", amountMinor: 120000 },
          { type: "permits", label: "City Permits & HERS Inspection", amountMinor: 50000 },
        ],
        incentives: [
          { programmeId: "prog_mass_save_whole", name: "Mass Save Whole-Home Heat Pump Rebate", amountMinor: 1000000, paid: "instant", conditions: "Whole-home weatherization verified" },
        ],
        estimatedSavings: { minAnnualMinor: 90000, maxAnnualMinor: 140000, assumptions: "Based on replacing fuel oil with NEEP cold-climate heat pump" },
        exampleEmi: { ratePct: 5.75, termMonths: 60, downPaymentMinor: 154000, emiMinor: 26600 },
      },
    ],
  });

  const prequal = await PrequalificationModel.create({
    quoteId: sampleQuote._id.toString(),
    selectedTier: "better",
    amountRequestedMinor: 1386000,
    downPaymentMinor: 154000,
    applicant: {
      dateOfBirthEncrypted: encryptPii("1982-05-14"),
      annualIncomeEncrypted: encryptPii("11000000"),
      housingPaymentEncrypted: encryptPii("220000"),
      ssnLastFourEncrypted: encryptPii("8921"),
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
    lenderId: "lnd_vermont_cu",
    lenderName: "Vermont Clean Energy CU",
    aprPct: 5.75,
    termMonths: 60,
    monthlyPaymentMinor: 26632,
    amountFinancedMinor: 1386000,
    totalCostOfCreditMinor: 1597920,
    contractorBuyDownMinor: 0,
    status: "selected",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  await MilestoneModel.create({
    loanId: sampleOffer._id.toString(),
    contractorId: contractor._id.toString(),
    homeownerId: sampleQuote.homeowner.phone,
    type: "final_completion",
    amountMinor: 1386000,
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

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
