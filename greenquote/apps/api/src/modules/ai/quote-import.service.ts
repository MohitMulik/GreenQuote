export interface ExtractedLineItem {
  id: string;
  type: "equipment" | "labour" | "electrical" | "permits" | "other";
  label: string;
  amountMinor: number;
  confidence: number;
  flagged: boolean;
}

export interface ExtractedOption {
  tier: "good" | "better" | "best";
  title: string;
  priceMinor: number;
  lineItems: ExtractedLineItem[];
  calculatedSumMinor: number;
  isArithmeticValid: boolean;
  confidence: number;
}

export interface AiQuoteExtractionResult {
  sourceDocumentName: string;
  extractedAt: string;
  currency: "USD" | "INR";
  contractorName?: string;
  homeownerName?: string;
  propertyAddress?: string;
  options: ExtractedOption[];
  requiresHumanReview: boolean;
  summary: {
    totalItemsExtracted: number;
    flaggedItemCount: number;
    overallConfidence: number;
  };
}

export class QuoteImportService {
  /**
   * Simulates OCR + Multimodal LLM schema-constrained JSON extraction
   * with confidence scoring and arithmetic verification.
   */
  async parseDocument(filename: string, rawText?: string): Promise<AiQuoteExtractionResult> {
    const isUSQuote = rawText?.includes("$") || rawText?.toLowerCase().includes("usd");
    const currency = isUSQuote ? "USD" : "INR";

    // Standard high-efficiency heat pump extraction model
    const options: ExtractedOption[] = [
      {
        tier: "good",
        title: currency === "INR" ? "3kW On-Grid Rooftop Solar System" : "15.2 SEER2 Standard Heat Pump System",
        priceMinor: currency === "INR" ? 18000000 : 1040000,
        confidence: 0.96,
        isArithmeticValid: true,
        calculatedSumMinor: currency === "INR" ? 18000000 : 1040000,
        lineItems: [
          {
            id: "ext_1",
            type: "equipment",
            label: currency === "INR" ? "Tata Power Solar 550W Mono PERC Panels (6 Nos)" : "Daikin Standard 3-Ton Heat Pump Outdoor Unit",
            amountMinor: currency === "INR" ? 11000000 : 750000,
            confidence: 0.98,
            flagged: false,
          },
          {
            id: "ext_2",
            type: "labour",
            label: currency === "INR" ? "Installation, Mounting Structure & Cabling" : "System Installation & Ductwork Hookup",
            amountMinor: currency === "INR" ? 4500000 : 250000,
            confidence: 0.94,
            flagged: false,
          },
          {
            id: "ext_3",
            type: "permits",
            label: currency === "INR" ? "DISCOM Net Metering Application & Approval" : "City Mechanical & Electrical Permits",
            amountMinor: currency === "INR" ? 2500000 : 40000,
            confidence: 0.88, // Flagged for review (<90%)
            flagged: true,
          },
        ],
      },
      {
        tier: "better",
        title: currency === "INR" ? "5kW On-Grid Solar System with Microinverters" : "Cold-Climate Hyper-Heat Pump (NEEP Certified)",
        priceMinor: currency === "INR" ? 28000000 : 1540000,
        confidence: 0.93,
        isArithmeticValid: true,
        calculatedSumMinor: currency === "INR" ? 28000000 : 1540000,
        lineItems: [
          {
            id: "ext_4",
            type: "equipment",
            label: currency === "INR" ? "Tata Power Solar 550W Panels + Enphase Microinverters" : "Mitsubishi H2i Hyper-Heating Multi-Zone Outdoor Unit",
            amountMinor: currency === "INR" ? 18000000 : 1050000,
            confidence: 0.95,
            flagged: false,
          },
          {
            id: "ext_5",
            type: "labour",
            label: currency === "INR" ? "Master Solar Technician Installation & Earthing" : "Certified Cold-Climate Installation & Testing",
            amountMinor: currency === "INR" ? 6000000 : 320000,
            confidence: 0.96,
            flagged: false,
          },
          {
            id: "ext_6",
            type: "electrical",
            label: currency === "INR" ? "ACDB/DCDB Surge Protection & Lightning Arrestor" : "200A Electrical Sub-Panel & Disconnect Upgrade",
            amountMinor: currency === "INR" ? 3000000 : 120000,
            confidence: 0.87, // Flagged (<90%)
            flagged: true,
          },
          {
            id: "ext_7",
            type: "permits",
            label: currency === "INR" ? "Net Metering & Electrical Inspector Sanction" : "Municipal Permits & HERS Inspection",
            amountMinor: currency === "INR" ? 1000000 : 50000,
            confidence: 0.92,
            flagged: false,
          },
        ],
      },
    ];

    // Verify arithmetic consistency across options
    let totalItems = 0;
    let flaggedCount = 0;
    let totalConfidence = 0;

    for (const opt of options) {
      const sum = opt.lineItems.reduce((acc, item) => acc + item.amountMinor, 0);
      opt.calculatedSumMinor = sum;
      opt.isArithmeticValid = sum === opt.priceMinor;
      for (const item of opt.lineItems) {
        totalItems++;
        totalConfidence += item.confidence;
        if (item.flagged || item.confidence < 0.90) {
          item.flagged = true;
          flaggedCount++;
        }
      }
    }

    const overallConfidence = totalItems > 0 ? Number((totalConfidence / totalItems).toFixed(2)) : 1.0;

    return {
      sourceDocumentName: filename,
      extractedAt: new Date().toISOString(),
      currency,
      contractorName: "Apex Clean Energy LLC",
      homeownerName: "Sarah Jenkins",
      propertyAddress: "42 Commonwealth Ave, Boston, MA 02108",
      options,
      requiresHumanReview: flaggedCount > 0,
      summary: {
        totalItemsExtracted: totalItems,
        flaggedItemCount: flaggedCount,
        overallConfidence,
      },
    };
  }
}

export const quoteImportService = new QuoteImportService();
