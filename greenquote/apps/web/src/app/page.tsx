import Link from "next/link";
import { ShieldCheck, Zap, ArrowRight, FileText, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Demo Disclosure Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-900 font-medium">
        <span>GreenQuote Interactive Demo & Sandbox · Production FinTech Architecture Preview</span>
      </div>

      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 min-h-16 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shrink-0">
              GQ
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">GreenQuote</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold ml-1 hidden sm:inline-block">
              Embedded Lending
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link
              href="/lender/dashboard"
              className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-1"
            >
              Lender Portal
            </Link>
            <Link
              href="/contractor/login"
              className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-1"
            >
              Contractor Sign In
            </Link>
            <Link
              href="/contractor/pipeline"
              className="text-xs sm:text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition"
            >
              Open Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Multi-Lender Soft-Pull Engine · Capped Buy-Down · 0% Hidden Dealer Fees</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Clean Energy Financing Embedded Directly in the Contractor Quote
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            Empower HVAC and solar installers to present Good / Better / Best quotes with transparent monthly
            payments, instant soft credit checks, verified AHRI equipment, and automated rebate stacking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contractor/quote/new"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-medium shadow-sm transition"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Launch Quote Builder</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              href="/quote/demo-token"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3.5 rounded-xl font-medium shadow-sm transition"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Homeowner Demo Experience</span>
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
            <h3 className="text-xl font-bold text-slate-900 mb-2">Contractor Portal</h3>
            <p className="text-sm text-slate-600 mb-6">
              Comfort advisor workflows: 3-tier Good / Better / Best quote creation, verified equipment catalog,
              real-time pipeline tracking, and installation milestone submission.
            </p>
            <div className="space-y-2 mb-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Good / Better / Best Builder</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Sub-500ms AHRI Search</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>In-Home Presentation Mode</span>
              </div>
            </div>
            <Link
              href="/contractor/pipeline"
              className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View Pipeline Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link href="/contractor/onboarding" className="text-slate-600 hover:text-slate-900 font-medium">
                → KYB Onboarding
              </Link>
              <Link href="/contractor/quote/import" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                → AI Quote Reader
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
              Clean consumer experience: Passwordless one-time verification, transparent rebate deductions,
              60-second soft-pull credit check, and TILA disclosures.
            </p>
            <div className="space-y-2 mb-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Soft-Pull (0 Credit Score Impact)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Multi-Lender Comparison</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Mobile E-Signature & Sign-off</span>
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
              Platform administration: Contractor KYB verification, fraud & price anomaly detection (&gt;2.5x median),
              equipment model verification, and 7-year audit logs.
            </p>
            <div className="space-y-2 mb-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>KYB & License Verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Fraud & Compliance Review Queue</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Immutable Regulatory Audit Trail</span>
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
                → Executive Analytics
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
              Credit union & underwriter tools: Soft-pull credit boxes, dual-authorization 4-eyes rate governance,
              and statutory cooling-off milestone disbursement release.
            </p>
            <div className="space-y-2 mb-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Credit Box & Rate Tiers</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Dual-Control 4-Eyes Changes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>3-Day Rescission Payout Gates</span>
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
                → Milestone Draws
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>GreenQuote Platform — Compliant with TILA (Reg Z), ECOA (Reg B), FCRA, GLBA, and E-SIGN standards.</p>
        <p className="mt-1">All rights reserved © 2026</p>
      </footer>
    </div>
  );
}
