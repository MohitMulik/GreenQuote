export interface LenderConfig {
  lenderId: string;
  name: string;
  minCreditScore: number;
  maxLoanAmountMinor: number;
  allowedTerms: number[];
  baseAprPct: number;
  isActive: boolean;
  pendingChange?: {
    proposedBy: string;
    proposedAt: string;
    newBaseAprPct: number;
    newMaxLoanAmountMinor: number;
    previousValues?: {
      baseAprPct: number;
      maxLoanAmountMinor: number;
    };
  };
}

export const mockLenders: Record<string, LenderConfig> = {
  lnd_sbi: {
    lenderId: "lnd_sbi",
    name: "State Bank of India (Surya Ghar Solar Loan)",
    minCreditScore: 680,
    maxLoanAmountMinor: 60000000,
    allowedTerms: [36, 60, 84, 120],
    baseAprPct: 7.00,
    isActive: true,
  },
  lnd_tata_capital: {
    lenderId: "lnd_tata_capital",
    name: "Tata Capital Clean Tech POS",
    minCreditScore: 700,
    maxLoanAmountMinor: 100000000,
    allowedTerms: [60, 84, 120],
    baseAprPct: 7.75,
    isActive: true,
  },
  lnd_ireda: {
    lenderId: "lnd_ireda",
    name: "IREDA Rooftop Green Finance",
    minCreditScore: 650,
    maxLoanAmountMinor: 80000000,
    allowedTerms: [60, 120, 180],
    baseAprPct: 7.25,
    isActive: true,
  },
  lnd_vermont_cu: {
    lenderId: "lnd_vermont_cu",
    name: "Vermont Clean Energy CU",
    minCreditScore: 660,
    maxLoanAmountMinor: 45000000,
    allowedTerms: [36, 60, 84, 120],
    baseAprPct: 7.00,
    isActive: true,
  },
};
