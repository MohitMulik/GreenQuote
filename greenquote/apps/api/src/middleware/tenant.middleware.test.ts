import { assertSameTenant, stripCreditFields } from "./tenant.middleware.js";

describe("tenant isolation", () => {
  it("rejects cross-tenant access", () => {
    expect(() => assertSameTenant("cnt_a", "cnt_b")).toThrow("Resource is not accessible");
  });

  it("allows same-tenant access", () => {
    expect(() => assertSameTenant("cnt_a", "cnt_a")).not.toThrow();
  });

  it("strips credit and PII fields from contractor payloads", () => {
    const sanitized = stripCreditFields({
      id: "qte_1",
      creditScore: 720,
      applicant: { ssnLastFour: "9999" },
      status: "sent",
    });
    expect(sanitized).toEqual({ id: "qte_1", status: "sent" });
  });
});
