export type ScoreGrade = 
  | 'highly_recommended' 
  | 'recommended' 
  | 'good_with_conditions' 
  | 'needs_adjustment' 
  | 'reconsider';

export interface SubScores {
  weather: number;             // 0-100
  events: number;              // 0-100
  crowd: number;               // 0-100
  holidayImpact: number;       // 0-100
  outdoorSuitability: number;  // 0-100
  localExperience: number;     // 0-100
}

export interface RecommendationIndex {
  totalScore: number;          // 0-100
  grade: ScoreGrade;
  gradeTextKo: string;
  gradeTextEn: string;
  subScores: SubScores;
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
  grade: ScoreGrade;
  gradeTextKo: string;
  gradeTextEn: string;
  overallConclusion: string;
  overallConclusionEn: string;
  positiveHighlights: ReportHighlightPoint[];
  cautionPoints: ReportHighlightPoint[];
  actionableStrategy: string;
  actionableStrategyEn: string;
  footerMetadata: ReportFooterMetadata;
  evidenceBundle: AnalysisEvidenceBundle;
}
