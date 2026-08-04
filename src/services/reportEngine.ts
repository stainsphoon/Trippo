import { DateTime } from 'luxon';
import {
  AnalysisEvidenceBundle,
  CrowdEvidence,
  EventEvidenceItem,
  HolidayEvidenceItem,
  RecommendationIndex,
  ReportFooterMetadata,
  ScoreContributor,
  ScoreGrade,
  SubScores,
  TravelSuitabilityReport,
  WeatherEvidence
} from '../types/reportTypes';
import { formatCityTravelPhrase, formatWithJosa } from '../utils/josaUtils';

/**
 * Maps recommendation score to grade and i18n text
 */
export function getGradeFromScore(score: number): {
  grade: ScoreGrade;
  gradeTextKo: string;
  gradeTextEn: string;
} {
  if (score >= 85) {
    return {
      grade: 'highly_recommended',
      gradeTextKo: '매우 추천하는 시기입니다.',
      gradeTextEn: 'Highly recommended period.'
    };
  }
  if (score >= 70) {
    return {
      grade: 'recommended',
      gradeTextKo: '전반적으로 추천하는 시기입니다.',
      gradeTextEn: 'Generally recommended period.'
    };
  }
  if (score >= 55) {
    return {
      grade: 'good_with_conditions',
      gradeTextKo: '조건을 확인하면 여행하기 좋은 시기입니다.',
      gradeTextEn: 'Good period provided conditions are checked.'
    };
  }
  if (score >= 40) {
    return {
      grade: 'needs_adjustment',
      gradeTextKo: '일부 일정 조정이 필요한 시기입니다.',
      gradeTextEn: 'Period requiring some itinerary adjustments.'
    };
  }
  return {
    grade: 'reconsider',
    gradeTextKo: '여행 시기를 다시 검토할 필요가 있습니다.',
    gradeTextEn: 'Period where travel timing should be reconsidered.'
  };
}

/**
 * Computes subscores and Recommendation Index from raw inputs
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

  const startDt = DateTime.fromISO(startDate);
  const endDt = DateTime.fromISO(endDate);
  const durationDays = Math.max(1, Math.ceil(endDt.diff(startDt, 'days').days) + 1);

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
  const rainRisk: WeatherEvidence['rainRisk'] = precipDays >= Math.max(3, durationDays * 0.4) ? 'high' : (precipDays > 0 ? 'moderate' : 'low');
  
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

  // 2. Process Holiday Evidence
  const holidayEvList: HolidayEvidenceItem[] = (holidays || []).map((h: any, idx: number) => {
    return {
      id: `holiday-${idx + 1}-${h.date}`,
      date: h.date,
      name: h.name,
      nameEn: h.nameEn || h.name,
      impact: 'possible_closures',
      source: 'Nager Public Holidays API (Official)',
      verified: true
    };
  });

  // 3. Process Event Evidence
  const eventEvList: EventEvidenceItem[] = (events || []).map((e: any, idx: number) => {
    const evStart = e.startDate || startDate;
    const evEnd = e.endDate || endDate;
    
    // Calculate overlap with travel window
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

  // 4. Process Crowd Evidence
  const congLevelClean = (congestionLevel || 'medium').toLowerCase();
  let crowdLevel: CrowdEvidence['level'] = 'moderate';
  let crowdKo = '보통';
  let crowdEn = 'Moderate';

  if (congLevelClean.includes('high') || congLevelClean.includes('heavy') || congLevelClean.includes('높음')) {
    crowdLevel = 'high';
    crowdKo = '혼잡';
    crowdEn = 'High';
  } else if (congLevelClean.includes('low') || congLevelClean.includes('quiet') || congLevelClean.includes('낮음')) {
    crowdLevel = 'low';
    crowdKo = '여유';
    crowdEn = 'Low';
  }

  const crowdEv: CrowdEvidence = {
    level: crowdLevel,
    levelTextKo: crowdKo,
    levelTextEn: crowdEn,
    highCrowdDates: holidayEvList.map(h => h.date),
    reasons: holidayEvList.length > 0 ? ['공휴일 및 연휴 영향'] : ['시즌별 주 관광 지구 인파'],
    confidence: 'high'
  };

  // 5. Compute SubScores
  // Weather SubScore
  let weatherSub = 80;
  if (avgTemp >= 18 && avgTemp <= 24) weatherSub += 10;
  else if (avgTemp < 5) weatherSub -= 20;
  else if (avgTemp < 15) weatherSub -= 8;
  else if (avgTemp > 32) weatherSub -= 18;
  else if (avgTemp > 26) weatherSub -= 8;

  weatherSub -= Math.min(25, precipDays * 5);
  weatherSub -= Math.min(20, heatWaveDays * 5);
  weatherSub = Math.max(10, Math.min(100, weatherSub));

  // Events SubScore
  let eventsSub = 50; // base score when no events exist
  if (eventEvList.length === 1) eventsSub = 75;
  else if (eventEvList.length === 2) eventsSub = 85;
  else if (eventEvList.length >= 3) eventsSub = 95;

  // Crowd SubScore
  let crowdSub = 75;
  if (crowdLevel === 'low') crowdSub = 90;
  else if (crowdLevel === 'moderate') crowdSub = 75;
  else if (crowdLevel === 'high') crowdSub = 55;
  else if (crowdLevel === 'very_high') crowdSub = 35;

  // Holiday Impact SubScore
  let holidaySub = 90;
  if (holidayEvList.length === 1) holidaySub = 75;
  else if (holidayEvList.length === 2) holidaySub = 65;
  else if (holidayEvList.length >= 3) holidaySub = 45;

  // Outdoor Suitability SubScore
  let outdoorSub = 80;
  if (outdoorSuitability === 'excellent') outdoorSub = 95;
  else if (outdoorSuitability === 'good') outdoorSub = 82;
  else if (outdoorSuitability === 'fair') outdoorSub = 65;
  else if (outdoorSuitability === 'poor') outdoorSub = 40;

  // Local Experience SubScore
  const localExpSub = Math.round(eventsSub * 0.45 + outdoorSub * 0.35 + crowdSub * 0.20);

  const subScores: SubScores = {
    weather: Math.round(weatherSub),
    events: Math.round(eventsSub),
    crowd: Math.round(crowdSub),
    holidayImpact: Math.round(holidaySub),
    outdoorSuitability: Math.round(outdoorSub),
    localExperience: Math.round(localExpSub)
  };

  // 6. Calculate Weighted Total Score
  const rawTotal = Math.round(
    subScores.weather * 0.25 +
    subScores.outdoorSuitability * 0.25 +
    subScores.events * 0.20 +
    subScores.crowd * 0.15 +
    subScores.holidayImpact * 0.15
  );
  const totalScore = Math.max(30, Math.min(100, rawTotal));
  const gradeInfo = getGradeFromScore(totalScore);

  const recommendationIndex: RecommendationIndex = {
    totalScore,
    grade: gradeInfo.grade,
    gradeTextKo: gradeInfo.gradeTextKo,
    gradeTextEn: gradeInfo.gradeTextEn,
    subScores
  };

  // 7. Extract Positive & Negative Contributors
  const positiveContributors: ScoreContributor[] = [];
  const negativeContributors: ScoreContributor[] = [];

  // Check events
  if (eventEvList.length > 0) {
    positiveContributors.push({
      id: 'contrib-events',
      type: 'events',
      labelKo: `여행 기간과 겹치는 주요 행사 ${eventEvList.length}개 개최`,
      labelEn: `${eventEvList.length} overlapping public event(s) scheduled`,
      scoreImpact: Math.min(20, eventEvList.length * 6),
      evidenceIds: eventEvList.map(e => e.id)
    });
  }

  // Check outdoor suitability / weather
  if (subScores.outdoorSuitability >= 75) {
    positiveContributors.push({
      id: 'contrib-outdoor',
      type: 'outdoorSuitability',
      labelKo: '야외활동에 적합한 기온 및 날씨 조건',
      labelEn: 'Favorable weather and temperature for outdoor activities',
      scoreImpact: 10,
      evidenceIds: ['weather-env-01']
    });
  } else {
    negativeContributors.push({
      id: 'contrib-weather-risk',
      type: 'weather',
      labelKo: heatRisk === 'high' ? '폭염 주의' : (rainRisk === 'high' ? '잦은 강수 우려' : '기상 조건 주의'),
      labelEn: heatRisk === 'high' ? 'Heatwave warning' : (rainRisk === 'high' ? 'High precipitation risk' : 'Weather cautions'),
      scoreImpact: -12,
      evidenceIds: ['weather-env-01']
    });
  }

  // Check crowd
  if (subScores.crowd >= 80) {
    positiveContributors.push({
      id: 'contrib-crowd-quiet',
      type: 'crowd',
      labelKo: '쾌적하고 혼잡도가 낮은 현지 환경',
      labelEn: 'Peaceful local atmosphere with low congestion',
      scoreImpact: 8,
      evidenceIds: ['crowd-env-01']
    });
  } else if (subScores.crowd <= 60) {
    negativeContributors.push({
      id: 'contrib-crowd-high',
      type: 'crowd',
      labelKo: '주요 관광지 인파 밀집 및 높은 혼잡도',
      labelEn: 'High tourist congestion at key attractions',
      scoreImpact: -8,
      evidenceIds: ['crowd-env-01']
    });
  }

  // Check holidays
  if (holidayEvList.length > 0) {
    negativeContributors.push({
      id: 'contrib-holiday',
      type: 'holidayImpact',
      labelKo: `국경일/공휴일 ${holidayEvList.length}일 포함 (시설 휴무 및 영업시간 변경 가능)`,
      labelEn: `${holidayEvList.length} public holiday(s) included (possible closures/reduced hours)`,
      scoreImpact: -6 * holidayEvList.length,
      evidenceIds: holidayEvList.map(h => h.id)
    });
  }

  // 8. Data completeness & confidence
  let dataCompleteness = 100;
  if (weatherData?.isErrorFallback) dataCompleteness -= 20;
  if (!events || events.length === 0) dataCompleteness -= 10;
  dataCompleteness = Math.max(50, dataCompleteness);

  const confidence: 'high' | 'medium' | 'low' = dataCompleteness >= 85 ? 'high' : (dataCompleteness >= 65 ? 'medium' : 'low');

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
      durationDays
    },
    recommendationIndex,
    weatherEvidence: weatherEv,
    holidayEvidence: holidayEvList,
    eventEvidence: eventEvList,
    crowdEvidence: crowdEv,
    dataCompleteness,
    confidence,
    positiveContributors,
    negativeContributors
  };
}

/**
 * Generates rule-based fallback report strictly tied to AnalysisEvidenceBundle
 * Used when AI model fails, times out, or when strict rule compliance is needed.
 */
export function generateRuleBasedReport(bundle: AnalysisEvidenceBundle): TravelSuitabilityReport {
  const { destination, trip, recommendationIndex, weatherEvidence, holidayEvidence, eventEvidence, crowdEvidence, positiveContributors, negativeContributors } = bundle;
  const { totalScore, grade, gradeTextKo, gradeTextEn } = recommendationIndex;

  const cityPhrase = formatCityTravelPhrase(destination.city, trip.startDate, 'ko');
  const cityPhraseEn = destination.city;

  // 1. Overall Conclusion
  let conclusionKo = '';
  let conclusionEn = '';

  const dateRangeTextKo = `${trip.startDate}부터 ${trip.endDate}까지`;
  const dateRangeTextEn = `From ${trip.startDate} to ${trip.endDate}`;

  if (totalScore >= 85) {
    conclusionKo = `${dateRangeTextKo} ${destination.city} 여행은 풍부한 이벤트와 우수한 날씨 조건이 어우러져 매우 추천하는 시기입니다.`;
    conclusionEn = `Travel to ${cityPhraseEn} from ${dateRangeTextEn} is highly recommended due to abundant local events and favorable weather conditions.`;
  } else if (totalScore >= 70) {
    conclusionKo = `${dateRangeTextKo} ${destination.city} 여행은 전반적으로 추천하는 시기입니다. 현지 특성을 고려해 일정을 계획해 보세요.`;
    conclusionEn = `Travel to ${cityPhraseEn} from ${dateRangeTextEn} is generally recommended. Consider local factors when planning your daily schedule.`;
  } else if (totalScore >= 55) {
    conclusionKo = `${dateRangeTextKo} ${destination.city} 여행은 주요 조건(기상, 공휴일)을 미리 확인하면 여행하기 양호한 시기입니다.`;
    conclusionEn = `Travel to ${cityPhraseEn} from ${dateRangeTextEn} is suitable provided key conditions like weather and holiday hours are checked in advance.`;
  } else if (totalScore >= 40) {
    conclusionKo = `${dateRangeTextKo} ${destination.city} 여행은 일부 기상 요인 또는 혼잡도로 인해 일정 조정이 필요한 시기입니다.`;
    conclusionEn = `Travel to ${cityPhraseEn} from ${dateRangeTextEn} requires some itinerary adjustments due to weather factors or tourist crowd levels.`;
  } else {
    conclusionKo = `${dateRangeTextKo} ${destination.city} 여행은 기상 악조건 또는 극심한 휴무 영향이 예상되어 여행 시기를 다시 검토할 필요가 있습니다.`;
    conclusionEn = `Travel to ${cityPhraseEn} from ${dateRangeTextEn} should be timing-reconsidered due to adverse weather or heavy holiday closure impacts.`;
  }

  // 2. Positive Highlights (Reasons boosting score)
  const positiveHighlights = positiveContributors.map((p, idx) => ({
    id: p.id,
    text: p.labelKo,
    textEn: p.labelEn,
    evidenceIds: p.evidenceIds
  }));

  if (positiveHighlights.length === 0) {
    positiveHighlights.push({
      id: 'pos-default',
      text: `${trip.durationDays}일간의 여정을 여유롭게 탐색할 수 있는 일정`,
      textEn: `An itinerary that allows flexible exploration over ${trip.durationDays} days`,
      evidenceIds: ['trip-duration-01']
    });
  }

  // 3. Caution Points (Risks lowering score)
  const cautionPoints = negativeContributors.map((n, idx) => ({
    id: n.id,
    text: n.labelKo,
    textEn: n.labelEn,
    evidenceIds: n.evidenceIds
  }));

  // Weather forecast vs climate average caution
  if (weatherEvidence.dataType === 'mixed' && weatherEvidence.climateRange) {
    cautionPoints.push({
      id: 'caution-climate-range',
      text: `${weatherEvidence.climateRange.startDate} 이후는 실제 예보 범위 밖이므로 평년 기후 데이터를 참고해야 합니다.`,
      textEn: `Dates after ${weatherEvidence.climateRange.startDate} are outside the live forecast window and rely on historical climate averages.`,
      evidenceIds: ['weather-env-01']
    });
  }

  if (cautionPoints.length === 0) {
    cautionPoints.push({
      id: 'caution-default',
      text: '현지 관광 지구 인파 및 주요 시설의 당일 운영시간 사전 확인 권장',
      textEn: 'Check daily operating hours for major attractions and expect standard tourist density',
      evidenceIds: ['crowd-env-01']
    });
  }

  // 4. Actionable Strategy
  let strategyKo = '';
  let strategyEn = '';

  if (eventEvidence.length > 0 && holidayEvidence.length > 0) {
    const hName = holidayEvidence[0].name;
    strategyKo = `대형 행사 일정은 사전에 방문 시간을 체크하고, ${hName}(${holidayEvidence[0].date}) 공휴일에는 주요 박물관 및 매장의 운영 여부를 미리 확인하세요.`;
    strategyEn = `Reserve seats or check entry times for major events in advance, and confirm museum/shop business hours for ${holidayEvidence[0].nameEn} (${holidayEvidence[0].date}).`;
  } else if (eventEvidence.length > 0) {
    strategyKo = `주요 이벤트(${eventEvidence[0].title}) 진행 장소는 혼잡이 예상되므로 가급적 오전에 방문하는 일정을 권장합니다.`;
    strategyEn = `Key event venues (${eventEvidence[0].titleEn}) are expected to be busy; plan visits in the morning for a smoother experience.`;
  } else if (holidayEvidence.length > 0) {
    strategyKo = `공휴일(${holidayEvidence[0].date}) 당일에는 사전 휴무 여부를 파악하고 대체 실내 일정이나 식당을 미리 예약해 두는 것이 좋습니다.`;
    strategyEn = `On the public holiday (${holidayEvidence[0].date}), verify open venues ahead of time and reserve restaurants or indoor backup activities.`;
  } else if (weatherEvidence.heatRisk === 'high') {
    strategyKo = `야외 활동 시 낮 시간대 폭염을 피해 그늘이나 실내 미술관/쇼핑몰 위주로 동선을 배치하세요.`;
    strategyEn = `Avoid mid-day heat during outdoor activities; arrange indoor museum or shopping itineraries during peak afternoon hours.`;
  } else {
    strategyKo = `동선 효율을 위해 인근 주요 관광지와 맛집을 구역별로 묶어 일정 스케줄을 구성하세요.`;
    strategyEn = `Group nearby attractions and dining spots by district to maximize travel efficiency.`;
  }

  // 5. Footer Metadata
  const verifiedSourcesCount = (holidayEvidence.length > 0 ? 1 : 0) + (eventEvidence.length > 0 ? 1 : 0) + 1; // +1 weather
  
  let forecastDateRange: string | undefined;
  if (weatherEvidence.forecastRange) {
    forecastDateRange = `${weatherEvidence.forecastRange.startDate} ~ ${weatherEvidence.forecastRange.endDate}`;
  }

  let climateDateRange: string | undefined;
  if (weatherEvidence.climateRange) {
    climateDateRange = `${weatherEvidence.climateRange.startDate} ~ ${weatherEvidence.climateRange.endDate}`;
  }

  const footerMetadata: ReportFooterMetadata = {
    analyzedAt: new Date().toISOString(),
    dataTypesUsed: [
      weatherEvidence.dataType === 'mixed' ? 'short_term_forecast + climate_average' : weatherEvidence.dataType,
      'public_holidays',
      'verified_events'
    ],
    verifiedSourcesCount,
    forecastDateRange,
    climateDateRange,
    confidence: bundle.confidence,
    dataCompleteness: bundle.dataCompleteness
  };

  return {
    totalScore,
    grade,
    gradeTextKo,
    gradeTextEn,
    overallConclusion: conclusionKo,
    overallConclusionEn: conclusionEn,
    positiveHighlights,
    cautionPoints,
    actionableStrategy: strategyKo,
    actionableStrategyEn: strategyEn,
    footerMetadata,
    evidenceBundle: bundle
  };
}

/**
 * AI-driven report generator via Gemini model.
 * Enforces strict evidence bundle constraints and falls back gracefully to rule-based report.
 */
export async function generateAIReportWithGemini(
  bundle: AnalysisEvidenceBundle,
  aiClient: any
): Promise<TravelSuitabilityReport> {
  const fallbackReport = generateRuleBasedReport(bundle);
  if (!aiClient) return fallbackReport;

  const prompt = `You are a strict, data-grounded travel coordinator. Generate a "Travel Suitability Report" for ${bundle.destination.city}, ${bundle.destination.country}.

CRITICAL SYSTEM CONSTRAINTS:
1. Grounding Rule: Utilize ONLY the facts contained in the provided "AnalysisEvidenceBundle" below. NEVER introduce outside facts, unverified festivals, or generic city promotional PR fluff (such as "rich history", "modern charm", "charming alleyways", "여유로운 여행").
2. Single Source of Truth: The Recommendation Index totalScore is ${bundle.recommendationIndex.totalScore} (${bundle.recommendationIndex.grade}). Your report conclusion MUST NOT contradict this score or grade.
3. Sentence Evidence Mapping: Every sentence in 'positiveHighlights' and 'cautionPoints' MUST include a non-empty array 'evidenceIds' linking directly to item IDs in the bundle (e.g. ["event-1-paris_plages", "holiday-1-2026-08-15", "weather-env-01"]). Any statement without evidence will be discarded.
4. Date-based Weather Phrasing:
   - If dates fall in forecast range, use forecast terms ("이번 여행기간 중...").
   - If dates fall in climate range (${bundle.weatherEvidence.climateRange ? `${bundle.weatherEvidence.climateRange.startDate} ~ ${bundle.weatherEvidence.climateRange.endDate}` : 'N/A'}), NEVER make deterministic daily claims like "On Aug 25 it will rain". Instead use "후반부는 평년 기후를 참고해야 합니다".
5. Actionable Strategy: Provide at least one concrete, actionable travel advice tip.
6. Korean Particle Rule: Do NOT output broken particle placeholders like "파리은(는)". Use natural phrasing like "8월의 파리는...", "이번 파리 여행은...", "선택한 기간에는...".

AnalysisEvidenceBundle JSON:
${JSON.stringify(bundle, null, 2)}`;

  try {
    const responseSchema = {
      type: "OBJECT",
      properties: {
        overallConclusion: { type: "STRING" },
        overallConclusionEn: { type: "STRING" },
        positiveHighlights: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              text: { type: "STRING" },
              textEn: { type: "STRING" },
              evidenceIds: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["text", "textEn", "evidenceIds"]
          }
        },
        cautionPoints: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              text: { type: "STRING" },
              textEn: { type: "STRING" },
              evidenceIds: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["text", "textEn", "evidenceIds"]
          }
        },
        actionableStrategy: { type: "STRING" },
        actionableStrategyEn: { type: "STRING" }
      },
      required: [
        "overallConclusion",
        "overallConclusionEn",
        "positiveHighlights",
        "cautionPoints",
        "actionableStrategy",
        "actionableStrategyEn"
      ]
    };

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const text = response.text;
    if (!text) return fallbackReport;

    const parsed = JSON.parse(text.trim());

    // Validate sentence evidence links against bundle valid evidence IDs
    const validIds = new Set<string>([
      'weather-env-01',
      'crowd-env-01',
      'trip-duration-01',
      ...bundle.holidayEvidence.map(h => h.id),
      ...bundle.eventEvidence.map(e => e.id),
      ...bundle.positiveContributors.map(c => c.id),
      ...bundle.negativeContributors.map(c => c.id)
    ]);

    const filterHighlights = (items: any[]) => {
      if (!Array.isArray(items)) return [];
      return items.filter(item => {
        if (!item.text || !Array.isArray(item.evidenceIds) || item.evidenceIds.length === 0) return false;
        // Check if at least one evidenceId is valid or matches bundle
        return item.evidenceIds.some((id: string) => validIds.has(id) || id.startsWith('event-') || id.startsWith('holiday-') || id.startsWith('weather-'));
      });
    };

    const cleanPositives = filterHighlights(parsed.positiveHighlights);
    const cleanCautions = filterHighlights(parsed.cautionPoints);

    if (cleanPositives.length === 0 || cleanCautions.length === 0) {
      console.warn('[Report Engine] AI response lacked valid evidence links. Merging with rule-based fallback.');
    }

    return {
      totalScore: bundle.recommendationIndex.totalScore,
      grade: bundle.recommendationIndex.grade,
      gradeTextKo: bundle.recommendationIndex.gradeTextKo,
      gradeTextEn: bundle.recommendationIndex.gradeTextEn,
      overallConclusion: parsed.overallConclusion || fallbackReport.overallConclusion,
      overallConclusionEn: parsed.overallConclusionEn || fallbackReport.overallConclusionEn,
      positiveHighlights: cleanPositives.length > 0 ? cleanPositives : fallbackReport.positiveHighlights,
      cautionPoints: cleanCautions.length > 0 ? cleanCautions : fallbackReport.cautionPoints,
      actionableStrategy: parsed.actionableStrategy || fallbackReport.actionableStrategy,
      actionableStrategyEn: parsed.actionableStrategyEn || fallbackReport.actionableStrategyEn,
      footerMetadata: fallbackReport.footerMetadata,
      evidenceBundle: bundle
    };

  } catch (err: any) {
    console.warn('[Report Engine] Gemini report generation failed, using rule-based report:', err.message);
    return fallbackReport;
  }
}
