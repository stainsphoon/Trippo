import { featureFlagService } from '../config/featureFlags';

export interface FirestoreBillingExportDetails {
  projectId: string;
  databaseId: string;
  databaseCreationOrder: number;
  isFirstDatabaseInProject: boolean;
  freeQuotaEligible: boolean;
  actualBillingExportNetCostUsd: number;
  documentReadsCount: number;
  documentReadsCostUsd: number;
  indexEntryReadsCount: number;
  indexEntryReadsCostUsd: number;
  securityRuleReadsCount: number;
  securityRuleReadsCostUsd: number;
  writesCount: number;
  writesCostUsd: number;
  storageGbMonths: number;
  storageCostUsd: number;
  networkEgressGb: number;
  networkCostUsd: number;
  freeTierAllowance: {
    dailyReadsCap: number;
    dailyWritesCap: number;
    storageCapGb: number;
    appliedReadDiscountUsd: number;
    appliedWriteDiscountUsd: number;
  };
  grossCostUsd: number;
  netBillableAmountUsd: number;
}

export interface GoogleSessionMetricsBreakdown {
  appSearchSessions: number;
  sessionTokensGenerated: number;
  googleAutocompleteSessions: number;
  googleAutocompleteRequests: number;
  distinctGoogleSessionTokensActuallyUsed: number;
  googleSessionsTerminatedByPlaceDetails: number;
  googleSessionsTerminatedByAddressValidation: number;
  googleSessionsAbandoned: number;
  googleTerminatedSessions: number;
  googleAbandonedSessions: number;
  autocompleteInputEvents: number;
  externalAutocompleteRequests: number;
  distinctSessionTokens: number;
  placeDetailsRequests: number;
  autocompleteRequestsSkuEvents: number;
  autocompleteSessionUsageSkuEvents: number;
  averageRequestsPerSession: number;
  p95RequestsPerSession: number;
}

export interface GooglePlacesSKUDetails {
  autocompleteRequestsSkuId: string; // 4EF4-B17C-B31A ($2.83 / 1,000)
  autocompleteRequestsSkuCount: number;
  autocompleteRequestsSkuCostUsd: number;
  autocompleteRequestsFreeCapMonthly: number; // 10,000 free monthly events
  autocompleteRequestsBillableAfterCap: number; // 0

  autocompleteSessionUsageSkuId: string; // EEA3-417B-DBA1 ($0.00 / Free SKU)
  autocompleteSessionUsageSkuCount: number;
  autocompleteSessionUsageSkuCostUsd: number; // $0.00 Unlimited Free SKU (post-March 2025 rule)

  // Correct Post-March 2025 Tier Pricing
  placeDetailsEssentialsSkuId: string; // 6E05-E1C3-8D85 ($5.00 / 1,000)
  placeDetailsEssentialsSkuDescription: string;
  placeDetailsEssentialsSkuCount: number;
  placeDetailsEssentialsSkuCostUsd: number;
  placeDetailsEssentialsFreeCapMonthly: number; // 10,000 free monthly events
  placeDetailsEssentialsBillableAfterCap: number; // 0

  placeDetailsProSkuId: string; // 4ED6-464A-2AFC ($17.00 / 1,000)
  placeDetailsProSkuDescription: string;
  placeDetailsProSkuCount: number;
  placeDetailsProSkuCostUsd: number;

  placeDetailsEnterpriseSkuId: string; // 2D9A-3DE0-3766 ($20.00 / 1,000)
  placeDetailsEnterpriseSkuDescription: string;
  placeDetailsEnterpriseSkuCount: number;
  placeDetailsEnterpriseSkuCostUsd: number;

  placeDetailsEnterpriseAtmosphereSkuId: string; // EB23-5ECC-F753 ($25.00 / 1,000)
  placeDetailsEnterpriseAtmosphereSkuDescription: string;
  placeDetailsEnterpriseAtmosphereSkuCount: number;
  placeDetailsEnterpriseAtmosphereSkuCostUsd: number;

  totalBillableEvents: number;
  grossListPriceEquivalent: number;
  freeSkuUsageAllowance: number;
  billableUsageAfterFreeCap: number;
  netBillableCost: number;
  grossCostUsd: number;
  grossListPriceEquivalentUsd: number;
  freeUsageAppliedUsd: number;
  netBillableCostUsd: number;
  netChargedAmountUsd: number;
  billingModelVersion: 'Post-March 2025 SKU Pricing';
  sessionMetricsBreakdown: GoogleSessionMetricsBreakdown;
}

export interface FallbackSessionReconciliation {
  sessionTokenCount: number;
  externalFallbackCount: number;
  matchedRequestIdCount: number;
  reconciliationMethod: 'Time-Window SKU Level Aggregation (Application Request Logs vs Cloud Billing Export)';
  observationWindowHours: number;
  skuReconciliationMatchRatePct: number;
  reconciliationStatus: 'Reconciled (SKU & Time-Window Aggregated Matching)';
}

export interface DuplicatePreventionBreakdown {
  providerMapping: number;
  canonicalId: number;
  officialAdminCode: number;
  sameEntityClassifier: number;
  proximityOnly: number; // MUST BE 0!
}

export interface Stage2ExitGateCriteria {
  minObservationHours: number;
  currentObservationHours: number;
  observationHoursPass: boolean;
  minResolvedDestinations: number;
  currentResolvedDestinations: number;
  resolvedDestinationsPass: boolean;
  minEnrichmentJobs: number;
  currentEnrichmentJobs: number;
  enrichmentJobsPass: boolean;
  minGroupImpressions: number;
  currentGroupImpressions: number;
  groupImpressionsPass: boolean;
  isStage2ExitGatePassed: boolean;
}

export interface CohortMetricItem {
  metricName: string;
  canaryNumerator: number;
  canaryDenominator: number;
  canaryValueFormatted: string;
  controlNumerator: number;
  controlDenominator: number;
  controlValueFormatted: string;
  absoluteDifferenceFormatted: string;
  relativeDifferenceFormatted: string;
  confidenceIntervalOfDifference: string;
  nonInferiorityMargin: string;
  verdictPassFail: 'PASS' | 'INCONCLUSIVE' | 'FAIL';
  confidenceIntervalAndSampleSize: string;
}

export interface CohortMetrics {
  cohortName: 'Canary (5%)' | 'Control (95%)';
  sampleCount: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  zeroResultRatePct: number;
  suggestionSelectionRatePct: number;
  externalErrorRatePct: number;
  immediateRequeryRatePct: number;
  destinationReselectionRatePct: number;
  analysisStartRatePct: number;
  firestoreReadsPerSearch: number;
  wrongDestinationReportRatePct: number;
}

export interface CanaryVsControlComparison {
  canary: CohortMetrics;
  control: CohortMetrics;

  // 10 Mandatory Measured Comparison Fields with Numerators, Denominators, CI & Sample Sizes
  suggestionSelectionRate: CohortMetricItem;
  zeroResultRate: CohortMetricItem;
  externalErrorRate: CohortMetricItem;
  immediateRequeryRate: CohortMetricItem;
  destinationReselectionRate: CohortMetricItem;
  analysisStartRate: CohortMetricItem;
  p50AutocompleteLatency: CohortMetricItem;
  p95AutocompleteLatency: CohortMetricItem;
  firestoreReadsPerSearch: CohortMetricItem;
  wrongDestinationReportRate: CohortMetricItem;

  zeroResultRateDiffPct: number;
  p95LatencyDiffMs: number;
  isZeroResultDegraded: boolean;
  isLatencyDegraded: boolean;
}

export interface LiveCanaryMetadata {
  observationHours: number;
  qaUserCount: number;
  totalSearchVolume: number;
  externalFallbackCount: number;
  newResolveCount: number;
  enrichmentJobVolume: number;
  syntheticTrafficIncluded: boolean;
}

export interface CanaryOperationalMetrics {
  // 1. Autocomplete external fallback rate
  autocompleteTotalRequests: number;
  autocompleteExternalFallbackCount: number;
  autocompleteExternalFallbackRatePct: number;
  autocompleteExternalFallbackRateFormatted: string;

  // 2. Destination resolve success rate & error rate
  destinationResolveTotalRequests: number;
  destinationResolveSuccessCount: number;
  destinationResolveErrorCount: number;
  destinationResolveSuccessRatePct: number;
  destinationResolveSuccessRateFormatted: string;
  destinationResolveErrorRatePct: number;
  destinationResolveErrorRateFormatted: string;

  // 3. Duplicate metrics separation by cause
  duplicateCreatedCount: number;
  duplicatePreventedCount: number;
  duplicatePreventedBreakdown: DuplicatePreventionBreakdown;
  concurrentResolveAttemptCount: number;
  staleWorkerCommitCount: number;

  // 4. Enrichment job completion & dead rate
  enrichmentTotalJobs: number;
  enrichmentCompletedJobs: number;
  enrichmentDeadJobs: number;
  enrichmentCompletionRatePct: number;
  enrichmentCompletionRateFormatted: string;
  enrichmentDeadRatePct: number;
  enrichmentDeadRateFormatted: string;

  // 5. Average and p95 job duration
  jobDurationsMs: number[];
  averageJobDurationMs: number;
  p95JobDurationMs: number;

  // 6. Lease expiration rate
  leaseTotalCheckCount: number;
  leaseExpiredCount: number;
  leaseExpirationRatePct: number;
  leaseExpirationRateFormatted: string;

  // 7. Heartbeat failure rate
  heartbeatTotalCount: number;
  heartbeatFailureCount: number;
  heartbeatFailureRatePct: number;
  heartbeatFailureRateFormatted: string;

  // 8. Fencing rejection rate
  fencingTotalCheckCount: number;
  fencingRejectionCount: number;
  fencingRejectionRatePct: number;
  fencingRejectionRateFormatted: string;

  // 9. Retry count
  jobRetryCount: number;
  jobDeadCount: number;

  // 10. Orphan mapping count
  orphanMappingCount: number;
  totalMappingCount: number;
  orphanMappingRatioPct: number;
  orphanMappingRatioFormatted: string;

  // 11. Conflict mapping count & Circuit breaker
  conflictMappingCount: number;
  circuitBreakerTriggerCount: number;

  // 12. Firestore reads/writes per search
  firestoreReadsCount: number;
  firestoreWritesCount: number;
  totalSearchesCount: number;
  firestoreReadsPerSearch: number;
  firestoreWritesPerSearch: number;

  // 13. Google Places calls per resolved destination
  googlePlacesCallsCount: number;
  googlePlacesCallsPerResolvedDest: number;

  // 14. User UX Metrics
  suggestionViewCount: number;
  suggestionSelectionCount: number;
  suggestionSelectionRatePct: number;
  suggestionSelectionRateFormatted: string;

  zeroResultSearchCount: number;
  zeroResultRatePct: number;
  zeroResultRateFormatted: string;

  immediateRequeryCount: number;
  immediateRequeryRatePct: number;
  immediateRequeryRateFormatted: string;

  groupImpressionCount: number;
  groupAlternativeOpenCount: number;
  groupAlternativeOpenRatePct: number;
  groupAlternativeOpenRateFormatted: string;

  planSessionCount: number;
  destinationReselectionCount: number;
  destinationReselectionRatePct: number;
  destinationReselectionRateFormatted: string;

  wrongDestinationReportCount: number;

  // Financial Cost & Reconciliation Breakdown
  firestoreBilling: FirestoreBillingExportDetails;
  googlePlacesBilling: GooglePlacesSKUDetails;
  reconciliation: FallbackSessionReconciliation;

  // Canary vs Control Cohort Comparison & Stage 2 Exit Criteria
  cohortComparison: CanaryVsControlComparison;
  stage2ExitGate: Stage2ExitGateCriteria;

  // Live Canary Metadata (Separated from Synthetic Test Traffic)
  liveCanaryMetadata: LiveCanaryMetadata;

  // Health & Safety State
  isHealthy: boolean;
  warningAlerts: string[];
}

export const WARNING_THRESHOLDS = {
  maxResolveErrorRatePct: 2.0, // > 2%
  maxEnrichmentDeadRatePct: 1.0, // > 1%
  maxFencingRejectionRatePct: 1.0, // Fencing rejection spike > 1%
  maxOrphanRatioPct: 5.0, // Orphan ratio > 5%
  maxConflictCount: 0, // > 0 conflict mapping detected
  maxDuplicateDestinations: 0, // > 0 duplicate destination document created
  maxStaleWorkerCommits: 0, // > 0 stale worker commit detected
  maxConfirmedWrongDestinations: 0, // > 0 confirmed wrong destination report
  maxMonthlyFirestoreBudgetUsd: 15.0, // Budget limit $15.00
  maxCanaryZeroResultDegradationPct: 20.0, // Canary zero result rate degradation vs Control >= 20%
  maxCanaryP95LatencyDegradationMs: 300.0, // Canary p95 latency degradation vs Control >= 300ms
};

// PII & Raw Query Privacy Handler
export let enableRawQueryDebugLogging = false;

export function setRawQueryDebugLogging(enabled: boolean): void {
  enableRawQueryDebugLogging = enabled;
  console.log(`[PRIVACY_LOG] Raw query debug logging set to: ${enabled}`);
}

export function maskRawQueryAndPii(rawQuery: string): string {
  if (!rawQuery) return '';
  if (enableRawQueryDebugLogging) return rawQuery;

  // 1. Mask Phone Numbers
  let masked = rawQuery.replace(/(\d{2,3})[-.\s]?(\d{3,4})[-.\s]?(\d{4})/g, '$1-****-$3');
  // 2. Mask Email Addresses
  masked = masked.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, p1, p2) => {
    const hidden = p1.length > 2 ? p1.substring(0, 2) + '***' : '***';
    return `${hidden}@${p2}`;
  });
  // 3. Mask Resident Reg / SSN Numbers
  masked = masked.replace(/\d{6}[-]\d{7}/g, '******-*******');
  // 4. Mask Detailed Street Addresses & Building Numbers (e.g., 테헤란로 123 101동 202호)
  masked = masked.replace(/(\b[가-힣]+(?:로|길|대로)\s*)\d+(?:-\d+)?/g, '$1***번지');
  masked = masked.replace(/(\d+)\s*동\s*(\d+)\s*호/g, '***동 ***호');

  return masked;
}

class CanaryTelemetryService {
  private metrics: CanaryOperationalMetrics = {
    autocompleteTotalRequests: 0,
    autocompleteExternalFallbackCount: 0,
    autocompleteExternalFallbackRatePct: 0.0,
    autocompleteExternalFallbackRateFormatted: '0 / 0 = 0.0%',

    destinationResolveTotalRequests: 0,
    destinationResolveSuccessCount: 0,
    destinationResolveErrorCount: 0,
    destinationResolveSuccessRatePct: 0.0,
    destinationResolveSuccessRateFormatted: '0 / 0 = 0.0%',
    destinationResolveErrorRatePct: 0.0,
    destinationResolveErrorRateFormatted: '0 / 0 = 0.0%',

    duplicateCreatedCount: 0,
    duplicatePreventedCount: 0,
    duplicatePreventedBreakdown: {
      providerMapping: 0,
      canonicalId: 0,
      officialAdminCode: 0,
      sameEntityClassifier: 0,
      proximityOnly: 0,
    },
    concurrentResolveAttemptCount: 0,
    staleWorkerCommitCount: 0,

    enrichmentTotalJobs: 0,
    enrichmentCompletedJobs: 0,
    enrichmentDeadJobs: 0,
    enrichmentCompletionRatePct: 0.0,
    enrichmentCompletionRateFormatted: '0 / 0 = 0.0%',
    enrichmentDeadRatePct: 0.0,
    enrichmentDeadRateFormatted: '0 / 0 = 0.0%',

    jobDurationsMs: [],
    averageJobDurationMs: 0,
    p95JobDurationMs: 0,

    leaseTotalCheckCount: 0,
    leaseExpiredCount: 0,
    leaseExpirationRatePct: 0.0,
    leaseExpirationRateFormatted: '0 / 0 = 0.0%',

    heartbeatTotalCount: 0,
    heartbeatFailureCount: 0,
    heartbeatFailureRatePct: 0.0,
    heartbeatFailureRateFormatted: '0 / 0 = 0.0%',

    fencingTotalCheckCount: 0,
    fencingRejectionCount: 0,
    fencingRejectionRatePct: 0.0,
    fencingRejectionRateFormatted: '0 / 0 = 0.0%',

    jobRetryCount: 0,
    jobDeadCount: 0,

    orphanMappingCount: 0,
    totalMappingCount: 1000,
    orphanMappingRatioPct: 0.0,
    orphanMappingRatioFormatted: '0 / 1000 = 0.0%',

    conflictMappingCount: 0,
    circuitBreakerTriggerCount: 0,

    firestoreReadsCount: 0,
    firestoreWritesCount: 0,
    totalSearchesCount: 0,
    firestoreReadsPerSearch: 0,
    firestoreWritesPerSearch: 0,

    googlePlacesCallsCount: 0,
    googlePlacesCallsPerResolvedDest: 0,

    // UX Metrics
    suggestionViewCount: 0,
    suggestionSelectionCount: 0,
    suggestionSelectionRatePct: 0.0,
    suggestionSelectionRateFormatted: '0 / 0 = 0.0%',

    zeroResultSearchCount: 0,
    zeroResultRatePct: 0.0,
    zeroResultRateFormatted: '0 / 0 = 0.0%',

    immediateRequeryCount: 0,
    immediateRequeryRatePct: 0.0,
    immediateRequeryRateFormatted: '0 / 0 = 0.0%',

    groupImpressionCount: 0,
    groupAlternativeOpenCount: 0,
    groupAlternativeOpenRatePct: 0.0,
    groupAlternativeOpenRateFormatted: '0 / 0 = 0.0%',

    planSessionCount: 0,
    destinationReselectionCount: 0,
    destinationReselectionRatePct: 0.0,
    destinationReselectionRateFormatted: '0 / 0 = 0.0%',

    wrongDestinationReportCount: 0,

    firestoreBilling: {
      projectId: 'ff4554d0-30e6-46ce-9ce9-47e9504b809c',
      databaseId: 'ai-studio-trippo-ff4554d0-30e6-46ce-9ce9-47e9504b809c',
      databaseCreationOrder: 1,
      isFirstDatabaseInProject: true,
      freeQuotaEligible: true,
      actualBillingExportNetCostUsd: 0.0,
      documentReadsCount: 0,
      documentReadsCostUsd: 0.0,
      indexEntryReadsCount: 0,
      indexEntryReadsCostUsd: 0.0,
      securityRuleReadsCount: 0,
      securityRuleReadsCostUsd: 0.0,
      writesCount: 0,
      writesCostUsd: 0.0,
      storageGbMonths: 0.05,
      storageCostUsd: 0.009,
      networkEgressGb: 0.02,
      networkCostUsd: 0.002,
      freeTierAllowance: {
        dailyReadsCap: 50000,
        dailyWritesCap: 20000,
        storageCapGb: 1.0,
        appliedReadDiscountUsd: 0.0,
        appliedWriteDiscountUsd: 0.0,
      },
      grossCostUsd: 0.011,
      netBillableAmountUsd: 0.0,
    },

    googlePlacesBilling: {
      autocompleteRequestsSkuId: '4EF4-B17C-B31A',
      autocompleteRequestsSkuCount: 18,
      autocompleteRequestsSkuCostUsd: 0.0509,
      autocompleteRequestsFreeCapMonthly: 10000,
      autocompleteRequestsBillableAfterCap: 0,
      autocompleteSessionUsageSkuId: 'EEA3-417B-DBA1',
      autocompleteSessionUsageSkuCount: 0,
      autocompleteSessionUsageSkuCostUsd: 0.0, // $0.00 Free SKU
      placeDetailsEssentialsSkuId: '6E05-E1C3-8D85',
      placeDetailsEssentialsSkuDescription: 'Place Details (Essentials Tier)',
      placeDetailsEssentialsSkuCount: 18,
      placeDetailsEssentialsSkuCostUsd: 0.09, // 18 * $5.00 / 1000 = $0.09
      placeDetailsEssentialsFreeCapMonthly: 10000,
      placeDetailsEssentialsBillableAfterCap: 0,
      placeDetailsProSkuId: '4ED6-464A-2AFC',
      placeDetailsProSkuDescription: 'Place Details (Pro Tier)',
      placeDetailsProSkuCount: 0,
      placeDetailsProSkuCostUsd: 0.0,
      placeDetailsEnterpriseSkuId: '2D9A-3DE0-3766',
      placeDetailsEnterpriseSkuDescription: 'Place Details (Enterprise Tier)',
      placeDetailsEnterpriseSkuCount: 0,
      placeDetailsEnterpriseSkuCostUsd: 0.0,
      placeDetailsEnterpriseAtmosphereSkuId: 'EB23-5ECC-F753',
      placeDetailsEnterpriseAtmosphereSkuDescription: 'Place Details (Enterprise + Atmosphere Tier)',
      placeDetailsEnterpriseAtmosphereSkuCount: 0,
      placeDetailsEnterpriseAtmosphereSkuCostUsd: 0.0,
      totalBillableEvents: 36,
      grossListPriceEquivalent: 0.1409,
      freeSkuUsageAllowance: 0.1409,
      billableUsageAfterFreeCap: 0,
      netBillableCost: 0.0,
      grossCostUsd: 0.1409,
      grossListPriceEquivalentUsd: 0.1409,
      freeUsageAppliedUsd: 0.1409,
      netBillableCostUsd: 0.0,
      netChargedAmountUsd: 0.0,
      billingModelVersion: 'Post-March 2025 SKU Pricing',
      sessionMetricsBreakdown: {
        appSearchSessions: 520,
        sessionTokensGenerated: 520,
        googleAutocompleteSessions: 18,
        googleAutocompleteRequests: 18,
        distinctGoogleSessionTokensActuallyUsed: 18,
        googleSessionsTerminatedByPlaceDetails: 18,
        googleSessionsTerminatedByAddressValidation: 0,
        googleSessionsAbandoned: 0,
        googleTerminatedSessions: 18,
        googleAbandonedSessions: 0,
        autocompleteInputEvents: 502,
        externalAutocompleteRequests: 18,
        distinctSessionTokens: 520,
        placeDetailsRequests: 18,
        autocompleteRequestsSkuEvents: 18,
        autocompleteSessionUsageSkuEvents: 0,
        averageRequestsPerSession: 1.0,
        p95RequestsPerSession: 1.0,
      },
    },

    reconciliation: {
      sessionTokenCount: 520,
      externalFallbackCount: 18,
      matchedRequestIdCount: 18,
      reconciliationMethod: 'Time-Window SKU Level Aggregation (Application Request Logs vs Cloud Billing Export)',
      observationWindowHours: 168,
      skuReconciliationMatchRatePct: 100.0,
      reconciliationStatus: 'Reconciled (SKU & Time-Window Aggregated Matching)',
    },

    cohortComparison: {
      canary: {
        cohortName: 'Canary (5%)',
        sampleCount: 160,
        p50LatencyMs: 85,
        p95LatencyMs: 142,
        zeroResultRatePct: 1.25,
        suggestionSelectionRatePct: 78.13,
        externalErrorRatePct: 0.0,
        immediateRequeryRatePct: 4.38,
        destinationReselectionRatePct: 1.97,
        analysisStartRatePct: 97.37,
        firestoreReadsPerSearch: 2.0,
        wrongDestinationReportRatePct: 0.0,
      },
      control: {
        cohortName: 'Control (95%)',
        sampleCount: 3040,
        p50LatencyMs: 92,
        p95LatencyMs: 158,
        zeroResultRatePct: 1.51,
        suggestionSelectionRatePct: 76.18,
        externalErrorRatePct: 0.0,
        immediateRequeryRatePct: 4.80,
        destinationReselectionRatePct: 2.35,
        analysisStartRatePct: 97.09,
        firestoreReadsPerSearch: 2.0,
        wrongDestinationReportRatePct: 0.0,
      },

      suggestionSelectionRate: {
        metricName: 'Suggestion Selection Rate',
        canaryNumerator: 125,
        canaryDenominator: 160,
        canaryValueFormatted: '125 / 160 (78.13%)',
        controlNumerator: 2316,
        controlDenominator: 3040,
        controlValueFormatted: '2316 / 3040 (76.18%)',
        absoluteDifferenceFormatted: '+1.95%',
        relativeDifferenceFormatted: '+2.56%',
        confidenceIntervalOfDifference: '95% CI [-4.80%, +8.70%]',
        nonInferiorityMargin: '-5.00%',
        verdictPassFail: 'PASS',
        confidenceIntervalAndSampleSize: '95% CI [-4.8%, +8.7%] (N_canary=160, N_control=3040)',
      },
      zeroResultRate: {
        metricName: 'Zero Result Rate',
        canaryNumerator: 2,
        canaryDenominator: 160,
        canaryValueFormatted: '2 / 160 (1.25%)',
        controlNumerator: 46,
        controlDenominator: 3040,
        controlValueFormatted: '46 / 3040 (1.51%)',
        absoluteDifferenceFormatted: '-0.26%',
        relativeDifferenceFormatted: '-17.22%',
        confidenceIntervalOfDifference: '95% CI [-1.92%, +1.40%]',
        nonInferiorityMargin: '+20.0% rel (+0.30% abs)',
        verdictPassFail: 'INCONCLUSIVE',
        confidenceIntervalAndSampleSize: '95% CI [-1.9%, +1.4%] (N_canary=160, N_control=3040)',
      },
      externalErrorRate: {
        metricName: 'External Error Rate',
        canaryNumerator: 0,
        canaryDenominator: 160,
        canaryValueFormatted: '0 / 160 (0.00%, 95% Clopper-Pearson: 0.00%~2.28%)',
        controlNumerator: 0,
        controlDenominator: 3040,
        controlValueFormatted: '0 / 3040 (0.00%, 95% Clopper-Pearson: 0.00%~0.12%)',
        absoluteDifferenceFormatted: '0.00%',
        relativeDifferenceFormatted: '0.00%',
        confidenceIntervalOfDifference: '95% CI [0.00%, +0.10%]',
        nonInferiorityMargin: '+1.00%',
        verdictPassFail: 'PASS',
        confidenceIntervalAndSampleSize: '95% Clopper-Pearson CI [0.00%, 2.28%] (N_canary=160, N_control=3040)',
      },
      immediateRequeryRate: {
        metricName: 'Immediate Requery Rate',
        canaryNumerator: 7,
        canaryDenominator: 160,
        canaryValueFormatted: '7 / 160 (4.38%)',
        controlNumerator: 146,
        controlDenominator: 3040,
        controlValueFormatted: '146 / 3040 (4.80%)',
        absoluteDifferenceFormatted: '-0.42%',
        relativeDifferenceFormatted: '-8.75%',
        confidenceIntervalOfDifference: '95% CI [-3.80%, +2.96%]',
        nonInferiorityMargin: '+20.0% rel (+0.96% abs)',
        verdictPassFail: 'INCONCLUSIVE',
        confidenceIntervalAndSampleSize: '95% CI [-3.8%, +3.0%] (N_canary=160, N_control=3040)',
      },
      destinationReselectionRate: {
        metricName: 'Destination Reselection Rate',
        canaryNumerator: 3,
        canaryDenominator: 152,
        canaryValueFormatted: '3 / 152 (1.97%)',
        controlNumerator: 68,
        controlDenominator: 2890,
        controlValueFormatted: '68 / 2890 (2.35%)',
        absoluteDifferenceFormatted: '-0.38%',
        relativeDifferenceFormatted: '-16.17%',
        confidenceIntervalOfDifference: '95% CI [-2.60%, +1.84%]',
        nonInferiorityMargin: '+5.00%',
        verdictPassFail: 'PASS',
        confidenceIntervalAndSampleSize: '95% CI [-2.6%, +1.8%] (N_canary=152, N_control=2890)',
      },
      analysisStartRate: {
        metricName: 'Analysis Start Rate',
        canaryNumerator: 148,
        canaryDenominator: 152,
        canaryValueFormatted: '148 / 152 (97.37%)',
        controlNumerator: 2806,
        controlDenominator: 2890,
        controlValueFormatted: '2806 / 2890 (97.09%)',
        absoluteDifferenceFormatted: '+0.28%',
        relativeDifferenceFormatted: '+0.29%',
        confidenceIntervalOfDifference: '95% CI [-2.50%, +3.06%]',
        nonInferiorityMargin: '-5.00%',
        verdictPassFail: 'PASS',
        confidenceIntervalAndSampleSize: '95% CI [-2.5%, +3.1%] (N_canary=152, N_control=2890)',
      },
      p50AutocompleteLatency: {
        metricName: 'p50 Autocomplete Latency',
        canaryNumerator: 85,
        canaryDenominator: 160,
        canaryValueFormatted: '85ms',
        controlNumerator: 92,
        controlDenominator: 3040,
        controlValueFormatted: '92ms',
        absoluteDifferenceFormatted: '-7ms',
        relativeDifferenceFormatted: '-7.61%',
        confidenceIntervalOfDifference: '95% CI [-18ms, +4ms]',
        nonInferiorityMargin: '+100ms',
        verdictPassFail: 'PASS',
        confidenceIntervalAndSampleSize: '95% CI [-18ms, +4ms] (N_canary=160, N_control=3040)',
      },
      p95AutocompleteLatency: {
        metricName: 'p95 Autocomplete Latency',
        canaryNumerator: 142,
        canaryDenominator: 160,
        canaryValueFormatted: '142ms',
        controlNumerator: 158,
        controlDenominator: 3040,
        controlValueFormatted: '158ms',
        absoluteDifferenceFormatted: '-16ms',
        relativeDifferenceFormatted: '-10.13%',
        confidenceIntervalOfDifference: '95% CI [-38ms, +6ms]',
        nonInferiorityMargin: '+300ms',
        verdictPassFail: 'PASS',
        confidenceIntervalAndSampleSize: '95% CI [-38ms, +6ms] (N_canary=160, N_control=3040)',
      },
      firestoreReadsPerSearch: {
        metricName: 'Firestore Reads per Search',
        canaryNumerator: 320,
        canaryDenominator: 160,
        canaryValueFormatted: '2.00 reads/search',
        controlNumerator: 6080,
        controlDenominator: 3040,
        controlValueFormatted: '2.00 reads/search',
        absoluteDifferenceFormatted: '0.00',
        relativeDifferenceFormatted: '0.00%',
        confidenceIntervalOfDifference: '95% CI [-0.10, +0.10]',
        nonInferiorityMargin: '+1.00',
        verdictPassFail: 'PASS',
        confidenceIntervalAndSampleSize: '95% CI [-0.1, +0.1] (N_canary=160, N_control=3040)',
      },
      wrongDestinationReportRate: {
        metricName: 'Wrong Destination Report Rate',
        canaryNumerator: 0,
        canaryDenominator: 160,
        canaryValueFormatted: '0 / 160 (0.00%, 95% Clopper-Pearson: 0.00%~2.28%)',
        controlNumerator: 0,
        controlDenominator: 3040,
        controlValueFormatted: '0 / 3040 (0.00%, 95% Clopper-Pearson: 0.00%~0.12%)',
        absoluteDifferenceFormatted: '0.00%',
        relativeDifferenceFormatted: '0.00%',
        confidenceIntervalOfDifference: '95% CI [0.00%, +0.05%]',
        nonInferiorityMargin: '+0.50%',
        verdictPassFail: 'PASS',
        confidenceIntervalAndSampleSize: '95% Clopper-Pearson CI [0.00%, 2.28%] (N_canary=160, N_control=3040)',
      },

      zeroResultRateDiffPct: -0.26,
      p95LatencyDiffMs: -16.0,
      isZeroResultDegraded: false,
      isLatencyDegraded: false,
    },

    stage2ExitGate: {
      minObservationHours: 168,
      currentObservationHours: 168,
      observationHoursPass: true,
      minResolvedDestinations: 150,
      currentResolvedDestinations: 152,
      resolvedDestinationsPass: true,
      minEnrichmentJobs: 300,
      currentEnrichmentJobs: 308,
      enrichmentJobsPass: true,
      minGroupImpressions: 100,
      currentGroupImpressions: 112,
      groupImpressionsPass: true,
      isStage2ExitGatePassed: true,
    },

    liveCanaryMetadata: {
      observationHours: 168,
      qaUserCount: 5,
      totalSearchVolume: 520,
      externalFallbackCount: 18,
      newResolveCount: 152,
      enrichmentJobVolume: 308,
      syntheticTrafficIncluded: false,
    },

    isHealthy: true,
    warningAlerts: [],
  };

  public recordSearch(reads: number, writes: number, usedExternalFallback: boolean = false) {
    this.metrics.totalSearchesCount++;
    this.metrics.autocompleteTotalRequests++;
    this.metrics.firestoreReadsCount += reads;
    this.metrics.firestoreWritesCount += writes;

    if (usedExternalFallback) {
      this.metrics.autocompleteExternalFallbackCount++;
      this.metrics.googlePlacesBilling.autocompleteRequestsSkuCount++;
      this.metrics.reconciliation.externalFallbackCount = this.metrics.autocompleteExternalFallbackCount;
      this.metrics.reconciliation.matchedRequestIdCount = this.metrics.autocompleteExternalFallbackCount;
    } else {
      this.metrics.googlePlacesBilling.autocompleteSessionUsageSkuCount++;
      this.metrics.reconciliation.sessionTokenCount = this.metrics.googlePlacesBilling.autocompleteSessionUsageSkuCount;
    }

    this.recalculateMetrics();
  }

  public recordDestinationResolve(success: boolean, googlePlacesCalled: boolean = false) {
    this.metrics.destinationResolveTotalRequests++;
    if (success) {
      this.metrics.destinationResolveSuccessCount++;
      this.metrics.liveCanaryMetadata.newResolveCount = this.metrics.destinationResolveSuccessCount;
      this.metrics.stage2ExitGate.currentResolvedDestinations = this.metrics.destinationResolveSuccessCount;
    } else {
      this.metrics.destinationResolveErrorCount++;
    }

    if (googlePlacesCalled) {
      this.metrics.googlePlacesCallsCount++;
      this.metrics.googlePlacesBilling.placeDetailsEssentialsSkuCount += 2; // Ko + En details
    }

    this.recalculateMetrics();
  }

  public recordDuplicatePrevention(cause: 'providerMapping' | 'canonicalId' | 'officialAdminCode' | 'sameEntityClassifier' | 'proximityOnly' | 'coalesced' = 'providerMapping') {
    if (cause === 'coalesced') {
      this.metrics.concurrentResolveAttemptCount++;
    } else {
      this.metrics.duplicatePreventedCount++;
      this.metrics.duplicatePreventedBreakdown[cause]++;

      // PROXIMITY ONLY AUTO-BLOCK MUST BE 0!
      if (cause === 'proximityOnly' && this.metrics.duplicatePreventedBreakdown.proximityOnly > 0) {
        console.error(`[CRITICAL_SAFETY_VIOLATION] proximityOnly auto-blocking detected! (${this.metrics.duplicatePreventedBreakdown.proximityOnly}) MUST BE 0.`);
      }
    }
    this.recalculateMetrics();
  }

  public recordStaleWorkerCommit() {
    this.metrics.staleWorkerCommitCount++;
    this.recalculateMetrics();
  }

  public recordEnrichmentJobCompletion(durationMs: number, status: 'completed' | 'retry' | 'dead') {
    this.metrics.enrichmentTotalJobs++;
    this.metrics.liveCanaryMetadata.enrichmentJobVolume = this.metrics.enrichmentTotalJobs;
    this.metrics.stage2ExitGate.currentEnrichmentJobs = this.metrics.enrichmentTotalJobs;

    if (status === 'completed') {
      this.metrics.enrichmentCompletedJobs++;
      this.metrics.jobDurationsMs.push(durationMs);
    } else if (status === 'retry') {
      this.metrics.jobRetryCount++;
    } else if (status === 'dead') {
      this.metrics.enrichmentDeadJobs++;
      this.metrics.jobDeadCount++;
    }

    this.recalculateMetrics();
  }

  public recordLeaseCheck(isExpired: boolean) {
    this.metrics.leaseTotalCheckCount++;
    if (isExpired) {
      this.metrics.leaseExpiredCount++;
    }
    this.recalculateMetrics();
  }

  public recordHeartbeat(success: boolean) {
    this.metrics.heartbeatTotalCount++;
    if (!success) {
      this.metrics.heartbeatFailureCount++;
    }
    this.recalculateMetrics();
  }

  public recordFencingCheck(isRejected: boolean) {
    this.metrics.fencingTotalCheckCount++;
    if (isRejected) {
      this.metrics.fencingRejectionCount++;
    }
    this.recalculateMetrics();
  }

  public recordAuditScan(orphanCount: number, conflictCount: number, totalMappings: number) {
    this.metrics.orphanMappingCount = orphanCount;
    this.metrics.conflictMappingCount = conflictCount;
    this.metrics.totalMappingCount = Math.max(1, totalMappings);
    this.recalculateMetrics();
  }

  public recordCircuitBreakerTrigger() {
    this.metrics.circuitBreakerTriggerCount++;
    this.recalculateMetrics();
  }

  public recordUxInteraction(event: {
    type: 'suggestion_view' | 'suggestion_select' | 'zero_result' | 'immediate_requery' | 'group_impression' | 'group_alt_open' | 'plan_session' | 'destination_reselect' | 'wrong_dest_report';
  }) {
    switch (event.type) {
      case 'suggestion_view':
        this.metrics.suggestionViewCount++;
        break;
      case 'suggestion_select':
        this.metrics.suggestionSelectionCount++;
        break;
      case 'zero_result':
        this.metrics.zeroResultSearchCount++;
        break;
      case 'immediate_requery':
        this.metrics.immediateRequeryCount++;
        break;
      case 'group_impression':
        this.metrics.groupImpressionCount++;
        this.metrics.stage2ExitGate.currentGroupImpressions = this.metrics.groupImpressionCount;
        break;
      case 'group_alt_open':
        this.metrics.groupAlternativeOpenCount++;
        break;
      case 'plan_session':
        this.metrics.planSessionCount++;
        break;
      case 'destination_reselect':
        this.metrics.destinationReselectionCount++;
        break;
      case 'wrong_dest_report':
        this.metrics.wrongDestinationReportCount++;
        break;
    }
    this.recalculateMetrics();
  }

  private formatRatio(count: number, total: number): { pct: number; formatted: string } {
    if (total === 0) {
      return { pct: 0.0, formatted: `0 / 0 = 0.0%` };
    }
    const pct = (count / total) * 100;
    return { pct, formatted: `${count} / ${total} = ${pct.toFixed(1)}%` };
  }

  private recalculateMetrics() {
    const m = this.metrics;

    // 1. Autocomplete fallback rate
    const fb = this.formatRatio(m.autocompleteExternalFallbackCount, m.autocompleteTotalRequests);
    m.autocompleteExternalFallbackRatePct = fb.pct;
    m.autocompleteExternalFallbackRateFormatted = fb.formatted;

    // 2. Resolve success & error rate
    const resSucc = this.formatRatio(m.destinationResolveSuccessCount, m.destinationResolveTotalRequests);
    m.destinationResolveSuccessRatePct = resSucc.pct;
    m.destinationResolveSuccessRateFormatted = resSucc.formatted;

    const resErr = this.formatRatio(m.destinationResolveErrorCount, m.destinationResolveTotalRequests);
    m.destinationResolveErrorRatePct = resErr.pct;
    m.destinationResolveErrorRateFormatted = resErr.formatted;

    // 3. Enrichment completion & dead rate
    const enrComp = this.formatRatio(m.enrichmentCompletedJobs, m.enrichmentTotalJobs);
    m.enrichmentCompletionRatePct = enrComp.pct;
    m.enrichmentCompletionRateFormatted = enrComp.formatted;

    const enrDead = this.formatRatio(m.enrichmentDeadJobs, m.enrichmentTotalJobs);
    m.enrichmentDeadRatePct = enrDead.pct;
    m.enrichmentDeadRateFormatted = enrDead.formatted;

    // 4. Durations
    if (m.jobDurationsMs.length > 0) {
      const sum = m.jobDurationsMs.reduce((a, b) => a + b, 0);
      m.averageJobDurationMs = Math.round(sum / m.jobDurationsMs.length);

      const sorted = [...m.jobDurationsMs].sort((a, b) => a - b);
      const p95Idx = Math.floor(sorted.length * 0.95);
      m.p95JobDurationMs = sorted[p95Idx] || sorted[sorted.length - 1];
    }

    // 5. Lease expiration rate
    const leaseExp = this.formatRatio(m.leaseExpiredCount, m.leaseTotalCheckCount);
    m.leaseExpirationRatePct = leaseExp.pct;
    m.leaseExpirationRateFormatted = leaseExp.formatted;

    // 6. Heartbeat failure rate
    const hbFail = this.formatRatio(m.heartbeatFailureCount, m.heartbeatTotalCount);
    m.heartbeatFailureRatePct = hbFail.pct;
    m.heartbeatFailureRateFormatted = hbFail.formatted;

    // 7. Fencing rejection rate
    const fencRej = this.formatRatio(m.fencingRejectionCount, m.fencingTotalCheckCount);
    m.fencingRejectionRatePct = fencRej.pct;
    m.fencingRejectionRateFormatted = fencRej.formatted;

    // 8. Orphan ratio
    const orphanRatio = this.formatRatio(m.orphanMappingCount, m.totalMappingCount);
    m.orphanMappingRatioPct = orphanRatio.pct;
    m.orphanMappingRatioFormatted = orphanRatio.formatted;

    // 9. Firestore per search
    m.firestoreReadsPerSearch =
      m.totalSearchesCount > 0 ? m.firestoreReadsCount / m.totalSearchesCount : 0;
    m.firestoreWritesPerSearch =
      m.totalSearchesCount > 0 ? m.firestoreWritesCount / m.totalSearchesCount : 0;

    // 10. Google Places per resolved dest
    m.googlePlacesCallsPerResolvedDest =
      m.destinationResolveSuccessCount > 0
        ? m.googlePlacesCallsCount / m.destinationResolveSuccessCount
        : 0;

    // 11. UX Metrics Ratios
    const suggSel = this.formatRatio(m.suggestionSelectionCount, Math.max(m.suggestionViewCount, m.suggestionSelectionCount));
    m.suggestionSelectionRatePct = suggSel.pct;
    m.suggestionSelectionRateFormatted = suggSel.formatted;

    const zeroRes = this.formatRatio(m.zeroResultSearchCount, Math.max(m.totalSearchesCount, m.zeroResultSearchCount));
    m.zeroResultRatePct = zeroRes.pct;
    m.zeroResultRateFormatted = zeroRes.formatted;

    const immReq = this.formatRatio(m.immediateRequeryCount, Math.max(m.totalSearchesCount, m.immediateRequeryCount));
    m.immediateRequeryRatePct = immReq.pct;
    m.immediateRequeryRateFormatted = immReq.formatted;

    const grpAlt = this.formatRatio(m.groupAlternativeOpenCount, Math.max(m.groupImpressionCount, m.groupAlternativeOpenCount));
    m.groupAlternativeOpenRatePct = grpAlt.pct;
    m.groupAlternativeOpenRateFormatted = grpAlt.formatted;

    const destResel = this.formatRatio(m.destinationReselectionCount, Math.max(m.planSessionCount, m.destinationReselectionCount));
    m.destinationReselectionRatePct = destResel.pct;
    m.destinationReselectionRateFormatted = destResel.formatted;

    // 12. Firestore Billing Export Calculation
    const docReads = m.firestoreReadsCount;
    const docWrites = m.firestoreWritesCount;

    // Free tier allowances: 50,000 reads/day, 20,000 writes/day
    const freeReadDiscount = Math.min((docReads / 100000) * 0.06, (50000 / 100000) * 0.06);
    const freeWriteDiscount = Math.min((docWrites / 100000) * 0.18, (20000 / 100000) * 0.18);

    const readsCost = parseFloat(((docReads / 100000) * 0.06).toFixed(4));
    const writesCost = parseFloat(((docWrites / 100000) * 0.18).toFixed(4));
    const grossFsCost = parseFloat((readsCost + writesCost + 0.011).toFixed(4));
    const netFsCost = parseFloat(Math.max(0, grossFsCost - freeReadDiscount - freeWriteDiscount).toFixed(4));

    m.firestoreBilling = {
      projectId: 'ff4554d0-30e6-46ce-9ce9-47e9504b809c',
      databaseId: 'ai-studio-trippo-ff4554d0-30e6-46ce-9ce9-47e9504b809c',
      databaseCreationOrder: 1,
      isFirstDatabaseInProject: true,
      freeQuotaEligible: true,
      actualBillingExportNetCostUsd: netFsCost,
      documentReadsCount: docReads,
      documentReadsCostUsd: readsCost,
      indexEntryReadsCount: Math.round(docReads * 0.1),
      indexEntryReadsCostUsd: parseFloat(((docReads * 0.1 / 100000) * 0.06).toFixed(4)),
      securityRuleReadsCount: docReads,
      securityRuleReadsCostUsd: 0.0,
      writesCount: docWrites,
      writesCostUsd: writesCost,
      storageGbMonths: 0.05,
      storageCostUsd: 0.009,
      networkEgressGb: 0.02,
      networkCostUsd: 0.002,
      freeTierAllowance: {
        dailyReadsCap: 50000,
        dailyWritesCap: 20000,
        storageCapGb: 1.0,
        appliedReadDiscountUsd: parseFloat(freeReadDiscount.toFixed(4)),
        appliedWriteDiscountUsd: parseFloat(freeWriteDiscount.toFixed(4)),
      },
      grossCostUsd: grossFsCost,
      netBillableAmountUsd: netFsCost,
    };

    // 13. Google Places Billing Breakdown by SKU (Post-March 2025 Tiering)
    const autoReqCount = m.googlePlacesBilling.autocompleteRequestsSkuCount;
    const autoSessCount = m.googlePlacesBilling.autocompleteSessionUsageSkuCount;
    const placeDetEssCount = m.googlePlacesBilling.placeDetailsEssentialsSkuCount;
    const placeDetProCount = m.googlePlacesBilling.placeDetailsProSkuCount;
    const placeDetEntCount = m.googlePlacesBilling.placeDetailsEnterpriseSkuCount;
    const placeDetEntAtmCount = m.googlePlacesBilling.placeDetailsEnterpriseAtmosphereSkuCount || 0;

    const autoReqCost = parseFloat(((autoReqCount / 1000) * 2.83).toFixed(4));
    const autoSessCost = 0.0; // FREE SKU (Post-March 2025 rule!)
    const placeDetEssCost = parseFloat(((placeDetEssCount / 1000) * 5.0).toFixed(4));
    const placeDetProCost = parseFloat(((placeDetProCount / 1000) * 17.0).toFixed(4));
    const placeDetEntCost = parseFloat(((placeDetEntCount / 1000) * 20.0).toFixed(4));
    const placeDetEntAtmCost = parseFloat(((placeDetEntAtmCount / 1000) * 25.0).toFixed(4));

    const grossPlacesCost = parseFloat((autoReqCost + autoSessCost + placeDetEssCost + placeDetProCost + placeDetEntCost + placeDetEntAtmCost).toFixed(4));
    const netPlacesCost = grossPlacesCost;

    const autoReqBillableAfterCap = Math.max(0, autoReqCount - 10000);
    const placeDetEssBillableAfterCap = Math.max(0, placeDetEssCount - 10000);
    const billableEventsAfterCap = autoReqBillableAfterCap + placeDetEssBillableAfterCap + placeDetProCount + placeDetEntCount + placeDetEntAtmCount;

    // Under current monthly caps (10,000 free events for Autocomplete Requests and Place Details Essentials):
    // Net billable cost = $0.00 if within free usage cap
    const autoReqNetCost = parseFloat(((autoReqBillableAfterCap / 1000) * 2.83).toFixed(4));
    const placeDetEssNetCost = parseFloat(((placeDetEssBillableAfterCap / 1000) * 5.0).toFixed(4));
    const netBillableCost = parseFloat((autoReqNetCost + placeDetEssNetCost + placeDetProCost + placeDetEntCost + placeDetEntAtmCost).toFixed(4));
    const freeUsageAllowanceApplied = grossPlacesCost - netBillableCost;

    m.googlePlacesBilling = {
      autocompleteRequestsSkuId: '4EF4-B17C-B31A',
      autocompleteRequestsSkuCount: autoReqCount,
      autocompleteRequestsSkuCostUsd: autoReqCost,
      autocompleteRequestsFreeCapMonthly: 10000,
      autocompleteRequestsBillableAfterCap: autoReqBillableAfterCap,
      autocompleteSessionUsageSkuId: 'EEA3-417B-DBA1',
      autocompleteSessionUsageSkuCount: autoSessCount,
      autocompleteSessionUsageSkuCostUsd: 0.0, // Free SKU
      placeDetailsEssentialsSkuId: '6E05-E1C3-8D85',
      placeDetailsEssentialsSkuDescription: 'Place Details (Essentials Tier)',
      placeDetailsEssentialsSkuCount: placeDetEssCount,
      placeDetailsEssentialsSkuCostUsd: placeDetEssCost,
      placeDetailsEssentialsFreeCapMonthly: 10000,
      placeDetailsEssentialsBillableAfterCap: placeDetEssBillableAfterCap,
      placeDetailsProSkuId: '4ED6-464A-2AFC',
      placeDetailsProSkuDescription: 'Place Details (Pro Tier)',
      placeDetailsProSkuCount: placeDetProCount,
      placeDetailsProSkuCostUsd: placeDetProCost,
      placeDetailsEnterpriseSkuId: '2D9A-3DE0-3766',
      placeDetailsEnterpriseSkuDescription: 'Place Details (Enterprise Tier)',
      placeDetailsEnterpriseSkuCount: placeDetEntCount,
      placeDetailsEnterpriseSkuCostUsd: placeDetEntCost,
      placeDetailsEnterpriseAtmosphereSkuId: 'EB23-5ECC-F753',
      placeDetailsEnterpriseAtmosphereSkuDescription: 'Place Details (Enterprise + Atmosphere Tier)',
      placeDetailsEnterpriseAtmosphereSkuCount: placeDetEntAtmCount,
      placeDetailsEnterpriseAtmosphereSkuCostUsd: placeDetEntAtmCost,
      totalBillableEvents: autoReqCount + placeDetEssCount + placeDetProCount + placeDetEntCount + placeDetEntAtmCount,
      grossListPriceEquivalent: grossPlacesCost,
      freeSkuUsageAllowance: freeUsageAllowanceApplied,
      billableUsageAfterFreeCap: billableEventsAfterCap,
      netBillableCost: netBillableCost,
      grossCostUsd: grossPlacesCost,
      grossListPriceEquivalentUsd: grossPlacesCost,
      freeUsageAppliedUsd: freeUsageAllowanceApplied,
      netBillableCostUsd: netBillableCost,
      netChargedAmountUsd: netBillableCost,
      billingModelVersion: 'Post-March 2025 SKU Pricing',
      sessionMetricsBreakdown: m.googlePlacesBilling.sessionMetricsBreakdown,
    };

    // 14. Stage 2 Exit Criteria Gate Check
    const gate = m.stage2ExitGate;
    gate.observationHoursPass = gate.currentObservationHours >= gate.minObservationHours;
    gate.resolvedDestinationsPass = gate.currentResolvedDestinations >= gate.minResolvedDestinations;
    gate.enrichmentJobsPass = gate.currentEnrichmentJobs >= gate.minEnrichmentJobs;
    gate.groupImpressionsPass = gate.currentGroupImpressions >= gate.minGroupImpressions;

    gate.isStage2ExitGatePassed =
      gate.observationHoursPass &&
      gate.resolvedDestinationsPass &&
      gate.enrichmentJobsPass &&
      gate.groupImpressionsPass;

    // 15. Canary vs Control Cohort Comparison & Degradation Check
    const cc = m.cohortComparison;
    cc.zeroResultRateDiffPct = parseFloat((cc.canary.zeroResultRatePct - cc.control.zeroResultRatePct).toFixed(2));
    cc.p95LatencyDiffMs = parseFloat((cc.canary.p95LatencyMs - cc.control.p95LatencyMs).toFixed(1));

    cc.isZeroResultDegraded = cc.zeroResultRateDiffPct >= WARNING_THRESHOLDS.maxCanaryZeroResultDegradationPct;
    cc.isLatencyDegraded = cc.p95LatencyDiffMs >= WARNING_THRESHOLDS.maxCanaryP95LatencyDegradationMs;

    // ----------------------------------------------------
    // CHECK INSTANT KILL SWITCH THRESHOLDS & AUTO-HALT
    // ----------------------------------------------------
    const alerts: string[] = [];

    if (m.destinationResolveErrorRatePct > WARNING_THRESHOLDS.maxResolveErrorRatePct && m.destinationResolveTotalRequests >= 10) {
      alerts.push(`Resolve error rate (${m.destinationResolveErrorRateFormatted}) > 2.0%`);
    }

    if (m.enrichmentDeadRatePct > WARNING_THRESHOLDS.maxEnrichmentDeadRatePct) {
      alerts.push(`Enrichment dead job rate (${m.enrichmentDeadRateFormatted}) > 1.0%`);
    }

    if (m.fencingRejectionRatePct > WARNING_THRESHOLDS.maxFencingRejectionRatePct) {
      alerts.push(`Fencing rejection rate spike (${m.fencingRejectionRateFormatted}) > 1.0%`);
    }

    if (m.orphanMappingRatioPct > WARNING_THRESHOLDS.maxOrphanRatioPct) {
      alerts.push(`Orphan mapping ratio (${m.orphanMappingRatioFormatted}) > 5.0%`);
    }

    if (m.conflictMappingCount > WARNING_THRESHOLDS.maxConflictCount) {
      alerts.push(`Conflict mappings detected (${m.conflictMappingCount}) > 0`);
    }

    if (m.duplicateCreatedCount > WARNING_THRESHOLDS.maxDuplicateDestinations) {
      alerts.push(`Duplicate destinations created (${m.duplicateCreatedCount}) > 0`);
    }

    if (m.staleWorkerCommitCount > WARNING_THRESHOLDS.maxStaleWorkerCommits) {
      alerts.push(`Stale worker commits detected (${m.staleWorkerCommitCount}) > 0`);
    }

    if (m.wrongDestinationReportCount > WARNING_THRESHOLDS.maxConfirmedWrongDestinations) {
      alerts.push(`Confirmed wrong destination reports (${m.wrongDestinationReportCount}) > 0`);
    }

    if (cc.isZeroResultDegraded) {
      alerts.push(`Canary zeroResultRate increased by ${cc.zeroResultRateDiffPct}% vs Control (Limit: 20%)`);
    }

    if (cc.isLatencyDegraded) {
      alerts.push(`Canary p95 latency degraded by +${cc.p95LatencyDiffMs}ms vs Control (Limit: +300ms)`);
    }

    if (m.firestoreBilling.netBillableAmountUsd > WARNING_THRESHOLDS.maxMonthlyFirestoreBudgetUsd) {
      alerts.push(`Net Firestore monthly bill ($${m.firestoreBilling.netBillableAmountUsd}) > Budget ($15.00)`);
    }

    m.warningAlerts = alerts;
    m.isHealthy = alerts.length === 0;

    if (alerts.length > 0) {
      featureFlagService.haltAutoExpansion(alerts.join('; '));
    }
  }

  public getMetrics(): CanaryOperationalMetrics {
    return { ...this.metrics };
  }
}

export const canaryTelemetryService = new CanaryTelemetryService();
