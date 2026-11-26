# GREENQUOTE — DAY 2 FINANCIAL & LOCALISATION REPORT

**Author:** Senior FinTech Backend Engineer & Financial Systems Architect  
**Project:** GreenQuote Platform ([github.com/MohitMulik/GreenQuote](https://github.com/MohitMulik/GreenQuote))  
**Date:** November 26, 2026  
**Status:** Completed & Validated (All Test Suites Passing, Next.js Build Clean)  

---

## Executive Summary

During the Day 2 sprint, GreenQuote was comprehensively aligned with Indian rooftop solar financing realities, the statutory PM Surya Ghar: Muft Bijli Yojana Central Financial Assistance (CFA) subsidy formula, Indian regulatory disclosures (RBI Digital Lending Directions 2022/2024, Key Fact Statement (KFS), CIBIL soft-pull), and Indian business schemas (PAN, GSTIN, PIN code).

All calculations operate with integer paise precision (zero floating-point drift), and the shared financial engine was strictly preserved while adding authoritative subsidy treatment, APR including processing fees + 18% GST, and Hindi (`hi`) localization foundation.

---

## 1. PM Surya Ghar Subsidy Engine

### Statutory Formula Implemented
In strict compliance with MNRE guidelines and the master technical audit requirement:
$$\text{CFA} = \min(\text{kW}, 2) \times ₹30,000 + \min(\max(\text{kW} - 2, 0), 1) \times ₹18,000$$
$$\text{Maximum Residential CFA} = ₹78,000$$

Implemented as `calculatePmSuryaGharCfa` in [financing.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/packages/shared/src/money/financing.ts):
- **1 kW:** $1 \times ₹30,000 = ₹30,000$ (3,000,000 paise)
- **2 kW:** $2 \times ₹30,000 = ₹60,000$ (6,000,000 paise)
- **3 kW:** $₹60,000 + 1 \times ₹18,000 = ₹78,000$ (7,800,000 paise)
- **Above 3 kW (e.g. 5 kW, 10 kW):** Strictly capped at $₹78,000$
- **Fractional capacities (e.g. 2.5 kW):** $₹60,000 + 0.5 \times ₹18,000 = ₹69,000$
- **Zero / Negative / NaN:** Safely evaluates to 0 without crashing.

### Subsidy Duplication Prevention
- Integrated into `calculateEligibleIncentives`: Central CFA is matched uniquely.
- POS and post-installation incentives are strictly partitioned: Central CFA is categorized as `pm_surya_ghar_cfa` and cannot be combined twice for the same quote tier.

---

## 2. Financial Reconciliation & Subsidy Treatment

Instead of presenting the subsidy as a generic upfront discount, `calculateIndianSolarFinancing` explicitly supports 3 transparent financing models:

1. **`gross_financing_future_receipt` (Standard Public Sector Bank / SBI Surya Ghar model):**
   - Loan finances: $\text{Gross Project Price} - \text{Customer Down Payment}$.
   - Homeowner receives ₹78,000 CFA directly in bank account post net-meter sync.
2. **`subsidy_part_prepayment`:**
   - Primary loan initially finances gross balance.
   - Upon CFA DBT credit, ₹78,000 is applied as part-prepayment, reducing tenure or reducing EMI without prepayment penalty.
3. **`bridge_financing`:**
   - Clearly identified as an optional lender-dependent capability where the lender bridges the subsidy gap upfront.

---

## 3. APR, Processing Fees & 18% GST Reconciliation

### All-in APR Formulation
In [financing.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/packages/shared/src/money/financing.ts) and [prequal.service.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/prequal/prequal.service.ts):
- **Nominal Interest Rate:** The stated reducing-balance rate (e.g., 7.00% SBI, 7.50% Tata Capital).
- **Processing Charges:** 1.0% to 1.5% base bank fee.
- **GST on Banking Fees:** 18.0% GST calculated on the processing fee.
- **Prepaid Finance Charge:** $\text{Base Fee} + \text{18\% GST}$.
- **All-in APR:** Calculated actuarially via Newton-Raphson iteration on net loan proceeds ($\text{Principal} - \text{Prepaid Charges}$).
  - *Example:* On ₹1,00,000 loan @ 7.00% for 60 months, a 1% fee + 18% GST (₹1,180) yields an All-in APR of **7.53%**, fully reconciling nominal interest from total cost of credit.

---

## 4. India-Specific Schemas & US Logic Removed

| Domain / File | Prior US-Centric Assumption | Indian Localisation Applied | Backward Compatibility |
| :--- | :--- | :--- | :--- |
| **Prequalification** ([schemas/index.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/packages/shared/src/schemas/index.ts)) | `ssnLastFour` (SSN 4-digit regex) | `panNumber` (10-char PAN regex `[A-Z]{5}[0-9]{4}[A-Z]{1}`) | Fallback to `ssnLastFour` supported |
| **Contractor Registration** ([schemas/index.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/packages/shared/src/schemas/index.ts)) | `ein` (US Employer ID Number) | `gstin` (15-char GSTIN) and `pan` | Safe fallback to legacy `ein` |
| **Postal Codes** ([schemas/index.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/packages/shared/src/schemas/index.ts)) | 5-digit US `zipCode` | 6-digit Indian `pinCode` regex (`^\d{6}$`) | Both `pinCode` and `zipCode` accepted |
| **Equipment Catalog** ([seed.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/scripts/seed.ts)) | US Heat Pumps (AHRI, SEER2, HSPF2) | MNRE ALMM Tier-1 Solar PV (Waaree, Tata Power Solar, Adani Solar, Havells) | Retained clean solar models |
| **Consumer Disclosures** ([page.tsx](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/web/src/app/quote/[token]/page.tsx)) | TILA Reg Z / FTC Cooling-Off | RBI Digital Lending Guidelines (2022/2024), 3-day look-up period, KFS | Aadhaar e-Sign under IT Act 2000 |
| **Languages** ([page.tsx](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/web/src/app/quote/[token]/page.tsx)) | Spanish (`es`) toggle | Complete Hindi (`hi`) translation dictionary | Seamless English ↔ Hindi toggle |

---

## 5. Verification & Test Results

### Shared Package Tests (`npm test --prefix greenquote/packages/shared`)
- **Total Test Suites:** 3 passed, 3 total
- **Total Tests:** 48 passed, 48 total (0 failures)
- Dedicated suite [india-financial-engine.test.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/packages/shared/src/money/india-financial-engine.test.ts) covering:
  - PM Surya Ghar CFA boundary tests (1 kW, 2 kW, 3 kW, 5 kW, 10 kW, 2.5 kW, 0 kW, negative, NaN).
  - Financial reconciliation across gross price, down payment, processing fees, and GST.
  - Subsidy part-prepayment simulation and interest savings.
  - Bridge financing separation.
  - All-in APR actuarial validation with processing charges.
  - Schema validation for PAN, GSTIN, and PIN codes.

### API Core Test Suites (`npm test --prefix greenquote/apps/api`)
- **Total Test Suites:** 9 passed, 9 total
- **Total Tests:** 65 passed, 65 total (0 failures)

### Monorepo Typecheck & Production Build
- **Typecheck:** Clean pass across all workspaces (`@greenquote/shared`, `@greenquote/ui`, `@greenquote/api`, `@greenquote/web`, `@greenquote/worker`).
- **Next.js Production Build:** Compiled successfully with 12 static/dynamic routes and Edge middleware.

---

## 6. Remaining Financial Gaps & Day 3 Dependencies

1. **DISCOM-Specific Tariff Engine:** State electricity boards (MSEDCL, Tata Power Delhi, BESCOM, UPPCL) have variable tiered tariffs and time-of-day (ToD) billing that can refine power bill savings calculations beyond the flat ₹8/kWh baseline.
2. **Dynamic Banking API Webhooks:** Live integrations with bank loan originations systems (LOS) via e-NACH / NPCI mandate APIs.
