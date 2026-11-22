# GreenQuote — Remediation Roadmap & Requirements Traceability (Phase 3 & 4)

**Document Reference:** `docs/review/remediation-roadmap.md`  
**Engineering Lead:** Principal Software Engineer & Staff Full-Stack Architect  
**Date:** 23 November 2026  
**Scope:** Priority execution sequence, PRD traceability mapping, dependency graph, and verification criteria.

---

## 1. Remediation Prioritization Matrix

Remediations are organized by actual risk to consumer compliance, financial integrity, system stability, and user experience.

```
┌────────────────────────────────────────────────────────────────────────┐
│ P0: CRITICAL (Immediate Execution)                                     │
│ • B-01 & B-02: Fix client-side crash in calculateEmi (zero/negative)   │
│ • C-02: Add error.tsx & global-error.tsx Next.js error boundaries      │
│ • L-01: Remove pre-checked FCRA & TCPA consent checkboxes              │
│ • L-02: Clear pre-filled e-signature; add affirmative E-SIGN intent    │
│ • L-03: Replace false "Approved" claim with "Pre-Qualified"            │
│ • M-01: Reconcile rebate deduction vs amount financed contradiction    │
│ • M-02: Format TILA disclosures to exact cents ($265.27)               │
│ • S-01: Protect admin & lender consoles; remove from public homepage   │
│ • S-02: Add securitySchemes to public OpenAPI specification            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ P1: HIGH (Core Integrity & Usability)                                  │
│ • P-04: Strip all 32 internal PRD codes from production UI             │
│ • B-03: Add Customer Contact input fields in Quote Builder             │
│ • B-04: Validate line items (positive integer cents, category choices) │
│ • S-05 & S-08: Add Next.js API rewrites & HTTP security headers        │
│ • S-09: Sanitize CSV exports against spreadsheet formula injection     │
│ • UI-01: Eliminate duplicate stacked headers across contractor pages   │
│ • DOM-01 & DOM-02: Correct HVAC model names, capacity, and technology   │
│ • D-01 to D-06: Unify customer, lender, and loan seed entities         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ P2: MEDIUM (Polish, Accessibility & Experience)                        │
│ • A11Y-01: Link form inputs to labels with explicit id and htmlFor     │
│ • R-01: Fix mobile header wrapping preventing 375px viewport overflow  │
│ • UX-02: Add confirmation modal before fund disbursement               │
│ • P-01 & P-02: Add transparent "Demo Environment" banner              │
│ • L-07: Add Privacy Policy & GLBA disclosures adjacent to SSN input    │
│ • UI-06: Add favicon, dynamic page titles, and Open Graph metadata     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ P3: LOW (Hygiene & Minor Optimizations)                                │
│ • B-15: Enforce numeric SSN pattern \d{4}                              │
│ • M-06: Remove redundant INR toggle from US residential quote flow     │
│ • M-03: Standardize Reg Z terminology (Total of Payments)              │
│ • C-09: Replace browser native alert() with styled UI notifications    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Requirements Traceability Mapping

| Review Finding | PRD Requirement | Affected Module | Primary Source Files | Corrective Implementation | Automated Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **B-01, B-02** | **QG-2** (Zero-crash calculation engine) | `@greenquote/shared` | `calculator.ts:60-100`<br>`apps/web/.../quote/[token]/page.tsx` | Make `calculateEmi` safe against non-positive amounts; clamp sliders. | `calculator.test.ts` (edge case tests) |
| **C-02** | **NFR-04** (Fault tolerance) | `@greenquote/web` | `apps/web/src/app/error.tsx`<br>`apps/web/src/app/global-error.tsx` | Implement Next.js App Router error boundaries with recovery buttons. | Next.js build trace |
| **L-01** | **CMP-03** (FCRA §604 affirmative consent) | `@greenquote/web` | `apps/web/.../quote/[token]/page.tsx:135` | Initialize `softPullConsent: false`; disable submission until clicked. | Component state test |
| **L-02** | **CMP-04** (E-SIGN Act 15 U.S.C. §7001) | `@greenquote/web` | `apps/web/.../quote/[token]/page.tsx:149` | Initialize signature as `""`; require affirmative name typing. | E-sign submission test |
| **L-03** | **CMP-05** (Truthful advertising) | `@greenquote/web` | `apps/web/.../quote/[token]/page.tsx:880` | Change "Financing Approved" to "Pre-Qualified — Subject to Verification". | UI copy audit |
| **M-01** | **FR-402, FR-403** (Point-of-sale rebate parity) | `@greenquote/web` | `apps/web/.../quote/[token]/page.tsx:189-192` | Reconcile net price vs amount financed with clear rebate timing explanation. | Math parity audit |
| **M-02** | **CMP-01** (TILA Reg Z §1026.18 disclosures) | `@greenquote/shared` | `calculator.ts:240-252`<br>`apps/web/.../quote/[token]/page.tsx:720-750` | Enable decimal formatting (`$265.27/mo`) so payments sum exactly to Total of Payments. | `calculator.test.ts` (cent accuracy) |
| **S-01** | **FR-101** (Role-based access control) | `@greenquote/web` | `apps/web/src/app/page.tsx:130-180` | Remove direct public links to `/admin/review-queue`, `/admin/analytics`, `/lender/dashboard`. | Route security audit |
| **S-02** | **FR-1102** (API documentation) | `@greenquote/api` | `apps/api/src/app.ts:93-113` | Add `securitySchemes` and `security` headers to `/openapi.json`. | API test (`GET /openapi.json`) |
| **P-04** | **UX-STD-01** (Clean professional UI) | `@greenquote/web` | All web app page components | Remove all internal PRD codes (`(FR-308)`, `(CMP-03)`, `(S14)`, etc.) from customer UI. | Regex grep test |
| **B-03** | **FR-301** (Quote creation inputs) | `@greenquote/web` | `apps/web/.../contractor/quote/new/page.tsx` | Add customer name, phone, email, address input fields. | Form submission test |
| **B-04** | **FR-302** (Line item editing) | `@greenquote/web` | `apps/web/.../contractor/quote/new/page.tsx` | Add category selector; enforce positive numbers. | Validation schema test |
| **S-05, S-08** | **SEC-01** (Web security headers) | `@greenquote/web` | `apps/web/next.config.mjs` | Add API rewrites for `/v1/:path*` and standard CSP / X-Frame-Options headers. | Header inspection |
| **S-09** | **SEC-06** (CSV formula sanitization) | `@greenquote/web` | `apps/web/.../contractor/pipeline/page.tsx:137` | Prepend `'` to cells starting with `=`, `+`, `-`, `@`. | Pipeline test |
| **UI-01** | **UX-STD-02** (App shell consistency) | `@greenquote/web` | `apps/web/.../contractor/layout.tsx` | Deduplicate navigation bars; show unified header. | Visual inspection |
| **A11Y-01** | **NFR-08** (WCAG 2.1 AA Accessibility) | `@greenquote/web` | `apps/web/.../quote/[token]/page.tsx` | Add explicit `id` and `htmlFor` attributes to form fields. | Accessibility audit |
| **R-01** | **NFR-09** (Mobile responsive) | `@greenquote/web` | `apps/web/src/app/page.tsx` | Add flex-wrap and responsive utility classes for 375px screens. | Viewport audit |
| **DOM-01, 02** | **FR-303** (Equipment catalog accuracy) | `@greenquote/web` | `apps/web/.../contractor/quote/new/page.tsx` | Correct Carrier & Mitsubishi heat pump model names and capacity. | Equipment catalog check |

---

## 3. Implementation Plan & Work Breakdown

### Sprint 1 (P0: Critical Fixes)
1. **Financial Engine Hardening:**
   - Modify `packages/shared/src/money/calculator.ts` so `calculateEmi` handles `amountFinancedMinor <= 0` gracefully.
   - Update `formatCurrency` to support exact decimal cents.
2. **Crash Prevention & Error Boundaries:**
   - Create `apps/web/src/app/error.tsx` and `apps/web/src/app/global-error.tsx`.
   - Guard down-payment slider in `apps/web/src/app/quote/[token]/page.tsx`.
   - Guard line-item calculations in `apps/web/src/app/contractor/quote/new/page.tsx`.
3. **Regulatory Dark-Pattern Remediation:**
   - Uncheck FCRA consent on page load (`softPullConsent: false`).
   - Clear pre-filled signature (`signatureName: ""`).
   - Replace "Financing Approved" with "Pre-Qualified — Subject to Final Verification".
   - Fix TILA rounding sum mismatch to ensure cent-accurate consistency.
4. **Security & API Specification:**
   - Remove unauthenticated admin/lender portal cards from homepage.
   - Add security schemes to `/openapi.json`.

### Sprint 2 (P1: High-Priority Fixes)
1. **Production UI Cleanup:**
   - Scrub all 32 internal PRD requirement codes from all customer-facing views.
   - Add transparent "Interactive Demonstration Mode" badge.
2. **Quote Builder Enhancements:**
   - Add real input fields for Customer Name, Phone, Email, and Address.
   - Add category selector for new line items.
   - Correct HVAC domain model names (Carrier air-source & Mitsubishi 3-ton).
3. **Security Headers & CSV Sanitization:**
   - Add CSP, X-Frame-Options, and API rewrites in `next.config.mjs`.
   - Sanitize pipeline CSV export against formula injection.
   - Consolidate layout headers to remove duplicate bars.

### Sprint 3 (P2 & P3: Polish & Accessibility)
1. **Form Accessibility:**
   - Add `id` and `htmlFor` to all form inputs.
2. **Mobile Viewport Fixes:**
   - Eliminate horizontal scrollbars on 375px viewports.
3. **Disbursement Confirmations:**
   - Add confirmation modal dialog to lender disbursement action.
