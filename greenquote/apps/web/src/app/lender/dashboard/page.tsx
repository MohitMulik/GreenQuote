"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sliders,
  DollarSign,
  FileCheck,
  ChevronRight,
  Lock,
  Landmark,
  Download,
} from "lucide-react";
import { formatCurrency } from "@greenquote/shared";

interface RateTier {
  id: string;
  termMonths: number;
  aprPct: number;
  minFico: number;
  maxDtiPct: number;
  maxLoanAmount: number;
  buyDownAllowed: boolean;
  status: "active" | "pending_peer_approval";
}

interface MilestonePayout {
  loanId: string;
  homeownerName: string;
  contractorName: string;
  systemType: string;
  milestoneName: string;
  disbursementAmountCents: number;
  coolingOffStatus: "ACTIVE" | "EXPIRED";
  daysRemaining: number;
  homeownerConfirmed: boolean;
  permitUploaded: boolean;
  status: "pending_lender_review" | "funded" | "blocked_by_rescission";
}

export default function LenderDashboardPage() {
  const [selectedLender, setSelectedLender] = useState<string>("lnd_ce_fcu");
  const [activeTab, setActiveTab] = useState<"rates" | "milestones" | "reconciliation">("milestones");
  const [rateChangeRequested, setRateChangeRequested] = useState(false);

  // Funding Reconciliation Batches (FR-804)
  const settlementBatches = [
    {
      batchId: "BTH-2026-1121",
      settlementDate: "2026-11-21 17:00 IST",
      totalDisbursedMinor: 1425000000, // ₹1,42,50,000.00
      loanCount: 8,
      achTraceRange: "RBI-ENACH-8812001 .. 8812008",
      status: "balanced_matched",
      clearingHouse: "NPCI / eNACH",
    },
    {
      batchId: "BTH-2026-1120",
      settlementDate: "2026-11-20 17:00 IST",
      totalDisbursedMinor: 982000000, // ₹98,20,000.00
      loanCount: 6,
      achTraceRange: "RBI-ENACH-8811901 .. 8811906",
      status: "balanced_matched",
      clearingHouse: "NPCI / eNACH",
    },
    {
      batchId: "BTH-2026-1119",
      settlementDate: "2026-11-19 17:00 IST",
      totalDisbursedMinor: 1150000000, // ₹1,15,00,000.00
      loanCount: 7,
      achTraceRange: "RBI-ENACH-8811801 .. 8811807",
      status: "balanced_matched",
      clearingHouse: "NPCI / eNACH",
    },
  ];

  // Sample Rate Tiers
  const [rateTiers, setRateTiers] = useState<RateTier[]>([
    {
      id: "tier_60",
      termMonths: 60,
      aprPct: 7.00,
      minFico: 700, // Min CIBIL
      maxDtiPct: 50,
      maxLoanAmount: 650000, // ₹6,50,000
      buyDownAllowed: true,
      status: "active",
    },
    {
      id: "tier_84",
      termMonths: 84,
      aprPct: 7.50,
      minFico: 720,
      maxDtiPct: 45,
      maxLoanAmount: 1000000, // ₹10,00,000
      buyDownAllowed: true,
      status: "active",
    },
    {
      id: "tier_120",
      termMonths: 120,
      aprPct: 8.25,
      minFico: 740,
      maxDtiPct: 42,
      maxLoanAmount: 1500000, // ₹15,00,000
      buyDownAllowed: true,
      status: "active",
    },
  ]);

  // Sample Milestone Payouts
  const [milestones, setMilestones] = useState<MilestonePayout[]>([
    {
      loanId: "LN-8921-UP",
      homeownerName: "Rajesh Kumar Sharma",
      contractorName: "SunVolt Green Energy Pvt. Ltd.",
      systemType: "3 kW Bifacial Solar System + Smart Hybrid Inverter",
      milestoneName: "M1: Equipment Delivery & Mounting",
      disbursementAmountCents: 67000000, // ₹6,70,000.00
      coolingOffStatus: "ACTIVE", // 3-day rescission cooling-off in effect
      daysRemaining: 2,
      homeownerConfirmed: true,
      permitUploaded: true,
      status: "blocked_by_rescission",
    },
    {
      loanId: "LN-7740-HR",
      homeownerName: "Amit Singhania",
      contractorName: "Beacon Solar Systems",
      systemType: "5 kW Rooftop Solar + 5 kWh Battery Storage",
      milestoneName: "M2: Final Inspection & Net-Meter Sync",
      disbursementAmountCents: 142000000, // ₹14,20,000.00
      coolingOffStatus: "EXPIRED",
      daysRemaining: 0,
      homeownerConfirmed: true,
      permitUploaded: true,
      status: "pending_lender_review",
    },
    {
      loanId: "LN-6029-KA",
      homeownerName: "Priya Verma",
      contractorName: "Deccan Clean Energy",
      systemType: "2 kW Grid-Tied Solar System",
      milestoneName: "M2: Commissioning & Net-Meter Sync",
      disbursementAmountCents: 115000000, // ₹11,50,000.00
      coolingOffStatus: "EXPIRED",
      daysRemaining: 0,
      homeownerConfirmed: true,
      permitUploaded: true,
      status: "pending_lender_review",
    },
  ]);

  const handleApprovePayout = (loanId: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.loanId === loanId) {
          if (m.coolingOffStatus === "ACTIVE") {
            alert(
              "CMP-07 / FR-805 Compliance Violation Blocked: Cannot disburse funds while 3-business-day right-of-rescission cooling-off period is active."
            );
            return m;
          }
          return { ...m, status: "funded" };
        }
        return m;
      })
    );
  };

  const handleRequestRateChange = () => {
    setRateChangeRequested(true);
    setRateTiers((prev) =>
      prev.map((t) => (t.id === "tier_60" ? { ...t, status: "pending_peer_approval" } : t))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 min-h-16 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                GQ
              </div>
              <span className="font-bold text-base text-slate-900 hidden sm:inline">GreenQuote</span>
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-xs sm:text-sm text-slate-800">Lender Capital Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <select
              value={selectedLender}
              onChange={(e) => setSelectedLender(e.target.value)}
              className="text-xs font-semibold bg-slate-100 border border-slate-300 rounded-lg px-2 sm:px-3 py-1.5 text-slate-800 focus:ring-1 focus:ring-emerald-500 max-w-[190px] sm:max-w-none"
            >
              <option value="lnd_ce_fcu">Clean Energy FCU</option>
              <option value="lnd_comm_green">Community Green Bank</option>
              <option value="lnd_ecofinance">EcoFinance POS</option>
            </select>
            <span className="inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tier 1</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Title & Description */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Lender Originations & Milestone Capital Console
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Automated soft-pull credit box management, dual-control rate sheet updates (FR-1002), and statutory
              cooling-off payout gates (CMP-07/08).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/admin/analytics"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3 py-2 rounded-lg transition"
            >
              Platform Analytics
            </Link>
            <Link
              href="/contractor/pipeline"
              className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-lg transition"
            >
              Contractor Pipeline View
            </Link>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Capital Deployed</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">₹18.42 Cr</div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              +14.8% clean energy originations
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Weighted Avg APR</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">7.24%</div>
            <span className="text-[11px] text-slate-500 mt-1 block">RBI Reducing Balance APR</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Pending Milestone Draws</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">₹32.40 L</div>
            <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
              3 loans in payout queue
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Compliance & 4-Eyes</span>
              <Lock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-700">100% Locked</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Self-approval strictly rejected</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 space-x-4 sm:space-x-8 text-sm font-bold overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setActiveTab("milestones")}
            className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
              activeTab === "milestones"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Milestone Funding Queue (FR-800)</span>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full ml-1">
              {milestones.filter((m) => m.status !== "funded").length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rates")}
            className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
              activeTab === "rates"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Credit Box & Rate Tiers (FR-1002)</span>
          </button>

          <button
            onClick={() => setActiveTab("reconciliation")}
            className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
              activeTab === "reconciliation"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Settlement & Reconciliation (FR-804)</span>
          </button>
        </div>

        {/* TAB 1: MILESTONE FUNDING DISBURSEMENT QUEUE */}
        {activeTab === "milestones" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Statutory Cooling-Off & Rescission Safeguard (CMP-07 / FR-805):</strong>{" "}
                Federal Truth in Lending Act (Reg Z §1026.23) and FTC Cooling-Off Rules strictly prohibit lender
                capital disbursements until the 3-business-day right-of-rescission period has elapsed and homeowner
                affirmative completion has been recorded.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Loan & System</th>
                      <th className="px-5 py-3.5">Contractor</th>
                      <th className="px-5 py-3.5">Milestone Stage</th>
                      <th className="px-5 py-3.5">Disbursement Amount</th>
                      <th className="px-5 py-3.5">3-Day Rescission Status</th>
                      <th className="px-5 py-3.5">Verification Evidence</th>
                      <th className="px-5 py-3.5 text-right">Lender Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {milestones.map((item) => (
                      <tr key={item.loanId} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900 block">{item.loanId}</span>
                          <span className="text-slate-500">{item.homeownerName}</span>
                          <span className="text-[11px] text-emerald-700 block mt-0.5 font-medium">
                            {item.systemType}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">{item.contractorName}</td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-800 block">{item.milestoneName}</span>
                          <span className="text-[11px] text-slate-500">Dual-Draw Framework</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-slate-900">
                            {formatCurrency(item.disbursementAmountCents, "INR")}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {item.coolingOffStatus === "ACTIVE" ? (
                            <span className="inline-flex items-center space-x-1 bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-md text-[11px] border border-red-200">
                              <Lock className="w-3 h-3" />
                              <span>Cooling-off Active ({item.daysRemaining} days left)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-md text-[11px] border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Rescission Expired (Safe)</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 space-y-1">
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Homeowner Signed</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Municipal Permit On File</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {item.status === "funded" ? (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                              ✓ Funds Disbursed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApprovePayout(item.loanId)}
                              disabled={item.coolingOffStatus === "ACTIVE"}
                              className={`px-3.5 py-2 rounded-lg font-bold text-xs transition ${
                                item.coolingOffStatus === "ACTIVE"
                                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              }`}
                            >
                              {item.coolingOffStatus === "ACTIVE" ? "Blocked (Rescission)" : "Disburse ACH Funds"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREDIT BOX & RATE TIERS (DUAL CONTROL 4-EYES PRINCIPLE) */}
        {activeTab === "rates" && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start justify-between text-xs text-purple-900">
              <div className="flex items-start space-x-3">
                <Lock className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Dual-Authorization 4-Eyes Principle (FR-1002):</strong> Any change
                  to credit scores, buy-down ceilings, or interest rate sheets must be requested by one officer and
                  approved by an independent secondary compliance peer. Self-approval is cryptographically rejected
                  (HTTP 400).
                </div>
              </div>
              <button
                onClick={handleRequestRateChange}
                disabled={rateChangeRequested}
                className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition whitespace-nowrap disabled:opacity-50"
              >
                {rateChangeRequested ? "Change In Review" : "+ Propose Rate Update"}
              </button>
            </div>

            {rateChangeRequested && (
              <div className="bg-white border-2 border-purple-500 rounded-xl p-5 shadow-sm space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
                    <span className="font-bold text-sm text-slate-900">Pending Peer Approval (REQ-LND-9021)</span>
                  </div>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                    Awaiting Compliance Officer 2
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Proposed Change: 60-Month APR reduced from <strong>6.99%</strong> to <strong>6.49%</strong> with 5%
                  maximum buy-down allowance. Initiated by <code>lender_officer_alice</code>. Self-approval is blocked by
                  the server.
                </p>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 font-bold text-slate-900">
                Active Underwriting Rate Sheets & Credit Boxes
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Term</th>
                    <th className="px-6 py-3.5">Contract Rate (APR)</th>
                    <th className="px-6 py-3.5">Min FICO Score</th>
                    <th className="px-6 py-3.5">Max DTI Ceiling</th>
                    <th className="px-6 py-3.5">Max Loan Size</th>
                    <th className="px-6 py-3.5">Buy-Down Cap</th>
                    <th className="px-6 py-3.5">Governance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rateTiers.map((tier) => (
                    <tr key={tier.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-900">{tier.termMonths} Months</td>
                      <td className="px-6 py-4 font-extrabold text-emerald-600 text-sm">{tier.aprPct}% APR</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{tier.minFico}+ CIBIL</td>
                      <td className="px-6 py-4 text-slate-700">{tier.maxDtiPct}%</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {formatCurrency(tier.maxLoanAmount * 100, "INR")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Max 5.0% (FR-603)
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tier.status === "pending_peer_approval" ? (
                          <span className="inline-flex items-center space-x-1 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200">
                            <Lock className="w-3 h-3" />
                            <span>Pending Peer Sign-off</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active in Market</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FUNDING RECONCILIATION & BATCH SETTLEMENT (FR-804) */}
        {activeTab === "reconciliation" && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between text-xs text-emerald-950">
              <div className="flex items-start space-x-3">
                <Landmark className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Daily eNACH Settlement & Reconciliation (FR-804):</strong> Automated
                  three-way match between contractor milestone completion proofs, lender escrow disbursements, and
                  NPCI eNACH / RTGS trace identifiers. 100% matched with zero unallocated variance.
                </div>
              </div>
              <button
                onClick={() => {
                  const sampleCsv = "BatchID,SettlementDate,LoanCount,TotalDisbursedINR,ClearingHouse,Status\n" +
                    settlementBatches.map(b => `${b.batchId},${b.settlementDate},${b.loanCount},₹${(b.totalDisbursedMinor/100).toLocaleString('en-IN')},${b.clearingHouse},${b.status}`).join("\n");
                  const blob = new Blob([sampleCsv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `eNACH_Settlement_Reconciliation_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition flex items-center space-x-1.5 whitespace-nowrap shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Settlement Ledger</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold block">Total Reconciled Volume</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">₹3,55,70,000.00</span>
                <span className="text-[11px] text-emerald-600 font-medium">21 Loans · Past 72h</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold block">Settlement Ledger Variance</span>
                <span className="text-xl font-black text-emerald-600 mt-1 block">₹0.00 (Balanced)</span>
                <span className="text-[11px] text-slate-500 font-medium">100% eNACH Traces Verified</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold block">Next Batch Window</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">17:00 IST Today</span>
                <span className="text-[11px] text-blue-600 font-medium">Same-Day RTGS/eNACH Batch</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 font-bold text-slate-900 flex items-center justify-between">
                <span>Settlement Batches & Clearing History</span>
                <span className="text-xs font-mono font-medium text-slate-500">Clearing: Reserve Bank of India / NPCI</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Batch Identifier</th>
                    <th className="px-6 py-3.5">Settlement Timestamp</th>
                    <th className="px-6 py-3.5">Funded Loans</th>
                    <th className="px-6 py-3.5">eNACH / UTR Range</th>
                    <th className="px-6 py-3.5">Total Disbursed</th>
                    <th className="px-6 py-3.5">Clearing Network</th>
                    <th className="px-6 py-3.5 text-right">Reconciliation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {settlementBatches.map((batch) => (
                    <tr key={batch.batchId} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{batch.batchId}</td>
                      <td className="px-6 py-4 text-slate-700">{batch.settlementDate}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{batch.loanCount} disbursements</td>
                      <td className="px-6 py-4 font-mono text-slate-600 text-[11px]">{batch.achTraceRange}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(batch.totalDisbursedMinor, "INR")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-800 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-200">
                          {batch.clearingHouse}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Balanced (0.00 var)</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
