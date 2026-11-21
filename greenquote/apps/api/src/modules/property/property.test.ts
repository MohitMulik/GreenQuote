import { verifyPropertyOwnership } from "./property.service.js";

describe("Public Property Assessor & Title Verification (FR-504)", () => {
  it("should confirm ownership when applicant matches recorded deed title", () => {
    const result = verifyPropertyOwnership({
      applicantName: "Sarah Jenkins",
      propertyAddress: {
        street: "42 Commonwealth Ave",
        city: "Boston",
        state: "MA",
        zip: "02108",
      },
    });

    expect(result.verified).toBe(true);
    expect(result.matchStatus).toBe("MATCH_CONFIRMED");
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0.9);
    expect(result.hasUnresolvedLiens).toBe(false);
  });

  it("should detect co-owners or trust holdings", () => {
    const result = verifyPropertyOwnership({
      applicantName: "Robert Smith",
      propertyAddress: {
        street: "100 Beacon St",
        city: "Boston",
        state: "MA",
        zip: "02116",
      },
    });

    expect(result.verified).toBe(true);
    expect(result.matchStatus).toBe("CO_OWNER_DETECTED");
    expect(result.ownershipType).toBe("trust");
  });

  it("should flag mismatch when applicant does not own the property", () => {
    const result = verifyPropertyOwnership({
      applicantName: "Unknown Tenant",
      propertyAddress: {
        street: "99 State St",
        city: "Boston",
        state: "MA",
        zip: "02109",
      },
    });

    expect(result.verified).toBe(false);
    expect(result.matchStatus).toBe("NAME_MISMATCH");
    expect(result.confidenceScore).toBeLessThan(0.5);
    expect(result.advisoryNotes).toContain(
      "Manual title verification review required before loan underwriting"
    );
  });
});
