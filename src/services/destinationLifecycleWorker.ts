import {
  doc as webDoc,
  getDoc as webGetDoc,
  updateDoc as webUpdateDoc,
  setDoc as webSetDoc,
  collection as webCollection,
  getDocs as webGetDocs,
  query as webQuery,
  where as webWhere,
  limit as webLimit,
  runTransaction,
  Firestore,
  Timestamp,
} from 'firebase/firestore';
import crypto from 'crypto';

export const WORKER_INSTANCE_ID = `worker-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
let isWorkerRunning = false;

export type JobStatus = 'queued' | 'processing' | 'completed' | 'retry' | 'dead';

export interface EnrichmentJob {
  id: string; // SHA-256 deterministic hash
  destinationId: string;
  jobType: 'basic_enrichment' | 'vector_embedding' | 'alias_sync' | 'summary_generation';
  jobVersion: number;
  status: JobStatus;
  priority: number;
  payload?: any;
  lockedBy?: string | null;
  leaseExpiresAt?: Timestamp | null;
  leaseVersion: number;
  fencingToken: string | null;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Timestamp | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  lastErrorAt?: Timestamp | null;
  totalErrorCount?: number;
  errorHistory: Array<{ timestamp: Timestamp | string; errorCode?: string; message: string }>;
  deadAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp | null;
}

export interface ClaimedJobContext {
  jobId: string;
  workerId: string;
  leaseVersion: number;
  fencingToken: string;
  destinationId: string;
}

const LEASE_DURATION_MS = 60 * 1000; // 60 seconds
const HEARTBEAT_INTERVAL_MS = 20 * 1000; // 20 seconds
const MAX_ERROR_HISTORY_LENGTH = 10;

/**
 * Single Centralized Job State Machine transition validator.
 * Prevents invalid state regressions.
 */
export function isValidJobTransition(
  fromStatus: JobStatus,
  toStatus: JobStatus,
  isExpiredProcessing: boolean = false
): boolean {
  if (fromStatus === 'completed' || fromStatus === 'dead') {
    // Strictly FORBIDDEN: completed -> processing, dead -> processing
    return false;
  }

  if (fromStatus === 'queued' && toStatus === 'processing') return true;
  if (fromStatus === 'processing' && toStatus === 'completed') return true;
  if (fromStatus === 'processing' && toStatus === 'retry') return true;
  if (fromStatus === 'processing' && toStatus === 'dead') return true;
  if (fromStatus === 'retry' && toStatus === 'processing') return true;
  if (fromStatus === 'processing' && isExpiredProcessing && toStatus === 'processing') return true;

  return false;
}

/**
 * Calculates exponential backoff with jitter.
 * 1st: 1m (60s)
 * 2nd: 5m (300s)
 * 3rd: 30m (1800s)
 * 4th: 2h (7200s)
 */
export function calculateExponentialBackoffMs(attemptNumber: number): number {
  let baseMs = 60 * 1000;
  if (attemptNumber === 2) baseMs = 5 * 60 * 1000;
  else if (attemptNumber === 3) baseMs = 30 * 60 * 1000;
  else if (attemptNumber >= 4) baseMs = 120 * 60 * 1000;

  // Jitter +/- 10%
  const jitter = (Math.random() - 0.5) * 0.2 * baseMs;
  return Math.max(1000, Math.floor(baseMs + jitter));
}

/**
 * Generates a deterministic SHA-256 Idempotency Job ID from destinationId, jobType, and jobVersion.
 */
export function generateDeterministicJobId(
  destinationId: string,
  jobType: string,
  jobVersion: number
): string {
  const rawKey = `${destinationId}:${jobType}:${jobVersion}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Converts a Timestamp, Date, or ISO string to Firestore Timestamp.
 */
export function ensureTimestamp(val: any): Timestamp {
  if (val && typeof val.toMillis === 'function') {
    return val as Timestamp;
  }
  if (val instanceof Date) {
    return Timestamp.fromDate(val);
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return Timestamp.fromDate(d);
    }
  }
  return Timestamp.now();
}

/**
 * Helper to get milliseconds safely from Timestamp, Date, or string.
 */
export function getMillis(val: any): number {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.getTime === 'function') return val.getTime();
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  return 0;
}

/**
 * Heartbeat worker lease extension in Firestore Transaction.
 * Verifies ALL 6 Lock conditions:
 * - Job exists
 * - status === 'processing'
 * - lockedBy === workerId
 * - leaseVersion === claimedLeaseVersion
 * - fencingToken === claimedFencingToken
 * - leaseExpiresAt > now
 *
 * Returns true if lease successfully extended; false if lock lost.
 */
export async function sendLeaseHeartbeat(
  webDb: Firestore,
  claim: ClaimedJobContext
): Promise<boolean> {
  let success = false;
  try {
    const jobRef = webDoc(webDb, 'enrichment_jobs', claim.jobId);
    await runTransaction(webDb, async (tx) => {
      const snap = await tx.get(jobRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const nowMs = Date.now();
      const leaseExpiresAtMs = getMillis(data.leaseExpiresAt);

      if (
        data.status === 'processing' &&
        data.lockedBy === claim.workerId &&
        data.leaseVersion === claim.leaseVersion &&
        data.fencingToken === claim.fencingToken &&
        leaseExpiresAtMs > nowMs
      ) {
        const newLeaseExpiresAt = Timestamp.fromMillis(nowMs + LEASE_DURATION_MS);
        const nowTs = Timestamp.now();
        tx.update(jobRef, {
          leaseExpiresAt: newLeaseExpiresAt,
          updatedAt: nowTs,
        });
        success = true;
      }
    });
  } catch (err: any) {
    console.warn(`[HEARTBEAT_FAILED] Heartbeat failed for ${claim.jobId}: ${err.message}`);
    success = false;
  }
  return success;
}

/**
 * Enqueues an enrichment job using deterministic SHA-256 Idempotency Key:
 * `sha256(${destinationId}:${jobType}:${jobVersion})`
 */
export async function enqueueDestinationEnrichment(
  webDb: Firestore,
  destinationId: string,
  jobType: 'basic_enrichment' | 'vector_embedding' | 'alias_sync' | 'summary_generation' = 'basic_enrichment',
  jobVersion: number = 1,
  priority: number = 10
) {
  try {
    const jobId = generateDeterministicJobId(destinationId, jobType, jobVersion);
    const jobRef = webDoc(webDb, 'enrichment_jobs', jobId);
    const nowTs = Timestamp.now();

    const existingSnap = await webGetDoc(jobRef);
    if (!existingSnap.exists()) {
      await webSetDoc(jobRef, {
        id: jobId,
        destinationId,
        jobType,
        jobVersion,
        status: 'queued',
        priority,
        lockedBy: null,
        leaseExpiresAt: null,
        leaseVersion: 0,
        fencingToken: null,
        attempts: 0,
        maxAttempts: 5,
        nextRetryAt: nowTs,
        errorHistory: [],
        totalErrorCount: 0,
        createdAt: nowTs,
        updatedAt: nowTs,
      });
      console.log(`[ENRICHMENT_QUEUE] Enqueued job with SHA-256 Idempotency Key: ${jobId}`);
    } else {
      const data = existingSnap.data();
      if (data.status === 'completed' && data.jobVersion === jobVersion) {
        console.log(`[ENRICHMENT_QUEUE] Deterministic Re-execution Blocked: Job ${jobId} is already completed for version ${jobVersion}. Skipping recreate.`);
        return;
      }
    }

    if (!isWorkerRunning) {
      processQueue(webDb).catch(console.error);
    }
  } catch (err: any) {
    console.error('[ENRICHMENT_QUEUE_ERROR] Failed to enqueue:', err.message);
  }
}

/**
 * Process Queue with Fencing Token & Transaction-based Commit for Multi-Instance Safety.
 * Handles Worker Failure Recovery, Lock Loss Aborts, and Bounded Error History.
 */
export async function processQueue(webDb: Firestore) {
  if (isWorkerRunning || !webDb) return;
  isWorkerRunning = true;

  try {
    const nowMs = Date.now();

    const jobsSnap = await webGetDocs(
      webQuery(webCollection(webDb, 'enrichment_jobs'), webLimit(20))
    );

    const candidateDocs = jobsSnap.docs.filter((d) => {
      const data = d.data();
      const leaseExpiresAtMs = getMillis(data.leaseExpiresAt);
      const nextRetryAtMs = getMillis(data.nextRetryAt);

      if (data.status === 'queued') return true;
      if (data.status === 'processing' && leaseExpiresAtMs > 0 && leaseExpiresAtMs <= nowMs) return true;
      if (data.status === 'retry' && nextRetryAtMs > 0 && nextRetryAtMs <= nowMs) return true;
      return false;
    });

    for (const docSnap of candidateDocs) {
      const jobId = docSnap.id;
      const jobRef = webDoc(webDb, 'enrichment_jobs', jobId);

      let jobClaimed = false;
      let claimContext: ClaimedJobContext | null = null;
      let targetDestinationId = '';

      // 1. ATOMIC TRANSACTION LEASE CLAIM WITH FENCING TOKEN & LEASE VERSION INCREMENT
      try {
        await runTransaction(webDb, async (transaction) => {
          const freshSnap = await transaction.get(jobRef);
          if (!freshSnap.exists()) return;

          const freshData = freshSnap.data();
          const currentNowMs = Date.now();
          const leaseExpiresAtMs = getMillis(freshData.leaseExpiresAt);
          const isExpired =
            freshData.status === 'processing' &&
            Boolean(leaseExpiresAtMs > 0 && leaseExpiresAtMs <= currentNowMs);

          const canClaim =
            (freshData.status === 'queued' && isValidJobTransition('queued', 'processing')) ||
            (freshData.status === 'retry' && isValidJobTransition('retry', 'processing')) ||
            (isExpired && isValidJobTransition('processing', 'processing', true));

          if (canClaim) {
            const newLeaseVersion = (freshData.leaseVersion || 0) + 1;
            const newFencingToken = `ft-${crypto.randomBytes(8).toString('hex')}-${currentNowMs}`;
            const newLeaseExpiresAt = Timestamp.fromMillis(currentNowMs + LEASE_DURATION_MS);
            const nowTs = Timestamp.now();

            transaction.update(jobRef, {
              status: 'processing',
              lockedBy: WORKER_INSTANCE_ID,
              leaseExpiresAt: newLeaseExpiresAt,
              leaseVersion: newLeaseVersion,
              fencingToken: newFencingToken,
              attempts: (freshData.attempts || 0) + 1,
              updatedAt: nowTs,
            });

            jobClaimed = true;
            targetDestinationId = freshData.destinationId;
            claimContext = {
              jobId,
              workerId: WORKER_INSTANCE_ID,
              leaseVersion: newLeaseVersion,
              fencingToken: newFencingToken,
              destinationId: freshData.destinationId,
            };
          }
        });
      } catch (txErr: any) {
        console.warn(`[LIFECYCLE_WORKER] Transaction lease claim failed for ${jobId}:`, txErr.message);
        continue;
      }

      if (!jobClaimed || !claimContext) continue;

      const claim = claimContext as ClaimedJobContext;
      let isLockLost = false;

      // AbortController for cancelling asynchronous work if lock is lost
      const abortController = new AbortController();

      // Start periodic Heartbeat interval
      const heartbeatInterval = setInterval(() => {
        sendLeaseHeartbeat(webDb, claim).then((extended) => {
          if (!extended) {
            console.error(
              `[LOCK_LOST_WARNING] Worker ${claim.workerId} lost lock on job ${claim.jobId} (fencing token: ${claim.fencingToken})!`
            );
            isLockLost = true;
            abortController.abort();
          }
        });
      }, HEARTBEAT_INTERVAL_MS);

      try {
        if (isLockLost || abortController.signal.aborted) {
          console.error(`[SAFETY_ABORT] Worker ${claim.workerId} detected lock loss before execution. Aborting job ${claim.jobId}.`);
          continue;
        }

        const destRef = webDoc(webDb, 'destinations', claim.destinationId);
        const destSnap = await webGetDoc(destRef);

        let enrichmentPayload: any = null;

        if (destSnap.exists()) {
          const dest = destSnap.data();

          // Prevent invalid state regressions on destination
          if (dest.status !== 'active' && ['provisional', 'enriching'].includes(dest.lifecycleStatus)) {
            const hasBasicGeo = dest.location && dest.timezoneId;
            const canBeActive = hasBasicGeo;
            const nextStatus = canBeActive ? 'active' : 'limited';
            const nowTs = Timestamp.now();

            enrichmentPayload = {
              lifecycleStatus: nextStatus,
              status: nextStatus,
              'capabilities.weather.status': 'verified',
              'capabilities.holidays.status': 'verified',
              'capabilities.festivals.status': 'unsupported',
              'capabilities.airQuality.status': 'unsupported',
              'enrichment.status': 'completed',
              'enrichment.completedAt': nowTs,
              'enrichment.lastAttemptAt': nowTs,
              updatedAt: nowTs,
            };
          }
        }

        if (isLockLost || abortController.signal.aborted) {
          console.error(`[SAFETY_ABORT_DURING_EXEC] Lock lost during execution for ${claim.jobId}. Aborting commit.`);
          continue;
        }

        // 2. ATOMIC TRANSACTION RESULT COMMIT & JOB COMPLETION
        // Single Firestore Transaction verifying lockedBy, leaseVersion, fencingToken, leaseExpiresAt > transactionNow
        let commitSuccess = false;
        await runTransaction(webDb, async (tx) => {
          const freshJobSnap = await tx.get(jobRef);
          if (!freshJobSnap.exists()) throw new Error('Job document missing');

          const freshJob = freshJobSnap.data();
          const txNowMs = Date.now();
          const leaseExpiresAtMs = getMillis(freshJob.leaseExpiresAt);

          // STRICT ASSERTIONS
          if (freshJob.status !== 'processing') {
            throw new Error(`Invalid status: expected 'processing', got '${freshJob.status}'`);
          }
          if (freshJob.lockedBy !== claim.workerId) {
            throw new Error(`Lock stolen: expected '${claim.workerId}', got '${freshJob.lockedBy}'`);
          }
          if (freshJob.leaseVersion !== claim.leaseVersion) {
            throw new Error(`Lease version mismatch: expected ${claim.leaseVersion}, got ${freshJob.leaseVersion}`);
          }
          if (freshJob.fencingToken !== claim.fencingToken) {
            throw new Error(`Fencing token mismatch: expected '${claim.fencingToken}', got '${freshJob.fencingToken}'`);
          }
          if (leaseExpiresAtMs <= txNowMs) {
            throw new Error(`Lease expired: ${leaseExpiresAtMs} <= ${txNowMs}`);
          }

          const nowTs = Timestamp.now();

          // Write destination enrichment results inside transaction
          if (enrichmentPayload && destSnap.exists()) {
            tx.update(destRef, enrichmentPayload);
          }

          // Mark job status = completed and clear lock fields inside transaction
          tx.update(jobRef, {
            status: 'completed',
            completedAt: nowTs,
            updatedAt: nowTs,
            lockedBy: null,
            leaseExpiresAt: null,
            fencingToken: null,
          });

          commitSuccess = true;
        });

        if (commitSuccess) {
          console.log(
            `[LIFECYCLE_WORKER] Job ${claim.jobId} ATOMICALLY COMMITTED & COMPLETED by Worker ${claim.workerId}`
          );
        }
      } catch (execErr: any) {
        console.error(`[LIFECYCLE_WORKER] Job execution / commit error on ${claim.jobId}:`, execErr.message);

        if (isLockLost) {
          console.warn(`[WORKER_LOCK_LOST_IGNORE] Lock was lost for ${claim.jobId}. Skipping error state update.`);
          continue;
        }

        // Retry / Dead-letter handling
        try {
          const nowTs = Timestamp.now();
          const freshJobSnap = await webGetDoc(jobRef);
          if (!freshJobSnap.exists()) continue;

          const jobData = freshJobSnap.data();
          const currentAttempts = jobData.attempts || 1;
          const maxAttempts = jobData.maxAttempts || 5;

          const existingHistory = Array.isArray(jobData.errorHistory) ? jobData.errorHistory : [];
          const newHistoryEntry = {
            timestamp: nowTs,
            errorCode: execErr.code || 'EXECUTION_ERROR',
            message: execErr.message || 'Unknown error',
          };

          // Bound errorHistory to MAX 10 entries
          const updatedHistory = [...existingHistory, newHistoryEntry].slice(-MAX_ERROR_HISTORY_LENGTH);

          if (currentAttempts >= maxAttempts) {
            // Dead-letter Queue: status = 'dead'
            await webUpdateDoc(jobRef, {
              status: 'dead',
              lockedBy: null,
              leaseExpiresAt: null,
              fencingToken: null,
              lastErrorCode: execErr.code || 'EXECUTION_ERROR',
              lastErrorMessage: execErr.message,
              lastErrorAt: nowTs,
              totalErrorCount: (jobData.totalErrorCount || 0) + 1,
              errorHistory: updatedHistory,
              deadAt: nowTs,
              updatedAt: nowTs,
            });
            console.error(`[DEAD_LETTER] Job ${claim.jobId} exceeded max attempts (${maxAttempts}). Marked DEAD.`);
          } else {
            // Scheduled Retry with Exponential Backoff + Jitter
            const backoffMs = calculateExponentialBackoffMs(currentAttempts);
            const nextRetryAtTs = Timestamp.fromMillis(Date.now() + backoffMs);

            await webUpdateDoc(jobRef, {
              status: 'retry',
              lockedBy: null,
              leaseExpiresAt: null,
              fencingToken: null,
              nextRetryAt: nextRetryAtTs,
              lastErrorCode: execErr.code || 'EXECUTION_ERROR',
              lastErrorMessage: execErr.message,
              lastErrorAt: nowTs,
              totalErrorCount: (jobData.totalErrorCount || 0) + 1,
              errorHistory: updatedHistory,
              updatedAt: nowTs,
            });
            console.log(
              `[RETRY_SCHEDULED] Job ${claim.jobId} attempt ${currentAttempts}/${maxAttempts} failed. Retry in ${Math.round(
                backoffMs / 1000
              )}s`
            );
          }
        } catch (updateErr: any) {
          console.error(`[LIFECYCLE_WORKER] Error status update failed for ${claim.jobId}:`, updateErr.message);
        }
      } finally {
        clearInterval(heartbeatInterval);
      }
    }
  } finally {
    isWorkerRunning = false;
  }
}

export interface OperatorReplayRequest {
  jobId: string;
  operatorUserId: string;
  isOperator: boolean;
  newJobVersion?: number;
  manualReplayVersion?: string;
}

/**
 * Re-executes an enrichment job according to Deterministic Re-execution Policy.
 * Completed jobs are NEVER auto-recreated.
 * Re-execution requires jobVersion increment or approved manualReplayVersion.
 * Restricted to operator users only.
 */
export async function replayJobByOperator(
  webDb: Firestore,
  req: OperatorReplayRequest
): Promise<{ success: boolean; message: string; newJobId?: string }> {
  if (!req.isOperator) {
    return {
      success: false,
      message: 'Unauthorized: Only operator role can manually replay enrichment jobs.',
    };
  }

  const jobRef = webDoc(webDb, 'enrichment_jobs', req.jobId);
  const snap = await webGetDoc(jobRef);
  if (!snap.exists()) {
    return { success: false, message: `Job ${req.jobId} not found` };
  }

  const data = snap.data() as EnrichmentJob;
  if (data.status === 'completed' && !req.newJobVersion && !req.manualReplayVersion) {
    return {
      success: false,
      message: `Completed job cannot be re-executed with same jobVersion (${data.jobVersion}) without incrementing version or manualReplayVersion.`,
    };
  }

  const nextVersion = req.newJobVersion || data.jobVersion + 1;
  const newJobId = generateDeterministicJobId(data.destinationId, data.jobType, nextVersion);
  const nowTs = Timestamp.now();

  const newJobRef = webDoc(webDb, 'enrichment_jobs', newJobId);
  await webSetDoc(newJobRef, {
    id: newJobId,
    destinationId: data.destinationId,
    jobType: data.jobType,
    jobVersion: nextVersion,
    status: 'queued',
    priority: data.priority || 10,
    lockedBy: null,
    leaseExpiresAt: null,
    leaseVersion: 0,
    fencingToken: null,
    attempts: 0,
    maxAttempts: data.maxAttempts || 5,
    nextRetryAt: nowTs,
    manualReplayVersion: req.manualReplayVersion || `manual-${Date.now()}`,
    replayedBy: req.operatorUserId,
    errorHistory: [],
    totalErrorCount: 0,
    createdAt: nowTs,
    updatedAt: nowTs,
  });

  return {
    success: true,
    message: `Successfully re-queued job with new version ${nextVersion}`,
    newJobId,
  };
}

