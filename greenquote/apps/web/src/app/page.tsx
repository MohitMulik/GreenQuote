import Link from "next/link";
import { ShieldCheck, Zap, ArrowRight, FileText, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Demo Disclosure Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-900 font-medium">
        <span>GreenQuote India · Embedded Clean Energy POS Lending & PM Surya Ghar Subsidy Engine · Interactive Demo</span>
      </div>

      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 min-h-16 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shrink-0">
              GQ
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">GreenQuote India</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold ml-1 hidden sm:inline-block">
              ₹0 Dealer Fee Lending
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link
              href="/lender/dashboard"
              className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-1"
            >
              Lender Portal (NBFCs & Banks)
            </Link>
            <Link
              href="/contractor/login"
              className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-1"
            >
              Installer Sign In
            </Link>
            <Link
              href="/contractor/pipeline"
              className="text-xs sm:text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition"
            >
              Installer Pipeline
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Multi-Bank CIBIL Soft-Pull · PM Surya Ghar Instant Subsidy Netting · ₹0 Hidden Fees</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            India&apos;s Point-of-Sale Lending for Rooftop Solar & Clean Energy
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            Empower MNRE-empanelled rooftop solar installers and HVAC contractors to present Good / Better / Best quotes with
            transparent monthly EMIs in ₹, instant CIBIL soft checks, verified MNRE ALMM equipment, and automated central & state DBT subsidy netting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contractor/quote/new"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-medium shadow-sm transition"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Launch Quote Builder (₹)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              href="/quote/demo-token"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3.5 rounded-xl font-medium shadow-sm transition"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Customer Homeowner Experience</span>
            </Link>
          </div>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Portal 1: Contractor */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 font-bold text-lg">
              01
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Installer Portal</h3>
            <p className="text-sm text-slate-600 mb-6">
              Solar advisor workflows: 3-tier Good / Better / Best quote creation in ₹, verified MNRE ALMM equipment catalog,
              real-time pipeline tracking, and installation milestone submission for bank payouts.
            </p>
            <div className="space-y-2 mb-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Good / Better / Best Tier Builder</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>MNRE ALMM & BEE Star Search</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>On-Site Presentation Mode</span>
              </div>
            </div>
            <Link
              href="/contractor/pipeline"
              className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View Installer Pipeline <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link href="/contractor/onboarding" className="text-slate-600 hover:text-slate-900 font-medium">
                → GSTIN & KYB Onboarding
              </Link>
              <Link href="/contractor/quote/import" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                → AI Quotation Reader
              </Link>
            </div>
          </div>

          {/* Portal 2: Homeowner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 font-bold text-lg">
              02
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Homeowner Portal</h3>
            <p className="text-sm text-slate-600 mb-6">
              Clean consumer experience: Mobile OTP verification, transparent PM Surya Ghar subsidy deductions,
              60-second CIBIL soft-pull, and RBI Key Fact Statement (KFS) disclosures.
            </p>
            <div className="space-y-2 mb-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>CIBIL Soft-Pull (Zero Score Impact)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>SBI, Tata Capital & IREDA Offers</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Aadhaar OTP E-Sign (IT Act 2000)</span>
              </div>
            </div>
            <Link
              href="/quote/demo-token"
              className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Open Homeowner Flow <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Portal 3: Operations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">
                03
              </div>
              <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                Staff Role
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Operations Console</h3>
            <p className="text-sm text-slate-600 mb-6">
              Platform administration: Installer GSTIN & MNRE empanelment verification, fraud & price anomaly detection (&gt;2.5x regional benchmark),
              ALMM module check, and RBI regulatory audit logs.
            </p>
            <div className="space-y-2 mb-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>GSTIN & MNRE Empanelment KYB</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Fraud & Price Anomaly Queue</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>RBI Compliance & Audit Trail</span>
              </div>
            </div>
            <Link
              href="/admin/review-queue"
              className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700"
            >
              Access Operations Console <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link href="/admin/analytics" className="text-emerald-700 hover:text-emerald-800 font-semibold">
                → Executive Analytics (₹)
              </Link>
              <Link href="/admin/review-queue" className="text-slate-600 hover:text-slate-900 font-medium">
                → Review Queues
              </Link>
            </div>
          </div>

          {/* Portal 4: Lender Console */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center font-bold text-lg">
                04
              </div>
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                Partner Role
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Lender Capital Portal</h3>
            <p className="text-sm text-slate-600 mb-6">
              Bank & NBFC underwriter tools: CIBIL credit box configuration, dual-authorization 4-eyes rate sheet governance,
              and RBI cooling-off compliant milestone disbursement release.
            </p>
            <div className="space-y-2 mb-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Credit Box & ROI Rate Tiers</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Dual-Control 4-Eyes Approvals</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>eNACH & RTGS Milestone Releases</span>
              </div>
            </div>
            <Link
              href="/lender/dashboard"
              className="inline-flex items-center text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              Access Lender Portal <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link href="/lender/dashboard" className="text-emerald-700 hover:text-emerald-800 font-semibold">
                → Rate Sheets
              </Link>
              <Link href="/lender/dashboard" className="text-slate-600 hover:text-slate-900 font-medium">
                → Milestone Releases
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>GreenQuote India — Fully compliant with Reserve Bank of India (RBI) Digital Lending Guidelines 2022/2024, Information Technology Act 2000 (Aadhaar E-Sign), DPDP Act 2023, and CICRA Credit Bureau Standards.</p>
        <p className="mt-1">All rights reserved © 2026 GreenQuote Technologies India Pvt. Ltd.</p>
      </footer>
    </div>
  );
}
