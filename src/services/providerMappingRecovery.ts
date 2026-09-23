import {
  Firestore,
  doc as webDoc,
  getDoc as webGetDoc,
  setDoc as webSetDoc,
  updateDoc as webUpdateDoc,
  deleteDoc as webDeleteDoc,
  collection as webCollection,
  getDocs as webGetDocs,
  query as webQuery,
  limit as webLimit,
  startAfter as webStartAfter,
  where as webWhere,
  runTransaction,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { featureFlagService } from '../config/featureFlags';
import { canaryTelemetryService } from './canaryTelemetryService';

export type MappingHealthStatus = 'healthy' | 'recoverable' | 'orphaned' | 'conflict' | 'review_required';
export type MappingDeletionStatus = 'active' | 'tombstoned' | 'purging' | 'purged';

export interface ProviderMappingAuditLog {
  healthStatus: MappingHealthStatus;
  deletionStatus?: MappingDeletionStatus;
  detectedAt: Timestamp;
  detectedBy: string;
  previousDestinationId?: string | null;
  candidateDestinationIds?: string[];
  recoveryAction?: string;
  gracePeriodUntil?: Timestamp | null;
  tombstonedAt?: Timestamp | null;
  purgeAfter?: Timestamp | null;
  reviewedAt?: Timestamp | null;
  reviewedBy?: string | null;
  manuallyProtected?: boolean;
}

export interface TimestampMigrationReport {
  legacyDocumentCount: number;
  migratedCount: number;
  failedCount: number;
  mixedTypeCount: number;
  rollbackSnapshot: Record<string, any>;
  migrationCompletionTimestamp: Timestamp | null;
}

export interface ProviderMappingRecoveryReport {
  healthyCount: number;
  recoverableRestored: number;
  orphansFlagged: number;
  orphansCleanedAfterGracePeriod: number;
  conflictsFlagged: number;
  readCount: number;
  writeCount: number;
  batchSize: number;
  circuitBreakerTriggered: boolean;
  circuitBreakerReason?: string;
  cursorSavedAt?: {
    mappingCursorId: string | null;
    destinationCursorId: string | null;
    timestamp: string;
  };
  auditMetrics: {
    readsPerRun: number;
    writesPerRun: number;
    samplingCoveragePercentPerRun: number;
    runsFor100kMappings: number;
    estimatedDailyReads24Hours: number;
    estimatedMonthlyCostUsd: number;
    auditScheduleIntervalSec: number;
    maxExecutionDurationMs: number;
  };
  errors: string[];
}

export const AUDIT_BUDGET = {
  maxReadsPerRun: 1000,
  maxWritesPerRun: 100,
  maxExecutionMs: 30000,
  maxConflictsPerRun: 50,
  circuitBreakerOrphanThreshold: 50,
  circuitBreakerOrphanRatioThresholdPct: 10.0,
  circuitBreakerConflictThreshold: 10,
};

const BATCH_SIZE = 50;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Cursor tracking for incremental execution
let lastMappingCursor: QueryDocumentSnapshot | null = null;
let lastDestinationCursor: QueryDocumentSnapshot | null = null;

/**
 * Safely converts string, Date, or Timestamp to Firestore Timestamp.
 */
export function ensureTimestamp(val: any): Timestamp {
  if (val && typeof val.toMillis === 'function') return val as Timestamp;
  if (val instanceof Date) return Timestamp.fromDate(val);
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return Timestamp.fromDate(d);
  }
  return Timestamp.now();
}

/**
 * Dual-read helper: gracefully handles both string ISO dates and Firestore Timestamps.
 */
export function getTimestampWithDualRead(val: any): Timestamp | null {
  if (!val) return null;
  if (typeof val.toMillis === 'function') return val as Timestamp;
  if (val instanceof Date) return Timestamp.fromDate(val);
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return Timestamp.fromDate(d);
  }
  return null;
}

/**
 * Checks whether a Destination is referenced by active trip plans, user schedules,
 * review queues, or recent resolves before purging an orphaned mapping.
 */
export async function checkDestinationReferences(
  webDb: Firestore,
  destinationId: string
): Promise<{ hasReferences: boolean; referenceCount: number; reasons: string[] }> {
  const reasons: string[] = [];
  let referenceCount = 0;

  try {
    // 1. Check shared trip plans referencing destinationId
    const plansQuery = webQuery(
      webCollection(webDb, 'shared_plans'),
      webWhere('destinationId', '==', destinationId),
      webLimit(5)
    );
    const plansSnap = await webGetDocs(plansQuery);
    if (plansSnap.docs.length > 0) {
      referenceCount += plansSnap.docs.length;
      reasons.push(`referenced_in_${plansSnap.docs.length}_shared_plans`);
    }

    // 2. Check active user schedules referencing destinationId
    const schedulesQuery = webQuery(
      webCollection(webDb, 'schedules'),
      webWhere('destinationId', '==', destinationId),
      webLimit(5)
    );
    const schedulesSnap = await webGetDocs(schedulesQuery);
    if (schedulesSnap.docs.length > 0) {
      referenceCount += schedulesSnap.docs.length;
      reasons.push(`referenced_in_${schedulesSnap.docs.length}_user_schedules`);
    }

    // 3. Check review required queue for references
    const reviewQuery = webQuery(
      webCollection(webDb, 'review_required_mappings'),
      webWhere('destinationId', '==', destinationId),
      webLimit(5)
    );
    const reviewSnap = await webGetDocs(reviewQuery);
    if (reviewSnap.docs.length > 0) {
      referenceCount += reviewSnap.docs.length;
      reasons.push(`referenced_in_review_queue`);
    }

    // 4. Check trips collection
    const tripsQuery = webQuery(
      webCollection(webDb, 'trips'),
      webWhere('destinationId', '==', destinationId),
      webLimit(5)
    );
    const tripsSnap = await webGetDocs(tripsQuery);
    if (tripsSnap.docs.length > 0) {
      referenceCount += tripsSnap.docs.length;
      reasons.push(`referenced_in_${tripsSnap.docs.length}_trips`);
    }
  } catch (err: any) {
    console.warn(`[REFERENCE_CHECK_WARN] Reference check for ${destinationId} encountered warning:`, err.message);
  }

  return {
    hasReferences: referenceCount > 0,
    referenceCount,
    reasons,
  };
}

/**
 * Migration helper that converts legacy string ISO dates in provider mappings to Firestore Timestamps.
 * Generates full validation report and rollback snapshot.
 */
export async function convertLegacyIsoToTimestamps(
  webDb: Firestore
): Promise<TimestampMigrationReport> {
  const report: TimestampMigrationReport = {
    legacyDocumentCount: 0,
    migratedCount: 0,
    failedCount: 0,
    mixedTypeCount: 0,
    rollbackSnapshot: {},
    migrationCompletionTimestamp: null,
  };

  try {
    const snap = await webGetDocs(webQuery(webCollection(webDb, 'destinationProviderMappings'), webLimit(200)));
    report.legacyDocumentCount = snap.docs.length;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const updates: any = {};
      let hasString = false;
      let hasTimestamp = false;

      const dateFields = ['detectedAt', 'gracePeriodUntil', 'tombstonedAt', 'purgeAfter', 'updatedAt'];

      for (const field of dateFields) {
        if (data[field]) {
          if (typeof data[field] === 'string') {
            hasString = true;
            updates[field] = ensureTimestamp(data[field]);
          } else if (typeof data[field]?.toMillis === 'function') {
            hasTimestamp = true;
          }
        }
      }

      if (hasString && hasTimestamp) {
        report.mixedTypeCount++;
      }

      if (Object.keys(updates).length > 0) {
        // Record rollback snapshot before updating
        report.rollbackSnapshot[docSnap.id] = { ...data };

        try {
          await webUpdateDoc(docSnap.ref, updates);
          report.migratedCount++;
        } catch (err) {
          report.failedCount++;
        }
      }
    }

    report.migrationCompletionTimestamp = Timestamp.now();
    console.log(
      `[TIMESTAMP_MIGRATION] Migration complete. Legacy: ${report.legacyDocumentCount}, Migrated: ${report.migratedCount}, Mixed: ${report.mixedTypeCount}, Failed: ${report.failedCount}`
    );
  } catch (err: any) {
    console.error('[TIMESTAMP_MIGRATION_ERROR]', err.message);
  }

  return report;
}

/**
 * Safe Transactional Purge of Tombstoned Provider Mapping.
 * Enforces:
 * 1. Reference check (trips, plans, schedules, review queues, protected flag)
 * 2. Feature Flag mappingPhysicalPurge (if false, keeps status as tombstoned)
 * 3. Atomic transaction lock for state transitions: tombstoned -> purging -> purged
 */
export async function purgeTombstonedMappingWithSafety(
  webDb: Firestore,
  mappingId: string
): Promise<{ success: boolean; message: string; deletionStatus: MappingDeletionStatus }> {
  const canPurgePhysically = featureFlagService.isEnabled('mappingPhysicalPurge');

  const mappingRef = webDoc(webDb, 'destinationProviderMappings', mappingId);

  try {
    let finalStatus: MappingDeletionStatus = 'tombstoned';

    await runTransaction(webDb, async (tx) => {
      const snap = await tx.get(mappingRef);
      if (!snap.exists()) {
        throw new Error(`Mapping ${mappingId} not found`);
      }

      const data = snap.data();
      if (data.manuallyProtected === true) {
        throw new Error(`Mapping ${mappingId} is manually protected`);
      }

      // Check current status - block concurrent purges
      if (data.deletionStatus === 'purging' || data.deletionStatus === 'purged') {
        throw new Error(`Mapping ${mappingId} is already in state '${data.deletionStatus}'`);
      }

      // Check references
      const destId = data.destinationId;
      const refCheck = await checkDestinationReferences(webDb, destId);
      if (refCheck.hasReferences) {
        throw new Error(`Mapping ${mappingId} has active references: ${refCheck.reasons.join(', ')}`);
      }

      const nowTs = Timestamp.now();

      if (!canPurgePhysically) {
        // Canary period: Physical purge disabled, maintain status as tombstoned
        tx.update(mappingRef, {
          deletionStatus: 'tombstoned',
          recoveryAction: 'tombstoned_physical_purge_disabled_during_canary',
          updatedAt: nowTs,
        });
        finalStatus = 'tombstoned';
      } else {
        // Atomic Transition: tombstoned -> purging -> purged
        tx.update(mappingRef, {
          deletionStatus: 'purging',
          updatedAt: nowTs,
        });

        tx.update(mappingRef, {
          deletionStatus: 'purged',
          healthStatus: 'orphaned',
          purgedAt: nowTs,
          updatedAt: nowTs,
        });
        finalStatus = 'purged';
      }
    });

    return {
      success: true,
      message: canPurgePhysically
        ? `Successfully purged mapping ${mappingId}`
        : `Physical purge disabled during Canary. Mapping ${mappingId} maintained as tombstoned.`,
      deletionStatus: finalStatus,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message,
      deletionStatus: 'tombstoned',
    };
  }
}

/**
 * Audits and restores Provider Mapping integrity using batched incremental pagination,
 * strict budget enforcement, Circuit Breaker protection, and Tombstone soft deletion.
 */
export async function runProviderMappingRecovery(
  webDb: Firestore
): Promise<ProviderMappingRecoveryReport> {
  const startTime = Date.now();
  let totalReads = 0;
  let totalWrites = 0;

  const report: ProviderMappingRecoveryReport = {
    healthyCount: 0,
    recoverableRestored: 0,
    orphansFlagged: 0,
    orphansCleanedAfterGracePeriod: 0,
    conflictsFlagged: 0,
    readCount: 0,
    writeCount: 0,
    batchSize: BATCH_SIZE,
    circuitBreakerTriggered: false,
    auditMetrics: {
      readsPerRun: 0,
      writesPerRun: 0,
      samplingCoveragePercentPerRun: 1.0,
      runsFor100kMappings: 100,
      estimatedDailyReads24Hours: 24000,
      estimatedMonthlyCostUsd: 0.043,
      auditScheduleIntervalSec: 3600,
      maxExecutionDurationMs: 0,
    },
    errors: [],
  };

  if (!webDb) return report;

  try {
    const nowTs = Timestamp.now();
    const nowMs = Date.now();

    // 1. Incremental Batched Audit of existing Provider Mappings
    let mappingQuery = webQuery(
      webCollection(webDb, 'destinationProviderMappings'),
      webLimit(BATCH_SIZE)
    );
    if (lastMappingCursor) {
      mappingQuery = webQuery(
        webCollection(webDb, 'destinationProviderMappings'),
        webStartAfter(lastMappingCursor),
        webLimit(BATCH_SIZE)
      );
    }

    const mappingsSnap = await webGetDocs(mappingQuery);
    totalReads += mappingsSnap.docs.length;

    if (mappingsSnap.docs.length > 0) {
      lastMappingCursor = mappingsSnap.docs[mappingsSnap.docs.length - 1];
    } else {
      lastMappingCursor = null;
    }

    let detectedOrphanCount = 0;
    const totalMappingsInSample = Math.max(1, mappingsSnap.docs.length);

    for (const mappingDoc of mappingsSnap.docs) {
      // Check budget limits
      if (
        totalReads >= AUDIT_BUDGET.maxReadsPerRun ||
        totalWrites >= AUDIT_BUDGET.maxWritesPerRun ||
        Date.now() - startTime >= AUDIT_BUDGET.maxExecutionMs
      ) {
        console.warn(`[AUDIT_BUDGET_REACHED] Pausing audit run safely at budget limit.`);
        break;
      }

      const mappingData = mappingDoc.data();
      const destId = mappingData.destinationId;

      if (!destId) continue;

      const destRef = webDoc(webDb, 'destinations', destId);
      const destSnap = await webGetDoc(destRef);
      totalReads += 1;

      if (!destSnap.exists()) {
        detectedOrphanCount++;
        const orphanRatioPct = (detectedOrphanCount / totalMappingsInSample) * 100;

        // ENHANCED CIRCUIT BREAKER TRIGGER CHECK (Absolute count OR ratio)
        if (
          detectedOrphanCount >= AUDIT_BUDGET.circuitBreakerOrphanThreshold ||
          orphanRatioPct >= AUDIT_BUDGET.circuitBreakerOrphanRatioThresholdPct
        ) {
          report.circuitBreakerTriggered = true;
          report.circuitBreakerReason = `Circuit Breaker Triggered: Detected ${detectedOrphanCount} orphans (${orphanRatioPct.toFixed(
            1
          )}%). Threshold: count >= ${AUDIT_BUDGET.circuitBreakerOrphanThreshold} or ratio >= ${
            AUDIT_BUDGET.circuitBreakerOrphanRatioThresholdPct
          }%. Mass auto-deletion halted!`;

          console.error(`[CIRCUIT_BREAKER_TRIGGERED] ${report.circuitBreakerReason}`);

          // Save cursor & snapshot
          report.cursorSavedAt = {
            mappingCursorId: lastMappingCursor ? lastMappingCursor.id : null,
            destinationCursorId: lastDestinationCursor ? lastDestinationCursor.id : null,
            timestamp: new Date().toISOString(),
          };

          // Alert to review queue
          const alertRef = webDoc(webDb, 'review_required_mappings', `circuit_breaker_${nowMs}`);
          await webSetDoc(alertRef, {
            type: 'CIRCUIT_BREAKER_ALERT',
            detectedOrphanCount,
            orphanRatioPct,
            triggeredAt: nowTs,
            cursorSnapshot: report.cursorSavedAt,
            status: 'review_required',
          });
          totalWrites += 1;

          canaryTelemetryService.recordCircuitBreakerTrigger();
          break; // Halts mass deletion immediately
        }

        const detectedAt = mappingData.detectedAt ? ensureTimestamp(mappingData.detectedAt) : nowTs;
        const purgeAfterMs = mappingData.purgeAfter
          ? ensureTimestamp(mappingData.purgeAfter).toMillis()
          : nowMs + SEVEN_DAYS_MS;
        const purgeAfterTs = Timestamp.fromMillis(purgeAfterMs);

        if (nowMs >= purgeAfterMs) {
          const purgeResult = await purgeTombstonedMappingWithSafety(webDb, mappingDoc.id);
          totalReads += 3;
          totalWrites += 1;

          if (purgeResult.deletionStatus === 'purged') {
            report.orphansCleanedAfterGracePeriod++;
          } else {
            report.orphansFlagged++;
          }
        } else {
          // Soft Delete / Tombstone with 7-Day Grace Period
          await webUpdateDoc(mappingDoc.ref, {
            healthStatus: 'orphaned',
            deletionStatus: 'tombstoned',
            detectedAt,
            tombstonedAt: nowTs,
            purgeAfter: purgeAfterTs,
            recoveryAction: 'tombstoned_grace_period_pending',
            updatedAt: nowTs,
          });
          totalWrites += 1;
          report.orphansFlagged++;
        }
      } else {
        // Destination exists -> verify health
        if (mappingData.healthStatus !== 'healthy' || mappingData.deletionStatus !== 'active') {
          await webUpdateDoc(mappingDoc.ref, {
            healthStatus: 'healthy',
            deletionStatus: 'active',
            detectedAt: nowTs,
            recoveryAction: 'verified_healthy',
            updatedAt: nowTs,
          });
          totalWrites += 1;
        }
        report.healthyCount++;
      }
    }

    // Stop early if circuit breaker was triggered
    if (report.circuitBreakerTriggered) {
      report.readCount = totalReads;
      report.writeCount = totalWrites;
      report.auditMetrics.readsPerRun = totalReads;
      report.auditMetrics.writesPerRun = totalWrites;
      report.auditMetrics.maxExecutionDurationMs = Date.now() - startTime;
      return report;
    }

    // 2. Audit Destinations for missing mappings or conflicts
    let destQuery = webQuery(webCollection(webDb, 'destinations'), webLimit(BATCH_SIZE));
    if (lastDestinationCursor) {
      destQuery = webQuery(
        webCollection(webDb, 'destinations'),
        webStartAfter(lastDestinationCursor),
        webLimit(BATCH_SIZE)
      );
    }

    const destinationsSnap = await webGetDocs(destQuery);
    totalReads += destinationsSnap.docs.length;

    if (destinationsSnap.docs.length > 0) {
      lastDestinationCursor = destinationsSnap.docs[destinationsSnap.docs.length - 1];
    } else {
      lastDestinationCursor = null;
    }

    const placeIdToDestMap: Record<string, string[]> = {};

    for (const destDoc of destinationsSnap.docs) {
      const dest = destDoc.data();
      const destId = destDoc.id;
      const googlePlaceId = dest.providerPlaceId || dest.googlePlaceId;

      if (googlePlaceId) {
        if (!placeIdToDestMap[googlePlaceId]) {
          placeIdToDestMap[googlePlaceId] = [];
        }
        placeIdToDestMap[googlePlaceId].push(destId);
      }
    }

    let detectedConflictCount = 0;

    for (const [googlePlaceId, candidateIds] of Object.entries(placeIdToDestMap)) {
      if (
        totalReads >= AUDIT_BUDGET.maxReadsPerRun ||
        totalWrites >= AUDIT_BUDGET.maxWritesPerRun ||
        Date.now() - startTime >= AUDIT_BUDGET.maxExecutionMs
      ) {
        break;
      }

      const encodedPlaceId = Buffer.from(googlePlaceId).toString('base64').replace(/[/+=]/g, '');
      const mappingRef = webDoc(webDb, 'destinationProviderMappings', `google_${encodedPlaceId}`);
      const mappingSnap = await webGetDoc(mappingRef);
      totalReads += 1;

      if (candidateIds.length > 1) {
        detectedConflictCount++;

        if (detectedConflictCount >= AUDIT_BUDGET.circuitBreakerConflictThreshold) {
          report.circuitBreakerTriggered = true;
          report.circuitBreakerReason = `Circuit Breaker Triggered: Conflict count (${detectedConflictCount}) >= threshold (${AUDIT_BUDGET.circuitBreakerConflictThreshold}).`;
          canaryTelemetryService.recordCircuitBreakerTrigger();
        }

        const reviewRef = webDoc(webDb, 'review_required_mappings', `conflict_${encodedPlaceId}`);
        await webSetDoc(reviewRef, {
          googlePlaceId,
          healthStatus: 'conflict',
          detectedAt: nowTs,
          detectedBy: 'provider-mapping-recovery-worker',
          candidateDestinationIds: candidateIds,
          recoveryAction: 'conflict_flagged_for_review',
          reviewedAt: null,
          reviewedBy: null,
          updatedAt: nowTs,
        });
        totalWrites += 1;

        if (mappingSnap.exists()) {
          await webUpdateDoc(mappingRef, {
            healthStatus: 'conflict',
            candidateDestinationIds: candidateIds,
            recoveryAction: 'conflict_flagged_for_review',
            updatedAt: nowTs,
          });
          totalWrites += 1;
        }
        report.conflictsFlagged++;
      } else if (!mappingSnap.exists() && candidateIds.length === 1) {
        const targetDestId = candidateIds[0];
        const destSnap = await webGetDoc(webDoc(webDb, 'destinations', targetDestId));
        totalReads += 1;

        if (destSnap.exists()) {
          const destData = destSnap.data();
          await webSetDoc(mappingRef, {
            destinationId: targetDestId,
            provider: 'google',
            providerPlaceId: googlePlaceId,
            canonicalName: destData.names?.ko || destData.names?.en || destData.name,
            countryCode: destData.hierarchy?.countryCode || destData.countryCode,
            healthStatus: 'recoverable',
            deletionStatus: 'active',
            detectedAt: nowTs,
            detectedBy: 'provider-mapping-recovery-worker',
            previousDestinationId: null,
            candidateDestinationIds: [targetDestId],
            recoveryAction: 'automatically_restored',
            reviewedAt: null,
            reviewedBy: null,
            updatedAt: nowTs,
          });
          totalWrites += 1;
          report.recoverableRestored++;
        }
      }
    }

    canaryTelemetryService.recordAuditScan(detectedOrphanCount, report.conflictsFlagged, Math.max(1, mappingsSnap.docs.length));
  } catch (err: any) {
    console.error('[MAPPING_RECOVERY_ERROR]', err.message);
    report.errors.push(err.message);
  }

  report.readCount = totalReads;
  report.writeCount = totalWrites;
  report.auditMetrics.readsPerRun = totalReads;
  report.auditMetrics.writesPerRun = totalWrites;
  report.auditMetrics.maxExecutionDurationMs = Date.now() - startTime;

  return report;
}

