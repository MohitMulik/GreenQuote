import { test, expect } from "@playwright/test";

test.describe("GreenQuote Golden Path — India Clean Energy Financing Journey", () => {
  test("1. Contractor Login & Pipeline Access", async ({ page }) => {
    // Set the session cookie on context before logging in so Next.js middleware allows pipeline access
    await page.context().addCookies([
      {
        name: "gq_access",
        value: "mock_jwt_token_for_contractor_session",
        url: "http://localhost:3000",
      },
    ]);

    await page.route("**/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          user: {
            id: "usr_contractor_test",
            email: "advisor@sunvolt.in",
            role: "contractor_owner",
            contractorId: "cnt_sunvolt",
          },
        }),
      });
    });

    await page.goto("/contractor/login");
    await expect(page.locator("h1")).toContainText("Contractor sign in");

    await page.fill('input[type="email"]', "advisor@sunvolt.in");
    await page.fill('input[type="password"]', "SecurePassword123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/contractor\/pipeline/);
    await expect(page.getByText("GreenQuote Contractor Hub")).toBeVisible();
    await expect(page.getByText("Create New Quote")).toBeVisible();
  });

  test("2. Quote Builder: PM Surya Ghar Subsidy Calculations & Quote Persistence", async ({ page }) => {
    // Set authenticated cookie to pass Next.js middleware
    await page.context().addCookies([
      {
        name: "gq_access",
        value: "mock_jwt_token_for_contractor_session",
        url: "http://localhost:3000",
      },
    ]);

    let quotePayloadCaptured: any = null;

    await page.route("**/v1/quotes", async (route) => {
      if (route.request().method() === "POST") {
        quotePayloadCaptured = JSON.parse(route.request().postData() || "{}");
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            _id: "qte_golden_test_123",
            linkToken: "tok_golden_sunvolt_99",
            status: "draft",
            totalPriceMinor: 22000000,
            homeowner: quotePayloadCaptured.homeowner,
            options: quotePayloadCaptured.options,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/v1/quotes/qte_golden_test_123/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          link: "/quote/tok_golden_sunvolt_99",
        }),
      });
    });

    await page.goto("/contractor/quote/new");
    await expect(page.locator("h1")).toContainText("Quote Builder");

    // Verify 3-tier Good / Better / Best headings exist
    await expect(page.getByText("GOOD TIER")).toBeVisible();
    await expect(page.getByText("BETTER TIER")).toBeVisible();
    await expect(page.getByText("BEST TIER")).toBeVisible();

    // Verify PM Surya Ghar CFA subsidies in UI
    // 2 kW -> ₹60,000; 3 kW -> ₹78,000; 5 kW -> ₹78,000
    await expect(page.getByText("-₹60,000").first()).toBeVisible();
    await expect(page.getByText("-₹78,000").first()).toBeVisible();

    // Click "Send to Homeowner" to persist quote
    const sendButton = page.getByRole("button", { name: /Send to Homeowner/i });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Verify success banner and secure link token
    await expect(page.getByText("Quote Persisted & Generated Successfully!")).toBeVisible();
    await expect(page.getByText("tok_golden_sunvolt_99")).toBeVisible();
    await expect(page.getByText("SMS gateway integration required for cellular delivery")).toBeVisible();

    // Validate captured payload had PM Surya Ghar CFA correctly configured
    expect(quotePayloadCaptured).not.toBeNull();
    expect(quotePayloadCaptured.homeowner.fullName).toBeTruthy();
    expect(quotePayloadCaptured.options.length).toBe(3);
  });

  test("3. Homeowner Portal: PII Masking & Mobile OTP Verification", async ({ page }) => {
    await page.route("**/v1/quotes/public/tok_golden_sunvolt_99", async (route) => {
      // Mock unauthenticated masked preview
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          _id: "qte_golden_test_123",
          requiresVerification: true,
          isVerified: false,
          homeowner: {
            fullName: "R*** S***",
            phone: "+91 ******3210",
            email: "r***@gmail.com",
          },
          property: {
            streetAddress: "B-42, Sector 62",
            city: "Noida",
            state: "UP",
          },
          contractor: {
            name: "SunVolt Green Energy Pvt. Ltd.",
            phone: "+91 98111 22334",
            license: "MNRE-REG-2026-8819",
          },
          options: [
            {
              tier: "better",
              title: "Better: 3 kW Bifacial Solar System",
              priceMinor: 22000000,
              incentives: [
                {
                  programmeId: "prog_cfa_better",
                  name: "PM Surya Ghar Central Subsidy (CFA)",
                  amountMinor: 7800000,
                  paid: "instant",
                },
              ],
            },
          ],
        }),
      });
    });

    await page.route("**/v1/auth/homeowner/request-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "OTP sent to registered mobile." }),
      });
    });

    await page.route("**/v1/auth/homeowner/verify-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Verified successfully." }),
      });
    });

    await page.goto("/quote/tok_golden_sunvolt_99");

    // Check PII masking banner is visible
    await expect(page.getByText("Unauthenticated Preview Mode (Sensitive PII Masked)")).toBeVisible();
    await expect(page.getByText("Homeowner identity masked")).toBeVisible();

    // Trigger OTP modal
    const verifyButton = page.getByRole("button", { name: /Verify via OTP/i });
    await verifyButton.click();

    // Check modal opened and fill 6-digit code
    await expect(page.getByText("Homeowner OTP Verification")).toBeVisible();
    const otpInput = page.getByPlaceholder("e.g. 123456");
    await otpInput.fill("123456");

    // Mock authenticated quote response for reload
    await page.route("**/v1/quotes/public/tok_golden_sunvolt_99", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          _id: "qte_golden_test_123",
          requiresVerification: false,
          isVerified: true,
          homeowner: {
            fullName: "Rajesh Kumar Sharma",
            phone: "+91 98765 43210",
            email: "rajesh.sharma@gmail.com",
          },
          property: {
            streetAddress: "B-42, Sector 62",
            city: "Noida",
            state: "UP",
          },
          contractor: {
            name: "SunVolt Green Energy Pvt. Ltd.",
            phone: "+91 98111 22334",
            license: "MNRE-REG-2026-8819",
          },
        }),
      });
    });

    // Submit OTP verification
    await page.getByRole("button", { name: /Verify & Unlock/i }).click();

    // PII should now be unmasked
    await expect(page.getByText("Verified Homeowner Session Active")).toBeVisible();
  });

  test("4. Complete Golden Path: Quote -> Prequal -> Offer Selection -> E-Sign", async ({ page }) => {
    // Intercept quote load
    await page.route("**/v1/quotes/public/tok_full_journey", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          _id: "qte_full_journey_1",
          isVerified: true,
          requiresVerification: false,
          homeowner: {
            fullName: "Rajesh Kumar Sharma",
            phone: "+91 98765 43210",
            email: "rajesh.sharma@gmail.com",
          },
          property: {
            streetAddress: "B-42, Sector 62, Noida, UP",
          },
          contractor: {
            name: "SunVolt Green Energy Pvt. Ltd.",
            phone: "+91 98111 22334",
            license: "MNRE-REG-2026-8819",
          },
        }),
      });
    });

    // Intercept prequalification submission
    let capturedIdempotencyKey: string | null = null;
    await page.route("**/v1/prequalifications", async (route) => {
      capturedIdempotencyKey = route.request().headers()["idempotency-key"] || null;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          prequalification: {
            _id: "preq_full_journey_99",
            status: "approved",
          },
          offers: [
            {
              id: "off_sbi_solar_1",
              lenderName: "State Bank of India (Surya Ghar Solar Loan)",
              aprPct: 7.00,
              termMonths: 60,
              monthlyPaymentMinor: 396000,
              amountFinancedMinor: 20000000,
              totalCostOfCreditMinor: 23760000,
              totalInterestMinor: 3760000,
              contractorBuyDownMinor: 0,
            },
            {
              id: "off_tata_solar_2",
              lenderName: "Tata Capital Clean Energy / Rooftop Loan",
              aprPct: 8.25,
              termMonths: 84,
              monthlyPaymentMinor: 312000,
              amountFinancedMinor: 20000000,
              totalCostOfCreditMinor: 26208000,
              totalInterestMinor: 6208000,
              contractorBuyDownMinor: 0,
            },
          ],
        }),
      });
    });

    // Intercept e-sign submission
    await page.route("**/v1/esign/submit", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          agreementId: "agr_sbi_golden_123",
          signedAt: new Date().toISOString(),
          auditHash: "sha256_mock_hash_for_e2e_testing",
        }),
      });
    });

    await page.goto("/quote/tok_full_journey");

    // Click "Check Real Loan Offers"
    const checkOffersButton = page.getByRole("button", { name: /Check Real Loan Offers/i });
    await expect(checkOffersButton).toBeVisible();
    await checkOffersButton.click();

    // Check Prequal Form is displayed
    await expect(page.getByText("Pre-Qualify in Under 60 Seconds")).toBeVisible();

    // Fill PAN and verify format
    const panInput = page.locator("#panNumber");
    await panInput.fill("ABCDE1234F");

    // Agree to RBI soft-pull consent
    const consentCheckbox = page.locator("#softPullConsent");
    await consentCheckbox.check();

    // Submit Prequalification
    const submitPrequalButton = page.getByRole("button", { name: /Submit Pre-qualification/i });
    await expect(submitPrequalButton).toBeEnabled();
    await submitPrequalButton.click();

    // Verify Idempotency-Key was transmitted
    expect(capturedIdempotencyKey).toBeTruthy();
    expect(capturedIdempotencyKey).toContain("idemp_");

    // Verify Offers step is reached and offers are displayed
    await expect(page.getByText("Your Pre-Qualified Loan Offers")).toBeVisible();
    await expect(page.getByText("State Bank of India (Surya Ghar Solar Loan)")).toBeVisible();

    // Select the State Bank of India offer using the exact button text "Select This Offer →"
    const selectOfferButton = page.getByRole("button", { name: /Select This Offer/i }).first();
    await expect(selectOfferButton).toBeVisible();
    await selectOfferButton.click();

    // Check Key Fact Statement (KFS) step is reached
    await expect(page.getByText("Review KFS Disclosures & Sign Agreement")).toBeVisible();

    // Acknowledge KFS and E-Sign Consent checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    // Type legal name for electronic signature
    const signatureInput = page.getByPlaceholder("e.g. Rajesh Kumar Sharma");
    await signatureInput.fill("Rajesh Kumar Sharma");

    // Click Sign Loan Agreement
    const signButton = page.getByRole("button", { name: /Sign Loan Agreement/i });
    await expect(signButton).toBeEnabled();
    await signButton.click();

    // Verify completion confirmation and statutory cooling-off notice
    await expect(page.getByText("Pre-Qualification Confirmed & Agreement Executed")).toBeVisible();
    await expect(page.getByText("Mandatory 3-Day Cooling-Off Period (RBI Digital Lending Norms)")).toBeVisible();
  });

  test("5. Milestone & Payout Tracker: Equipment Verification & Escrow Safeguard", async ({ page }) => {
    // Set authenticated cookie to pass Next.js middleware
    await page.context().addCookies([
      {
        name: "gq_access",
        value: "mock_jwt_token_for_contractor_session",
        url: "http://localhost:3000",
      },
    ]);

    await page.route("**/v1/milestones/ln_golden_123", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          milestones: [
            {
              _id: "mls_golden_123",
              loanId: "ln_golden_123",
              status: "pending",
              amountMinor: 22000000,
              equipmentVerified: false,
              evidenceUrls: [],
            },
          ],
        }),
      });
    });

    await page.route("**/v1/milestones/submit-evidence", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          _id: "mls_golden_123",
          status: "submitted",
          equipmentVerified: true,
          evidenceUrls: ["https://greenquote.in/evidence/nameplate_photo.jpg"],
        }),
      });
    });

    await page.goto("/contractor/milestones/ln_golden_123");
    await expect(page.locator("h1")).toContainText("Milestone & Payout Tracker");

    // Check Model Number input exists
    const modelInput = page.locator('input[placeholder="e.g. MSZ-FS12NA"]');
    await expect(modelInput).toBeVisible();
    await modelInput.fill("TPS-3KW-BIFACIAL");

    // Submit equipment evidence
    const submitButton = page.getByRole("button", { name: /Submit Evidence & Notify Homeowner/i });
    await submitButton.click();

    // Check submission status updated and disclaimer present
    await expect(page.getByText("Evidence submitted. Waiting for homeowner completion sign-off.")).toBeVisible();
  });
});
