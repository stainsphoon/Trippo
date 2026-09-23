export type TravelSuitabilityLevel =
  | 'excellent'
  | 'good'
  | 'prepare'
  | 'compare_dates';

export interface SuitabilityFactor {
  id: string;
  type: string;
  titleKo: string;
  titleEn: string;
  descriptionKo: string;
  descriptionEn: string;
  evidenceIds: string[];
}

export interface SuitabilityWarning {
  id: string;
  type: string;
  severity: 'medium' | 'high' | 'critical';
  titleKo: string;
  titleEn: string;
  descriptionKo: string;
  descriptionEn: string;
  affectedDates?: string[];
  evidenceIds: string[];
}

export interface TravelSuitabilitySubScores {
  weatherComfort?: number;
  crowdAndHolidayImpact?: number;
  localExperience?: number;
  itineraryPracticality?: number;
  operationalStability?: number;
}

export interface TravelSuitabilityResult {
  internalScore: number;
  level: TravelSuitabilityLevel;

  labelKo: string;
  labelEn: string;

  shortSummaryKo: string;
  shortSummaryEn: string;

  confidence: 'low' | 'medium' | 'high';

  positiveFactors: SuitabilityFactor[];
  cautionFactors: SuitabilityFactor[];
  criticalWarnings: SuitabilityWarning[];

  subScores: TravelSuitabilitySubScores;
}

export interface TravelSuitabilityConfigItem {
  level: TravelSuitabilityLevel;
  minScore: number;
  maxScore: number;
  emoji: string;
  ariaLabelKo: string;
  ariaLabelEn: string;
  labelKo: string;
  labelEn: string;
  shortSummaryKo: string;
  shortSummaryEn: string;
  ctaKo: string;
  ctaEn: string;
  ctaLabelKo: string;
  ctaLabelEn: string;
  secondaryCtaKo?: string;
  secondaryCtaEn?: string;
  colorTheme: 'emerald' | 'blue' | 'amber' | 'rose';
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  badgeTextClass: string;
  cardBgClass: string;
  ctaBgClass: string;
}

export const TRAVEL_SUITABILITY_CONFIG: Record<TravelSuitabilityLevel, TravelSuitabilityConfigItem> = {
  excellent: {
    level: 'excellent',
    minScore: 80,
    maxScore: 100,
    emoji: '😄',
    ariaLabelKo: '매우 좋은 여행 시기',
    ariaLabelEn: 'Excellent time to visit',
    labelKo: '매우 좋은 시기',
    labelEn: 'Excellent time to visit',
    shortSummaryKo: '전반적인 여행 조건이 매우 좋고, 큰 일정 제약 없이 여행하기 좋은 시기예요.',
    shortSummaryEn: 'Travel conditions are excellent overall, with no major schedule constraints.',
    ctaKo: '추천 일정 만들기',
    ctaEn: 'Create Recommended Itinerary',
    ctaLabelKo: '추천 일정 만들기',
    ctaLabelEn: 'Create Recommended Itinerary',
    colorTheme: 'emerald',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-800 dark:text-emerald-200',
    borderClass: 'border-emerald-200 dark:border-emerald-800/60',
    badgeBgClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    badgeBorderClass: 'border-emerald-200/80 dark:border-emerald-800/60',
    badgeTextClass: 'text-emerald-700 dark:text-emerald-300',
    cardBgClass: 'from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20',
    ctaBgClass: 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500'
  },
  good: {
    level: 'good',
    minScore: 65,
    maxScore: 79,
    emoji: '🙂',
    ariaLabelKo: '여행하기 좋은 시기',
    ariaLabelEn: 'Good time to visit',
    labelKo: '여행하기 좋은 시기',
    labelEn: 'Good time to visit',
    shortSummaryKo: '일부 변수가 있지만 전반적으로 여행하기 좋은 시기예요.',
    shortSummaryEn: 'Overall a good time for travel despite minor variable factors.',
    ctaKo: '여행 계획 시작하기',
    ctaEn: 'Start Travel Planning',
    ctaLabelKo: '여행 계획 시작하기',
    ctaLabelEn: 'Start Travel Planning',
    colorTheme: 'blue',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    textClass: 'text-blue-800 dark:text-blue-200',
    borderClass: 'border-blue-200 dark:border-blue-800/60',
    badgeBgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
    badgeBorderClass: 'border-blue-200/80 dark:border-blue-800/60',
    badgeTextClass: 'text-blue-700 dark:text-blue-300',
    cardBgClass: 'from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20',
    ctaBgClass: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500'
  },
  prepare: {
    level: 'prepare',
    minScore: 50,
    maxScore: 64,
    emoji: '😐',
    ariaLabelKo: '준비가 필요한 시기',
    ariaLabelEn: 'Preparation recommended',
    labelKo: '준비가 필요한 시기',
    labelEn: 'Preparation recommended',
    shortSummaryKo: '여행은 가능하지만 일부 준비와 일정 조정이 필요한 시기예요.',
    shortSummaryEn: 'Travel is feasible, but preparation and schedule adjustments are advised.',
    ctaKo: '주의사항 반영해 일정 만들기',
    ctaEn: 'Plan with Precautions',
    ctaLabelKo: '주의사항 반영해 일정 만들기',
    ctaLabelEn: 'Plan with Precautions',
    colorTheme: 'amber',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-800 dark:text-amber-200',
    borderClass: 'border-amber-200 dark:border-amber-800/60',
    badgeBgClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    badgeBorderClass: 'border-amber-200/80 dark:border-amber-800/60',
    badgeTextClass: 'text-amber-800 dark:text-amber-300',
    cardBgClass: 'from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20',
    ctaBgClass: 'bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500'
  },
  compare_dates: {
    level: 'compare_dates',
    minScore: 0,
    maxScore: 49,
    emoji: '🙁',
    ariaLabelKo: '다른 시기도 비교 권장',
    ariaLabelEn: 'Consider other dates',
    labelKo: '다른 시기도 비교 권장',
    labelEn: 'Consider other dates',
    shortSummaryKo: '여행기간 대부분에 불편이나 제약이 예상돼 다른 날짜와 함께 비교해 보는 것이 좋아요.',
    shortSummaryEn: 'Inconveniences or constraints are expected; comparing alternative dates is recommended.',
    ctaKo: '다른 날짜 선택하기',
    ctaEn: 'Select Other Dates',
    ctaLabelKo: '다른 날짜 선택하기',
    ctaLabelEn: 'Select Other Dates',
    secondaryCtaKo: '계획 세우기',
    secondaryCtaEn: 'Create Plan',
    colorTheme: 'rose',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-800 dark:text-rose-200',
    borderClass: 'border-rose-200 dark:border-rose-800/60',
    badgeBgClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
    badgeBorderClass: 'border-rose-200/80 dark:border-rose-800/60',
    badgeTextClass: 'text-rose-800 dark:text-rose-300',
    cardBgClass: 'from-rose-50/80 to-red-50/50 dark:from-rose-950/30 dark:to-red-950/20',
    ctaBgClass: 'bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-600 dark:hover:bg-rose-500'
  }
};

/**
 * Single state conversion function mapping internal score (0-100) to 4-level suitability state.
 */
export function getTravelSuitabilityLevel(internalScore: number): TravelSuitabilityLevel {
  const score = Math.max(0, Math.min(100, Math.round(internalScore)));
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'prepare';
  return 'compare_dates';
}

/**
 * Normalizes any recommendation result to a standard TravelSuitabilityResult object.
 */
export function normalizeTravelSuitability(params: {
  internalScore: number;
  existingGrade?: string;
  confidence?: 'low' | 'medium' | 'high';
  positiveFactors?: SuitabilityFactor[];
  cautionFactors?: SuitabilityFactor[];
  criticalWarnings?: SuitabilityWarning[];
  subScores?: TravelSuitabilitySubScores;
  shortSummaryKo?: string;
  shortSummaryEn?: string;
}): TravelSuitabilityResult {
  const level = getTravelSuitabilityLevel(params.internalScore);
  const config = TRAVEL_SUITABILITY_CONFIG[level];

  return {
    internalScore: params.internalScore,
    level,
    labelKo: config.labelKo,
    labelEn: config.labelEn,
    shortSummaryKo: params.shortSummaryKo || config.shortSummaryKo,
    shortSummaryEn: params.shortSummaryEn || config.shortSummaryEn,
    confidence: params.confidence || 'high',
    positiveFactors: params.positiveFactors || [],
    cautionFactors: params.cautionFactors || [],
    criticalWarnings: params.criticalWarnings || [],
    subScores: params.subScores || {}
  };
}

/**
 * Helper for converting internal subscore numbers into qualitative labels without exposing numeric scores.
 */
export function getSubScoreStatus(score?: number): {
  labelKo: string;
  labelEn: string;
  colorClass: string;
  bg: string;
  text: string;
} {
  if (score === undefined || score === null) {
    return {
      labelKo: '정보 부족',
      labelEn: 'Limited info',
      colorClass: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-500 dark:text-gray-400'
    };
  }
  if (score >= 80) {
    return {
      labelKo: '매우 좋음',
      labelEn: 'Very good',
      colorClass: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300'
    };
  }
  if (score >= 65) {
    return {
      labelKo: '좋음',
      labelEn: 'Good',
      colorClass: 'text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-700 dark:text-blue-300'
    };
  }
  if (score >= 50) {
    return {
      labelKo: '보통',
      labelEn: 'Moderate',
      colorClass: 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300'
    };
  }
  return {
    labelKo: '주의',
    labelEn: 'Caution',
    colorClass: 'text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300'
  };
}
