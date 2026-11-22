# GreenQuote — Product & Technical Review

| | |
|---|---|
| **Product** | GreenQuote: clean-energy loan marketplace embedded in contractor quotes |
| **URL reviewed** | https://green-quote-khyb.vercel.app/ |
| **Backend found** | https://greenquote-api.onrender.com (used only by the login page) |
| **Review date** | 23 November 2026 |
| **Build reviewed** | Next.js 14.2.5, build ID `BSlawLscPHhchvdFbWGxq` |
| **Method** | Black-box review: I used every screen in Chrome, read the production JavaScript bundles, and read the public API spec. I did **not** have the source repo. |

> **How to use this document:** every finding has an **ID**, a **severity**, and an **evidence tag**. Start with Section 1 (summary) and Section 19 (roadmap), then work through the IDs. Screenshots are in the `screenshots/` folder next to this file.

---

## 0. Legend

**Severity**

| Level | Meaning |
|---|---|
| 🔴 **Critical** | Must fix before *anyone* outside the team uses it: legal risk, data exposure, crashes in the main flow, or misleading claims |
| 🟠 **High** | Breaks a core promise of the product, or would embarrass you in a demo with a lender or investor |
| 🟡 **Medium** | Real problem, but it doesn't block a demo |
| ⚪ **Low** | Polish and hygiene |

**Evidence**

| Tag | Meaning |
|---|---|
| **[Reproduced]** | I triggered it in the live site and saw it happen |
| **[From code]** | Read directly from the production JS bundle; the behaviour is certain from the code |
| **[Needs check]** | Strong signal, but I could not confirm it without access you have (backend or source) |

> ⚖️ **Legal note:** the compliance section points out risks a reviewer can see. I am not a lawyer. Before handling real consumer credit, get US consumer-finance counsel to review everything.

---

## 1. Executive summary

### Verdict

GreenQuote looks polished and the idea is good: Good/Better/Best HVAC quotes with financing built in, transparent pricing, and payouts gated on milestones. The breadth is impressive: 4 portals and 11 screens.

**But today it is a clickable prototype that presents itself as a live, compliant fintech product.** That gap is the single biggest problem.

- **Only 1 of 11 screens talks to a backend** (login). Every other screen runs on data hard-coded into the React component, and a page refresh resets everything. No quote is saved, no SMS is sent, no credit check runs, no signature is recorded, and no money moves.
- The UI still tells users these things happened: *"SMS and Email dispatched"*, *"3 verified offers received"*, *"Financing Approved & Agreement Signed!"*, *"SHA-256 Integrity Seal: Verified"*, *"Instant Verified"* bank account.
- **There is no authentication on any page.** The Lender Portal and Operations Console are linked from the public homepage and open to anyone.
- **Two main flows crash to a white screen** with normal user input (reproduced).
- **Several compliance problems are built into the design**: a pre-checked credit-check consent box, a pre-filled e-signature, and "Approved" shown after a soft-pull pre-qualification.
- **The mock data contradicts itself across screens**: the same customer, lender, and loan have different facts on different pages. Anyone who demos it for 5 minutes will notice.

None of this is unusual for an early prototype. It just needs to be **either labelled honestly as a demo or built for real** before it goes any further.

### Scorecard

| Area | Score | Why |
|---|:---:|---|
| Concept / market need | **7/10** | Real problem, sensible wedge (point-of-sale HVAC financing) |
| Visual polish | **6/10** | Clean and consistent Tailwind look, but generic, with duplicate headers and clipped text |
| Real working functionality | **1/10** | Only the login form calls an API |
| Correctness of what exists | **3/10** | 2 crash bugs, wrong math labels, buttons that do nothing or the wrong thing |
| Data consistency | **2/10** | Customers, lenders, APRs and loan facts disagree between screens |
| Security & architecture | **1/10** | No auth or RBAC, business logic in the browser, outdated Next.js |
| Compliance readiness | **2/10** | Dark-pattern consent, pre-filled signature, misused legal citations |
| Accessibility | **2/10** | Zero `aria-*` attributes and zero `<label for>` in the entire app |
| Mobile | **4/10** | 5 of 11 pages scroll sideways on a phone |
| Code quality (from bundles) | **3/10** | Hard-coded fixtures, throwing errors during render, mutated state, unused validation |

### Top 12 must-fix items

| # | ID | Fix |
|---|---|---|
| 1 | P-01, P-02 | Either label everything as a demo (persistent banner, no "sent/approved/verified" claims) or wire it to the real backend |
| 2 | S-01 | Add real authentication and role-based access. Take the Lender and Ops consoles off the public homepage |
| 3 | B-01 | Fix the homeowner-page crash (down payment ≥ price) |
| 4 | B-02 | Fix the quote-builder crash (total ≤ $0) |
| 5 | L-01 | Un-check the FCRA credit-consent box by default; stop defaulting TCPA consent to true |
| 6 | L-02 | Stop pre-filling the e-signature; add proper E-SIGN disclosures |
| 7 | L-03 | Never say "Approved" after a soft-pull pre-qualification |
| 8 | M-01 | Resolve "Net price after rebates $5,400 – total out-of-pocket" vs "Amount to finance $13,400" |
| 9 | M-02 | Show TILA figures to the cent and keep them internally consistent |
| 10 | S-02 | Verify every backend endpoint rejects unauthenticated calls. The public API spec declares **no auth on any endpoint**, including admin ones |
| 11 | D-01…D-06 | Create one seed dataset so every screen tells the same story |
| 12 | P-04 | Remove all internal PRD codes (32 distinct codes, ~57 mentions) from the UI |

---

## 2. What's working (keep these)

Fair credit first. These are good decisions:

- **The product idea**: financing embedded in the quote, a single cash/finance price, a capped and disclosed contractor buy-down, and payouts released on milestones. Each one answers a known pain point in home-improvement lending.
- **Offers sorted by lowest total cost** (not lowest monthly payment), and the contractor buy-down is **disclosed to the homeowner**. Both are consumer-friendly.
- The **FTC Holder Rule notice** is included on the signing screen.
- **Money in minor units (cents)** in the shared amortization function, with input guards.
- **Zod schemas already exist** for quotes, pre-qualification, e-sign, milestones, KYB and auth, including an "option price must equal sum of line items" refinement. They're just not used yet (see C-03).
- **Five roles are already modelled**: `contractor_owner`, `contractor_advisor`, `homeowner`, `lender_user`, `operations`.
- **Login design**: email + password, then TOTP MFA, with the session in an httpOnly cookie. That's the right shape.
- **Backend basics**: Helmet security headers, CORS locked to the exact frontend origin with credentials, and a `/health` endpoint.
- **Fast static delivery**: pages are prerendered and CDN-cached (first contentful paint around 120 ms on a warm cache).
- The **maker-checker ("4-eyes") concept** for lender rate changes is the right control, even though it's only simulated today.

---

## 3. Product-level problems (P)

### P-01 🔴 The product is a simulation, but nothing tells the user that **[From code]**
Only `/contractor/login` makes a network request (`POST /v1/auth/login`, `/v1/auth/mfa/verify`). Every other page keeps its data in `useState(...)` with hard-coded values. The backend has endpoints for quotes, pre-qualification, e-sign, milestones and rescission (see Appendix B), but **the UI never calls any of them**.

**Fix:** decide which of these two things the product is:
- **Demo:** add a persistent, unmissable banner ("Interactive demo – no real credit check, no messages sent, no money moved"). Rename every "Simulate…" button consistently and remove the false success claims listed in P-02.
- **Product:** wire each flow to the API (see the roadmap in Section 19).

### P-02 🔴 The UI claims things happened that did not happen **[From code]**
| Screen | Claim shown | Reality |
|---|---|---|
| Quote builder | "Quote Link Sent Successfully! SMS and Email dispatched to +1 (617) 555-0188. Secure OTP access enabled." | No request is made and there is no OTP step |
| Homeowner | "Check **Real** Loan Offers", "3 **verified** offers received" | Offers are computed in the browser from fixed rates |
| Homeowner | "**Financing Approved** & Agreement Signed!" | No underwriting and no hard pull happened |
| Onboarding | Bank account "**Instant Verified**" | Hard-coded; there are no bank inputs at all |
| Ops console | "SHA-256 Tamper-Evident Integrity Seal: **Verified**" | A constant string, with `verified: true` hard-coded |
| Ops console | "Self-approval is **cryptographically** rejected (HTTP 400)" | A string comparison in the browser |
| AI import | "Our vision OCR model extracts…" | `setTimeout(1200)` followed by fixed data. There is no file upload |
| Homepage | "Sub-500ms AHRI Search", "Passwordless one-time verification" | Neither exists |
| API spec | "**Production** FinTech embedded lending and regulatory compliance engine" | Stub spec with no schemas |
| Footer | "**Compliant** with TILA (Reg Z), ECOA (Reg B), FCRA, GLBA, and E-SIGN" | See Section 7: it isn't |

Showing these to a lender, an investor, or a homeowner as if they were real is a credibility risk, and could be a misrepresentation risk.

### P-03 🟠 Marketing claims contradict the product
- "**0% Hidden Dealer Fees**", yet the product offers contractor buy-downs of up to 5% (3.2% shown in the offer). A buy-down *is* a dealer fee. It's disclosed, which is good, but it isn't 0%. Reword to something like "No hidden dealer fees. Any buy-down is disclosed."
- "Residential **solar** and heat pump financing" (meta description), but the quote builder only handles HVAC. Solar appears only in mock lender rows.

### P-04 🟠 Internal requirement codes are all over the UI **[From code]**
There are 32 distinct codes, about 57 mentions in all: `PRD v1.1 FinTech Platform` (in the main header badge!), `FR-308`, `FR-904`, `PRD G1`, `AI-01`, `S14`, `CMP-03`, `QG-2`, `REQ-LND-9021`, `NFR-11`… They appear in **homeowner-facing** places too: the FCRA consent text "(CMP-03)", the language toggle tooltip "(FR-506)", and even inside the Spanish translation "(FR-502)".
**Fix:** keep the codes in code comments, tests and tickets. Never put them in UI copy.

### P-05 🟡 The homepage is a directory of internal portals, not a landing page
It shows four equal cards (Contractor, Homeowner, Operations, Lender) with links such as "→ Review Queues" that look like debug links. Who is the customer? A contractor visiting needs one clear message and one call to action. The Lender and Ops consoles should never be linked publicly (see S-01).

### P-06 🟡 Copy is written for a requirements reviewer, not for users
Homeowners see "AHRI", "NEEP Verified", "SEER2" and "Mass Save" without explanation, plus all-caps legal blocks and statute numbers. Lender copy reads like a compliance checklist ("TILA Actuarial Reg Z Method" under a KPI). Rewrite each screen for its real reader.

### P-07 🟡 Approach: too broad, not deep enough
The build spreads across 4 portals and about 30 requirements, and none of them works end-to-end. A stronger approach is to pick **one wedge** and make it real:

> Contractor creates quote → homeowner opens a secure link → sees real rate estimates from one partner lender → hands off to the lender's application.

Then expand. Also study this market before going further. Point-of-sale green lending has large incumbents and notable failures (for example, Sunlight Financial's 2023 bankruptcy and Solar Mosaic's 2025 bankruptcy), and the CFPB has published scrutiny of hidden dealer fees in solar lending (2024). Knowing why they struggled will sharpen GreenQuote's positioning.

### P-08 🟡 Being "in the loan flow" probably needs licences
If GreenQuote arranges, brokers, or helps make consumer loans across US states, state lending or broker licensing (and possibly a bank partnership) may apply. This decides the architecture and the business model, so get a legal opinion **before** building more lending UI.

---

## 4. Functional bugs (B)

### B-01 🔴 Homeowner quote page crashes when the down payment equals the price **[Reproduced]**
![crash](screenshots/01_homeowner_crash.jpg)

**Steps:** open `/quote/demo-token` → click **Best** → drag *Optional Down Payment* all the way right ($20,500).
**Result:** the whole page is replaced by *"Application error: a client-side exception has occurred."*
**Console:** `Error: Amount financed must be greater than zero.`
**Second path [From code]:** set the down payment to $12,000 on Better, then click **Good** ($10,400). The financed amount becomes 0 and the page crashes.
**Root cause:** `amortize()` throws when the amount ≤ 0. It's called during render for all 3 offers, there's no guard, and there's no error boundary.
**Fix:**
1. Never throw during render. Return a "no financing needed" result for 0.
2. Clamp the down payment to `price − minimumLoanAmount`, and re-clamp it when the tier changes.
3. Add `app/error.tsx` and `app/global-error.tsx` so a bug degrades gracefully.

### B-02 🔴 Quote builder crashes when an option's total is ≤ $0 **[Reproduced]**
**Steps (either one):** on `/contractor/quote/new`, delete all 3 line items in the Good tier, **or** type `-50000` into any amount.
**Result:** white "Application error" screen; all work is lost.
**Fix:** same as B-01. Also validate line items: amount > 0, integer cents, sensible maximum, at least one item per option.

### B-03 🟠 The quote builder can't enter a customer **[From code]**
Customer name, phone, email and address are hard-coded state ("Sarah Jenkins…"). Their setters exist but there are **no input fields**, so a contractor can't create a quote for a real customer.

### B-04 🟠 Line-item editing is incomplete or unsafe **[From code]**
- Negative and decimal amounts are accepted (`parseFloat(...) || 0`, no `min`). Small negative values silently reduce the price.
- New items are always type "equipment" with the label "New Line Item". The type can't be changed.
- Rebates ($4,000 / $10,000 / $10,000) and savings ranges are not editable and not tied to any eligibility.
- An option can't be removed (what if the contractor only offers 2 options?).
- Clearing a number field snaps it back to `0`.

### B-05 🟠 Quote links and the token are fake **[Reproduced]**
Every "Customer Link" points to `/quote/demo-token`, and `/quote/<anything>` shows the same Sarah Jenkins quote. The token is never read. The OTP step promised everywhere doesn't exist; there's even unused state holding a code (`"489201"`).

### B-06 🟠 Builder edits never reach the homeowner **[From code]**
The builder and the homeowner page each carry their own copy of the data, so the titles already differ ("Cold-Climate **High-Efficiency** Heat Pump" vs "Cold-Climate **Hyper-Heat** Pump"; "Premium Geothermal **/ Solar-Ready** Hybrid" vs "Premium Geothermal Hybrid").

### B-07 🟠 The AI Quote Reader doesn't read anything or transfer anything **[From code]**
- The title says "Upload Paper or PDF Contractor Quote", but the only control is a **"Load Sample HVAC Quote"** button with a 1.2 s fake spinner (an emoji ⚙).
- **"Transfer to Quote Builder" transfers nothing.** It's a plain link, and the builder loads its own hard-coded data.
- Only 2 of the 3 tiers are "extracted".
- The banner always says "**2** line items have confidence below 90%", even after you confirm one.
- The "disabled" Transfer link uses `pointer-events-none`. Keyboard users can still Tab to it and press Enter.
- The confirm handler mutates nested state in place (`n.items = …` on a shallow copy), which is a React anti-pattern.

### B-08 🟡 Pipeline dashboard: wrong KPIs, broken CSV **[From code]**
- "**Total Financed Volume $61,100**" is the sum of *all* 4 quotes, including unsigned "Sent" and "Pre-Qualified" ones. Only $10,400 is actually funded.
- "Active Deals: 4 Quotes — 1 Pre-Qualified, 1 Signed" leaves out the Sent and Funded quotes.
- "+66% higher ticket" and "+14.2% close rate lift" are invented numbers. Remove them, or label them as sample data.
- The status filter has no "Installing" option, although that status has its own badge colour.
- **CSV export:**
  - It exports all rows, not the filtered ones.
  - Embedded quotes and newlines aren't escaped.
  - There's no protection against formula injection (a cell starting with `=`, `+`, `-` or `@` runs as a formula in Excel).
  - It uses `encodeURI()` on a data URL, so a `#` in any field truncates the file.
  - The file is named "monthly_pipeline" but isn't filtered by month.

### B-09 🟡 Milestone page shows the wrong customer and pays the wrong amount **[Reproduced + From code]**
- `/contractor/milestones/qte_102` shows "Customer: **Sarah Jenkins**", but qte_102 is **Michael Chang** in the pipeline. Every loan ID shows Sarah.
- "Financed Installation Amount **$15,400**" is the full cash price. It ignores the down payment and the rebate (the homeowner flow financed $13,400).
- After "homeowner sign-off", the payout of the full $15,400 is released **1.5 seconds later**. That contradicts your own 3-day rescission rule and the lender review queue.
- The **contractor** can press "Simulate Homeowner Sign-off & Payout". A contractor UI must never perform homeowner actions.
- When the model number mismatches, step 2 still turns green ("Submitted"), because `evidenceUploaded` is set to true on mismatch.
- "nameplate_mitsubishi_outdoor.jpg — Attached" is fake; there's no file input.
- The model check is a hard-coded exact string match (`"MSZ-FS12NA"`).

### B-10 🟡 Lender portal **[From code]**
- The lender selector (3 lenders) changes nothing on the page.
- **"Disburse ACH Funds" fires on a single click.** There's no confirmation, no amount check, and no second approver. That's ironic, because 4-eyes is enforced for rate changes but not for moving money.
- KPI cards don't update after a disbursement.
- There's a dead `alert()` path: the button is already disabled in that state. Native `alert()` is poor UX for compliance errors anyway.
- "+ Propose Rate Update" always proposes the same hard-coded change (6.99% → 6.49%). There's no form, and no way to approve or reject it.
- The "Verification Evidence" column is hard-coded text for every row, with no link to view a permit or photo.

### B-11 🟡 Operations console **[From code]**
- **"Request Contractor Clarification" and "Approve & Clear Flag" do exactly the same thing** (remove the card). So do **KYB "Reject" and "Approve Onboarding"**. No reason is captured, there's no confirmation, no undo, and no audit event.
- **"Signed-in Officer" is a toggle anyone can click**, so the 4-eyes demo is bypassed by switching identity, while the copy claims enforcement.
- "Propose Parameter Change" accepts an APR of 0%, negative, or 999%, and a loan limit of $0.
- "Add Incentive Program" only requires a name; negative amounts are accepted and jurisdiction is free text.
- **"Export Sealed Dossier" ignores the Loan ID you type.** It always exports Sarah Jenkins' events, with the same fixed hash and `verified: true`.

### B-12 🟡 Analytics date filters do nothing **[From code]**
"Last 30 Days / Q4 2026 / Year-to-Date" only change which button is highlighted. Every number stays the same.

### B-13 🟡 Contractor onboarding (KYB) **[From code]**
- **No validation**: you can clear every field and still click through to "Submitted".
- City, state, ZIP, trade categories, policy number and coverage are stored in state but **have no input fields**.
- The "Compliance Docs" step has **no document upload** (licence, insurance certificate).
- The bank step has **no inputs at all**. It shows a pre-made "Instant Verified" account ("Silicon Valley Bank / First Citizens") with routing number `121000358`, which appears to be a real bank's routing number, and not SVB's. Use obviously fake identifiers in mocks.
- The owner's name, email and password are never collected (the zod schema has them), **so no account is created and a new contractor can never log in.**
- Submit calls no API, but promises "reviewed within 4 business hours".

### B-14 🟡 Login **[Reproduced + From code]**
- The backend runs on a cold-starting host: **the first request took 22.5 s** in my test. The user sees "Please wait…" with no explanation.
- No "forgot password", no sign-up link, no link home, and no `autocomplete` attributes (`username`, `current-password`, `one-time-code`).
- **Nothing checks the session afterwards**: every "protected" page renders without logging in, and the homepage's "Open Workspace" skips sign-in entirely.

### B-15 ⚪ Homeowner flow, smaller issues **[From code]**
- "SSN last 4" accepts letters (`abcd`). Income validation is HTML-only.
- Co-applicant data is collected but **ignored**: offers are identical whatever income, debt-to-income or co-applicant you enter.
- The signature timestamp regenerates on every keystroke.
- After signing, "Return to Initial Quote View" lets the homeowner start again and sign a second time.
- Steps aren't in the URL: browser Back leaves the whole flow, and refresh loses progress.
- "Confirm Job Completed & Authorize Payout Release" is offered **seconds after signing**, before any installation exists.

---

## 5. Data consistency (D)

The same "facts" disagree from screen to screen. A lender or investor clicking through a demo will spot it, and it shows there is no single source of truth.

| ID | Item | Screen A | Screen B | Screen C |
|---|---|---|---|---|
| D-01 🟠 | **Sarah Jenkins' status** | Pipeline: "**Pre-Qualified**" (not signed) | Lender queue: loan LN-8921-MA, homeowner signed, permit on file, $6,700 draw | Audit log: e-signed **and** completion confirmed **3 minutes** after signing |
| D-02 🟠 | **Sarah's equipment** | Fraud queue: installed **MSZ-GL12NA**, mismatch flagged | Audit log: "Equipment match **verified** against AHRI #20875412" | Milestone page: AHRI #**20893412** |
| D-03 🟠 | **Sarah's IDs** | qte_101 (pipeline) | qte_8842 (fraud queue) | LN-8921-MA (lender), ln_89410 (milestone default) |
| D-04 🟠 | **David Miller** | Pipeline: Good heat pump, **$10,400**, Funded, by Apex | Lender queue: "**Rooftop Solar 8.4 kW**" by "**Beacon Solar Systems**", draw **$14,200** (more than his whole quote) | — |
| D-05 🟠 | **Lenders** | Homeowner offers: Clean Energy FCU 6.99%/60, Community Green Bank 7.49%/84, EcoFinance **9.99%**/120 | Lender rate sheet: one lender has 6.99/60, 7.49/84, **8.99**/120 | Analytics & Ops: **completely different lenders** (Vermont Clean Energy CU, Greenpenny, Climate First) |
| D-06 🟡 | **Sarah's lender** | She selects Clean Energy FCU | Milestone page: "Vermont Clean Energy CU" | — |
| D-07 🟡 | **Weighted APR** | Lender portal: 7.24% | Analytics: 6.45% | Analytics' own lender table implies **6.63%** (5.85×2.15 + 6.95×1.72 + 7.80×0.98) ÷ 4.85 |
| D-08 ⚪ | **Contractor name** | "Apex Clean Energy & HVAC LLC" | "Apex Clean Energy LLC" (lender) | "Apex Comfort Systems" (DBA / scanned quote) |
| D-09 ⚪ | **Average ticket** | Analytics: $34,154 | Every quote shown: $10.4k–$20.5k | — |
| D-10 ⚪ | **Builder vs homeowner monthly payment** | Builder: Better = **$281/mo** (10% down, 7.99%) | Homeowner: $265 / $205 / $177 ($2,000 down, 6.99–9.99%) | The contractor quotes a number the homeowner never sees |

**Fix:** one typed seed file (`seed.ts`) or seeded database that every screen reads, with IDs that link up (quote → application → loan → milestones → audit events).

---

## 6. Money & math (M)

### M-01 🔴 Rebates vs financing contradict each other on the same screen **[Reproduced]**
On `/quote/demo-token` (Better): **"Net Price After Rebates $5,400 — Total out-of-pocket"** is shown directly above **"Amount to Finance: $13,400"**.
- If the rebate is applied at point of sale (as the card says), the amount financed should be $15,400 − $10,000 − $2,000 = **$3,400**.
- If the rebate arrives later, don't call $5,400 "out-of-pocket", and don't say "Applied at point of sale".

Your schema already has `paid: "instant" | "after_installation"`. Model rebate timing and calculate from it.

### M-02 🔴 TILA disclosures are rounded to whole dollars and don't add up **[Reproduced]**
![TILA](screenshots/05_tila_rounding.jpg)
"Payment Schedule: **60 monthly payments of $265**" works out to $15,900, but "**Total of Payments $15,916**". The currency formatter uses `maximumFractionDigits: 0` everywhere, including legal disclosures.
**Fix:** show disclosures to the cent, compute the final-payment adjustment, and derive every box from the same numbers.

### M-03 🟡 Wrong financial labels **[From code]**
"Total Cost of Loan" actually shows the *total of payments* (principal + interest). The variable is named `totalCostOfCredit`, but "cost of credit" means the *finance charge*. Use "Total of payments" and "Total interest".

### M-04 🟡 APR is assumed, not calculated **[From code]**
APR is set equal to the note rate. A real APR has to include prepaid finance charges (fees, and possibly a buy-down), calculated using the Reg Z Appendix J method.

### M-05 🟡 The buy-down offer is confusing **[Reproduced]**
"Your contractor is paying $429 to lower this rate" appears on the 7.49% offer, which is still *higher* than the 6.99% offer with no buy-down. The amount is also printed as "$" + a raw number, not with the currency formatter.

### M-06 🟡 The USD ↔ INR toggle is meaningless **[Reproduced]**
It only swaps the symbol: $10,400 becomes **₹10,400** (about $120 for a heat pump). The APR silently changes from 7.99% to 5.75%, and a Massachusetts "Mass Save" rebate is shown in rupees. The whole flow (SSN, FCRA, TILA) is US-only. Remove INR, or build a separate India product with its own pricing, rates and regulation.

### M-07 ⚪ Float money from inputs **[From code]**
User amounts are parsed with `parseFloat` in dollars and then multiplied by 100, so decimals hit floating-point errors. Parse straight into integer cents.

### M-08 ⚪ The slider maximum is inconsistent **[From code]**
The step is $500, so the maximum is unreachable for Good ($10,000 of $10,400) and Better ($15,000 of $15,400), but reachable for Best ($20,500). That's the path that crashes (B-01).

---

## 7. Compliance & legal risk (L)

> Please have these reviewed by US consumer-finance counsel. These are the issues visible from outside.

### L-01 🔴 FCRA credit-check consent is pre-checked **[Reproduced]**
On the pre-qualification form, the "FCRA Consent & Authorization" box is **checked when the page loads** (`softPullConsent: true`) and Submit is enabled immediately. Consent to pull credit must be an affirmative action; pre-checked consent is a well-known dark pattern. The schema also defaults **TCPA consent to `true`** (`tcpaAgreed: default(true)`), and TCPA consent can't be assumed either.

### L-02 🔴 The e-signature is pre-filled **[Reproduced]**
![signature](screenshots/06_prefilled_signature.jpg)
The "Electronic Signature" field already contains "Sarah Jenkins", so signing needs no act of intent. The E-SIGN consent is a single checkbox, with none of the required consumer disclosures (right to paper copies, how to withdraw consent, hardware/software requirements, demonstrated ability to access). The audit line shows a hard-coded **"Signing IP: 127.0.0.1"**.
**Recommendation:** use an established e-signature provider rather than building your own.

### L-03 🔴 "Financing Approved" after a soft-pull pre-qualification **[From code]**
There's no hard pull, no underwriting, no identity verification (KYC/CIP) and no sanctions screening. A pre-qualification is not an approval.

### L-04 🟠 Rescission and cooling-off laws are mixed together **[From code]**
The copy says TILA Reg Z §1026.23 **and** the FTC Cooling-Off Rule "strictly prohibit lender capital disbursements until…". But:
- **§1026.23 rescission** applies only when a security interest is taken in the consumer's principal dwelling.
- **The FTC Cooling-Off Rule** covers in-home sales and requires specific Notice of Cancellation forms.

Work out which rule applies to each product (secured vs unsecured loan; in-home vs not) and implement the correct notices. Remove "Simulate: Exercise Right of Rescission" from the consumer UI.

### L-05 🟠 Spanish is offered, but the legal content is English only **[Reproduced]**
![spanish](screenshots/04_spanish_partial.jpg)
Only the header and step labels are translated. The TILA box, FCRA consent and agreement stay in English. Some states require contracts in the language the deal was negotiated in (for example, California Civil Code §1632), and the FTC Cooling-Off notice must be in the language of the sale. Either translate the legal documents professionally, or don't offer Spanish for those steps.

### L-06 🟠 ECOA / Reg B gaps **[From code]**
- There's **no decline path and no adverse-action notice**: every applicant gets 3 offers.
- A joint application needs documented intent to apply jointly, not just a toggle.
- The "Relationship" field (Spouse / Domestic Partner) collects marital-status information, which Reg B restricts. Have counsel review it.

### L-07 🟠 Privacy, GLBA, and missing legal pages
There's no Privacy Policy, GLBA privacy notice, Terms, licence disclosures or contact page; the footer only has "All rights reserved © 2026". SSN, date of birth and income are collected with no privacy link next to the fields. Once the data is real: GLBA Safeguards Rule, encryption at rest, a retention policy and a data-access audit.

### L-08 🟡 Advertised payment terms must be real
The builder advertises "$281/month — 7.99% APR, 60 months", but no lender in the product offers 7.99%/60. Under Reg Z advertising rules, terms you advertise must actually be available.

### L-09 🟡 Energy-savings claims are unsubstantiated
"Est. Annual Bill Savings $900–$1,400/yr — Based on local utility tariffs" is a hard-coded string. Savings claims need a documented method (inputs, tariff, assumptions) and a disclaimer.

### L-10 🟡 Incentive data is outdated or wrong (see DOM-03)
The federal 25C credit is listed as "active", but it **does not apply to equipment placed in service after Dec 31, 2025** ([IRS](https://www.irs.gov/node/150421)). Financing quotes that count an expired incentive mislead the homeowner about the net price.

### L-11 🟡 The "7-year immutable, cryptographically sealed" audit trail is fake
The hash is a constant, `verified: true` is hard-coded, the IP is 127.0.0.1, and timestamps come from the browser. A real audit trail needs server timestamps, the real IP and user agent, a hash of the exact disclosure shown, and append-only storage (for example, hash-chained events in a write-once store). Until it's real, remove the "Verified" claims.

### L-12 ⚪ FTC Holder Rule notice
It's good that it's present. Make sure it appears in the actual executed contract with the required formatting.

---

## 8. Security & architecture (S)

### S-01 🔴 No authentication or authorization on any page **[Reproduced]**
`/lender/dashboard`, `/admin/review-queue`, `/admin/analytics`, `/contractor/pipeline` and every other page open for anyone. The Lender and Ops consoles are **linked from the public homepage**. There's no `middleware.ts`, no server-side session check, and no role checks. Today the data is mock; **the day real data is wired in, this is a data breach.**
**Fix:**
- Enforce auth on the server for every page and API call.
- Apply role-based access using your 5 roles.
- Isolate tenants: contractor A must never see contractor B's quotes, and a lender only sees its own loans.
- Add `noindex` to app pages, and a `robots.txt` (there is none, so search engines may index these pages).

### S-02 🔴 The public API spec declares no auth on any endpoint **[Needs check]**
`/openapi.json` lists 9 endpoints with **no `securitySchemes` and no `security` entries**, including:
- `GET /v1/admin/analytics`
- `POST /v1/admin/lenders/{lenderId}/config-request`
- `GET /v1/milestones/{loanId}`
- `POST /v1/milestones/rescind`
- `POST /v1/esign/submit`

I deliberately did **not** call these endpoints, so I can't confirm whether the server enforces auth. **Please test that each one returns 401/403 without a valid session**, and that one user can't read another user's `loanId` (an IDOR check).

### S-03 🟠 Dual control (4-eyes) is enforced only in the browser **[From code]**
It's a string comparison against an officer ID the user picks from a toggle. It must be enforced on the server with authenticated identities and stored approval records. Return **403** (not 400) for self-approval, and drop the word "cryptographically".

### S-04 🟠 Homeowner quote access design **[From code]**
The quote link is a bearer token in the URL, and today any token works. Target design:
- A random token of at least 128 bits, with an expiry, scoped to one quote.
- An OTP sent to the phone or email on file **before** showing any PII.
- Rate limits on OTP attempts.
- Minimal data returned by `GET /v1/quotes/public/{token}` before the OTP.
- A link preview (OG tags) that reveals nothing private.

### S-05 🟠 Cross-site cookie sessions will break **[From code]**
The frontend is on `vercel.app` and the API on `onrender.com`; both are public-suffix domains, so they can never share first-party cookies. The httpOnly session cookie is therefore a **third-party cookie**: it needs `SameSite=None; Secure`, it gets **blocked by Safari** (and increasingly by other browsers), and it needs CSRF protection.
**Fix:** use one custom domain (for example, `app.greenquote.com` + `api.greenquote.com`), or proxy API calls through Next.js route handlers. A custom domain also matters for trust: homeowners getting an SMS link to `green-quote-khyb.vercel.app` will reasonably think it's phishing.

### S-06 🟠 Outdated framework with known advisories **[From code]**
The site runs **Next.js 14.2.5** with a **React canary** build (`18.3.0-canary`). Several security fixes were released after 14.2.5. One of them, **CVE-2025-29927** (a middleware authorization bypass, fixed in 14.2.25), matters directly, because middleware-based auth is the obvious fix for S-01. Upgrade to a currently supported release before adding auth.

### S-07 🟡 Business logic runs in the browser **[From code]**
Pricing, amortization, offer ranking, eligibility, dual-control checks, fraud checks and audit "sealing" all run on the client, where users can change them. Move every decision to the server. The client should only display results and collect input.

### S-08 🟡 No security headers on the frontend
Vercel sends HSTS, but there's **no CSP, no `frame-ancestors` / X-Frame-Options, no Referrer-Policy and no Permissions-Policy**. The signing page could be framed by another site (clickjacking). Add these headers in `next.config.js`.

### S-09 🟡 CSV and JSON exports
Pipeline CSV export is open to formula injection (B-08). Audit exports should come from the server with access checks, not be assembled in the browser.

### S-10 ⚪ Hosting reliability
The backend cold start took **22.5 s** (Render, likely free tier). That's unacceptable for login or a live in-home presentation. Use an always-on instance and add monitoring.

---

## 9. Backend / API (API)

### API-01 🟠 The OpenAPI spec is a stub
It's 1 KB: paths and summaries only, with **no request or response schemas, no error models, no auth, and no `servers`**. It also leaves out `/v1/auth/login` and `/v1/auth/mfa/verify`, which the frontend uses. Generate the spec from your zod schemas (for example, with zod-to-openapi) so it stays accurate.

### API-02 🟡 The `/docs` page is blank **[From code]**
The Redoc page uses an inline script plus `cdn.redoc.ly/.../latest`, but Helmet's CSP (`script-src 'self'`) blocks both. Relax the CSP for `/docs` only, or self-host Redoc. Also **pin the version** instead of `latest`, and decide whether a fintech API with admin endpoints should have public docs at all.

### API-03 🟡 Missing endpoints for the flows the UI shows
There are no endpoints for contractor registration/KYB, listing quotes (pipeline), disbursement, fraud-flag actions, incentive CRUD, the audit export, or the OTP for quote links (the zod schemas for OTP exist). Design the API around the state machines in Section 18.

### API-04 ⚪ Error contract
The login page expects `{ message }` on errors. Define one error format for all endpoints (code, message, field errors, correlation ID).

---

## 10. UI & visual design (UI)

### UI-01 🟠 Duplicate headers **[Reproduced]**
![double header](screenshots/03_admin_double_header.jpg)
- **Contractor pages** (pipeline, quote builder, import, milestones) show a layout bar ("GreenQuote | Pipeline | New Quote | **Sign in**") *and* their own page header.
- **The Ops console** shows "GreenQuote Executive Portal" *and* "GreenQuote Operations Console", with **two back arrows**.

Use one app shell per portal. And never show "Sign in" inside a signed-in workspace.

### UI-02 🟡 Inconsistent branding
There are five product names: "GreenQuote", "GreenQuote Contractor Hub", "GreenQuote Executive Portal", "GreenQuote Operations Console", "Lender Capital Portal". The "GQ" logo appears in some headers and is missing in others. Two different greens (`brand-600` and `emerald-600`) are both used as the primary colour, and each page adds its own accent (purple, blue, amber). Define tokens (primary, accent, status colours) and use them everywhere.

### UI-03 🟡 Clipped and truncated text **[Reproduced]**
- Tier titles are cut off on the homeowner cards ("Good: 15.2 SEER2 Standard Hea…").
- Title inputs are clipped in the builder ("Better: Cold-Climate High-Efficiency Hea").
- Line-item labels are cut ("Daikin Standard Heat Pump 3-To").
- Cards repeat the tier name ("GOOD" label plus a "Good: …" title).

### UI-04 🟡 Tiny low-contrast text **[From code]**
There are 58 uses of `text-[9px]`, `text-[10px]` and `text-[11px]`, often light grey on white ("Applied at point of sale", "$0 Down", the signing-IP line). They're hard to read, and grey on white at that size likely fails WCAG AA contrast. Use a minimum of 12 px, preferably 14 px, for anything a homeowner needs.

### UI-05 🟡 Generic look
It uses the default Tailwind palette, the system font stack, and a ⚙ emoji as a spinner. It's clean, but it reads as a template. For a product asking people to trust it with an SSN, invest in a proper visual identity.

### UI-06 🟡 Missing basics
- **No favicon** (`/favicon.ico` returns 404).
- **Every page has the same `<title>`**, so browser tabs and history all look identical.
- **No Open Graph tags**, so a quote link sent by SMS shows a bare URL preview. That matters here, because the core flow is "send a link to a homeowner".
- The default unbranded black-and-white Next.js 404 page; there's no `not-found.tsx`.

### UI-07 ⚪ The Ops tab bar overflows even on desktop
It shows a horizontal scrollbar at 1536 px wide.

### UI-08 ⚪ Presentation mode
It just inverts the colours. Think about what a homeowner should see in person (larger monthly payment, simpler cards, cost breakdown optional, no internal labels such as item category).

---

## 11. UX & flows (UX)

- **UX-01 🟠 Nothing persists and nothing is in the URL.** Refreshing loses quotes, the pre-qualification, and approvals. Put the step in the URL (`/quote/abc/offers`) and store progress on the server.
- **UX-02 🟠 No confirmation on irreversible actions:** Disburse funds, Approve/Reject KYB, Clear fraud flag, Sign loan. Add confirm dialogs that state the consequence ("Disburse $14,200 to Beacon Solar Systems? This can't be undone.").
- **UX-03 🟡 No loading, empty or error states** anywhere except login. Design them per screen (no quotes yet, lender timeout, OTP expired, etc.).
- **UX-04 🟡 Success banners never dismiss** (for example, "Quote Link Sent…").
- **UX-05 🟡 The pipeline has no quote detail page.** Rows aren't clickable, and there's no resend link, viewed/opened status, or activity history.
- **UX-06 🟡 The homeowner flow needs trust signals:** contractor contact and help, a privacy link next to the SSN field, a plain explanation of soft vs hard pull and *when* a hard pull happens, and who the lenders are.
- **UX-07 🟡 The payout-confirmation step is offered right after signing.** It belongs in a later notification ("Your installer marked the job complete. Please confirm.").
- **UX-08 ⚪ Navigation dead ends.** The homeowner completion screen offers "Return to Initial Quote View", which restarts a signed deal, and the lender and admin portals have no link to each other's sections beyond a couple of ad-hoc buttons.

---

## 12. Accessibility (A11Y)

### A11Y-01 🟠 Form fields have no accessible names **[Reproduced]**
There are **zero `aria-*` attributes and zero `htmlFor` in the entire app.** Labels are placed next to inputs but not linked to them. On the pre-qualification form, **8 of 9 controls have no accessible name**, so a screen reader announces "edit text" for Name, DOB, Phone, Email, Income, Housing payment, SSN… The same pattern appears in onboarding, the builder line items and the admin modals.

### A11Y-02 🟡 Other issues
- **Modals** ("Propose Parameter Update", "Add Incentive Program") are plain `div`s: no `role="dialog"`, no focus trap, no Esc to close, and the background stays clickable.
- A **"disabled" link** is still keyboard-activatable (B-07).
- **Step indicators** use colour only. Add `aria-current="step"`.
- **Tier cards** show the selected state by border colour only. Add `aria-pressed` or use radio semantics.
- **Heading levels skip** (H1 → H3 on the homepage). There are no `<nav>` landmarks and no skip link.
- **The language toggle doesn't set `lang="es"`**, so screen readers keep reading Spanish with English pronunciation.
- **The down-payment slider** has no associated label and no `aria-valuetext` like "$2,000".
- **Tiny low-contrast text** (UI-04).

**Fix:** add an automated check (axe / Lighthouse in CI) and test once with a real screen reader (NVDA or VoiceOver).

---

## 13. Mobile / responsive (R)

### R-01 🟡 Five pages scroll sideways on a 375 px phone **[Reproduced]**
| Page | Page width at 375 px viewport | Cause |
|---|---|---|
| `/` | **481 px** | Header nav doesn't collapse (badge + 3 links) |
| `/contractor/quote/new` | **451 px** | Header buttons |
| `/lender/dashboard` | **494 px** | Header lender select + badge |
| `/admin/review-queue` | **522 px** | Header officer toggle |
| `/admin/analytics` | **390 px** | Slight overflow (element not isolated) |

The homeowner page, login and onboarding fit. The pipeline table scrolls inside its own container, which is acceptable, but cards would be better on mobile.

### R-02 🟡 The in-home use case means tablet-first
Comfort advisors present on an iPad or phone at the kitchen table. "In-Home Presentation Mode" should be designed and tested for tablets first.

---

## 14. Language / i18n (I)

- **I-01 🟠 The Spanish toggle covers about 10% of the page** (see L-05 and the screenshot). Most strings are hard-coded English instead of coming from the dictionary; even the dictionary's Spanish tier names ("Básico / Mejor Valor / Premium") are never used.
- **I-02 🟡 No locale formatting:** dates, numbers and currency aren't localised per language.
- **I-03 ⚪ Mixed British and US spelling** in the data model and UI: `labour`, `programmeId`. Use US English throughout for a US product.
- **I-04 ⚪ Use an i18n library** (for example, next-intl) with message keys and a check that fails on missing translations.

---

## 15. Domain accuracy: HVAC & incentives (DOM)

These matter because the equipment description ends up in a **financed contract**.

- **DOM-01 🟠 "Premium Geothermal Hybrid" isn't geothermal.** The equipment listed, the *Carrier Infinity 24 Greenspeed*, is an air-source heat pump. Mislabelling the technology on a loan contract is a misrepresentation risk.
- **DOM-02 🟠 "Mitsubishi H2i 3-Ton (MSZ-FS)" doesn't exist as described.** The MSZ-FS is a ductless wall-mounted line that tops out around 1.5 tons. The milestone page uses **MSZ-FS12NA** (≈1 ton) while still calling it "3-Ton". The "Good" option also mixes in "Duct Connection". Ducted vs ductless and capacity must be correct.
- **DOM-03 🟠 Incentive programme errors** (Ops console):
  - **25C credit** is listed as "active", but it ended for property placed in service after 31 Dec 2025.
  - The **IRA HOMES** description uses the income tiers of the *other* IRA programme (HEEHRA: <80% AMI 100% up to $8k, 80–150% AMI 50%). HOMES is performance-based.
  - The copy calls HOMES/HEEHRA "**tax credits**", but they are rebates.
  - "**Mass Save HEAT Loan & Equipment Rebate**" merges a 0% loan programme with a rebate.
  - Rebates are shown as "**Applied at point of sale**" for every option. Verify that against each programme; many pay after installation.
- **DOM-04 🟡 Rebates are hard-coded** ($4k / $10k / $10k) whatever the equipment, household income or location. Real stacking logic needs eligibility rules per programme, per state and per utility.
- **DOM-05 🟡 The AHRI promise has nothing behind it.** There's no equipment catalogue or AHRI lookup anywhere, but AHRI numbers appear in the data and differ between screens (#20875412 vs #20893412).
- **DOM-06 ⚪ The fraud example flags a "3-ton standard AC"** on a heat-pump platform. Use an on-domain example.
- **DOM-07 ⚪ Everything is Boston/Massachusetts-specific** (Mass Save, MA licence) with no state logic. Fine for a pilot, but make "state" a first-class concept early.

---

## 16. Code quality & engineering hygiene (C)

From the production bundles (minified, but the structure is visible):

- **C-01 🟠 Fixtures live inside components.** Every page defines its own hard-coded arrays and objects, which is the cause of Section 5. Move them to a seed module or database.
- **C-02 🟠 Throwing during render with no error boundaries.** This causes B-01 and B-02. There's no `error.tsx` or `global-error.tsx` and no error monitoring, so production crashes are invisible to you. Add Sentry or similar.
- **C-03 🟡 Validation exists but is unused.** The zod schemas ship to the browser (~58 KB chunk), but no form uses them. Use the same schema on the client (react-hook-form + zodResolver) and on the server.
- **C-04 🟡 Whole pages are `"use client"`.** You get no benefit from server components, and logic that should be private ships to the browser.
- **C-05 🟡 Magic numbers are spread through the code:** 10% down, 7.99%, 5.75%, 3.2% buy-down, 2.5× fraud threshold, $500 slider step. Centralise them in config, or better, fetch them from the server (lender rate sheets).
- **C-06 🟡 State handling.** The import page mutates nested state, line-item IDs come from `Date.now()`, money is parsed with `parseFloat`, and there's leftover state (`"489201"`, setters that are never used, a currency state with no UI).
- **C-07 🟡 Copy-pasted UI.** Each page rebuilds its own header, cards and badges. Extract `AppShell`, `KpiCard`, `StatusBadge`, `MoneyText`, `Stepper` and so on.
- **C-08 🟡 No tests visible.** At minimum:
  - unit tests for amortization edge cases (0, negative, 1-month term, 0% APR, rounding to the cent);
  - unit tests for offer ranking;
  - Playwright end-to-end tests for: create quote → open link → pre-qualify → select offer → sign → milestone.
- **C-09 ⚪ Native `alert()`.** Replace it with in-app toasts or dialogs.
- **C-10 ⚪ Unpinned third-party script** (Redoc `latest`) on the API docs page.

---

## 17. Page-by-page quick reference

| Route | Real or mock | Key issues |
|---|---|---|
| `/` | Static | P-03, P-04, P-05, S-01 (public console links), R-01, UI-06 |
| `/contractor/login` | **Real API** | B-14, S-05, S-10 |
| `/contractor/onboarding` | Mock | B-13, L-07 |
| `/contractor/pipeline` | Mock | B-08, D-01, D-04, UI-01, UX-05 |
| `/contractor/quote/new` | Mock | **B-02 crash**, B-03, B-04, B-06, M-06, L-08, DOM-01/02, UI-01, UI-03, R-01 |
| `/contractor/quote/import` | Mock | B-07, P-02 |
| `/contractor/milestones/[loanId]` | Mock | B-09, D-02, D-03, D-06 |
| `/quote/[token]` (homeowner) | Mock | **B-01 crash**, B-05, **M-01, M-02, L-01, L-02, L-03**, L-04, L-05, L-06, A11Y-01, I-01 |
| `/lender/dashboard` | Mock | B-10, D-05, D-07, S-01, R-01 |
| `/admin/analytics` | Mock | B-12, D-07, R-01 |
| `/admin/review-queue` | Mock | B-11, S-03, L-10, L-11, DOM-03, UI-01, R-01 |

---

## 18. Recommended target architecture

**1. One domain, server-side truth**
- `app.yourdomain.com` (Next.js, current version) plus `api.yourdomain.com`, or API route handlers in the same Next.js project.
- All calculations, eligibility checks, and state transitions happen on the server.

**2. Data model (Postgres + an ORM such as Prisma or Drizzle)**
- `Organization` (type: contractor | lender | platform), `User`, `Membership(role)`
- `Homeowner`, `Property`
- `Quote` → `QuoteOption` (good/better/best) → `LineItem` (integer cents) → `AppliedIncentive`
- `IncentiveProgram` (jurisdiction, eligibility rules, payout timing, valid_from/valid_to)
- `Application` → `Applicant` (primary/co) → `Consent` (type, text version, timestamp, IP, user agent)
- `Offer` (lender, APR calculated per Reg Z, term, payment schedule, buy-down)
- `Loan` → `Disclosure` (rendered document + hash) → `Signature`
- `Milestone` → `Evidence` (files in object storage) → `Disbursement`
- `ConfigChangeRequest` (maker, checker, status) for 4-eyes
- `AuditEvent`: append-only, hash-chained, written only by the server

**3. Explicit state machines with server-enforced transitions**
- Quote: `draft → sent → viewed → accepted`
- Application: `started → consented → prequalified | declined → offer_selected → hard_pulled → approved | declined → signed → rescission_window → active`
- Milestone: `pending → evidence_submitted → homeowner_confirmed → lender_approved → disbursed`
- Disbursement must be impossible while a fraud flag is open or the rescission window is running, and the database should enforce that, not just the UI.

**4. Buy established services rather than building your own (examples)**
- E-signature: a provider such as DocuSign or Dropbox Sign
- OTP: a verification service such as Twilio Verify
- Bank verification: Plaid or similar
- KYB: a business-verification API
- File storage: S3 or Vercel Blob
- Credit: through the lender partner's API, not your own bureau connection unless you're licensed for it

**5. Auth**
Session cookies on the same site, middleware plus per-route server checks, RBAC with your 5 roles, tenant scoping in every query, and MFA for lender and ops users.

**6. Quality**
CI with typecheck, lint, unit and e2e tests, axe accessibility checks, preview deployments, Sentry, and uptime monitoring.

---

## 19. Fix roadmap

### Phase 0: before showing it to anyone (≈ 1 week)
1. Add a persistent "Interactive demo" banner. Remove or reword every false "sent / verified / approved / sealed / cryptographic / compliant" claim (P-01, P-02, P-03).
2. Fix the crashes (B-01, B-02) and add `error.tsx` / `global-error.tsx`.
3. Un-check the consent boxes; stop pre-filling the signature; replace "Approved" with "Pre-qualified" (L-01, L-02, L-03).
4. Fix the rebate/financing contradiction and the TILA rounding (M-01, M-02).
5. One shared seed dataset so every screen agrees (Section 5).
6. Remove PRD codes from the UI (P-04); fix the duplicate headers (UI-01); add a favicon, per-page titles and OG tags.
7. Remove the Lender and Ops links from the public homepage (S-01, quick version).
8. Fix the wrong equipment and incentive facts (DOM-01, DOM-02, DOM-03).

### Phase 1: real MVP for one wedge (≈ 4–8 weeks)
1. Upgrade Next.js; set up a custom domain; real auth + RBAC + tenant isolation (S-01, S-05, S-06).
2. Verify backend auth on every endpoint (S-02); generate a full OpenAPI spec from zod (API-01).
3. Persist quotes: real customer fields, validated line items, a save/send flow with a real secure token + OTP (B-03, B-04, B-05, S-04).
4. Homeowner flow backed by the API, with URL-based steps (UX-01).
5. Use the zod schemas in every form; label all inputs; fix mobile overflow (C-03, A11Y-01, R-01).
6. Tests for money math and an e2e test for the happy path (C-08).

### Phase 2: lending for real (only after the legal opinion, P-08)
1. Partner-lender integration for pre-qualification; decline + adverse-action flow (L-06).
2. Reg Z APR calculation and cent-accurate disclosures from the server (M-02, M-04).
3. E-sign provider integration with full E-SIGN disclosures (L-02).
4. Correct rescission / cooling-off handling per product (L-04).
5. Real milestone evidence upload, homeowner confirmation by notification, and dual-approved disbursement (B-09, B-10).
6. Server-side append-only audit log (L-11); privacy notice, terms and licence disclosures (L-07).
7. Full Spanish translation of legal documents, or drop Spanish for those steps (L-05, I-01).

### Phase 3: operations scale
Real KYB with document review, a fraud-rule engine with reasons and an audit trail, an incentive-programme engine with eligibility rules and effective dates, and lender self-service rate sheets with maker-checker.

---

## Appendix A: Route inventory

| Route | Linked from | Calls backend? |
|---|---|---|
| `/` | — | No |
| `/contractor/login` | Homepage header | **Yes** (`/v1/auth/login`, `/v1/auth/mfa/verify`) |
| `/contractor/onboarding` | Homepage card | No |
| `/contractor/pipeline` | Homepage ("Open Workspace") | No |
| `/contractor/quote/new` | Homepage hero, pipeline | No |
| `/contractor/quote/import` | Homepage card | No |
| `/contractor/milestones/[loanId]` | Pipeline rows (Signed/Funded only) | No |
| `/quote/[token]` | Homepage, pipeline, builder | No (token ignored) |
| `/lender/dashboard` | Homepage header (public) | No |
| `/admin/analytics` | Homepage card, lender portal | No |
| `/admin/review-queue` | Homepage card, analytics | No |

## Appendix B: Backend endpoints (from `/openapi.json`)

| Method | Path | Used by UI? | Auth declared? |
|---|---|---|---|
| GET | `/health` | No | No |
| POST | `/v1/quotes` | No | No |
| GET | `/v1/quotes/public/{token}` | No | No |
| POST | `/v1/prequalifications` | No | No |
| POST | `/v1/esign/submit` | No | No |
| GET | `/v1/milestones/{loanId}` | No | No |
| POST | `/v1/milestones/rescind` | No | No |
| GET | `/v1/admin/analytics` | No | No |
| POST | `/v1/admin/lenders/{lenderId}/config-request` | No | No |
| POST | `/v1/auth/login` | **Yes** | *Not in spec* |
| POST | `/v1/auth/mfa/verify` | **Yes** | *Not in spec* |

## Appendix C: Screenshots

| File | Shows |
|---|---|
| `screenshots/01_homeowner_crash.jpg` | B-01: white-screen crash after moving the down-payment slider to max on Best |
| `screenshots/02_homepage.jpg` | Homepage: "PRD v1.1" badge, public Lender Portal link |
| `screenshots/03_admin_double_header.jpg` | UI-01: two stacked headers, two back arrows, overflowing tabs; B-11 identical buttons |
| `screenshots/04_spanish_partial.jpg` | L-05 / I-01: Spanish mode, with most of the page still English |
| `screenshots/05_tila_rounding.jpg` | M-02: "60 × $265" vs "Total of payments $15,916" |
| `screenshots/06_prefilled_signature.jpg` | L-02: pre-filled signature, "Signing IP: 127.0.0.1" |

## Appendix D: Scope, method and limits

**What I did**
- Used all 11 screens in Chrome (desktop) and measured page widths at a 375 px phone viewport.
- Downloaded and read every production JS bundle and the CSS.
- Read the public `/health`, `/docs` and `/openapi.json`, and sent one CORS preflight to the login endpoint.

**What I did not do**
- No source-code access. Findings come from minified bundles, so line numbers aren't available.
- No requests to the data or admin API endpoints (S-02 needs your own check).
- No load or penetration testing.
- Did not click "Send to Homeowner"; its behaviour comes from the code, which makes no network call.
- No real screen-reader session (the accessibility findings come from DOM inspection).

**Sources**
- IRS, Energy Efficient Home Improvement Credit (25C) not allowed for property placed in service after Dec 31, 2025: https://www.irs.gov/node/150421
- ACHR News on the loss of the federal heat-pump incentive: https://www.achrnews.com/articles/164924-heat-pump-proponents-optimistic-despite-loss-of-federal-incentive

---

*If this is meant as a portfolio or college project rather than a product launch: it's an ambitious and good-looking prototype. Phase 0 alone would make it an honest, impressive demo. If it's meant to handle real homeowners' credit data, Phases 1–2 and a legal review are not optional.*
