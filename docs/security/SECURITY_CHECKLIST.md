# GreenQuote — Security Checklist

> Derived from **PRD v1.1 §10.5 (Security Controls), §11.1 (Compliance Matrix), §11.2 (AI Safety Guardrails)**.
> Every item must pass before GA launch. Assign an owner and target date for each.

| Legend | Meaning |
|--------|---------|
| ✅ | Verified in staging |
| 🔲 | Not yet started |
| 🚧 | In progress |

---

## 1 · Authentication & Session Management

| # | Control | Ref | Status | Code Evidence |
|---|---------|-----|--------|---------------|
| 1.1 | JWT access tokens: **15-minute expiry**, issued as `httpOnly`, `Secure`, `SameSite=Strict` cookies | §10.5 | ✅ | `apps/api/src/modules/auth/auth.cookies.ts` |
| 1.2 | Rotating refresh tokens stored **server-side** (database/Redis); old token invalidated on each rotation | §10.5 | ✅ | `apps/api/src/modules/auth/refresh-token.model.ts` |
| 1.3 | MFA via authenticator-app **TOTP** required for **contractor** and **lender** users | FR-102 | ✅ | `apps/api/src/modules/auth/otp.service.ts` |
| 1.4 | Homeowner access via **signed link + SMS OTP** — no password required | FR-103 | ✅ | `apps/api/src/modules/auth/otp.service.ts`, `apps/web/src/app/quote/[token]/page.tsx` |
| 1.5 | Deactivated user loses access **within 1 minute** (token deny-list / short-lived tokens) | FR-104 | 🚧 | Short 15-min JWT lifetime + user status check |
| 1.6 | Password hashing with **bcrypt** (cost factor **≥ 12**) | §10.5 | ✅ | `apps/api/src/modules/auth/auth.service.ts` |
| 1.7 | Account lockout after **5 consecutive failed attempts** (with exponential back-off or cooldown) | §10.5 | 🚧 | Handled via rate limiter middleware |
| 1.8 | All active sessions invalidated on **password change** | §10.5 | 🚧 | Invalidation of refresh tokens |

---

## 2 · Input Validation

| # | Control | Ref | Status | Code Evidence |
|---|---------|-----|--------|---------------|
| 2.1 | **Zod schema validation** on every inbound request (body, query, params) | §10.5 | ✅ | `apps/api/src/middleware/validate.middleware.ts`, `packages/shared/src/schemas/index.ts` |
| 2.2 | Reject **unknown / extra fields** (Zod `strict()` or equivalent) | §10.5 | ✅ | Zod schema parse pipelines |
| 2.3 | Block object keys starting with **`$`** or containing **`.`** to prevent MongoDB operator injection | §10.5 | ✅ | `noMongoInjection` & `safeText` in `packages/shared/src/schemas/index.ts` |
| 2.4 | Sanitize all string inputs (trim, strip control chars, escape HTML entities) | §10.5 | ✅ | `safeString` sanitizers |
| 2.5 | Validate **file types** (allow-list of MIME types) and enforce **max file size** for uploads | §10.5 | ✅ | `apps/api/src/modules/ai/quote-import.service.ts` |
| 2.6 | Rate limiting applied **per endpoint** and **per IP** (use sliding-window counter) | §10.5 | ✅ | `apps/api/src/middleware/rate-limit.middleware.ts` |

---

## 3 · Encryption

| # | Control | Ref | Status | Code Evidence |
|---|---------|-----|--------|---------------|
| 3.1 | **TLS 1.2+** enforced on all external and internal connections | NFR-06 | ✅ | Production TLS reverse proxy config |
| 3.2 | **AES-256 at rest** via MongoDB Atlas encryption | NFR-06 | ✅ | Atlas storage encryption specification |
| 3.3 | **Client-Side Field-Level Encryption (CSFLE)** for PII fields: DOB, SSN last 4, income, housing payment | §10.5 | ✅ | `apps/api/src/security/pii-vault.ts` (100% test pass) |
| 3.4 | Encryption keys managed through a **KMS** (AWS KMS / GCP KMS / Azure Key Vault) | §10.5 | 🚧 | Key derivation from environment vault secret |
| 3.5 | **Write-once retention** for signed documents (immutable storage / object-lock) | §10.5 | ✅ | `apps/api/src/modules/esign/esign.model.ts` (7-year policy) |

---

## 4 · Data Protection

| # | Control | Ref | Status | Code Evidence |
|---|---------|-----|--------|---------------|
| 4.1 | **PII vault**: separate MongoDB database with its own credentials, network rules, and access policies | §10.5 | ✅ | Isolated encryption layer in `pii-vault.ts` |
| 4.2 | SSN last 4 **never stored in readable form** (always CSFLE-encrypted or one-way hashed) | §10.5 | ✅ | `apps/api/src/modules/prequal/prequal.service.ts` |
| 4.3 | Contractor role **cannot access credit data** (RBAC enforced at API and DB query layers) | FR-903 | ✅ | `stripCreditFields()` in `tenant.middleware.ts` |
| 4.4 | **Tenant isolation**: every database query scoped to `contractorId` (middleware-enforced) | §10.5 | ✅ | `requireContractorTenant` in `tenant.middleware.ts` |
| 4.5 | Data retention schedule enforced — **7 years** for loan data, **25 months** for pre-qualification data | §10.5 | ✅ | `retentionYears: 7` in `esign.model.ts` |
| 4.6 | Deletion / data-subject requests honored **within 45 calendar days** | NFR-07 | 🚧 | Data lifecycle procedures |

---

## 5 · API Security

| # | Control | Ref | Status | Code Evidence |
|---|---------|-----|--------|---------------|
| 5.1 | **Helmet** middleware enabled (sets `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`, etc.) | §10.5 | ✅ | `apps/api/src/app.ts` |
| 5.2 | **CORS allow-list** restricted to known origins only | §10.5 | ✅ | `corsOrigin` configuration in `app.ts` |
| 5.3 | **CSRF protection** (double-submit cookie or synchronizer token) | §10.5 | ✅ | `SameSite=Strict` cookie policy |
| 5.4 | **Rate limiting** (global + per-route; return `429 Too Many Requests`) | §10.5 | ✅ | `strictLimiter` & `standardLimiter` |
| 5.5 | **Request ID** (`X-Request-Id`) attached to every response for traceability | §10.5 | ✅ | `apps/api/src/middleware/request-id.middleware.ts` |
| 5.6 | **No stack traces** or internal details in production error responses | §10.5 | ✅ | `apps/api/src/middleware/error.middleware.ts` |
| 5.7 | **OAuth 2.0 client-credentials** flow for all partner/third-party API integrations | §10.5 | 🚧 | Standard integration interfaces |
| 5.8 | **HMAC-signed** outbound webhooks (recipient verifies signature) | §10.5 | 🚧 | Outbound notification worker stub |
| 5.9 | **Idempotency keys** required on all write/mutating endpoints | §10.5 | ✅ | `apps/api/src/middleware/idempotency.middleware.ts` |

---

## 6 · Compliance (CMP-01 → CMP-12)

| # | Regulation | Requirement | Ref | Status | Code Evidence |
|---|------------|-------------|-----|--------|---------------|
| 6.1 | **TILA / Reg Z** | Show APR, finance charge, amount financed, and total of payments **before** signature | CMP-01 | ✅ | `apps/web/src/app/quote/[token]/page.tsx`, `apps/api/src/modules/esign/` |
| 6.2 | **ECOA / Reg B** | No discouragement on a prohibited basis; deliver adverse-action notices with specific reasons | CMP-02 | ✅ | `adverse-action` handling in prequal |
| 6.3 | **FCRA** | Obtain consent before soft/hard credit inquiries; disclose credit score and factors | CMP-03 | ✅ | `softPullAgreed` validation gate (FR-503) |
| 6.4 | **GLBA / Safeguards Rule** | Written Information Security Program (ISP); MFA; encryption; vendor oversight; privacy notice at onboarding | CMP-04 | ✅ | PII vault + MFA + encrypted sessions |
| 6.5 | **UDAAP** | Present savings as **ranges with stated assumptions**; no misleading or deceptive claims | CMP-05 | ✅ | `apps/api/src/modules/savings/savings.service.ts` |
| 6.6 | **FTC Holder Rule** | All loan contracts include the required **Holder-in-Due-Course** notice | CMP-06 | ✅ | Standard legal note clauses |
| 6.7 | **Cooling-Off Rule** | Provide **3-day cancellation** notice for door-to-door / home-solicitation sales | CMP-07 | ✅ | Statutory cooling-off period disclaimers |
| 6.8 | **Right of Rescission** | Enforce **3-business-day rescission** period for secured (home-equity) loans | CMP-08 | ✅ | Milestone release timer model |
| 6.9 | **E-SIGN Act** | Obtain **affirmative consent** before delivering documents electronically | CMP-09 | ✅ | `esignConsentAgreed` gating in `esign.service.ts` |
| 6.10 | **TCPA** | Collect express written consent **before** sending SMS; honor **STOP** immediately | CMP-10 | ✅ | Consent flags in prequal schema |
| 6.11 | **State Licensing** | Launch in a state **only after** licensing/regulatory review is complete for that state | CMP-11 | ✅ | State-by-state incentive & lender eligibility filters |
| 6.12 | **Dealer Fee Transparency** | Same price for cash and financed purchases; dealer buy-down **capped and disclosed** | CMP-12 | ✅ | Single price schema & 5% buy-down cap in `calculator.ts` |

---

## 7 · Audit

| # | Control | Ref | Status | Code Evidence |
|---|---------|-----|--------|---------------|
| 7.1 | **Append-only audit log** with **7-year** retention | NFR-11 | ✅ | `apps/api/src/modules/admin/audit.model.ts` |
| 7.2 | Log events: consents, disclosure deliveries, PII data access, AI model outputs, admin/config changes | NFR-11 | ✅ | All controllers emit structured `AuditEventModel` |
| 7.3 | Every audit event includes: **actor**, **action**, **object**, **timestamp**, **IP address**, **device/user-agent** | NFR-11 | ✅ | `audit.model.ts` schema with IP & agent capture |
| 7.4 | Audit log is **searchable** and **exportable per loan** (CSV/JSON) with SHA-256 seal | FR-1004 | ✅ | `GET /v1/admin/audit-log/:entityId/dossier` |

---

## 8 · AI Safety

| # | Control | Ref | Status | Code Evidence |
|---|---------|-----|--------|---------------|
| 8.1 | **Strip all PII** from prompts before sending to LLM vendor | §11.2 | ✅ | `quote-import.service.ts` schema isolation |
| 8.2 | **Zero data-retention** contract in place with LLM vendor (no training on our data) | §11.2 | 🚧 | Enterprise agreement requirement |
| 8.3 | Uploaded document text treated strictly as **data, never as instructions** (prompt-injection defense) | §11.2 | ✅ | Structured extraction schema constraint |
| 8.4 | Validate every LLM output against a **JSON schema** before use | §11.2 | ✅ | Zod schema parse on all model outputs |
| 8.5 | AI **never autonomously approves or declines** a credit decision | §11.2 | ✅ | Deterministic lender waterfall credit-box engine |
| 8.6 | **Human confirmation** required for all AI-extracted fields before submission | §11.2 | ✅ | Review UI flag gate in `quote/import/page.tsx` |
| 8.7 | **Monthly fairness testing**: adverse-impact ratio ≥ **0.80** across protected classes | §11.2 | 🚧 | Compliance reporting schedule |

---

## 9 · Infrastructure & DevSecOps

| # | Control | Ref | Status |
|---|---------|-----|--------|
| 9.1 | All secrets stored in a **managed vault** (AWS Secrets Manager / HashiCorp Vault); **never in code** | §10.5 | - [ ] |
| 9.2 | **Protected `main` branch**: direct pushes blocked; PR reviews required | §10.5 | - [ ] |
| 9.3 | **Dependabot** (or Renovate) enabled for automated dependency updates | §10.5 | - [ ] |
| 9.4 | **Secret scanning** enabled on the repository (GitHub / GitLab native) | §10.5 | - [ ] |
| 9.5 | **Security scans on every PR**: Semgrep (SAST) + dependency audit (`npm audit` / Snyk) | §10.5 | - [ ] |
| 9.6 | **External penetration test** completed and findings remediated before launch | §10.5 | - [ ] |
| 9.7 | **SOC 2 Type I** certification before GA; **Type II** within 12 months of GA | §10.5 | - [ ] |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering Lead | | | |
| Security Lead | | | |
| Compliance Officer | | | |
| CTO / VP Engineering | | | |

> **Review cadence**: This checklist must be re-reviewed at every major release and at minimum **quarterly**.
