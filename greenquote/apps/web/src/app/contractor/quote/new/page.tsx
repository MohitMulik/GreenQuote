"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Send, Eye, ShieldAlert, Sparkles, Check } from "lucide-react";
import { calculateEmi, formatCurrency } from "@greenquote/shared";

interface LineItem {
  id: string;
  type: "equipment" | "labour" | "electrical" | "permits" | "other";
  label: string;
  amount: number;
}

interface TierState {
  title: string;
  items: LineItem[];
  rebate: number;
  savingsEst: string;
}

export default function QuoteBuilderPage() {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [customerName, setCustomerName] = useState("Sarah Jenkins");
  const [customerPhone, setCustomerPhone] = useState("+1 (617) 555-0188");
  const [customerEmail, setCustomerEmail] = useState("sarah@example.com");
  const [propertyAddress, setPropertyAddress] = useState("42 Commonwealth Ave, Boston, MA 02108");
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);

  // 3-Option Tiers (Good / Better / Best) (FR-301)
  const [tiers, setTiers] = useState<Record<"good" | "better" | "best", TierState>>({
    good: {
      title: "Good: 15.2 SEER2 Standard Heat Pump",
      items: [
        { id: "1", type: "equipment", label: "Daikin Standard Heat Pump 3-Ton", amount: 7500 },
        { id: "2", type: "labour", label: "Standard Installation & Duct Connection", amount: 2500 },
        { id: "3", type: "permits", label: "City Permits & Disposal", amount: 400 },
      ],
      rebate: 4000, // Mass Save
      savingsEst: "$400 - $650 / year",
    },
    better: {
      title: "Better: Cold-Climate High-Efficiency Heat Pump",
      items: [
        { id: "4", type: "equipment", label: "Mitsubishi H2i Cold-Climate 3-Ton (MSZ-FS)", amount: 10500 },
        { id: "5", type: "labour", label: "Certified Hyper-Heat Installation", amount: 3200 },
        { id: "6", type: "electrical", label: "200A Electrical Sub-Panel Upgrade", amount: 1200 },
        { id: "7", type: "permits", label: "City Permits & Inspection", amount: 500 },
      ],
      rebate: 10000, // Whole-home Mass Save
      savingsEst: "$900 - $1,400 / year",
    },
    best: {
      title: "Best: Premium Geothermal / Solar-Ready Hybrid",
      items: [
        { id: "8", type: "equipment", label: "Carrier Infinity 24 Greenspeed Heat Pump", amount: 13500 },
        { id: "9", type: "labour", label: "Master Craftsman Installation & Zoning", amount: 4500 },
        { id: "10", type: "electrical", label: "Smart Energy Monitoring Panel", amount: 1800 },
        { id: "11", type: "permits", label: "Permits, Testing & HERS Rating", amount: 700 },
      ],
      rebate: 10000,
      savingsEst: "$1,200 - $1,800 / year",
    },
  });

  const calculateTotal = (tier: "good" | "better" | "best") => {
    return tiers[tier].items.reduce((sum, item) => sum + item.amount, 0);
  };

  const getEmi = (totalAmount: number) => {
    const downPayment = Math.round(totalAmount * 0.1);
    const financed = totalAmount - downPayment;
    const rate = currency === "INR" ? 5.75 : 7.99;
    const emi = calculateEmi({
      amountFinancedMinor: financed * 100,
      annualRatePct: rate,
      termMonths: 60,
    });
    return {
      monthly: emi.monthlyPaymentMinor / 100,
      downPayment,
      rate,
    };
  };

  const addLineItem = (tier: "good" | "better" | "best") => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      type: "equipment",
      label: "New Line Item",
      amount: 1000,
    };
    setTiers((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        items: [...prev[tier].items, newItem],
      },
    }));
  };

  const removeLineItem = (tier: "good" | "better" | "best", itemId: string) => {
    setTiers((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        items: prev[tier].items.filter((i) => i.id !== itemId),
      },
    }));
  };

  const updateLineItem = (
    tier: "good" | "better" | "best",
    itemId: string,
    field: "label" | "amount",
    value: string | number
  ) => {
    setTiers((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        items: prev[tier].items.map((i) =>
          i.id === itemId ? { ...i, [field]: value } : i
        ),
      },
    }));
  };

  const handleSendQuote = () => {
    setQuoteSent(true);
  };

  return (
    <div className={`min-h-screen ${isPresentationMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
      {/* Top Header */}
      <header className={`border-b ${isPresentationMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"} px-6 py-4 flex items-center justify-between sticky top-0 z-40`}>
        <div className="flex items-center space-x-4">
          <Link
            href="/contractor/pipeline"
            className={`p-2 rounded-lg ${isPresentationMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center space-x-2">
              <span>Good / Better / Best Quote Builder</span>
              {isPresentationMode && (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Customer Presentation Mode
                </span>
              )}
            </h1>
            <p className={`text-xs ${isPresentationMode ? "text-slate-400" : "text-slate-500"}`}>
              Customer: {customerName} · {propertyAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
              isPresentationMode
                ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isPresentationMode ? "Exit Presentation" : "In-Home Presentation"}</span>
          </button>

          {!isPresentationMode && (
            <button
              onClick={handleSendQuote}
              className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition"
            >
              <Send className="w-4 h-4" />
              <span>Send to Homeowner</span>
            </button>
          )}
        </div>
      </header>

      {/* Quote Sent Banner */}
      {quoteSent && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-bold">Quote Link Sent Successfully!</p>
                <p className="text-xs text-emerald-700">
                  SMS and Email dispatched to {customerPhone}. Secure OTP access enabled.
                </p>
              </div>
            </div>
            <Link
              href="/quote/demo-token"
              className="text-xs font-semibold bg-emerald-700 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-800 transition"
            >
              Open Homeowner View →
            </Link>
          </div>
        </div>
      )}

      {/* Main Quote Columns */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Compliance Tag (FR-308) */}
        {!isPresentationMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-8 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Single Price Rule Active (FR-308):</strong> Cash price and financed price are strictly identical.
                No dealer markups or dual pricing stored.
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Currency:</span>
              <button
                onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")}
                className="bg-white border border-blue-300 px-2 py-0.5 rounded font-bold text-blue-700"
              >
                {currency}
              </button>
            </div>
          </div>
        )}

        {/* 3 Tier Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {(["good", "better", "best"] as const).map((tierKey) => {
            const tier = tiers[tierKey];
            const total = calculateTotal(tierKey);
            const netPrice = Math.max(0, total - tier.rebate);
            const emiInfo = getEmi(total);
            const isHighlighted = tierKey === "better";

            return (
              <div
                key={tierKey}
                className={`rounded-2xl border transition relative flex flex-col ${
                  isHighlighted
                    ? isPresentationMode
                      ? "border-emerald-500 bg-slate-800/80 shadow-2xl ring-2 ring-emerald-500"
                      : "border-brand-500 bg-white shadow-xl ring-2 ring-brand-500"
                    : isPresentationMode
                    ? "border-slate-800 bg-slate-800/40"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                {/* Popular Badge on "Better" Tier */}
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Recommended Value</span>
                  </div>
                )}

                {/* Card Header */}
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {tierKey.toUpperCase()} TIER
                  </h3>
                  <input
                    type="text"
                    disabled={isPresentationMode}
                    value={tier.title}
                    onChange={(e) =>
                      setTiers({
                        ...tiers,
                        [tierKey]: { ...tier, title: e.target.value },
                      })
                    }
                    className={`text-lg font-bold w-full bg-transparent border-0 p-0 focus:ring-0 ${
                      isPresentationMode ? "text-white" : "text-slate-900"
                    }`}
                  />

                  {/* Cash Price Display */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-semibold">Total Price</span>
                      <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {formatCurrency(total * 100, currency)}
                      </div>
                    </div>
                    {tier.rebate > 0 && (
                      <div className="text-right">
                        <span className="text-xs text-emerald-600 font-semibold block">Rebates Applied</span>
                        <span className="text-sm font-bold text-emerald-600">
                          -{formatCurrency(tier.rebate * 100, currency)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Net Price after incentives */}
                  <div className="mt-2 bg-slate-50 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Net Price After Rebates:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatCurrency(netPrice * 100, currency)}
                    </span>
                  </div>

                  {/* Example EMI Box (CMP-01 compliant) */}
                  <div className="mt-4 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-800">Estimated Monthly</span>
                      <span className="text-xs text-slate-500">10% down, 60 mos</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-700 mt-0.5">
                      {formatCurrency(Math.round(emiInfo.monthly * 100), currency)}
                      <span className="text-xs font-medium text-slate-500"> / month</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Example based on {emiInfo.rate}% APR for 60 months. Subject to lender approval.
                    </p>
                  </div>
                </div>

                {/* Line Items List */}
                <div className="p-6 flex-1 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Scope of Work ({tier.items.length})
                    </span>
                    {!isPresentationMode && (
                      <button
                        onClick={() => addLineItem(tierKey)}
                        className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Item</span>
                      </button>
                    )}
                  </div>

                  {tier.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-sm flex items-center justify-between ${
                        isPresentationMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50/60 border-slate-200"
                      }`}
                    >
                      <div className="flex-1 mr-2">
                        {isPresentationMode ? (
                          <span className="font-medium text-slate-200">{item.label}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateLineItem(tierKey, item.id, "label", e.target.value)}
                            className="w-full bg-transparent border-0 p-0 text-sm font-medium focus:ring-0 text-slate-800"
                          />
                        )}
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mt-0.5">
                          {item.type}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isPresentationMode ? (
                          <span className="font-bold text-slate-200">
                            {formatCurrency(item.amount * 100, currency)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateLineItem(tierKey, item.id, "amount", parseFloat(e.target.value) || 0)}
                            className="w-20 text-right bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-brand-500"
                          />
                        )}
                        {!isPresentationMode && (
                          <button
                            onClick={() => removeLineItem(tierKey, item.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Savings Projection (AI-02) */}
                <div className={`p-4 border-t text-xs rounded-b-2xl ${isPresentationMode ? "border-slate-800 bg-slate-800/20" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Est. Annual Energy Savings:</span>
                    <span className="font-bold text-emerald-600">{tier.savingsEst}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
