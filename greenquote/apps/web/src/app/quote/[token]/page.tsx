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
    installerBadge: "MNRE Empanelled Clean Energy Installer",
    property: "Installation Site",
    step1: "1. Review Quote & Savings",
    step2: "2. CIBIL Pre-qualification",
    step3: "3. Multi-Bank EMI Offers",
    step4: "4. KFS Disclosures & E-Sign",
    selectOptionTitle: "Select Your Clean Energy Package",
    selectOptionDesc: "All quotations include certified MNRE ALMM & BEE 5-Star equipment, turnkey installation, DISCOM net-metering approvals, and warranty. Cash price and financed price are strictly identical.",
    good: "Good",
    better: "Better",
    best: "Best",
    bestValue: "Best Value",
    rebate: "Subsidy",
    massSaveRebate: "PM Surya Ghar Central Subsidy",
    appliedAtPos: "Instant Subsidy Netting at POS",
    netPrice: "Net Payable After Subsidies",
    savingsRange: "Est. Power Bill Savings",
    fullCashPrice: "Gross System Price",
    calculateFinancing: "Estimate Your Monthly Investment (EMI)",
    downPayment: "Down Payment",
    financeTerm: "Loan Tenure",
    estimatedEmi: "Est. Monthly EMI",
    zeroDealerFees: "Zero Dealer Fees Guaranteed",
    continuePrequal: "Check Rates Without Affecting CIBIL Score",
    prequalTitle: "60-Second CIBIL Soft Pre-qualification",
    prequalDesc: "Compare personalized monthly EMI offers from top clean energy lenders (SBI, Tata Capital, IREDA). Soft pull under RBI guidelines has zero impact on your CIBIL score.",
    addCoApplicant: "Add Co-Applicant / Co-Signer",
    coApplicantDesc: "Include a household co-signer to improve qualification odds and debt-to-income ratio.",
    coApplicantName: "Co-Applicant Full Legal Name (as per PAN/Aadhaar)",
    coApplicantDob: "Co-Applicant Date of Birth",
    coApplicantIncome: "Co-Applicant Annual Income (₹)",
    relationship: "Relationship to Primary Applicant",
    spouse: "Spouse",
    partner: "Family Co-Owner",
    other: "Other Household Member",
    submitPrequal: "Submit Pre-qualification",
    backToQuote: "← Back to Quote",
  },
  es: {
    installerBadge: "Instalador Certificado de Energía Limpia",
    property: "Propiedad de Instalación",
    step1: "1. Revisar Cotización y Ahorros",
    step2: "2. Precalificación CIBIL",
    step3: "3. Ofertas de Prestamistas",
    step4: "4. KFS y Firma Digital",
    selectOptionTitle: "Seleccione su Paquete de Energía Limpia",
    selectOptionDesc: "Todas las cotizaciones incluyen equipos aprobados por MNRE ALMM, instalación llave en mano, medidor bidireccional y garantía completa. El precio al contado y financiado son idénticos.",
    good: "Básico",
    better: "Mejor Valor",
    best: "Premium",
    bestValue: "Más Popular",
    rebate: "Subsidio",
    massSaveRebate: "Subsidio PM Surya Ghar",
    appliedAtPos: "Deducido directamente en factura",
    netPrice: "Precio Neto Después de Subsidios",
    savingsRange: "Ahorro Estimado en Factura",
    fullCashPrice: "Precio Total del Sistema",
    calculateFinancing: "Calcule su Inversión Mensual (EMI)",
    downPayment: "Pago Inicial",
    financeTerm: "Plazo de Financiamiento",
    estimatedEmi: "EMI Mensual Estimado",
    zeroDealerFees: "Cero Tarifas Ocultas Garantizadas",
    continuePrequal: "Ver Tasas Sin Afectar su CIBIL",
    prequalTitle: "Precalificación CIBIL Sin Impacto",
    prequalDesc: "Compare ofertas mensuales de SBI, Tata Capital e IREDA sin afectar su puntaje crediticio.",
    addCoApplicant: "Agregar Co-solicitante / Co-firmante",
    coApplicantDesc: "Incluya los ingresos de un co-firmante para aumentar la probabilidad de aprobación.",
    coApplicantName: "Nombre Legal del Co-solicitante",
    coApplicantDob: "Fecha de Nacimiento del Co-solicitante",
    coApplicantIncome: "Ingreso Anual del Co-solicitante (₹)",
    relationship: "Relación con el Solicitante Principal",
    spouse: "Cónyuge",
    partner: "Co-propietario Familiar",
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
  const [downPayment, setDownPayment] = useState(20000);
  const [selectedTerm, setSelectedTerm] = useState(60);

  // Pre-qual Form State - Affirmative consent required under RBI guidelines
  const [applicant, setApplicant] = useState({
    fullName: "Rajesh Kumar Sharma",
    phone: "+91 98765 43210",
    email: "rajesh.sharma@example.in",
    dateOfBirth: "1984-07-16",
    annualIncome: 1200000,
    housingPayment: 25000,
    panNumber: "ABCDE1234F",
    softPullConsent: false,
  });

  // Co-Applicant State
  const [hasCoApplicant, setHasCoApplicant] = useState(false);
  const [coApplicant, setCoApplicant] = useState({
    fullName: "",
    dateOfBirth: "",
    annualIncome: 0,
    relationship: "Spouse",
  });

  // Selected Offer State - Signature must start empty
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [tilaAcknowledged, setTilaAcknowledged] = useState(false);
  const [esignConsent, setEsignConsent] = useState(false);
  const [jobCompletionConfirmed, setJobCompletionConfirmed] = useState(false);
  const [rescissionExercised, setRescissionExercised] = useState(false);

  // Quote Data with accurate Indian Rooftop Solar & Clean Energy specifications
  const quoteData = {
    contractor: {
      name: "SunVolt Green Energy Pvt. Ltd.",
      phone: "+91 98110 54321",
      license: "MNRE Empanelment #MNRE-UP-2024-9182 · GSTIN: 07AAACG1829M1ZF",
    },
    property: "B-42, Sector 62, Noida, Uttar Pradesh 201309",
    options: {
      good: {
        title: "Good: 2 kW Grid-Tied Rooftop Solar + 5-Star Inverter AC",
        equipment: "Waaree 2 kW Monocrystalline ALMM Tier-1 Panels + Micro-Inverter",
        priceMinor: 15000000, // ₹1,50,000
        incentives: [
          {
            id: "inc_good_surya_ghar",
            name: "PM Surya Ghar Muft Bijli Yojana Central Subsidy",
            amountMinor: 6000000, // ₹60,000 POS instant subsidy
            category: "pos_utility_rebate" as const,
            timing: "instant" as const,
          },
        ] as IncentiveItem[],
        savings: "₹24,000 - ₹36,000 / yr",
      },
      better: {
        title: "Better: 3 kW High-Efficiency Bifacial Solar System",
        equipment: "Tata Power Solar 3 kW Dual-Glass Bifacial System + 3.3 kVA Smart Inverter",
        priceMinor: 22000000, // ₹2,20,000
        incentives: [
          {
            id: "inc_better_surya_ghar",
            name: "PM Surya Ghar Muft Bijli Yojana Maximum Subsidy",
            amountMinor: 7800000, // ₹78,000 POS instant DBT subsidy
            category: "pos_utility_rebate" as const,
            timing: "instant" as const,
          },
          {
            id: "inc_better_state_incentive",
            name: "State DISCOM Clean Energy Incentive",
            amountMinor: 1500000, // ₹15,000 post-install tax rebate
            category: "federal_tax_credit" as const,
            timing: "after_installation" as const,
          },
        ] as IncentiveItem[],
        savings: "₹42,000 - ₹60,000 / yr",
      },
      best: {
        title: "Best: 5 kW Premium Solar + 5 kWh Lithium Battery Storage",
        equipment: "Adani Solar 5 kW N-Type TopCon Panels + Havells 5.12 kWh LiFePO4 Battery",
        priceMinor: 38000000, // ₹3,80,000
        incentives: [
          {
            id: "inc_best_surya_ghar",
            name: "PM Surya Ghar Muft Bijli Yojana Maximum Subsidy",
            amountMinor: 7800000, // ₹78,000 POS instant subsidy
            category: "pos_utility_rebate" as const,
            timing: "instant" as const,
          },
          {
            id: "inc_best_state_incentive",
            name: "State Clean Energy Incentive / Tax Deduction",
            amountMinor: 2000000, // ₹20,000 post-install incentive
            category: "federal_tax_credit" as const,
            timing: "after_installation" as const,
          },
        ] as IncentiveItem[],
        savings: "₹70,000 - ₹95,000 / yr",
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
    annualRatePct: 7.00,
    termMonths: 60,
  });

  // Clamped down payment to ensure at least ₹500 remains financed for loan calculations
  const maxDownPayment = Math.max(0, Math.floor(financingBreakdown.netInvoiceMinor / 100) - 500);
  const clampedDownPayment = Math.min(downPayment, maxDownPayment);

  // Multi-Lender Offers computed safely with minor-unit precision using centralized engine
  const calc1 = calculateFinancingBreakdown({
    grossPriceMinor: currentOption.priceMinor,
    downPaymentMinor: clampedDownPayment * 100,
    incentives: currentOption.incentives,
    annualRatePct: 7.00,
    termMonths: 60,
  });

  const calc2 = calculateFinancingBreakdown({
    grossPriceMinor: currentOption.priceMinor,
    downPaymentMinor: clampedDownPayment * 100,
    incentives: currentOption.incentives,
    annualRatePct: 8.25,
    termMonths: 84,
    contractorBuyDownPct: 2.5,
  });

  const calc3 = calculateFinancingBreakdown({
    grossPriceMinor: currentOption.priceMinor,
    downPaymentMinor: clampedDownPayment * 100,
    incentives: currentOption.incentives,
    annualRatePct: 7.50,
    termMonths: 120,
  });

  const offers: Offer[] = [
    {
      id: "ofr_1",
      lenderName: "State Bank of India (Surya Ghar Solar Loan)",
      aprPct: 7.00,
      termMonths: 60,
      monthlyPaymentMinor: calc1.monthlyPaymentMinor,
      amountFinancedMinor: calc1.amountFinancedMinor,
      totalCostOfCreditMinor: calc1.totalPaymentsMinor,
      totalInterestMinor: calc1.financeChargeMinor,
      contractorBuyDownMinor: 0,
    },
    {
      id: "ofr_2",
      lenderName: "Tata Capital Clean Energy / Rooftop Loan",
      aprPct: 8.25,
      termMonths: 84,
      monthlyPaymentMinor: calc2.monthlyPaymentMinor,
      amountFinancedMinor: calc2.amountFinancedMinor,
      totalCostOfCreditMinor: calc2.totalPaymentsMinor,
      totalInterestMinor: calc2.financeChargeMinor,
      contractorBuyDownMinor: calc2.contractorBuyDownMinor,
    },
    {
      id: "ofr_3",
      lenderName: "Canara Bank / IREDA Green Finance",
      aprPct: 7.50,
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
                        {formatCurrency(opt.priceMinor, "INR")}
                      </div>
                      <div className="text-xs text-emerald-700 font-semibold mt-1">
                        -{formatCurrency(opt.incentives.filter(i => i.timing === "instant").reduce((s, i) => s + i.amountMinor, 0), "INR")} Instant Subsidy
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
                    <span className="text-xs text-slate-400 uppercase font-semibold block">Gross System Price</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      {formatCurrency(financingBreakdown.grossPriceMinor, "INR")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">PM Surya Ghar Subsidy (POS)</span>
                    <span className="text-sm font-bold text-emerald-600">
                      -{formatCurrency(financingBreakdown.posRebatesMinor, "INR")}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Deducted upfront from quotation</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Net Payable Balance</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(financingBreakdown.netInvoiceMinor, "INR")}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Payable via down payment / bank loan</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Est. Annual Power Bill Savings</span>
                    <span className="text-sm font-bold text-emerald-700">{currentOption.savings}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Based on state DISCOM tariffs</span>
                  </div>
                </div>

                {/* Future Tax Credit Transparency Card */}
                {financingBreakdown.taxCreditsMinor > 0 && (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 text-xs flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900 block">
                        Additional State / Tax Incentive: {formatCurrency(financingBreakdown.taxCreditsMinor, "INR")} (State DISCOM / Post-Commissioning)
                      </span>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Claimed post-commissioning on your tax filing or from your state nodal agency. Under RBI digital lending standards, this future incentive does <strong>not</strong> reduce your upfront point-of-sale invoice or initial loan principal.
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
                    {formatCurrency(clampedDownPayment * 100, "INR")}
                  </span>
                </div>
                <input
                  id="downPaymentSlider"
                  type="range"
                  min="0"
                  max={maxDownPayment}
                  step="5000"
                  value={clampedDownPayment}
                  onChange={(e) => setDownPayment(parseInt(e.target.value, 10) || 0)}
                  className="w-full accent-emerald-600 cursor-pointer"
                  aria-valuemin={0}
                  aria-valuemax={maxDownPayment}
                  aria-valuenow={clampedDownPayment}
                  aria-valuetext={formatCurrency(clampedDownPayment * 100, "INR")}
                />
                <div className="flex flex-col sm:flex-row sm:justify-between text-[11px] text-slate-500 mt-1 gap-1">
                  <span>₹0 Down</span>
                  <span>Amount to Finance: <strong>{formatCurrency(calc1.amountFinancedMinor, "INR")}</strong> (Net of {formatCurrency(financingBreakdown.posRebatesMinor, "INR")} Instant Subsidy)</span>
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
                  <label htmlFor="annualIncome" className="text-xs font-semibold text-slate-700 block mb-1">Annual Household Income (₹)</label>
                  <input
                    id="annualIncome"
                    type="number"
                    required
                    min="100000"
                    value={applicant.annualIncome}
                    onChange={(e) => setApplicant({ ...applicant, annualIncome: parseInt(e.target.value, 10) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="housingPayment" className="text-xs font-semibold text-slate-700 block mb-1">Monthly Housing / Rent (₹)</label>
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
                  <label htmlFor="panNumber" className="text-xs font-semibold text-slate-700 block mb-1">PAN Card Number</label>
                  <input
                    id="panNumber"
                    type="text"
                    maxLength={10}
                    required
                    value={applicant.panNumber}
                    onChange={(e) => setApplicant({ ...applicant, panNumber: e.target.value.toUpperCase().slice(0, 10) })}
                    placeholder="ABCDE1234F"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase tracking-wider font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                <span>Bank-grade 256-bit encryption. PII identifiers protected via AES-256-GCM.</span>
                <span className="text-emerald-700 font-medium">DPDP Act 2023 & RBI Privacy Protected</span>
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
                          placeholder="e.g. Priya Sharma"
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
                          placeholder="600000"
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

              {/* RBI CIBIL Soft-Pull Consent Checkbox - Unchecked by Default */}
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
                    <strong>RBI Digital Lending & CIBIL Consent:</strong> By checking this box, I authorize GreenQuote and its
                    designated banking partners (State Bank of India, Tata Capital, Canara Bank / IREDA) to retrieve my credit
                    profile via a soft bureau inquiry under Reserve Bank of India (RBI) guidelines. I understand this will <strong>NOT</strong>{" "}
                    impact my CIBIL credit score.
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
                  Amount Financed: <strong>{formatCurrency(calc1.amountFinancedMinor, "INR")}</strong>
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
                              {formatCurrency(offer.monthlyPaymentMinor, "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-xs font-normal text-slate-500"> / mo EMI</span>
                            </span>
                            <span className="text-sm font-semibold text-slate-700">
                              {offer.aprPct}% p.a. · {offer.termMonths} Months Tenure
                            </span>
                          </div>

                          {/* Contractor-Paid Buy-Down Line */}
                          {offer.contractorBuyDownMinor > 0 && (
                            <div className="mt-2 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md inline-flex items-center space-x-1">
                              <BadgePercent className="w-3.5 h-3.5" />
                              <span>Installer subsidizes {formatCurrency(offer.contractorBuyDownMinor, "INR")} upfront to lower your interest rate</span>
                            </div>
                          )}
                        </div>

                        <div className="text-left sm:text-right sm:border-l sm:border-slate-200 sm:pl-6 w-full sm:w-auto flex flex-col justify-between sm:justify-center items-start sm:items-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                          <div>
                            <span className="text-xs text-slate-400 font-semibold block">Total Cost of Loan</span>
                            <span className="text-sm font-bold text-slate-800">
                              {formatCurrency(offer.totalCostOfCreditMinor, "INR")}
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

        {/* STEP 4: RBI KEY FACT STATEMENT (KFS) & E-SIGNATURE */}
        {currentStep === "esign" && selectedOffer && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Review KFS Disclosures & Sign Agreement</h2>
              <p className="text-sm text-slate-600">
                Regulated Entity / Lender: <strong>{selectedOffer.lenderName}</strong>
              </p>
            </div>

            {/* RBI KFS Box */}
            <div className="border-2 border-slate-900 rounded-xl p-5 bg-slate-50">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                KEY FACT STATEMENT (KFS) — RBI DIGITAL LENDING GUIDELINES
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="border border-slate-300 bg-white p-3 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">ANNUAL RATE OF INTEREST</span>
                  <span className="text-xl font-black text-slate-900">{selectedOffer.aprPct}% p.a.</span>
                  <span className="text-[9px] text-slate-400 block">Reducing balance APR</span>
                </div>
                <div className="border border-slate-300 bg-white p-3 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">FINANCE CHARGES (INTEREST)</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(selectedOffer.totalInterestMinor, "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Total interest payable</span>
                </div>
                <div className="border border-slate-300 bg-white p-3 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">SANCTIONED AMOUNT</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(selectedOffer.amountFinancedMinor, "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Net principal disbursed</span>
                </div>
                <div className="border border-slate-300 bg-white p-3 rounded-lg">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">TOTAL PAYMENTS</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(selectedOffer.totalCostOfCreditMinor, "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Total lifetime repayment</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row justify-between gap-1">
                <span>Repayment Mode: <strong>{selectedOffer.termMonths} monthly EMIs of {formatCurrency(selectedOffer.monthlyPaymentMinor, "INR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} via eNACH / UPI AutoPay</strong></span>
                <span>Foreclosure Penalty: <strong>₹0 (Nil as per RBI Master Direction)</strong></span>
              </div>

              {/* RBI Fair Lending Notice */}
              <div className="mt-3 p-3 bg-white rounded-lg border border-slate-300 text-[10px] text-slate-700 leading-relaxed font-mono">
                <span className="font-bold text-slate-900 block mb-1">
                  MANDATORY RBI DISCLOSURE & GRIEVANCE REDRESSAL MECHANISM
                </span>
                THIS CLEAN ENERGY LOAN IS DISBURSED IN STRICT COMPLIANCE WITH RBI DIGITAL LENDING GUIDELINES (2022/2024).
                FUNDS ARE DISBURSED DIRECTLY TO THE EMPANELLED INSTALLER UPON VERIFIED MILESTONE COMPLETION. BORROWER HAS
                AN UNCONDITIONAL RIGHT TO EXIT DURING THE MANDATORY 3-DAY COOLING-OFF PERIOD WITHOUT ANY PENALTY.
              </div>
            </div>

            {/* Checkboxes for KFS Acknowledgment and E-SIGN */}
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
                  I have read, reviewed, and acknowledge receipt of the Reserve Bank of India Key Fact Statement (KFS)
                  and loan terms displayed above.
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
                  I consent to electronic signing and agreement execution under Section 10A of the Information
                  Technology Act, 2000 and setup of eNACH / UPI AutoPay mandate.
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
                placeholder="e.g. Rajesh Kumar Sharma"
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
                <span>Mandatory 3-Day Cooling-Off Period (RBI Digital Lending Norms)</span>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                Under Reserve Bank of India (RBI) Digital Lending Guidelines, you have the unconditional regulatory right
                to exit this loan contract without any penalty or foreclosure charge during the 3-day look-up / cooling-off window.
              </p>

              {rescissionExercised ? (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs font-semibold text-red-900">
                  <p className="font-bold">Notice of Cancellation Exercised</p>
                  <p className="text-[11px] mt-0.5 text-red-800">
                    Your clean energy loan application has been cancelled under your statutory RBI cooling-off rights.
                    No EMI will be debited, and the eNACH mandate has been revoked.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRescissionExercised(true)}
                  className="w-full bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold py-2 px-3 rounded-lg transition"
                >
                  Exercise Cooling-Off Right (Cancel Clean Energy Loan)
                </button>
              )}
            </div>

            {/* Homeowner Completion Sign-Off Barrier Simulation */}
            {!rescissionExercised && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-left max-w-lg mx-auto">
                <h3 className="font-bold text-amber-900 flex items-center space-x-2 text-sm mb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Installation & Net-Metering Completion Gate</span>
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed mb-4">
                  In strict compliance with RBI consumer protection standards, <strong>the lending institution will NOT disburse funds</strong> to the solar installer
                  until you confirm that the rooftop solar / clean energy installation and DISCOM bi-directional net-meter synchronization have been completed satisfactorily.
                </p>

                {jobCompletionConfirmed ? (
                  <div className="bg-emerald-100 text-emerald-800 text-xs font-bold p-3 rounded-lg flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You confirmed commissioning! Final milestone payout will be released to the installer via RTGS after the cooling-off window.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setJobCompletionConfirmed(true)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition"
                  >
                    Confirm Installation Complete & Authorize Bank Disbursement
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
