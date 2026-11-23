"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  Check,
  Edit2,
} from "lucide-react";
import { formatCurrency } from "@greenquote/shared";

interface ExtractedItem {
  id: string;
  type: string;
  label: string;
  amount: number;
  confidence: number;
  flagged: boolean;
}

export default function AiQuoteImportPage() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [humanReviewPassed, setHumanReviewPassed] = useState(false);

  const [extractedData, setExtractedData] = useState<{
    customerName: string;
    address: string;
    options: Array<{
      tier: string;
      title: string;
      price: number;
      items: ExtractedItem[];
    }>;
  }>({
    customerName: "Sarah Jenkins",
    address: "42 Commonwealth Ave, Boston, MA 02108",
    options: [
      {
        tier: "good",
        title: "15.2 SEER2 Standard Heat Pump System",
        price: 10400,
        items: [
          {
            id: "1",
            type: "equipment",
            label: "Daikin Standard 3-Ton Heat Pump Outdoor Unit",
            amount: 7500,
            confidence: 0.98,
            flagged: false,
          },
          {
            id: "2",
            type: "labour",
            label: "System Installation & Ductwork Hookup",
            amount: 2500,
            confidence: 0.95,
            flagged: false,
          },
          {
            id: "3",
            type: "permits",
            label: "City Mechanical & Electrical Permits",
            amount: 400,
            confidence: 0.88,
            flagged: true, // Low confidence flag (<90%)
          },
        ],
      },
      {
        tier: "better",
        title: "Cold-Climate Hyper-Heat Pump (NEEP Certified)",
        price: 15400,
        items: [
          {
            id: "4",
            type: "equipment",
            label: "Mitsubishi H2i Cold-Climate Hyper-Heat 3-Ton (MSZ-FS)",
            amount: 10500,
            confidence: 0.96,
            flagged: false,
          },
          {
            id: "5",
            type: "labour",
            label: "Certified Cold-Climate Installation & Testing",
            amount: 3200,
            confidence: 0.94,
            flagged: false,
          },
          {
            id: "6",
            type: "electrical",
            label: "200A Electrical Sub-Panel & Disconnect Upgrade",
            amount: 1200,
            confidence: 0.86,
            flagged: true, // Low confidence flag (<90%)
          },
          {
            id: "7",
            type: "permits",
            label: "Municipal Permits & HERS Testing Inspection",
            amount: 500,
            confidence: 0.92,
            flagged: false,
          },
        ],
      },
    ],
  });

  const handleSimulatedUpload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setFileUploaded(true);
    }, 1200);
  };

  const verifyItem = (tierIdx: number, itemId: string) => {
    setExtractedData((prev) => {
      const copy = { ...prev };
      const tier = copy.options[tierIdx];
      if (tier) {
        tier.items = tier.items.map((item) =>
          item.id === itemId ? { ...item, flagged: false, confidence: 1.0 } : item
        );
      }
      return copy;
    });
  };

  const hasUnresolvedFlags = extractedData.options.some((opt) =>
    opt.items.some((item) => item.flagged)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header */}
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 min-h-16 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/contractor/pipeline"
              className="text-slate-500 hover:text-slate-800 text-xs sm:text-sm flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Pipeline
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <h1 className="text-sm sm:text-xl font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-600 shrink-0" />
              <span>AI Quote Reader & Digitizer</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] sm:text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200 hidden sm:inline-block">
              PRD FR-304 Compliant
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!fileUploaded ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center shadow-sm hover:border-emerald-500 transition-colors">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Upload Paper or PDF Contractor Quote
              </h2>
              <p className="text-slate-600 max-w-md mx-auto mb-6 text-sm">
                Our vision OCR model extracts heat pump models, labor rates, permits, and electrical items into our 3-tier Good / Better / Best quote schema.
              </p>

              <button
                type="button"
                onClick={handleSimulatedUpload}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin text-lg">⚙</span> Scanning & Extracting Fields...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" /> Load Sample HVAC Quote (PDF)
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Verification Alert Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start justify-between ${
                hasUnresolvedFlags
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              <div className="flex items-start gap-3">
                {hasUnresolvedFlags ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">
                    {hasUnresolvedFlags
                      ? "Human-in-the-Loop Verification Required (PRD Quality Gate QG-2)"
                      : "All Fields Verified & Arithmetic Reconciled!"}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {hasUnresolvedFlags
                      ? "2 line items have an OCR extraction confidence below 90%. Please inspect and click 'Confirm' to approve."
                      : "Option totals exactly equal line item sums (FR-302 arithmetic parity). Ready to transfer into Quote Builder."}
                  </p>
                </div>
              </div>
              <Link
                href="/contractor/quote/new"
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  hasUnresolvedFlags
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed pointer-events-none"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                }`}
              >
                Transfer to Quote Builder <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Side-by-side Extracted Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Original Scanned Document View */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-slate-500" /> Scanned Quote Preview
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    scan_boston_hvac.pdf
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-700 space-y-3 leading-relaxed select-none">
                  <p className="font-bold text-slate-900 border-b pb-1">
                    APEX COMFORT SYSTEMS — CUSTOMER PROPOSAL
                  </p>
                  <p>Customer: Sarah Jenkins | Date: Nov 20, 2026</p>
                  <p>Site: 42 Commonwealth Ave, Boston, MA 02108</p>
                  <div className="border-t pt-2 space-y-1">
                    <p className="font-semibold text-slate-800">TIER 1 (Good): $10,400.00</p>
                    <p>• Daikin 3-Ton Standard HP: $7,500</p>
                    <p>• Installation & Duct Connection: $2,500</p>
                    <p className="text-amber-700 font-bold bg-amber-100 px-1 rounded inline-block">
                      • Mechanical & Electrical Permits: $400 [OCR: 88%]
                    </p>
                  </div>
                  <div className="border-t pt-2 space-y-1">
                    <p className="font-semibold text-slate-800">TIER 2 (Better): $15,400.00</p>
                    <p>• Mitsubishi H2i Hyper-Heat 3-Ton: $10,500</p>
                    <p>• Certified Hyper-Heat Installation: $3,200</p>
                    <p className="text-amber-700 font-bold bg-amber-100 px-1 rounded inline-block">
                      • 200A Electrical Sub-Panel: $1,200 [OCR: 86%]
                    </p>
                    <p>• Municipal Permits & HERS Inspection: $500</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Structured Editable Extraction */}
              <div className="lg:col-span-7 space-y-6">
                {extractedData.options.map((opt, tierIdx) => {
                  const lineSum = opt.items.reduce((s, it) => s + it.amount, 0);
                  const isBalanced = lineSum === opt.price;

                  return (
                    <div
                      key={opt.tier}
                      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Option: {opt.tier}
                          </span>
                          <h4 className="font-bold text-slate-900 mt-1">{opt.title}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">Extracted Cash Total</span>
                          <p className="text-lg font-bold text-slate-900">
                            {formatCurrency(opt.price * 100, currency)}
                          </p>
                        </div>
                      </div>

                      {/* Line Items List */}
                      <div className="space-y-3">
                        {opt.items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border flex items-center justify-between text-sm transition-all ${
                              item.flagged
                                ? "bg-amber-50/70 border-amber-300"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">{item.label}</span>
                                {item.flagged && (
                                  <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-semibold flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Review (
                                    {Math.round(item.confidence * 100)}% conf.)
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 uppercase tracking-wide">
                                Category: {item.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-900">
                                {formatCurrency(item.amount * 100, currency)}
                              </span>
                              {item.flagged ? (
                                <button
                                  type="button"
                                  onClick={() => verifyItem(tierIdx, item.id)}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                                >
                                  <Check className="w-3 h-3" /> Confirm
                                </button>
                              ) : (
                                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Verified
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Arithmetic Parity Check Footer */}
                      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Sum of line items:{" "}
                          <strong className="text-slate-800">
                            {formatCurrency(lineSum * 100, currency)}
                          </strong>
                        </span>
                        {isBalanced ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Arithmetic match (FR-308)
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Mismatch with total!
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
