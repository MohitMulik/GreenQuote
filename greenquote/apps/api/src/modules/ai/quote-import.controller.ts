import { Request, Response, NextFunction } from "express";
import { quoteImportService } from "./quote-import.service.js";

export async function parseQuoteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const filename = (req.body?.filename as string) || "uploaded_quote.pdf";
    const rawText = req.body?.rawText as string | undefined;

    const result = await quoteImportService.parseDocument(filename, rawText);

    res.json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
