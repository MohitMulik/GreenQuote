/**
 * GreenQuote Domain Types
 */

export type UserRole =
  | "contractor_owner"
  | "contractor_advisor"
  | "homeowner"
  | "lender_user"
  | "operations";

export type Currency = "USD" | "INR";

export type QuoteTier = "good" | "better" | "best";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "prequalified"
  | "no_offers"
  | "signed"
  | "installing"
  | "installed"
  | "funded"
  | "cancelled";

export type LineItemType = "equipment" | "labour" | "electrical" | "permits" | "other";

export type EquipmentCategory =
  | "heat_pump"
  | "air_conditioner"
  | "furnace"
  | "solar_panel"
  | "inverter"
  | "battery";

export type RebateTiming = "instant" | "after_installation";

export type MilestoneType = "approval_draw" | "final_completion";

export type PayoutStatus =
  | "pending"
  | "requested"
  | "processing"
  | "completed"
  | "failed"
  | "held";

export interface LineItem {
  type: LineItemType;
  label: string;
  amountMinor: number;
  equipmentId?: string;
}

export interface QuoteIncentive {
  programmeId: string;
  name: string;
  amountMinor: number;
  paid: RebateTiming;
  conditions: string;
}

export interface EstimatedSavings {
  minAnnualMinor: number;
  maxAnnualMinor: number;
  assumptions: string;
}

export interface ExampleEmi {
  ratePct: number;
  termMonths: number;
  downPaymentMinor: number;
  emiMinor: number;
  aprPct: number;
}

export interface QuoteOption {
  tier: QuoteTier;
  title: string;
  description?: string;
  priceMinor: number; // Identical for cash & finance (FR-308)
  lineItems: LineItem[];
  incentives: QuoteIncentive[];
  estimatedSavings: EstimatedSavings;
  exampleEmi: ExampleEmi;
}

export interface HomeownerContact {
  fullName: string;
  phone: string;
  email: string;
}

export interface PropertyDetails {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  existingHeatingFuel: string;
  electricUtility?: string;
  homeSizeSqFt?: number;
}

export interface NormalizedOffer {
  id: string;
  lenderId: string;
  lenderName: string;
  aprPct: number;
  termMonths: number;
  monthlyPaymentMinor: number;
  amountFinancedMinor: number;
  totalCostOfCreditMinor: number;
  contractorBuyDownMinor: number;
  expiresAt: string;
}
