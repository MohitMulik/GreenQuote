"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  FileCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Download,
} from "lucide-react";
import { formatCurrency } from "@greenquote/shared";

interface PipelineDeal {
  id: string;
  customerName: string;
  propertyAddress: string;
  selectedOption: string;
  totalPriceMinor: number;
  financingStatus:
    | "Draft"
    | "Sent"
    | "Viewed"
    | "Pre-Qualified"
    | "Signed"
    | "Installing"
    | "Funded";
  advisorName: string;
  createdAt: string;
  linkToken: string;
}

export default function ContractorPipelinePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const deals: PipelineDeal[] = [
    {
      id: "qte_101",
      customerName: "Sarah Jenkins",
      propertyAddress: "42 Commonwealth Ave, Boston, MA",
      selectedOption: "Better: Cold-Climate Hyper-Heat",
      totalPriceMinor: 1540000, // $15,400
      financingStatus: "Pre-Qualified",
      advisorName: "Rahul Sharma",
      createdAt: "2026-11-21",
      linkToken: "demo-token",
    },
    {
      id: "qte_102",
      customerName: "Michael Chang",
      propertyAddress: "88 Beacon St, Boston, MA",
      selectedOption: "Best: Geothermal Hybrid",
      totalPriceMinor: 2050000,
      financingStatus: "Signed",
      advisorName: "Rahul Sharma",
      createdAt: "2026-11-20",
      linkToken: "demo-token",
    },
    {
      id: "qte_103",
      customerName: "David Miller",
      propertyAddress: "14 Tremont St, Boston, MA",
      selectedOption: "Good: 15.2 SEER2 Standard",
      totalPriceMinor: 1040000,
      financingStatus: "Funded",
      advisorName: "Sanjay Patel",
      createdAt: "2026-11-18",
      linkToken: "demo-token",
    },
    {
      id: "qte_104",
      customerName: "Emily Watson",
      propertyAddress: "220 Newbury St, Boston, MA",
      selectedOption: "Better: Cold-Climate Hyper-Heat",
      totalPriceMinor: 1480000,
      financingStatus: "Sent",
      advisorName: "Rahul Sharma",
      createdAt: "2026-11-21",
      linkToken: "demo-token",
    },
  ];

  // Dynamic KPI Calculations (B-08)
  const totalPipelineMinor = deals.reduce((sum, d) => sum + d.totalPriceMinor, 0);
  const fundedOrSignedMinor = deals
    .filter((d) => d.financingStatus === "Funded" || d.financingStatus === "Signed" || d.financingStatus === "Installing")
    .reduce((sum, d) => sum + d.totalPriceMinor, 0);
  const pendingPayoutsMinor = deals
    .filter((d) => d.financingStatus === "Signed" || d.financingStatus === "Installing")
    .reduce((sum, d) => sum + d.totalPriceMinor, 0);
  const activeCount = deals.length;

  const handleExportCsv = () => {
    // S-09 Remediation: Sanitize formula injection characters (=, +, -, @, \t, \r)
    const sanitizeCsvCell = (val: string | number) => {
      const str = String(val).replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(str)) {
        return `"'${str}"`;
      }
      return `"${str}"`;
    };

    const csvRows = [
      ["Quote ID", "Customer Name", "Address", "Quoted System", "Total Price", "Financing Status", "Advisor", "Created At"],
      ...deals.map((d) => [
        sanitizeCsvCell(d.id),
        sanitizeCsvCell(d.customerName),
        sanitizeCsvCell(d.propertyAddress),
        sanitizeCsvCell(d.selectedOption),
        (d.totalPriceMinor / 100).toFixed(2),
        sanitizeCsvCell(d.financingStatus),
        sanitizeCsvCell(d.advisorName),
        sanitizeCsvCell(d.createdAt),
      ]),
    ];
    const csvString = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvString);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `greenquote_monthly_pipeline_${new Date().toISOString().slice(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.financingStatus.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PipelineDeal["financingStatus"]) => {
    switch (status) {
      case "Funded":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Signed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Pre-Qualified":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Sent":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Installing":
        return "bg-sky-100 text-sky-800 border-sky-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 min-h-16 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                GQ
              </div>
              <span className="font-bold text-base sm:text-lg text-slate-900">GreenQuote Contractor Hub</span>
            </Link>
            <span className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full hidden sm:inline-block">
              Apex Clean Energy & HVAC LLC
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/contractor/quote/new"
              className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Quote</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Pipeline Volume</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(totalPipelineMinor)}</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              {formatCurrency(fundedOrSignedMinor)} funded & signed
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Close Rate Lift</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">+14.2%</div>
            <span className="text-[11px] text-blue-600 font-semibold mt-1 block">Exceeds +10 pts PRD benchmark</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Quotes</span>
              <FileCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{activeCount} Deals</div>
            <span className="text-[11px] text-purple-600 font-semibold mt-1 block">1 Pre-Qualified, 1 Signed</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Draw Payouts</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(pendingPayoutsMinor)}</div>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
              Awaiting milestone sign-off
            </span>
          </div>
        </div>

        {/* Pipeline Controls & Search */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer name or property..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center space-x-1 border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export CSV (FR-904)</span>
              </button>
              <Filter className="w-4 h-4 text-slate-500 ml-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">All Stages</option>
                <option value="sent">Sent</option>
                <option value="pre-qualified">Pre-Qualified</option>
                <option value="signed">Signed</option>
                <option value="funded">Funded</option>
              </select>
            </div>
          </div>

          {/* Mobile Deals Cards (md:hidden) */}
          <div className="block md:hidden space-y-3 pt-2">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{deal.customerName}</span>
                    <span className="text-xs text-slate-500">{deal.propertyAddress}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadge(
                      deal.financingStatus
                    )}`}
                  >
                    {deal.financingStatus}
                  </span>
                </div>

                <div className="text-xs space-y-1 bg-white p-2.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">System:</span>
                    <span className="font-medium text-slate-800 text-right">{deal.selectedOption}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Price:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(deal.totalPriceMinor, "USD")}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Advisor:</span>
                    <span className="text-slate-600">{deal.advisorName}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(deal.financingStatus === "Signed" ||
                    deal.financingStatus === "Funded" ||
                    deal.financingStatus === "Installing") && (
                    <Link
                      href={`/contractor/milestones/${deal.id}`}
                      className="flex-1 inline-flex items-center justify-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition border border-emerald-200"
                    >
                      <span>Milestones</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  <Link
                    href={`/quote/${deal.linkToken}`}
                    target="_blank"
                    className="flex-1 inline-flex items-center justify-center space-x-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-lg transition border border-brand-200"
                  >
                    <span>Customer Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Deals Table (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto pt-2">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Customer & Location</th>
                  <th className="py-3 px-4">Quoted System</th>
                  <th className="py-3 px-4">Total Price</th>
                  <th className="py-3 px-4">Financing Status</th>
                  <th className="py-3 px-4">Advisor</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900 block">{deal.customerName}</span>
                      <span className="text-xs text-slate-500">{deal.propertyAddress}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-700 text-xs font-medium">
                      {deal.selectedOption}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {formatCurrency(deal.totalPriceMinor, "USD")}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(
                          deal.financingStatus
                        )}`}
                      >
                        {deal.financingStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">{deal.advisorName}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(deal.financingStatus === "Signed" ||
                          deal.financingStatus === "Funded" ||
                          deal.financingStatus === "Installing") && (
                          <Link
                            href={`/contractor/milestones/${deal.id}`}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <span>Milestones (FR-802)</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        <Link
                          href={`/quote/${deal.linkToken}`}
                          target="_blank"
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition"
                        >
                          <span>Customer Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
