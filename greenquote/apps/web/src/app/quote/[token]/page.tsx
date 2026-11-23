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
import {
  formatCurrency,
  calculateEmi,
  calculateEmiSafe,
  calculateFinancingBreakdown,
  IncentiveItem,
} from "@greenquote/shared";

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
    addCoApplicant: "Add Co-Applicant / Co-Signer",
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
    prequalTitle: "Precalificación de Crédito Blando",
    prequalDesc: "Compare ofertas mensuales personalizadas de las mejores cooperativas de crédito. Sin impacto en su puntaje de crédito.",
    addCoApplicant: "Agregar Co-solicitante / Co-firmante",
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
  monthlyPaymentMinor: number;
  amountFinancedMinor: number;
  totalCostOfCreditMinor: number;
  totalInterestMinor: number;
  contractorBuyDownMinor: number;
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
  const [downPayment, setDownPayment] = useState(1000);
  const [selectedTerm, setSelectedTerm] = useState(60);

  // Pre-qual Form State - Affirmative consent required (L-01)
  const [applicant, setApplicant] = useState({
    fullName: "Sarah Jenkins",
    phone: "+1 (617) 555-0188",
    email: "sarah@example.com",
    dateOfBirth: "1982-05-14",
    annualIncome: 110000,
    housingPayment: 2200,
    ssnLastFour: "8921",
    softPullConsent: false, // Must be unchecked by default (FCRA §604)
  });

  // Co-Applicant State
  const [hasCoApplicant, setHasCoApplicant] = useState(false);
  const [coApplicant, setCoApplicant] = useState({
    fullName: "",
    dateOfBirth: "",
    annualIncome: 0,
    relationship: "Spouse",
  });

  // Selected Offer State - Signature must start empty (L-02)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [tilaAcknowledged, setTilaAcknowledged] = useState(false);
  const [esignConsent, setEsignConsent] = useState(false);
  const [jobCompletionConfirmed, setJobCompletionConfirmed] = useState(false);
  const [rescissionExercised, setRescissionExercised] = useState(false);

  // Quote Data with accurate HVAC domain specifications and verified incentive classifications
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
        equipment: "Daikin Fit 3-Ton Inverter Heat Pump System",
        priceMinor: 1040000, // $10,400
        incentives: [
          {
            id: "inc_good_utility",
            name: "Utility Instant Equipment Rebate",
            amountMinor: 400000, // $4,000 POS instant rebate
            category: "pos_utility_rebate" as const,
            timing: "instant" as const,
          },
        ] as IncentiveItem[],
        savings: "$400 - $650 / yr",
      },
      better: {
        title: "Better: Cold-Climate Hyper-Heat Pump",
        equipment: "Mitsubishi Electric H2i Cold-Climate 3-Ton System (PUZ-HA36 / SVZ-KP36)",
        priceMinor: 1540000, // $15,400
        incentives: [
          {
            id: "inc_better_mass_save",
            name: "Mass Save Whole-Home Heat Pump Rebate",
            amountMinor: 1000000, // $10,000 POS instant utility rebate
            category: "pos_utility_rebate" as const,
            timing: "instant" as const,
          },
          {
            id: "inc_better_ira_25c",
            name: "IRA Section 25C Energy Efficiency Tax Credit",
            amountMinor: 200000, // $2,000 future federal tax credit
            category: "federal_tax_credit" as const,
            timing: "after_installation" as const,
          },
        ] as IncentiveItem[],
        savings: "$900 - $1,400 / yr",
      },
      best: {
        title: "Best: Premium High-Efficiency Variable Heat Pump",
        equipment: "Carrier Infinity 24 Greenspeed Air-Source Heat Pump",
        priceMinor: 2050000, // $20,500
        incentives: [
          {
            id: "inc_best_mass_save",
            name: "Mass Save Whole-Home Heat Pump Rebate",
            amountMinor: 1000000, // $10,000 POS instant rebate
            category: "pos_utility_rebate" as const,
            timing: "instant" as const,
          },
          {
            id: "inc_best_ira_25c",
            name: "IRA Section 25C Energy Efficiency Tax Credit",
            amountMinor: 200000, // $2,000 future federal tax credit
            category: "federal_tax_credit" as const,
            timing: "after_installation" as const,
          },
        ] as IncentiveItem[],
        savings: "$1,200 - $1,800 / yr",
      },
    },
  };

  const currentOption = quoteData.options[selectedTier];
  const cashPrice = currentOption.priceMinor / 100;

  // Centralized Financial Engine: calculate initial breakdown
  const financingBreakdown = calculateFinancingBreakdown({
    grossPriceMinor: currentOption.priceMinor,
    downPaymentMinor: downPayment * 100,
    incentives: currentOption.incentives,
    annualRatePct: 6.99,
    termMonths: 60,
  });

  // Clamped down payment to ensure at least $5 remains financed for loan calculations
  const maxDownPayment = Math.max(0, Math.floor(financingBreakdown.netInvoiceMinor / 100) - 5);
  const clampedDownPayment = Math.min(downPayment, maxDownPayment);

  // Multi-Lender Offers computed safely with cent-level precision using centralized engine
  const calc1 = calculateFinancingBreakdown({
    grossPriceMinor: currentOption.priceMinor,
    downPaymentMinor: clampedDownPayment * 100,
    incentives: currentOption.incentives,
    annualRatePct: 6.99,
    termMonths: 60,
  });

  const calc2 = calculateFinancingBreakdown({
    grossPriceMinor: currentOption.priceMinor,
    downPaymentMinor: clampedDownPayment * 100,
    incentives: currentOption.incentives,
    annualRatePct: 5.49, // Subsidized rate reflects lower APR than standard (M-05)
    termMonths: 84,
    contractorBuyDownPct: 3.2,
  });

  const calc3 = calculateFinancingBreakdown({
    grossPriceMinor: currentOption.priceMinor,
    downPaymentMinor: clampedDownPayment * 100,
    incentives: currentOption.incentives,
    annualRatePct: 8.99,
    termMonths: 120,
  });

  const offers: Offer[] = [
    {
      id: "ofr_1",
      lenderName: "Clean Energy Federal Credit Union",
      aprPct: 6.99,
      termMonths: 60,
      monthlyPaymentMinor: calc1.monthlyPaymentMinor,
      amountFinancedMinor: calc1.amountFinancedMinor,
      totalCostOfCreditMinor: calc1.totalPaymentsMinor,
      totalInterestMinor: calc1.financeChargeMinor,
      contractorBuyDownMinor: 0,
    },
    {
      id: "ofr_2",
      lenderName: "Community Green Bank",
      aprPct: 5.49,
      termMonths: 84,
      monthlyPaymentMinor: calc2.monthlyPaymentMinor,
      amountFinancedMinor: calc2.amountFinancedMinor,
      totalCostOfCreditMinor: calc2.totalPaymentsMinor,
      totalInterestMinor: calc2.financeChargeMinor,
      contractorBuyDownMinor: calc2.contractorBuyDownMinor,
    },
    {
      id: "ofr_3",
      lenderName: "EcoFinance Clean Energy Lending",
      aprPct: 8.99,
      termMonths: 120,
      monthlyPaymentMinor: calc3.monthlyPaymentMinor,
      amountFinancedMinor: calc3.amountFinancedMinor,
      totalCostOfCreditMinor: calc3.totalPaymentsMinor,
      totalInterestMinor: calc3.financeChargeMinor,
      contractorBuyDownMinor: 0,
    },
  ].sort((a, b) => a.totalCostOfCreditMinor - b.totalCostOfCreditMinor);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Demonstration Platform Notice (P-01, P-02) */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2 text-center text-xs border-b border-slate-800">
        <span className="font-semibold text-emerald-400">GreenQuote Interactive Demo:</span> Simulated residential clean energy pre-qualification and quotes. No real credit inquiry or financial obligation is incurred.
      </div>

      {/* Trust Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-2.5 min-h-16 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              GQ
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base block text-slate-900 leading-tight">
                {quoteData.contractor.name}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{t.installerBadge}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
              title="Toggle Language / Cambiar Idioma"
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
      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-6 sm:pt-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between gap-1 mb-6 sm:mb-8 text-[11px] sm:text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 overflow-x-auto whitespace-nowrap scrollbar-none">
          <span className={currentStep === "quote_view" ? "text-emerald-700 font-bold" : ""}>
            {t.step1}
          </span>
          <span className="text-slate-300">→</span>
          <span className={currentStep === "prequal_form" ? "text-emerald-700 font-bold" : ""}>
            {t.step2}
          </span>
          <span className="text-slate-300">→</span>
          <span className={currentStep === "offers" ? "text-emerald-700 font-bold" : ""}>
            {t.step3}
          </span>
          <span className="text-slate-300">→</span>
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
                        {formatCurrency(opt.priceMinor, "USD")}
                      </div>
                      <div className="text-xs text-emerald-700 font-semibold mt-1">
                        -{formatCurrency(opt.incentives.filter(i => i.timing === "instant").reduce((s, i) => s + i.amountMinor, 0), "USD")} Instant Rebate
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Tier Breakdown Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{currentOption.title}</h3>
                    <p className="text-xs text-slate-500">{currentOption.equipment}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs text-slate-400 uppercase font-semibold block">Full Cash Price</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      {formatCurrency(financingBreakdown.grossPriceMinor, "USD")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Instant Utility Rebate (POS)</span>
                    <span className="text-sm font-bold text-emerald-600">
                      -{formatCurrency(financingBreakdown.posRebatesMinor, "USD")}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Deducted upfront from invoice</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Net Invoice Balance</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(financingBreakdown.netInvoiceMinor, "USD")}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Payable via down payment / loan</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Est. Annual Bill Savings</span>
                    <span className="text-sm font-bold text-emerald-700">{currentOption.savings}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Based on local utility tariffs</span>
                  </div>
                </div>

                {/* Future Tax Credit Transparency Card */}
                {financingBreakdown.taxCreditsMinor > 0 && (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 text-xs flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900 block">
                        Additional Federal Tax Credit: {formatCurrency(financingBreakdown.taxCreditsMinor, "USD")} (IRA Section 25C)
                      </span>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Claimed on your annual federal tax return (IRS Form 5695). Under federal lending standards, this future credit does <strong>not</strong> reduce your point-of-sale invoice or loan principal today.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Down Payment Slider with Dynamic Safe Clamping (B-01, M-01) */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="downPaymentSlider" className="text-sm font-semibold text-slate-700">Optional Down Payment:</label>
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(clampedDownPayment * 100, "USD")}
                  </span>
                </div>
                <input
                  id="downPaymentSlider"
                  type="range"
                  min="0"
                  max={maxDownPayment}
                  step="250"
                  value={clampedDownPayment}
                  onChange={(e) => setDownPayment(parseInt(e.target.value, 10) || 0)}
                  className="w-full accent-emerald-600 cursor-pointer"
                  aria-valuemin={0}
                  aria-valuemax={maxDownPayment}
                  aria-valuenow={clampedDownPayment}
                  aria-valuetext={formatCurrency(clampedDownPayment * 100, "USD")}
                />
                <div className="flex flex-col sm:flex-row sm:justify-between text-[11px] text-slate-500 mt-1 gap-1">
                  <span>$0 Down</span>
                  <span>Amount to Finance: <strong>{formatCurrency(calc1.amountFinancedMinor, "USD")}</strong> (Net of {formatCurrency(financingBreakdown.posRebatesMinor, "USD")} Instant Rebate)</span>
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
                  <label htmlFor="fullName" className="text-xs font-semibold text-slate-700 block mb-1">Full Legal Name</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={applicant.fullName}
                    onChange={(e) => setApplicant({ ...applicant, fullName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="text-xs font-semibold text-slate-700 block mb-1">Date of Birth</label>
                  <input
                    id="dateOfBirth"
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
                  <label htmlFor="phone" className="text-xs font-semibold text-slate-700 block mb-1">Mobile Phone (For Offers Alert)</label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={applicant.phone}
                    onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    id="email"
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
                  <label htmlFor="annualIncome" className="text-xs font-semibold text-slate-700 block mb-1">Annual Household Income ($)</label>
                  <input
                    id="annualIncome"
                    type="number"
                    required
                    min="10000"
                    value={applicant.annualIncome}
                    onChange={(e) => setApplicant({ ...applicant, annualIncome: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="housingPayment" className="text-xs font-semibold text-slate-700 block mb-1">Monthly Housing Payment ($)</label>
                  <input
                    id="housingPayment"
                    type="number"
                    required
                    value={applicant.housingPayment}
                    onChange={(e) => setApplicant({ ...applicant, housingPayment: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="ssnLastFour" className="text-xs font-semibold text-slate-700 block mb-1">Social Security # (Last 4 Digits Only)</label>
                  <input
                    id="ssnLastFour"
                    type="password"
                    maxLength={4}
                    pattern="\d{4}"
                    inputMode="numeric"
                    required
                    value={applicant.ssnLastFour}
                    onChange={(e) => setApplicant({ ...applicant, ssnLastFour: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="••••"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm tracking-widest focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                <span>Bank-grade 256-bit encryption. Sensitive identifiers protected via AES-256-GCM.</span>
                <span className="text-emerald-700 font-medium">GLBA Financial Privacy Disclosures</span>
              </div>

              {/* Co-Applicant Support */}
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
                        <label htmlFor="coApplicantName" className="text-xs font-semibold text-slate-700 block mb-1">{t.coApplicantName}</label>
                        <input
                          id="coApplicantName"
                          type="text"
                          required={hasCoApplicant}
                          value={coApplicant.fullName}
                          onChange={(e) => setCoApplicant({ ...coApplicant, fullName: e.target.value })}
                          placeholder="e.g. Michael Jenkins"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="coApplicantDob" className="text-xs font-semibold text-slate-700 block mb-1">{t.coApplicantDob}</label>
                        <input
                          id="coApplicantDob"
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
                        <label htmlFor="coApplicantIncome" className="text-xs font-semibold text-slate-700 block mb-1">{t.coApplicantIncome}</label>
                        <input
                          id="coApplicantIncome"
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
                        <label htmlFor="coApplicantRelationship" className="text-xs font-semibold text-slate-700 block mb-1">{t.relationship}</label>
                        <select
                          id="coApplicantRelationship"
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

              {/* FCRA Soft-Pull Consent Checkbox - Unchecked by Default (L-01) */}
              <div className="pt-4 border-t border-slate-200">
                <label htmlFor="softPullConsent" className="flex items-start space-x-3 text-xs text-slate-600 cursor-pointer">
                  <input
                    id="softPullConsent"
                    type="checkbox"
                    required
                    checked={applicant.softPullConsent}
                    onChange={(e) => setApplicant({ ...applicant, softPullConsent: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>FCRA Consent & Authorization:</strong> By checking this box, I authorize GreenQuote and its
                    designated lending partners (Clean Energy FCU, Community Green Bank, EcoFinance) to obtain my credit
                    profile via a soft credit inquiry to assess eligibility. I understand this will <strong>NOT</strong>{" "}
                    affect my credit score.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep("quote_view")}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800 text-center py-2 sm:py-0"
                >
                  {t.backToQuote}
                </button>
                <button
                  type="submit"
                  disabled={!applicant.softPullConsent}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition disabled:opacity-50"
                >
                  <span>{t.submitPrequal}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: MULTI-LENDER OFFERS */}
        {currentStep === "offers" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Your Pre-Qualified Loan Offers</h2>
                  <p className="text-sm text-slate-600">
                    {offers.length} competitive offers received. Default sort: <strong>Lowest Total Loan Cost</strong>.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600">
                  Amount Financed: <strong>{formatCurrency(calc1.amountFinancedMinor, "USD")}</strong>
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
                              {formatCurrency(offer.monthlyPaymentMinor, "USD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-xs font-normal text-slate-500"> / mo</span>
                            </span>
                            <span className="text-sm font-semibold text-slate-700">
                              {offer.aprPct}% APR · {offer.termMonths} Months
                            </span>
                          </div>

                          {/* Contractor-Paid Buy-Down Line */}
                          {offer.contractorBuyDownMinor > 0 && (
                            <div className="mt-2 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md inline-flex items-center space-x-1">
                              <BadgePercent className="w-3.5 h-3.5" />
                              <span>Your contractor is contributing {formatCurrency(offer.contractorBuyDownMinor, "USD")} upfront to lower this interest rate</span>
                            </div>
                          )}
                        </div>

                        <div className="text-left sm:text-right sm:border-l sm:border-slate-200 sm:pl-6 w-full sm:w-auto flex flex-col justify-between sm:justify-center items-start sm:items-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                          <div>
                            <span className="text-xs text-slate-400 font-semibold block">Total Cost of Loan</span>
                            <span className="text-sm font-bold text-slate-800">
                              {formatCurrency(offer.totalCostOfCreditMinor, "USD")}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedOffer(offer);
                              setCurrentStep("esign");
                            }}
                            className="w-full sm:w-auto mt-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition text-center"
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

        {/* STEP 4: TILA DISCLOSURE & E-SIGNATURE */}
        {currentStep === "esign" && selectedOffer && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Review Disclosures & Sign Agreement</h2>
              <p className="text-sm text-slate-600">
                Lender: <strong>{selectedOffer.lenderName}</strong>
              </p>
            </div>

            {/* TILA Box (Truth in Lending Act Regulation Z §1026.18) */}
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
                    {formatCurrency(selectedOffer.totalInterestMinor, "USD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Dollar amount credit will cost</span>
                </div>
                <div className="border border-slate-300 bg-white p-3 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">AMOUNT FINANCED</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(selectedOffer.amountFinancedMinor, "USD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Amount of credit provided</span>
                </div>
                <div className="border border-slate-300 bg-white p-3 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">TOTAL OF PAYMENTS</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(selectedOffer.totalCostOfCreditMinor, "USD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Total paid after all payments</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 flex justify-between">
                <span>Payment Schedule: <strong>{selectedOffer.termMonths} monthly payments of {formatCurrency(selectedOffer.monthlyPaymentMinor, "USD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                <span>Prepayment Penalty: <strong>None</strong></span>
              </div>

              {/* FTC Holder in Due Course Rule Notice (16 C.F.R. §433.2) */}
              <div className="mt-3 p-3 bg-white rounded-lg border border-slate-300 text-[10px] text-slate-700 leading-relaxed font-mono">
                <span className="font-bold text-slate-900 block mb-1">
                  NOTICE: PRESERVATION OF CONSUMER CLAIMS AND DEFENSES (FTC HOLDER RULE, 16 C.F.R. §433.2)
                </span>
                ANY HOLDER OF THIS CONSUMER CREDIT CONTRACT IS SUBJECT TO ALL CLAIMS AND DEFENSES WHICH THE DEBTOR COULD
                ASSERT AGAINST THE SELLER OF GOODS OR SERVICES OBTAINED PURSUANT HERETO OR WITH THE PROCEEDS HEREOF.
                RECOVERY HEREUNDER BY THE DEBTOR SHALL NOT EXCEED AMOUNTS PAID BY THE DEBTOR HEREUNDER.
              </div>
            </div>

            {/* Checkboxes for TILA Acknowledgment and E-SIGN */}
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
                <span>Electronic Signature (Type Your Full Legal Name to Adopt as E-Signature)</span>
              </div>
              <input
                type="text"
                disabled={!tilaAcknowledged || !esignConsent}
                placeholder="e.g. Sarah Jenkins"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full text-lg font-serif italic border-b-2 border-slate-400 bg-transparent py-2 px-1 focus:border-emerald-600 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-2">
                Signer: {applicant.fullName || "Primary Applicant"} · Timestamp: {new Date().toLocaleDateString()} · Cryptographic E-SIGN Consent Recorded
              </p>
            </div>

            {/* Complete E-Sign Action */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep("offers")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 text-center py-2 sm:py-0"
              >
                ← Back to Offers
              </button>
              <button
                disabled={!tilaAcknowledged || !esignConsent || !signatureName.trim()}
                onClick={() => setCurrentStep("completed")}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition disabled:opacity-50 text-center"
              >
                Sign Loan Agreement
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: COMPLETED & POST-INSTALL CONFIRMATION */}
        {currentStep === "completed" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Pre-Qualification Confirmed & Agreement Executed</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                Your pre-qualified loan agreement with <strong>{selectedOffer?.lenderName}</strong> has been signed and transmitted.
                Your contractor ({quoteData.contractor.name}) has been notified to schedule the installation.
              </p>
            </div>

            {/* Statutory Cooling-Off & Right of Rescission Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-left max-w-lg mx-auto space-y-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-purple-900">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Statutory 3-Day Right of Rescission & Cancellation</span>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                Under the Federal Trade Commission (FTC) Cooling-Off Rule and consumer credit regulations, you have the
                unconditional legal right to cancel this transaction without penalty until midnight of the third business day.
              </p>

              {rescissionExercised ? (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs font-semibold text-red-900">
                  <p className="font-bold">Notice of Cancellation Exercised</p>
                  <p className="text-[11px] mt-0.5 text-red-800">
                    Your financing request has been cancelled under your statutory right of rescission. No finance charges
                    will be assessed, and any credit agreement has been voided.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRescissionExercised(true)}
                  className="w-full bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold py-2 px-3 rounded-lg transition"
                >
                  Exercise Right of Rescission (Cancel Loan Application)
                </button>
              )}
            </div>

            {/* Homeowner Completion Sign-Off Barrier Simulation */}
            {!rescissionExercised && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-left max-w-lg mx-auto">
                <h3 className="font-bold text-amber-900 flex items-center space-x-2 text-sm mb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Job Completion Payout Gate</span>
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed mb-4">
                  In strict compliance with consumer protection standards, <strong>the lender will NOT release payment</strong> to the contractor
                  until you confirm that the heat pump installation has been completed satisfactorily.
                </p>

                {jobCompletionConfirmed ? (
                  <div className="bg-emerald-100 text-emerald-800 text-xs font-bold p-3 rounded-lg flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You confirmed completion! Payout will be released to contractor after the cooling-off period elapses.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setJobCompletionConfirmed(true)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition"
                  >
                    Confirm Job Completed & Authorize Payout Release
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
