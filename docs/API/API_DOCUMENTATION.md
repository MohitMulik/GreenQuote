# GreenQuote — REST API Specification
## Version 1.0 — OpenAPI/REST Standards

**Base URL:** `https://api.greenquote.io/v1` (Production) / `http://localhost:4000/v1` (Development)  
**Authentication Schemes:**
- **Contractor / Lender / Operations:** `Bearer <JWT_TOKEN>` or `httpOnly` secure session cookie.
- **Homeowner Portal:** Signed token link + OTP authentication.
- **Partner / External API:** OAuth 2.0 Client Credentials (`X-Api-Key` / Client Secret).

---

## 1. Global Standards & Error Format

### 1.1 Headers
- `Content-Type: application/json`
- `Idempotency-Key: <UUIDv4>` (Required on all financial mutations: `POST /v1/prequalifications`, `POST /v1/offers/:id/select`, `POST /v1/milestones/:id/confirm`)
- `X-Request-Id: <UUIDv4>` (Automatically attached to all requests and responses)

### 1.2 Unified Error Response
```json
{
  "code": "VALIDATION_FAILED",
  "message": "The request body failed schema validation.",
  "requestId": "req_98b7a6c5",
  "timestamp": "2026-11-21T10:00:00.000Z",
  "details": [
    {
      "field": "priceMinor",
      "issue": "Cash price and financed price must be identical."
    }
  ]
}
```

---

## 2. API Endpoint Directory

### 2.1 Authentication & RBAC (`/v1/auth`)

#### `POST /v1/auth/register`
Create a new contractor business and owner account.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "legalName": "Apex HVAC & Clean Energy LLC",
    "ein": "12-3456789",
    "businessAddress": {
      "street": "100 Green St",
      "city": "Boston",
      "state": "MA",
      "zipCode": "02108"
    },
    "owner": {
      "fullName": "Robert Vance",
      "email": "robert@apexhvac.com",
      "phone": "+16175550199",
      "password": "SecurePassword123!"
    }
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "contractorId": "cnt_87a9b2",
    "userId": "usr_11c3d4",
    "mfaRequired": true,
    "mfaSetupUrl": "otpauth://totp/GreenQuote:robert@apexhvac.com?secret=JBSWY3DPEHPK3PXP"
  }
  ```

#### `POST /v1/auth/login`
Authenticate email and password. Returns challenge if MFA enabled.
- **Response `200 OK`:** Returns access token cookie + user role.

#### `POST /v1/auth/mfa/verify`
Verify 6-digit TOTP code and issue active JWT session.

#### `POST /v1/auth/homeowner/verify-otp`
Verify SMS OTP code to view secured quote.
- **Request:** `{ "token": "qtoken_abc123", "otp": "489201" }`
- **Response `200 OK`:** Session token granting access to specific quote.

---

### 2.2 Contractor Management (`/v1/contractors`)

#### `GET /v1/contractors/profile`
Retrieve authenticated contractor profile, verification status, and license records.
- **Access:** Contractor Owner, Contractor Advisor

#### `POST /v1/contractors/payout-account`
Link contractor bank payout account (FR-204).
- **Access:** Contractor Owner
- **Request:**
  ```json
  {
    "accountToken": "plaid_tok_9921",
    "accountHolderName": "Apex HVAC & Clean Energy LLC"
  }
  ```

#### `POST /v1/contractors/team/invite`
Invite a new Comfort Advisor to the contractor team.
- **Access:** Contractor Owner

---

### 2.3 Equipment & AHRI Catalog (`/v1/equipment`)

#### `GET /v1/equipment/search`
Search-as-you-type certified equipment directory with sub-500ms latency (FR-303).
- **Query Params:** `q=mitsubishi&category=heat_pump&limit=10`
- **Response `200 OK`:**
  ```json
  {
    "results": [
      {
        "id": "eqp_4492a",
        "brand": "Mitsubishi Electric",
        "modelNumber": "MSZ-FS12NA",
        "category": "heat_pump",
        "ratings": {
          "seer2": 26.1,
          "hspf2": 11.5,
          "coolingCapacityBtu": 12000
        },
        "isColdClimate": true,
        "isEnergyStar": true,
        "ahriRefNumber": "20893412"
      }
    ]
  }
  ```

---

### 2.4 Incentive Engine (`/v1/incentives`)

#### `GET /v1/incentives/calculate`
Calculate eligible rebates based on location, equipment, and income (FR-402).
- **Query Params:** `zip=02108&equipmentId=eqp_4492a&householdIncomeMinor=8500000`
- **Response `200 OK`:**
  ```json
  {
    "totalRebatesMinor": 200000,
    "items": [
      {
        "programmeId": "inc_mass_save",
        "name": "Mass Save Heat Pump Incentive",
        "amountMinor": 200000,
        "paymentTiming": "instant",
        "conditions": "Must replace whole-home oil or electric resistance heating."
      }
    ]
  }
  ```

---

### 2.5 Quote Management (`/v1/quotes`)

#### `POST /v1/quotes`
Create a 3-tier Good / Better / Best quotation.
- **Access:** Contractor Owner, Contractor Advisor
- **Request Body:**
  ```json
  {
    "homeowner": {
      "fullName": "Sarah Jenkins",
      "phone": "+16175550188",
      "email": "sarah@example.com"
    },
    "property": {
      "streetAddress": "42 Commonwealth Ave",
      "city": "Boston",
      "state": "MA",
      "zipCode": "02108",
      "existingHeatingFuel": "natural_gas"
    },
    "currency": "USD",
    "options": [
      {
        "tier": "better",
        "title": "Cold-Climate Heat Pump System",
        "priceMinor": 1200000,
        "lineItems": [
          { "type": "equipment", "label": "Mitsubishi Heat Pump", "amountMinor": 800000, "equipmentId": "eqp_4492a" },
          { "type": "labour", "label": "Certified Installation", "amountMinor": 350000 },
          { "type": "permits", "label": "Municipal Permits", "amountMinor": 50000 }
        ]
      }
    ]
  }
  ```

#### `POST /v1/quotes/:id/send`
Send quote access link to homeowner via SMS / Email.

---

### 2.6 Pre-qualification & Offer Marketplace (`/v1/prequalifications`)

#### `POST /v1/prequalifications`
Submit soft-inquiry pre-qualification application with consent (FR-502, FR-503).
- **Access:** Homeowner (authenticated via quote session)
- **Header:** `Idempotency-Key: <UUID>`
- **Request Body:**
  ```json
  {
    "quoteId": "qte_882a1b",
    "selectedTier": "better",
    "downPaymentMinor": 200000,
    "applicant": {
      "dateOfBirth": "1982-05-14",
      "annualIncomeMinor": 11000000,
      "housingPaymentMinor": 220000,
      "ssnLastFour": "8921"
    },
    "consent": {
      "softPullAgreed": true,
      "tcpaAgreed": true,
      "consentVersion": "2026-v1"
    }
  }
  ```

#### `GET /v1/prequalifications/:id/offers`
Server-Sent Events (SSE) endpoint streaming real-time lender offer responses.
- **Events:**
  - `event: offer` — JSON payload of single normalized lender offer.
  - `event: error` — Non-blocking notification of individual lender timeout.
  - `event: complete` — All lenders completed or 20s timeout reached.

---

### 2.7 Loan Application & E-Signature (`/v1/applications`)

#### `POST /v1/applications/:offerId/sign`
Capture homeowner e-signature on TILA Reg Z disclosure and loan note (FR-703, FR-704).
- **Request Body:**
  ```json
  {
    "signatureDataUrl": "data:image/png;base64,...",
    "esignConsentAgreed": true,
    "tilaAcknowledged": true
  }
  ```

---

### 2.8 Milestones & Payouts (`/v1/milestones`)

#### `POST /v1/milestones/:id/submit-completion`
Contractor uploads installation photos and equipment serial numbers.
- **Access:** Contractor

#### `POST /v1/milestones/:id/confirm-homeowner`
Homeowner one-tap confirmation of completed install (FR-803). Mandatory to unlock payout.
- **Access:** Homeowner

---

### 2.9 Operations Console (`/v1/admin`)

#### `GET /v1/admin/review-queue`
Retrieve pending verification items (Contractors, Fraud Flags, Model Mismatches).

#### `GET /v1/admin/audit-log`
Search immutable audit events with instant export to CSV/JSON (FR-1004).
