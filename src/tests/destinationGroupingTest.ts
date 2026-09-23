import {
  classifyDestinationRelationship,
  groupAndDeduplicateDestinations,
  DetailedRelationshipJudgment,
} from '../utils/destinationGrouping';
import { DestinationSearchItem } from '../types/destination';

export function runGroupingVerificationSuite() {
  console.log('====================================================');
  console.log('RUNNING DESTINATION GROUPING VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: Same Name / Different Place (Paris France vs Paris Texas)
  // ----------------------------------------------------
  const parisFrance: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'paris-fr',
    type: 'city',
    displayName: '파리',
    countryCode: 'FR',
    names: { ko: '파리', en: 'Paris' },
    location: { latitude: 48.8566, longitude: 2.3522 },
    rawDestination: {
      hierarchy: { countryCode: 'FR', admin1NameKo: '일드프랑스', countryNameKo: '프랑스' },
    } as any,
  };

  const parisTexas: DestinationSearchItem = {
    source: 'external',
    externalId: 'paris-tx-usa',
    type: 'city',
    displayName: '파리',
    countryCode: 'US',
    names: { ko: '파리', en: 'Paris' },
    location: { latitude: 33.6609, longitude: -95.5555 },
    rawDestination: {
      hierarchy: { countryCode: 'US', admin1NameKo: '텍사스', countryNameKo: '미국' },
    } as any,
  };

  const judgmentParis = classifyDestinationRelationship(parisFrance, parisTexas);
  assert(
    judgmentParis.relationship === 'same_name_different_place' && judgmentParis.confidence >= 0.95,
    'Paris France vs Paris Texas Relationship Classification',
    `Got ${judgmentParis.relationship}, confidence ${judgmentParis.confidence}`
  );

  const parisGroupResult = groupAndDeduplicateDestinations([parisFrance, parisTexas], '파리');
  assert(
    parisGroupResult.length === 2 && !parisGroupResult.some((item) => item.isGroup),
    'Paris France vs Paris Texas kept as 2 separate items (Not grouped)',
    `Result length: ${parisGroupResult.length}`
  );

  // ----------------------------------------------------
  // TEST 2: Same Name / Different Place (Springfield IL vs Springfield MA)
  // ----------------------------------------------------
  const springfieldIL: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'springfield-il',
    type: 'city',
    displayName: '스프링필드',
    countryCode: 'US',
    names: { ko: '스프링필드', en: 'Springfield' },
    location: { latitude: 39.7817, longitude: -89.6501 },
    rawDestination: {
      hierarchy: { countryCode: 'US', admin1NameKo: '일리노이', countryNameKo: '미국' },
    } as any,
  };

  const springfieldMA: DestinationSearchItem = {
    source: 'external',
    externalId: 'springfield-ma',
    type: 'city',
    displayName: '스프링필드',
    countryCode: 'US',
    names: { ko: '스프링필드', en: 'Springfield' },
    location: { latitude: 42.1015, longitude: -72.5898 },
    rawDestination: {
      hierarchy: { countryCode: 'US', admin1NameKo: '매사추세츠', countryNameKo: '미국' },
    } as any,
  };

  const judgmentSpringfield = classifyDestinationRelationship(springfieldIL, springfieldMA);
  assert(
    judgmentSpringfield.relationship === 'same_name_different_place',
    'Springfield IL vs Springfield MA Classification',
    `Got ${judgmentSpringfield.relationship}`
  );

  // ----------------------------------------------------
  // TEST 3: Miyakojima Island vs City vs Region (Related Scope)
  // ----------------------------------------------------
  const miyakoIsland: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'jp-miyakojima-island',
    type: 'island',
    displayName: '미야코지마섬',
    countryCode: 'JP',
    names: { ko: '미야코지마섬', en: 'Miyakojima Island' },
    location: { latitude: 24.8, longitude: 125.3 },
    rawDestination: {
      hierarchy: { countryCode: 'JP', admin1NameKo: '오키나와현', countryNameKo: '일본' },
    } as any,
  };

  const miyakoCity: DestinationSearchItem = {
    source: 'external',
    externalId: 'jp-miyakojima-city',
    type: 'city',
    displayName: '미야코지마시',
    countryCode: 'JP',
    names: { ko: '미야코지마시', en: 'Miyakojima City' },
    location: { latitude: 24.805, longitude: 125.281 },
    rawDestination: {
      hierarchy: { countryCode: 'JP', admin1NameKo: '오키나와현', countryNameKo: '일본' },
    } as any,
  };

  const judgmentMiyako = classifyDestinationRelationship(miyakoIsland, miyakoCity);
  assert(
    judgmentMiyako.relationship === 'related_scope',
    'Miyakojima Island vs Miyakojima City Relationship Classification',
    `Got ${judgmentMiyako.relationship}`
  );

  const miyakoGroupResult = groupAndDeduplicateDestinations([miyakoIsland, miyakoCity], '미야코지마');
  assert(
    miyakoGroupResult.length === 1 && miyakoGroupResult[0].isGroup === true,
    'Miyakojima grouped into UI DestinationGroupItem for generic query "미야코지마"',
    `Got length ${miyakoGroupResult.length}, isGroup: ${miyakoGroupResult[0]?.isGroup}`
  );

  // ----------------------------------------------------
  // TEST 4: Specific User Query Intent ("미야코지마섬") -> Direct Return
  // ----------------------------------------------------
  const miyakoSpecificResult = groupAndDeduplicateDestinations([miyakoIsland, miyakoCity], '미야코지마섬');
  assert(
    miyakoSpecificResult.length === 1 &&
      miyakoSpecificResult[0].isGroup !== true &&
      miyakoSpecificResult[0].destinationId === 'jp-miyakojima-island',
    'Specific query "미야코지마섬" directly returns Island entity without group prompt',
    `Result: ${JSON.stringify(miyakoSpecificResult[0])}`
  );

  // ----------------------------------------------------
  // TEST 5: Same Entity Duplicate Deduplication
  // ----------------------------------------------------
  const duplicateTokyoInternal: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'jp-tokyo',
    type: 'city',
    displayName: '도쿄',
    countryCode: 'JP',
    names: { ko: '도쿄', en: 'Tokyo' },
    location: { latitude: 35.6762, longitude: 139.6503 },
    rawDestination: {
      hierarchy: { countryCode: 'JP', admin1NameKo: '도쿄도', admin1NameEn: 'Tokyo' },
    } as any,
  };

  const duplicateTokyoExternal: DestinationSearchItem = {
    source: 'external',
    destinationId: 'jp-tokyo', // Matching destination ID
    externalId: 'chIJT20_JThwGGAR3i4',
    type: 'city',
    displayName: '도쿄',
    countryCode: 'JP',
    names: { ko: '도쿄', en: 'Tokyo' },
    location: { latitude: 35.6765, longitude: 139.6501 },
    rawDestination: {
      hierarchy: { countryCode: 'JP', admin1NameKo: '도쿄도', admin1NameEn: 'Tokyo' },
    } as any,
  };

  const judgmentTokyo = classifyDestinationRelationship(duplicateTokyoInternal, duplicateTokyoExternal);
  assert(
    judgmentTokyo.relationship === 'same_entity' && judgmentTokyo.confidence >= 0.95,
    'Duplicate Tokyo internal vs external same entity classification',
    `Got ${judgmentTokyo.relationship}, confidence ${judgmentTokyo.confidence}`
  );

  const tokyoDeduplicated = groupAndDeduplicateDestinations([duplicateTokyoInternal, duplicateTokyoExternal], '도쿄');
  assert(
    tokyoDeduplicated.length === 1 && tokyoDeduplicated[0].source === 'internal',
    'Duplicate Tokyo deduplicated to single internal item',
    `Length: ${tokyoDeduplicated.length}`
  );

  // ----------------------------------------------------
  // TEST 6: Real Destination Pairs (Requirement 9)
  // ----------------------------------------------------

  // 1. 제주도 / 제주시
  const jejuIsland: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'jeju-island',
    type: 'island',
    displayName: '제주도',
    countryCode: 'KR',
    names: { ko: '제주도', en: 'Jeju Island' },
    location: { latitude: 33.38, longitude: 126.55 },
    rawDestination: { hierarchy: { countryCode: 'KR', admin1NameKo: '제주특별자치도' } } as any,
  };
  const jejuCity: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'jeju-city',
    type: 'city',
    displayName: '제주시',
    countryCode: 'KR',
    names: { ko: '제주시', en: 'Jeju City' },
    location: { latitude: 33.4996, longitude: 126.5312 },
    rawDestination: { hierarchy: { countryCode: 'KR', admin1NameKo: '제주특별자치도' } } as any,
  };
  const j1 = classifyDestinationRelationship(jejuIsland, jejuCity);
  assert(j1.relationship === 'related_scope', 'Jeju Island vs Jeju City Relationship', `Got ${j1.relationship}`);

  // 2. 오키나와현 / 오키나와시
  const okinawaPref: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'okinawa-pref',
    type: 'admin_area',
    displayName: '오키나와현',
    countryCode: 'JP',
    names: { ko: '오키나와현', en: 'Okinawa Prefecture' },
    location: { latitude: 26.2124, longitude: 127.6809 },
    rawDestination: { hierarchy: { countryCode: 'JP' } } as any,
  };
  const okinawaCity: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'okinawa-city',
    type: 'city',
    displayName: '오키나와시',
    countryCode: 'JP',
    names: { ko: '오키나와시', en: 'Okinawa City' },
    location: { latitude: 26.3344, longitude: 127.8056 },
    rawDestination: { hierarchy: { countryCode: 'JP' } } as any,
  };
  const j2 = classifyDestinationRelationship(okinawaPref, okinawaCity);
  assert(j2.relationship === 'related_scope', 'Okinawa Pref vs Okinawa City Relationship', `Got ${j2.relationship}`);

  // 3. 발리섬 / 발리주
  const baliIsland: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'bali-island',
    type: 'island',
    displayName: '발리섬',
    countryCode: 'ID',
    names: { ko: '발리섬', en: 'Bali Island' },
    location: { latitude: -8.4095, longitude: 115.1889 },
    rawDestination: { hierarchy: { countryCode: 'ID' } } as any,
  };
  const baliProvince: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'bali-province',
    type: 'admin_area',
    displayName: '발리주',
    countryCode: 'ID',
    names: { ko: '발리주', en: 'Bali Province' },
    location: { latitude: -8.4095, longitude: 115.1889 },
    rawDestination: { hierarchy: { countryCode: 'ID' } } as any,
  };
  const j3 = classifyDestinationRelationship(baliIsland, baliProvince);
  assert(j3.relationship === 'related_scope', 'Bali Island vs Bali Province Relationship', `Got ${j3.relationship}`);

  // 4. 보라카이 / Malay
  const boracayIsland: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'boracay-island',
    type: 'island',
    displayName: '보라카이',
    countryCode: 'PH',
    names: { ko: '보라카이', en: 'Boracay' },
    location: { latitude: 11.9674, longitude: 121.9248 },
    rawDestination: { hierarchy: { countryCode: 'PH' } } as any,
  };
  const malayMunicipality: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'malay-municipality',
    type: 'admin_area',
    displayName: 'Malay',
    countryCode: 'PH',
    names: { ko: '말라이', en: 'Malay' },
    location: { latitude: 11.9011, longitude: 121.9103 },
    rawDestination: { hierarchy: { countryCode: 'PH' } } as any,
  };
  const j4 = classifyDestinationRelationship(boracayIsland, malayMunicipality);
  assert(j4.relationship === 'related_scope', 'Boracay vs Malay Municipality Relationship', `Got ${j4.relationship}`);

  // 5. 뉴욕주 / 뉴욕시
  const nyState: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'ny-state',
    type: 'admin_area',
    displayName: '뉴욕주',
    countryCode: 'US',
    names: { ko: '뉴욕주', en: 'New York State' },
    location: { latitude: 40.7128, longitude: -74.006 },
    rawDestination: { hierarchy: { countryCode: 'US' } } as any,
  };
  const nyCity: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'ny-city',
    type: 'city',
    displayName: '뉴욕시',
    countryCode: 'US',
    names: { ko: '뉴욕시', en: 'NYC' },
    location: { latitude: 40.7128, longitude: -74.006 },
    rawDestination: { hierarchy: { countryCode: 'US' } } as any,
  };
  const j5 = classifyDestinationRelationship(nyState, nyCity);
  assert(j5.relationship === 'related_scope', 'NY State vs NYC Relationship', `Got ${j5.relationship}`);

  // 6. 싱가포르 국가 / 싱가포르 도시
  const sgCountry: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'sg-country',
    type: 'country',
    displayName: '싱가포르',
    countryCode: 'SG',
    names: { ko: '싱가포르', en: 'Singapore' },
    location: { latitude: 1.3521, longitude: 103.8198 },
    rawDestination: { hierarchy: { countryCode: 'SG' } } as any,
  };
  const sgCity: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'sg-city',
    type: 'city',
    displayName: '싱가포르 시티',
    countryCode: 'SG',
    names: { ko: '싱가포르 시티', en: 'Singapore City' },
    location: { latitude: 1.3521, longitude: 103.8198 },
    rawDestination: { hierarchy: { countryCode: 'SG' } } as any,
  };
  const j6 = classifyDestinationRelationship(sgCountry, sgCity);
  assert(j6.relationship === 'related_scope', 'Singapore Country vs Singapore City Relationship', `Got ${j6.relationship}`);

  // 7. 조지아 국가 / 미국 조지아주 (Same Name / Different Place)
  const georgiaCountry: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'ge-country',
    type: 'country',
    displayName: '조지아',
    countryCode: 'GE',
    names: { ko: '조지아', en: 'Georgia' },
    location: { latitude: 42.3154, longitude: 43.3569 },
    rawDestination: { hierarchy: { countryCode: 'GE' } } as any,
  };
  const georgiaUsState: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'ga-us-state',
    type: 'admin_area',
    displayName: '조지아주',
    countryCode: 'US',
    names: { ko: '조지아주', en: 'Georgia State' },
    location: { latitude: 32.1656, longitude: -82.9001 },
    rawDestination: { hierarchy: { countryCode: 'US' } } as any,
  };
  const j7 = classifyDestinationRelationship(georgiaCountry, georgiaUsState);
  assert(
    j7.relationship === 'same_name_different_place',
    'Georgia Country vs Georgia US State Relationship',
    `Got ${j7.relationship}`
  );

  // 8. 멕시코 국가 / 멕시코시티
  const mexicoCountry: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'mexico-country',
    type: 'country',
    displayName: '멕시코',
    countryCode: 'MX',
    names: { ko: '멕시코', en: 'Mexico' },
    location: { latitude: 23.6345, longitude: -102.5528 },
    rawDestination: { hierarchy: { countryCode: 'MX' } } as any,
  };
  const mexicoCity: DestinationSearchItem = {
    source: 'internal',
    destinationId: 'mexico-city',
    type: 'city',
    displayName: '멕시코시티',
    countryCode: 'MX',
    names: { ko: '멕시코시티', en: 'Mexico City' },
    location: { latitude: 19.4326, longitude: -99.1332 },
    rawDestination: { hierarchy: { countryCode: 'MX' } } as any,
  };
  const j8 = classifyDestinationRelationship(mexicoCountry, mexicoCity);
  assert(j8.relationship === 'related_scope', 'Mexico Country vs Mexico City Relationship', `Got ${j8.relationship}`);

  console.log(`\nVerification finished: ${passedTests}/${totalTests} tests passed.`);
  console.log('====================================================\n');

  return { passedTests, totalTests };
}
