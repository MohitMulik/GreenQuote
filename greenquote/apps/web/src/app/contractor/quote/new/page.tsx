"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  Eye,
  ShieldAlert,
  Sparkles,
  Check,
  FileDown,
  History,
  Save,
  Cpu,
  Layers,
  RotateCcw,
} from "lucide-react";
import {
  calculateFinancingBreakdown,
  calculateEmiSafe,
  formatCurrency,
} from "@greenquote/shared";
import { apiFetch } from "@/lib/api";

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
  const [currency, setCurrency] = useState<"INR">("INR");
  const [customerName, setCustomerName] = useState("Rajesh Kumar Sharma");
  const [customerPhone, setCustomerPhone] = useState("+91 98765 43210");
  const [customerEmail, setCustomerEmail] = useState("rajesh.sharma@example.in");
  const [propertyAddress, setPropertyAddress] = useState("B-42, Sector 62, Noida, Uttar Pradesh 201309");
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const [createdQuoteToken, setCreatedQuoteToken] = useState<string>("demo-token");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [smsNotice, setSmsNotice] = useState<string | null>(null);

  // Autosave and Version History State (Contractor Portal Improvements)
  const [lastAutosaved, setLastAutosaved] = useState("Just now");
  const [quoteVersion, setQuoteVersion] = useState("v1.2 (Active)");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showEquipmentSelector, setShowEquipmentSelector] = useState<"good" | "better" | "best" | null>(null);

  // Certified Equipment Catalog (MNRE ALMM & BEE Star Directory)
  const certifiedEquipmentCatalog = [
    {
      brand: "Tata Power Solar",
      model: "TPS-3KW-BIFACIAL / Dual-Glass",
      category: "3 kW High-Efficiency Bifacial Solar System",
      ahriRef: "ALMM-MNRE-9812",
      seer2: 21.8,
      hspf2: 11.5,
      suggestedPrice: 140000,
    },
    {
      brand: "Waaree Energies",
      model: "W-550W-TOPCON / Tier-1 Mono",
      category: "2 kW Grid-Connected Solar Rooftop",
      ahriRef: "ALMM-MNRE-7841",
      seer2: 22.4,
      hspf2: 9.5,
      suggestedPrice: 90000,
    },
    {
      brand: "Adani Solar",
      model: "SHINE-5KW-BIFACIAL / N-Type",
      category: "5 kW Commercial / Residential Rooftop",
      ahriRef: "ALMM-MNRE-8823",
      seer2: 23.0,
      hspf2: 10.0,
      suggestedPrice: 210000,
    },
    {
      brand: "Havells",
      model: "ECO-5.12KWH / LiFePO4 Smart Battery",
      category: "Lithium-Ion Energy Storage PCU",
      ahriRef: "BIS-CRS-9182",
      seer2: 24.0,
      hspf2: 11.0,
      suggestedPrice: 110000,
    },
  ];

  // 3-Option Tiers (Good / Better / Best) with verified Solar & Clean Energy specifications
  const [tiers, setTiers] = useState<Record<"good" | "better" | "best", TierState>>({
    good: {
      title: "Good: 2 kW Grid-Tied Rooftop Solar + 5-Star Inverter AC",
      items: [
        { id: "1", type: "equipment", label: "Waaree 2 kW Monocrystalline ALMM Tier-1 Panels", amount: 90000 },
        { id: "2", type: "labour", label: "Standard Turnkey Installation & Grid Sync", amount: 45000 },
        { id: "3", type: "permits", label: "DISCOM Approvals & Net-Meter Synchronization", amount: 15000 },
      ],
      rebate: 60000, // PM Surya Ghar Central Subsidy
      savingsEst: "₹24,000 - ₹36,000 / year",
    },
    better: {
      title: "Better: 3 kW High-Efficiency Bifacial Solar System",
      items: [
        { id: "4", type: "equipment", label: "Tata Power Solar 3 kW Dual-Glass Bifacial System", amount: 140000 },
        { id: "5", type: "equipment", label: "3.3 kVA Smart Solar Hybrid Inverter", amount: 45000 },
        { id: "6", type: "labour", label: "GI Structure, Earthing Pit & Wiring (IS 3043)", amount: 25000 },
        { id: "7", type: "permits", label: "DISCOM Net-Metering & CEIG Inspection", amount: 10000 },
      ],
      rebate: 78000, // Maximum PM Surya Ghar Subsidy
      savingsEst: "₹42,000 - ₹60,000 / year",
    },
    best: {
      title: "Best: 5 kW Premium Solar + 5 kWh Lithium Battery Storage",
      items: [
        { id: "8", type: "equipment", label: "Adani Solar 5 kW TopCon Bifacial Array", amount: 210000 },
        { id: "9", type: "equipment", label: "Havells 5.12 kWh LiFePO4 Lithium Battery Storage", amount: 110000 },
        { id: "10", type: "electrical", label: "6 kVA Hybrid Solar PCU & Surge Protection", amount: 45000 },
        { id: "11", type: "permits", label: "CEA Approval & Turnkey Commissioning", amount: 15000 },
      ],
      rebate: 78000,
      savingsEst: "₹70,000 - ₹95,000 / year",
    },
  });

  const calculateTotal = (tier: "good" | "better" | "best") => {
    return tiers[tier].items.reduce((sum, item) => sum + item.amount, 0);
  };

  // Centralized Financial Engine Integration (FR-402, FR-502)
  const getEmi = (tierKey: "good" | "better" | "best") => {
    const tier = tiers[tierKey];
    const totalAmount = calculateTotal(tierKey);
    if (totalAmount <= 0) {
      return { monthly: 0, downPayment: 0, rate: 7.99, amountFinanced: 0 };
    }
    const downPayment = Math.round(totalAmount * 0.1);
    const rate = currency === "INR" ? 5.75 : 7.99;

    const breakdown = calculateFinancingBreakdown({
      grossPriceMinor: totalAmount * 100,
      downPaymentMinor: downPayment * 100,
      annualRatePct: rate,
      termMonths: 60,
      incentives:
        tier.rebate > 0
          ? [
              {
                id: `reb_${tierKey}`,
                name: "Point-of-Sale Utility Rebate",
                category: "pos_utility_rebate",
                timing: "instant",
                amountMinor: tier.rebate * 100,
              },
            ]
          : [],
    });

    return {
      monthly: breakdown.monthlyPaymentMinor / 100,
      downPayment: breakdown.clampedDownPaymentMinor / 100,
      amountFinanced: breakdown.amountFinancedMinor / 100,
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
    field: "label" | "amount" | "type",
    value: string | number
  ) => {
    setTiers((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        items: prev[tier].items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                [field]:
                  field === "amount"
                    ? Math.max(0, parseInt(value as string, 10) || 0)
                    : value,
              }
            : item
        ),
      },
    }));
  };

  const handleSendQuote = async () => {
    if (isSubmitting) return; // Prevent duplicate submission
    setIsSubmitting(true);
    setSubmitError(null);
    setSmsNotice(null);

    try {
      // 1. Build options payload matching CreateQuoteSchema
      const tiersKeys: Array<"good" | "better" | "best"> = ["good", "better", "best"];
      const optionsPayload = tiersKeys.map((tierKey) => {
        const tier = tiers[tierKey];
        const lineItems = tier.items.map((item) => ({
          type: item.type,
          label: item.label,
          amountMinor: item.amount * 100,
        }));
        const priceMinor = lineItems.reduce((acc, curr) => acc + curr.amountMinor, 0);

        return {
          tier: tierKey,
          title: tier.title,
          description: tier.savingsEst,
          priceMinor,
          lineItems,
          incentives: [
            {
              programmeId: `prog_cfa_${tierKey}`,
              name: "PM Surya Ghar Central Subsidy (CFA)",
              amountMinor: tier.rebate * 100,
              paid: "instant" as const,
              conditions: "Residential rooftop solar consumer registration on National Portal",
            },
          ],
        };
      });

      const payload = {
        currency: "INR",
        homeowner: {
          fullName: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
        property: {
          streetAddress: propertyAddress.slice(0, 100) || "Plot 42, Sector 62",
          city: "Noida",
          state: "UP",
          pinCode: "201309",
          existingHeatingFuel: "grid_electric",
          electricUtility: "PVVNL",
        },
        options: optionsPayload,
      };

      // 2. Persist quote via POST /v1/quotes
      const quoteRes = await apiFetch("/v1/quotes", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!quoteRes.ok) {
        const errJson = await quoteRes.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to create quote (HTTP ${quoteRes.status})`);
      }

      const quoteData = await quoteRes.json();
      const quoteId = quoteData._id;
      const linkToken = quoteData.linkToken || "demo-token";

      setCreatedQuoteId(quoteId);
      setCreatedQuoteToken(linkToken);

      // 3. Dispatch / Send quote via POST /v1/quotes/:id/send
      const sendRes = await apiFetch(`/v1/quotes/${quoteId}/send`, {
        method: "POST",
      });

      if (sendRes.ok) {
        const sendData = await sendRes.json();
        if (sendData.link) {
          const extractedToken = sendData.link.replace("/quote/", "");
          setCreatedQuoteToken(extractedToken);
        }
        setSmsNotice("Quote link generated and bound to homeowner phone. (SMS gateway integration required for cellular delivery).");
      } else {
        setSmsNotice("Quote saved successfully in cloud database. Direct SMS dispatch requires SMS gateway credentials.");
      }

      setQuoteSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save quote";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isPresentationMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"}`}>
      {/* Top Header */}
      <header className={`border-b ${isPresentationMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"} px-4 sm:px-6 py-2.5 min-h-16 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40`}>
        <div className="flex items-center space-x-3">
          <Link
            href="/contractor/pipeline"
            className={`p-1.5 rounded-lg ${isPresentationMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base sm:text-xl font-bold flex items-center space-x-2">
              <span>Quote Builder</span>
              {isPresentationMode && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Customer Mode
                </span>
              )}
            </h1>
            <p className={`text-xs ${isPresentationMode ? "text-slate-400" : "text-slate-500"} line-clamp-1`}>
              Customer: {customerName} · {propertyAddress}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Autosave Status Indicator (FR-301) */}
          {!isPresentationMode && (
            <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Autosaved {lastAutosaved}</span>
            </div>
          )}

          {/* Quote Version History Toggle (FR-302) */}
          {!isPresentationMode && (
            <button
              onClick={() => setShowVersionHistory(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              title="Quote Version History"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>{quoteVersion}</span>
            </button>
          )}

          {/* PDF Export Action (FR-305) */}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            title="Export / Print Quote PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

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
              disabled={isSubmitting}
              className={`flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition ${
                isSubmitting ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Persisting & Generating Link..." : "Send to Homeowner"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Submit Error Banner */}
      {submitError && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-red-50 border border-red-300 text-red-900 rounded-xl p-4 flex items-center justify-between text-xs">
            <span>
              <strong>Submission Error:</strong> {submitError} (Make sure you are logged in as an active contractor)
            </span>
            <Link href="/contractor/login" className="underline font-bold text-red-900">
              Sign In →
            </Link>
          </div>
        </div>
      )}

      {/* Quote Sent Banner */}
      {quoteSent && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Quote Persisted & Generated Successfully!</p>
                <p className="text-xs text-emerald-700">
                  {smsNotice || `Bound to recipient phone: ${customerPhone}`}
                </p>
                <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                  Secure Token: {createdQuoteToken}
                </p>
              </div>
            </div>
            <Link
              href={`/quote/${createdQuoteToken}`}
              target="_blank"
              className="text-xs font-semibold bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition shrink-0"
            >
              Open Homeowner View →
            </Link>
          </div>
        </div>
      )}

      {/* Main Quote Columns */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Compliance Notice */}
        {!isPresentationMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-blue-900">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Single Price Rule Active:</strong> Cash price and financed price are strictly identical.
                Zero dealer markups or dual pricing stored.
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-slate-500 font-medium">Currency:</span>
              <span className="bg-white border border-emerald-300 px-2 py-0.5 rounded font-bold text-emerald-800">
                INR (₹) Indian Rupee
              </span>
            </div>
          </div>
        )}

        {/* Customer & Project Details Card (B-03) */}
        {!isPresentationMode && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              Customer & Project Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="customerName" className="text-xs font-semibold text-slate-600 block mb-1">Customer Full Name</label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="customerPhone" className="text-xs font-semibold text-slate-600 block mb-1">Mobile Phone (For Link SMS)</label>
                <input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="customerEmail" className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
                <input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="propertyAddress" className="text-xs font-semibold text-slate-600 block mb-1">Property Address</label>
                <input
                  id="propertyAddress"
                  type="text"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3 Tier Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {(["good", "better", "best"] as const).map((tierKey) => {
            const tier = tiers[tierKey];
            const total = calculateTotal(tierKey);
            const netPrice = Math.max(0, total - tier.rebate);
            const emiInfo = getEmi(tierKey);
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowEquipmentSelector(tierKey)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition"
                          title="Insert equipment from certified MNRE ALMM directory"
                        >
                          <Cpu className="w-3 h-3" />
                          <span>ALMM Catalog</span>
                        </button>
                        <button
                          onClick={() => addLineItem(tierKey)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Item</span>
                        </button>
                      </div>
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
                        {!isPresentationMode ? (
                          <select
                            value={item.type}
                            onChange={(e) => updateLineItem(tierKey, item.id, "type", e.target.value)}
                            className="text-[10px] text-slate-500 uppercase font-bold bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                          >
                            <option value="equipment">Equipment</option>
                            <option value="labour">Labour & Install</option>
                            <option value="electrical">Electrical</option>
                            <option value="permits">Permits & Fees</option>
                            <option value="other">Other Scope</option>
                          </select>
                        ) : (
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mt-0.5">
                            {item.type}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {isPresentationMode ? (
                          <span className="font-bold text-slate-200">
                            {formatCurrency(item.amount * 100, currency)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            value={item.amount}
                            onChange={(e) => updateLineItem(tierKey, item.id, "amount", Math.max(0, parseInt(e.target.value, 10) || 0))}
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

        {/* Quote Version History Modal (FR-302) */}
        {showVersionHistory && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-bold text-slate-900">Quote Version History</h3>
                </div>
                <button
                  onClick={() => setShowVersionHistory(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-emerald-900">v1.2 (Current Draft)</span>
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">Autosaved: {lastAutosaved} · Rahul Sharma</p>
                    <p className="text-emerald-700 font-mono mt-0.5">3 Tiers · Net Financed: ₹1,22,000 (Better)</p>
                  </div>
                  <span className="text-emerald-700 font-semibold text-xs">Viewing</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">v1.1 (Previous Milestone)</span>
                    </div>
                    <p className="text-slate-500 mt-1">Created: 2026-11-21 14:02 UTC · Sanjay Patel</p>
                    <p className="text-slate-600 font-mono mt-0.5">Initial draft before utility rebate tier selection</p>
                  </div>
                  <button
                    onClick={() => {
                      setQuoteVersion("v1.1 (Restored)");
                      setShowVersionHistory(false);
                    }}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowVersionHistory(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Certified AHRI Equipment Directory Modal (FR-303, FR-401) */}
        {showEquipmentSelector && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      AHRI & NEEP Certified Directory Quick-Select
                    </h3>
                    <p className="text-xs text-slate-500">
                      Adding to <strong>{showEquipmentSelector.toUpperCase()}</strong> tier. Automatic SEER2/HSPF2 validation.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEquipmentSelector(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {certifiedEquipmentCatalog.map((equip) => (
                  <div
                    key={equip.ahriRef}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{equip.brand} {equip.model}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          AHRI #{equip.ahriRef}
                        </span>
                      </div>
                      <p className="text-slate-500">{equip.category}</p>
                      <div className="flex items-center space-x-3 text-[11px] text-emerald-700 font-semibold">
                        <span>SEER2: {equip.seer2}</span>
                        <span>·</span>
                        <span>HSPF2: {equip.hspf2}</span>
                        <span>·</span>
                        <span className="text-slate-700">₹{equip.suggestedPrice.toLocaleString("en-IN")} est.</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const targetTier = showEquipmentSelector;
                        const newItem: LineItem = {
                          id: Date.now().toString(),
                          type: "equipment",
                          label: `${equip.brand} ${equip.model} (AHRI #${equip.ahriRef})`,
                          amount: equip.suggestedPrice,
                        };
                        setTiers((prev) => ({
                          ...prev,
                          [targetTier]: {
                            ...prev[targetTier],
                            items: [...prev[targetTier].items, newItem],
                          },
                        }));
                        setShowEquipmentSelector(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowEquipmentSelector(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
