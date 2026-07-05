import { NextResponse } from "next/server";
import { dequeue, completeJob, failJob, type QueueJob, type EmailJob } from "@/lib/redis-queue";
import { sendOrderConfirmationEmails, sendOrderStatusEmail } from "@/lib/server/actions/email-actions";

const MAX_JOBS_PER_RUN = 10;
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Protect cron endpoint with secret (Vercel cron or manual trigger).
  // Fail closed: if no secret is configured, refuse rather than run unauthenticated.
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 401 },
    );
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < MAX_JOBS_PER_RUN; i++) {
    const job = await dequeue<EmailJob>("emails");
    if (!job) break;

    try {
      switch (job.data.type) {
        case "order_confirmation":
          await sendOrderConfirmationEmails(job.data.orderId);
          break;
        case "status_update":
          await sendOrderStatusEmail(job.data.orderId, job.data.customMessage);
          break;
        default:
          console.warn(`[Queue Worker] Unknown email job type: ${job.data.type}`);
      }
      await completeJob("emails", job as QueueJob);
      processed++;
    } catch (err) {
      console.error(`[Queue Worker] Failed to process email job ${job.id}:`, err);
      failed++;
      // Re-queue with an incremented attempt count (or dead-letter once the
      // retry budget is exhausted). Without this the job would be orphaned in
      // the processing list and never retried.
      await failJob("emails", job as QueueJob);
    }
  }

  return NextResponse.json({ processed, failed });
}
