# GREENQUOTE — DAY 1 SECURITY REMEDIATION REPORT

**Author:** Senior Backend Engineer & FinTech Application Security Architect  
**Project:** GreenQuote Platform ([github.com/MohitMulik/GreenQuote](https://github.com/MohitMulik/GreenQuote))  
**Date:** November 26, 2026  
**Status:** Completed & Validated (100% Tests Passing, Build Clean, Pushed to Remote)  

---

## Executive Summary

During the Day 1 Security Remediation sprint, critical vulnerabilities across authentication, authorization, access control, secrets management, OTP handling, and PII protection were remediated. The codebase was hardened to meet institutional FinTech and compliance standards without altering the core product architecture or breaking existing functionality.

All fixes were verified through a dedicated regression test suite (`security-remediation.test.ts`), alongside the complete existing test suite (9 test suites, 65 tests passing, 0 failures), followed by full monorepo typechecking and Next.js production builds.

---

## 1. Vulnerability & Remediation Ledger

| # | Vulnerability Category | Severity | File(s) Modified | Remediation Applied |
|---|------------------------|----------|------------------|---------------------|
| 1 | **Unrestricted Seed Endpoint (`/v1/system/seed`)** | Critical | [app.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/app.ts), [seed.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/scripts/seed.ts) | Prohibited execution in `production` with `403 FORBIDDEN`. Required valid Bearer auth or `x-seed-secret` in non-prod. Disabled destructive drop operations against production databases. |
| 2 | **Unauthenticated Financial APIs & Missing Resource Ownership** | High / Critical | [app.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/app.ts), [prequal.controller.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/prequal/prequal.controller.ts), [milestones.controller.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/milestones/milestones.controller.ts), [esign.controller.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/esign/esign.controller.ts), [adverse-action.controller.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/offers/adverse-action.controller.ts) | Attached `authenticateToken` to `/prequalifications`, `/milestones`, `/esign`, `/ai/parse-quote`, `/property/verify-ownership`. Enforced multi-tenant IDOR/BOLA authorization checks so contractors and homeowners can only access their own records. |
| 3 | **OTP Exposure & Brute-Force Risk** | High | [otp.service.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/auth/otp.service.ts), [quotes.service.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/quotes/quotes.service.ts) | Stripped `testOtp` from API responses in production environments. Enforced an in-memory & database 5-attempt locking ceiling. Required homeowner authentication before granting sensitive quote access. |
| 4 | **Public Quote PII Disclosure** | High | [quotes.controller.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/quotes/quotes.controller.ts), [quotes.service.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/quotes/quotes.service.ts), [auth.middleware.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/middleware/auth.middleware.ts) | In `GET /v1/quotes/public/:token`, masked homeowner full name, email, phone, and street address for unauthenticated requests. Unmasks full PII only upon verified Bearer token, session cookie (`gq_access`), or verified `x-quote-token`. Removed static `demo-token` exposure in production seed scripts. |
| 5 | **Insecure Secret Fallbacks in Production** | High | [config/index.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/config/index.ts) | Implemented fail-fast production startup validation. If `NODE_ENV === "production"`, missing or fallback secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `PII_ENCRYPTION_KEY`, `MONGODB_URI`) throw fatal startup exceptions rather than falling back to default strings. |
| 6 | **Cross-Origin Cookie Security** | Medium | [auth.cookies.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/auth/auth.cookies.ts), [auth.controller.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/api/src/modules/auth/auth.controller.ts) | Configured `sameSite: "none"` and `secure: true` in production environments to support cross-origin cookie authentication between Vercel frontend and Render API domains. Exported `setHomeownerCookie` for verified homeowner OTP sessions. |
| 7 | **Unprotected Frontend Routes** | Medium | [middleware.ts](file:///c:/Users/mohit/OneDrive/Documentos/GreenQuote/greenquote/apps/web/src/middleware.ts) | Added Next.js Edge middleware to intercept unauthenticated direct URL visits to `/contractor/*` (redirecting to `/contractor/login`), `/lender/*`, and `/admin/*`. |

---

## 2. Endpoints Secured

| Endpoint | Method | Authentication & Authorization Rules |
|----------|--------|--------------------------------------|
| `/v1/system/seed` | POST | Blocked in production (403); requires valid Admin token or Seed Secret in development/staging. |
| `/v1/quotes/public/:token` | GET | Publicly viewable with masked PII; unmasked only when verified with homeowner or contractor credentials. |
| `/v1/prequalifications` | POST | Requires authenticated contractor or homeowner; verifies ownership of `quoteId`. |
| `/v1/prequalifications/:id/offers/stream` | GET | Requires authenticated user; verifies user owns the associated quote. |
| `/v1/milestones/:loanId` | GET | Operations has full visibility; contractors restricted to `loan.contractorId === user.contractorId`. |
| `/v1/milestones/:loanId/confirm` | POST | Restricted to verified homeowner owning `milestone.homeownerId`. |
| `/v1/milestones/:loanId/rescind` | POST | Restricted to verified homeowner owning `milestone.homeownerId`. |
| `/v1/esign` | POST | Requires authentication; validates quote ownership matching `req.user`. |
| `/v1/esign/:quoteId` | GET | Requires authentication; verifies contractor/homeowner ownership of `quoteId`. |
| `/v1/prequalifications/:id/adverse-action` | GET | Requires authentication; verifies quote ownership before returning ECOA notice. |
| `/v1/ai/parse-quote` | POST | Restricted to authenticated contractor or internal staff. |
| `/v1/property/verify-ownership` | POST | Restricted to authenticated users with tenant context. |

---

## 3. Test & Verification Results

### Unit & Integration Suites (Jest / Supertest)
```text
Test Suites: 9 passed, 9 total
Tests:       65 passed, 65 total
Snapshots:   0 total
Time:        9.609 s
Ran all test suites.

PASS src/__tests__/security-remediation.test.ts (8.636 s)
PASS src/__tests__/api.test.ts (8.676 s)
PASS src/__tests__/e2e-journey.test.ts (8.707 s)
PASS src/__tests__/rescission.test.ts
PASS src/middleware/tenant.middleware.test.ts
PASS src/middleware/idempotency.middleware.test.ts (5.468 s)
PASS src/modules/property/property.test.ts (5.792 s)
PASS src/security/pii-vault.test.ts (5.806 s)
PASS src/modules/integrations/fsm-webhook.test.ts (5.922 s)
```

### Monorepo Typecheck & Build
- **Typecheck:** `npm run typecheck --prefix greenquote` exited with code `0` across `@greenquote/shared`, `@greenquote/ui`, `@greenquote/api`, `@greenquote/web`, and `@greenquote/worker`.
- **Next.js Production Build:** `npm run build --prefix greenquote/apps/web` compiled successfully with static pages and Edge middleware (`middleware.ts`, 27.1 kB).
- **Git Remote Synchronization:** Committed as `22b9dc9` and pushed to `origin/main`.

---

## 4. Remaining Risks & Day 2 Recommendations

1. **SMS Gateway Provider Integration:** While OTP generation, hashing, attempt limiting, and suppression of raw codes in production are complete, real SMS delivery requires configuring an external provider (Twilio / AWS SNS / Gupshup / Fast2SMS) with production credentials.
2. **Persistent OTP Attempt Storage:** OTP attempt counters are tracked per-quote in memory/session. For distributed multi-instance deployment on Render or Kubernetes, persist attempt counts in Redis with automated TTL expiry.
3. **Frontend Integration for Masked PII:** Ensure the Next.js quote viewer component (`apps/web/src/app/quote/[token]/page.tsx`) displays an OTP verification modal whenever `requiresVerification: true` and `isVerified: false` are returned from the backend.
