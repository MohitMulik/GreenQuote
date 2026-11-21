"use client";

import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  FileText,
  BadgePercent,
  Check,
  KeyRound,
  PenTool,
  Globe,
  UserPlus,
} from "lucide-react";
import { formatCurrency, calculateEmi } from "@greenquote/shared";

const translations = {
  en: {
    installerBadge: "Verified Clean Energy Installer",
    property: "Property",
    step1: "1. Review Quote & Savings",
    step2: "2. Soft-Pull Pre-qualification",
    step3: "3. Multi-Lender Offers",
    step4: "4. Disclosures & Signing",
    selectOptionTitle: "Select Your Installation Option",
    selectOptionDesc: "All quotes include certified AHRI equipment, full professional installation, municipal permits, and warranty. Cash price and financed price are identical.",
    good: "Good",
    better: "Better",
    best: "Best",
    bestValue: "Best Value",
    rebate: "Rebate",
    massSaveRebate: "Mass Save Rebate",
    appliedAtPos: "Applied at point of sale",
    netPrice: "Net Price After Rebates",
    savingsRange: "Est. Energy Savings",
    fullCashPrice: "Full Cash Price",
    calculateFinancing: "Estimate Your Monthly Investment",
    downPayment: "Down Payment",
    financeTerm: "Financing Term",
    estimatedEmi: "Est. Monthly Payment",
    zeroDealerFees: "Zero Dealer Fees Guaranteed",
    continuePrequal: "Check Rates Without Affecting Credit",
    prequalTitle: "Soft Credit Check Pre-qualification",
    prequalDesc: "Compare personalized monthly offers from top clean energy credit unions. Zero impact on your credit score.",
    addCoApplicant: "Add Co-Applicant / Co-Signer (FR-505)",
    coApplicantDesc: "Include a household co-signer to improve qualification odds and debt-to-income ratio.",
    coApplicantName: "Co-Applicant Full Legal Name",
    coApplicantDob: "Co-Applicant Date of Birth",
    coApplicantIncome: "Co-Applicant Annual Income ($)",
    relationship: "Relationship to Primary Applicant",
    spouse: "Spouse",
    partner: "Domestic Partner",
    other: "Other Household Member",
    submitPrequal: "Submit Pre-qualification",
    backToQuote: "← Back to Quote",
  },
  es: {
    installerBadge: "Instalador de Energía Limpia Verificado",
    property: "Propiedad",
    step1: "1. Revisar Cotización y Ahorros",
    step2: "2. Precalificación Sin Impacto",
    step3: "3. Ofertas de Prestamistas",
    step4: "4. Divulgaciones y Firma",
    selectOptionTitle: "Seleccione su Opción de Instalación",
    selectOptionDesc: "Todas las cotizaciones incluyen equipos certificados por AHRI, instalación profesional, permisos municipales y garantía. El precio al contado y financiado son idénticos.",
    good: "Básico",
    better: "Mejor Valor",
    best: "Premium",
    bestValue: "Más Popular",
    rebate: "Reembolso",
    massSaveRebate: "Reembolso Estatal Mass Save",
    appliedAtPos: "Aplicado al punto de venta",
    netPrice: "Precio Neto Después de Reembolsos",
    savingsRange: "Ahorros de Energía Estimados",
    fullCashPrice: "Precio Total al Contado",
    calculateFinancing: "Calcule su Inversión Mensual",
    downPayment: "Pago Inicial",
    financeTerm: "Plazo de Financiamiento",
    estimatedEmi: "Pago Mensual Estimado",
    zeroDealerFees: "Cero Tarifas Ocultas Garantizadas",
    continuePrequal: "Ver Tasas Sin Afectar su Crédito",
    prequalTitle: "Precalificación de Crédito Blando (FR-502)",
    prequalDesc: "Compare ofertas mensuales personalizadas de las mejores cooperativas de crédito. Sin impacto en su puntaje de crédito.",
    addCoApplicant: "Agregar Co-solicitante / Co-firmante (FR-505)",
    coApplicantDesc: "Incluya los ingresos de un co-firmante para aumentar la probabilidad de aprobación.",
    coApplicantName: "Nombre Legal del Co-solicitante",
    coApplicantDob: "Fecha de Nacimiento del Co-solicitante",
    coApplicantIncome: "Ingreso Anual del Co-solicitante ($)",
    relationship: "Relación con el Solicitante Principal",
    spouse: "Cónyuge",
    partner: "Pareja Doméstica",
    other: "Otro Miembro del Hogar",
    submitPrequal: "Enviar Precalificación",
    backToQuote: "← Volver a la Cotización",
  },
};

interface Offer {
  id: string;
  lenderName: string;
  aprPct: number;
  termMonths: number;
  monthlyPayment: number;
  amountFinanced: number;
  totalCostOfCredit: number;
  contractorBuyDown: number;
}

export default function HomeownerQuotePage() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const t = translations[lang];

  // Step State: "otp" | "quote_view" | "prequal_form" | "offers" | "esign" | "completed"
  const [currentStep, setCurrentStep] = useState<
    "otp" | "quote_view" | "prequal_form" | "offers" | "esign" | "completed"
  >("quote_view");

  const [otpInput, setOtpInput] = useState("489201");
  const [selectedTier, setSelectedTier] = useState<"good" | "better" | "best">("better");
  const [downPayment, setDownPayment] = useState(2000);
  const [selectedTerm, setSelectedTerm] = useState(60);

  // Pre-qual Form State (FR-502)
  const [applicant, setApplicant] = useState({
    fullName: "Sarah Jenkins",
    phone: "+1 (617) 555-0188",
    email: "sarah@example.com",
    dateOfBirth: "1982-05-14",
    annualIncome: 110000,
    housingPayment: 2200,
    ssnLastFour: "8921",
    softPullConsent: true,
  });

  // Co-Applicant State (FR-505)
  const [hasCoApplicant, setHasCoApplicant] = useState(false);
  const [coApplicant, setCoApplicant] = useState({
    fullName: "",
    dateOfBirth: "",
    annualIncome: 0,
    relationship: "Spouse",
  });

  // Selected Offer State
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [signatureName, setSignatureName] = useState("Sarah Jenkins");
  const [tilaAcknowledged, setTilaAcknowledged] = useState(false);
  const [esignConsent, setEsignConsent] = useState(false);
  const [jobCompletionConfirmed, setJobCompletionConfirmed] = useState(false);
  const [rescissionExercised, setRescissionExercised] = useState(false);

  // Quote Data
  const quoteData = {
    contractor: {
      name: "Apex Clean Energy & HVAC LLC",
      phone: "(617) 555-0100",
      license: "MA License #CS-109283 (Active & Verified)",
    },
    property: "42 Commonwealth Ave, Boston, MA 02108",
    options: {
      good: {
        title: "Good: 15.2 SEER2 Standard Heat Pump",
        equipment: "Daikin Standard 3-Ton System",
        price: 10400,
        rebate: 4000,
        savings: "$400 - $650 / yr",
      },
      better: {
        title: "Better: Cold-Climate Hyper-Heat Pump",
        equipment: "Mitsubishi H2i Cold-Climate Heat Pump (NEEP Verified)",
        price: 15400,
        rebate: 10000, // Mass Save Whole-Home
        savings: "$900 - $1,400 / yr",
      },
      best: {
        title: "Best: Premium Geothermal Hybrid",
        equipment: "Carrier Infinity 24 Greenspeed Smart System",
        price: 20500,
        rebate: 10000,
        savings: "$1,200 - $1,800 / yr",
      },
    },
  };

  const currentOption = quoteData.options[selectedTier];
  const cashPrice = currentOption.price;
  const netAfterRebate = cashPrice - currentOption.rebate;
  const financedAmount = Math.max(0, cashPrice - downPayment);

  // Sample Multi-Lender Offers (FR-603)
  const offers: Offer[] = [
    {
      id: "ofr_1",
      lenderName: "Clean Energy Federal Credit Union",
      aprPct: 6.99,
      termMonths: 60,
      monthlyPayment: Math.round(calculateEmi({ amountFinancedMinor: financedAmount * 100, annualRatePct: 6.99, termMonths: 60 }).monthlyPaymentMinor / 100),
      amountFinanced: financedAmount,
      totalCostOfCredit: Math.round(calculateEmi({ amountFinancedMinor: financedAmount * 100, annualRatePct: 6.99, termMonths: 60 }).totalRepaymentMinor / 100),
      contractorBuyDown: 0,
    },
    {
      id: "ofr_2",
      lenderName: "Community Green Bank",
      aprPct: 7.49,
      termMonths: 84,
      monthlyPayment: Math.round(calculateEmi({ amountFinancedMinor: financedAmount * 100, annualRatePct: 7.49, termMonths: 84 }).monthlyPaymentMinor / 100),
      amountFinanced: financedAmount,
      totalCostOfCredit: Math.round(calculateEmi({ amountFinancedMinor: financedAmount * 100, annualRatePct: 7.49, termMonths: 84 }).totalRepaymentMinor / 100),
      contractorBuyDown: Math.round(financedAmount * 0.032), // ~$428 buy down paid by contractor (FR-603)
    },
    {
      id: "ofr_3",
      lenderName: "EcoFinance Specialty Point-of-Sale",
      aprPct: 9.99,
      termMonths: 120,
      monthlyPayment: Math.round(calculateEmi({ amountFinancedMinor: financedAmount * 100, annualRatePct: 9.99, termMonths: 120 }).monthlyPaymentMinor / 100),
      amountFinanced: financedAmount,
      totalCostOfCredit: Math.round(calculateEmi({ amountFinancedMinor: financedAmount * 100, annualRatePct: 9.99, termMonths: 120 }).totalRepaymentMinor / 100),
      contractorBuyDown: 0,
    },
  ].sort((a, b) => a.totalCostOfCredit - b.totalCostOfCredit); // Default sort: lowest total cost (FR-603)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Trust Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              GQ
            </div>
            <div>
              <span className="font-bold text-base block text-slate-900 leading-tight">
                {quoteData.contractor.name}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{t.installerBadge}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
              title="Toggle Language / Cambiar Idioma (FR-506)"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "en" ? "Español" : "English"}</span>
            </button>
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-500 block">{t.property}</span>
              <span className="text-xs font-semibold text-slate-800">{quoteData.property}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Flow Container */}
      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl p-3">
          <span className={currentStep === "quote_view" ? "text-emerald-700 font-bold" : ""}>
            {t.step1}
          </span>
          <span>→</span>
          <span className={currentStep === "prequal_form" ? "text-emerald-700 font-bold" : ""}>
            {t.step2}
          </span>
          <span>→</span>
          <span className={currentStep === "offers" ? "text-emerald-700 font-bold" : ""}>
            {t.step3}
          </span>
          <span>→</span>
          <span className={currentStep === "esign" || currentStep === "completed" ? "text-emerald-700 font-bold" : ""}>
            {t.step4}
          </span>
        </div>

        {/* STEP 1: QUOTE REVIEW & FINANCING ESTIMATOR */}
        {currentStep === "quote_view" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Select Your Installation Option</h2>
              <p className="text-sm text-slate-600 mb-6">
                All quotes include certified AHRI equipment, full professional installation, municipal permits, and
                warranty. Cash price and financed price are identical.
              </p>

              {/* 3 Tier Selector Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(["good", "better", "best"] as const).map((tierKey) => {
                  const opt = quoteData.options[tierKey];
                  const isSel = selectedTier === tierKey;
                  return (
                    <button
                      key={tierKey}
                      onClick={() => setSelectedTier(tierKey)}
                      className={`text-left p-4 rounded-xl border-2 transition relative ${
                        isSel
                          ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-1 ring-emerald-600"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      {tierKey === "better" && (
                        <span className="absolute -top-2.5 right-3 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Best Value
                        </span>
                      )}
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        {tierKey}
                      </span>
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{opt.title}</p>
                      <div className="text-xl font-extrabold text-slate-900 mt-2">
                        {formatCurrency(opt.price * 100, "USD")}
                      </div>
                      <div className="text-xs text-emerald-700 font-semibold mt-1">
                        -{formatCurrency(opt.rebate * 100, "USD")} Rebate
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Tier Breakdown Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-900">{currentOption.title}</h3>
                    <p className="text-xs text-slate-500">{currentOption.equipment}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase font-semibold block">Full Cash Price</span>
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(cashPrice * 100, "USD")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Mass Save Rebate</span>
                    <span className="text-sm font-bold text-emerald-600">
                      -{formatCurrency(currentOption.rebate * 100, "USD")}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Applied at point of sale</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Net Price After Rebates</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(netAfterRebate * 100, "USD")}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Total out-of-pocket</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Est. Annual Bill Savings</span>
                    <span className="text-sm font-bold text-emerald-700">{currentOption.savings}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Based on local utility tariffs</span>
                  </div>
                </div>
              </div>

              {/* Down Payment Slider */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Optional Down Payment:</label>
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(downPayment * 100, "USD")}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={cashPrice}
                  step="500"
                  value={downPayment}
                  onChange={(e) => setDownPayment(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>$0 Down</span>
                  <span>Amount to Finance: {formatCurrency(financedAmount * 100, "USD")}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setCurrentStep("prequal_form")}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition"
                >
                  <span>Check Real Loan Offers (No Impact to Credit)</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PRE-QUALIFICATION FORM (FR-502, FR-503) */}
        {currentStep === "prequal_form" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Soft Credit Inquiry · 100% Free · Score Not Affected</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Pre-Qualify in Under 60 Seconds</h2>
            <p className="text-sm text-slate-600 mb-6">
              Checking your rate queries up to 3 vetted lending partners simultaneously. No hard credit pull is
              performed until you review your formal terms and proceed.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCurrentStep("offers");
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={applicant.fullName}
                    onChange={(e) => setApplicant({ ...applicant, fullName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={applicant.dateOfBirth}
                    onChange={(e) => setApplicant({ ...applicant, dateOfBirth: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Phone (For Offers Alert)</label>
                  <input
                    type="tel"
                    required
                    value={applicant.phone}
                    onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={applicant.email}
                    onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Annual Household Income ($)</label>
                  <input
                    type="number"
                    required
                    min="10000"
                    value={applicant.annualIncome}
                    onChange={(e) => setApplicant({ ...applicant, annualIncome: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Monthly Housing Payment ($)</label>
                  <input
                    type="number"
                    required
                    value={applicant.housingPayment}
                    onChange={(e) => setApplicant({ ...applicant, housingPayment: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Social Security # (Last 4 Digits Only)</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={applicant.ssnLastFour}
                    onChange={(e) => setApplicant({ ...applicant, ssnLastFour: e.target.value })}
                    placeholder="••••"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm tracking-widest focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Co-Applicant Support (FR-505) */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">{t.addCoApplicant}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasCoApplicant}
                      onChange={(e) => setHasCoApplicant(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mb-3">{t.coApplicantDesc}</p>

                {hasCoApplicant && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">{t.coApplicantName}</label>
                        <input
                          type="text"
                          required={hasCoApplicant}
                          value={coApplicant.fullName}
                          onChange={(e) => setCoApplicant({ ...coApplicant, fullName: e.target.value })}
                          placeholder="e.g. Michael Jenkins"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">{t.coApplicantDob}</label>
                        <input
                          type="date"
                          required={hasCoApplicant}
                          value={coApplicant.dateOfBirth}
                          onChange={(e) => setCoApplicant({ ...coApplicant, dateOfBirth: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">{t.coApplicantIncome}</label>
                        <input
                          type="number"
                          required={hasCoApplicant}
                          min="0"
                          value={coApplicant.annualIncome || ""}
                          onChange={(e) => setCoApplicant({ ...coApplicant, annualIncome: parseInt(e.target.value, 10) || 0 })}
                          placeholder="85000"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">{t.relationship}</label>
                        <select
                          value={coApplicant.relationship}
                          onChange={(e) => setCoApplicant({ ...coApplicant, relationship: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Spouse">{t.spouse}</option>
                          <option value="Domestic Partner">{t.partner}</option>
                          <option value="Other">{t.other}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FCRA Soft-Pull Consent Checkbox (FR-503 / CMP-03) */}
              <div className="pt-4 border-t border-slate-200">
                <label className="flex items-start space-x-3 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={applicant.softPullConsent}
                    onChange={(e) => setApplicant({ ...applicant, softPullConsent: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>FCRA Consent & Authorization (CMP-03):</strong> By submitting, I authorize GreenQuote and its
                    designated lending partners (Clean Energy FCU, Community Green Bank, EcoFinance) to obtain my credit
                    profile via a soft credit inquiry to assess eligibility. I understand this will <strong>NOT</strong>{" "}
                    affect my credit score.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep("quote_view")}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  {t.backToQuote}
                </button>
                <button
                  type="submit"
                  disabled={!applicant.softPullConsent}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition disabled:opacity-50"
                >
                  <span>{t.submitPrequal}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: MULTI-LENDER OFFERS (FR-600, FR-603, FR-604) */}
        {currentStep === "offers" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Your Pre-Qualified Loan Offers</h2>
                  <p className="text-sm text-slate-600">
                    {offers.length} verified offers received. Default sort: <strong>Lowest Total Loan Cost</strong> (FR-603).
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600">
                  Amount Financed: <strong>{formatCurrency(financedAmount * 100, "USD")}</strong>
                </div>
              </div>

              {/* Offer Cards List */}
              <div className="mt-6 space-y-4">
                {offers.map((offer, idx) => {
                  const isTopPick = idx === 0;
                  return (
                    <div
                      key={offer.id}
                      className={`p-6 rounded-2xl border-2 transition ${
                        isTopPick
                          ? "border-emerald-600 bg-emerald-50/20 shadow-md ring-1 ring-emerald-600"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-base text-slate-900">{offer.lenderName}</h3>
                            {isTopPick && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                                Lowest Total Cost
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline space-x-4 mt-2">
                            <span className="text-2xl font-extrabold text-slate-900">
                              {formatCurrency(offer.monthlyPayment * 100, "USD")}
                              <span className="text-xs font-normal text-slate-500"> / mo</span>
                            </span>
                            <span className="text-sm font-semibold text-slate-700">
                              {offer.aprPct}% APR · {offer.termMonths} Months
                            </span>
                          </div>

                          {/* Contractor-Paid Buy-Down Line (FR-603 / CMP-12) */}
                          {offer.contractorBuyDown > 0 && (
                            <div className="mt-2 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md inline-flex items-center space-x-1">
                              <BadgePercent className="w-3.5 h-3.5" />
                              <span>Your contractor is paying ${offer.contractorBuyDown} to lower this rate</span>
                            </div>
                          )}
                        </div>

                        <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-end">
                          <div>
                            <span className="text-xs text-slate-400 font-semibold block">Total Cost of Loan</span>
                            <span className="text-sm font-bold text-slate-800">
                              {formatCurrency(offer.totalCostOfCredit * 100, "USD")}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedOffer(offer);
                              setCurrentStep("esign");
                            }}
                            className="mt-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition"
                          >
                            Select This Offer →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: TILA DISCLOSURE & E-SIGNATURE (FR-703, FR-704) */}
        {currentStep === "esign" && selectedOffer && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Review Disclosures & Sign Agreement</h2>
              <p className="text-sm text-slate-600">
                Lender: <strong>{selectedOffer.lenderName}</strong>
              </p>
            </div>

            {/* TILA Box (Truth in Lending Act Regulation Z §1026.18) (FR-703 / CMP-01) */}
            <div className="border-2 border-slate-900 rounded-xl p-5 bg-slate-50">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                FEDERAL TRUTH IN LENDING DISCLOSURES (TILA REGULATION Z)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="border border-slate-300 bg-white p-3 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">ANNUAL PERCENTAGE RATE</span>
                  <span className="text-xl font-black text-slate-900">{selectedOffer.aprPct}%</span>
                  <span className="text-[9px] text-slate-400 block">Cost of credit as yearly rate</span>
                </div>
                <div className="border border-slate-300 bg-white p-3 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">FINANCE CHARGE</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency((selectedOffer.totalCostOfCredit - selectedOffer.amountFinanced) * 100, "USD")}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Dollar amount credit will cost</span>
                </div>
                <div className="border border-slate-300 bg-white p-3 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">AMOUNT FINANCED</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(selectedOffer.amountFinanced * 100, "USD")}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Amount of credit provided</span>
                </div>
                <div className="border border-slate-300 bg-white p-3 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">TOTAL OF PAYMENTS</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(selectedOffer.totalCostOfCredit * 100, "USD")}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Total paid after all payments</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 flex justify-between">
                <span>Payment Schedule: <strong>{selectedOffer.termMonths} monthly payments of {formatCurrency(selectedOffer.monthlyPayment * 100, "USD")}</strong></span>
                <span>Prepayment Penalty: <strong>None</strong></span>
              </div>

              {/* FTC Holder in Due Course Rule Notice (16 C.F.R. §433.2 / CMP-06) */}
              <div className="mt-3 p-3 bg-white rounded-lg border border-slate-300 text-[10px] text-slate-700 leading-relaxed font-mono">
                <span className="font-bold text-slate-900 block mb-1">
                  NOTICE: PRESERVATION OF CONSUMER CLAIMS AND DEFENSES (FTC HOLDER RULE, 16 C.F.R. §433.2)
                </span>
                ANY HOLDER OF THIS CONSUMER CREDIT CONTRACT IS SUBJECT TO ALL CLAIMS AND DEFENSES WHICH THE DEBTOR COULD
                ASSERT AGAINST THE SELLER OF GOODS OR SERVICES OBTAINED PURSUANT HERETO OR WITH THE PROCEEDS HEREOF.
                RECOVERY HEREUNDER BY THE DEBTOR SHALL NOT EXCEED AMOUNTS PAID BY THE DEBTOR HEREUNDER.
              </div>
            </div>

            {/* Checkboxes for TILA Acknowledgment and E-SIGN (FR-703, FR-704) */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start space-x-3 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={tilaAcknowledged}
                  onChange={(e) => setTilaAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  I have read, reviewed, and acknowledge receipt of the Federal Truth in Lending Act (TILA)
                  disclosure above.
                </span>
              </label>

              <label className="flex items-start space-x-3 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={esignConsent}
                  onChange={(e) => setEsignConsent(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  I consent to electronic delivery of notices, agreements, and disclosures under the federal E-SIGN
                  Act.
                </span>
              </label>
            </div>

            {/* Signature Input Canvas (Active only after disclosures acknowledged) */}
            <div className={`p-5 rounded-xl border ${tilaAcknowledged && esignConsent ? "bg-white border-slate-300" : "bg-slate-100 border-slate-200 opacity-60"}`}>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 mb-2">
                <PenTool className="w-4 h-4 text-emerald-600" />
                <span>Electronic Signature (Type or Confirm Full Legal Name)</span>
              </div>
              <input
                type="text"
                disabled={!tilaAcknowledged || !esignConsent}
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full text-lg font-serif italic border-b-2 border-slate-400 bg-transparent py-2 px-1 focus:border-emerald-600 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-2">
                Signing IP: 127.0.0.1 · Signer: {applicant.fullName} · Timestamp: {new Date().toISOString()}
              </p>
            </div>

            {/* Complete E-Sign Action */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep("offers")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                ← Back to Offers
              </button>
              <button
                disabled={!tilaAcknowledged || !esignConsent || !signatureName}
                onClick={() => setCurrentStep("completed")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition disabled:opacity-50"
              >
                Sign Loan Agreement
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: COMPLETED & POST-INSTALL CONFIRMATION (FR-803) */}
        {currentStep === "completed" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Financing Approved & Agreement Signed!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                Your loan agreement with <strong>{selectedOffer?.lenderName}</strong> has been executed.
                Your contractor ({quoteData.contractor.name}) has been notified to schedule the installation.
              </p>
            </div>

            {/* Statutory Cooling-Off & Right of Rescission Box (CMP-07, CMP-08, FR-805) */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-left max-w-lg mx-auto space-y-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-purple-900">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Statutory 3-Day Right of Rescission (CMP-07 / CMP-08)</span>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                Under the Federal Trade Commission (FTC) Cooling-Off Rule and TILA Regulation Z §1026.23, you have the
                unconditional legal right to cancel this transaction without penalty until midnight of the third business day.
              </p>

              {rescissionExercised ? (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs font-semibold text-red-900">
                  <p className="font-bold">Notice of Cancellation Exercised</p>
                  <p className="text-[11px] mt-0.5 text-red-800">
                    Your financing request has been cancelled under your statutory right of rescission. No finance charges
                    will be assessed, and any security interest has been voided.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRescissionExercised(true)}
                  className="w-full bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold py-2 px-3 rounded-lg transition"
                >
                  Simulate: Exercise Right of Rescission (Cancel Loan)
                </button>
              )}
            </div>

            {/* Homeowner Completion Sign-Off Barrier Simulation (FR-803) */}
            {!rescissionExercised && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-left max-w-lg mx-auto">
                <h3 className="font-bold text-amber-900 flex items-center space-x-2 text-sm mb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Job Completion Payout Gate (FR-803)</span>
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed mb-4">
                  In strict compliance with consumer protection standards, <strong>the lender will NOT release payment</strong> to the contractor
                  until you confirm that the heat pump installation has been completed satisfactorily.
                </p>

                {jobCompletionConfirmed ? (
                  <div className="bg-emerald-100 text-emerald-800 text-xs font-bold p-3 rounded-lg flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You confirmed completion! Payout released to contractor after cooling-off period elapses.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setJobCompletionConfirmed(true)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition"
                  >
                    Confirm Job Completed & Authorize Payout Release (Simulation)
                  </button>
                )}
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={() => setCurrentStep("quote_view")}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Return to Initial Quote View
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
