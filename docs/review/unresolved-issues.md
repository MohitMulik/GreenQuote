# GreenQuote Remediation — Unresolved Issues & Future Roadmap

**Document Reference:** `GQ-DOC-REVIEW-06`  
**Date:** November 23, 2026  
**Status:** Active Governance Document  
**Engineers:** Principal Software Engineer, FinTech Security Architect, Legal/Compliance Lead  

---

## 1. Overview and Scope

This document tracks items from `GreenQuote_Product_Review.md` and codebase analysis that were categorized as Priority 2 (Medium), Priority 3 (Low), or deferred due to external enterprise dependencies.

All Priority 0 (Critical financial math, crash bugs, legal compliance violations, and security headers) and Priority 1 (Core workflow blockers, customer information capture, line-item categorization, CSV injection) have been **100% remediated** in the current engineering sprint.

The remaining items documented herein require external third-party partner credentials, formal state licensing determinations, or multi-week infrastructure setup.

---

## 2. External Dependency Blockers

| Item ID | Title | External Dependency | Blocker Description | Proposed Path to Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **EXT-01** | Live Multi-Lender Credit Bureau Integration | Experian / TransUnion / Equifax APIs | Production soft-pull credit checks require formal FCRA End-User Certification, physical site inspection, and secure VPN tunnel to credit bureau gateways. Current sandbox operates on simulated credit tiers. | Procure Experian NetConnect / TransUnion TLOxp sandbox credentials and complete CFPB compliance questionnaire. |
| **EXT-02** | Plaid / Stripe Financial Account Verification | Plaid Production API Keys & Webhook Endpoints | Milestone bank payout ACH transfers require instant bank account verification (Plaid Auth/Balance) and Stripe Treasury / Moov embedded disbursement rails. | Execute partner contracts with Plaid and Stripe Connect for platforms. |
| **EXT-03** | Legally Binding E-Sign Provider Integration | DocuSign / HelloSign (Dropbox Sign) Embedded API | While client-side typed e-signature complies with federal E-SIGN Act requirements for consent, high-ticket loan agreements require PKI-signed tamper-evident certificates of completion with cryptographic audit trails. | Integrate DocuSign Embedded Signing Ceremonies or HelloSign API via webhook. |
| **EXT-04** | AHRI Equipment Directory Live API Synchronizer | AHRI Directory API / OpenEI API | Current equipment database queries pre-seeded high-efficiency heat pumps. Nightly synchronization requires licensed AHRI Directory API credentials. | Establish licensed automated ingest cron via AHRI partner program. |

---

## 3. Regulatory and Legal Policy Clarifications

| Item ID | Finding Ref | Area | Required Business Decision | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **REG-01** | L-04 | State Licensing & Usury Caps | GreenQuote operates in multiple jurisdictions (e.g., Massachusetts, New York, California). Maximum APRs (usury caps) and contractor financing solicitation licenses vary by state. | Retain specialized consumer credit legal counsel to audit multi-state compliance matrices and configure per-state APR ceilings. |
| **REG-02** | L-05 | Contractor Buy-Down Accounting | PRD specifies "capped buy-down fees (max 3-5%) with 0% hidden dealer fees". IRS treatment of dealer fee pass-through requires formal accounting determination. | Review with corporate tax counsel to ensure dealer fees do not violate FTC Trade Regulation Rule on Deceptive Pricing. |
| **REG-03** | L-06 | Adverse Action Notice Delivery | Under ECOA (Regulation B § 1002.9), if a consumer is declined financing, an Adverse Action Notice must be delivered within 30 days specifying reasons. | Implement automated PDF generation and secure email dispatch for credit declines. |

---

## 4. Prioritized Backlog (P2 / P3 Non-Blocking Enhancements)

### Sprint 3 (P2 — Usability & Operational Scalability)
- [ ] **UI-01: In-Home Presentation Mode Toggle:** Contractor UI toggle that hides wholesale margin and cost breakdowns when handing the tablet/iPad to the homeowner.
- [ ] **API-03: Real-Time Webhook Subscriptions:** Lender and contractor webhook notification dispatch on loan state changes (`deal.signed`, `milestone.verified`, `payout.disbursed`).
- [ ] **A11Y-02: Full WCAG 2.1 AA Audit:** Run automated axe-core scanning across all 12 routes to ensure color contrast ratios (> 4.5:1) across custom brand palettes.
- [ ] **PERF-01: Server-Side Dynamic Caching:** Implement Next.js ISR (Incremental Static Regeneration) on contractor equipment catalog searches.

### Sprint 4 (P3 — Polish & Optimization)
- [ ] **UI-02: Micro-Interactions & Amortization Charts:** Interactive SVG loan amortization visualization showing principal vs. interest payoff over time.
- [ ] **DOC-01: OpenAPI / Swagger Interactive Documentation:** Embed Scalar or Swagger UI for `/v1` backend endpoints on a restricted internal route.
- [ ] **I18N-01: Spanish Language Localization:** Bilingual consumer checkout flow (English / Spanish) for broader clean-energy accessibility.

---

## 5. Risk Assessment and Monitoring

| Risk Factor | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Regulatory scrutiny on embedded lending** | Medium | High | Maintain append-only cryptographic audit logs for every user interaction, loan calculation, and consent submission. |
| **Lender rate-sheet drift** | Low | High | Enforce 4-eyes dual authorization on all rate sheet modifications (`ops_lead` + `ops_compliance`). |
| **Spreadsheet data leakage** | Low | Medium | Enforced CSV formula injection sanitization on all tabular exports. |

---

*Approved by Engineering Leadership & Compliance Council.*
