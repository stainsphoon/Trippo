import type {
  TravelSuitabilityLevel,
  TravelSuitabilityResult,
  SuitabilityFactor,
  SuitabilityWarning,
  TravelSuitabilitySubScores,
  TravelSuitabilityConfigItem
} from '../config/travelSuitabilityConfig';

export type {
  TravelSuitabilityLevel,
  TravelSuitabilityResult,
  SuitabilityFactor,
  SuitabilityWarning,
  TravelSuitabilitySubScores,
  TravelSuitabilityConfigItem
};

export {
  TRAVEL_SUITABILITY_CONFIG,
  getTravelSuitabilityLevel,
  normalizeTravelSuitability,
  getSubScoreStatus
} from '../config/travelSuitabilityConfig';

export type RecommendationGradeKey = 
  | 'optimal'
  | 'excellent' 
  | 'highlyRecommended' 
  | 'recommended' 
  | 'conditional' 
  | 'caution' 
  | 'reconsider' 
  | 'notRecommended';

// Legacy compatibility alias
export type ScoreGrade = RecommendationGradeKey | 'highly_recommended' | 'good_with_conditions' | 'needs_adjustment';

export interface RatingConfigItem {
  key: RecommendationGradeKey;
  minScore: number;
  maxScore: number;
  labelKo: string;
  labelEn: string;
  tone: 'strong_positive' | 'positive' | 'moderate_positive' | 'balanced' | 'caution' | 'negative' | 'strong_negative';
  conclusionTemplateKo: string;
  conclusionTemplateEn: string;
  badgeBgClass: string;
  badgeTextClass: string;
  badgeBorderClass: string;
  cardColorTheme: 'emerald' | 'teal' | 'blue' | 'amber' | 'orange' | 'rose' | 'red';
  ctaKo: string;
  ctaEn: string;
}

export const RECOMMENDATION_RATING_CONFIG: Record<string, RatingConfigItem> = {
  optimal: {
    key: 'optimal',
    minScore: 85,
    maxScore: 100,
    labelKo: '최적의 여행 시기',
    labelEn: 'Ideal time to visit',
    tone: 'strong_positive',
    conclusionTemplateKo: '여행 조건이 매우 우수한 시기입니다.',
    conclusionTemplateEn: 'Travel conditions are ideal during this period.',
    badgeBgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeTextClass: 'text-emerald-700 dark:text-emerald-300',
    badgeBorderClass: 'border-emerald-200 dark:border-emerald-900/40',
    cardColorTheme: 'emerald',
    ctaKo: '추천 일정 만들기',
    ctaEn: 'Create Recommended Itinerary'
  },
  excellent: {
    key: 'excellent',
    minScore: 85,
    maxScore: 100,
    labelKo: '최적의 여행 시기',
    labelEn: 'Ideal time to visit',
    tone: 'strong_positive',
    conclusionTemplateKo: '여행 조건이 매우 우수한 시기입니다.',
    conclusionTemplateEn: 'Travel conditions are ideal during this period.',
    badgeBgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeTextClass: 'text-emerald-700 dark:text-emerald-300',
    badgeBorderClass: 'border-emerald-200 dark:border-emerald-900/40',
    cardColorTheme: 'emerald',
    ctaKo: '추천 일정 만들기',
    ctaEn: 'Create Recommended Itinerary'
  },
  highlyRecommended: {
    key: 'highlyRecommended',
    minScore: 75,
    maxScore: 84,
    labelKo: '매우 추천',
    labelEn: 'Highly recommended',
    tone: 'positive',
    conclusionTemplateKo: '전반적으로 매우 추천하는 시기입니다.',
    conclusionTemplateEn: 'A highly recommended time to visit overall.',
    badgeBgClass: 'bg-teal-50 dark:bg-teal-950/40',
    badgeTextClass: 'text-teal-700 dark:text-teal-300',
    badgeBorderClass: 'border-teal-200 dark:border-teal-900/40',
    cardColorTheme: 'teal',
    ctaKo: '여행 계획 시작하기',
    ctaEn: 'Start Travel Planning'
  },
  recommended: {
    key: 'recommended',
    minScore: 65,
    maxScore: 74,
    labelKo: '추천',
    labelEn: 'Recommended',
    tone: 'moderate_positive',
    conclusionTemplateKo: '일반적으로 여행하기 좋은 시기입니다.',
    conclusionTemplateEn: 'Generally a good time for travel.',
    badgeBgClass: 'bg-blue-50 dark:bg-blue-950/40',
    badgeTextClass: 'text-blue-700 dark:text-blue-300',
    badgeBorderClass: 'border-blue-200 dark:border-blue-900/40',
    cardColorTheme: 'blue',
    ctaKo: '여행 계획 시작하기',
    ctaEn: 'Start Travel Planning'
  },
  conditional: {
    key: 'conditional',
    minScore: 55,
    maxScore: 64,
    labelKo: '조건부 추천',
    labelEn: 'Recommended with conditions',
    tone: 'balanced',
    conclusionTemplateKo: '일부 준비와 일정 조정을 전제로 추천할 수 있는 시기입니다.',
    conclusionTemplateEn: 'Recommended provided necessary preparations and minor schedule adjustments are made.',
    badgeBgClass: 'bg-amber-50 dark:bg-amber-950/40',
    badgeTextClass: 'text-amber-700 dark:text-amber-300',
    badgeBorderClass: 'border-amber-200 dark:border-amber-900/40',
    cardColorTheme: 'amber',
    ctaKo: '주의사항 반영해 일정 만들기',
    ctaEn: 'Create Itinerary with Precautions'
  },
  caution: {
    key: 'caution',
    minScore: 40,
    maxScore: 54,
    labelKo: '여정 주의',
    labelEn: 'Travel caution',
    tone: 'caution',
    conclusionTemplateKo: '여행은 가능하지만 뚜렷한 제약이 있어 주의가 필요합니다.',
    conclusionTemplateEn: 'Travel is possible, but noticeable constraints require caution and preparation.',
    badgeBgClass: 'bg-orange-50 dark:bg-orange-950/40',
    badgeTextClass: 'text-orange-700 dark:text-orange-300',
    badgeBorderClass: 'border-orange-200 dark:border-orange-900/40',
    cardColorTheme: 'orange',
    ctaKo: '다른 날짜 선택하기',
    ctaEn: 'Select Other Dates'
  },
  reconsider: {
    key: 'reconsider',
    minScore: 0,
    maxScore: 39,
    labelKo: '시기 재검토',
    labelEn: 'Consider different dates',
    tone: 'negative',
    conclusionTemplateKo: '현재 조건에서는 다른 여행 시기도 함께 검토하는 것이 좋습니다.',
    conclusionTemplateEn: 'Considering alternative travel dates is recommended under current conditions.',
    badgeBgClass: 'bg-rose-50 dark:bg-rose-950/40',
    badgeTextClass: 'text-rose-700 dark:text-rose-300',
    badgeBorderClass: 'border-rose-200 dark:border-rose-900/40',
    cardColorTheme: 'rose',
    ctaKo: '다른 날짜 선택하기',
    ctaEn: 'Select Other Dates'
  },
  notRecommended: {
    key: 'notRecommended',
    minScore: 0,
    maxScore: 39,
    labelKo: '시기 재검토',
    labelEn: 'Consider different dates',
    tone: 'negative',
    conclusionTemplateKo: '현재 조건에서는 다른 여행 시기도 함께 검토하는 것이 좋습니다.',
    conclusionTemplateEn: 'Considering alternative travel dates is recommended under current conditions.',
    badgeBgClass: 'bg-rose-50 dark:bg-rose-950/40',
    badgeTextClass: 'text-rose-700 dark:text-rose-300',
    badgeBorderClass: 'border-rose-200 dark:border-rose-900/40',
    cardColorTheme: 'rose',
    ctaKo: '다른 날짜 선택하기',
    ctaEn: 'Select Other Dates'
  }
};

export function getRatingConfig(score: number, criticalRiskOverride: boolean = false): RatingConfigItem {
  let effectiveScore = Math.max(0, Math.min(100, Math.round(score)));
  if (criticalRiskOverride && effectiveScore > 54) {
    effectiveScore = 54; // Cap at caution grade maximum (40~54)
  }
  if (effectiveScore >= 85) return RECOMMENDATION_RATING_CONFIG.optimal;
  if (effectiveScore >= 75) return RECOMMENDATION_RATING_CONFIG.highlyRecommended;
  if (effectiveScore >= 65) return RECOMMENDATION_RATING_CONFIG.recommended;
  if (effectiveScore >= 55) return RECOMMENDATION_RATING_CONFIG.conditional;
  if (effectiveScore >= 40) return RECOMMENDATION_RATING_CONFIG.caution;
  return RECOMMENDATION_RATING_CONFIG.reconsider;
}

export const BANNED_PHRASES_PER_GRADE: Record<RecommendationGradeKey, string[]> = {
  optimal: ['여행을 재검토', '추천하지 않음', '여행 시기를 변경', '부적합한 시기'],
  excellent: ['여행을 재검토', '추천하지 않음', '여행 시기를 변경', '부적합한 시기'],
  highlyRecommended: ['여행을 재검토', '추천하지 않음', '여행 시기를 변경', '부적합한 시기'],
  recommended: ['여행을 재검토', '추천하지 않음', '여행 시기를 변경'],
  conditional: ['여행을 재검토', '추천하지 않음', '여행 시기를 변경', '최적의 시기', '가장 완벽한'],
  caution: [
    '여행하기 좋은 시기',
    '추천하는 시기',
    '매우 추천',
    '전반적으로 추천',
    '최적',
    '쾌적',
    '걱정 없이',
    '이상적인 여행',
    '적극 추천',
    '야외활동에 적합',
    '즐거운 여정',
    '완벽한 시기'
  ],
  reconsider: [
    '여행하기 좋은 시기',
    '추천하는 시기',
    '매우 추천',
    '전반적으로 추천',
    '조건을 확인하면 추천',
    '전반적으로 괜찮음',
    '좋은 시기',
    '무난한 여행',
    '최적',
    '쾌적',
    '걱정 없이',
    '이상적인 여행',
    '적극 추천',
    '야외활동에 적합'
  ],
  notRecommended: [
    '여행하기 좋은 시기',
    '추천하는 시기',
    '매우 추천',
    '전반적으로 추천',
    '조건을 확인하면 추천',
    '전반적으로 괜찮음',
    '좋은 시기',
    '무난한 여행',
    '최적',
    '쾌적',
    '걱정 없이',
    '이상적인 여행',
    '적극 추천',
    '야외활동에 적합'
  ]
};

export interface CriticalRiskItem {
  type: 'extreme_heat' | 'severe_rain' | 'severe_weather' | 'transport_disruption';
  severity: 'high' | 'severe';
  affectedDays: number;
  labelKo: string;
  labelEn: string;
}

export interface SubScores {
  weatherComfort: number;          // 0-100 (Weight: 30%)
  crowdAndHolidayImpact: number;   // 0-100 (Weight: 15%)
  localExperience: number;         // 0-100 (Weight: 20%)
  itineraryPracticality: number;   // 0-100 (Weight: 20%)
  operationalStability: number;    // 0-100 (Weight: 15%)
  
  // Backward compatibility getters / aliases
  weather?: number;
  events?: number;
  crowd?: number;
  holidayImpact?: number;
  outdoorSuitability?: number;
}

export interface RecommendationIndex {
  totalScore: number;          // 0-100
  grade: RecommendationGradeKey;
  gradeTextKo: string;
  gradeTextEn: string;
  ratingConfig: RatingConfigItem;
  subScores: SubScores;
  criticalRisks: CriticalRiskItem[];
}

export interface DestinationEvidence {
  city: string;
  country: string;
  countryCode: string;
  timezoneId: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
}

export interface TripEvidence {
  startDate: string;
  endDate: string;
  durationDays: number;
  durationNights: number;
}

export interface WeatherEvidence {
  dataType: 'forecast' | 'climate_average' | 'past_observation' | 'mixed';
  forecastRange?: { startDate: string; endDate: string };
  climateRange?: { startDate: string; endDate: string };
  heatRisk: 'low' | 'moderate' | 'high';
  rainRisk: 'low' | 'moderate' | 'high';
  outdoorSuitability: 'excellent' | 'good' | 'fair' | 'poor';
  averageTemp: number;
  averageTempMax: number;
  averageTempMin: number;
  precipDays: number;
  heatWaveDays: number;
  source: string;
  verifiedAt: string;
}

export interface HolidayEvidenceItem {
  id: string;
  date: string;
  name: string;
  nameEn: string;
  impact: 'changed_business_hours' | 'possible_closures' | 'transport_crowds' | 'none';
  source: string;
  verified: boolean;
}

export interface EventEvidenceItem {
  id: string;
  title: string;
  titleEn: string;
  startDate: string;
  endDate: string;
  overlapStartDate: string;
  overlapEndDate: string;
  category: string;
  officialStatus: 'confirmed' | 'estimated' | 'unverified';
  source: string;
  sourceUrl?: string;
  verifiedAt: string;
}

export interface CrowdEvidence {
  level: 'low' | 'moderate' | 'high' | 'very_high';
  levelTextKo: string;
  levelTextEn: string;
  highCrowdDates: string[];
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ScoreContributor {
  id: string;
  type: 'events' | 'weather' | 'outdoorSuitability' | 'crowd' | 'holidayImpact' | 'localExperience' | 'dataCompleteness';
  labelKo: string;
  labelEn: string;
  scoreImpact: number; // positive for bonus, negative for deduction
  evidenceIds: string[];
}

export interface AnalysisEvidenceBundle {
  destination: DestinationEvidence;
  trip: TripEvidence;
  recommendationIndex: RecommendationIndex;
  weatherEvidence: WeatherEvidence;
  holidayEvidence: HolidayEvidenceItem[];
  eventEvidence: EventEvidenceItem[];
  crowdEvidence: CrowdEvidence;
  criticalRisks: CriticalRiskItem[];
  dataCompleteness: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  positiveContributors: ScoreContributor[];
  negativeContributors: ScoreContributor[];
}

export interface ReportHighlightPoint {
  id?: string;
  text: string;
  textEn: string;
  evidenceIds: string[];
}

export interface ReportFooterMetadata {
  analyzedAt: string;
  dataTypesUsed: string[];
  verifiedSourcesCount: number;
  forecastDateRange?: string;
  climateDateRange?: string;
  confidence: 'high' | 'medium' | 'low';
  dataCompleteness: number;
}

export interface TravelSuitabilityReport {
  totalScore: number;
  grade: RecommendationGradeKey;
  gradeTextKo: string;
  gradeTextEn: string;
  ratingConfig: RatingConfigItem;
  overallConclusion: string;
  overallConclusionEn: string;
  positiveHighlights: ReportHighlightPoint[];
  cautionPoints: ReportHighlightPoint[];
  actionableStrategy: string;
  actionableStrategyEn: string;
  footerMetadata?: ReportFooterMetadata;
  evidenceBundle: AnalysisEvidenceBundle;
  suitabilityResult?: TravelSuitabilityResult;
}
