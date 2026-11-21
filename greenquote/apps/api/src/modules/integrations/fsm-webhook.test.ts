import { processFsmQuoteSync, FsmQuotePayload } from "./fsm-webhook.service.js";

describe("Field Service Management (FSM) Quote Sync (FR-310)", () => {
  const validJobberPayload: FsmQuotePayload = {
    provider: "jobber",
    contractorId: "ctr_apex_01",
    externalJobId: "job_98213",
    customer: {
      fullName: "Sarah Jenkins",
      email: "sarah@example.com",
      phone: "+16175550188",
      propertyAddress: {
        street: "42 Commonwealth Ave",
        city: "Boston",
        state: "MA",
        zip: "02108",
      },
    },
    lineItems: [
      { category: "equipment", description: "Mitsubishi Heat Pump 3-Ton", amountCents: 950000 },
      { category: "labor", description: "Mechanical & Refrigerant Installation", amountCents: 350000 },
      { category: "permits", description: "Boston Municipal HVAC & Electrical Permit", amountCents: 50000 },
      { category: "electrical", description: "200A Subpanel Disconnect", amountCents: 150000 },
    ],
    cashPriceCents: 1500000, // $15,000.00
    financedPriceCents: 1500000, // $15,000.00 (Zero dealer fee markup)
  };

  it("should successfully ingest FSM quote when cash and financed price have parity (FR-308)", () => {
    const result = processFsmQuoteSync(validJobberPayload);

    expect(result.success).toBe(true);
    expect(result.parityCompliant).toBe(true);
    expect(result.totalSystemCostCents).toBe(1500000);
    expect(result.greenQuoteId).toContain("gq_fsm_job_");
  });

  it("should strictly reject FSM quote if financed price contains dealer markup fee (FR-308)", () => {
    const invalidDealerFeePayload: FsmQuotePayload = {
      ...validJobberPayload,
      financedPriceCents: 1650000, // $1,500 dealer fee markup added by traditional lender
    };

    expect(() => processFsmQuoteSync(invalidDealerFeePayload)).toThrow(
      /FR-308 Parity Violation/
    );
  });

  it("should reject quote if line items do not balance with total cash price", () => {
    const unbalancedPayload: FsmQuotePayload = {
      ...validJobberPayload,
      cashPriceCents: 1600000,
      financedPriceCents: 1600000, // sums to 1500000, not 1600000
    };

    expect(() => processFsmQuoteSync(unbalancedPayload)).toThrow(
      /Line item amounts do not equal stated total cash price/
    );
  });
});
