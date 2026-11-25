# GreenQuote India

> **India's Embedded Point-of-Sale Lending & PM Surya Ghar Subsidy Infrastructure for Clean Energy & Rooftop Solar.**

GreenQuote enables MNRE-empanelled rooftop solar installers and clean-energy contractors to present transparent 3-tier Good / Better / Best quotes in Indian Rupees (₹), integrate automated PM Surya Ghar central & state DBT subsidies, perform instant multi-bank CIBIL soft-pulls (SBI, Tata Capital, IREDA), and execute loan contracts with RBI-mandated Key Fact Statement (KFS) disclosures and Aadhaar OTP e-Sign.

---

## Key Highlights

- **Currency & Pricing:** 100% Indian Rupees (`₹`), integer paise precision, zero hidden dealer fees, and strict cash/financed price parity.
- **PM Surya Ghar Muft Bijli Yojana:** Instant upfront netting of central DBT subsidy (₹60,000 to ₹78,000) directly on the customer invoice.
- **Certified Equipment:** Catalog integration with MNRE ALMM Approved List of Models and Manufacturers (Waaree, Tata Power Solar, Adani Solar, Havells).
- **Multi-Bank CIBIL Soft-Pull:** Pre-qualification across top Indian clean-energy lenders (State Bank of India, Tata Capital, IREDA) with **0 impact** to CIBIL score.
- **Regulatory Compliance:** Strict compliance with RBI Digital Lending Directions (2022/2024), Key Fact Statement (KFS), 3-day cooling-off period, and Information Technology Act 2000 (Aadhaar e-Sign).
- **Milestone Settlements:** Bank disbursements released upon DISCOM net-meter synchronization and CEIG inspection approval via RTGS/NEFT with IFSC verification.

---

## Architecture

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js 20+ & Express.js REST API, Modular Architecture, Zod validation
- **Database**: MongoDB Atlas (Mongoose, CSFLE / field-level AES-256-GCM encryption)
- **Jobs**: Agenda (MongoDB-backed background workers)
- **Shared Core Engine**: Minor-unit actuarial financial engine, EMI amortization, Zod schemas (`@greenquote/shared`)

---

## Repository Structure

```
greenquote/
├── apps/
│   ├── web/           # Next.js 14 web app: Homeowner quote, Installer pipeline, Lender portal, Admin console
│   ├── api/           # Express REST API: Auth, Quotes, Prequal, Offers, KFS, Milestones, AI OCR
│   └── worker/        # Agenda jobs, background queue processing
├── packages/
│   ├── shared/        # Actuarial EMI engine, minor-unit formatting (₹), Zod validation schemas
│   └── ui/            # Reusable React components & Tailwind tokens
├── docs/              # Architecture, API docs, regulatory compliance checklists
└── scripts/           # Deployment & database seed automation
```

---

## Getting Started

```bash
# Install dependencies across all monorepo workspaces
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Build shared package
npm run build --workspace=@greenquote/shared

# Seed realistic sample data (SunVolt Green Energy, PM Surya Ghar quotes, SBI/Tata Capital offers)
npm run seed --workspace=@greenquote/api

# Start development servers
npm run dev:api    # API server on http://localhost:4000
npm run dev:web    # Next.js web application on http://localhost:3000
```

---

## User Roles

| Role | Description |
|------|-------------|
| **Installer Owner** | Manages solar business, team credentials, MNRE empanelment & GSTIN verification |
| **Solar Advisor / Consultant** | Creates 3-tier Good/Better/Best solar quotes, presents live to homeowners in ₹ |
| **Homeowner** | Views quotes, simulates down payment, checks CIBIL rates without score impact, e-signs KFS via Aadhaar |
| **Lender Partner (Banks & NBFCs)** | Manages credit parameters, reviews CIBIL credit box, disburses draw milestones (SBI, Tata Capital, IREDA) |
| **Platform Operations** | Platform compliance, dual-authorization lender parameter governance, KYC/KYB audits |

---

## License

Proprietary — All rights reserved.
