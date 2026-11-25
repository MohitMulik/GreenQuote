"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  UploadCloud,
  FileCheck,
  ArrowLeft,
  AlertTriangle,
  Building2,
  DollarSign,
  Camera,
} from "lucide-react";
import { formatCurrency } from "@greenquote/shared";

export default function ContractorMilestonePage({
  params,
}: {
  params: { loanId: string };
}) {
  const [activeTab, setActiveTab] = useState<"milestones" | "evidence" | "payout">("milestones");

  // Sample Loan & Milestone State (FR-801, FR-802)
  const [loan, setLoan] = useState({
    id: params.loanId || "ln_89410",
    homeowner: "Rajesh Kumar Sharma",
    phone: "+91 98765 43210",
    address: "B-42, Sector 62, Noida, Uttar Pradesh 201309",
    lender: "State Bank of India (Surya Ghar Solar Loan)",
    totalAmountMinor: 22000000, // ₹2,20,000.00
    currency: "INR" as const,
    quotedEquipment: "Tata Power Solar 3 kW Dual-Glass Bifacial System (TPS-3KW-BIFACIAL)",
  });

  const [milestone, setMilestone] = useState({
    id: "mls_001",
    type: "final_completion",
    title: "Final Installation, DISCOM Net-Metering & MNRE ALMM Verification",
    amountMinor: 22000000,
    status: "pending" as "pending" | "submitted" | "confirmed_by_homeowner" | "payout_released",
    installedModelNumber: "TPS-3KW-BIFACIAL",
    serialNumber: "SN-2026-981249",
    permitNumber: "UP-DISCOM-NET-2026-9182",
    evidenceUploaded: false,
    equipmentVerified: false,
    mismatchWarning: false,
  });

  const handleEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isModelMatch =
      milestone.installedModelNumber.trim().toUpperCase() === "TPS-3KW-BIFACIAL";

    if (isModelMatch) {
      setMilestone((prev) => ({
        ...prev,
        status: "submitted",
        evidenceUploaded: true,
        equipmentVerified: true,
        mismatchWarning: false,
      }));
    } else {
      setMilestone((prev) => ({
        ...prev,
        evidenceUploaded: true,
        equipmentVerified: false,
        mismatchWarning: true,
      }));
    }
  };

  const simulateHomeownerSignoff = () => {
    setMilestone((prev) => ({
      ...prev,
      status: "confirmed_by_homeowner",
    }));
    setTimeout(() => {
      setMilestone((prev) => ({
        ...prev,
        status: "payout_released",
      }));
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 min-h-16 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/contractor/pipeline"
              className="text-slate-500 hover:text-slate-800 text-xs sm:text-sm flex items-center gap-1 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" /> Pipeline
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h1 className="text-sm sm:text-xl font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                <FileCheck className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-600 shrink-0" />
                <span>Milestone & Payout Tracker</span>
              </h1>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                Loan ID: {loan.id} · Customer: {loan.homeowner} · Lender: {loan.lender}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 font-semibold rounded-full border whitespace-nowrap ${
                milestone.status === "payout_released"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : milestone.status === "confirmed_by_homeowner"
                  ? "bg-blue-50 text-blue-700 border-blue-300"
                  : milestone.status === "submitted"
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-slate-100 text-slate-600 border-slate-300"
              }`}
            >
              Status: {milestone.status.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Deal Summary Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Financed Installation Amount</span>
            <span className="text-2xl font-black text-slate-900">
              {formatCurrency(loan.totalAmountMinor, loan.currency)}
            </span>
            <span className="text-xs text-emerald-600 font-medium block mt-1">
              Zero Dealer Fee Parity (FR-308)
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Quoted Equipment (AHRI Verified)</span>
            <span className="text-sm font-bold text-slate-900 block mt-1">
              {loan.quotedEquipment}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">AHRI Ref #20893412 · Cold-Climate</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Job Site Address</span>
            <span className="text-sm font-semibold text-slate-800 block mt-1">{loan.address}</span>
            <span className="text-xs text-slate-500 block mt-0.5">{loan.phone}</span>
          </div>
        </div>

        {/* Milestone Steps Timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" /> Milestone Progression (FR-801)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase block">1. Agreement Executed</span>
              <p className="text-xs text-slate-600 mt-1">RBI Key Fact Statement (KFS) acknowledged & signed.</p>
              <span className="text-xs text-emerald-700 font-semibold mt-2 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                milestone.evidenceUploaded
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <span className="text-xs font-bold uppercase block text-slate-900">
                2. Evidence Upload
              </span>
              <p className="text-xs text-slate-600 mt-1">Photos, serials & DISCOM inspection report submitted.</p>
              {milestone.evidenceUploaded ? (
                <span className="text-xs text-emerald-700 font-semibold mt-2 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                </span>
              ) : (
                <span className="text-xs text-blue-700 font-semibold mt-2 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Action Required
                </span>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border ${
                milestone.status === "confirmed_by_homeowner" || milestone.status === "payout_released"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <span className="text-xs font-bold uppercase block">3. Homeowner Sign-off</span>
              <p className="text-xs text-slate-500 mt-1">Consumer confirms job completion.</p>
              {milestone.status === "confirmed_by_homeowner" || milestone.status === "payout_released" ? (
                <span className="text-xs text-emerald-700 font-semibold mt-2 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                </span>
              ) : (
                <span className="text-xs text-slate-400 mt-2 block">Pending Sign-off</span>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border ${
                milestone.status === "payout_released"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <span className="text-xs font-bold uppercase block">4. Payout Disbursement</span>
              <p className="text-xs text-slate-500 mt-1">Lender ACH dispatched to contractor bank.</p>
              {milestone.status === "payout_released" ? (
                <span className="text-xs text-emerald-700 font-semibold mt-2 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                </span>
              ) : (
                <span className="text-xs text-slate-400 mt-2 block">Pending Release</span>
              )}
            </div>
          </div>
        </div>

        {/* Evidence Submission Form (FR-802) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
            <Camera className="w-5 h-5 text-emerald-600" /> Upload Installed Equipment Evidence (FR-802)
          </h2>
          <p className="text-xs text-slate-600 mb-6">
            In compliance with clean energy lender covenants, provide actual installed serial numbers and nameplate photos to authorize payout release.
          </p>

          {milestone.mismatchWarning && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Equipment Model Mismatch Detected (AI-04 / FR-1001)</h4>
                <p className="text-xs mt-1">
                  The installed model entered does not match the MNRE ALMM-certified equipment specified in the customer loan agreement ({loan.quotedEquipment}). This installation has been placed on hold and flagged for Operations review.
                </p>
              </div>
            </div>
          )}

          {milestone.status === "payout_released" ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Full Payout Released by Lender!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                RTGS transfer of <strong>{formatCurrency(loan.totalAmountMinor, loan.currency)}</strong> was initiated to SunVolt Green Energy Pvt. Ltd. Current Account ending in ****9921 (IFSC: SBIN0004052).
              </p>
            </div>
          ) : (
            <form onSubmit={handleEvidenceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Installed Outdoor Unit Model Number
                  </label>
                  <input
                    type="text"
                    required
                    value={milestone.installedModelNumber}
                    onChange={(e) =>
                      setMilestone({ ...milestone, installedModelNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. MSZ-FS12NA"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must match quote: MSZ-FS12NA
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Equipment Serial Number
                  </label>
                  <input
                    type="text"
                    required
                    value={milestone.serialNumber}
                    onChange={(e) =>
                      setMilestone({ ...milestone, serialNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. SN-2026-981249"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Municipal Electrical/Mechanical Permit Number
                  </label>
                  <input
                    type="text"
                    required
                    value={milestone.permitNumber}
                    onChange={(e) =>
                      setMilestone({ ...milestone, permitNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. BOS-MECH-2026-881"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nameplate / Equipment Photo
                  </label>
                  <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-mono">nameplate_mitsubishi_outdoor.jpg</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                {milestone.status === "submitted" ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-amber-700 font-medium">
                      Evidence submitted. Waiting for homeowner completion sign-off.
                    </span>
                    <button
                      type="button"
                      onClick={simulateHomeownerSignoff}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow"
                    >
                      Simulate Homeowner Sign-off & Payout
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow"
                  >
                    <UploadCloud className="w-4 h-4" /> Submit Evidence & Notify Homeowner
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
