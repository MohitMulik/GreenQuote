"use client";

import { useState, useEffect } from "react";
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
  Camera,
  Loader2,
  Info,
} from "lucide-react";
import { formatCurrency } from "@greenquote/shared";
import { apiFetch } from "@/lib/api";

export default function ContractorMilestonePage({
  params,
}: {
  params: { loanId: string };
}) {
  const [activeTab, setActiveTab] = useState<"milestones" | "evidence" | "payout">("milestones");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

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
    status: "pending" as "pending" | "submitted" | "confirmed_by_homeowner" | "payout_released" | "held",
    installedModelNumber: "TPS-3KW-BIFACIAL",
    serialNumber: "SN-2026-981249",
    permitNumber: "UP-DISCOM-NET-2026-9182",
    evidenceUploaded: false,
    equipmentVerified: false,
    mismatchWarning: false,
  });

  useEffect(() => {
    async function loadMilestones() {
      setIsLoading(true);
      try {
        const res = await apiFetch(`/v1/milestones/${params.loanId}`);
        if (res.ok) {
          const resData = await res.json();
          if (resData && resData.milestones && resData.milestones.length > 0) {
            const m = resData.milestones[0];
            setMilestone((prev) => ({
              ...prev,
              id: m._id || prev.id,
              amountMinor: m.amountMinor || prev.amountMinor,
              status: (m.status as typeof prev.status) || prev.status,
              evidenceUploaded: (m.evidenceUrls && m.evidenceUrls.length > 0) || m.status !== "pending",
              equipmentVerified: !!m.equipmentVerified,
            }));
            setIsDemoMode(false);
          } else {
            setIsDemoMode(true);
          }
        } else {
          setIsDemoMode(true);
        }
      } catch (err: any) {
        // If unauthenticated or 404, fallback to demo mode gracefully
        setIsDemoMode(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (params.loanId) {
      loadMilestones();
    } else {
      setIsLoading(false);
      setIsDemoMode(true);
    }
  }, [params.loanId]);

  const handleEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    const isModelMatch =
      milestone.installedModelNumber.trim().toUpperCase() === "TPS-3KW-BIFACIAL";

    try {
      const res = await apiFetch("/v1/milestones/submit-evidence", {
        method: "POST",
        body: JSON.stringify({
          milestoneId: milestone.id,
          evidenceUrls: ["https://greenquote.in/evidence/nameplate_photo.jpg"],
          installedModelNumber: milestone.installedModelNumber,
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        setMilestone((prev) => ({
          ...prev,
          status: (resData.status as typeof prev.status) || "submitted",
          evidenceUploaded: true,
          equipmentVerified: resData.equipmentVerified ?? isModelMatch,
          mismatchWarning: !resData.equipmentVerified,
        }));
      } else {
        throw new Error("Backend milestone submission returned status " + res.status);
      }
    } catch (err: any) {
      // If endpoint requires contractor authentication or specific milestone ID, update UI with clear feedback
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
      if (!isDemoMode) {
        setApiError(err.message || "Failed to submit evidence to backend. Demonstration mode active.");
      }
    } finally {
      setIsSubmitting(false);
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
        {/* Demo Mode or Loading Banner */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-3 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>Fetching loan and milestone records from GreenQuote API...</span>
          </div>
        )}

        {isDemoMode && !isLoading && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Demonstration Milestone Environment</span>
              <p className="mt-0.5 text-amber-800">
                Displaying sample loan record for {loan.id}. Live production milestones require an authenticated contractor session with corresponding lender disbursement covenants.
              </p>
            </div>
          </div>
        )}

        {apiError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

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
              <h3 className="text-lg font-bold text-slate-900">Milestone Approved & Payout Released</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Disbursement authorization recorded for <strong>{formatCurrency(loan.totalAmountMinor, loan.currency)}</strong> to SunVolt Green Energy Pvt. Ltd. Current Account ending in ****9921 (IFSC: SBIN0004052).
              </p>
              <div className="mt-3 p-2 bg-emerald-100/60 rounded-lg text-[11px] text-emerald-800 max-w-md mx-auto flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Simulated Escrow: Real bank RTGS/NEFT execution requires live Lender CBS API integration.</span>
              </div>
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
