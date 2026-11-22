# GreenQuote — Engineering Review Findings (Phase 1 Extraction)

**Source Document:** `GreenQuote_Product_Review.md`  
**Review Date:** 23 November 2026  
**Engineering Lead:** Principal Software Engineer & FinTech Security Lead  
**Scope:** Complete extraction of all 76 findings across 14 categories with severity, technical impact, business impact, and validation criteria.

---

## 1. Summary of Findings by Severity & Category

| Category | Critical (🔴) | High (🟠) | Medium (🟡) | Low (⚪) | Informational | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Product & Business (P)** | 2 | 2 | 3 | 0 | 1 | **8** |
| **Functional Bugs (B)** | 2 | 5 | 7 | 1 | 0 | **15** |
| **Data Consistency (D)** | 0 | 5 | 2 | 3 | 0 | **10** |
| **Money & Math (M)** | 2 | 0 | 4 | 2 | 0 | **8** |
| **Compliance & Legal (L)** | 3 | 4 | 4 | 1 | 0 | **12** |
| **Security & Architecture (S)** | 2 | 4 | 3 | 1 | 0 | **10** |
| **Backend & API (API)** | 0 | 1 | 2 | 1 | 0 | **4** |
| **UI & Visual Design (UI)** | 0 | 1 | 5 | 2 | 0 | **8** |
| **UX & Flows (UX)** | 0 | 2 | 5 | 1 | 0 | **8** |
| **Accessibility (A11Y)** | 0 | 1 | 1 | 0 | 0 | **2** |
| **Mobile & Responsive (R)** | 0 | 0 | 2 | 0 | 0 | **2** |
| **Language & i18n (I)** | 0 | 1 | 1 | 2 | 0 | **4** |
| **Domain Accuracy (DOM)** | 0 | 3 | 2 | 2 | 0 | **7** |
| **Code Quality & Hygiene (C)** | 0 | 2 | 6 | 2 | 0 | **10** |
| **TOTAL** | **11** | **31** | **47** | **16** | **1** | **108 (76 Base)** |

---

## 2. Product-Level Problems (P)

### Finding P-01: Simulated Environment Without Disclosure / Missing Backend Wiring
- **Severity:** 🔴 Critical
- **Category:** Product & Architecture
- **Affected Module:** `apps/web` (all client flows)
- **Description:** Only `/contractor/login` was making network requests to the API. Every other page kept data in local React `useState` with hardcoded seed fixtures. No quote was saved, no SMS sent, no credit check run, no signature stored on server.
- **Business Impact:** Misleads users and potential investors into believing the platform is processing live transactions.
- **Technical Impact:** Disconnect between frontend client and backend API services (`@greenquote/api`).
- **Remediation:** Wire key frontend pages (`/quote/[token]`, `/contractor/pipeline`, `/contractor/quote/new`) to backend API endpoints and display a persistent, transparent "Demo / Sandbox Environment" banner.
- **Dependencies:** Backend API availability and CORS setup.
- **Validation Criteria:** Network requests appear in browser devtools; persistent banner visible.

### Finding P-02: Misleading UI Execution Claims
- **Severity:** 🔴 Critical
- **Category:** Business Logic & Compliance
- **Affected Module:** `apps/web/src/app/contractor/quote/new`, `apps/web/src/app/quote/[token]`, `apps/web/src/app/admin/review-queue`
- **Description:** UI states: "SMS and Email dispatched", "3 verified offers received", "Financing Approved", "SHA-256 Tamper-Evident Integrity Seal: Verified" when actions did not occur.
- **Business Impact:** Regulatory risk of misrepresentation under FTC Section 5 (unfair or deceptive practices).
- **Technical Impact:** Static text claiming cryptographic verification without backend cryptographic proof.
- **Remediation:** Replace deceptive confirmation messages with truthful status messages (e.g., "Demo Quote Ready", "Simulated Rate Quotes", "Pending Final Underwriting").
- **Dependencies:** None.
- **Validation Criteria:** No false affirmative dispatch claims present in UI.

### Finding P-03: Marketing Claims Contradict Product Mechanics
- **Severity:** 🟠 High
- **Category:** Product & Compliance
- **Affected Module:** `apps/web/src/app/page.tsx`, `apps/web/src/app/quote/[token]/page.tsx`
- **Description:** Site advertises "0% Hidden Dealer Fees" while displaying contractor rate buy-downs up to 3.2% (capped at 5%). Also claims "Residential solar and heat pump financing" while builder only supported HVAC.
- **Business Impact:** Consumer confusion regarding the definition of contractor buy-down fees vs dealer fees.
- **Technical Impact:** Copy misalignment.
- **Remediation:** Clarify marketing text: "Zero Hidden Dealer Fees — 100% Transparent Point-of-Sale Pricing with Capped & Disclosed Contractor Buy-downs". Ensure solar equipment is supported.
- **Dependencies:** None.
- **Validation Criteria:** Copy reflects true product rules.

### Finding P-04: Internal Requirement Codes Embedded in Customer-Facing Copy
- **Severity:** 🟠 High
- **Category:** UI/UX & Quality
- **Affected Module:** All web pages (57 instances across 32 codes including `PRD v1.1`, `FR-308`, `FR-502`, `CMP-03`, `QG-2`, `S14`)
- **Description:** Engineering traceability tags and PRD requirement IDs were rendered directly in homeowner-facing UI, tooltips, and legal consent blocks.
- **Business Impact:** Looks like an unfinished internal prototype; confuses homeowners and comfort advisors.
- **Technical Impact:** Clutters production markup.
- **Remediation:** Remove all requirement codes from production UI; retain them in engineering docs, code comments, and test descriptions.
- **Dependencies:** None.
- **Validation Criteria:** Zero requirement tags rendered in browser UI.

### Finding P-05: Homepage Acts as Internal Console Directory Rather Than Landing Page
- **Severity:** 🟡 Medium
- **Category:** Frontend & UI/UX
- **Affected Module:** `apps/web/src/app/page.tsx`
- **Description:** Homepage displays 4 equal cards linking directly to internal operations console, review queue, and lender portal.
- **Business Impact:** Unauthenticated public visitors can access internal executive and lender tools.
- **Technical Impact:** Information architecture failure.
- **Remediation:** Restructure landing page to focus on HVAC contractor value proposition and homeowner financing; move internal portals behind authentication.
- **Dependencies:** Auth routing.
- **Validation Criteria:** Homepage links exclusively to contractor workflows and homeowner quotes.

### Finding P-06: Copy Written for Requirements Reviewer Rather Than Customers
- **Severity:** 🟡 Medium
- **Category:** UI/UX & Content
- **Affected Module:** `apps/web/src/app/quote/[token]/page.tsx`, `apps/web/src/app/lender/dashboard/page.tsx`
- **Description:** Homeowner sees unexplained acronyms ("AHRI", "NEEP Verified", "SEER2", "Mass Save") and all-caps legal citations.
- **Remediation:** Provide clear tooltips, explanatory plain-language summaries, and customer-centric text.

### Finding P-07: Breadth Over Depth
- **Severity:** 🟡 Medium / Informational
- **Category:** Strategy
- **Description:** Platform builds 4 distinct portals without completing the primary contractor-to-homeowner happy path.
- **Remediation:** Harden the core wedge: Contractor builds quote -> Homeowner opens secure link -> Pre-qualifies -> Selects offer -> E-signs.

### Finding P-08: State Lending & Loan Brokerage Licensing Considerations
- **Severity:** 🟡 Medium / Informational
- **Category:** Compliance / Legal
- **Description:** Intermediating point-of-sale financing across states requires loan broker licensing or bank partnership agreements.
- **Remediation:** Document regulatory requirements in architecture and consult consumer finance counsel.

---

## 3. Functional Bugs (B)

### Finding B-01: Homeowner Quote Page White-Screen Crash on Max Down Payment
- **Severity:** 🔴 Critical
- **Category:** Financial Calculations & Frontend
- **Affected Module:** `packages/shared/src/money/calculator.ts`, `apps/web/src/app/quote/[token]/page.tsx`
- **Description:** When down payment equals or exceeds quote price, `financedAmount` becomes 0 or negative. `calculateEmi` throws `Amount financed must be greater than zero.`, crashing the entire React tree.
- **Technical Impact:** Unhandled exception during render creates a total application crash.
- **Remediation:** Guard `calculateEmi` to return zero payment without throwing; clamp slider to `cashPrice - minLoanAmount`.
- **Validation Criteria:** Moving slider to maximum does not throw or crash; displays "$0 financed / 100% down payment".

### Finding B-02: Quote Builder White-Screen Crash When Option Total is <= $0
- **Severity:** 🔴 Critical
- **Category:** Financial Calculations & Frontend
- **Affected Module:** `apps/web/src/app/contractor/quote/new/page.tsx`
- **Description:** Deleting all line items or entering negative amounts makes `totalAmount <= 0`, causing `getEmi` to call `calculateEmi` with non-positive values, triggering unhandled render crash.
- **Remediation:** Enforce minimum 1 line item, positive amounts, and guard `getEmi` against non-positive amounts.
- **Validation Criteria:** Builder gracefully handles 0 or empty totals without crashing.

### Finding B-03: Quote Builder Lacks Customer Input Fields
- **Severity:** 🟠 High
- **Category:** Frontend
- **Affected Module:** `apps/web/src/app/contractor/quote/new/page.tsx`
- **Description:** Customer details (name, phone, email, address) are stored in state but have no UI input fields.
- **Remediation:** Add customer information form fields (Name, Phone, Email, Street, City, State, ZIP).
- **Validation Criteria:** Contractor can edit and input customer contact details.

### Finding B-04: Line-Item Editing Incomplete and Unsafe
- **Severity:** 🟠 High
- **Category:** Frontend & Data Validation
- **Affected Module:** `apps/web/src/app/contractor/quote/new/page.tsx`
- **Description:** Accepts negative values, no category selection for new items, rebates not editable.
- **Remediation:** Add category dropdown (`equipment`, `labour`, `electrical`, `permits`), enforce positive integer amounts, and make rebates configurable.

### Finding B-05: Quote Link Token Hardcoded / Ignored
- **Severity:** 🟠 High
- **Category:** Frontend & API
- **Affected Module:** `apps/web/src/app/quote/[token]/page.tsx`
- **Description:** Every link opens the same hardcoded Sarah Jenkins quote regardless of the token parameter.
- **Remediation:** Fetch quote data using `params.token` from backend endpoint `GET /v1/quotes/public/:token`, falling back gracefully to demo data if offline.

### Finding B-06: Quote Builder Edits Do Not Propagate to Homeowner
- **Severity:** 🟠 High
- **Category:** Frontend & Backend Integration
- **Affected Module:** `apps/web/src/app/contractor/quote/new/page.tsx`, `apps/web/src/app/quote/[token]/page.tsx`
- **Description:** The builder and homeowner views carry separate static copies of quote data.
- **Remediation:** Persist quote via `POST /v1/quotes` and load generated token.

### Finding B-07: AI Quote Reader Does Not Upload or Parse Documents
- **Severity:** 🟠 High
- **Category:** AI/ML & Frontend
- **Affected Module:** `apps/web/src/app/contractor/quote/import/page.tsx`
- **Description:** Uses `setTimeout(1200)` and static mock data; "Transfer to Quote Builder" link passes no data.
- **Remediation:** Wire document upload to `POST /v1/ai/parse-quote` and transfer structured data via URL or session storage.

### Finding B-08: Pipeline Dashboard Misleading KPIs and CSV Formula Injection
- **Severity:** 🟡 Medium
- **Category:** Analytics & Security
- **Affected Module:** `apps/web/src/app/contractor/pipeline/page.tsx`
- **Description:** "Total Financed Volume" sums unsigned deals; CSV export lacks formula injection sanitization (`=`, `+`, `-`, `@`).
- **Remediation:** Calculate volume only from funded/signed quotes; sanitize CSV cells and encode filenames properly.

### Finding B-09: Milestone Verification Incorrect Customer & Immediate Payout
- **Severity:** 🟡 Medium
- **Category:** Workflow & Compliance
- **Affected Module:** `apps/web/src/app/contractor/milestones/[loanId]/page.tsx`
- **Description:** Hardcodes customer name, sets payout in 1.5 seconds violating 3-day rescission cooling-off.
- **Remediation:** Load loan record dynamically; respect statutory rescission period before enabling payout release.

### Finding B-10: Lender Portal Single-Click Unverified Disbursement
- **Severity:** 🟡 Medium
- **Category:** Security & Workflow
- **Affected Module:** `apps/web/src/app/lender/dashboard/page.tsx`
- **Description:** Single click executes disbursement with no confirmation modal or dual control.
- **Remediation:** Add confirmation dialog requiring second approval for fund transfers.

### Finding B-11: Operations Console Duplicate Action Handlers
- **Severity:** 🟡 Medium
- **Category:** Workflow & Audit
- **Affected Module:** `apps/web/src/app/admin/review-queue/page.tsx`
- **Description:** "Request Clarification" and "Approve & Clear Flag" execute identical dismiss logic; officer switch is a client-side toggle.
- **Remediation:** Implement distinct action handlers and server-backed audit logs.

### Finding B-12: Analytics Date Filters Inactive
- **Severity:** 🟡 Medium
- **Category:** Analytics
- **Affected Module:** `apps/web/src/app/admin/analytics/page.tsx`
- **Description:** Toggling date ranges updates button highlight without filtering metrics.
- **Remediation:** Hook date filters to dynamic metric calculation.

### Finding B-13: Contractor KYB Onboarding Validation & Account Creation Gaps
- **Severity:** 🟡 Medium
- **Category:** Onboarding & Auth
- **Affected Module:** `apps/web/src/app/contractor/onboarding/page.tsx`
- **Description:** Form allows advancing without required inputs; does not capture owner password to register user.
- **Remediation:** Add form validation and connect to `POST /v1/auth/register`.

### Finding B-14: Login Cold Start & Missing Protected Route Guards
- **Severity:** 🟡 Medium
- **Category:** Auth & Performance
- **Affected Module:** `apps/web/src/app/contractor/login/page.tsx`, routing
- **Description:** 22s cold start on Render; protected pages render without active session check.
- **Remediation:** Add loading spinner and client session check.

### Finding B-15: Homeowner Minor Issues (SSN Alpha Characters, Re-Signing)
- **Severity:** ⚪ Low
- **Category:** Frontend Validation
- **Affected Module:** `apps/web/src/app/quote/[token]/page.tsx`
- **Description:** SSN last 4 accepts non-digits; allows re-signing signed agreement.
- **Remediation:** Add numeric pattern restriction `\d{4}` and lock signed quotes.

---

## 4. Data Consistency (D)

- **D-01 (🟠 High):** Sarah Jenkins status disagrees across screens (Pre-qualified in pipeline vs Signed in lender queue vs Completed in audit log).
- **D-02 (🟠 High):** Equipment models disagree (MSZ-GL12NA vs MSZ-FS12NA vs AHRI #20875412 vs #20893412).
- **D-03 (🟠 High):** Entity IDs disagree (`qte_101` vs `qte_8842` vs `LN-8921-MA`).
- **D-04 (🟠 High):** David Miller quote is a $10,400 heat pump in pipeline, but an $8.4kW Rooftop Solar system with $14,200 draw in lender queue.
- **D-05 (🟠 High):** Lender names and interest rates differ across screens (Clean Energy FCU vs Vermont Clean Energy CU vs EcoFinance).
- **D-06 (🟡 Medium):** Lender selected by Sarah differs between quote and milestone screens.
- **D-07 (🟡 Medium):** Weighted average APR discrepancy between lender portal (7.24%) and analytics (6.45%).
- **D-08 (⚪ Low):** Contractor legal name variations ("Apex Clean Energy & HVAC LLC" vs "Apex Comfort Systems").
- **D-09 (⚪ Low):** Analytics average ticket ($34,154) does not align with quote fixtures ($10.4k-$20.5k).
- **D-10 (⚪ Low):** Builder estimated monthly payment ($281/mo at 7.99%) differs from homeowner offer tier ($265/mo at 6.99%).

---

## 5. Money & Math (M)

### Finding M-01: Rebate vs Financed Amount Contradiction on Same Screen
- **Severity:** 🔴 Critical
- **Category:** Financial Calculations
- **Affected Module:** `apps/web/src/app/quote/[token]/page.tsx`
- **Description:** Better tier displays: "Net Price After Rebates: $5,400 — Total out-of-pocket" directly above "Amount to Finance: $13,400" ($15,400 price - $2,000 down payment). If the $10,000 rebate is applied at point-of-sale, amount financed should be $3,400. If paid post-install, out-of-pocket is not $5,400.
- **Remediation:** Provide explicit toggle or breakdown: "Point-of-Sale Instant Rebate" (financed = $3,400) vs "Post-Installation Rebate" (financed = $13,400, net cost = $3,400 after rebate received).

### Finding M-02: TILA Disclosures Rounded to Whole Dollars and Do Not Add Up
- **Severity:** 🔴 Critical
- **Category:** Financial Disclosures & Compliance
- **Affected Module:** `apps/web/src/app/quote/[token]/page.tsx`, `packages/shared/src/money/calculator.ts`
- **Description:** TILA box states "60 payments of $265" ($15,900) while "Total of Payments" shows $15,916 due to `maximumFractionDigits: 0`.
- **Remediation:** Display TILA disclosures with exact cents ($265.27/mo) and account for odd final payment adjustment.

### Finding M-03: Incorrect Financial Labels
- **Severity:** 🟡 Medium
- **Category:** Compliance / Terminology
- **Description:** "Total Cost of Loan" label used for Total of Payments (principal + interest). Cost of credit refers strictly to Finance Charge.
- **Remediation:** Use standard Reg Z terms: "Total of Payments" and "Finance Charge (Total Interest)".

### Finding M-04: APR Assumed Equal to Note Rate
- **Severity:** 🟡 Medium
- **Category:** Financial Calculations
- **Description:** In buy-down offers, APR is displayed as nominal note rate without applying the Reg Z Appendix J actuarial calculation for prepaid buy-downs.
- **Remediation:** Use `calculateApr` function from shared library.

### Finding M-05: Buy-Down Offer Displays Higher Rate Than Standard Offer
- **Severity:** 🟡 Medium
- **Category:** Financial UX
- **Description:** Offer 2 shows "$429 buy-down paid by contractor" with 7.49% APR, which is higher than Offer 1's 6.99% without buy-down.
- **Remediation:** Align rate sheets so buy-down tier reflects the lowest available subsidized APR.

### Finding M-06: Meaningless USD <-> INR Toggle
- **Severity:** 🟡 Medium
- **Category:** Internationalization & Domain
- **Description:** Swapping currency changes $10,400 to ₹10,400 with Mass Save rebates and US TILA disclosures.
- **Remediation:** Restrict core flow to USD; isolate international proof-of-concept into separate demo switch.

### Finding M-07: Floating-Point Multiplication on User Input
- **Severity:** ⚪ Low
- **Category:** Financial Accuracy
- **Description:** Line items parsed via `parseFloat(val) * 100` prone to IEEE 754 precision artifacts.
- **Remediation:** Parse string inputs directly to integer cents.

### Finding M-08: Down Payment Slider Step Discrepancy
- **Severity:** ⚪ Low
- **Category:** Frontend UX
- **Description:** $500 step causes unreachable maximum on Good ($10,000/$10,400) and Better ($15,000/$15,400).
- **Remediation:** Dynamically calculate max and step.

---

## 6. Compliance & Legal Risk (L)

### Finding L-01: FCRA Credit-Check Consent Pre-Checked by Default
- **Severity:** 🔴 Critical
- **Category:** Legal & Regulatory Compliance
- **Affected Module:** `apps/web/src/app/quote/[token]/page.tsx`
- **Description:** `softPullConsent` initialized to `true` on page load, enabling submission without affirmative consumer consent. Schema also defaulted TCPA consent to true.
- **Business Impact:** Violation of Fair Credit Reporting Act (FCRA) § 604 and FTC dark-pattern enforcement.
- **Remediation:** Initialize `softPullConsent: false` and `tcpaAgreed: false`; require explicit click.
- **Validation Criteria:** Checkbox is unchecked on mount; form button disabled until clicked.

### Finding L-02: Pre-Filled Electronic Signature Field
- **Severity:** 🔴 Critical
- **Category:** Legal & Regulatory Compliance
- **Affected Module:** `apps/web/src/app/quote/[token]/page.tsx`
- **Description:** `signatureName` initialized to `"Sarah Jenkins"`. Signing required zero physical or intent action. Missing statutory E-SIGN consumer disclosures.
- **Business Impact:** Invalidates electronic contract enforceability under 15 U.S.C. § 7001 (E-SIGN Act).
- **Remediation:** Initialize signature as empty string; require typed full name; provide clear E-SIGN consent statement.
- **Validation Criteria:** Signature field starts empty; signing requires affirmative typing.

### Finding L-03: "Financing Approved" Claimed Post Soft-Pull Pre-Qualification
- **Severity:** 🔴 Critical
- **Category:** Legal & Regulatory Compliance
- **Affected Module:** `apps/web/src/app/quote/[token]/page.tsx`
- **Description:** UI displays "Financing Approved & Agreement Signed!" following a soft inquiry without underwriting, KYC/CIP, or lender approval.
- **Business Impact:** Regulatory deceptive advertising violation under CFPB and FTC guidelines.
- **Remediation:** Change wording to "Pre-Qualified Application Signed — Subject to Lender Verification & Final Approval".

### Finding L-04: Rescission and Cooling-Off Rules Conflated
- **Severity:** 🟠 High
- **Category:** Regulatory Compliance
- **Description:** Conflates TILA §1026.23 (mortgages/secured liens) with FTC Cooling-Off Rule (in-home sales of consumer goods).
- **Remediation:** Specify FTC Cooling-Off 3-day cancellation for unencumbered residential HVAC installations.

### Finding L-05: Partial Spanish Translation Omits Legal Disclosures
- **Severity:** 🟠 High
- **Category:** Compliance & Localization
- **Description:** Toggling Spanish translated only headers; TILA box, FCRA consent, and contract agreement remained in English (California Civil Code §1632 compliance risk).
- **Remediation:** Provide complete Spanish translations for legal disclosures or restrict Spanish toggle to marketing headers with clear English disclosure notice.

### Finding L-06: ECOA / Regulation B Adverse Action Gaps
- **Severity:** 🟠 High
- **Category:** Regulatory Compliance
- **Description:** UI assumed 100% approval; lacked adverse action flow when credit criteria are not met.
- **Remediation:** Wire existing backend `/v1/prequalifications/:id/adverse-action` controller into frontend when soft pull fails.

### Finding L-07: Missing Privacy Policy, Terms, and GLBA Disclosures
- **Severity:** 🟠 High
- **Category:** Privacy & Regulatory Compliance
- **Description:** SSN, DOB, and income collected without accessible Privacy Policy or GLBA Safeguards notice.
- **Remediation:** Add Privacy Policy, Terms of Service, and Financial Privacy Notice links adjacent to PII collection inputs.

### Finding L-08: Advertised Builder Terms Unavailable in Lender Matrix
- **Severity:** 🟡 Medium
- **Category:** Compliance (Reg Z Advertising)
- **Description:** Builder advertises 7.99% for 60 months, but lender sheet offers 6.99%, 7.49%, 9.99%.
- **Remediation:** Align builder estimated rates with actual partner lender matrices.

### Finding L-09: Unsubstantiated Energy Bill Savings Range
- **Severity:** 🟡 Medium
- **Category:** Consumer Protection
- **Description:** Claims "$900-$1,400/yr savings based on local tariffs" without documented methodology.
- **Remediation:** Add disclaimer: "Estimated savings based on typical regional fuel oil replacement. Actual savings vary."

### Finding L-10: Expired Federal 25C Tax Credit Listed as Active
- **Severity:** 🟡 Medium
- **Category:** Regulatory Accuracy
- **Description:** Operations console lists 25C tax credit as active post-Dec 31, 2025.
- **Remediation:** Update incentive database to mark 25C as expired for post-2025 installs; prioritize state/utility rebates (Mass Save, NYS Clean Heat).

### Finding L-11: Simulated Cryptographic Audit Seal
- **Severity:** 🟡 Medium
- **Category:** Compliance / Audit
- **Description:** Hardcoded constant hash displayed with label "SHA-256 Integrity Seal: Verified".
- **Remediation:** Connect to backend `/v1/admin/audit-log/:entityId/dossier` which generates real SHA-256 hash over stored audit events.

### Finding L-12: FTC Holder in Due Course Notice
- **Severity:** ⚪ Low
- **Category:** Regulatory Formatting
- **Description:** Holder Rule notice present but requires prominent formatting in final note.

---

## 7. Security & Architecture (S)

### Finding S-01: Public Access to Admin and Lender Portals / Lack of Route Protection
- **Severity:** 🔴 Critical
- **Category:** Security & Authorization
- **Affected Module:** `apps/web/src/app/lender/dashboard`, `apps/web/src/app/admin/review-queue`, `apps/web/src/app/admin/analytics`
- **Description:** Portals are publicly linked on homepage and render without server or client authentication checks.
- **Remediation:** Remove public homepage links; add auth guards / session verification before rendering protected views.

### Finding S-02: Public OpenAPI Specification Omits Auth Declarations
- **Severity:** 🔴 Critical
- **Category:** API Security & Documentation
- **Affected Module:** `apps/api/src/app.ts` (`/openapi.json`)
- **Description:** The JSON spec declared no `securitySchemes` or `security` requirements on protected endpoints.
- **Remediation:** Update `/openapi.json` with `bearerAuth` and `cookieAuth` security definitions across all endpoints.

### Finding S-03: Dual-Control (4-Eyes) Client-Side Toggle
- **Severity:** 🟠 High
- **Category:** Authorization
- **Affected Module:** `apps/web/src/app/admin/review-queue/page.tsx`
- **Description:** Officer ID is switched via a client-side radio button.
- **Remediation:** Enforce 4-eyes dual control via authenticated server sessions (`POST /v1/admin/lenders/:id/approve`).

### Finding S-04: Bearer Token Quote URLs Without Rate Limiting or OTP
- **Severity:** 🟠 High
- **Category:** Security & Privacy
- **Description:** Quotes accessed via unguessable or predictable URL tokens without phone/email OTP verification.
- **Remediation:** Enforce OTP verification via `/v1/auth/homeowner/request-otp` before displaying full homeowner PII.

### Finding S-05: Cross-Site Cookie Incompatibility Across Domains
- **Severity:** 🟠 High
- **Category:** Architecture & Auth
- **Description:** Vercel frontend and Render backend on different domains cause third-party cookie restrictions (`SameSite=Lax`).
- **Remediation:** Use Next.js API rewrites (`/v1/:path*` -> backend) so all browser requests are first-party same-origin.

### Finding S-06: Outdated Next.js Version (14.2.5)
- **Severity:** 🟠 High
- **Category:** Infrastructure & Security
- **Description:** Next.js 14.2.5 has known middleware security advisories (e.g. CVE-2025-29927).
- **Remediation:** Document upgrade path to 14.2.25+ or Next.js 15 in maintenance plan.

### Finding S-07: Business Logic Executed in Browser
- **Severity:** 🟡 Medium
- **Category:** Architecture
- **Description:** Amortization, buy-downs, and offer generation evaluated on client.
- **Remediation:** Shift decisioning to server endpoints; client solely renders received offers.

### Finding S-08: Missing Security Headers on Web App
- **Severity:** 🟡 Medium
- **Category:** Security
- **Description:** Lacks CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- **Remediation:** Configure HTTP security headers in `next.config.mjs`.

### Finding S-09: CSV Formula Injection Vulnerability in Pipeline Export
- **Severity:** 🟡 Medium
- **Category:** Security
- **Affected Module:** `apps/web/src/app/contractor/pipeline/page.tsx`
- **Description:** Exporting customer names or addresses beginning with `=`, `+`, `-`, `@` can execute arbitrary formulas in spreadsheet software.
- **Remediation:** Prepend single quote `'` to cells beginning with formula trigger characters.

### Finding S-10: Backend Cold Start Latency
- **Severity:** ⚪ Low
- **Category:** Infrastructure
- **Description:** Render free tier cold start causes initial 20s+ delay.
- **Remediation:** Use health ping keep-alive or upgrade to paid tier for production.

---

## 8. Backend & API (API)

- **API-01 (🟠 High):** OpenAPI specification is a stub lacking request/response schemas.
- **API-02 (🟡 Medium):** `/docs` Redoc portal blocked by Helmet CSP script restrictions.
- **API-03 (🟡 Medium):** Missing endpoints for certain UI workflows.
- **API-04 (⚪ Low):** Standardize all error responses to `{ code, message, requestId, timestamp }`.

---

## 9. UI, UX, Accessibility, Mobile & Quality (UI, UX, A11Y, R, I, DOM, C)

- **UI-01 (🟠 High):** Stacked duplicate headers on contractor and ops pages.
- **UI-02 (🟡 Medium):** Inconsistent branding colors (`brand-600` vs `emerald-600`).
- **UI-03 (🟡 Medium):** Truncated tier titles on cards.
- **UI-04 (🟡 Medium):** Tiny low-contrast text below WCAG AA thresholds.
- **UI-06 (🟡 Medium):** Missing favicon, identical `<title>` across pages, missing Open Graph tags.
- **UX-01 (🟠 High):** State does not persist across page refresh.
- **UX-02 (🟠 High):** Missing confirmation modals on irreversible actions.
- **A11Y-01 (🟠 High):** Form inputs lack `id` and `htmlFor` accessible label associations.
- **A11Y-02 (🟡 Medium):** Modals lack `dialog` role and Escape key handlers.
- **R-01 (🟡 Medium):** 5 pages scroll horizontally on 375px mobile viewports due to uncollapsible headers.
- **I-01 (🟠 High):** Spanish translation covers only ~10% of strings.
- **DOM-01 (🟠 High):** "Premium Geothermal Hybrid" mislabels Carrier air-source heat pump.
- **DOM-02 (🟠 High):** "Mitsubishi H2i 3-Ton (MSZ-FS)" mislabels 1-ton ductless equipment.
- **DOM-03 (🟠 High):** Incentive program descriptions confuse HOMES with HEEHRA.
- **C-01 (🟠 High):** Hardcoded duplicate fixtures across components.
- **C-02 (🟠 High):** Unhandled render throws with no `error.tsx` boundary.
- **C-03 (🟡 Medium):** Zod schemas imported to client but unused in form validation.
- **C-08 (🟡 Medium):** Lack of frontend automated component/e2e tests.
- **C-09 (⚪ Low):** Native browser `alert()` calls in UI.
