import { redis, isRedisAvailable } from "@/lib/redis";

const QUEUE_PREFIX = "queue:";
const PROCESSING_PREFIX = "queue:processing:";

function r() { return redis; }

export type QueueJob<T = unknown> = {
  id: string;
  type: string;
  data: T;
  createdAt: number;
  attempts: number;
};

/**
 * Push a job onto a named queue.
 * Falls back to immediate execution if Redis is unavailable.
 */
export async function enqueue<T>(
  queueName: string,
  jobType: string,
  data: T,
  fallbackFn?: (data: T) => Promise<void>,
): Promise<string> {
  const jobId = `${jobType}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const job: QueueJob<T> = {
    id: jobId,
    type: jobType,
    data,
    createdAt: Date.now(),
    attempts: 0,
  };

  const available = await isRedisAvailable();
  if (!available || !r()) {
    // Fallback: execute immediately if Redis is down. Awaited (not
    // fire-and-forget) so the work completes before a serverless function is
    // frozen/killed — otherwise transactional emails silently vanish.
    if (fallbackFn) {
      await fallbackFn(data).catch((err) =>
        console.error(`[Queue] Fallback execution failed for ${jobType}:`, err),
      );
    }
    return jobId;
  }

  try {
    await r()!.lpush(`${QUEUE_PREFIX}${queueName}`, JSON.stringify(job));
  } catch {
    // If enqueueing fails, run the fallback synchronously (see note above).
    if (fallbackFn) {
      await fallbackFn(data).catch((err) =>
        console.error(`[Queue] Fallback execution failed for ${jobType}:`, err),
      );
    }
  }

  return jobId;
}

/**
 * Pop and return the next job from a queue.
 * Uses RPOPLPUSH for reliability (moves to processing list).
 */
export async function dequeue<T = unknown>(
  queueName: string,
): Promise<QueueJob<T> | null> {
  const available = await isRedisAvailable();
  if (!available || !r()) return null;

  try {
    const raw = await r()!.rpoplpush(
      `${QUEUE_PREFIX}${queueName}`,
      `${PROCESSING_PREFIX}${queueName}`,
    );
    if (!raw) return null;
    return JSON.parse(raw) as QueueJob<T>;
  } catch {
    return null;
  }
}

/**
 * Mark a job as completed (remove from processing list).
 */
export async function completeJob(
  queueName: string,
  job: QueueJob,
): Promise<void> {
  const available = await isRedisAvailable();
  if (!available || !r()) return;

  try {
    await r()!.lrem(
      `${PROCESSING_PREFIX}${queueName}`,
      1,
      JSON.stringify(job),
    );
  } catch {
    // Non-critical
  }
}

const DEADLETTER_PREFIX = "queue:dead:";
const DEFAULT_MAX_ATTEMPTS = 3;

/**
 * Handle a failed job. Removes the in-flight copy from the processing list and
 * either re-queues it (with an incremented attempt count, capped at
 * `maxAttempts`) or moves it to a dead-letter list so it can be inspected.
 *
 * Without this, a job that throws stays orphaned in the processing list forever
 * — `dequeue` only reads the MAIN queue, so it would never be retried.
 */
export async function failJob(
  queueName: string,
  job: QueueJob,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
): Promise<void> {
  const available = await isRedisAvailable();
  if (!available || !r()) return;

  const client = r()!;
  const originalSerialized = JSON.stringify(job);

  try {
    // Remove the in-flight copy first so a retry can't duplicate it.
    await client.lrem(`${PROCESSING_PREFIX}${queueName}`, 1, originalSerialized);

    const nextAttempts = (job.attempts ?? 0) + 1;
    if (nextAttempts < maxAttempts) {
      const retried: QueueJob = { ...job, attempts: nextAttempts };
      await client.lpush(`${QUEUE_PREFIX}${queueName}`, JSON.stringify(retried));
    } else {
      // Exhausted retries — park in the dead-letter list (kept 7 days) instead
      // of losing it silently, so failures are visible/recoverable.
      const dead: QueueJob = { ...job, attempts: nextAttempts };
      await client
        .multi()
        .lpush(`${DEADLETTER_PREFIX}${queueName}`, JSON.stringify(dead))
        .expire(`${DEADLETTER_PREFIX}${queueName}`, 60 * 60 * 24 * 7)
        .exec();
      console.error(
        `[Queue] Job ${job.id} moved to dead-letter after ${nextAttempts} attempts`,
      );
    }
  } catch (error) {
    console.error(`[Queue] Failed to handle job failure for ${job.id}:`, error);
  }
}

/**
 * Get queue length for monitoring.
 */
export async function getQueueLength(queueName: string): Promise<number> {
  const available = await isRedisAvailable();
  if (!available || !r()) return 0;

  try {
    return await r()!.llen(`${QUEUE_PREFIX}${queueName}`);
  } catch {
    return 0;
  }
}

// === Convenience: typed queue helpers ===

export type EmailJob = {
  orderId: string;
  type: "order_confirmation" | "status_update" | "newsletter";
  customMessage?: string;
};

/**
 * Enqueue an email job for background processing.
 * Falls back to immediate sending if Redis is unavailable.
 */
export async function enqueueEmail(
  data: EmailJob,
  fallbackFn?: (data: EmailJob) => Promise<void>,
): Promise<string> {
  return enqueue("emails", "email", data, fallbackFn);
}

export type AnalyticsJob = {
  event: string;
  orderId?: string;
  productId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Enqueue an analytics event for background processing.
 */
export async function enqueueAnalytics(data: AnalyticsJob): Promise<string> {
  return enqueue("analytics", "analytics", data);
}
