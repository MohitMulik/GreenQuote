"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Upload,
  Lock,
} from "lucide-react";

export default function ContractorOnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Business Profile
  const [business, setBusiness] = useState({
    legalName: "Apex Clean Energy & HVAC LLC",
    tradeName: "Apex Comfort Systems",
    ein: "12-3456789",
    street: "500 Innovation Way",
    city: "Boston",
    state: "MA",
    zipCode: "02108",
    categories: ["heat_pump", "solar"],
  });

  // Step 2: License & Insurance
  const [compliance, setCompliance] = useState({
    licenseNumber: "MA-CS-109283",
    licenseExpiry: "2027-12-31",
    insuranceCarrier: "Liberty Mutual Commercial",
    policyNumber: "POL-8839210",
    coverageMinor: 200000000, // $2,000,000
    insuranceExpiry: "2027-06-30",
  });

  // Step 3: Payout Account
  const [bank, setBank] = useState({
    bankName: "Silicon Valley Bank / First Citizens",
    accountHolder: "Apex Clean Energy & HVAC LLC",
    routingNumber: "121000358",
    accountNumberLastFour: "9921",
    verified: true,
  });

  // Step 4: Agreement
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" /> FinTech Contractor KYB Verification (FR-200)
          </div>
          <h1 className="text-3xl font-extrabold text-slate-950">Contractor Partner Registration</h1>
          <p className="mt-2 text-sm text-slate-600">
            GreenQuote connects licensed heat pump & solar installers directly with partner clean-energy lenders.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="grid grid-cols-4 gap-2 mb-8 text-center text-xs font-semibold">
          <div className={`p-2 rounded-lg border ${step >= 1 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-400"}`}>
            1. Business Profile
          </div>
          <div className={`p-2 rounded-lg border ${step >= 2 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-400"}`}>
            2. Compliance Docs
          </div>
          <div className={`p-2 rounded-lg border ${step >= 3 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-400"}`}>
            3. Payout Bank
          </div>
          <div className={`p-2 rounded-lg border ${step >= 4 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-400"}`}>
            4. Agreement
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" /> Business Details & Tax ID (FR-201)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Business Name</label>
                  <input
                    type="text"
                    value={business.legalName}
                    onChange={(e) => setBusiness({ ...business, legalName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">DBA / Trade Name</label>
                  <input
                    type="text"
                    value={business.tradeName}
                    onChange={(e) => setBusiness({ ...business, tradeName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employer Identification Number (EIN)</label>
                  <input
                    type="text"
                    value={business.ein}
                    onChange={(e) => setBusiness({ ...business, ein: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Street Address</label>
                  <input
                    type="text"
                    value={business.street}
                    onChange={(e) => setBusiness({ ...business, street: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow"
                >
                  Continue to Compliance <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" /> License & General Liability Insurance (FR-203)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State License Number</label>
                  <input
                    type="text"
                    value={compliance.licenseNumber}
                    onChange={(e) => setCompliance({ ...compliance, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    value={compliance.licenseExpiry}
                    onChange={(e) => setCompliance({ ...compliance, licenseExpiry: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">General Liability Insurer</label>
                  <input
                    type="text"
                    value={compliance.insuranceCarrier}
                    onChange={(e) => setCompliance({ ...compliance, insuranceCarrier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Expiry Date</label>
                  <input
                    type="date"
                    value={compliance.insuranceExpiry}
                    onChange={(e) => setCompliance({ ...compliance, insuranceExpiry: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow"
                >
                  Continue to Banking <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Payout Bank Account Verification (FR-204)
              </h2>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{bank.bankName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Account ending in ****{bank.accountNumberLastFour} | Routing: {bank.routingNumber}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Instant Verified
                </span>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow"
                >
                  Review Agreement <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" /> Platform Agreement & Compliance Disclosure (FR-205)
              </h2>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 max-h-48 overflow-y-auto space-y-2 leading-relaxed">
                <p className="font-semibold text-slate-900">GreenQuote Marketplace Contractor Agreement (v2026.1):</p>
                <p>1. Cash Price Parity (FR-308): Contractor agrees that the cash price and financed price quoted to the consumer must remain identical. No dealer markups, surcharge adjustments, or inflated equipment costs are permitted for financed sales.</p>
                <p>2. Rate Buy-Down Cap (FR-603): Optional promotional interest rate buy-downs are capped at 5% of amount financed and will be transparently disclosed to the homeowner.</p>
                <p>3. Payout Release Governance (FR-803): Contractor acknowledges that loan disbursement is released upon homeowner completion sign-off and serial number verification.</p>
              </div>

              <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 font-medium">
                  I am an authorized officer of <strong>{business.legalName}</strong>. I accept the platform terms, cash price parity rules, and authorize GreenQuote to perform KYB business verification.
                </span>
              </label>

              {submitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="font-bold text-slate-900 text-sm">Application Submitted for Operational Review!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Your KYB verification is in queue. Our operations team reviews license and insurance credentials within 4 business hours.
                  </p>
                  <Link
                    href="/contractor/pipeline"
                    className="inline-block mt-2 px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                  >
                    Go to Contractor Dashboard
                  </Link>
                </div>
              ) : (
                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!agreementAccepted}
                    onClick={() => setSubmitted(true)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow disabled:opacity-50"
                  >
                    Submit KYB Application
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
