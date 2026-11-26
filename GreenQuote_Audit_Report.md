# GreenQuote: Product & Technical Audit

**Audit date:** 26 Nov 2026
**Scope:** Live site `https://green-quote-khyb.vercel.app`, live API `https://greenquote-api.onrender.com`, repo `github.com/MohitMulik/GreenQuote` (HEAD `e13d796`)
**Method:** I read the backend, shared and frontend source line by line. I loaded every portal route on the live site. I sent read-only requests to the live API, plus one login with the published demo account. I did not change any code or data. I did **not** call `POST /v1/system/seed`, because it wipes the database (see C-1). I did not run the test suite locally.

All file paths are relative to `greenquote/` unless they say otherwise.

---

## 1. Executive Summary

**Verdict:** GreenQuote is a well-designed **clickable prototype** sitting next to a **partially built backend**. The two are not connected. It is not a working lending product, and it is not ready for real users, lenders or money.

What is real:
- A clean TypeScript monorepo: Next.js 14, Express, MongoDB, a shared Zod and finance package, and CI.
- A correct EMI/amortization engine with unit tests (`packages/shared/src/money/`).
- Real contractor auth: bcrypt, JWT, refresh-token rotation, TOTP MFA (disabled for the seeded users), and tenant scoping on quote routes.
- Backend modules for quotes, prequalification, e-sign records, milestones, a rescission clock, audit logs and four-eyes lender configuration, all persisted to MongoDB.

What is not real:
- **Only one frontend screen calls the API: contractor login.** Every other screen in every portal runs on hard-coded React state. This includes the pipeline, quote builder, homeowner quote, offers, e-sign, lender dashboard, admin queue and analytics. Evidence: `grep apiFetch apps/web/src` matches only `contractor/login/page.tsx`.
- **The lenders are invented.** The backend returns three hard-coded rate cards for every applicant and never looks at income, credit or the lender's credit box. No one is ever declined.
- **The AI is invented.** The "AI Quote Reader" returns the same fixed JSON whatever you upload. The frontend upload is a `setTimeout`.
- **No external integration exists.** There is no CIBIL/bureau, Aadhaar eSign, DigiLocker, Account Aggregator, eNACH/UPI AutoPay, payment rail, SMS/email, PM Surya Ghar portal or DISCOM connection.
- **The India pivot is mostly cosmetic.** The live database still holds the US seed (Boston heat pump, USD, "Sarah Jenkins"). Schemas still ask for SSN, EIN and ZIP. Disclosures cite TILA/Reg Z, ECOA, FCRA, the FTC Holder Rule and ACH. The homeowner page's second language is Spanish.
- **There are critical security holes.** An unauthenticated endpoint can wipe the production database. Signing a loan, releasing a payout and rescinding a loan need no authentication. The quote-send API returns the OTP in its response.

**Readiness score (my judgement):**

| Dimension | Score /10 | Comment |
|---|---|---|
| UI/UX prototype quality | 7 | Polished, covers four portals, works on mobile, good storytelling |
| Backend domain modelling | 5 | Sensible modules, real persistence, many simulated services |
| Frontend–backend integration | 1 | Login only |
| Lending core (decisioning, marketplace, waterfall) | 1 | Fixed rate cards; no decisioning |
| Security | 2 | Several critical unauthenticated mutations |
| India regulatory fit (RBI DLD, DPDP, eSign) | 2 | Names the regulations; implements US ones |
| Production operations | 2 | Render free tier in US (Oregon), ~27 s cold start, in-memory state |
| Portfolio/demo value | 8 | Strong showcase if it is described honestly |

**What to do next, in one sentence:** stop adding screens. Wire the existing screens to the existing API, close the security holes, finish the India localisation, then build one real lender integration end to end.

---

## 2. Product Overview

| Aspect | Current understanding (from README, PRD, landing page) |
|---|---|
| **What it is** | Embedded point-of-sale (POS) financing for residential rooftop solar and clean energy in India. Installers build Good/Better/Best quotes with EMIs. Homeowners prequalify with a soft pull, compare lender offers, sign, and the lender pays out against installation milestones. |
| **Target users** | (1) MNRE-empanelled solar installers (owner and sales advisor). (2) Homeowners. (3) Banks and NBFCs (SBI, Tata Capital, IREDA are named). (4) GreenQuote operations and compliance staff. |
| **Value proposition** | Installers close more deals with transparent EMIs and no dealer fee. Homeowners get the PM Surya Ghar subsidy netted upfront and can compare lenders. Lenders get verified, milestone-gated, low-fraud originations. |
| **Business model (implied, not written down)** | Lead or origination fee paid by the lender (a DSA/LSP model). Optional SaaS fee from installers. Possibly an optional contractor rate buy-down (modelled up to 5%). |

**Product findings**

| # | Status | Problem | Why it matters | Recommendation | Priority |
|---|---|---|---|---|---|
| P-1 | No revenue model in code or docs | There is no fee entity, lender commission, invoicing or installer subscription | Investors and lenders will ask "who pays you and how much" | Define the model: lender pays 1–2% of the disbursed amount as LSP/DSA fee, plus an installer SaaS tier. Add a `Fee` or `Commission` ledger. | High |
| P-2 | Identity confusion between US and India | The repo started as a US heat-pump product (Mass Save, Reg Z, AHRI) and was relabelled for India. Both coexist in code, data and the live UI. | Credibility. A lender's compliance team would reject it on sight. | Pick India. Delete the US paths: `currency: "USD"`, AHRI, heat-pump savings, Reg Z texts, Spanish. | Critical |
| P-3 | The subsidy story is legally inaccurate | The product promises "PM Surya Ghar Instant POS Netting". The scheme's CFA (₹30k/kW up to 2 kW, plus ₹18k for the 3rd kW, max ₹78k) is released to the consumer's bank account **after** installation, net-metering and inspection, through the national portal. It is not given at the point of sale. | If you net ₹78k at POS, someone has to fund that gap for weeks or months. That is a credit-risk product, not a UI feature. | Present two modes: (a) "subsidy-adjusted loan", where the lender sanctions the gross amount and the subsidy is credited to the loan account later as a part-prepayment, and (b) "bridge financing" with a lender partner. Show the timeline honestly. | Critical |
| P-4 | Installer-side value is untested | No pricing, no CRM-style follow-ups, no WhatsApp | Indian installers sell over WhatsApp and phone, not through Jobber or ServiceTitan | Make WhatsApp-first quote sharing a core feature (see §8) | High |

---

## 3. Website Review (Live Site)

All 11 portal routes return HTTP 200 **without logging in** (`/lender/dashboard`, `/admin/review-queue`, `/admin/analytics` and the rest). There is no `apps/web/src/middleware.ts` and no client-side guard.

### 3.1 Landing page `/`
- **Good:** It clearly explains four portals with feature chips and a "GreenQuote Interactive Demo" banner, and it is responsive.
- **Problems:** It claims "Multi-Bank CIBIL Soft-Pull", "Aadhaar OTP E-Sign (IT Act 2000)", "eNACH & RTGS Milestone Releases" and "fraud & price anomaly detection (>2.5x benchmark)". None of these exist in code. The `<meta description>` still says "HVAC contractor… heat pump financing" (`apps/web/src/app/layout.tsx:14`).

### 3.2 Installer Portal
| Screen | What the UI shows | What actually happens | Evidence |
|---|---|---|---|
| Login `/contractor/login` | Email, password, MFA | **Real.** Calls `/v1/auth/login` and `/v1/auth/mfa/verify`. Live login with `sanjay@apexhvac.com` / `Password123!` succeeds with no MFA prompt. | `contractor/login/page.tsx:23,35` |
| Pipeline `/contractor/pipeline` | Deals table, filters, CSV export | **Mocked.** Hard-coded deals; never calls `/v1/quotes/pipeline` | No `apiFetch` in file |
| Quote builder `/contractor/quote/new` | 3-tier builder, equipment picker, presentation mode, version history, "Send" | **Mocked.** `handleSendQuote = () => setQuoteSent(true)`. Nothing is saved or sent. "Preview" links to `/quote/demo-token`. | `quote/new/page.tsx:224,323` |
| AI import `/contractor/quote/import` | Upload, OCR, confidence flags | **Mocked twice.** Upload is `setTimeout(1200)`. The data is hard-coded. | `quote/import/page.tsx:120-127` |
| Onboarding `/contractor/onboarding` | 4-step GSTIN/MNRE KYB wizard | **Mocked.** Steps only change local state. No call to `/auth/register`. | `onboarding/page.tsx:289` |
| Milestones `/contractor/milestones/[id]` | Evidence upload, payout status | **Mocked.** `setTimeout` "submit"; the ID defaults to `ln_89410` | `milestones/[loanId]/page.tsx:27,79` |

### 3.3 Homeowner Portal `/quote/[token]`
- **The token is ignored.** Any URL shows the same SunVolt/Rajesh quote, hard-coded in `quote/[token]/page.tsx:157-243`.
- The OTP step is **skipped**. The page starts at `quote_view`, and the OTP input is pre-filled with `489201` (line 128).
- The **lender offers are computed in the browser** from three fixed rates (SBI 7%, Tata 8.25%, Canara/IREDA 7.5%) (lines 251-310). The backend prequal and SSE offer stream are never called.
- PAN, DOB and income are collected and then **discarded**. Nothing is sent.
- **E-sign is a typed name** plus checkboxes ("TILA acknowledged"). It is not Aadhaar eSign.
- The state DISCOM incentive is tagged `category: "federal_tax_credit"` (lines 199, 219), a US concept.
- The second language is **Spanish** (`translations.es`). India needs Hindi and regional languages.
- **Good:** The step flow (quote → prequal → offers → KFS/e-sign → completion → rescission) is the right shape, and the financial breakdown uses the shared engine.

### 3.4 Lender Capital Portal `/lender/dashboard`
- It is fully hard-coded (`useState` arrays at lines 85, 119). There is no lender login, and the `lender_user` role exists in types but no route uses it.
- **Data errors visible to users:** "2 kW Grid-Tied Solar System … ₹11,50,000" disbursement. A 2 kW system costs about ₹1.2–1.5 L. Lenders will notice this immediately.
- US terms on an India page: "Federal Truth in Lending Act (Reg Z §1026.23) and FTC Cooling-Off Rules", "Disburse ACH Funds", "Municipal Permit".
- "Approve payout" blocks during cooling-off with `alert()`. Even that logic is front-end only.

### 3.5 Operations Console `/admin/review-queue`, `/admin/analytics`
- **Mocked.** Fraud items, KYB queue, lender configs and incentive programs are local arrays. Four-eyes approval compares against a hard-coded `authenticatedOfficer`, so one person can play both roles by editing state.
- Analytics are hard-coded, both in the UI and in the backend `getPlatformAnalytics` (`apps/api/src/modules/admin/admin.controller.ts:426`). They show "heatPumpsPct: 64, solarPvPct: 28", which contradicts the solar-first positioning.

### 3.6 UX assessment
| Area | Rating | Notes |
|---|---|---|
| Visual design and consistency | Good | Tailwind, consistent cards and badges, mobile layout done |
| Information architecture | Good | Four portals map to four real personas |
| Honesty and trust | Weak | Compliance badges ("100% Locked", "RBI compliant") on mocked flows can mislead a lender demo |
| Accessibility | Unverified | No a11y testing; `alert()` used for compliance blocks |
| Performance | Weak | API cold start measured at **27.1 s** (Render free tier). The first real call will feel broken. |
| Localisation | Wrong | English + Spanish; no Hindi; INR formatting is fine |

---

## 4. Technology & Architecture Assessment

### 4.1 Stack
| Layer | Technology | Assessment |
|---|---|---|
| Frontend | Next.js 14 App Router, Tailwind, lucide, `@greenquote/ui` | Modern and fine. Every page is a `"use client"` page with mock state, so there is no server-side data loading. |
| Backend | Express + TypeScript, Zod, Mongoose, pino, helmet, express-rate-limit | Fine for an MVP; modular by domain |
| Shared | `@greenquote/shared`: money engine, Zod schemas, types | **Best part of the repo.** It is the right idea to share finance code between client and server. |
| Database | MongoDB (Atlas) | Workable. Financial ledgers would be better in Postgres (ACID, constraints) later. |
| Worker | Agenda | **Stubs only**: `notify.dispatch`, `lender.retry` and `document.ocr` just log (`apps/worker/src/jobs/index.ts`) |
| Hosting | Vercel (web) + Render free plan, **Oregon (US)** (`render.yaml:11`) | Cold starts. **RBI Digital Lending Directions require data to be stored in India.** |
| CI | GitHub Actions: build shared, typecheck, test, build web | Good baseline |
| Tests | About 80 test cases (shared money ~34, API ~45, including the FSM and property tests) | Good on the finance math. **There are no frontend tests**, and the e2e tests exercise APIs the UI never calls. |

### 4.2 Architecture diagram (actual, not intended)

```
 Browser (Next.js on Vercel)
   ├── /contractor/login ──────────────► Express API (Render, US) ──► MongoDB Atlas
   └── every other page ──► hard-coded React state (no network)
                                         │
             API modules that exist but no UI uses:
             quotes · prequal · offers(SSE) · esign · milestones
             admin/audit · incentives · equipment · ai(mock) · fsm(mock) · property(mock)
                                         │
             External integrations: NONE (bureau, eSign, payments, SMS, AA, DISCOM)
```

### 4.3 Code quality findings
| # | Finding | Evidence | Priority |
|---|---|---|---|
| A-1 | Frontend and backend are disconnected | Only `contractor/login/page.tsx` imports `apiFetch` | Critical |
| A-2 | "Mongo down" silently returns **mock success** for financial operations | `prequal.service.ts:41-75` returns fake offers from "Vermont Clean Energy CU"; `milestones.service.ts:154` returns mock milestones | High |
| A-3 | Lender configuration is an in-memory object | `admin.controller.ts:35 mockLenders`; it is lost on restart, breaks with multiple instances, and prequal never reads it | High |
| A-4 | Idempotency cache is an in-memory `Map` | `middleware/idempotency.middleware.ts:12`; it has no eviction and is not shared across instances (the DB-level idempotency in prequal partly covers this) | Medium |
| A-5 | Secrets fall back to hard-coded defaults | `config/index.ts:12-17` `JWT_SECRET`, `PII_ENCRYPTION_KEY` defaults. The app should fail to start in production when they are missing. | High |
| A-6 | Errors thrown as plain `Error` become 500s | e.g. `quotes.service.ts:165`, `milestones.service.ts:25`, `prequal.service.ts:84`; these should be 404/409 via `AppError` | Medium |
| A-7 | The OpenAPI spec is a stub | `app.ts:93` has 9 paths, summaries only, and still says "TILA Reg Z"; Redoc is loaded from an unpinned `latest` CDN | Low |
| A-8 | Naming bug: `totalCostOfCreditMinor` holds **total repayment** | `prequal.service.ts:166`; cost of credit should mean interest plus fees. The e-sign record then derives the finance charge from it. | Medium |
| A-9 | "Integer-only arithmetic, no IEEE-754" claim is overstated | `calculator.ts:93` uses `Math.pow` floats, then rounds. The result is fine in practice but the README claim is inaccurate. | Low |
| A-10 | Amortization final-row edge case | `calculator.ts:207-210`: if the remaining balance is larger than the EMI, `interestMinor` goes negative and is clamped, while `paymentMinor` uses the unclamped value | Low |
| A-11 | Self-review docs claim "100% remediated" | `docs/review/unresolved-issues.md:14`; this contradicts the code | Medium (credibility) |
| A-12 | Two `README.md` files and large binaries (PRD PDF, deck PDF) at the repo root | `/README.md`, `greenquote/README.md` | Low |

---

## 5. Core Functionality Review

Legend: ✅ Implemented · 🟡 Partial · 🎭 Mocked/simulated · ❌ Missing

### 5.1 Multi-lender offers — 🎭 Mocked
- **Current:** `prequal.service.ts:142-188` loops over three **hard-coded** rate cards ("Public Sector Bank 5.75%/60m", "Co-operative Bank 7.5%", "NBFC 10.5%/84m"). It computes EMIs and sorts by total repayment. The applicant's DOB, income and housing payment are encrypted, stored, and then **never used**. `lenderId` is a fresh random ID on every call (`lnd_${randomId(8)}`), so offers cannot be traced to a lender entity.
- **Why it matters:** This is the core of the product, and today it does not exist. Every applicant is "approved" by every lender, so the adverse-action path can never trigger in real use.
- **Fix:** Create `Lender`, `LenderProduct` and `CreditPolicy` collections, and move `mockLenders` into the DB. Add a `DecisionEngine` interface with two implementations: (a) a rules-based sandbox using the stored credit box (CIBIL band, FOIR/DTI, ticket size, tenure, pincode), and (b) a lender API adapter. Add per-lender timeouts and a `Promise.allSettled` fan-out, and persist declines with reasons.
- **Priority:** Critical

### 5.2 Waterfall lending — ❌ Missing
- **Current:** There is no concept of lender priority, sequencing or fallback anywhere (a grep for `waterfall|cascade|priority` returns nothing relevant).
- **Why it matters:** Indian POS programs commonly run a **waterfall**: the anchor lender (for example a PSU bank for PM Surya Ghar) gets first look, then NBFCs, then fallback partners. It maximises approval rates and lets you honour exclusivity or right-of-first-refusal deals.
- **Fix:** Add a `RoutingPolicy` per program with ordered tiers, e.g. `[{tier:1, lenders:[sbi], mode:"sequential", timeoutMs:20000}, {tier:2, lenders:[tata, ireda], mode:"parallel"}]`. Stop at the first approval, or collect N offers, depending on policy. Persist every hop (`LenderDecisionAttempt`) for audit and lender MIS. Run it in the worker with retries (`lender.retry` already exists as a stub).
- **Priority:** High (after 5.1)

### 5.3 Lender marketplace — 🎭 UI only
- **Current:** There is a lender dashboard UI with rate tiers and a credit box, all local state. The backend has four-eyes config change endpoints (`admin.controller.ts:212-386`) that act on in-memory `mockLenders`, are restricted to the `operations` role, and are not used by the UI. There is no lender login, no lender onboarding, and no lender-scoped data access.
- **Fix:** Add a `lender_user` auth flow with an RBAC scope of `lenderId`. Give lenders a self-serve credit box and rate sheet with four-eyes approval inside the lender org. Add a lead and application inbox, a sanction/decline API, disbursement confirmation, and MIS exports. Offers should then come from these configs.
- **Priority:** High

### 5.4 Embedded lending — 🟡 Partial (concept is there, embedding is not)
- **Current:** "Embedded" today means financing appears inside the installer's quote, which is a good concept. There is no embeddable artefact: no JS widget, iframe, SDK, partner API keys or partner webhooks. The FSM webhook (`integrations/fsm-webhook.service.ts`) validates parity but **does not persist a quote**. The HMAC verifier exists but is **never called**, and it targets US tools (Jobber, ServiceTitan, Housecall Pro).
- **Fix:** (1) Add a partner API with API keys and HMAC-signed webhooks (`quote.created`, `offer.ready`, `loan.sanctioned`, `milestone.paid`). (2) Build a drop-in "Check EMI" widget for installer websites and OEM/distributor portals. (3) Add a shareable WhatsApp quote link with OTP. (4) Add integrations with Indian installer tools (Zoho, Tally, Excel import).
- **Priority:** High

### 5.5 EMI calculations — ✅ Implemented (strongest area), with business-logic gaps
- **Current:** `packages/shared/src/money/calculator.ts` and `financing.ts` implement the standard reducing-balance EMI, amortization, Newton-Raphson APR, a buy-down cap, down-payment clamping and incentive classification, with about 34 tests. I checked one value: ₹1,72,000 at 7% over 60 months gives an EMI of ₹3,405.81. That is correct.
- **Gaps:**
  1. **APR = nominal rate.** There are no processing fees, GST on fees, insurance or stamp duty. RBI's KFS requires an **all-in APR** that includes all fees, and `calculateApr` exists but is not used for offers. (High)
  2. **Quote EMI and loan amount disagree.** Quote creation nets "instant" subsidies off the price (`quotes.service.ts:68-76`), but prequal finances `priceMinor − downPayment` (`prequal.service.ts:87`) with **no subsidy deduction**. The homeowner sees one EMI and would be offered another. (High)
  3. No foreclosure or part-prepayment schedule (needed for the subsidy credit in P-3), no moratorium, and no broken-period interest. (Medium)
- **Priority:** High for the gaps

### 5.6 AI features — 🎭 Fully simulated
- **Current:** `ai/quote-import.service.ts:39` says in its own comment "*Simulates* OCR + Multimodal LLM". It returns the same 2 options whatever the input, with the contractor fixed as "Apex Clean Energy LLC" and the homeowner as "Sarah Jenkins, Boston". The only input it reads is whether `rawText` contains `$`. No file is accepted, there is no LLM or OCR dependency in `package.json`, and the endpoint is unauthenticated. The frontend upload is a `setTimeout`. "Fraud and price anomaly detection (>2.5× benchmark)" and "AI-04 equipment verification" have **no backend implementation**. Equipment verification is a substring match against the contractor's **most recent** quote, not the loan's own quote (`milestones.service.ts:29`).
- **Fix:** (1) A real document pipeline: upload to object storage (S3 or GCS in an India region), then OCR or a multimodal LLM with a JSON schema, then the existing arithmetic and confidence checks (that part is well designed), then human review. (2) Price anomaly detection: a per-kW price benchmark by state and system size from your own quote data, flagging anything over P90 or 2.5× the median. (3) Installation photo verification: EXIF/geo-tag checks, panel count, and serial-number OCR matched against the ALMM model.
- **Priority:** Medium (it differentiates the product but does not block a lending MVP)

### 5.7 Other modules
| Module | Status | Notes | Priority |
|---|---|---|---|
| Quotes API | ✅ (unused by UI) | Tenant-scoped create, get and pipeline. **Bug:** incentives and savings always computed as `heat_pump` (`quotes.service.ts:42-52`). No quote edit or versioning endpoint, even though the UI shows version history. | High |
| Incentives | 🟡 Buggy | Live API: `GET /v1/incentives/calculate?state=UP&equipmentCategory=solar_pv` returns `{"totalMinor":0}`. PM Surya Ghar is seeded with `state:"IN"` and category `solar_panel`, but queried with the property's state ("UP") and `heat_pump`. The in-memory fallback has the **opposite** bug: both the 2 kW (₹60k) and 3 kW (₹78k) subsidies match every quote, so ₹1.38 L is deducted. There is no kW-based CFA formula. | Critical |
| Savings | 🟡 | The solar model exists (4 kWh/kW/day × ₹8) but quotes never call it. No state tariff slabs or net-metering rules. | Medium |
| E-sign | 🟡 | A DB record and SHA-256 hash, but the hash includes `new Date()` and is not reproducible later. Unauthenticated (anyone with an `offerId` can sign). Stores US TILA/FTC notices. Not Aadhaar eSign. | Critical |
| Milestones and payouts | 🟡 | A single `final_completion` milestone for 100% of the loan, while the UI shows M1/M2 "dual draw". "Payout released" only changes a status; no money moves. Confirm and rescind are **unauthenticated**. Rescission sets the milestone to `held` but leaves the offer `selected` and the quote `signed`. | Critical |
| Cooling-off clock | 🟡 Wrong jurisdiction | Uses US Reg Z rules: Saturdays count as business days and the holidays are US federal (Juneteenth, July 4). RBI's "look-up period" works differently: the borrower exits by repaying principal plus proportionate APR. | High |
| Adverse action | 🎭 | Hard-coded US ECOA/FCRA text and the Experian Texas address for real records (`adverse-action.service.ts:117-140`); the CIBIL version only appears for a sample ID | High |
| Property verification | 🎭 | Returns "MATCH" if the name contains "jenkins" or "sarah" (`property.service.ts:53`). India needs DISCOM consumer-number and electricity-bill name match, plus property tax or sale deed. | Medium |
| Homeowner OTP | 🟡 | The backend is sound (hashed, 10-minute expiry, 5 attempts) but nothing is ever sent by SMS, and `sendQuote` returns `testOtp` **even in production** (`quotes.service.ts:190`) | Critical |
| Contractor KYB | 🟡 | Register endpoint and `pending_review` status exist. It collects `ein` (US) instead of GSTIN/PAN/MNRE ID. No GSTIN API check. Team invite uses the fixed password `ChangeMe2026!` (`contractor.controller.ts:62`). | High |
| Audit log | ✅ | Events written for the key actions, with a dossier export. It is not tamper-evident (no hash chain) and not WORM. | Medium |
| PII vault | 🟡 | AES-256-GCM is fine. The key is derived by SHA-256 of an env string, there is no KMS and no rotation, and the key ID is hard-coded as `local-dev-v1`. | Medium |

---

## 6. Bugs & Weaknesses (Prioritised)

### Critical
| ID | Bug | Evidence | Failure scenario | Fix |
|---|---|---|---|---|
| C-1 | **Unauthenticated database wipe** | `app.ts:59` `POST /v1/system/seed` with no auth; `seed.ts:22,133` run `deleteMany({})` on equipment, contractors, users and more | Anyone on the internet can wipe the production DB and reset every password to `Password123!` | Delete the route, or gate it behind `NODE_ENV!=="production"` plus an admin role |
| C-2 | Loan e-sign, milestone confirm, rescind, prequal, offers SSE, adverse-action, AI parse and property verify are **unauthenticated** | `app.ts:177-200,288-291` | Anyone with an ID can sign a loan, release a payout or cancel someone else's loan. `GET /milestones/:loanId` is open. | Require the homeowner OTP session (`authenticateHomeowner` exists but is **never used**) and bind the resource to `req.user.quoteId` |
| C-3 | OTP returned in API response in production | `quotes.service.ts:190` `testOtp: rawOtp` | Defeats OTP verification | Return it only when `!config.isProduction` (as `otp.service.ts:48` already does) and send by SMS |
| C-4 | Public quote API exposes PII via a guessable token | Live: `GET /v1/quotes/public/demo-token` returns the homeowner's name, phone, email and address | Data leak; DPDP Act exposure | Return a redacted view until the OTP is verified; use random tokens only; delete the `demo-token` seed in production |
| C-5 | Subsidy calculation is wrong both ways | §5.7 Incentives | Live: ₹0 subsidy. Fallback: ₹1.38 L, double-counted. | A kW-based CFA function plus correct seed data and category mapping |
| C-6 | Frontend never uses the backend | §3 | The live demo cannot create, send or finance a real quote | See roadmap, 30-day plan |
| C-7 | Data residency and the free tier | `render.yaml` sets `region: oregon`, `plan: free` | Not acceptable to RBI-regulated lender partners; 27 s cold start | Move to an India region (AWS Mumbai, GCP Mumbai/Delhi, or Render Singapore as a stop-gap) |

### High
| ID | Bug or weakness | Evidence |
|---|---|---|
| H-1 | Cross-site session cookies will not work: the API sets `SameSite=Lax` cookies on `onrender.com` for a `vercel.app` frontend, so later authenticated fetches will not carry them | Live `Set-Cookie: …; SameSite=Lax`; `auth.cookies.ts:11` |
| H-2 | No route guards on admin, lender or contractor pages | No `middleware.ts` |
| H-3 | MFA disabled for every seeded user; demo credentials are public in the repo | `seed.ts:158,169,179` |
| H-4 | Offers ignore the applicant (no decisioning) | `prequal.service.ts:142` |
| H-5 | Financed amount ignores the subsidy shown in the quote | §5.5 |
| H-6 | Equipment verification checks the wrong quote | `milestones.service.ts:29` |
| H-7 | Rescission does not cascade (offer and quote stay signed) | `milestones.service.ts:125-131` |
| H-8 | Hard-coded default secrets used when env vars are missing | `config/index.ts` |
| H-9 | Live DB holds the US seed while the repo seed is India | Live `/v1/quotes/public/demo-token` returns `currency:"USD"`, Boston |
| H-10 | US identifiers in the schema: `ssnLastFour`, `ein` | `packages/shared/src/schemas/index.ts:118,151` |

### Medium and Low
- `contractorId || "cnt_default"` fallback in `milestones.controller.ts:26`. It is masked by middleware, but it is a dangerous pattern. (Medium)
- Unpinned `redoc@latest` CDN script on `/docs`. (Low)
- `x-forwarded-for` trusted without `app.set("trust proxy")`, which breaks rate limiting and spoofs the IP in audit logs. (Medium)
- A 5 MB JSON body limit on every route. (Low)
- Strings that should be typed errors return 500. (Medium)
- Unrealistic demo numbers on the lender dashboard (₹11.5 L for 2 kW). (Medium, credibility)

---

## 7. Feature Gap Analysis

| Capability | Status | Evidence | Priority to finish |
|---|---|---|---|
| Contractor auth + MFA | ✅ | `auth.service.ts` | — |
| Contractor registration / KYB | 🟡 | API only; US EIN field; UI mocked | High |
| Team management | 🟡 | API only; fixed temporary password | Medium |
| 3-tier quote builder | 🎭 UI / ✅ API | Not wired | Critical |
| Equipment catalog (ALMM) | 🟡 | 3 Indian items in the fallback; the live DB has US heat pumps; no ALMM sync | High |
| Quote send (SMS/WhatsApp) | ❌ | No provider | Critical |
| Homeowner OTP access | 🟡 API / 🎭 UI | OTP never delivered | Critical |
| Subsidy (PM Surya Ghar) calculation | 🟡 buggy | §5.7 | Critical |
| Savings estimate | 🟡 | Not used for solar | Medium |
| Soft-pull prequal (CIBIL) | 🎭 | No bureau | Critical (via lender partner) |
| Multi-lender offers | 🎭 | Fixed rate cards | Critical |
| Waterfall routing | ❌ | — | High |
| Lender portal / marketplace | 🎭 | UI only, no lender auth | High |
| KFS (RBI Key Fact Statement) | 🎭 | UI text only; no backend KFS, no all-in APR | Critical |
| Loan agreement + Aadhaar eSign + e-stamp | ❌ | Typed name | Critical |
| Repayment mandate (eNACH / UPI AutoPay) | ❌ | — | High |
| Milestone disbursement | 🟡 | Single milestone, status only | High |
| Cooling-off / look-up period | 🟡 | US logic | High |
| Grievance redressal (RBI) | ❌ | No nodal officer or complaint flow | High |
| Adverse action / decline notice | 🎭 | US text | High |
| Audit log | ✅ | Not tamper-evident | Medium |
| Ops review queue | 🟡 API / 🎭 UI | | Medium |
| Analytics | 🎭 | Hard-coded in both API and UI | Medium |
| AI quote reader | 🎭 | Fixed JSON | Medium |
| Fraud / price anomaly | ❌ | UI claim only | Medium |
| Notifications (SMS, email, WhatsApp) | ❌ | Worker stub | High |
| Document storage | ❌ | `evidenceUrls` are strings; no upload | High |
| Partner API / widget (embedded) | ❌ | FSM stub only | High |
| Hindi / regional language | ❌ | Spanish instead | High |
| Frontend tests / E2E (Playwright) | ❌ | — | High |
| Observability (Sentry, metrics) | ❌ | pino logs only | Medium |

---

## 8. Missing Requirements

### 8.1 Regulatory and compliance (India). Confirm these with a lawyer; this is a product view, not legal advice.
1. **RBI Digital Lending Directions:** GreenQuote is a **Lending Service Provider (LSP)**, not a lender. That requires a written agreement with each Regulated Entity (bank or NBFC). The RE must be named on every screen and in the KFS. The KFS must show an all-in APR before signing. Disbursement and repayment must flow between the RE and the borrower or end beneficiary, never through GreenQuote's accounts. Data must be stored in India. The DLA must be reported by the RE. A grievance redressal officer must be named. A look-up period is required. **Status: none implemented in code.**
2. **DPDP Act 2023 and Rules:** purpose-specific consent records (the current `consent` object is close; extend it), a privacy notice, data-principal rights (access, erasure), a breach process, and retention limits. **Partial.**
3. **Aadhaar:** use a licensed eSign Service Provider (ASP/ESP) for eSign. Never store Aadhaar numbers; use a vault or tokenised reference. **Missing.**
4. **Credit bureau:** a soft pull must go through the RE's bureau membership, or through a CIC-authorised channel with explicit consent. **Missing.**
5. **Loan documentation:** e-stamping (state-wise stamp duty), the sanction letter, and the agreement PDF. **Missing.**
6. **PM Surya Ghar process:** consumer registration on the national portal, DISCOM feasibility, vendor selection, installation, net-meter, inspection, CFA release. Track each stage per loan. **Missing.**
7. **GST:** installer invoice capture (GSTIN-validated) before disbursement. **Missing.**

### 8.2 Integrations
| Need | Suggested Indian providers (examples) | Priority |
|---|---|---|
| SMS / WhatsApp OTP and quote share | MSG91, Gupshup, Twilio India, WhatsApp Business API | Critical |
| Lender APIs / LOS | Partner bank or NBFC APIs; co-lending platforms | Critical |
| KYC (PAN, Aadhaar offline/OKYC, DigiLocker, CKYC) | Digio, Signzy, IDfy, HyperVerge, Setu | Critical |
| Aadhaar eSign + e-stamp | Digio, Leegality, eMudhra | Critical |
| Income verification | Account Aggregator (Setu, Finvu, OneMoney), bank-statement analysers (Perfios, FinBox) | High |
| Repayment mandate | eNACH / UPI AutoPay via Razorpay, Cashfree, Digio | High |
| GSTIN verification | GSTN public API / GSP | High |
| Object storage (India region) | S3 ap-south-1, GCS asia-south1 | High |
| Monitoring | Sentry, OpenTelemetry, uptime checks | Medium |

### 8.3 Platform requirements
- Real RBAC: homeowner, installer owner and advisor, lender analyst, lender approver, ops maker and checker, and admin, each with resource scoping.
- A state machine for the loan lifecycle, with enforced transitions (see §10).
- Document management for quotes, KFS, agreements, invoices and installation photos.
- A notification centre and templates (EN, HI, plus regional languages).
- Environment separation: demo/sandbox data must never live in production.

---

## 9. Top 10 Improvements

| # | Improvement | Why | Effort |
|---|---|---|---|
| 1 | **Close the critical security holes** (C-1 to C-4, H-1 to H-3, H-8) | One request can currently destroy or hijack the system | 2–3 days |
| 2 | **Wire the UI to the API**: pipeline, quote builder, send, homeowner quote by token, OTP, prequal, offers SSE, e-sign, milestones | Turns a mock-up into a product; the API mostly exists already | 2–3 weeks |
| 3 | **Finish the India localisation and remove the US paths**: schemas (PAN, GSTIN, PIN), seed, disclosures, cooling-off logic, Hindi instead of Spanish, reseed production | Credibility with every Indian stakeholder | 1 week |
| 4 | **Correct the subsidy engine and honest subsidy UX**: CFA = min(kW,2)×30k + (kW>2 ? min(kW−2,1)×18k : 0), capped at ₹78k; track subsidy status; reflect it consistently in quote, prequal and loan amounts | Financial accuracy is the product's promise | 3–4 days |
| 5 | **Lender entity + rules-based decision engine** driven by the stored credit box, with declines | Makes "multi-lender" real; unlocks adverse action and MIS | 1–2 weeks |
| 6 | **Waterfall routing policy** in the worker, with per-hop audit | Higher approval rates; how real lender programs run | 1 week |
| 7 | **RBI-grade KFS + all-in APR + agreement PDF + a real eSign provider** | Needed before any real loan is signed | 2 weeks plus vendor onboarding |
| 8 | **Move hosting to an India region on a paid tier**; add Sentry and uptime checks | Data residency and a usable demo (no 27 s cold start) | 2 days |
| 9 | **Lender portal with lender auth**: application inbox, sanction/decline API, milestone disbursement confirmation, MIS export | The lender is your paying customer | 2–3 weeks |
| 10 | **Playwright E2E for the golden path** (installer creates quote → homeowner OTP → prequal → offer → sign → milestone) in CI | Stops regressions; proves the product works end to end | 3–4 days |

---

## 10. Future Planning

### 10.1 Target loan lifecycle (to implement as an explicit state machine)

```
QUOTE_DRAFT → QUOTE_SENT → HOMEOWNER_VERIFIED(OTP) → PREQUAL_SUBMITTED(consent)
  → [waterfall: tier1 → tier2 …] → OFFERS_READY | ALL_DECLINED(→ decline notice)
  → OFFER_SELECTED → KYC_DONE(PAN/OKYC/DigiLocker) → INCOME_VERIFIED(AA)
  → SANCTIONED(lender) → KFS_ACCEPTED → AGREEMENT_ESIGNED(Aadhaar eSign + e-stamp)
  → MANDATE_REGISTERED(eNACH/UPI AutoPay) → LOOK_UP_PERIOD
  → M1 (material delivery) DISBURSED → M2 (commissioning + net meter) DISBURSED
  → SUBSIDY_APPLIED → SUBSIDY_CREDITED(part-prepay) → ACTIVE → CLOSED
  (exit at LOOK_UP_PERIOD → CANCELLED, cascades to offer/quote/milestones)
```

### 10.2 New features (after the MVP works)
- **WhatsApp-native installer app:** share the quote, collect OTP consent, nudge homeowners. This is the biggest distribution lever in India.
- **Subsidy concierge:** guide the homeowner through PM Surya Ghar portal steps and track DISCOM approvals.
- **Installer credit and working capital:** inventory or receivable financing against sanctioned loans. This has higher margin and builds installer lock-in.
- **Installer scorecard:** install quality, complaint rate and default correlation, used by lenders for pricing.
- **Generation monitoring:** inverter API data for post-install savings verification and early default signals.
- **Co-lending marketplace:** bank plus NBFC, with an 80:20 co-lending split.
- **Expansion categories:** home batteries, solar water heaters, BEE 5-star appliances, EV home chargers. Prioritise these over US heat pumps.
- **MSME and commercial rooftop**, a larger ticket segment later.

### 10.3 Technical improvements
- Postgres for the loan and money ledger (double-entry); keep MongoDB for documents if you like.
- Outbox pattern and a queue (BullMQ/Redis, or keep Agenda) for lender calls, notifications and webhooks.
- Secrets in a KMS (AWS KMS, GCP KMS); envelope encryption for PII; key rotation.
- Hash-chained, append-only audit log, exported to WORM storage.
- An OpenAPI-first contract with a generated typed client for the web app.
- Feature flags to separate **demo mode** (current mocks) from **live mode**. This keeps the showcase value without lying.
- Threat model and a VAPT before onboarding any lender; most lenders require one.

### 10.4 Business opportunities
- Lender-paid sourcing fee (DSA/LSP), the primary revenue.
- Installer SaaS (quote builder, CRM, subsidy tracking), as freemium.
- OEM and distributor co-marketing (Waaree, Tata Power Solar, Adani, Havells) through subsidised-rate programs.
- Data products: regional price benchmarks and default analytics for lenders (only with consent and compliance).

---

## 11. Development Roadmap

### Days 1–30: "Make it safe, honest and connected"
| Week | Deliverables | Done when |
|---|---|---|
| 1 | Remove or guard the seed endpoint. Add auth to every homeowner mutation using the OTP session. Stop returning `testOtp` in prod. Redact the public quote. Fail fast on missing secrets. Fix cookies (one domain via a Vercel rewrite/proxy to the API, or `SameSite=None; Secure`). Add `middleware.ts` route guards. Enable MFA. Reseed production with India data. | A security checklist re-run shows no unauthenticated mutation |
| 2 | India localisation: PAN/GSTIN/PIN schemas, remove SSN/EIN/USD/AHRI/Spanish, Indian disclosures, RBI look-up period logic, correct subsidy engine and consistent financed amount | Quote, prequal and e-sign amounts reconcile in a test |
| 3–4 | Wire the installer pipeline, quote builder (create, send), homeowner `/quote/[token]` (load by token, OTP, prequal, offers SSE, sign) and milestone submit/confirm to the real API. Add a visible **Demo mode** toggle that keeps the mocks. Add Playwright golden-path tests. Move to an India region on a paid plan. | A new quote created in the UI can be opened by token, prequalified and signed. It appears in the pipeline. |

### Days 31–60: "Make lending real (sandbox)"
- Lender, Product and CreditPolicy models; move `mockLenders` to the DB; four-eyes approval wired to the UI.
- A rules-based decision engine (CIBIL band, FOIR, ticket, tenure, pincode), declines, and an India decline notice.
- Waterfall routing in the worker, with retries, timeouts and a per-hop audit.
- Lender login and portal: inbox, sanction/decline, milestone verification, disbursement confirmation, CSV MIS.
- KFS generator (all-in APR including fees), sanction letter and agreement PDF; document storage in an India region.
- Two-stage milestones (M1 material 60–70% / M2 commissioning 30–40%, configurable per lender).
- SMS/WhatsApp provider live for OTP and quote sharing.
- **Exit gate:** a sandbox lender can configure its credit box, receive a routed application, sanction it and record a disbursement, with a full audit trail.

### Days 61–90: "Pilot-ready with one lender"
- Sign an LSP agreement with one lender or NBFC (start with an NBFC; banks move slower). Integrate their API (or an assisted-ops CSV fallback).
- Integrate a KYC vendor (PAN + OKYC/DigiLocker), Aadhaar eSign + e-stamp, and eNACH/UPI AutoPay.
- Grievance redressal module, DPDP privacy notice and consent ledger, data retention jobs.
- A real AI quote reader (OCR/LLM + human review) and a price-anomaly benchmark from real quotes.
- Observability (Sentry, dashboards), a VAPT, and an incident runbook.
- Pilot: 5–10 installers in one state (e.g. UP or Maharashtra). Track quote → prequal → sanction → disbursal conversion.
- **Exit gate:** the first real loan is disbursed through the platform, with the KFS, eSign and mandate all recorded.

---

## 12. Current Product Readiness

| Use | Ready? |
|---|---|
| Portfolio, resume or college showcase | **Yes.** It is impressive in breadth and design. Call it an "interactive prototype with a partially implemented backend". |
| Investor demo | **With caveats.** Remove the false claims (live CIBIL, Aadhaar eSign, AI, fraud detection) or label them "simulated". Fix the ₹11.5 L for 2 kW data. |
| Lender pilot conversation | **Not yet.** A lender's tech or compliance review would fail it on data residency, the missing KFS/APR, unauthenticated loan endpoints and US disclosures. |
| Real users or real money | **No.** |

**Bottom line:** the hard, unglamorous half is still to do: integration, security, regulatory fit and one real lender. The good news is that the backend skeleton and the finance engine are already decent, so the next 30 days are mostly **connecting and correcting** what exists, not building new things. Resist adding new portals or features until a single quote can travel from the installer to a sanctioned loan through real APIs.

---

### Appendix A: Live API observations (26 Nov 2026)
| Request | Result |
|---|---|
| `GET /health` | 200 in **27.1 s** (cold start) |
| `GET /v1/equipment/search` | US heat pumps (Bosch, Carrier, AHRI refs) |
| `GET /v1/incentives/calculate?state=UP&equipmentCategory=solar_pv` | `{"totalMinor":0,"incentives":[]}` |
| `GET /v1/quotes/public/demo-token` | Full homeowner PII, `currency:"USD"`, Boston address, status `signed` |
| `GET /v1/milestones/anything` | 200 `{"milestones":[]}` with no auth |
| `GET /v1/admin/lenders` (no auth) | 401 (correct) |
| `POST /v1/auth/login` (demo user) | 200, no MFA, `SameSite=Lax` cookies on `onrender.com` |
| All 11 web portal routes, no login | 200 |

### Appendix B: Not verified
- I did not run `npm test` or `typecheck` locally; I counted test cases by reading the files.
- I did not exercise mutating endpoints on production (seed, register, quote create, e-sign) to avoid changing your data.
- The regulatory points in §8.1 are a product and engineering reading of RBI, DPDP and UIDAI requirements. Validate them with Indian fintech counsel.
