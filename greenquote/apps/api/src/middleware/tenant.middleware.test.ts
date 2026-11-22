import { assertSameTenant, stripCreditFields, requireContractorTenant } from "./tenant.middleware.js";
import { Request, Response } from "express";

describe("tenant isolation", () => {
  it("rejects cross-tenant access", () => {
    expect(() => assertSameTenant("cnt_a", "cnt_b")).toThrow("Resource is not accessible");
  });

  it("allows same-tenant access", () => {
    expect(() => assertSameTenant("cnt_a", "cnt_a")).not.toThrow();
  });

  it("throws if resource contractor ID is undefined or missing", () => {
    expect(() => assertSameTenant(undefined, "cnt_a")).toThrow("Resource is not accessible");
  });

  it("requireContractorTenant rejects request without contractor tenant context with 403", () => {
    const req = { user: { role: "homeowner", userId: "usr_1" } } as unknown as Request;
    let statusCode = 0;
    let jsonBody: unknown = null;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: unknown) => {
            jsonBody = body;
          },
        };
      },
    } as unknown as Response;
    const next = jest.fn();

    requireContractorTenant(req, res, next);

    expect(statusCode).toBe(403);
    expect(jsonBody).toEqual({
      code: "TENANT_REQUIRED",
      message: "This action requires a contractor organization context.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("requireContractorTenant populates req.tenantId and calls next() when contractorId is present", () => {
    const req = { user: { role: "contractor_advisor", userId: "adv_1", contractorId: "cnt_99" } } as unknown as Request;
    const res = {} as unknown as Response;
    const next = jest.fn();

    requireContractorTenant(req, res, next);

    expect(req.tenantId).toBe("cnt_99");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("strips credit and PII fields from contractor payloads", () => {
    const sanitized = stripCreditFields({
      id: "qte_1",
      creditScore: 720,
      applicant: { ssnLastFour: "9999" },
      ssnLastFour: "1234",
      ssnLastFourEncrypted: "enc_blob",
      dateOfBirth: "1980-01-01",
      dateOfBirthEncrypted: "enc_blob_dob",
      annualIncomeMinor: 12000000,
      annualIncomeEncrypted: "enc_blob_inc",
      status: "sent",
      contractorId: "cnt_1",
    });
    expect(sanitized).toEqual({
      id: "qte_1",
      status: "sent",
      contractorId: "cnt_1",
    });
  });
});
