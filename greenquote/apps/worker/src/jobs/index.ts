import type { Agenda, Job } from "agenda";
import type { Logger } from "pino";

export function registerJobs(agenda: Agenda, logger: Logger): void {
  agenda.define("heartbeat", async () => {
    logger.info({ at: new Date().toISOString() }, "worker heartbeat");
  });

  agenda.define("notify.dispatch", async (job: Job) => {
    logger.info({ data: job.attrs.data }, "dispatch notification (stub)");
  });

  agenda.define("lender.retry", async (job: Job) => {
    logger.info({ data: job.attrs.data }, "retry lender request (stub)");
  });

  agenda.define("document.ocr", async (job: Job) => {
    logger.info({ data: job.attrs.data }, "queue document OCR (stub)");
  });
}
