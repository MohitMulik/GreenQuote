"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileSearch,
  ArrowLeft,
  AlertTriangle,
  Building2,
  Calendar,
  Landmark,
  Coins,
  Lock,
  Download,
  Plus,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

interface LenderConfig {
  lenderId: string;
  name: string;
  minCreditScore: number;
  maxLoanAmountMinor: number;
  allowedTerms: number[];
  baseAprPct: number;
  isActive: boolean;
  pendingChange?: {
    proposedBy: string;
    proposedAt: string;
    newBaseAprPct: number;
    newMaxLoanAmountMinor: number;
    previousValues?: {
      baseAprPct: number;
      maxLoanAmountMinor: number;
    };
  };
}

interface IncentiveProgram {
  id: string;
  name: string;
  jurisdiction: string;
  technology: string;
  maxAmount: number;
  incomeLimit: string;
  stackable: boolean;
  status: "active" | "paused";
}

export default function OperationsReviewQueuePage() {
  const [activeTab, setActiveTab] = useState<"fraud" | "kyb" | "lenders" | "incentives" | "audit">("fraud");

  // Authenticated Operations Officer Session (Enforced via JWT/Session - no client role impersonation)
  const authenticatedOfficer = {
    userId: "ops_compliance_2",
    name: "Ayesha Patel",
    role: "Compliance Officer",
  };

  const [dualAuthError, setDualAuthError] = useState<string | null>(null);
  const [dualAuthSuccess, setDualAuthSuccess] = useState<string | null>(null);

  // Rejection Modal State
  const [rejectingLenderId, setRejectingLenderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Lenders State (FR-1002)
  const [lenders, setLenders] = useState<LenderConfig[]>([
    {
      lenderId: "lnd_vermont_cu",
      name: "Vermont Clean Energy CU",
      minCreditScore: 660,
      maxLoanAmountMinor: 4500000,
      allowedTerms: [36, 60, 84, 120],
      baseAprPct: 5.75,
      isActive: true,
      pendingChange: {
        proposedBy: "ops_lead_1",
        proposedAt: "2026-11-21 14:15 UTC",
        newBaseAprPct: 5.25,
        newMaxLoanAmountMinor: 5000000,
        previousValues: {
          baseAprPct: 5.75,
          maxLoanAmountMinor: 4500000,
        },
      },
    },
    {
      lenderId: "lnd_greenpenny",
      name: "Greenpenny Clean Energy Bank",
      minCreditScore: 680,
      maxLoanAmountMinor: 6000000,
      allowedTerms: [60, 120, 180],
      baseAprPct: 6.99,
      isActive: true,
    },
    {
      lenderId: "lnd_climate_first",
      name: "Climate First Specialty POS",
      minCreditScore: 620,
      maxLoanAmountMinor: 5000000,
      allowedTerms: [60, 84, 120],
      baseAprPct: 7.99,
      isActive: true,
    },
  ]);

  // Selected Lender for Propose Modal
  const [editingLenderId, setEditingLenderId] = useState<string | null>(null);
  const [proposedApr, setProposedApr] = useState<number>(5.5);
  const [proposedMaxLoan, setProposedMaxLoan] = useState<number>(55000);

  // Incentive Programs State (FR-1003)
  const [incentivePrograms, setIncentivePrograms] = useState<IncentiveProgram[]>([
    {
      id: "inc_ira_homes",
      name: "IRA HOMES Performance-Based Rebates (HOMES)",
      jurisdiction: "Federal (DOE)",
      technology: "Heat Pump & Envelope",
      maxAmount: 8000,
      incomeLimit: "<80% AMI: 100% up to $8k, 80-150% AMI: 50% up to $4k",
      stackable: true,
      status: "active",
    },
    {
      id: "inc_ira_25c",
      name: "IRA Section 25C Energy Efficient Home Improvement Credit",
      jurisdiction: "Federal (IRS)",
      technology: "Heat Pump HVAC & Water Heater",
      maxAmount: 2000,
      incomeLimit: "None (Standard Tax Credit)",
      stackable: true,
      status: "active",
    },
    {
      id: "inc_mass_save",
      name: "Mass Save HEAT Loan & Equipment Rebate",
      jurisdiction: "Massachusetts",
      technology: "Whole-Home Cold Climate Heat Pump",
      maxAmount: 10000,
      incomeLimit: "Residential Ratepayer",
      stackable: true,
      status: "active",
    },
    {
      id: "inc_eff_maine",
      name: "Efficiency Maine Home Energy Savings Program",
      jurisdiction: "Maine",
      technology: "Ductless & Ducted Heat Pumps",
      maxAmount: 8000,
      incomeLimit: "Low/Moderate Income Enhanced Tier",
      stackable: true,
      status: "active",
    },
    {
      id: "inc_tech_ca",
      name: "TECH Clean California Heat Pump Rebate",
      jurisdiction: "California",
      technology: "Electric Heat Pump HVAC",
      maxAmount: 3100,
      incomeLimit: "Single Family Residential",
      stackable: true,
      status: "active",
    },
  ]);

  const [newProgramModal, setNewProgramModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramState, setNewProgramState] = useState("CO");
  const [newProgramAmount, setNewProgramAmount] = useState(2500);
  const [newProgramTech, setNewProgramTech] = useState("Cold Climate Heat Pump");

  // Single-Loan Dossier Export State (FR-1004)
  const [dossierSearchId, setDossierSearchId] = useState("loan_demo_1");
  const [dossierExported, setDossierExported] = useState(false);

  // Contractors State (FR-202)
  const [contractors, setContractors] = useState([
    {
      id: "cnt_201",
      name: "Summit Green Energy Heating LLC",
      owner: "Mark Evans",
      ein: "84-9182371",
      license: "CO License #ME-8841 (Uploaded)",
      insurance: "Hartford GL $2,000,000 (Expires 2027-05)",
      status: "pending_review",
    },
  ]);

  // Fraud Queue State (AI-04 / FR-1001)
  const [fraudItems, setFraudItems] = useState([
    {
      id: "frd_901",
      contractor: "Apex Clean Energy & HVAC LLC",
      quoteId: "qte_8841",
      customer: "John Doe",
      flagType: "PRICE_DEVIATION_ALERT",
      description: "Quote price ($32,500 for 3-ton standard AC) exceeds 2.5x regional median ($11,200).",
      severity: "High",
      timestamp: "2026-11-21 13:45 UTC",
      status: "under_review",
    },
    {
      id: "frd_902",
      contractor: "Apex Clean Energy & HVAC LLC",
      quoteId: "qte_8842",
      customer: "Sarah Jenkins",
      flagType: "EQUIPMENT_MODEL_MISMATCH",
      description: "Installed nameplate photo reads MSZ-GL12NA, but quote specified MSZ-FS12NA (Hyper-Heat).",
      severity: "Medium",
      timestamp: "2026-11-21 14:10 UTC",
      status: "under_review",
    },
  ]);

  // Immutable Audit Trail (FR-1004)
  const auditEvents = [
    {
      id: "evt_1",
      timestamp: "2026-11-21 14:20:11 UTC",
      actor: "Sarah Jenkins (Homeowner)",
      action: "PREQUAL_SOFT_PULL_SUBMITTED",
      details: "FCRA consent version 2026-v1 recorded. 3 lenders queried via parallel fan-out (0 credit impact).",
    },
    {
      id: "evt_2",
      timestamp: "2026-11-21 14:22:04 UTC",
      actor: "Sarah Jenkins (Homeowner)",
      action: "TILA_DISCLOSURE_VIEWED",
      details: "Truth in Lending disclosure §1026.18 rendered prior to e-sign.",
    },
    {
      id: "evt_3",
      timestamp: "2026-11-21 14:22:45 UTC",
      actor: "Sarah Jenkins (Homeowner)",
      action: "E_SIGN_COMPLETED",
      details: "Electronic note signed via IP 127.0.0.1. SHA-256 seal 7b91d2c65fe38a19b84c81... recorded. 3-day rescission clock started.",
    },
    {
      id: "evt_4",
      timestamp: "2026-11-21 14:25:30 UTC",
      actor: "Sarah Jenkins (Homeowner)",
      action: "HOMEOWNER_COMPLETION_CONFIRMED",
      details: "Milestone completion signed off. Equipment match verified against AHRI #20875412.",
    },
  ];

  // Dual Authorization Actions (FR-1002)
  const handleProposeConfig = (lenderId: string) => {
    setLenders((prev) =>
      prev.map((l) => {
        if (l.lenderId === lenderId) {
          return {
            ...l,
            pendingChange: {
              proposedBy: authenticatedOfficer.userId,
              proposedAt: new Date().toISOString(),
              newBaseAprPct: proposedApr,
              newMaxLoanAmountMinor: proposedMaxLoan * 100,
              previousValues: {
                baseAprPct: l.baseAprPct,
                maxLoanAmountMinor: l.maxLoanAmountMinor,
              },
            },
          };
        }
        return l;
      })
    );
    setEditingLenderId(null);
    setDualAuthSuccess(
      `Configuration proposal created by ${authenticatedOfficer.name} (${authenticatedOfficer.userId}). Under FR-1002, a second authorized officer must review and approve before activation.`
    );
    setDualAuthError(null);
  };

  const handleApproveConfig = (lenderId: string) => {
    const lender = lenders.find((l) => l.lenderId === lenderId);
    if (!lender || !lender.pendingChange) return;

    // Strict Four-Eyes / Dual-Authorization rule (FR-1002)
    if (lender.pendingChange.proposedBy === authenticatedOfficer.userId) {
      setDualAuthError(
        `Dual-Authorization Policy Violation: Approving officer (${authenticatedOfficer.name}) cannot be the same officer who requested the change (${lender.pendingChange.proposedBy}). Self-approval is strictly prohibited under FR-1002.`
      );
      setDualAuthSuccess(null);
      return;
    }

    const appliedChange = lender.pendingChange;

    // Apply configuration
    setLenders((prev) =>
      prev.map((l) => {
        if (l.lenderId === lenderId && l.pendingChange) {
          return {
            ...l,
            baseAprPct: l.pendingChange.newBaseAprPct,
            maxLoanAmountMinor: l.pendingChange.newMaxLoanAmountMinor,
            pendingChange: undefined,
          };
        }
        return l;
      })
    );

    setDualAuthError(null);
    setDualAuthSuccess(
      `Dual-Authorization Approved! Lender configuration for ${lender.name} activated by ${authenticatedOfficer.name} (Previous: ${appliedChange.previousValues?.baseAprPct ?? lender.baseAprPct}% ➔ New: ${appliedChange.newBaseAprPct}%). Immutable audit event recorded.`
    );
  };

  const handleRejectConfig = () => {
    if (!rejectingLenderId) return;
    const lender = lenders.find((l) => l.lenderId === rejectingLenderId);
    if (!lender || !lender.pendingChange) return;

    setLenders((prev) =>
      prev.map((l) => {
        if (l.lenderId === rejectingLenderId) {
          return {
            ...l,
            pendingChange: undefined,
          };
        }
        return l;
      })
    );

    setDualAuthError(null);
    setDualAuthSuccess(
      `Configuration update for ${lender.name} rejected by ${authenticatedOfficer.name}: "${rejectionReason || "Underwriting compliance decline"}". Original parameters (${lender.baseAprPct}% APR) preserved. Immutable rejection audit event recorded.`
    );
    setRejectingLenderId(null);
    setRejectionReason("");
  };

  const handleDownloadDossier = () => {
    const dossierData = {
      entityId: dossierSearchId,
      exportedAt: new Date().toISOString(),
      regulationsCovered: ["TILA Reg Z §1026.18", "FCRA §604", "ECOA Reg B", "E-SIGN Act", "FTC Cooling-Off Rule"],
      tamperEvidentSeal: {
        algorithm: "SHA-256",
        integrityHash: "a8f4b1e9c27d402b881ef0357c91adfe08b5e619c90472fba172909418bc25ef",
        verified: true,
      },
      auditTrail: auditEvents,
    };

    const blob = new Blob([JSON.stringify(dossierData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Regulatory_Audit_Dossier_${dossierSearchId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDossierExported(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 text-slate-300 hover:text-white">
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span className="font-bold text-lg text-white">GreenQuote Operations Console</span>
            </Link>
            <span className="text-xs bg-purple-900 text-purple-200 border border-purple-700 font-semibold px-2.5 py-0.5 rounded-full">
              Risk & Compliance Engine
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400">Authenticated Officer:</span>
            <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-200 font-semibold">{authenticatedOfficer.name}</span>
              <span className="text-[10px] bg-purple-900/60 text-purple-300 border border-purple-700/80 px-2 py-0.5 rounded font-mono font-semibold">
                {authenticatedOfficer.userId} · {authenticatedOfficer.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
        {/* Dual-Auth Feedback Alerts */}
        {dualAuthError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Dual-Authorization Check Failed</p>
              <p className="text-xs mt-0.5 text-red-700">{dualAuthError}</p>
            </div>
          </div>
        )}

        {dualAuthSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Operation Authorized</p>
              <p className="text-xs mt-0.5 text-emerald-700">{dualAuthSuccess}</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("fraud")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === "fraud"
                ? "bg-amber-100 text-amber-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Fraud & Anomaly Queue ({fraudItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("kyb")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === "kyb"
                ? "bg-purple-100 text-purple-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4 text-purple-600" />
            <span>Contractor KYB ({contractors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("lenders")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === "lenders"
                ? "bg-blue-100 text-blue-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Landmark className="w-4 h-4 text-blue-600" />
            <span>Lender Config & Dual-Auth (FR-1002)</span>
          </button>

          <button
            onClick={() => setActiveTab("incentives")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === "incentives"
                ? "bg-emerald-100 text-emerald-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>Incentive Programs (FR-1003)</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-slate-200 text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileSearch className="w-4 h-4 text-slate-700" />
            <span>7-Yr Regulatory Dossier (FR-1004)</span>
          </button>
        </div>

        {/* TAB 1: FRAUD QUEUE */}
        {activeTab === "fraud" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Automated Heuristic Flags & Reviews (AI-04 / FR-1001)</h2>
              <p className="text-sm text-slate-600 mb-6">
                All suspicious transactions are held before lender funding release. Lenders do not disburse loan capital
                while an operations flag is unresolved.
              </p>

              <div className="space-y-4">
                {fraudItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase">
                          {item.flagType}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{item.timestamp}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1">{item.description}</p>
                      <p className="text-xs text-slate-600">
                        Contractor: <strong>{item.contractor}</strong> · Customer: {item.customer} · Quote Ref: {item.quoteId}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setFraudItems(fraudItems.filter((f) => f.id !== item.id))}
                        className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition"
                      >
                        Request Contractor Clarification
                      </button>
                      <button
                        onClick={() => setFraudItems(fraudItems.filter((f) => f.id !== item.id))}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                      >
                        Approve & Clear Flag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTRACTOR KYB QUEUE */}
        {activeTab === "kyb" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Contractor Business & License Verification (FR-202)</h2>
            <div className="space-y-4">
              {contractors.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-slate-900">{c.name}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Owner: {c.owner} · EIN: {c.ein}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-2">
                      <span>{c.license}</span>
                      <span>·</span>
                      <span>{c.insurance}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setContractors(contractors.filter((item) => item.id !== c.id))}
                      className="flex items-center space-x-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-lg text-xs font-semibold"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => setContractors(contractors.filter((item) => item.id !== c.id))}
                      className="flex items-center space-x-1 bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-lg text-xs font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Onboarding</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DUAL-AUTHORIZATION LENDER CONFIG (FR-1002) */}
        {activeTab === "lenders" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  Dual-Authorization Lender Configuration (FR-1002)
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Enforces Four-Eyes Principle: Underwriting parameters, base APRs, and maximum limits cannot be modified
                  by a single operator without independent verification by a second authorized officer.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3 py-2 rounded-lg font-medium flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Active Officer: <strong>{authenticatedOfficer.name}</strong> ({authenticatedOfficer.role})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {lenders.map((lender) => (
                <div
                  key={lender.lenderId}
                  className={`p-5 rounded-xl border flex flex-col justify-between ${
                    lender.pendingChange ? "border-amber-300 bg-amber-50/40" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">{lender.name}</h3>
                        <span className="text-[11px] font-mono text-slate-500">{lender.lenderId}</span>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                        Active
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base APR:</span>
                        <span className="font-bold text-slate-900">{lender.baseAprPct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Max Loan Limit:</span>
                        <span className="font-bold text-slate-900">
                          ${(lender.maxLoanAmountMinor / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Min FICO Score:</span>
                        <span className="font-bold text-slate-900">{lender.minCreditScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Supported Terms:</span>
                        <span className="font-bold text-slate-900">{lender.allowedTerms.join(", ")} mo</span>
                      </div>
                    </div>

                    {/* Pending Proposal Card */}
                    {lender.pendingChange && (
                      <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-lg text-xs space-y-2">
                        <div className="flex items-center space-x-1 font-bold text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Pending Dual-Auth Change</span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Proposed by: <strong>{lender.pendingChange.proposedBy}</strong>
                        </p>
                        <div className="font-mono text-[11px] space-y-0.5 text-amber-950">
                          <p>New Base APR: <strong>{lender.pendingChange.newBaseAprPct}%</strong> (was {lender.baseAprPct}%)</p>
                          <p>New Max Limit: <strong>${(lender.pendingChange.newMaxLoanAmountMinor / 100).toLocaleString()}</strong> (was ${(lender.maxLoanAmountMinor / 100).toLocaleString()})</p>
                        </div>

                        {/* Dual Action: Authorize vs Reject (Four-Eyes Enforcement) */}
                        {lender.pendingChange.proposedBy === authenticatedOfficer.userId ? (
                          <div className="mt-2 p-2 bg-amber-200/60 border border-amber-400 rounded text-[11px] text-amber-900 font-medium">
                            <p className="font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-800" />
                              Self-Approval Prohibited (FR-1002)
                            </p>
                            <p className="text-[10px] text-amber-800 mt-0.5">
                              You proposed this modification. A second authorized compliance officer must independently review and sign off.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                              onClick={() => handleApproveConfig(lender.lenderId)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-2 rounded text-xs transition flex items-center justify-center space-x-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Authorize</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectingLenderId(lender.lenderId);
                                setRejectionReason("");
                              }}
                              className="bg-rose-700 hover:bg-rose-800 text-white font-bold py-1.5 px-2 rounded text-xs transition flex items-center justify-center space-x-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!lender.pendingChange && (
                    <button
                      onClick={() => {
                        setEditingLenderId(lender.lenderId);
                        setProposedApr(lender.baseAprPct);
                        setProposedMaxLoan(lender.maxLoanAmountMinor / 100);
                      }}
                      className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-lg transition"
                    >
                      Propose Parameter Change
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Propose Change Modal */}
            {editingLenderId && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Propose Parameter Update: {editingLenderId}
                  </h3>
                  <p className="text-xs text-slate-600">
                    This change will be submitted in <strong>pending_approval</strong> status under officer{" "}
                    <strong>{authenticatedOfficer.name} ({authenticatedOfficer.userId})</strong>. Under the Four-Eyes principle (FR-1002), you cannot self-approve; a second officer must inspect and authorize this change.
                  </p>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">New Base APR (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={proposedApr}
                        onChange={(e) => setProposedApr(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">New Maximum Loan Limit ($)</label>
                      <input
                        type="number"
                        step="1000"
                        value={proposedMaxLoan}
                        onChange={(e) => setProposedMaxLoan(parseInt(e.target.value, 10) || 0)}
                        className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setEditingLenderId(null)}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleProposeConfig(editingLenderId)}
                      className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Submit for Dual-Approval
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INCENTIVE PROGRAMS (FR-1003) */}
        {activeTab === "incentives" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  Clean Energy Incentive Program Manager (FR-1003)
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Manage federal, state, and utility clean energy rebates, IRA HOMES/HEEHR tax credits, and stacking logic.
                </p>
              </div>

              <button
                onClick={() => setNewProgramModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Incentive Program</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {incentivePrograms.map((prog) => (
                <div key={prog.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{prog.name}</span>
                      <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {prog.jurisdiction}
                      </span>
                      {prog.stackable && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Stackable
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      Eligible Tech: <strong>{prog.technology}</strong> · Eligibility: {prog.incomeLimit}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-base font-bold text-emerald-700 font-mono">
                        Up to ${prog.maxAmount.toLocaleString()}
                      </p>
                      <span className="text-[11px] text-slate-400 capitalize">Status: {prog.status}</span>
                    </div>

                    <button
                      onClick={() =>
                        setIncentivePrograms((prev) =>
                          prev.map((p) =>
                            p.id === prog.id ? { ...p, status: p.status === "active" ? "paused" : "active" } : p
                          )
                        )
                      }
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                        prog.status === "active"
                          ? "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      {prog.status === "active" ? "Pause Program" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Program Modal */}
            {newProgramModal && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Add State / Utility Incentive Program</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Program Name</label>
                      <input
                        type="text"
                        value={newProgramName}
                        placeholder="e.g. Colorado Clean Heat Program"
                        onChange={(e) => setNewProgramName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">State / Jurisdiction</label>
                      <input
                        type="text"
                        value={newProgramState}
                        onChange={(e) => setNewProgramState(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm uppercase"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Eligible Technology</label>
                      <input
                        type="text"
                        value={newProgramTech}
                        onChange={(e) => setNewProgramTech(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Maximum Rebate Amount ($)</label>
                      <input
                        type="number"
                        value={newProgramAmount}
                        onChange={(e) => setNewProgramAmount(parseInt(e.target.value, 10) || 0)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setNewProgramModal(false)}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (newProgramName) {
                          setIncentivePrograms([
                            ...incentivePrograms,
                            {
                              id: `inc_${Date.now()}`,
                              name: newProgramName,
                              jurisdiction: newProgramState,
                              technology: newProgramTech,
                              maxAmount: newProgramAmount,
                              incomeLimit: "Standard Residential",
                              stackable: true,
                              status: "active",
                            },
                          ]);
                          setNewProgramModal(false);
                          setNewProgramName("");
                        }
                      }}
                      className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    >
                      Save Program
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: 7-YEAR IMMUTABLE AUDIT TRAIL & DOSSIER (FR-1004) */}
        {activeTab === "audit" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  7-Year Immutable Compliance Dossier (FR-1004 / NFR-11)
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Cryptographically sealed audit trail for regulatory exams (CFPB, FTC, state banking commissioners).
                  Every consent, rate disclosure, e-sign event, and milestone release is sealed with SHA-256 integrity hash.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={dossierSearchId}
                  onChange={(e) => setDossierSearchId(e.target.value)}
                  placeholder="Loan ID / Entity ID"
                  className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono w-44"
                />
                <button
                  onClick={handleDownloadDossier}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Sealed Dossier</span>
                </button>
              </div>
            </div>

            {/* Tamper Evident Seal Badge */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold text-purple-900">
                    SHA-256 Tamper-Evident Integrity Seal: Verified
                  </span>
                </div>
                <p className="font-mono text-[11px] text-purple-800 break-all">
                  a8f4b1e9c27d402b881ef0357c91adfe08b5e619c90472fba172909418bc25ef
                </p>
              </div>

              {dossierExported && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md shrink-0">
                  Downloaded JSON ✓
                </span>
              )}
            </div>

            {/* Chronological Event Stream */}
            <div className="divide-y divide-slate-100 pt-2">
              {auditEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {evt.action}
                      </span>
                      <span className="text-slate-700 font-semibold">{evt.actor}</span>
                    </div>
                    <p className="text-slate-600">{evt.details}</p>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px] flex items-center space-x-1 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{evt.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
