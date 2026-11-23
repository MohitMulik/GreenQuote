"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Zap,
  Landmark,
  PiggyBank,
  Percent,
  Clock,
  ArrowUpRight,
  Sun,
  Flame,
  Battery,
  FileCheck2,
} from "lucide-react";

export default function PlatformAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"30d" | "quarter" | "ytd">("quarter");

  const analytics = {
    originations: {
      totalVolume: 4850000,
      totalFunded: 142,
      activePipeline: 42,
      avgLoanAmount: 34154,
      avgApr: 6.45,
      dealerFeeSavings: 873000, // 18% average dealer fee avoided
    },
    technology: [
      { name: "Cold-Climate Heat Pumps", pct: 64, volume: 3104000, count: 91, icon: Flame, color: "bg-blue-500" },
      { name: "Rooftop Solar PV", pct: 28, volume: 1358000, count: 40, icon: Sun, color: "bg-amber-500" },
      { name: "Home Battery Storage", pct: 8, volume: 388000, count: 11, icon: Battery, color: "bg-emerald-500" },
    ],
    lenders: [
      {
        id: "lnd_vermont_cu",
        name: "Vermont Clean Energy CU",
        fundedVolume: 2150000,
        loanCount: 63,
        approvalRate: 78.5,
        medianTimeSec: 42,
        avgApr: 5.85,
        rating: "A+ Prime",
      },
      {
        id: "lnd_greenpenny",
        name: "Greenpenny Clean Energy Bank",
        fundedVolume: 1720000,
        loanCount: 50,
        approvalRate: 74.2,
        medianTimeSec: 38,
        avgApr: 6.95,
        rating: "A Community",
      },
      {
        id: "lnd_climate_first",
        name: "Climate First Specialty POS",
        fundedVolume: 980000,
        loanCount: 29,
        approvalRate: 82.1,
        medianTimeSec: 29,
        avgApr: 7.80,
        rating: "Specialty Clean POS",
      },
    ],
    complianceMetrics: {
      cashFinanceParityRate: "100%", // FR-308
      maxBuyDownObserved: "3.20%", // Under 5% cap (FR-603)
      ecoaNoticeDeliveryAvgDays: "1.2 days", // Statutory 30-day limit (CMP-02)
      tilaAcknowledgmentRate: "100%", // Prior to signature (FR-703)
      rescissionHoldCompliance: "100%", // 3 business days enforced (CMP-08)
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Page Title & Timeframe Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
              <span>Clean Energy Originations & Platform Analytics</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                S14 Executive View
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Portfolio-wide origination volume, multi-lender conversion, zero dealer fee impact, and compliance telemetry.
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm text-xs font-semibold text-slate-600 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setTimeframe("30d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === "30d" ? "bg-slate-900 text-white" : "hover:text-slate-900"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeframe("quarter")}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === "quarter" ? "bg-slate-900 text-white" : "hover:text-slate-900"
              }`}
            >
              Q4 2026 (Active)
            </button>
            <button
              onClick={() => setTimeframe("ytd")}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === "ytd" ? "bg-slate-900 text-white" : "hover:text-slate-900"
              }`}
            >
              Year-to-Date
            </button>
          </div>
        </div>

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Origination Volume */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Origination Volume</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              ${(analytics.originations.totalVolume / 1000000).toFixed(2)}M
            </div>
            <div className="flex items-center text-[11px] text-emerald-600 font-semibold space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% vs previous quarter · {analytics.originations.totalFunded} loans</span>
            </div>
          </div>

          {/* Card 2: Zero Dealer Fee Savings */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl">
              FR-308 Parity
            </div>
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-semibold uppercase tracking-wider">Dealer Fees Saved</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700">
              ${(analytics.originations.dealerFeeSavings / 1000).toFixed(0)}k
            </div>
            <p className="text-[11px] text-slate-500">
              18% avg dealer fee eliminated for clean energy consumers
            </p>
          </div>

          {/* Card 3: Weighted Avg APR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Portfolio Weighted APR</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{analytics.originations.avgApr}%</div>
            <div className="text-[11px] text-slate-500">
              Market benchmark: 9.99% · <strong>354 bps lower</strong>
            </div>
          </div>

          {/* Card 4: Active Project Pipeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Pipeline</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{analytics.originations.activePipeline} Deals</div>
            <div className="text-[11px] text-slate-500">
              $1.43M in underwriting, e-sign & installation
            </div>
          </div>
        </div>

        {/* Middle Section: Technology Adoption & Compliance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Technology Adoption Breakdown */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Equipment Technology Mix</h2>
                <p className="text-xs text-slate-500">Financed clean energy assets certified via AHRI & NEEP</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">142 Funded Installations</span>
            </div>

            <div className="space-y-4">
              {analytics.technology.map((tech) => {
                const Icon = tech.icon;
                return (
                  <div key={tech.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <span className="font-bold text-slate-800">{tech.name}</span>
                        <span className="text-slate-400">({tech.count} projects)</span>
                      </div>
                      <div className="font-mono text-slate-900 font-bold">
                        ${(tech.volume / 1000000).toFixed(2)}M ({tech.pct}%)
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full ${tech.color} rounded-full`} style={{ width: `${tech.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Avg Ticket</span>
                <span className="font-bold text-slate-900 font-mono">$34,154</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">IRA Rebate Capture</span>
                <span className="font-bold text-emerald-700 font-mono">89.4%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Serial Match Rate</span>
                <span className="font-bold text-slate-900 font-mono">98.2%</span>
              </div>
            </div>
          </div>

          {/* Regulatory Compliance Health */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Regulatory Health Check</span>
              </h2>
              <p className="text-xs text-slate-500">Automated legal & compliance gates</p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-600">Cash/Finance Parity (FR-308)</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {analytics.complianceMetrics.cashFinanceParityRate}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-600">Max Buy-Down (Capped 5%)</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded">
                  {analytics.complianceMetrics.maxBuyDownObserved}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-600">ECOA Notice Delivery</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {analytics.complianceMetrics.ecoaNoticeDeliveryAvgDays}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-600">TILA Disclosure Signed</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {analytics.complianceMetrics.tilaAcknowledgmentRate}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-600">3-Day Rescission Hold</span>
                <span className="font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
                  {analytics.complianceMetrics.rescissionHoldCompliance}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/admin/review-queue"
                className="w-full text-center block bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg transition"
              >
                Go to Operations Review Queue →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section: Multi-Lender Network Performance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>Multi-Lender Partner Network (FR-601, FR-604)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Parallel soft-pull fan-out performance, approval rates, and origination distribution.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Strict Neutral Sorting (No Paid Placement)</span>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics.lenders.map((lender) => (
              <div
                key={lender.id}
                className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{lender.name}</span>
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      {lender.rating}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span>
                      Median Time to Offer: <strong>{lender.medianTimeSec}s</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Approval Rate: <strong>{lender.approvalRate}%</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Avg APR: <strong>{lender.avgApr}%</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-right">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block">Total Funded</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      ${(lender.fundedVolume / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block">Loans</span>
                    <span className="text-base font-bold text-slate-900 font-mono">{lender.loanCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
