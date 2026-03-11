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
    // Fallback: execute immediately if Redis is down
    if (fallbackFn) {
      fallbackFn(data).catch((err) =>
        console.error(`[Queue] Fallback execution failed for ${jobType}:`, err),
      );
    }
    return jobId;
  }

  try {
    await r()!.lpush(`${QUEUE_PREFIX}${queueName}`, JSON.stringify(job));
  } catch {
    // If enqueueing fails, try the fallback
    if (fallbackFn) {
      fallbackFn(data).catch((err) =>
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
