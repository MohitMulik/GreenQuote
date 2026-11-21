# GreenQuote — Requirements Traceability Matrix (RTM)
## Master Requirements Traceability to Implementation

**Document Version:** 1.0  
**PRD Reference:** PRD v1.1  
**Last Updated:** 21 November 2026  

---

### Legend
- **Priority:** P0 (MVP Must-Have), P1 (Post-MVP High), P2 (Future)
- **Status:** NOT_STARTED, IN_PROGRESS, COMPLETE, VERIFIED

---

## 1. Functional Requirements (FR)

### 1.1 Accounts, Roles & Access (FR-100)
| Req ID | Description | Priority | Target Module | Implementation File(s) | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **FR-101** | Support 5 roles: Contractor Owner, Advisor, Homeowner, Lender, Operations | P0 | Identity & RBAC | `apps/api/src/modules/auth`, `packages/shared/src/types/auth.ts` | VERIFIED | Role auth & tenant test suite |
| **FR-102** | Contractor & lender 2FA (TOTP authenticator app or SMS code) | P0 | Identity & Auth | `apps/api/src/modules/auth/otp.service.ts` | COMPLETE | MFA verify tests |
| **FR-103** | Homeowner access via signed link + OTP phone code (no password required) | P0 | Homeowner Auth | `apps/api/src/modules/auth/otp.service.ts` | VERIFIED | Token/OTP verification tests |
| **FR-104** | Contractor owner can invite, deactivate, and assign advisor roles | P0 | Contractor Mgmt | `apps/api/src/modules/contractors/contractor.controller.ts` | COMPLETE | Contractor team invite tests |
| **FR-105** | SSO with Google/Microsoft for contractor accounts | P2 | Identity & Auth | Deferred | NOT_STARTED | Deferred |

### 1.2 Contractor Onboarding & Verification (FR-200)
| Req ID | Description | Priority | Target Module | Implementation File(s) | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **FR-201** | Capture legal name, DBA, EIN, address, owner details, trade categories | P0 | Contractor Mgmt | `apps/web/src/app/contractor/onboarding/page.tsx`, `apps/api/src/modules/contractors/contractor.model.ts` | COMPLETE | EIN/Address validator |
| **FR-202** | KYB verification adapter with Pass/Fail/Manual Review outcomes | P0 | Contractor Verif. | `apps/api/src/modules/admin/admin.controller.ts` | COMPLETE | KYB status update tests |
| **FR-203** | Collect contractor license & GL insurance with expiry tracking | P0 | Contractor Verif. | `apps/web/src/app/contractor/onboarding/page.tsx` | COMPLETE | Document expiry tests |
| **FR-204** | Link payout bank account via instant verification (Plaid/microdeposits) | P0 | Funding Mgmt | `apps/web/src/app/contractor/onboarding/page.tsx` | COMPLETE | Payout account match test |
| **FR-205** | Record platform agreement acceptance (timestamp, IP, version) | P0 | Audit & Compl. | `apps/api/src/modules/auth/auth.service.ts` | VERIFIED | Platform agreement test |
| **FR-206** | Operations queue to approve, reject, or request info on applications | P0 | Operations | `apps/web/src/app/admin/review-queue/page.tsx` | VERIFIED | Review queue workflow |
| **FR-207** | Automatic state license board lookup | P1 | Contractor Verif. | External adapter | NOT_STARTED | P1 integration |

### 1.3 Quote Builder & AI Quote Import (FR-300)
| Req ID | Description | Priority | Target Module | Implementation File(s) | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **FR-301** | Create 3-option quote (Good / Better / Best) in under 3 minutes | P0 | Quote Builder | `apps/web/src/app/contractor/quote/new/page.tsx`, `apps/api/src/modules/quotes/quotes.service.ts` | COMPLETE | Tier creation tests |
| **FR-302** | Option line items: Equipment, Labor, Electrical, Permits, Other with total | P0 | Quote Builder | `apps/api/src/modules/quotes/quote.model.ts` | VERIFIED | Arithmetic calculation tests |
| **FR-303** | Search-as-you-type certified equipment directory (<500ms response) | P0 | Equipment Catalog | `apps/api/src/modules/equipment/equipment.service.ts` | VERIFIED | Text search index tests |
| **FR-304** | AI quote import from PDF/photo with schema validation & review UI | P0 | AI Document | `apps/web/src/app/contractor/quote/import/page.tsx`, `apps/api/src/modules/ai/quote-import.service.ts` | VERIFIED | OCR/LLM extractor tests |
| **FR-305** | Quote displays price, rebates, net cost, savings range, example EMI | P0 | Quote Builder | `apps/web/src/app/quote/[token]/page.tsx` | VERIFIED | Financial card render tests |
| **FR-306** | Delivery via SMS/Email or in-person Presentation Mode | P0 | Delivery / Notif. | `apps/api/src/modules/quotes/quotes.service.ts` | COMPLETE | Delivery dispatch tests |
| **FR-307** | Quote link expires after 30 days with re-issue capability | P0 | Quote Security | `apps/api/src/modules/quotes/quotes.service.ts` | VERIFIED | Expiry check tests |
| **FR-308** | Cash and financed prices must be identical; no dual pricing stored | P0 | Pricing Integrity | `packages/shared/src/schemas/index.ts` | VERIFIED | Parity check tests |
| **FR-309** | Equipment nameplate photo reading via OCR | P1 | AI Document | AI-01 Extension | NOT_STARTED | P1 task |
| **FR-310** | Field service software integration (Jobber, ServiceTitan, Housecall) | P1 | Integrations | FSM Adapters | NOT_STARTED | P1 task |

### 1.4 Equipment Verification, Incentives & Energy Savings (FR-400)
| Req ID | Description | Priority | Target Module | Implementation File(s) | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **FR-401** | Match heat pump/AC to AHRI certified ratings (SEER2, EER2, HSPF2) | P0 | Equipment Verif. | `apps/api/src/modules/equipment/equipment.service.ts` | VERIFIED | AHRI matching unit tests |
| **FR-402** | Determine rebates by ZIP, utility, income band, equipment specs | P0 | Incentive Engine | `apps/api/src/modules/incentives/incentive.service.ts` | VERIFIED | 50-state test case matrix |
| **FR-403** | Rebate displayed as distinct line; point-of-sale vs. post-install | P0 | Incentive Engine | `packages/shared/src/types/index.ts` | VERIFIED | Rebate subtraction logic |
| **FR-404** | Estimate energy savings range with transparent assumptions | P0 | Energy Savings | `apps/api/src/modules/savings/savings.service.ts` | VERIFIED | Degree-day model tests |
| **FR-405** | Federal tax credits excluded post-Dec 2025; date-driven program rules | P0 | Incentive Engine | `apps/api/src/modules/incentives/incentive.model.ts` | VERIFIED | Tax credit cutoff tests |
| **FR-406** | Third-party nationwide incentive API integration | P1 | Incentive Engine | External adapter | NOT_STARTED | P1 task |

### 1.5 Homeowner Financing & Pre-qualification (FR-500)
| Req ID | Description | Priority | Target Module | Implementation File(s) | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **FR-501** | Interactive payment calculator (<100ms update, disclaimers) | P0 | Calculator | `packages/shared/src/money/calculator.ts` | VERIFIED | Math precision tests (QG-2) |
| **FR-502** | 6-field pre-qualification form (DOB, income, housing, SSN last 4) | P0 | Pre-qualification | `apps/web/src/app/quote/[token]/page.tsx` | VERIFIED | Form validation tests |
| **FR-503** | Explicit FCRA soft-pull consent checkbox; no impact on credit score | P0 | Consent & Legal | `apps/api/src/modules/prequal/prequal.service.ts` | VERIFIED | Consent verification tests |
| **FR-504** | Property ownership check via public records | P1 | Verification | Property adapter | NOT_STARTED | P1 task |
| **FR-505** | Co-applicant addition support | P1 | Pre-qualification | Flow extension | NOT_STARTED | P1 task |
| **FR-506** | Spanish language localization | P1 | Localization | i18n configs | NOT_STARTED | P1 task |

### 1.6 Lender Marketplace & Offers (FR-600)
| Req ID | Description | Priority | Target Module | Implementation File(s) | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **FR-601** | Parallel request fan-out to eligible lenders based on credit boxes | P0 | Offer Engine | `apps/api/src/modules/prequal/prequal.service.ts` | VERIFIED | Parallel dispatch tests |
| **FR-602** | 20s timeout window, stream partial offers via SSE | P0 | Offer Engine | `apps/api/src/modules/prequal/prequal.controller.ts` | VERIFIED | Timeout & SSE tests |
| **FR-603** | Offer cards: APR, term, monthly payment, total cost, buy-down | P0 | Offer UI | `apps/web/src/app/quote/[token]/page.tsx` | VERIFIED | Offer sorting tests |
| **FR-604** | Neutral display; no "recommended" badges; sort by lowest total cost | P0 | Compliance | `apps/web/src/app/quote/[token]/page.tsx` | VERIFIED | Neutral sorting tests |
| **FR-605** | Respectful decline screen + adverse action notices triggered | P0 | Compliance | `apps/api/src/modules/offers/adverse-action.service.ts` | VERIFIED | Adverse action notice test |
| **FR-606** | ML-based intelligent lender routing | P1 | AI Routing | ONNX Runtime service | NOT_STARTED | P1 task |

### 1.7 Application, Disclosures & E-Signature (FR-700)
| Req ID | Description | Priority | Target Module | Implementation File(s) | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **FR-701** | Offer selection & seamless pre-filled application handoff | P0 | Application | `apps/web/src/app/quote/[token]/page.tsx` | VERIFIED | Handoff payload tests |
| **FR-702** | Explicit hard inquiry warning & consent capture | P0 | Compliance | `apps/web/src/app/quote/[token]/page.tsx` | COMPLETE | Hard pull consent check |
| **FR-703** | Display TILA Reg Z disclosure prior to signature activation | P0 | Compliance | `apps/web/src/app/quote/[token]/page.tsx`, `apps/api/src/modules/esign/esign.service.ts` | VERIFIED | Signature gate tests |
| **FR-704** | E-SIGN compliant signature capture, audit trail, 7-year storage | P0 | E-Signature | `apps/api/src/modules/esign/esign.service.ts` | VERIFIED | Document signature tests |
| **FR-705** | Instant real-time alert to contractor upon loan approval | P0 | Notifications | `apps/api/src/modules/milestones/milestones.service.ts` | COMPLETE | Real-time event tests |

### 1.8 Installation Milestones & Funding (FR-800)
| Req ID | Description | Priority | Target Module | Implementation File(s) | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **FR-801** | Dual milestone model: Approval draw (optional) and Completion payout | P0 | Milestones | `apps/api/src/modules/milestones/milestone.model.ts` | VERIFIED | Milestone progression tests |
| **FR-802** | Contractor uploads installed equipment photos, serials, permits | P0 | Milestones | `apps/web/src/app/contractor/milestones/[loanId]/page.tsx`, `apps/api/src/modules/milestones/milestones.service.ts` | VERIFIED | Upload validation tests |
| **FR-803** | Mandatory homeowner completion sign-off; blocks payout release | P0 | Payout Integrity | `apps/web/src/app/quote/[token]/page.tsx`, `apps/api/src/modules/milestones/milestones.service.ts` | VERIFIED | Payout gating tests |
| **FR-804** | Payout request dispatched to lender; status tracking in dashboard | P0 | Payouts | `apps/web/src/app/contractor/milestones/[loanId]/page.tsx`, `apps/api/src/modules/milestones/milestones.service.ts` | VERIFIED | Payout status tracking |
| **FR-805** | Enforce statutory cooling-off / rescission period before release | P0 | Compliance | `packages/shared/src/schemas/index.ts` | COMPLETE | Rescission validation |
| **FR-806** | Change orders for job modifications | P1 | Milestones | Scope update service | NOT_STARTED | P1 task |

### 1.9 Contractor Dashboard & Analytics (FR-900)
| Req ID | Description | Priority | Target Module | Implementation File(s) | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **FR-901** | Visual pipeline: Sent, Viewed, Pre-Qualified, Signed, Installed, Funded | P0 | Contractor UI | `apps/web/src/app/contractor/pipeline/page.tsx` | VERIFIED | Pipeline filter tests |
| **FR-902** | Real-time push / SMS notifications for key status events (<30s) | P0 | Notifications | `apps/worker/src/jobs/index.ts` | COMPLETE | Notification dispatch |
| **FR-903** | Strict exclusion of homeowner credit scores/PII from contractor view | P0 | Data Privacy | `apps/api/src/middleware/tenant.middleware.ts` | VERIFIED | Security leakage tests (QG-3) |
| **FR-904** | Monthly performance report exportable as CSV | P0 | Analytics | `apps/api/src/modules/quotes/quotes.controller.ts` | COMPLETE | Pipeline data export |
| **FR-905** | Advisor close-rate analytics and tier performance | P1 | Analytics | Advanced dashboard | NOT_STARTED | P1 task |

### 1.10 Operations Console (FR-1000)
| Req ID | Description | Priority | Target Module | Implementation File(s) | Status | Test Coverage |
|---|---|---|---|---|---|---|
| **FR-1001** | Review queue for KYB, fraud flags, and equipment mismatches | P0 | Operations | `apps/web/src/app/admin/review-queue/page.tsx` | VERIFIED | Queue management tests |
| **FR-1002** | Lender configuration manager with dual-approval authorization | P0 | Operations | `apps/api/src/modules/admin/admin.controller.ts` | VERIFIED | Dual-approval tests |
| **FR-1003** | Incentive program parameter and active date editor | P0 | Operations | `apps/api/src/modules/admin/admin.controller.ts` | VERIFIED | Incentive CRUD tests |
| **FR-1004** | Searchable audit log with single-loan export in under 60 seconds | P0 | Audit & Compl. | `apps/api/src/modules/admin/admin.controller.ts` | VERIFIED | Audit search & SHA-256 seal |
| **FR-1005** | Complaint tracking and SLA resolution monitoring | P1 | Operations | Case management | NOT_STARTED | P1 task |

---

## 2. Non-Functional Requirements (NFR) Traceability

| ID | Category | Requirement Summary | Verification Method | Status |
|---|---|---|---|---|
| **NFR-01** | Performance | Web content loaded <2.5s over 4G; API response <300ms (p95) | Lighthouse & k6 load tests | NOT_STARTED |
| **NFR-02** | Time to Offers | Pre-qualification to offer display: median <60s, p95 <90s | Distributed APM tracing | NOT_STARTED |
| **NFR-03** | Availability | 99.9% uptime target for contractor and homeowner portals | Synthetic health checks | NOT_STARTED |
| **NFR-04** | Recovery | RPO <= 5 minutes, RTO <= 1 hour in multi-AZ failover | Automated disaster recovery tests | NOT_STARTED |
| **NFR-05** | Scalability | 50 pre-qual/sec peak, 10,000 quotes/day | Scalability benchmark tests | NOT_STARTED |
| **NFR-06** | Security | TLS 1.2+, AES-256 at rest, CSFLE for PII, SOC 2 alignment | SAST/DAST + pen tests | NOT_STARTED |
| **NFR-07** | Privacy | PII data vault, 45-day right-to-be-forgotten deletion path | Privacy audit & unit tests | NOT_STARTED |
| **NFR-08** | Accessibility | WCAG 2.2 AA compliant UI components across all screens | Axe automated accessibility tests | NOT_STARTED |
| **NFR-09** | Usability | Responsive mobile-first design, 375px viewport single-hand use | Playwright viewport tests | NOT_STARTED |
| **NFR-10** | Observability | Distributed tracing across lender calls, error alerts >5% | Structured Pino logs + OpenTelemetry | NOT_STARTED |
| **NFR-11** | Auditability | Append-only tamper-evident audit trail retained for 7 years | Audit log write & query tests | NOT_STARTED |
| **NFR-12** | Compatibility | Cross-browser support: Chrome, Safari, Edge mobile/desktop | Playwright cross-browser tests | NOT_STARTED |

---

## 3. Regulatory & Compliance Traceability (CMP)

| ID | Regulation | Requirement Implementation | Code Location | Status |
|---|---|---|---|---|
| **CMP-01** | TILA / Reg Z | Clear trigger term disclosures on example EMIs; full disclosure before e-sign | `packages/shared/src/money/tila.ts` | NOT_STARTED |
| **CMP-02** | ECOA / Reg B | Adverse action notice generation with specific lender reasons; fairness checks | `apps/api/src/modules/offers/adverse-action.ts` | NOT_STARTED |
| **CMP-03** | FCRA | Explicit soft-pull and hard-pull consents recorded prior to inquiries | `apps/api/src/modules/prequal/consent.ts` | NOT_STARTED |
| **CMP-04** | GLBA / Safeguards | Written security policy, MFA enforcement, field-level encryption of financial PII | `apps/api/src/middleware/encryption.ts` | NOT_STARTED |
| **CMP-05** | UDAAP | Energy savings as conservative ranges; explicit rebate condition disclaimers | `apps/api/src/modules/savings/savings.ts` | NOT_STARTED |
| **CMP-06** | FTC Holder Rule | Standard preservation of claims and defenses clause embedded in contracts | `apps/api/src/modules/esign/templates.ts` | NOT_STARTED |
| **CMP-07** | Cooling-Off Rule | 3-day door-to-door sales cancellation period enforced before completion release | `apps/api/src/modules/milestones/rescission.ts` | COMPLETE |
| **CMP-08** | Reg Z Rescission | 3-business-day right of rescission hold on any secured financing | `apps/api/src/modules/milestones/rescission.ts` | COMPLETE |
| **CMP-09** | E-SIGN Act | Consumer consent to electronic records; proof of viewability before signing | `apps/api/src/modules/esign/esign.ts` | NOT_STARTED |
| **CMP-10** | TCPA | Prior express written consent for SMS quote delivery and OTP reminders | `apps/api/src/modules/notifications/tcpa.ts` | NOT_STARTED |
| **CMP-11** | State Licensing | State-by-state lender adapter gating and contractor license validation | `apps/api/src/modules/contractors/licenses.ts` | NOT_STARTED |
| **CMP-12** | Dealer Fee Transparency | Single price rule (cash == finance); 5% max contractor buy-down, fully badged | `packages/shared/src/schemas/quote.ts` | NOT_STARTED |
