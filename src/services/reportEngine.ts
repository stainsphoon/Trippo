import { DateTime } from 'luxon';
import {
  AnalysisEvidenceBundle,
  BANNED_PHRASES_PER_GRADE,
  CriticalRiskItem,
  CrowdEvidence,
  EventEvidenceItem,
  HolidayEvidenceItem,
  RatingConfigItem,
  RecommendationGradeKey,
  RecommendationIndex,
  RECOMMENDATION_RATING_CONFIG,
  ReportFooterMetadata,
  ReportHighlightPoint,
  ScoreContributor,
  ScoreGrade,
  SubScores,
  TravelSuitabilityReport,
  WeatherEvidence,
  getRatingConfig
} from '../types/reportTypes';
import {
  getTravelSuitabilityLevel,
  normalizeTravelSuitability
} from '../config/travelSuitabilityConfig';

export { getRatingConfig };

/**
 * Calculates standardized duration in calendar days (inclusive) and nights
 */
export function calculateTripDuration(startDate: string, endDate: string) {
  const startDt = DateTime.fromISO(startDate);
  const endDt = DateTime.fromISO(endDate);
  const diffDays = Math.round(endDt.diff(startDt, 'days').days);
  const durationDays = Math.max(1, diffDays + 1);
  const durationNights = Math.max(0, durationDays - 1);
  return { durationDays, durationNights };
}

/**
 * Maps recommendation score to grade and i18n text via single source rating config
 */
export function getGradeFromScore(score: number, criticalRiskOverride: boolean = false): {
  grade: RecommendationGradeKey;
  gradeTextKo: string;
  gradeTextEn: string;
  config: RatingConfigItem;
} {
  const config = getRatingConfig(score, criticalRiskOverride);
  return {
    grade: config.key,
    gradeTextKo: config.labelKo,
    gradeTextEn: config.labelEn,
    config
  };
}

/**
 * Computes subscores and Recommendation Index from raw inputs using weighted suitability engine
 */
export function computeRecommendationIndexAndBundle(params: {
  city: string;
  country: string;
  countryCode: string;
  timezoneId: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  weatherData: any;
  holidays: any[];
  events: any[];
  congestionLevel: string;
}): AnalysisEvidenceBundle {
  const {
    city,
    country,
    countryCode,
    timezoneId,
    formattedAddress,
    latitude,
    longitude,
    startDate,
    endDate,
    weatherData,
    holidays,
    events,
    congestionLevel
  } = params;

  // Rule 12: Standardized duration math
  const { durationDays, durationNights } = calculateTripDuration(startDate, endDate);

  // 1. Process Weather Evidence
  const dailyForecasts = weatherData?.dailyForecasts || [];
  let forecastDaysCount = 0;
  let climateDaysCount = 0;

  let forecastStartDate: string | null = null;
  let forecastEndDate: string | null = null;
  let climateStartDate: string | null = null;
  let climateEndDate: string | null = null;

  dailyForecasts.forEach((f: any) => {
    const isClimate = f.dataType === 'climate_average';
    if (isClimate) {
      climateDaysCount++;
      if (!climateStartDate) climateStartDate = f.date;
      climateEndDate = f.date;
    } else {
      forecastDaysCount++;
      if (!forecastStartDate) forecastStartDate = f.date;
      forecastEndDate = f.date;
    }
  });

  let weatherDataType: WeatherEvidence['dataType'] = 'forecast';
  if (climateDaysCount > 0 && forecastDaysCount > 0) {
    weatherDataType = 'mixed';
  } else if (climateDaysCount > 0) {
    weatherDataType = 'climate_average';
  } else if (weatherData?.weatherDataType === 'past_observation') {
    weatherDataType = 'past_observation';
  }

  const avgTemp = typeof weatherData?.averageTemp === 'number' ? weatherData.averageTemp : 20;
  const avgTempMax = typeof weatherData?.averageTempMax === 'number' ? weatherData.averageTempMax : 25;
  const avgTempMin = typeof weatherData?.averageTempMin === 'number' ? weatherData.averageTempMin : 15;
  const precipDays = typeof weatherData?.precipDays === 'number' ? weatherData.precipDays : 0;
  const heatWaveDays = typeof weatherData?.heatWaveDays === 'number' ? weatherData.heatWaveDays : 0;

  const heatRisk: WeatherEvidence['heatRisk'] = avgTempMax >= 33 || heatWaveDays > 2 ? 'high' : (avgTempMax >= 28 ? 'moderate' : 'low');
  const rainRisk: WeatherEvidence['rainRisk'] = precipDays >= Math.max(3, Math.ceil(durationDays * 0.4)) ? 'high' : (precipDays > 0 ? 'moderate' : 'low');
  
  let outdoorSuitability: WeatherEvidence['outdoorSuitability'] = 'good';
  if (heatRisk === 'high' || rainRisk === 'high') {
    outdoorSuitability = 'poor';
  } else if (heatRisk === 'moderate' || rainRisk === 'moderate') {
    outdoorSuitability = 'fair';
  } else if (avgTemp >= 18 && avgTemp <= 25) {
    outdoorSuitability = 'excellent';
  }

  const weatherEv: WeatherEvidence = {
    dataType: weatherDataType,
    forecastRange: forecastStartDate && forecastEndDate ? { startDate: forecastStartDate, endDate: forecastEndDate } : undefined,
    climateRange: climateStartDate && climateEndDate ? { startDate: climateStartDate, endDate: climateEndDate } : undefined,
    heatRisk,
    rainRisk,
    outdoorSuitability,
    averageTemp: Math.round(avgTemp),
    averageTempMax: Math.round(avgTempMax),
    averageTempMin: Math.round(avgTempMin),
    precipDays,
    heatWaveDays,
    source: weatherDataType === 'forecast' ? 'Open-Meteo Weather API (Live)' : 'Climate Normal Archive (Verified)',
    verifiedAt: new Date().toISOString()
  };

  // 2. Risk Group Deduplication & Affected Ratio Calculations (Section 6 & 7)
  let heatPenalty = 0;
  if (heatWaveDays > 0 || avgTempMax >= 33) {
    const heatRatio = Math.min(1, (heatWaveDays || 1) / durationDays);
    const heatBase = avgTempMax >= 38 ? 12 : (avgTempMax >= 35 ? 8 : 4);
    heatPenalty = Math.min(18, Math.round(heatBase + 10 * heatRatio));
  }

  let rainPenalty = 0;
  if (precipDays > 0) {
    const rainRatio = Math.min(1, precipDays / durationDays);
    const rainBase = precipDays >= Math.ceil(durationDays * 0.5) ? 10 : 5;
    rainPenalty = Math.min(18, Math.round(rainBase + 10 * rainRatio));
  }

  // Critical Risks Detection & Override (Section 13)
  const criticalRisks: CriticalRiskItem[] = [];
  if (heatWaveDays >= 3 || (avgTempMax >= 38 && durationDays >= 3) || (avgTemp >= 35 && durationDays >= 3)) {
    criticalRisks.push({
      type: 'extreme_heat',
      severity: 'high',
      affectedDays: heatWaveDays || durationDays,
      labelKo: `여행기간 대부분(${heatWaveDays || durationDays}일) 폭염 지속`,
      labelEn: `Persistent extreme heat on ${heatWaveDays || durationDays} days`
    });
  }
  if (precipDays >= Math.max(4, Math.ceil(durationDays * 0.5))) {
    criticalRisks.push({
      type: 'severe_rain',
      severity: 'high',
      affectedDays: precipDays,
      labelKo: `여행기간 중 잦은 강수(${precipDays}일) 예상`,
      labelEn: `Frequent heavy precipitation expected on ${precipDays} days`
    });
  }

  // 3. Process Holiday & Event Evidence
  const holidayEvList: HolidayEvidenceItem[] = (holidays || []).map((h: any, idx: number) => {
    return {
      id: `holiday-${idx + 1}-${h.date}`,
      date: h.date,
      name: h.name,
      nameEn: h.nameEn || h.name,
      impact: h.verifiedImpact || 'none',
      source: 'Nager Public Holidays API (Official)',
      verified: true
    };
  });

  const verifiedHolidayClosures = holidayEvList.filter(h => h.impact === 'possible_closures' || h.impact === 'changed_business_hours');
  const holidayPenalty = Math.min(12, verifiedHolidayClosures.length * 4);

  const eventEvList: EventEvidenceItem[] = (events || []).map((e: any, idx: number) => {
    const evStart = e.startDate || startDate;
    const evEnd = e.endDate || endDate;
    const oStart = evStart < startDate ? startDate : evStart;
    const oEnd = evEnd > endDate ? endDate : evEnd;

    return {
      id: `event-${idx + 1}-${e.name ? e.name.replace(/\s+/g, '_').toLowerCase() : 'ev'}`,
      title: e.name || e.title,
      titleEn: e.nameEn || e.titleEn || e.name || e.title,
      startDate: evStart,
      endDate: evEnd,
      overlapStartDate: oStart,
      overlapEndDate: oEnd,
      category: e.category || 'local_cultural_event',
      officialStatus: e.sourceUrl ? 'confirmed' : 'estimated',
      source: e.source || 'Local Tourism Board Archive',
      sourceUrl: e.sourceUrl,
      verifiedAt: new Date().toISOString()
    };
  });

  // 4. Process Crowd Evidence (Section 11)
  const congLevelClean = (congestionLevel || 'moderate').toLowerCase();
  let crowdLevel: CrowdEvidence['level'] = 'moderate';
  let crowdKo = '보통';
  let crowdEn = 'Moderate';
  let crowdPenalty = 0;
  let crowdBonus = 0;

  if (congLevelClean.includes('high') || congLevelClean.includes('heavy') || congLevelClean.includes('높음')) {
    crowdLevel = 'high';
    crowdKo = '혼잡';
    crowdEn = 'High';
    crowdPenalty = 8;
  } else if (congLevelClean.includes('low') || congLevelClean.includes('quiet') || congLevelClean.includes('낮음')) {
    crowdLevel = 'low';
    crowdKo = '여유';
    crowdEn = 'Low';
    crowdBonus = 8;
  }

  const crowdEv: CrowdEvidence = {
    level: crowdLevel,
    levelTextKo: crowdKo,
    levelTextEn: crowdEn,
    highCrowdDates: holidayEvList.map(h => h.date),
    reasons: holidayEvList.length > 0 ? ['공휴일 및 연휴 영향'] : ['시즌별 주 관광 지구 인파'],
    confidence: 'high'
  };

  // 5. Compute Weighted Subscores with Neutral Baseline 70 (Section 3, 5, 9, 10, 11)
  
  // Component 1: Weather Comfort (Weight 30%)
  let weatherComfortBase = 70;
  if (avgTemp >= 18 && avgTemp <= 25) weatherComfortBase += 10;
  else if (avgTemp >= 15 && avgTemp <= 28) weatherComfortBase += 5;
  else if (avgTemp >= 10 && avgTemp < 15) weatherComfortBase += 0;
  else if (avgTemp >= 5 && avgTemp < 10) weatherComfortBase -= 5;
  else if (avgTemp >= 0 && avgTemp < 5) weatherComfortBase -= 10;
  else if (avgTemp < 0) weatherComfortBase -= 15;

  const weatherComfort = Math.max(10, Math.min(100, weatherComfortBase - heatPenalty - rainPenalty));

  // Component 2: Crowd & Holiday Impact (Weight 15%)
  const crowdAndHolidayImpact = Math.max(10, Math.min(100, 70 + crowdBonus - crowdPenalty - holidayPenalty));

  // Component 3: Local Experience & Festivals (Weight 20%) - Section 9 (Bonus capped at +10)
  let localExperience = 70; // Neutral baseline when no major events
  if (eventEvList.length > 0) {
    const eventBonus = Math.min(10, eventEvList.length * 4); // Max +10 bonus
    localExperience = Math.min(100, 70 + eventBonus);
  }

  // Component 4: Itinerary Practicality & Outdoor Suitability (Weight 20%)
  let itineraryPracticality = 70;
  if (outdoorSuitability === 'excellent') itineraryPracticality = 82;
  else if (outdoorSuitability === 'good') itineraryPracticality = 75;
  else if (outdoorSuitability === 'fair') itineraryPracticality = 65;
  else if (outdoorSuitability === 'poor') itineraryPracticality = 52;

  // Component 5: Operational Stability & Safety/Disruption Risks (Weight 15%)
  let operationalStability = 80;
  if (weatherData?.isErrorFallback) operationalStability -= 10;
  if (criticalRisks.length > 0) operationalStability -= 25;

  // Combine into SubScores object with legacy getters
  const subScores: SubScores = {
    weatherComfort,
    crowdAndHolidayImpact,
    localExperience,
    itineraryPracticality,
    operationalStability,
    // Legacy getters
    weather: weatherComfort,
    events: localExperience,
    crowd: crowdAndHolidayImpact,
    holidayImpact: crowdAndHolidayImpact,
    outdoorSuitability: itineraryPracticality
  };

  // 6. Missing Data Weight Re-normalization (Section 8)
  const missingDataFields: string[] = [];
  const baseWeights: Record<string, number> = {
    weatherComfort: 0.30,
    crowdAndHolidayImpact: 0.15,
    localExperience: 0.20,
    itineraryPracticality: 0.20,
    operationalStability: 0.15
  };

  let totalWeightSum = 0;
  for (const [key, weight] of Object.entries(baseWeights)) {
    totalWeightSum += weight;
  }

  const normalizedWeights: Record<string, number> = {};
  for (const [key, weight] of Object.entries(baseWeights)) {
    normalizedWeights[key] = Number((weight / totalWeightSum).toFixed(4));
  }

  let rawTotalScore = Math.round(
    weatherComfort * normalizedWeights.weatherComfort +
    crowdAndHolidayImpact * normalizedWeights.crowdAndHolidayImpact +
    localExperience * normalizedWeights.localExperience +
    itineraryPracticality * normalizedWeights.itineraryPracticality +
    operationalStability * normalizedWeights.operationalStability
  );

  let totalScore = Math.max(10, Math.min(100, rawTotalScore));
  const isCriticalRiskOverride = criticalRisks.length > 0;

  if (isCriticalRiskOverride && totalScore > 54) {
    totalScore = 54; // Cap at caution grade maximum (40~54)
  }

  const ratingConfig = getRatingConfig(totalScore, isCriticalRiskOverride);

  const recommendationIndex: RecommendationIndex = {
    totalScore,
    grade: ratingConfig.key,
    gradeTextKo: ratingConfig.labelKo,
    gradeTextEn: ratingConfig.labelEn,
    ratingConfig,
    subScores,
    criticalRisks
  };

  // 7. Positive & Negative Contributors (Strict Rule 7: Positive scoreImpact > 0, Negative < 0)
  const positiveContributors: ScoreContributor[] = [];
  const negativeContributors: ScoreContributor[] = [];

  if (eventEvList.length > 0) {
    positiveContributors.push({
      id: 'contrib-events',
      type: 'events',
      labelKo: `여행 기간과 겹치는 현지 행사 ${eventEvList.length}개 개최`,
      labelEn: `${eventEvList.length} overlapping local event(s) scheduled`,
      scoreImpact: Math.min(10, eventEvList.length * 4),
      evidenceIds: eventEvList.map(e => e.id)
    });
  }

  if (itineraryPracticality >= 75) {
    positiveContributors.push({
      id: 'contrib-outdoor',
      type: 'outdoorSuitability',
      labelKo: '야외활동과 도보 탐방에 적합한 기온 및 날씨 조건',
      labelEn: 'Favorable weather and temperature for outdoor activities',
      scoreImpact: 8,
      evidenceIds: ['weather-env-01']
    });
  } else if (heatPenalty > 0 || rainPenalty > 0) {
    negativeContributors.push({
      id: 'contrib-weather-risk',
      type: 'weather',
      labelKo: heatRisk === 'high' ? '높은 기온 및 폭염 주의' : (rainRisk === 'high' ? '잦은 강수 우려' : '기상 조건 주의'),
      labelEn: heatRisk === 'high' ? 'Extreme heatwave caution' : (rainRisk === 'high' ? 'High precipitation risk' : 'Weather cautions'),
      scoreImpact: -(heatPenalty + rainPenalty),
      evidenceIds: ['weather-env-01']
    });
  }

  if (crowdLevel === 'low') {
    positiveContributors.push({
      id: 'contrib-crowd-quiet',
      type: 'crowd',
      labelKo: '쾌적하고 여유로운 현지 관광 환경',
      labelEn: 'Peaceful local atmosphere with low congestion',
      scoreImpact: 8,
      evidenceIds: ['crowd-env-01']
    });
  } else if (crowdLevel === 'high') {
    negativeContributors.push({
      id: 'contrib-crowd-high',
      type: 'crowd',
      labelKo: '주요 관광지 인파 밀집 및 높은 혼잡도',
      labelEn: 'High tourist congestion at key attractions',
      scoreImpact: -8,
      evidenceIds: ['crowd-env-01']
    });
  }

  if (verifiedHolidayClosures.length > 0) {
    negativeContributors.push({
      id: 'contrib-holiday',
      type: 'holidayImpact',
      labelKo: `국경일/공휴일 영향으로 일부 시설 운영시간 단축 또는 휴무`,
      labelEn: `Public holiday impact with possible reduced business hours`,
      scoreImpact: -holidayPenalty,
      evidenceIds: verifiedHolidayClosures.map(h => h.id)
    });
  }

  // 8. Data completeness & confidence
  let dataCompleteness = 100;
  if (weatherData?.isErrorFallback) dataCompleteness -= 25;
  if (!events || events.length === 0) dataCompleteness -= 10;
  if (!holidays) dataCompleteness -= 5;
  dataCompleteness = Math.max(40, dataCompleteness);

  const confidence: 'high' | 'medium' | 'low' = dataCompleteness >= 85 ? 'high' : (dataCompleteness >= 65 ? 'medium' : 'low');

  // Print Structured recommendation trace log (Section 2 & 18)
  const trace = {
    destination: `${city}, ${country}`,
    countryCode,
    timezoneId,
    startDate,
    endDate,
    durationDays,
    durationNights,
    initialBaseScore: 70,
    weatherScore: weatherComfort,
    itineraryPracticalityScore: itineraryPracticality,
    crowdAndHolidayImpactScore: crowdAndHolidayImpact,
    localExperienceScore: localExperience,
    operationalStabilityScore: operationalStability,
    heatPenalty,
    rainPenalty,
    crowdPenalty,
    holidayPenalty,
    positiveContributions: positiveContributors,
    negativeContributions: negativeContributors,
    missingDataFields,
    normalizedWeights,
    criticalRiskOverrides: criticalRisks.map(r => r.labelKo),
    rawTotalScore,
    finalScore: totalScore,
    finalGrade: ratingConfig.key,
    confidence
  };

  console.log('[RECOMMENDATION_SCORE_TRACE]\n' + JSON.stringify(trace, null, 2));

  return {
    destination: {
      city,
      country,
      countryCode,
      timezoneId,
      formattedAddress,
      latitude,
      longitude
    },
    trip: {
      startDate,
      endDate,
      durationDays,
      durationNights
    },
    recommendationIndex,
    weatherEvidence: weatherEv,
    holidayEvidence: holidayEvList,
    eventEvidence: eventEvList,
    crowdEvidence: crowdEv,
    criticalRisks,
    dataCompleteness,
    confidence,
    positiveContributors,
    negativeContributors
  };
}

/**
 * Generates rule-based report strictly tied to rating config and evidence bundle
 */
export function generateRuleBasedReport(bundle: AnalysisEvidenceBundle): TravelSuitabilityReport {
  const { destination, trip, recommendationIndex, weatherEvidence, holidayEvidence, eventEvidence, crowdEvidence, positiveContributors, negativeContributors, criticalRisks, dataCompleteness } = bundle;
  const { totalScore, ratingConfig } = recommendationIndex;

  const cityName = destination.city;
  const primaryNegativeFactor = criticalRisks[0]?.labelKo || negativeContributors[0]?.labelKo || '일부 기상/혼잡 제약';
  const primaryNegativeFactorEn = criticalRisks[0]?.labelEn || negativeContributors[0]?.labelEn || 'certain weather or crowd constraints';

  let conclusionKo = '';
  let conclusionEn = '';

  const suitabilityLevel = getTravelSuitabilityLevel(totalScore);
  const suitabilityResult = normalizeTravelSuitability({
    internalScore: totalScore,
    confidence: bundle.confidence,
    subScores: recommendationIndex.subScores,
    positiveFactors: positiveContributors.map(p => ({
      id: p.id,
      type: p.type,
      titleKo: p.labelKo,
      titleEn: p.labelEn,
      descriptionKo: p.labelKo,
      descriptionEn: p.labelEn,
      evidenceIds: p.evidenceIds || []
    })),
    cautionFactors: negativeContributors.map(n => ({
      id: n.id,
      type: n.type,
      titleKo: n.labelKo,
      titleEn: n.labelEn,
      descriptionKo: n.labelKo,
      descriptionEn: n.labelEn,
      evidenceIds: n.evidenceIds || []
    })),
    criticalWarnings: criticalRisks.map((r, idx) => ({
      id: `crit-${idx}`,
      type: r.type,
      severity: 'critical',
      titleKo: r.labelKo,
      titleEn: r.labelEn,
      descriptionKo: r.labelKo,
      descriptionEn: r.labelEn,
      evidenceIds: []
    }))
  });

  // Rule 3 & 5: Grade & Level-specific deterministic conclusion
  switch (suitabilityLevel) {
    case 'excellent':
      conclusionKo = `${cityName} 여행은 전반적인 여행 조건이 매우 좋고, 큰 일정 제약 없이 여행하기 좋은 시기입니다.`;
      conclusionEn = `Travel to ${cityName} has excellent conditions overall with no major constraints.`;
      break;
    case 'good':
      conclusionKo = `${cityName} 여행은 일부 변수가 있지만 전반적으로 여행하기 좋은 시기입니다.`;
      conclusionEn = `Travel to ${cityName} is a good time for travel overall despite minor variable factors.`;
      break;
    case 'prepare':
      conclusionKo = `${cityName} 여행은 가능하지만 ${primaryNegativeFactor} 등 일부 준비와 일정 조정이 필요한 시기입니다.${criticalRisks.length > 0 ? ' (공식 기상 경보/위험 요소로 사전 대비가 필요합니다.)' : ''}`;
      conclusionEn = `Travel to ${cityName} is feasible, but preparation and schedule adjustments are advised due to ${primaryNegativeFactorEn}.`;
      break;
    case 'compare_dates':
      conclusionKo = `${cityName} 여행은 ${primaryNegativeFactor} 등 여행기간 대부분에 불편이나 제약이 예상돼 다른 날짜와 함께 비교해 보는 것이 권장됩니다.`;
      conclusionEn = `Travel to ${cityName} involves noticeable constraints like ${primaryNegativeFactorEn}; comparing alternative dates is recommended.`;
      break;
  }

  // Rule 7: Positive Highlights Filter (Only scoreImpact > 0)
  const realPositiveContributors = positiveContributors.filter(p => p.scoreImpact > 0);
  let positiveHighlights: ReportHighlightPoint[] = realPositiveContributors.map(p => ({
    id: p.id,
    text: p.labelKo,
    textEn: p.labelEn,
    evidenceIds: p.evidenceIds
  }));

  if (positiveHighlights.length === 0) {
    positiveHighlights = [{
      id: 'pos-limited',
      text: '이번 기간에는 추천 지수를 크게 높이는 요인이 제한적입니다.',
      textEn: 'There are limited major positive score boosters for this selected travel period.',
      evidenceIds: ['trip-duration-01']
    }];
  }

  // Caution Points
  let cautionPoints: ReportHighlightPoint[] = negativeContributors.map(n => ({
    id: n.id,
    text: n.labelKo,
    textEn: n.labelEn,
    evidenceIds: n.evidenceIds
  }));

  if (weatherEvidence.dataType === 'mixed' && weatherEvidence.climateRange) {
    cautionPoints.push({
      id: 'caution-climate-range',
      text: `${weatherEvidence.climateRange.startDate} 이후는 실제 예보 범위 밖이므로 평년 기후 데이터를 참고해야 합니다.`,
      textEn: `Dates after ${weatherEvidence.climateRange.startDate} rely on historical climate averages.`,
      evidenceIds: ['weather-env-01']
    });
  }

  if (dataCompleteness < 80) {
    cautionPoints.push({
      id: 'caution-sparse-data',
      text: '현재 확인 가능한 현지 데이터가 충분하지 않아 추천 지수의 일부 항목을 제한적으로 계산했어요.',
      textEn: 'Certain metrics were calculated with limited data availability.',
      evidenceIds: ['data-completeness-01']
    });
  }

  if (cautionPoints.length === 0) {
    cautionPoints.push({
      id: 'caution-default',
      text: '주요 관광지 인파 밀집 및 당일 운영시간 사전 확인 권장',
      textEn: 'Check daily operating hours for major attractions.',
      evidenceIds: ['crowd-env-01']
    });
  }

  // Actionable Strategy
  let strategyKo = '';
  let strategyEn = '';

  if (criticalRisks.some(r => r.type === 'extreme_heat') || weatherEvidence.heatRisk === 'high') {
    strategyKo = `숙소와 가까운 지역을 날짜별로 묶고, 12시부터 17시까지는 장거리 도보 이동을 피하며 실내 관광지와 휴식 시간을 충분히 확보하는 일정 구성을 권장합니다.`;
    strategyEn = `Group activities close to accommodation and avoid long midday walks between 12 PM and 5 PM, reserving that time for indoor sights.`;
  } else if (eventEvidence.length > 0 && holidayEvidence.length > 0) {
    strategyKo = `대형 행사 장소는 오전에 우선 방문하고, 공휴일 당일에는 미술관 및 식당의 사전 예약을 진행하세요.`;
    strategyEn = `Visit major event venues in the morning, and book museums and dining spots in advance for public holidays.`;
  } else if (eventEvidence.length > 0) {
    strategyKo = `주요 행사 진행 장소 주변의 혼잡을 고려하여 오전 시간대 방문 일정을 추천합니다.`;
    strategyEn = `Plan morning visits around major event venues to avoid peak afternoon crowds.`;
  } else if (holidayEvidence.length > 0) {
    strategyKo = `공휴일 당일 현지 명소의 휴무 및 변경된 운영시간을 사전에 확인하세요.`;
    strategyEn = `Check public holiday business hours and closures for local attractions in advance.`;
  } else {
    strategyKo = `동선 효율성을 높이기 위해 주변 명소와 맛집을 권역별로 그룹화하여 일정을 계획하세요.`;
    strategyEn = `Group nearby attractions and restaurants by neighborhood to optimize travel efficiency.`;
  }

  return {
    totalScore,
    grade: ratingConfig.key,
    gradeTextKo: ratingConfig.labelKo,
    gradeTextEn: ratingConfig.labelEn,
    ratingConfig,
    overallConclusion: conclusionKo,
    overallConclusionEn: conclusionEn,
    positiveHighlights,
    cautionPoints,
    actionableStrategy: strategyKo,
    actionableStrategyEn: strategyEn,
    footerMetadata: {
      analyzedAt: new Date().toISOString(),
      dataTypesUsed: [
        weatherEvidence.dataType === 'mixed' ? 'short_term_forecast + climate_average' : weatherEvidence.dataType,
        'public_holidays',
        'verified_events'
      ],
      verifiedSourcesCount: (holidayEvidence.length > 0 ? 1 : 0) + (eventEvidence.length > 0 ? 1 : 0) + 1,
      forecastDateRange: weatherEvidence.forecastRange ? `${weatherEvidence.forecastRange.startDate} ~ ${weatherEvidence.forecastRange.endDate}` : undefined,
      climateDateRange: weatherEvidence.climateRange ? `${weatherEvidence.climateRange.startDate} ~ ${weatherEvidence.climateRange.endDate}` : undefined,
      confidence: bundle.confidence,
      dataCompleteness: bundle.dataCompleteness
    },
    evidenceBundle: bundle,
    suitabilityResult
  };
}

/**
 * Validates report against single-source rating config and banned phrases
 */
export function validateRecommendationReport(
  report: TravelSuitabilityReport,
  ratingConfig: RatingConfigItem
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check 1: Grade alignment
  if (report.grade !== ratingConfig.key) {
    errors.push(`Grade mismatch: got ${report.grade}, expected ${ratingConfig.key}`);
  }

  // Check 2: Total score alignment
  if (report.totalScore !== report.evidenceBundle.recommendationIndex.totalScore) {
    errors.push(`Score mismatch: report totalScore ${report.totalScore} vs index totalScore ${report.evidenceBundle.recommendationIndex.totalScore}`);
  }

  // Check 3: Banned phrases check
  const bannedPhrases = BANNED_PHRASES_PER_GRADE[ratingConfig.key] || [];
  const textBlob = [
    report.overallConclusion,
    ...(report.positiveHighlights || []).map(p => p.text),
    ...(report.cautionPoints || []).map(c => c.text),
    report.actionableStrategy
  ].join(' ');

  for (const phrase of bannedPhrases) {
    if (textBlob.includes(phrase)) {
      errors.push(`Banned phrase "${phrase}" found in report for grade ${ratingConfig.key}`);
    }
  }

  // Check 4: Positive phrases in caution/negative grade
  if (['caution', 'reconsider', 'notRecommended'].includes(ratingConfig.key)) {
    if (textBlob.includes('여행하기 좋은') || textBlob.includes('추천하는 시기') || textBlob.includes('매우 추천') || textBlob.includes('완벽한 시기')) {
      errors.push(`Contradictory positive phrase found in caution/negative report for grade ${ratingConfig.key}`);
    }
  }

  // Check 5: Evidence ID Grounding (Requirement 9)
  const validEvidenceIds = new Set([
    ...report.evidenceBundle.positiveContributors.map(c => c.id),
    ...report.evidenceBundle.negativeContributors.map(c => c.id)
  ]);

  for (const highlight of (report.positiveHighlights || [])) {
    for (const eid of (highlight.evidenceIds || [])) {
      if (!validEvidenceIds.has(eid)) {
        errors.push(`Ungrounded evidence ID "${eid}" found in positiveHighlights.`);
      }
    }
  }

  for (const caution of (report.cautionPoints || [])) {
    for (const eid of (caution.evidenceIds || [])) {
      if (!validEvidenceIds.has(eid)) {
        errors.push(`Ungrounded evidence ID "${eid}" found in cautionPoints.`);
      }
    }
  }

  // Check 6: Semantic Fact Validation (Requirement - Factual Grounding)
  // Instead of using keyword blocklists, we validate that the AI's self-reported structured factual claims match the evidence.
  const claimedFindings = (report as any).claimedFindings || [];
  
  if (claimedFindings.includes("HIGH_CROWD")) {
    if (report.evidenceBundle.crowdEvidence?.level !== 'high' && report.evidenceBundle.crowdEvidence?.level !== 'very_high') {
      errors.push(`AI claimed HIGH_CROWD but it is not supported by evidence.`);
    }
  }
  if (claimedFindings.includes("HOLIDAY")) {
    if (!report.evidenceBundle.holidayEvidence || report.evidenceBundle.holidayEvidence.length === 0) {
      errors.push(`AI claimed HOLIDAY but it is not supported by evidence.`);
    }
  }
  if (claimedFindings.includes("EVENT")) {
    if (!report.evidenceBundle.eventEvidence || report.evidenceBundle.eventEvidence.length === 0) {
      errors.push(`AI claimed EVENT but it is not supported by evidence.`);
    }
  }
  if (claimedFindings.includes("SEVERE_WEATHER")) {
    const hasSevereWeather = report.evidenceBundle.criticalRisks.some(r => r.type === 'severe_weather' || r.type === 'severe_rain' || r.type === 'transport_disruption');
    const isRainRiskHigh = report.evidenceBundle.weatherEvidence?.rainRisk === 'high';
    if (!hasSevereWeather && !isRainRiskHigh) {
      errors.push(`AI claimed SEVERE_WEATHER but it is not supported by evidence.`);
    }
  }
  if (claimedFindings.includes("HEATWAVE")) {
    if (report.evidenceBundle.weatherEvidence?.heatRisk !== 'high') {
      errors.push(`AI claimed HEATWAVE but it is not supported by evidence.`);
    }
  }

  // No Exact Numeric Weather Metrics (Requirement - No unverified numbers)
  const aiText = (report.overallConclusion + " " + (report.actionableStrategy || "")).toLowerCase();
  if (/\d+도|\d+°c|\d+%/.test(aiText)) {
    errors.push(`AI output contains forbidden exact numeric weather metrics (e.g. degrees, percentages). Must use qualitative descriptions.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * AI-driven report generator via Gemini model with strict validation fallback
 */
export async function generateAIReportWithGemini(
  bundle: AnalysisEvidenceBundle,
  aiClient: any,
  telemetry?: { onAbort?: () => void; onTimeout?: () => void; onLateResponse?: () => void; }
): Promise<TravelSuitabilityReport> {
  const fallbackReport = generateRuleBasedReport(bundle);
  if (!aiClient) return fallbackReport;

  const { ratingConfig } = bundle.recommendationIndex;
  const bannedList = BANNED_PHRASES_PER_GRADE[ratingConfig.key] || [];

  const prompt = `You are a strict data-grounded travel evaluator. Generate a "Travel Suitability Report" for ${bundle.destination.city}, ${bundle.destination.country}.

CRITICAL SINGLE SOURCE OF TRUTH CONSTRAINTS:
- Recommendation Score: ${bundle.recommendationIndex.totalScore}
- Established Grade Key: "${ratingConfig.key}"
- Grade Label (Ko): "${ratingConfig.labelKo}"
- Tone: "${ratingConfig.tone}"
- MANDATORY Primary Conclusion (Ko): "${fallbackReport.overallConclusion}"

STRICT GROUNDING & AI NON-FABRICATION RULE (Requirement 8):
- You MUST NOT invent, assume, or hallucinate any weather, climates, holidays, festivals, or local events that are not explicitly documented inside the "AnalysisEvidenceBundle JSON" below.
- Do NOT extrapolate beyond the given fact list. If the facts are missing (e.g., empty festival items due to API failure or degraded state), describe the report based on what IS present, and do NOT speculate on typical seasonal occurrences or generate non-factual filler.
- Your entire evaluation, positive highlights, and caution points MUST map 1:1 to verified evidence items in the "AnalysisEvidenceBundle JSON".

STRICT GUIDELINES:
1. DO NOT change or re-evaluate the score or grade under any circumstances.
2. DO NOT contradict the grade tone "${ratingConfig.tone}".
3. FORBIDDEN PHRASES for grade "${ratingConfig.key}": ${JSON.stringify(bannedList)}. DO NOT use any of these words or phrases!
4. If grade is "caution", "reconsider", or "notRecommended", do NOT claim it is a good or recommended time to visit.
5. Do NOT invent fake positive highlights if there are no positive score contributors.
6. Korean Particle Rule: Do NOT output broken placeholders like "은(는)".
7. DO NOT use exact numbers for temperatures, humidity, or crowd sizes in your text (e.g., do not say "35도", "습도 80%"). Use qualitative descriptive words instead (e.g., "매우 무더운 날씨", "습도가 높은").
8. You MUST map your generated text to the underlying factual categories. In 'claimedFindings', include ANY of these ENUM keys if you mention their related concepts in your text: ["HIGH_CROWD", "HOLIDAY", "EVENT", "SEVERE_WEATHER", "HEATWAVE"]. If you do not mention them, omit them.

AnalysisEvidenceBundle JSON:
${JSON.stringify(bundle, null, 2)}`;

  try {
    const responseSchema = {
      type: "OBJECT",
      properties: {
        overallConclusion: { type: "STRING" },
        overallConclusionEn: { type: "STRING" },
        actionableStrategy: { type: "STRING" },
        actionableStrategyEn: { type: "STRING" },
        claimedFindings: { 
          type: "ARRAY", 
          items: { 
            type: "STRING",
            enum: ["HIGH_CROWD", "HOLIDAY", "EVENT", "SEVERE_WEATHER", "HEATWAVE"]
          } 
        }
      },
      required: [
        "overallConclusion",
        "overallConclusionEn",
        "actionableStrategy",
        "actionableStrategyEn",
        "claimedFindings"
      ]
    };

    const GEMINI_TIMEOUT_MS = 2000;
    const controller = new AbortController();
    let isTimeout = false;
    let isAborted = false;
    let isResolved = false;

    let response: any = null;
    try {
      const geminiPromise = aiClient.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          abortSignal: controller.signal
        }
      }).then((res: any) => {
        if (isTimeout) {
          if (telemetry?.onLateResponse) telemetry.onLateResponse();
        }
        return res;
      }).catch((err: any) => {
        if (!isTimeout) {
           throw err;
        }
        return null;
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          isTimeout = true;
          if (telemetry?.onTimeout) telemetry.onTimeout();
          // We do NOT abort the controller here if we want to track late responses!
          // Wait, user says "abortSignal은 Trippo client/SDK 측 대기를 취소하는 기능으로 취급합니다. 
          // Google service 내부 generation까지 반드시 종료된다고 가정하지 않습니다.
          // Timeout 이후: Trippo response는 Rule-based fallback으로 즉시 전환, 늦은 Gemini response는 무시"
          reject(new Error('TIMEOUT'));
        }, 2000);
      });

      response = await Promise.race([geminiPromise, timeoutPromise]);
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        // Handled by timeoutPromise
      } else if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort')) {
        isAborted = true;
        if (telemetry?.onAbort) telemetry.onAbort();
      } else if (err.message?.toLowerCase().includes('timeout') || err.name === 'TimeoutError') {
        if (!isTimeout) {
          isTimeout = true;
          if (telemetry?.onTimeout) telemetry.onTimeout();
        }
      } else {
        console.warn('[Report Engine] AI SDK error:', err.message);
      }
      return fallbackReport;
    } finally {
      isResolved = true;
    }


    const text = response.text;
    if (!text) return fallbackReport;

    const parsed = JSON.parse(text.trim());

    const candidateReport: TravelSuitabilityReport = {
      totalScore: bundle.recommendationIndex.totalScore,
      grade: ratingConfig.key,
      gradeTextKo: ratingConfig.labelKo,
      gradeTextEn: ratingConfig.labelEn,
      ratingConfig,
      overallConclusion: parsed.overallConclusion || fallbackReport.overallConclusion,
      overallConclusionEn: parsed.overallConclusionEn || fallbackReport.overallConclusionEn,
      positiveHighlights: fallbackReport.positiveHighlights,
      cautionPoints: fallbackReport.cautionPoints,
      actionableStrategy: parsed.actionableStrategy || fallbackReport.actionableStrategy,
      actionableStrategyEn: parsed.actionableStrategyEn || fallbackReport.actionableStrategyEn,
      footerMetadata: fallbackReport.footerMetadata,
      evidenceBundle: bundle,
      suitabilityResult: fallbackReport.suitabilityResult
    };

    const validation = validateRecommendationReport(candidateReport, ratingConfig);
    if (!validation.isValid) {
      console.warn(`[Report Engine Validator] AI report failed validation (${validation.errors.join("; ")}). Falling back to rule-based report.`);
      return fallbackReport;
    }

    return candidateReport;

  } catch (err: any) {
    console.warn('[Report Engine] AI report generation failed, using rule-based fallback:', err.message);
    return fallbackReport;
  }
}
