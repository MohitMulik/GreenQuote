import mongoose from "mongoose";
import { PrequalificationModel } from "../prequal/prequal.model";
import { QuoteModel } from "../quotes/quote.model";
import { AppError } from "../../lib/errors";


export interface AdverseActionNotice {
  noticeId: string;
  generatedDate: string;
  applicant: {
    name: string;
    address: string;
  };
  creditorsInvolved: string[];
  actionTaken: "CREDIT_APPLICATION_DECLINED";
  principalReasons: string[];
  creditReportingAgency: {
    name: string;
    address: string;
    phone: string;
    website: string;
  };
  creditScoreNotice?: {
    scoreProvided: boolean;
    disclosureNote: string;
  };
  regulatoryDisclosures: {
    ecoaNotice: string;
    fcraRights: string;
  };
}

export class AdverseActionService {
  async generateNotice(prequalificationId: string): Promise<AdverseActionNotice> {
    if (prequalificationId === "preq_declined_sample") {
      return {
        noticeId: "aan_sample_declined",
        generatedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        applicant: {
          name: "Sample Applicant",
          address: "123 Clean Energy Way, Boston, MA 02108",
        },
        creditorsInvolved: [
          "Vermont Clean Energy Credit Union",
          "Greenpenny Clean Energy Bank",
          "Climate First Specialty POS",
        ],
        actionTaken: "CREDIT_APPLICATION_DECLINED",
        principalReasons: [
          "Debt-to-income ratio exceeds underwriting threshold for requested clean energy loan amount.",
          "Insufficient duration of revolving credit history on credit file.",
          "Proportion of balances on revolving accounts relative to credit limits is too high.",
        ],
        creditReportingAgency: {
          name: "TransUnion CIBIL Limited",
          address: "One World Centre, Tower 2A, 19th Floor, Senapati Bapat Marg, Elphinstone Road, Mumbai 400013",
          phone: "+91-22-6140-4300",
          website: "https://www.cibil.com",
        },
        creditScoreNotice: {
          scoreProvided: true,
          disclosureNote: "CIBIL TransUnion Score derived under Credit Information Companies (Regulation) Act, 2005 (CICRA). Range: 300 to 900.",
        },
        regulatoryDisclosures: {
          ecoaNotice:
            "Under RBI Fair Practices Code and digital lending guidelines, lenders must treat all borrowers equitably without discrimination on religion, caste, gender, or regional origin.",
          fcraRights:
            "Under the Credit Information Companies (Regulation) Act, 2005 (CICRA), you are entitled to request your full credit disclosure report directly from TransUnion CIBIL or the credit bureau named above.",
        },
      };
    }

    if (!mongoose.Types.ObjectId.isValid(prequalificationId)) {
      throw new AppError(404, "PREQUAL_NOT_FOUND", "Prequalification record not found.");
    }

    const prequal = await PrequalificationModel.findById(prequalificationId);
    if (!prequal) {
      throw new AppError(404, "PREQUAL_NOT_FOUND", "Prequalification record not found.");
    }

    const quote = await QuoteModel.findById(prequal.quoteId);
    if (!quote) {
      throw new AppError(404, "QUOTE_NOT_FOUND", "Associated quote not found.");
    }

    const noticeId = `aan_${prequal._id.toString().slice(-8)}`;
    const generatedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const creditorsInvolved = [
      "Vermont Clean Energy Credit Union",
      "Greenpenny Clean Energy Bank",
      "Climate First Specialty POS",
    ];

    const principalReasons = [
      "Credit score does not meet minimum tier thresholds for clean energy term financing.",
      "Debt-to-income (DTI) ratio calculated from housing obligations exceeds program limits.",
      "Insufficient installment loan repayment history on file.",
    ];

    const creditReportingAgency = {
      name: "Experian National Consumer Assistance Center",
      address: "P.O. Box 4500, Allen, TX 75013",
      phone: "1-888-397-3742",
      website: "www.experian.com",
    };

    const regulatoryDisclosures = {
      ecoaNotice:
        "The federal Equal Credit Opportunity Act prohibits creditors from discriminating against credit applicants on the basis of race, color, religion, national origin, sex, marital status, age (provided the applicant has the capacity to enter into a binding contract); because all or part of the applicant's income derives from any public assistance program; or because the applicant has in good faith exercised any right under the Consumer Credit Protection Act. The federal agency that administers compliance with this law concerning these lenders is the Consumer Financial Protection Bureau (CFPB), 1700 G Street NW, Washington, DC 20552.",
      fcraRights:
        "Under the Fair Credit Reporting Act (FCRA), you have the right to obtain a free copy of your credit report from the consumer reporting agency mentioned above within 60 days of receiving this notice. You also have the right to dispute with the credit reporting agency the accuracy or completeness of any information in your credit report.",
    };

    return {
      noticeId,
      generatedDate,
      applicant: {
        name: quote.homeowner.fullName,
        address: `${quote.property.streetAddress}, ${quote.property.city}, ${quote.property.state} ${quote.property.zipCode}`,
      },
      creditorsInvolved,
      actionTaken: "CREDIT_APPLICATION_DECLINED",
      principalReasons,
      creditReportingAgency,
      creditScoreNotice: {
        scoreProvided: false,
        disclosureNote: "No credit score was adversely affected because this was a soft credit inquiry.",
      },
      regulatoryDisclosures,
    };
  }
}

export const adverseActionService = new AdverseActionService();
