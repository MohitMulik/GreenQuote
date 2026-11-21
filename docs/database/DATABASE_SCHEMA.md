# GreenQuote — Database Schema Specification
## MongoDB Data Model, Collections, Indexes & Security Attributes

**Document Version:** 1.0  
**Database Engine:** MongoDB 7.0+ / Atlas  
**ORM / Driver:** Mongoose 8.x with TypeScript  
**Reference:** PRD v1.1 Section 13.1  

---

## 1. Schema Conventions & Rules

1. **Identifiers:** All collections use string IDs (prefixed UUIDs or nanoids, e.g., `cnt_abc123`, `qte_xyz789`) or default MongoDB `ObjectId`.
2. **Monetary Values:** Stored as 64-bit integers (`Long` / `Number`) in the smallest currency unit (e.g., paise for INR, cents for USD), suffixed with `Minor`.
3. **Auditability:** Every document contains `createdAt` and `updatedAt` ISO-8601 timestamps.
4. **Tenant Isolation:** All contractor-owned documents include an indexed `contractorId`.
5. **Soft Deletions:** High-value entities use `deletedAt: Date | null` rather than physical removal.
6. **PII Classification:** Fields classified as `HIGH_PII` are stored in the encrypted PII vault using Client-Side Field-Level Encryption (CSFLE).

---

## 2. Collections & Entity Definitions

### 2.1 `contractors`
Contracting business entities operating on the GreenQuote platform.

```typescript
interface IContractor {
  _id: string; // "cnt_..."
  legalName: string;
  tradeName?: string; // DBA
  einHash: string; // SHA-256 hash for duplicate detection
  businessAddress: {
    street: string;
    city: string;
    state: string; // 2-letter code
    zipCode: string;
    isPoBox: boolean; // Must be false (FR-201)
  };
  ownerDetails: {
    fullName: string;
    email: string;
    phone: string;
  };
  tradeCategories: Array<"hvac" | "heat_pump" | "solar" | "electrical">;
  
  // Verification & Compliance
  kybStatus: "pending" | "passed" | "failed" | "manual_review";
  kybProvider?: string;
  kybCompletedAt?: Date;
  
  licenses: Array<{
    state: string;
    licenseNumber: string;
    expiresAt: Date;
    documentUrl: string;
    verified: boolean;
  }>;
  
  insurance: {
    provider: string;
    policyNumber: string;
    coverageAmountMinor: number;
    expiresAt: Date;
    documentUrl: string;
    verified: boolean;
  };
  
  // Payout Destination
  payoutAccount?: {
    accountToken: string;
    bankName: string;
    lastFour: string;
    accountHolderName: string;
    verifiedAt: Date;
  };
  
  platformAgreement: {
    version: string;
    acceptedAt: Date;
    ipAddress: string;
  };
  
  status: "pending_review" | "active" | "suspended" | "rejected";
  plan: "starter" | "pro" | "team";
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ einHash: 1 }` (Unique)
- `{ status: 1 }`
- `{ "licenses.expiresAt": 1 }`

---

### 2.2 `contractorUsers`
Individual accounts belonging to contractor organizations (Owners and Advisors).

```typescript
interface IContractorUser {
  _id: string; // "usr_..."
  contractorId: string; // Ref: contractors._id
  fullName: string;
  email: string; // Normalized lowercase
  phone: string;
  role: "contractor_owner" | "contractor_advisor";
  
  passwordHash: string; // bcrypt (cost 12)
  mfaSecret?: string; // TOTP secret (encrypted)
  mfaEnabled: boolean;
  
  status: "active" | "deactivated";
  invitedBy?: string;
  lastLoginAt?: Date;
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ email: 1 }` (Unique)
- `{ contractorId: 1, role: 1 }`

---

### 2.3 `homeowners` & PII Vault
Homeowner identity and personal financial records. Sensitive fields reside in the CSFLE vault.

```typescript
interface IHomeowner {
  _id: string; // "hmw_..."
  fullName: string;
  phone: string;
  email: string;
  
  // Encrypted via CSFLE in PII Vault:
  dateOfBirth?: string; // [ENCRYPTED] YYYY-MM-DD
  ssnLastFour?: string; // [ENCRYPTED] 4 digits
  annualIncomeMinor?: number; // [ENCRYPTED]
  housingPaymentMinor?: number; // [ENCRYPTED]
  
  consentRecords: Array<{
    type: "tcpa_sms" | "fcra_soft_pull" | "hard_pull_ack" | "esign_consent";
    version: string;
    consentText: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ phone: 1 }`
- `{ email: 1 }`

---

### 2.4 `properties`
Installation property details and energy profiles.

```typescript
interface IProperty {
  _id: string; // "prp_..."
  homeownerId: string; // Ref: homeowners._id
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  electricUtility: string;
  naturalGasUtility?: string;
  homeSizeSqFt?: number;
  existingHeatingFuel: "natural_gas" | "electric_resistance" | "fuel_oil" | "propane" | "heat_pump";
  ownerOccupied: boolean; // Must be true for residential green loans (PRD Section 4.2)
  createdAt: Date;
}
```
**Indexes:**
- `{ homeownerId: 1 }`
- `{ zipCode: 1 }`

---

### 2.5 `quotes`
Contractor sales quotations containing Good / Better / Best configuration tiers.

```typescript
interface IQuoteLineItem {
  type: "equipment" | "labour" | "electrical" | "permits" | "other";
  label: string;
  amountMinor: number;
  equipmentId?: string; // Ref: equipment._id
}

interface IQuoteIncentive {
  programmeId: string; // Ref: incentivePrograms._id
  name: string;
  amountMinor: number;
  paid: "instant" | "after_installation";
  conditions: string;
}

interface IQuoteTierOption {
  tier: "good" | "better" | "best";
  title: string;
  description?: string;
  priceMinor: number; // Single price rule: identical for cash and finance (FR-308)
  lineItems: IQuoteLineItem[];
  incentives: IQuoteIncentive[];
  estimatedAnnualSavingsMinor: {
    minMinor: number;
    maxMinor: number;
    assumptions: string;
  };
  exampleEmi: {
    ratePct: number;
    termMonths: number;
    downPaymentMinor: number;
    emiMinor: number;
    aprPct: number; // CMP-01 Trigger term requirement
  };
}

interface IQuote {
  _id: string; // "qte_..."
  contractorId: string; // Ref: contractors._id
  advisorId: string; // Ref: contractorUsers._id
  homeownerId: string; // Ref: homeowners._id
  propertyId: string; // Ref: properties._id
  
  currency: "INR" | "USD";
  version: number;
  status: "draft" | "sent" | "viewed" | "prequalified" | "no_offers" | "signed" | "installed" | "funded" | "cancelled";
  
  options: IQuoteTierOption[];
  
  // Security & Link Expiry
  linkToken: string; // Cryptographic hash
  linkExpiresAt: Date; // 30-day lifetime (FR-307)
  otpHash?: string; // Temporary bcrypt OTP for access
  otpExpiresAt?: Date;
  
  smsConsentRecorded: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ contractorId: 1, status: 1 }`
- `{ advisorId: 1 }`
- `{ linkToken: 1 }` (Unique)
- `{ homeownerId: 1 }`

---

### 2.6 `equipment`
Certified energy equipment directory (AHRI / NEEP).

```typescript
interface IEquipment {
  _id: string; // "eqp_..."
  brand: string;
  modelNumber: string;
  ahriRefNumber?: string;
  category: "heat_pump" | "air_conditioner" | "furnace" | "solar_panel" | "inverter" | "battery";
  
  ratings: {
    seer2?: number;
    eer2?: number;
    hspf2?: number;
    coolingCapacityBtu?: number;
    heatingCapacityBtu?: number;
    solarWattage?: number;
  };
  
  isColdClimate: boolean; // NEEP certified
  isEnergyStar: boolean;
  verificationSource: "ahri" | "neep" | "manual";
  verifiedAt: Date;
  createdAt: Date;
}
```
**Indexes:**
- `{ modelNumber: "text", brand: "text" }`
- `{ ahriRefNumber: 1 }`

---

### 2.7 `incentivePrograms`
Rebate programmes, rules, and funding availability.

```typescript
interface IIncentiveProgram {
  _id: string; // "inc_..."
  name: string; // e.g., "IRA HOMES Heat Pump Rebate", "PM Surya Ghar"
  authorityType: "federal" | "state" | "utility" | "municipal";
  state: string; // e.g., "MA", "NY", "CO"
  utilityProvider?: string;
  
  rules: {
    equipmentCategories: string[];
    minSeer2?: number;
    minHspf2?: number;
    requireColdClimate?: boolean;
    incomeQualifiedMaxAmiPct?: number; // e.g., 80% Area Median Income
  };
  
  amountStructure: {
    type: "fixed" | "percentage";
    valueMinor: number; // Or percentage integer (e.g., 50 for 50%)
    maxCapMinor?: number;
  };
  
  paymentTiming: "instant" | "after_installation";
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ state: 1, isActive: 1 }`
- `{ utilityProvider: 1 }`

---

### 2.8 `prequalifications` & `offers`
Soft-inquiry consumer credit requests and multi-lender offer responses.

```typescript
interface IPrequalification {
  _id: string; // "prq_..."
  quoteId: string; // Ref: quotes._id
  homeownerId: string; // Ref: homeowners._id
  selectedOptionTier: "good" | "better" | "best";
  
  requestedAmountMinor: number;
  downPaymentMinor: number;
  
  lendersQueried: string[]; // Lender IDs
  lendersResponded: string[];
  
  status: "pending" | "offers_ready" | "all_declined" | "expired";
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IOffer {
  _id: string; // "ofr_..."
  prequalificationId: string; // Ref: prequalifications._id
  lenderId: string; // Ref: lenders._id
  lenderName: string;
  
  aprPct: number;
  termMonths: number;
  monthlyPaymentMinor: number;
  amountFinancedMinor: number;
  totalCostOfCreditMinor: number; // (Monthly * Months) - Principal + Fees
  
  // Contractor Buy-Down
  contractorBuyDownMinor: number; // Max 5% of amount financed
  originalRatePct?: number;
  
  status: "active" | "selected" | "expired" | "declined";
  declineReasonCodes?: string[];
  lenderOfferReference?: string;
  expiresAt: Date;
  createdAt: Date;
}
```
**Indexes:**
- `{ prequalificationId: 1 }`
- `{ idempotencyKey: 1 }` (Unique on prequalifications)
- `{ prequalificationId: 1, lenderId: 1 }`

---

### 2.9 `lenders`
Lending institution configurations and credit box parameters.

```typescript
interface ILender {
  _id: string; // "lnd_..."
  name: string;
  displayName: string;
  isActive: boolean;
  
  statesServed: string[];
  minLoanAmountMinor: number;
  maxLoanAmountMinor: number;
  
  creditBox: {
    minCreditScore: number;
    maxDtiPct: number;
    allowedCategories: string[];
  };
  
  adapterConfig: {
    adapterType: "credit_union_api" | "clean_energy_fund" | "nbfc_pos";
    endpointUrl: string;
    timeoutMs: number; // Default 20,000ms (FR-602)
    credentialsKmsKeyId: string;
  };
  
  circuitBreaker: {
    consecutiveFailures: number;
    lastFailureTime?: Date;
    state: "closed" | "open" | "half_open";
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.10 `loanRecords` & `milestones`
Formalized loan contracts, signature tracking, and milestone funding records.

```typescript
interface ILoanRecord {
  _id: string; // "lon_..."
  offerId: string; // Ref: offers._id
  prequalificationId: string;
  quoteId: string;
  contractorId: string;
  homeownerId: string;
  lenderId: string;
  
  lenderLoanId: string;
  status: "approved" | "e_signed" | "installing" | "completion_submitted" | "confirmed_by_homeowner" | "payout_requested" | "funded" | "cancelled";
  
  amountFinancedMinor: number;
  aprPct: number;
  termMonths: number;
  
  signedDocuments: Array<{
    type: "tila_disclosure" | "promissory_note" | "contractor_agreement";
    documentStorageKey: string;
    signedAt: Date;
    signerIp: string;
    signerUserAgent: string;
  }>;
  
  milestones: Array<{
    type: "approval_draw" | "final_completion";
    percentage: number;
    amountMinor: number;
    status: "pending" | "submitted" | "confirmed" | "payout_released";
    evidenceUrls?: string[]; // Equipment photos, serial nameplate
    verifiedEquipmentMatch?: boolean;
    homeownerConfirmedAt?: Date;
    payoutReleasedAt?: Date;
  }>;
  
  rescissionPeriodEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```
**Indexes:**
- `{ contractorId: 1, status: 1 }`
- `{ lenderId: 1, lenderLoanId: 1 }`
- `{ homeownerId: 1 }`

---

### 2.11 `auditEvents`
Append-only, immutable regulatory audit trail (CMP-01 to CMP-12, NFR-11).

```typescript
interface IAuditEvent {
  _id: string;
  timestamp: Date;
  actor: {
    userId?: string;
    role: "contractor_owner" | "contractor_advisor" | "homeowner" | "lender_user" | "operations" | "system";
    ipAddress: string;
    userAgent: string;
  };
  action: string; // e.g., "PREQUAL_CONSENT_GIVEN", "TILA_DISCLOSURE_VIEWED", "PAYOUT_RELEASED"
  entityType: "quote" | "prequalification" | "offer" | "loan_record" | "payout" | "contractor";
  entityId: string;
  metadata: Record<string, unknown>; // Snapshot of consent text, model inputs, etc.
}
```
**Indexes:**
- `{ entityType: 1, entityId: 1 }`
- `{ timestamp: -1 }`
- `{ "actor.userId": 1 }`
