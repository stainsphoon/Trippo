import { Destination, DestinationSearchItem, DestinationType } from '../types/destination';

/**
 * Normalizes user search query or destination alias string into a unified format:
 * - NFKC unicode normalization
 * - Lowercase
 * - Strip punctuation, dots, commas, hyphens, quotes, parentheses, slashes
 * - Strip spaces
 * - Strip diacritics / accents (e.g., São Paulo -> saopaulo)
 */
export function normalizeSearchText(value: string): string {
  if (!value) return "";
  
  // Normalize unicode NFKC and strip accents/diacritics
  const normalized = value
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
    .toLocaleLowerCase();

  return normalized
    .replace(/[.,'’"“”\-_/()]/g, "") // Remove punctuation
    .replace(/\s+/g, "") // Remove spaces
    .trim()
    .normalize("NFC"); // Convert any decomposed Hangeul from NFD back to precomposed NFC
}

/**
 * Generates search tokens and prefix arrays for Firestore or in-memory search index
 */
export function generateSearchPrefixes(
  aliases: string[],
  options = { minLen: 1, maxLen: 15, maxPerAlias: 10, maxTotal: 60 }
): string[] {
  const prefixSet = new Set<string>();

  for (const rawAlias of aliases) {
    const normalized = normalizeSearchText(rawAlias);
    if (!normalized) continue;

    let count = 0;
    for (let i = options.minLen; i <= Math.min(normalized.length, options.maxLen); i++) {
      prefixSet.add(normalized.substring(0, i));
      count++;
      if (count >= options.maxPerAlias) break;
    }

    if (prefixSet.size >= options.maxTotal) break;
  }

  return Array.from(prefixSet);
}

/**
 * Calculates a search rank score for sorting destination results.
 * Priority rules:
 * 1. Exact match with normalized search text (+1000)
 * 2. Exact match with any alias (+700 if starting with query)
 * 3. Display name or alias starts with query (+500)
 * 4. Type weights (city: +60, island: +50, tourism_region: +45, admin_area: +30, country: +20)
 * 5. Popularity global score + recent search count
 */
export function calculateDestinationSearchRankDetails(
  destination: Destination,
  rawQuery: string,
  language: 'ko' | 'en' = 'ko'
): { rank: number; matchCategory: 'strong' | 'contextual'; matchType: string; matchedAlias?: string } {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return { rank: 0, matchCategory: 'contextual', matchType: 'none' };

  // 1. Official Names (Official, Names Ko, Names En, Local)
  const officialNames = [
    destination.names?.ko,
    destination.names?.en,
    destination.names?.local,
    destination.names?.officialKo,
    destination.names?.officialEn,
  ].map(t => normalizeSearchText(t || '')).filter(Boolean);

  // 2. Alias / Display Names (Display, Aliases Ko, Aliases En, Aliases Local)
  const aliasNames = [
    destination.names?.displayKo,
    destination.names?.displayEn,
    ...(destination.aliases?.ko || []),
    ...(destination.aliases?.en || []),
    ...(destination.aliases?.local || []),
  ].map(t => normalizeSearchText(t || '')).filter(Boolean);

  // 3. Hierarchy Search Tokens (Upper admin levels / Country names)
  const hierarchySearchTokens = [
    ...(destination.hierarchySearchTokens || []),
    destination.hierarchy?.countryNameKo,
    destination.hierarchy?.countryNameEn,
    destination.hierarchy?.admin1NameKo,
    destination.hierarchy?.admin1NameEn,
    destination.hierarchy?.admin2NameKo,
    destination.hierarchy?.admin2NameEn,
  ].map(t => normalizeSearchText(t || '')).filter(Boolean);

  // 4. Other fallback search terms
  const fallbackTerms = [
    ...(destination.search?.normalizedNames || []),
    ...(destination.search?.tokens || []),
    ...(destination.tokens || []),
  ].map(t => normalizeSearchText(t || '')).filter(Boolean);

  let matchType: 'primary_exact' | 'exact' | 'primary_prefix' | 'alias_prefix' | 'hierarchy_match' | 'substring' | 'none' = 'none';
  let matchedAlias = '';

  // Priority 1: Official name exact match
  if (officialNames.includes(normalizedQuery)) {
    matchType = 'primary_exact';
    matchedAlias = officialNames.find(t => t === normalizedQuery) || '';
  }
  // Priority 2: Alias exact match
  else if (aliasNames.includes(normalizedQuery)) {
    matchType = 'exact';
    matchedAlias = aliasNames.find(t => t === normalizedQuery) || '';
  }
  // Priority 3: Official name prefix match
  else if (officialNames.some(t => t.startsWith(normalizedQuery))) {
    matchType = 'primary_prefix';
    matchedAlias = officialNames.find(t => t.startsWith(normalizedQuery)) || '';
  }
  // Priority 4: Alias prefix match
  else if (aliasNames.some(t => t.startsWith(normalizedQuery))) {
    matchType = 'alias_prefix';
    matchedAlias = aliasNames.find(t => t.startsWith(normalizedQuery)) || '';
  }
  // Priority 5: Hierarchy token exact or prefix match
  else if (hierarchySearchTokens.some(t => t === normalizedQuery || t.startsWith(normalizedQuery))) {
    matchType = 'hierarchy_match';
    matchedAlias = hierarchySearchTokens.find(t => t === normalizedQuery || t.startsWith(normalizedQuery)) || '';
  }
  // Fallback: prefix match
  else if (fallbackTerms.some(t => t.startsWith(normalizedQuery))) {
    matchType = 'substring'; // keep 'substring' label or add new, but let's just reuse 'substring' scoring or change it?
    matchedAlias = fallbackTerms.find(t => t.startsWith(normalizedQuery)) || '';
  }
  // Fallback: substring match (only if length >= 2)
  else if (normalizedQuery.length >= 2 && fallbackTerms.some(t => t.includes(normalizedQuery))) {
    matchType = 'substring';
    matchedAlias = fallbackTerms.find(t => t.includes(normalizedQuery)) || '';
  }

  const isRelevant = matchType !== 'none';
  if (!isRelevant) {
    return { rank: 0, matchCategory: 'contextual', matchType: 'none' };
  }

  let score = 0;
  switch (matchType) {
    case 'primary_exact':
      score = 2000;
      break;
    case 'exact':
      score = 1500;
      break;
    case 'primary_prefix':
      score = 1000;
      break;
    case 'alias_prefix':
      score = 800;
      break;
    case 'hierarchy_match':
      score = 100; // Lower priority for parent administrative/hierarchy levels
      break;
    case 'substring':
      score = 50;
      break;
  }

  // Type weights
  switch (destination.type) {
    case 'city':
      score += 60;
      break;
    case 'island':
      score += 50;
      break;
    case 'tourism_region':
      score += 45;
      break;
    case 'admin_area':
      score += 30;
      break;
    case 'country':
      score += 20;
      break;
    case 'district':
      score += 15;
      break;
  }

  // Popularity Score
  score += destination.popularity?.globalScore || 0;
  score += (destination.popularity?.recentSearchCount || 0) * 0.1;

  console.log("[DESTINATION_RELEVANCE_LOG]", {
    normalizedQuery,
    destinationId: destination.id,
    matchType,
    matchScore: score,
    matchedAlias,
    isRelevant
  });

  const matchCategory: 'strong' | 'contextual' = ['primary_exact', 'exact', 'primary_prefix'].includes(matchType) ? 'strong' : 'contextual';
  return { rank: score, matchCategory, matchType, matchedAlias };
}

/**
 * Checks if two destination candidates represent the same place (for deduplication).
 */
export function isDuplicateDestination(a: DestinationSearchItem, b: DestinationSearchItem): boolean {
  // 1. Same destinationId
  if (a.destinationId && b.destinationId && a.destinationId === b.destinationId) {
    return true;
  }

  // 2. Same Google Place ID
  const aGoogleId = a.rawDestination?.providerIds?.googlePlaceId || (a.source === 'external' ? a.externalId : undefined);
  const bGoogleId = b.rawDestination?.providerIds?.googlePlaceId || (b.source === 'external' ? b.externalId : undefined);
  if (aGoogleId && bGoogleId && aGoogleId === bGoogleId) {
    return true;
  }

  // 3. Same countryCode + type + similar coordinates (within ~15km radius)
  if (
    a.countryCode &&
    b.countryCode &&
    a.countryCode === b.countryCode &&
    a.type === b.type &&
    a.location &&
    b.location
  ) {
    const latDiff = Math.abs(a.location.latitude - b.location.latitude);
    const lngDiff = Math.abs(a.location.longitude - b.location.longitude);
    if (latDiff < 0.15 && lngDiff < 0.15) {
      return true;
    }
  }

  // 4. Same normalized name + countryCode
  const normA = normalizeSearchText(a.displayName);
  const normB = normalizeSearchText(b.displayName);
  if (normA && normB && normA === normB && a.countryCode === b.countryCode) {
    return true;
  }

  return false;
}

/**
 * List of forbidden Google Place types for Explore Tab (e.g., specific spots/businesses/transit)
 */
export const FORBIDDEN_EXPLORE_PLACE_TYPES = new Set([
  'restaurant',
  'food',
  'cafe',
  'lodging',
  'hotel',
  'establishment',
  'point_of_interest',
  'store',
  'shopping_mall',
  'airport',
  'transit_station',
  'bus_station',
  'train_station',
  'subway_station',
  'street_address',
  'route',
  'intersection',
  'premise',
  'subpremise',
  'post_box',
  'parking',
  'tourist_attraction',
]);

/**
 * Maps Google Place types or external types to Trippo DestinationType.
 * Returns null if the place type should be excluded from Explore.
 */
export function mapProviderTypeToDestinationType(types: string[] = []): DestinationType | null {
  if (!types || types.length === 0) return 'city'; // default fallback for city/region

  // Check forbidden types
  const hasForbidden = types.some((t) => FORBIDDEN_EXPLORE_PLACE_TYPES.has(t));
  if (hasForbidden) {
    // Exception: If type also includes locality or administrative_area_level_1/2 or country, allow it, but exclude if it is a business/transit/attraction
    const isMajorAdmin = types.some((t) =>
      ['locality', 'administrative_area_level_1', 'administrative_area_level_2', 'country', 'island', 'archipelago', 'sublocality', 'neighborhood', 'district'].includes(t)
    );
    const isTransitOrBusiness = types.some((t) =>
      ['airport', 'transit_station', 'train_station', 'subway_station', 'bus_station', 'hotel', 'lodging', 'restaurant', 'shopping_mall', 'tourist_attraction'].includes(t)
    );
    if (isTransitOrBusiness || !isMajorAdmin) {
      return null;
    }
  }

  if (types.includes('country')) return 'country';
  if (types.includes('administrative_area_level_1') || types.includes('administrative_area_level_2')) return 'admin_area';
  if (types.includes('island') || types.includes('archipelago')) return 'island';
  if (types.includes('locality') || types.includes('postal_town')) return 'city';
  if (
    types.includes('sublocality') ||
    types.includes('neighborhood') ||
    types.includes('sublocality_level_1') ||
    types.includes('sublocality_level_2') ||
    types.includes('sublocality_level_3') ||
    types.includes('sublocality_level_4') ||
    types.includes('sublocality_level_5') ||
    types.includes('ward') ||
    types.includes('district')
  ) {
    return 'district';
  }
  if (types.includes('natural_feature') || types.includes('colloquial_area')) return 'tourism_region';

  // Fallback for general political region searches
  if (types.includes('political')) {
    return 'city';
  }

  return null;
}

export function calculateDestinationSearchRank(dest: any, query: string, lang: 'ko' | 'en' = 'ko'): number { return calculateDestinationSearchRankDetails(dest, query, lang).rank; }
