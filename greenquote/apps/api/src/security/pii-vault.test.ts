import { decryptPii, encryptPii, hashIdentifier, maskLastFour } from "./pii-vault.js";

describe("PII vault (CSFLE pattern)", () => {
  it("round-trips sensitive fields", () => {
    const ssn = "1234";
    const cipher = encryptPii(ssn);
    expect(cipher.startsWith("csfle:")).toBe(true);
    expect(cipher).not.toContain("1234");
    expect(decryptPii(cipher)).toBe(ssn);
  });

  it("masks identifiers for contractor-facing views", () => {
    expect(maskLastFour("19850612")).toBe("****0612");
  });

  it("hashes lookup keys deterministically", () => {
    expect(hashIdentifier("Owner@Apex.com")).toBe(hashIdentifier("owner@apex.com"));
  });
});
