import {
  computeRecommendationIndexAndBundle,
  generateRuleBasedReport,
  getGradeFromScore,
  validateRecommendationReport,
  calculateTripDuration
} from '../services/reportEngine';
import { getRatingConfig, RECOMMENDATION_RATING_CONFIG } from '../types/reportTypes';

console.log('=== RUNNING COMPREHENSIVE REPORT ENGINE TEST SUITE ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
    failCount++;
  }
}

// -------------------------------------------------------------
// Test Group 1: 5 Key Cities Distribution Test (Section 18)
// -------------------------------------------------------------
console.log('\n--- Test Group 1: 5 Key Cities Distribution ---');

const testCities = [
  {
    name: 'Tokyo',
    cityKo: '도쿄',
    country: '일본',
    countryCode: 'JP',
    tz: 'Asia/Tokyo',
    avgTemp: 22,
    avgTempMax: 26,
    avgTempMin: 18,
    precipDays: 1,
    heatWaveDays: 0,
    congestion: 'moderate',
    eventsCount: 1
  },
  {
    name: 'Sapporo',
    cityKo: '삿포로',
    country: '일본',
    countryCode: 'JP',
    tz: 'Asia/Tokyo',
    avgTemp: 21,
    avgTempMax: 25,
    avgTempMin: 17,
    precipDays: 1,
    heatWaveDays: 0,
    congestion: 'moderate',
    eventsCount: 1
  },
  {
    name: 'Bali',
    cityKo: '발리',
    country: '인도네시아',
    countryCode: 'ID',
    tz: 'Asia/Makassar',
    avgTemp: 27,
    avgTempMax: 30,
    avgTempMin: 24,
    precipDays: 2,
    heatWaveDays: 0,
    congestion: 'moderate',
    eventsCount: 1
  },
  {
    name: 'Mongolia',
    cityKo: '울란바토르',
    country: '몽골',
    countryCode: 'MN',
    tz: 'Asia/Ulaanbaatar',
    avgTemp: 20,
    avgTempMax: 24,
    avgTempMin: 14,
    precipDays: 1,
    heatWaveDays: 0,
    congestion: 'low',
    eventsCount: 1
  },
  {
    name: 'Sydney',
    cityKo: '시드니',
    country: '호주',
    countryCode: 'AU',
    tz: 'Australia/Sydney',
    avgTemp: 19,
    avgTempMax: 23,
    avgTempMin: 15,
    precipDays: 1,
    heatWaveDays: 0,
    congestion: 'moderate',
    eventsCount: 1
  }
];

testCities.forEach(cityData => {
  const bundle = computeRecommendationIndexAndBundle({
    city: cityData.cityKo,
    country: cityData.country,
    countryCode: cityData.countryCode,
    timezoneId: cityData.tz,
    startDate: '2026-08-13',
    endDate: '2026-08-20',
    weatherData: {
      averageTemp: cityData.avgTemp,
      averageTempMax: cityData.avgTempMax,
      averageTempMin: cityData.avgTempMin,
      precipDays: cityData.precipDays,
      heatWaveDays: cityData.heatWaveDays,
      dailyForecasts: Array(8).fill(0).map((_, i) => ({ date: `2026-08-${13 + i}`, dataType: 'forecast' }))
    },
    holidays: [],
    events: cityData.eventsCount > 0 ? [{ name: 'Local Summer Cultural Event', startDate: '2026-08-13', endDate: '2026-08-20' }] : [],
    congestionLevel: cityData.congestion
  });

  const report = generateRuleBasedReport(bundle);
  const score = report.totalScore;

  assert(
    score >= 65 && score <= 84,
    `${cityData.name} Score is in reasonable suitability range 65~84 (Actual: ${score}, Grade: ${report.gradeTextKo})`
  );
});

// -------------------------------------------------------------
// Test Group 2: Saudi Arabia Extreme Heat Override (Section 13)
// -------------------------------------------------------------
console.log('\n--- Test Group 2: Saudi Arabia Extreme Heat Test ---');

const saudiBundle = computeRecommendationIndexAndBundle({
  city: '리야드',
  country: '사우디아라비아',
  countryCode: 'SA',
  timezoneId: 'Asia/Riyadh',
  startDate: '2026-07-22',
  endDate: '2026-07-29',
  weatherData: {
    averageTemp: 38,
    averageTempMax: 44,
    averageTempMin: 31,
    precipDays: 0,
    heatWaveDays: 8,
    dailyForecasts: Array(8).fill(0).map((_, i) => ({ date: `2026-07-${22 + i}`, dataType: 'forecast' }))
  },
  holidays: [],
  events: [],
  congestionLevel: 'medium'
});

const saudiReport = generateRuleBasedReport(saudiBundle);

assert(saudiBundle.trip.durationDays === 8, 'Saudi Trip durationDays === 8');
assert(saudiBundle.trip.durationNights === 7, 'Saudi Trip durationNights === 7');
assert(saudiReport.totalScore <= 54, `Saudi Arabia Extreme Heat Score capped at <= 54 (Actual: ${saudiReport.totalScore})`);
assert(saudiReport.grade === 'caution', 'Saudi Arabia Grade is caution ("여정 주의")');
assert(saudiReport.gradeTextKo === '여정 주의', 'Saudi Arabia Grade text KO is "여정 주의"');
assert(saudiReport.overallConclusion.includes('제약') || saudiReport.overallConclusion.includes('주의'), 'Saudi Conclusion mentions constraints / caution');
assert(!saudiReport.overallConclusion.includes('여행하기 좋은'), 'Saudi Conclusion DOES NOT claim "여행하기 좋은"');

// -------------------------------------------------------------
// Test Group 3: Grade Range Boundaries (Section 4)
// -------------------------------------------------------------
console.log('\n--- Test Group 3: Grade Range Boundaries ---');

const boundaryCases = [
  { score: 95, expectedGrade: 'optimal', expectedLabel: '최적의 여행 시기' },
  { score: 85, expectedGrade: 'optimal', expectedLabel: '최적의 여행 시기' },
  { score: 84, expectedGrade: 'highlyRecommended', expectedLabel: '매우 추천' },
  { score: 75, expectedGrade: 'highlyRecommended', expectedLabel: '매우 추천' },
  { score: 74, expectedGrade: 'recommended', expectedLabel: '추천' },
  { score: 65, expectedGrade: 'recommended', expectedLabel: '추천' },
  { score: 64, expectedGrade: 'conditional', expectedLabel: '조건부 추천' },
  { score: 55, expectedGrade: 'conditional', expectedLabel: '조건부 추천' },
  { score: 54, expectedGrade: 'caution', expectedLabel: '여정 주의' },
  { score: 40, expectedGrade: 'caution', expectedLabel: '여정 주의' },
  { score: 39, expectedGrade: 'reconsider', expectedLabel: '시기 재검토' },
  { score: 0, expectedGrade: 'reconsider', expectedLabel: '시기 재검토' }
];

boundaryCases.forEach(({ score, expectedGrade, expectedLabel }) => {
  const config = getRatingConfig(score);
  assert(
    config.key === expectedGrade && config.labelKo === expectedLabel,
    `Score Boundary ${score} -> ${expectedGrade} (${expectedLabel})`
  );
});

// -------------------------------------------------------------
// Test Group 4: Positive Contributors Validation (Section 19)
// -------------------------------------------------------------
console.log('\n--- Test Group 4: Contributor Validation ---');

assert(
  saudiBundle.positiveContributors.every(p => p.scoreImpact > 0),
  'All positiveContributors in Saudi bundle have strictly positive scoreImpact (> 0)'
);

// -------------------------------------------------------------
// Test Group 5: Report Validator Tests
// -------------------------------------------------------------
console.log('\n--- Test Group 5: Report Validation ---');

const saudiVal = validateRecommendationReport(saudiReport, saudiReport.ratingConfig);
assert(saudiVal.isValid, 'Saudi Arabia Report passes validation', saudiVal.errors.join('; '));

console.log(`\n==============================================`);
console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED.`);
console.log(`==============================================`);

if (failCount > 0) process.exit(1);

