export interface JourneyPassData {
  destinationId: string;
  destinationName: string;
  destinationCity?: string;
  countryCode?: string;
  countryName?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  nights: number;
  days: number;
  timezoneId?: string;
}

// Canonical Country Name Resolver
const COUNTRY_NAMES_KO: Record<string, string> = {
  KR: '대한민국',
  JP: '일본',
  US: '미국',
  FR: '프랑스',
  IT: '이탈리아',
  ES: '스페인',
  GB: '영국',
  DE: '독일',
  CH: '스위스',
  TH: '태국',
  VN: '베트남',
  PH: '필리핀',
  TW: '대만',
  HK: '홍콩',
  SG: '싱가포르',
  ID: '인도네시아',
  MY: '말레이시아',
  MV: '몰디브',
  AU: '호주',
  NZ: '뉴질랜드',
  CA: '캐나다',
  CN: '중국',
  GU: '괌 (미국)',
  MP: '사이판 (미국)'
};

const COUNTRY_NAMES_EN: Record<string, string> = {
  KR: 'South Korea',
  JP: 'Japan',
  US: 'United States',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  GB: 'United Kingdom',
  DE: 'Germany',
  CH: 'Switzerland',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  SG: 'Singapore',
  ID: 'Indonesia',
  MY: 'Malaysia',
  MV: 'Maldives',
  AU: 'Australia',
  NZ: 'New Zealand',
  CA: 'Canada',
  CN: 'China',
  GU: 'Guam',
  MP: 'Saipan'
};

/**
 * Calculates exact date-only duration (Nights & Days) without timezone drift.
 */
export function calculateDateDuration(startDateStr: string, endDateStr: string): { nights: number; days: number } {
  if (!startDateStr || !endDateStr) {
    return { nights: 0, days: 1 };
  }

  try {
    const sParts = startDateStr.split('-').map(Number);
    const eParts = endDateStr.split('-').map(Number);

    if (sParts.length === 3 && eParts.length === 3) {
      const startUtc = Date.UTC(sParts[0], sParts[1] - 1, sParts[2]);
      const endUtc = Date.UTC(eParts[0], eParts[1] - 1, eParts[2]);
      const diffMs = Math.max(0, endUtc - startUtc);
      const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const days = nights + 1;
      return { nights, days };
    }
  } catch (_e) {
    // fallback
  }

  const s = new Date(startDateStr);
  const e = new Date(endDateStr);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    return { nights: 0, days: 1 };
  }

  const diffMs = Math.max(0, e.getTime() - s.getTime());
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const days = Math.max(1, nights + 1);
  return { nights, days };
}

/**
 * Resolves cleaned destination name and country name from raw search inputs.
 */
export function resolveDestinationAndCountry(
  rawName: string,
  countryCode?: string,
  language: string = 'ko'
): { destination: string; country: string } {
  const isKo = language === 'ko';
  let dest = (rawName || '').trim();
  let country = '';

  // Handle common split patterns like "도쿄, 일본" or "Paris, France"
  if (dest.includes(',')) {
    const parts = dest.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      dest = parts[0];
      country = parts[parts.length - 1];
    }
  } else if (dest.includes('·')) {
    const parts = dest.split('·').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      dest = parts[0];
      country = parts[1];
    }
  }

  // If country is not yet resolved, use country code mapping
  if (!country && countryCode) {
    const code = countryCode.toUpperCase();
    if (isKo) {
      country = COUNTRY_NAMES_KO[code] || countryCode;
    } else {
      country = COUNTRY_NAMES_EN[code] || countryCode;
    }
  }

  // Default fallback if still empty
  if (!dest) {
    dest = isKo ? '여행지' : 'DESTINATION';
  }

  return { destination: dest, country };
}

/**
 * Creates canonical JourneyPassData structure for printing transition
 */
export function createJourneyPassData(params: {
  destinationId?: string;
  rawDestinationName: string;
  countryCode?: string;
  countryName?: string;
  startDate: string;
  endDate: string;
  timezoneId?: string;
  language?: string;
}): JourneyPassData {
  const { destination, country } = resolveDestinationAndCountry(
    params.rawDestinationName,
    params.countryCode,
    params.language || 'ko'
  );

  const { nights, days } = calculateDateDuration(params.startDate, params.endDate);

  return {
    destinationId: params.destinationId || `dest-${Date.now()}`,
    destinationName: destination,
    countryCode: params.countryCode,
    countryName: params.countryName || country,
    startDate: params.startDate,
    endDate: params.endDate,
    nights,
    days,
    timezoneId: params.timezoneId
  };
}
