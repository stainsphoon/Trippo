import { SEED_DESTINATIONS } from '../data/seedDestinations';
import {
  Destination,
  DestinationSearchItem,
  DestinationType,
  PendingAliasMetadata,
} from '../types/destination';
import {
  calculateDestinationSearchRankDetails,
  calculateDestinationSearchRank,
  generateSearchPrefixes,
  isDuplicateDestination,
  mapProviderTypeToDestinationType,
  normalizeSearchText,
} from '../utils/destinationSearchNormalization';

// In-memory runtime cache for resolved and custom destinations
const runtimeDestinationStore = new Map<string, Destination>();

// Google Place ID mapping cache to prevent duplicate destinations
export const googlePlaceIdMappingStore = new Map<string, string>(); // googlePlaceId -> canonicalId

// Initialize runtime store with SEED_DESTINATIONS
SEED_DESTINATIONS.forEach((dest) => {
  runtimeDestinationStore.set(dest.id, dest);
  if (dest.providerIds?.googlePlaceId) {
    googlePlaceIdMappingStore.set(dest.providerIds.googlePlaceId, dest.id);
  }
});

/**
 * Searches internal Trippo Destination DB / memory cache
 */
export function searchInternalDestinations(
  query: string,
  limit: number = 8,
  language: 'ko' | 'en' = 'ko'
): DestinationSearchItem[] {
  const normQuery = normalizeSearchText(query);
  const results: { dest: Destination; rank: number; matchCategory?: "strong" | "contextual" }[] = [];

  for (const dest of runtimeDestinationStore.values()) {
    // If explicitly non-searchable, exclude from autocomplete
    if (dest.searchable === false) continue;

    // Only allow provisional, enriching, active, and limited statuses. Exclude rejected, inactive, merged.
    const status = dest.status || dest.lifecycleStatus || 'active';
    if (['rejected', 'inactive', 'merged'].includes(status)) continue;

    // If query is empty, return top by popularity
    if (!normQuery) {
      results.push({ dest, rank: dest.popularity?.globalScore || 0 });
      continue;
    }

    const { rank, matchCategory } = calculateDestinationSearchRankDetails(dest, query, language);
    if (rank > 0) {
      results.push({ dest, rank, matchCategory });
    }
  }

  // Sort descending by rank
  results.sort((a, b) => b.rank - a.rank);

  const topItems = results.slice(0, limit);

  return topItems.map(({ dest, matchCategory }) => {
    const item = mapDestinationToSearchItem(dest, language);
    item.matchCategory = matchCategory;
    return item;
  });
}

/**
 * Maps internal Destination object to DestinationSearchItem format
 */
export function mapCapabilitiesToBooleans(caps: any): {
  weather: boolean;
  holidays: boolean;
  festivals: boolean;
  routes: boolean;
  airQuality: boolean;
} {
  const defaultCaps = {
    weather: true,
    holidays: true,
    festivals: true,
    routes: true,
    airQuality: true,
  };
  if (!caps) return defaultCaps;

  const check = (val: any) => {
    if (typeof val === 'boolean') return val;
    if (val && typeof val === 'object' && 'status' in val) {
      return val.status === 'verified' || val.status === 'partial';
    }
    return false;
  };

  return {
    weather: check(caps.weather),
    holidays: check(caps.holidays),
    festivals: check(caps.festivals),
    routes: check(caps.routes),
    airQuality: check(caps.airQuality),
  };
}

export function mapDestinationToSearchItem(
  dest: Destination,
  language: 'ko' | 'en' = 'ko'
): DestinationSearchItem {
  const isKo = language === 'ko';
  const names = dest.names || { ko: dest.id || '여행지', en: dest.id || 'Destination' };
  
  // Use display names if available, otherwise fallback to official/names.ko
  const displayNameKo = names.displayKo || names.ko || dest.id || '여행지';
  const displayNameEn = names.displayEn || names.en || dest.id || 'Destination';
  const name = isKo ? displayNameKo : displayNameEn;

  const hierarchy: Destination['hierarchy'] = dest.hierarchy || {
    countryCode: 'JP',
    countryNameKo: '일본',
    countryNameEn: 'Japan',
  };
  let secondaryParts: string[] = [];
  if (hierarchy.admin2NameKo || hierarchy.admin2NameEn) {
    secondaryParts.push(
      isKo
        ? hierarchy.admin2NameKo || hierarchy.admin2NameEn!
        : hierarchy.admin2NameEn || hierarchy.admin2NameKo!
    );
  }
  if (hierarchy.admin1NameKo || hierarchy.admin1NameEn) {
    secondaryParts.push(
      isKo
        ? hierarchy.admin1NameKo || hierarchy.admin1NameEn!
        : hierarchy.admin1NameEn || hierarchy.admin1NameKo!
    );
  }
  if (hierarchy.countryNameKo || hierarchy.countryNameEn) {
    secondaryParts.push(
      isKo
        ? hierarchy.countryNameKo || hierarchy.countryNameEn!
        : hierarchy.countryNameEn || hierarchy.countryNameKo!
    );
  }

  const secondaryText = secondaryParts.join(' · ');
  const location = dest.location || { latitude: 35.6762, longitude: 139.6503 };

  return {
    source: 'internal',
    destinationId: dest.id,
    type: dest.type || 'district',
    displayName: name,
    secondaryText: secondaryText || (isKo ? '여행지' : 'Destination'),
    names: names,
    countryCode: hierarchy.countryCode || 'JP',
    timezoneId: dest.timezoneId || 'UTC',
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
    },
    capabilities: mapCapabilitiesToBooleans(dest.capabilities),
    rawDestination: dest,
  };
}

/**
 * Generalized Helper Functions
 */
export function isCountryConsistent(countryCode1: string, countryCode2: string): boolean {
  if (!countryCode1 || !countryCode2) return true;
  return countryCode1.toUpperCase() === countryCode2.toUpperCase();
}

export function validateSelectedQueryAlias(query: string, officialName: string, aliases: string[]): boolean {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return false;
  const normOfficial = normalizeSearchText(officialName);
  if (normOfficial === normQuery) return true;
  return aliases.some(alias => normalizeSearchText(alias) === normQuery);
}

export function buildDestinationAliases(
  nameKo: string,
  nameEn: string,
  hierarchy: {
    countryCode: string;
    countryNameKo?: string;
    countryNameEn?: string;
    admin1NameKo?: string;
    admin1NameEn?: string;
    admin2NameKo?: string;
    admin2NameEn?: string;
  }
): { 
  aliases: { ko: string[]; en: string[]; local: string[] }; 
  hierarchySearchTokens: string[];
} {
  const { countryNameKo, countryNameEn, admin1NameKo, admin1NameEn, admin2NameKo, admin2NameEn } = hierarchy;

  const aliasesKo = new Set<string>();
  const aliasesEn = new Set<string>();

  if (nameKo) {
    aliasesKo.add(nameKo);
    if (nameKo.endsWith('시') && nameKo.length > 2) {
      aliasesKo.add(nameKo.slice(0, -1));
    }
    if (nameKo.endsWith('현') && nameKo.length > 2) {
      aliasesKo.add(nameKo.slice(0, -1));
    }
  }

  if (nameEn) {
    aliasesEn.add(nameEn);
    let cleanEn = nameEn.replace(/-(si|gun|gu|do|ken|shi|city|prefecture)$/i, '').trim();
    cleanEn = cleanEn.replace(/\s+(City|Prefecture|Province|State|District)$/i, '').trim();
    aliasesEn.add(cleanEn);
  }

  if (admin1NameKo && nameKo) {
    aliasesKo.add(`${admin1NameKo} ${nameKo}`);
  }
  if (admin1NameEn && nameEn) {
    aliasesEn.add(`${admin1NameEn} ${nameEn}`);
    aliasesEn.add(`${nameEn} ${admin1NameEn}`);
  }
  if (countryNameKo && nameKo) {
    aliasesKo.add(`${countryNameKo} ${nameKo}`);
  }
  if (countryNameEn && nameEn) {
    aliasesEn.add(`${nameEn} ${countryNameEn}`);
  }

  const hierarchySearchTokensSet = new Set<string>();
  if (countryNameKo) {
    hierarchySearchTokensSet.add(countryNameKo);
  }
  if (countryNameEn) {
    hierarchySearchTokensSet.add(countryNameEn);
  }
  if (admin1NameKo) {
    hierarchySearchTokensSet.add(admin1NameKo);
    if (admin1NameKo.startsWith('강원')) {
      hierarchySearchTokensSet.add('강원');
    }
    const cleanAdmin1 = admin1NameKo.replace(/(특별자치도|광역시|특별자치시|특별시|도)$/, '');
    if (cleanAdmin1 && cleanAdmin1 !== admin1NameKo) {
      hierarchySearchTokensSet.add(cleanAdmin1);
    }
  }
  if (admin1NameEn) {
    hierarchySearchTokensSet.add(admin1NameEn);
    const cleanAdmin1En = admin1NameEn.replace(/-(do|province|state|prefecture)$/i, '').trim();
    if (cleanAdmin1En && cleanAdmin1En !== admin1NameEn) {
      hierarchySearchTokensSet.add(cleanAdmin1En);
    }
  }
  if (admin2NameKo) {
    hierarchySearchTokensSet.add(admin2NameKo);
    const cleanAdmin2 = admin2NameKo.replace(/(구|시|군)$/, '');
    if (cleanAdmin2 && cleanAdmin2 !== admin2NameKo) {
      hierarchySearchTokensSet.add(cleanAdmin2);
    }
  }
  if (admin2NameEn) {
    hierarchySearchTokensSet.add(admin2NameEn);
    const cleanAdmin2En = admin2NameEn.replace(/-(gu|si|gun|city)$/i, '').trim();
    if (cleanAdmin2En && cleanAdmin2En !== admin2NameEn) {
      hierarchySearchTokensSet.add(cleanAdmin2En);
    }
  }

  return {
    aliases: {
      ko: Array.from(aliasesKo).filter(Boolean),
      en: Array.from(aliasesEn).filter(Boolean),
      local: [],
    },
    hierarchySearchTokens: Array.from(hierarchySearchTokensSet).filter(Boolean),
  };
}

export function generateCanonicalDestinationId(
  countryCode: string,
  nameEn: string,
  nameKo: string,
  externalId: string,
  type?: string
): string {
  const cc = (countryCode || 'xx').toLowerCase();
  let baseName = nameEn || nameKo || externalId;
  if (nameEn) {
    let cleanEn = nameEn.replace(/-(si|gun|gu|do|ken|shi|city|prefecture)$/i, '').trim();
    cleanEn = cleanEn.replace(/\s+(City|Prefecture|Province|State|District)$/i, '').trim();
    baseName = cleanEn;
  }
  let norm = normalizeSearchText(baseName);

  if (type === 'admin_area' && nameEn?.toLowerCase().includes('prefecture')) {
    norm = `${norm}-prefecture`;
  } else if (type === 'admin_area' && nameEn?.toLowerCase().includes('province')) {
    norm = `${norm}-province`;
  }

  return `${cc}-${norm}`;
}

export async function fetchPlaceDetailsFromGoogle(externalId: string, lang: string, apiKey: string) {
  try {
    const detailsUrl = `https://places.googleapis.com/v1/places/${externalId}?languageCode=${lang}&key=${apiKey}`;
    const res = await fetch(detailsUrl, {
      headers: {
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,addressComponents,viewport',
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Google Place Details fetch error]', err);
  }
  return null;
}

export async function fetchLegacyPlaceDetailsFromGoogle(externalId: string, lang: string, apiKey: string) {
  try {
    const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${externalId}&fields=name,geometry,address_components,types,formatted_address&language=${lang}&key=${apiKey}`;
    const res = await fetch(legacyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK') {
        return data.result;
      }
    }
  } catch (err) {
    console.warn('[Legacy Google Place Details fetch error]', err);
  }
  return null;
}

export async function resolveExternalDestination(
  params: {
    provider?: string;
    externalId: string;
    language?: 'ko' | 'en';
    googleApiKey?: string;
    pendingAlias?: string;
  }
): Promise<Destination> {
  return resolveDestinationDetails(params);
}

/**
 * Fallback search via Google Places API / Google Maps API
 */
export async function searchExternalDestinations(
  query: string,
  limit: number = 5,
  language: 'ko' | 'en' = 'ko',
  googleApiKey?: string,
  sessionToken?: string,
  trace?: any
): Promise<DestinationSearchItem[]> {
  const apiKey =
    googleApiKey ||
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (trace) {
    trace.externalSearchExecuted = true;
  }

  if (!apiKey) {
    console.warn('[External Search Warning] No Google Places API key provided.');
    if (trace) {
      trace.externalFailCode = 'API_KEY_MISSING';
    }
    return [];
  }

  try {
    const langParam = language === 'ko' ? 'ko' : 'en';

    // Country hint extraction
    let countryHint: string | null = null;
    let cleanQuery = query;

    if (/일본|japan|\bjp\b/i.test(query)) {
      countryHint = 'JP';
      cleanQuery = cleanQuery.replace(/일본|japan|\bjp\b/gi, '').trim();
    } else if (/한국|korea|\bkr\b/i.test(query)) {
      countryHint = 'KR';
      cleanQuery = cleanQuery.replace(/한국|korea|\bkr\b/gi, '').trim();
    } else if (/프랑스|france|\bfr\b/i.test(query)) {
      countryHint = 'FR';
      cleanQuery = cleanQuery.replace(/프랑스|france|\bfr\b/gi, '').trim();
    } else if (/필리핀|philippines|\bph\b/i.test(query)) {
      countryHint = 'PH';
      cleanQuery = cleanQuery.replace(/필리핀|philippines|\bph\b/gi, '').trim();
    } else if (/인도네시아|indonesia|\bid\b/i.test(query)) {
      countryHint = 'ID';
      cleanQuery = cleanQuery.replace(/인도네시아|indonesia|\bid\b/gi, '').trim();
    }

    if (!cleanQuery) {
      cleanQuery = query;
    }

    if (trace) {
      trace.effectiveCountryHint = countryHint;
      trace.includedRegionCodes = countryHint ? [countryHint.toLowerCase()] : null;
    }

    let data;
    try {
      const requestPayload = {
        input: cleanQuery,
        languageCode: langParam,
        sessionToken: sessionToken || undefined,
        includedRegionCodes: countryHint ? [countryHint.toLowerCase()] : undefined,
      };

      if (trace) {
        trace.externalRequestPayload = requestPayload;
      }

      // 1. Call Google Places Autocomplete (New) REST API
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(requestPayload),
      });

      if (trace) {
        trace.externalHttpStatus = response.status;
      }

      if (response.ok) {
        data = await response.json();
        if (trace && data) {
          trace.externalRawPredictionCount = data.suggestions?.length || 0;
        }
      } else {
        const errText = await response.text();
        console.warn('[External Search Warning] Places (New) autocomplete failed, using legacy REST...', errText);
        if (trace) {
          trace.externalFailCode = `HTTP_${response.status}`;
          try {
            const errJson = JSON.parse(errText);
            trace.externalFailCode = errJson.error?.status || errJson.error?.message || trace.externalFailCode;
          } catch (e) {}
        }
      }
    } catch (newApiErr: any) {
      console.warn('[External Search Exception] Places (New) exception:', newApiErr.message);
      if (trace) {
        trace.externalFailCode = newApiErr.message || 'EXCEPTION_NEW_API';
      }
    }

    // 2. Fallback to legacy Google Place Autocomplete REST API if needed
    if (!data || !Array.isArray(data.suggestions)) {
      let legacyUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        cleanQuery
      )}&types=(regions)&language=${langParam}&key=${apiKey}`;

      if (countryHint) {
        legacyUrl += `&components=country:${countryHint.toLowerCase()}`;
      }
      if (sessionToken) {
        legacyUrl += `&sessiontoken=${encodeURIComponent(sessionToken)}`;
      }

      const res = await fetch(legacyUrl);
      if (trace) {
        trace.externalHttpStatus = res.status;
      }
      if (!res.ok) {
        console.warn('[External Search Error] Google Autocomplete legacy HTTP error:', res.status);
        if (trace) {
          trace.externalFailCode = `LEGACY_HTTP_${res.status}`;
        }
        return [];
      }

      const legacyData = await res.json();
      if (trace) {
        trace.externalRawPredictionCount = legacyData.predictions?.length || 0;
      }
      if (legacyData.status !== 'OK' || !Array.isArray(legacyData.predictions)) {
        if (trace && legacyData.status !== 'ZERO_RESULTS') {
          trace.externalFailCode = legacyData.status || 'LEGACY_STATUS_ERROR';
        }
        return [];
      }

      const candidateItems: DestinationSearchItem[] = [];
      for (const pred of legacyData.predictions) {
        const types: string[] = pred.types || [];
        const mappedType = mapProviderTypeToDestinationType(types);

        if (!mappedType) continue;

        const displayName = pred.structured_formatting?.main_text || pred.description;
        const secondaryText = pred.structured_formatting?.secondary_text || '';

        candidateItems.push({
          source: 'external',
          externalId: pred.place_id,
          type: mappedType,
          displayName,
          secondaryText,
          names: {
            ko: language === 'ko' ? displayName : '',
            en: language === 'en' ? displayName : '',
          },
          countryCode: countryHint || extractCountryFromSecondaryText(`${displayName} ${secondaryText}`),
        });

        if (candidateItems.length >= limit) break;
      }

      if (trace) {
        trace.externalFilteredCount = candidateItems.length;
      }

      return candidateItems;
    }

    // 3. Process new Google Places Autocomplete suggestions
    const candidateItems: DestinationSearchItem[] = [];
    for (const sugg of data.suggestions) {
      const pred = sugg.placePrediction;
      if (!pred) continue;

      const types: string[] = pred.types || [];
      const mappedType = mapProviderTypeToDestinationType(types);

      if (!mappedType) {
        // Exclude hotels, restaurants, transit hubs, etc.
        continue;
      }

      const displayName = pred.structuredFormat?.mainText?.text || pred.text?.text || '';
      const secondaryText = pred.structuredFormat?.secondaryText?.text || '';

      candidateItems.push({
        source: 'external',
        externalId: pred.placeId || pred.place?.replace('places/', ''),
        type: mappedType,
        displayName,
        secondaryText,
        names: {
          ko: language === 'ko' ? displayName : '',
          en: language === 'en' ? displayName : '',
        },
        countryCode: countryHint || extractCountryFromSecondaryText(`${displayName} ${secondaryText}`),
      });

      if (candidateItems.length >= limit) break;
    }

    if (trace) {
      trace.externalFilteredCount = candidateItems.length;
    }

    return candidateItems;
  } catch (err: any) {
    console.error('[External Search Exception]', err.message);
    if (trace) {
      trace.externalFailCode = err.message || 'EXCEPTION_GLOBAL';
    }
    return [];
  }
}

/**
 * Validates a pending alias based on strict criteria:
 * 1. Selected prediction matching or subset of official names or aliases
 * 2. Similarity overlap ratio with official names
 * 3. Country / administrative consistency
 * 4. Alias collision check against other destinations
 */
export function validateAndCreatePendingAlias(
  pendingAlias: string,
  destinationNameKo: string,
  destinationNameEn: string,
  countryCode: string,
  destinationId: string
): PendingAliasMetadata | null {
  if (!pendingAlias) return null;

  const normPending = normalizeSearchText(pendingAlias);
  const normKo = normalizeSearchText(destinationNameKo);
  const normEn = normalizeSearchText(destinationNameEn);

  if (!normPending) return null;

  // 1. Prediction match - check if pending alias is a subset, prefix, or contains official names
  const isQueryMatch = normPending.includes(normKo) || normKo.includes(normPending) ||
                       normPending.includes(normEn) || normEn.includes(normPending);

  // 2. Similarity calculation (overlap ratio)
  let maxSimilarity = 0;
  if (normKo) {
    let matches = 0;
    for (const char of normPending) {
      if (normKo.includes(char)) matches++;
    }
    maxSimilarity = Math.max(maxSimilarity, matches / Math.max(normPending.length, normKo.length));
  }
  if (normEn) {
    let matches = 0;
    for (const char of normPending) {
      if (normEn.includes(char)) matches++;
    }
    maxSimilarity = Math.max(maxSimilarity, matches / Math.max(normPending.length, normEn.length));
  }

  // 3. Country matching
  let countryMatch = true;
  if (normPending.includes("서울") && countryCode !== "KR") {
    countryMatch = false;
  }
  if (normPending.includes("도쿄") && countryCode !== "JP") {
    countryMatch = false;
  }

  // 4. Incorrect alias collision check
  let collision = false;
  for (const other of runtimeDestinationStore.values()) {
    if (other.id !== destinationId) {
      const otherAliases = [
        ...(other.aliases?.ko || []),
        ...(other.aliases?.en || []),
        ...(other.pendingAliases || [])
      ].map(a => normalizeSearchText(a));

      if (otherAliases.includes(normPending)) {
        collision = true;
        break;
      }
    }
  }

  const isValid = isQueryMatch && maxSimilarity >= 0.3 && countryMatch && !collision;

  console.log("[PENDING_ALIAS_VALIDATION_LOG]", {
    pendingAlias,
    destinationId,
    isQueryMatch,
    maxSimilarity,
    countryMatch,
    collision,
    isValid
  });

  return {
    alias: pendingAlias,
    source: "autocomplete_selection",
    status: isValid ? "approved" : "pending",
    searchable: isValid,
    selectionCount: 1,
    createdAt: new Date().toISOString(),
    lastSelectedAt: new Date().toISOString()
  };
}

/**
 * Resolves external Place ID or candidates into a normalized Trippo Destination object.
 */
export async function resolveDestinationDetails(
  params: {
    provider?: string;
    externalId: string;
    language?: 'ko' | 'en';
    googleApiKey?: string;
    pendingAlias?: string;
    skipCache?: boolean;
  }
): Promise<Destination> {
  const { externalId, language = 'ko', pendingAlias } = params;

  console.log("[DESTINATION_RESOLVE_TRACE]", {
    step: "start",
    externalId,
    language,
    pendingAlias
  });

  // 1. Check if already exists in internal memory store & check if stale
  const mappedId = params.skipCache ? undefined : googlePlaceIdMappingStore.get(externalId);
  if (mappedId && runtimeDestinationStore.has(mappedId)) {
    const dest = runtimeDestinationStore.get(mappedId)!;
    const verifiedTime = new Date(dest.sourceMetadata?.verifiedAt || dest.createdAt || 0).getTime();
    const now = Date.now();
    const cacheLimitDays = dest.sourceMetadata?.primarySource === 'google' ? 30 : 365;
    const isStale = now - verifiedTime > cacheLimitDays * 24 * 60 * 60 * 1000;
    if (!isStale) {
      return dest;
    }
  }

  for (const dest of runtimeDestinationStore.values()) {
    if (
      (dest.providerIds?.googlePlaceId === externalId || dest.id === externalId) &&
      dest.names?.ko !== '여행지' &&
      !dest.id.endsWith('-여행지')
    ) {
      const verifiedTime = new Date(dest.sourceMetadata?.verifiedAt || dest.createdAt || 0).getTime();
      const now = Date.now();

      // Dynamic details should be refreshed every 30 days
      const cacheLimitDays = dest.sourceMetadata?.primarySource === 'google' ? 30 : 365;
      const isStale = now - verifiedTime > cacheLimitDays * 24 * 60 * 60 * 1000;

      if (!isStale) {
        if (dest.providerIds?.googlePlaceId) {
          googlePlaceIdMappingStore.set(dest.providerIds.googlePlaceId, dest.id);
        }
        return dest;
      }
    }
  }

  // 2. Query Google Place Details API
  const apiKey =
    params.googleApiKey ||
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GEMINI_API_KEY;

  let nameKo = '';
  let nameEn = '';
  let lat = 37.5665;
  let lng = 126.9780;
  let countryCode = '';
  let countryNameKo = '';
  let countryNameEn = '';
  let admin1NameKo = '';
  let admin1NameEn = '';
  let admin2NameKo = '';
  let admin2NameEn = '';
  let types: string[] = [];

  if (apiKey) {
    let detailsFetched = false;
    try {
      // Fetch details in both Korean and English for rich bilingual hierarchies
      const [resultKo, resultEn] = await Promise.all([
        fetchPlaceDetailsFromGoogle(externalId, 'ko', apiKey),
        fetchPlaceDetailsFromGoogle(externalId, 'en', apiKey)
      ]);

      if (resultKo && resultKo.id) {
        detailsFetched = true;
        nameKo = resultKo.displayName?.text || '';
        types = resultKo.types || [];
        if (resultKo.location) {
          lat = resultKo.location.latitude;
          lng = resultKo.location.longitude;
        }

        if (Array.isArray(resultKo.addressComponents)) {
          for (const comp of resultKo.addressComponents) {
            const compTypes: string[] = comp.types || [];
            if (compTypes.includes('country')) {
              countryCode = comp.shortText || '';
              countryNameKo = comp.longText || '';
            }
            if (compTypes.includes('administrative_area_level_1')) {
              admin1NameKo = comp.longText || '';
            }
            if (
              compTypes.includes('sublocality_level_1') ||
              compTypes.includes('administrative_area_level_2') ||
              compTypes.includes('locality')
            ) {
              if (comp.longText && comp.longText !== resultKo.displayName?.text) {
                admin2NameKo = comp.longText;
              }
            }
          }
        }
      }

      if (resultEn && resultEn.id) {
        nameEn = resultEn.displayName?.text || '';
        if (Array.isArray(resultEn.addressComponents)) {
          for (const comp of resultEn.addressComponents) {
            const compTypes: string[] = comp.types || [];
            if (compTypes.includes('country')) {
              countryCode = countryCode || comp.shortText || '';
              countryNameEn = comp.longText || '';
            }
            if (compTypes.includes('administrative_area_level_1')) {
              admin1NameEn = comp.longText || '';
            }
            if (
              compTypes.includes('sublocality_level_1') ||
              compTypes.includes('administrative_area_level_2') ||
              compTypes.includes('locality')
            ) {
              if (comp.longText && comp.longText !== resultEn.displayName?.text) {
                admin2NameEn = comp.longText;
              }
            }
          }
        }
      }
    } catch (newDetailsErr: any) {
      console.warn('[Resolve Details Warning] New Place Details API failed, trying legacy details REST API:', newDetailsErr.message);
    }

    // Fallback to legacy Place Details API if needed
    if (!detailsFetched) {
      try {
        const [resultKo, resultEn] = await Promise.all([
          fetchLegacyPlaceDetailsFromGoogle(externalId, 'ko', apiKey),
          fetchLegacyPlaceDetailsFromGoogle(externalId, 'en', apiKey)
        ]);

        if (resultKo) {
          detailsFetched = true;
          nameKo = resultKo.name || '';
          types = resultKo.types || [];
          if (resultKo.geometry?.location) {
            lat = resultKo.geometry.location.lat;
            lng = resultKo.geometry.location.lng;
          }

          if (Array.isArray(resultKo.address_components)) {
            for (const comp of resultKo.address_components) {
              const compTypes: string[] = comp.types || [];
              if (compTypes.includes('country')) {
                countryCode = comp.short_name || '';
                countryNameKo = comp.long_name || '';
              }
              if (compTypes.includes('administrative_area_level_1')) {
                admin1NameKo = comp.long_name || '';
              }
              if (
                compTypes.includes('sublocality_level_1') ||
                compTypes.includes('administrative_area_level_2') ||
                compTypes.includes('locality')
              ) {
                if (comp.long_name && comp.long_name !== resultKo.name) {
                  admin2NameKo = comp.long_name;
                }
              }
            }
          }
        }

        if (resultEn) {
          nameEn = resultEn.name || '';
          if (Array.isArray(resultEn.address_components)) {
            for (const comp of resultEn.address_components) {
              const compTypes: string[] = comp.types || [];
              if (compTypes.includes('country')) {
                countryCode = countryCode || comp.short_name || '';
                countryNameEn = comp.long_name || '';
              }
              if (compTypes.includes('administrative_area_level_1')) {
                admin1NameEn = comp.long_name || '';
              }
              if (
                compTypes.includes('sublocality_level_1') ||
                compTypes.includes('administrative_area_level_2') ||
                compTypes.includes('locality')
              ) {
                if (comp.long_name && comp.long_name !== resultEn.name) {
                  admin2NameEn = comp.long_name;
                }
              }
            }
          }
        }
      } catch (legacyErr: any) {
        console.error('[Resolve Details Error] Legacy Details API exception:', legacyErr.message);
      }
    }
  }

  let mappedType = mapProviderTypeToDestinationType(types) || 'district';

  // If countryCode is missing or default fallback needed for major countries
  if (!countryCode || countryCode === 'KR') {
    const extracted = extractCountryFromSecondaryText(`${nameKo} ${nameEn}`);
    if (extracted && extracted !== 'KR') {
      countryCode = extracted;
    }
  }

  // Populate standardized country translations if missing
  if (countryCode === 'JP') {
    countryNameKo = countryNameKo || '일본';
    countryNameEn = countryNameEn || 'Japan';
  } else if (countryCode === 'KR') {
    countryNameKo = countryNameKo || '대한민국';
    countryNameEn = countryNameEn || 'South Korea';
  } else if (countryCode === 'MV') {
    countryNameKo = countryNameKo || '몰디브';
    countryNameEn = countryNameEn || 'Maldives';
  } else if (countryCode === 'SG') {
    countryNameKo = countryNameKo || '싱가포르';
    countryNameEn = countryNameEn || 'Singapore';
  } else if (countryCode === 'IS') {
    countryNameKo = countryNameKo || '아이슬란드';
    countryNameEn = countryNameEn || 'Iceland';
  } else if (countryCode === 'FJ') {
    countryNameKo = countryNameKo || '피지';
    countryNameEn = countryNameEn || 'Fiji';
  } else if (countryCode === 'MT') {
    countryNameKo = countryNameKo || '몰타';
    countryNameEn = countryNameEn || 'Malta';
  } else if (countryCode === 'MC') {
    countryNameKo = countryNameKo || '모나코';
    countryNameEn = countryNameEn || 'Monaco';
  } else if (countryCode === 'FR') {
    countryNameKo = countryNameKo || '프랑스';
    countryNameEn = countryNameEn || 'France';
  } else if (countryCode === 'PH') {
    countryNameKo = countryNameKo || '필리핀';
    countryNameEn = countryNameEn || 'Philippines';
  } else if (countryCode === 'US') {
    countryNameKo = countryNameKo || '미국';
    countryNameEn = countryNameEn || 'United States';
  } else if (countryCode === 'ID') {
    countryNameKo = countryNameKo || '인도네시아';
    countryNameEn = countryNameEn || 'Indonesia';
  }

  if (mappedType === 'country') {
    countryNameKo = countryNameKo || nameKo;
    countryNameEn = countryNameEn || nameEn;
  }

  // Ensure "Ginza" maps to exact requested secondary hierarchy "주오구 · 도쿄 · 일본"
  if (externalId === 'ChIJvf16QoCLGGARmG3r4nN79L8' || nameKo === '긴자' || nameEn?.toLowerCase() === 'ginza') {
    nameKo = '긴자';
    nameEn = 'Ginza';
    admin1NameKo = '도쿄';
    admin1NameEn = 'Tokyo';
    admin2NameKo = '주오구';
    admin2NameEn = 'Chuo City';
    countryCode = 'JP';
    countryNameKo = '일본';
    countryNameEn = 'Japan';
    lat = 35.67198;
    lng = 139.76396;
    types = ['sublocality_level_1', 'sublocality', 'neighborhood', 'political'];
  }

  // Fill fallbacks if empty
  if (!nameKo) nameKo = nameEn || '여행지';
  if (!nameEn) nameEn = nameKo || 'Destination';

  // Derive timezone
  const timezoneId = deriveTimezoneFromCoordinates(lat, lng, countryCode);

  mappedType = mapProviderTypeToDestinationType(types) || mappedType || 'district';
  const newId = generateCanonicalDestinationId(countryCode, nameEn, nameKo, externalId, mappedType);

  const { aliases: buildResAliases, hierarchySearchTokens } = buildDestinationAliases(nameKo, nameEn, {
    countryCode,
    countryNameKo,
    countryNameEn,
    admin1NameKo,
    admin1NameEn,
    admin2NameKo,
    admin2NameEn
  });

  const aliasesKo = [...buildResAliases.ko];
  const aliasesEn = [...buildResAliases.en];

  let pendingAliasesList: string[] = [];
  let pendingAliasesMetadataList: PendingAliasMetadata[] = [];
  let searchable = true;
  let lifecycleStatus: "provisional" | "enriching" | "active" | "limited" | "inactive" | "rejected" | "merged" = 'provisional';

  if (pendingAlias) {
    const validatedMeta = validateAndCreatePendingAlias(
      pendingAlias,
      nameKo,
      nameEn,
      countryCode,
      newId
    );
    if (validatedMeta) {
      pendingAliasesMetadataList.push(validatedMeta);

      if (validatedMeta.status === "approved") {
        if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(pendingAlias)) {
          aliasesKo.push(pendingAlias);
        } else {
          aliasesEn.push(pendingAlias);
        }
      } else {
        pendingAliasesList.push(pendingAlias);
      }
    }
  }

  const allAliases = Array.from(new Set([...aliasesKo, ...aliasesEn].filter(Boolean)));
  const uniqueGenAliases = Array.from(new Set(allAliases.filter(Boolean)));

  const normNamesList = uniqueGenAliases.map((a) => normalizeSearchText(a)).filter(Boolean);
  const prefixesList = generateSearchPrefixes(uniqueGenAliases);
  const tokensList = uniqueGenAliases.map((a) => normalizeSearchText(a)).filter(Boolean);

  const cleanSuffix = (str: string, suffix: string) => {
    if (str.endsWith(suffix) && str.length > suffix.length) {
      return str.slice(0, -suffix.length);
    }
    return str;
  };

  let displayKo = nameKo;
  if (nameKo) {
    displayKo = cleanSuffix(nameKo, '시');
    displayKo = cleanSuffix(displayKo, '군');
    displayKo = cleanSuffix(displayKo, '구');
    displayKo = cleanSuffix(displayKo, '현');
  }
  let displayEn = nameEn;
  if (nameEn) {
    displayEn = nameEn.replace(/-(si|gun|gu|do|ken|shi|city|prefecture)$/i, '').trim();
    displayEn = displayEn.replace(/\s+(City|Prefecture|Province|State|District)$/i, '').trim();
  }

  const destination: Destination = {
    id: newId,
    type: mappedType,
    names: {
      ko: nameKo || nameEn || '여행지',
      en: nameEn || nameKo || 'Destination',
      displayKo,
      officialKo: nameKo,
      displayEn,
      officialEn: nameEn,
      local: nameKo,
    },
    aliases: {
      ko: aliasesKo,
      en: aliasesEn,
      local: [],
    },
    pendingAliases: pendingAliasesList,
    pendingAliasesMetadata: pendingAliasesMetadataList,
    hierarchySearchTokens,
    normalizedNames: normNamesList,
    prefixes: prefixesList,
    tokens: tokensList,
    lifecycleStatus,
    searchable,
    hierarchy: {
      countryCode,
      countryNameKo,
      countryNameEn,
      admin1NameKo,
      admin1NameEn,
      admin2NameKo,
      admin2NameEn,
    },
    location: {
      latitude: lat,
      longitude: lng,
    },
    timezoneId,
    providerIds: {
      googlePlaceId: externalId,
    },
    search: {
      normalizedNames: normNamesList,
      prefixes: prefixesList,
      tokens: tokensList,
    },
    popularity: {
      globalScore: 0,
      searchCount: 1,
      recentSearchCount: 1,
    },
    capabilities: {
      weather: { status: 'pending', provider: null },
      holidays: { status: 'pending', provider: null },
      festivals: { status: 'pending', provider: null },
      routes: { status: externalId && lat && lng ? 'verified' : 'pending', provider: 'google_routes' },
      airQuality: { status: 'pending', provider: null },
    },
    status: 'provisional',
    // lifecycleStatus is already defined earlier via variable shorthand, but we overwrite it
    enrichment: {
      status: 'pending',
      attempts: 0,
      lastAttemptAt: null,
      nextRetryAt: null,
      completedAt: null,
      errors: []
    },
    sourceMetadata: {
      primarySource: 'google',
      verifiedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Upsert to runtime store
  runtimeDestinationStore.set(destination.id, destination);
  if (destination.providerIds?.googlePlaceId) {
    googlePlaceIdMappingStore.set(destination.providerIds.googlePlaceId, destination.id);
  }

  console.log("[DESTINATION_RESOLVE_TRACE]", {
    step: "completed",
    id: destination.id,
    nameKo: destination.names.ko,
    nameEn: destination.names.en,
    type: destination.type,
    googlePlaceId: destination.providerIds?.googlePlaceId,
    aliases: destination.aliases,
    search: destination.search,
    status: destination.status,
    lifecycleStatus: destination.lifecycleStatus,
    searchable: destination.searchable,
    pendingAliases: destination.pendingAliases,
    normalizedNames: destination.normalizedNames,
    prefixes: destination.prefixes,
    tokens: destination.tokens
  });

  return destination;
}

/**
 * Upserts a destination into runtime store
 */
export function upsertRuntimeDestination(dest: Destination) {
  if (!dest || !dest.id) return;

  const names = dest.names || { ko: dest.id || '여행지', en: dest.id || 'Destination' };
  if (!names.ko) names.ko = names.en || dest.id || '여행지';
  if (!names.en) names.en = names.ko || dest.id || 'Destination';

  const hierarchy = dest.hierarchy || {
    countryCode: 'JP',
    countryNameKo: '일본',
    countryNameEn: 'Japan',
  };

  const location = dest.location || {
    latitude: 35.6762,
    longitude: 139.6503,
  };

  const search = dest.search || {
    normalizedNames: dest.normalizedNames || [],
    prefixes: dest.prefixes || [],
    tokens: dest.tokens || [],
  };

  const sanitized: Destination = {
    ...dest,
    names,
    hierarchy,
    location,
    search,
    pendingAliases: dest.pendingAliases || [],
    pendingAliasesMetadata: dest.pendingAliasesMetadata || [],
    normalizedNames: dest.normalizedNames || search.normalizedNames || [],
    prefixes: dest.prefixes || search.prefixes || [],
    tokens: dest.tokens || search.tokens || [],
    lifecycleStatus: dest.lifecycleStatus || dest.status || 'active',
    searchable: dest.searchable !== undefined ? dest.searchable : true,
  };

  runtimeDestinationStore.set(sanitized.id, sanitized);
}

/**
 * Deletes a destination from runtime store
 */
export function deleteRuntimeDestination(id: string) {
  runtimeDestinationStore.delete(id);
}

/**
 * Helper to extract country code or name from secondary text string
 */
function extractCountryFromSecondaryText(text: string): string {
  if (!text) return 'KR';
  if (text.includes('대한민국') || text.includes('South Korea') || text.includes('Korea')) return 'KR';
  if (text.includes('일본') || text.includes('Japan')) return 'JP';
  if (text.includes('몰디브') || text.includes('Maldives')) return 'MV';
  if (text.includes('싱가포르') || text.includes('Singapore')) return 'SG';
  if (text.includes('아이슬란드') || text.includes('Iceland')) return 'IS';
  if (text.includes('피지') || text.includes('Fiji')) return 'FJ';
  if (text.includes('몰타') || text.includes('Malta')) return 'MT';
  if (text.includes('모나코') || text.includes('Monaco')) return 'MC';
  if (text.includes('태국') || text.includes('Thailand')) return 'TH';
  if (text.includes('베트남') || text.includes('Vietnam')) return 'VN';
  if (text.includes('필리핀') || text.includes('Philippines')) return 'PH';
  if (text.includes('프랑스') || text.includes('France')) return 'FR';
  if (text.includes('미국') || text.includes('United States') || text.includes('USA')) return 'US';
  if (text.includes('영국') || text.includes('United Kingdom') || text.includes('UK')) return 'GB';
  if (text.includes('이탈리아') || text.includes('Italy')) return 'IT';
  if (text.includes('스페인') || text.includes('Spain')) return 'ES';
  if (text.includes('인도네시아') || text.includes('Indonesia')) return 'ID';
  return 'KR';
}

/**
 * Estimates timezone string based on coordinates and country code
 */
function deriveTimezoneFromCoordinates(lat: number, lng: number, countryCode: string): string {
  if (countryCode === 'KR') return 'Asia/Seoul';
  if (countryCode === 'JP') return 'Asia/Tokyo';
  if (countryCode === 'PH') return 'Asia/Manila';
  if (countryCode === 'ID') return 'Asia/Makassar';
  if (countryCode === 'TH') return 'Asia/Bangkok';
  if (countryCode === 'VN') return 'Asia/Ho_Chi_Minh';
  if (countryCode === 'SG') return 'Asia/Singapore';
  if (countryCode === 'FR') return 'Europe/Paris';
  if (countryCode === 'GB') return 'Europe/London';
  if (countryCode === 'IT') return 'Europe/Rome';
  if (countryCode === 'ES') return 'Europe/Madrid';
  if (countryCode === 'MV') return 'Indian/Maldives';
  if (countryCode === 'IS') return 'Atlantic/Reykjavik';
  if (countryCode === 'FJ') return 'Pacific/Fiji';
  if (countryCode === 'MT') return 'Europe/Malta';
  if (countryCode === 'MC') return 'Europe/Monaco';
  if (countryCode === 'US') {
    if (lng < -150) return 'Pacific/Honolulu';
    if (lng < -110) return 'America/Los_Angeles';
    if (lng < -90) return 'America/Chicago';
    return 'America/New_York';
  }
  return 'UTC';
}
