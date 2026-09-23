export interface FeatureFlags {
  externalDestinationOnboarding: boolean;
  destinationGrouping: boolean;
  enrichmentWorker: boolean;
  providerMappingRecovery: boolean;
  mappingPhysicalPurge: boolean; // MUST be false initially during Canary
}

export type CanaryStageId = 'stage_1_qa' | 'stage_2_5pct' | 'stage_3_25pct' | 'stage_4_100pct';

export interface CanaryStageConfig {
  stageId: CanaryStageId;
  name: string;
  targetUserPercentage: number; // 0, 5, 25, 100
  allowInternalQaOnly: boolean;
  minObservationHours: number;
  maxResolveErrorRatePercent: number;
  maxEnrichmentDeadRatePercent: number;
  requiredApproval: boolean;
}

export const CANARY_STAGES: Record<CanaryStageId, CanaryStageConfig> = {
  stage_1_qa: {
    stageId: 'stage_1_qa',
    name: 'Stage 1: Internal QA Users Only',
    targetUserPercentage: 0,
    allowInternalQaOnly: true,
    minObservationHours: 24,
    maxResolveErrorRatePercent: 2.0,
    maxEnrichmentDeadRatePercent: 1.0,
    requiredApproval: true,
  },
  stage_2_5pct: {
    stageId: 'stage_2_5pct',
    name: 'Stage 2: 5% Live Users',
    targetUserPercentage: 5,
    allowInternalQaOnly: false,
    minObservationHours: 48,
    maxResolveErrorRatePercent: 2.0,
    maxEnrichmentDeadRatePercent: 1.0,
    requiredApproval: true,
  },
  stage_3_25pct: {
    stageId: 'stage_3_25pct',
    name: 'Stage 3: 25% Live Users',
    targetUserPercentage: 25,
    allowInternalQaOnly: false,
    minObservationHours: 72,
    maxResolveErrorRatePercent: 2.0,
    maxEnrichmentDeadRatePercent: 1.0,
    requiredApproval: true,
  },
  stage_4_100pct: {
    stageId: 'stage_4_100pct',
    name: 'Stage 4: 100% Production Rollout',
    targetUserPercentage: 100,
    allowInternalQaOnly: false,
    minObservationHours: 168, // 7 days
    maxResolveErrorRatePercent: 2.0,
    maxEnrichmentDeadRatePercent: 1.0,
    requiredApproval: true,
  },
};

class FeatureFlagManager {
  private flags: FeatureFlags = {
    externalDestinationOnboarding: true,
    destinationGrouping: true,
    enrichmentWorker: true,
    providerMappingRecovery: true,
    mappingPhysicalPurge: false, // Disabled initially as instructed (Tombstone creation allowed)
  };

  private currentStage: CanaryStageId = 'stage_3_25pct';
  private autoExpansionHalted: boolean = false;
  private haltReason: string | null = null;

  public getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  public isEnabled(flagName: keyof FeatureFlags): boolean {
    if (flagName === 'mappingPhysicalPurge') {
      // Physical purge is strictly disabled when mappingPhysicalPurge flag is false
      return this.flags.mappingPhysicalPurge && !this.autoExpansionHalted;
    }
    return this.flags[flagName] && !this.autoExpansionHalted;
  }

  public updateFlag(flagName: keyof FeatureFlags, enabled: boolean): void {
    this.flags[flagName] = enabled;
    console.log(`[FEATURE_FLAG] ${flagName} set to ${enabled}`);
  }

  public getCurrentStage(): CanaryStageConfig {
    return CANARY_STAGES[this.currentStage];
  }

  public setCanaryStage(stageId: CanaryStageId): void {
    this.currentStage = stageId;
    console.log(`[CANARY_STAGE] Advanced to ${CANARY_STAGES[stageId].name}`);
  }

  public haltAutoExpansion(reason: string): void {
    this.autoExpansionHalted = true;
    this.haltReason = reason;
    console.error(`[CANARY_AUTO_HALT] Rollout expansion halted! Reason: ${reason}`);
  }

  public isHalted(): { halted: boolean; reason: string | null } {
    return { halted: this.autoExpansionHalted, reason: this.haltReason };
  }

  public resumeRollout(): void {
    this.autoExpansionHalted = false;
    this.haltReason = null;
    console.log(`[CANARY_ROLLOUT] Rollout auto-expansion resumed.`);
  }

  public isUserInCanary(
    userContext: { userId?: string; anonymousDeviceId?: string } | string,
    isInternalQaUser: boolean = false
  ): boolean {
    const stage = this.getCurrentStage();

    if (stage.allowInternalQaOnly) {
      return isInternalQaUser;
    }

    if (isInternalQaUser) return true;

    // Extract deterministic identifier (userId preferred over anonymousDeviceId)
    const identifier =
      typeof userContext === 'string'
        ? userContext
        : userContext?.userId || userContext?.anonymousDeviceId || 'anon_device_fallback';

    // FNV-1a 32-bit Hash Algorithm for Sticky Cohort Bucket Allocation
    let hash = 0x811c9dc5;
    for (let i = 0; i < identifier.length; i++) {
      hash ^= identifier.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const bucket = Math.abs(hash >>> 0) % 100;
    const isInCohort = bucket < stage.targetUserPercentage;

    console.log(`[CANARY_STICKY_COHORT] Identifier "${identifier}" -> Bucket ${bucket} (Target: ${stage.targetUserPercentage}%). Assigned: ${isInCohort ? 'Canary' : 'Control'}`);
    return isInCohort;
  }
}

export const featureFlagService = new FeatureFlagManager();
