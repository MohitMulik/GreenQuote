import mongoose from "mongoose";
import { PrequalificationModel } from "../prequal/prequal.model.js";
import { QuoteModel } from "../quotes/quote.model.js";
import { AppError } from "../../lib/errors.js";

function mongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

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
    if (!mongoose.Types.ObjectId.isValid(prequalificationId) || !mongoReady()) {
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
