# GreenQuote

> Home Energy-Efficiency Green Loan Marketplace: heat pump and solar financing built into the HVAC contractor's quote, with instant soft-pull pre-qualification.

## Architecture

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js + Express.js, TypeScript, Zod validation
- **Database**: MongoDB Atlas (Mongoose, field-level encryption)
- **Jobs**: Agenda (MongoDB-backed)
- **AI**: TypeScript rules (P0), hosted LLM for OCR, ONNX Runtime (P1)

## Repository Structure

```
greenquote/
├── apps/
│   ├── web/           # Next.js app: contractor, homeowner, operations
│   ├── api/           # Express API: modular monolith
│   └── worker/        # Agenda jobs, background processing
├── packages/
│   ├── shared/        # Types, Zod schemas, money/EMI utilities
│   └── ui/            # Reusable React components
├── docs/              # Architecture, API docs, security
├── infra/             # Terraform, Docker
└── tests/             # Integration, E2E, performance tests
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start development
npm run dev:api    # API server on :4000
npm run dev:web    # Next.js on :3000
```

## User Roles

| Role | Description |
|------|-------------|
| Contractor Owner | Manages business, team, sees all quotes |
| Contractor Advisor | Creates quotes, presents to homeowners |
| Homeowner | Views quotes, pre-qualifies, signs loans |
| Lender User | Manages credit products, reviews applications |
| GreenQuote Operations | Platform admin, compliance, fraud review |

## Key Features (MVP / P0)

1. **Quote Builder** — Good / Better / Best with equipment, rebates, example payments
2. **AI Quote Import** — Upload PDF/photo, AI extracts line items and equipment
3. **Equipment Verification** — AHRI-matched efficiency ratings
4. **Incentive Engine** — State, utility, income-qualified rebates by ZIP
5. **Pre-qualification** — One soft-pull form, parallel lender requests
6. **Offer Comparison** — Sorted by total loan cost, transparent pricing
7. **E-Signature** — TILA disclosure, E-SIGN consent, signed document storage
8. **Milestone Funding** — Homeowner confirms completion before payout
9. **Operations Console** — Contractor review, lender config, audit log

## Documentation

- [Implementation Plan](docs/implementation/IMPLEMENTATION_PLAN.md)
- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Database Schema](docs/database/DATABASE_SCHEMA.md)
- [API Documentation](docs/API/API_DOCUMENTATION.md)
- [Security Checklist](docs/security/SECURITY_CHECKLIST.md)
- [Requirements Traceability](docs/implementation/REQUIREMENTS_TRACEABILITY.md)

## License

Proprietary — All rights reserved.
