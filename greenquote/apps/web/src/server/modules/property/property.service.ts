import { logger } from "../../lib/logger";

export interface PropertyTitleVerificationRequest {
  applicantName: string;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  statedOwnershipType?: "sole_owner" | "joint_tenancy" | "tenants_in_common";
}

export interface PropertyTitleVerificationResult {
  verified: boolean;
  matchStatus: "MATCH_CONFIRMED" | "CO_OWNER_DETECTED" | "NAME_MISMATCH" | "MANUAL_REVIEW_REQUIRED";
  parcelNumber: string;
  assessorOwnerName: string;
  ownershipType: string;
  propertyType: "single_family" | "multi_family" | "condo" | "commercial";
  lastTransferDate: string;
  hasUnresolvedLiens: boolean;
  confidenceScore: number;
  advisoryNotes: string[];
}

/**
 * Normalizes name strings for fuzzy county records matching
 */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Public County Assessor & Title Records Verification Engine (FR-504)
 * Verifies applicant ownership before loan finalization and milestone 1 disbursement.
 */
export function verifyPropertyOwnership(
  req: PropertyTitleVerificationRequest
): PropertyTitleVerificationResult {
  logger.info(
    { applicant: req.applicantName, address: req.propertyAddress },
    "executing property title ownership verification"
  );

  const cleanApplicant = normalizeName(req.applicantName);

  // Deterministic demonstration matching logic
  // In production, queries LexisNexis / CoreLogic / ATTOM Data Solutions API
  if (cleanApplicant.includes("jenkins") || cleanApplicant.includes("sarah")) {
    return {
      verified: true,
      matchStatus: "MATCH_CONFIRMED",
      parcelNumber: "04-291-002",
      assessorOwnerName: "SARAH E JENKINS & MICHAEL T JENKINS",
      ownershipType: "joint_tenancy",
      propertyType: "single_family",
      lastTransferDate: "2019-06-12",
      hasUnresolvedLiens: false,
      confidenceScore: 0.98,
      advisoryNotes: [
        "Primary applicant name exactly matches recorded deed title",
        "Property is primary owner-occupied residence",
        "Zero tax liens or secondary deed encumbrances detected",
      ],
    };
  }

  if (cleanApplicant.includes("smith")) {
    return {
      verified: true,
      matchStatus: "CO_OWNER_DETECTED",
      parcelNumber: "12-881-409",
      assessorOwnerName: "SMITH FAMILY REVOCABLE TRUST",
      ownershipType: "trust",
      propertyType: "single_family",
      lastTransferDate: "2021-03-18",
      hasUnresolvedLiens: false,
      confidenceScore: 0.85,
      advisoryNotes: [
        "Property held in family trust; certificate of trust required prior to note execution",
      ],
    };
  }

  // Fallback for mismatch simulation
  return {
    verified: false,
    matchStatus: "NAME_MISMATCH",
    parcelNumber: "99-001-332",
    assessorOwnerName: "STATE STREET HOLDINGS REALTY LLC",
    ownershipType: "commercial_entity",
    propertyType: "multi_family",
    lastTransferDate: "2015-11-04",
    hasUnresolvedLiens: true,
    confidenceScore: 0.22,
    advisoryNotes: [
      "Applicant name does not match deed records on file with county assessor",
      "Property registered as commercial or absentee investment property",
      "Manual title verification review required before loan underwriting",
    ],
  };
}
