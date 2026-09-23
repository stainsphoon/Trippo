import { DestinationSearchItem, DestinationType } from '../types/destination';
import { normalizeSearchText } from './destinationSearchNormalization';

export type DestinationRelationshipType =
  | 'same_entity'
  | 'related_scope'
  | 'same_name_different_place'
  | 'unrelated';

export interface DetailedRelationshipJudgment {
  relationship: DestinationRelationshipType;
  confidence: number; // 0.0 to 1.0
  reasons: string[];
  comparedFields: string[];
  classifierVersion: string;
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Enhanced v3 relationship classifier with strict provider/admin code rules.
 * Distance alone is NEVER used as the sole basis for same_entity classification!
 */
export function classifyDestinationRelationship(
  itemA: DestinationSearchItem,
  itemB: DestinationSearchItem
): DetailedRelationshipJudgment {
  const reasons: string[] = [];
  const comparedFields: string[] = [];
  const CLASSIFIER_VERSION = 'destination-relation-v3-strict';

  // 1. Exact Provider ID / Internal Destination ID match
  comparedFields.push('providerPlaceId', 'destinationId', 'externalId');
  const idA = itemA.destinationId || itemA.externalId || itemA.rawDestination?.providerIds?.googlePlaceId;
  const idB = itemB.destinationId || itemB.externalId || itemB.rawDestination?.providerIds?.googlePlaceId;

  if (idA && idB && idA === idB) {
    reasons.push('exact_id_match');
    return {
      relationship: 'same_entity',
      confidence: 1.0,
      reasons,
      comparedFields,
      classifierVersion: CLASSIFIER_VERSION,
    };
  }

  // Conflicting Provider IDs check
  const providerIdA = itemA.externalId || itemA.rawDestination?.providerIds?.googlePlaceId;
  const providerIdB = itemB.externalId || itemB.rawDestination?.providerIds?.googlePlaceId;
  const hasConflictingProviderIds = Boolean(providerIdA && providerIdB && providerIdA !== providerIdB);

  if (hasConflictingProviderIds) {
    reasons.push('conflicting_provider_ids', `provider_${providerIdA}_vs_${providerIdB}`);
  }

  // Extract country codes
  comparedFields.push('countryCode');
  const countryA = itemA.countryCode || itemA.rawDestination?.hierarchy?.countryCode;
  const countryB = itemB.countryCode || itemB.rawDestination?.hierarchy?.countryCode;

  // 2. Different Country -> same_name_different_place (DO NOT GROUP)
  if (countryA && countryB && countryA !== countryB) {
    reasons.push('different_country', `country_${countryA}_vs_${countryB}`);
    return {
      relationship: 'same_name_different_place',
      confidence: 1.0,
      reasons,
      comparedFields,
      classifierVersion: CLASSIFIER_VERSION,
    };
  }
  if (countryA && countryB && countryA === countryB) {
    reasons.push('same_country');
  }

  // Extract admin1 (e.g., State/Province)
  comparedFields.push('admin1Name');
  const admin1A = itemA.rawDestination?.hierarchy?.admin1NameKo || itemA.rawDestination?.hierarchy?.admin1NameEn;
  const admin1B = itemB.rawDestination?.hierarchy?.admin1NameKo || itemB.rawDestination?.hierarchy?.admin1NameEn;

  // 3. Same country, but explicitly different state/admin1 area -> same_name_different_place
  if (admin1A && admin1B && admin1A !== admin1B) {
    reasons.push('different_admin_area_1', `admin1_${admin1A}_vs_${admin1B}`);
    return {
      relationship: 'same_name_different_place',
      confidence: 0.95,
      reasons,
      comparedFields,
      classifierVersion: CLASSIFIER_VERSION,
    };
  }
  if (admin1A && admin1B && admin1A === admin1B) {
    reasons.push('same_admin_area');
  }

  // Distance evaluation if locations are available
  comparedFields.push('location_coordinates');
  let distanceKm: number | null = null;
  if (itemA.location && itemB.location) {
    distanceKm = calculateDistanceKm(
      itemA.location.latitude,
      itemA.location.longitude,
      itemB.location.latitude,
      itemB.location.longitude
    );
  }

  const nameA = normalizeSearchText(itemA.names?.ko || itemA.names?.en || itemA.displayName);
  const nameB = normalizeSearchText(itemB.names?.ko || itemB.names?.en || itemB.displayName);
  comparedFields.push('names', 'type');

  // STRICT REQUIREMENT: Distance alone is NOT enough for same_entity!
  // If provider IDs conflict, same_entity is strictly FORBIDDEN!
  if (!hasConflictingProviderIds && nameA === nameB && itemA.type === itemB.type) {
    const isVeryCloseCentroid = distanceKm !== null && distanceKm < 2.0; // < 2km centroid
    const sameCountryAndAdmin = Boolean(countryA && countryB && countryA === countryB && admin1A && admin1B && admin1A === admin1B);

    if (isVeryCloseCentroid && sameCountryAndAdmin) {
      reasons.push('same_normalized_official_name', 'same_type', 'same_admin_hierarchy', 'very_close_centroid_<2km');
      return {
        relationship: 'same_entity',
        confidence: 0.95,
        reasons,
        comparedFields,
        classifierVersion: CLASSIFIER_VERSION,
      };
    } else if (distanceKm !== null && distanceKm < 15.0) {
      // 2km to 15km apart without matching provider IDs or admin codes
      // Cannot grant same_entity with confidence >= 0.95! Route to review_required / related_scope
      reasons.push('same_name_same_type_distance_without_provider_id_match', `distance_${Math.round(distanceKm)}km`);
      return {
        relationship: 'related_scope',
        confidence: 0.80, // Confidence < 0.95 prevents auto-merging!
        reasons,
        comparedFields,
        classifierVersion: CLASSIFIER_VERSION,
      };
    }
  }

  // 5. Scope relationship evaluation by Destination Type & Admin Levels
  const getBaseName = (s: string) =>
    s
      .toLowerCase()
      .replace(/(특별자치도|특별자치시|특별시|광역시|여행권역|시티|도|시|섬|현|주|군|구|국가)$/, '')
      .replace(/island|city|province|prefecture|district|state|country|municipality/gi, '')
      .trim();

  const baseA = getBaseName(nameA);
  const baseB = getBaseName(nameB);

  // Administrative level difference check (e.g. island vs city, state vs city, country vs city, prefecture vs city)
  const isAdminLevelDifference =
    itemA.type !== itemB.type &&
    ['country', 'state', 'province', 'prefecture', 'island', 'city', 'municipality', 'tourism_region'].includes(itemA.type || '') &&
    ['country', 'state', 'province', 'prefecture', 'island', 'city', 'municipality', 'tourism_region'].includes(itemB.type || '');

  if (isAdminLevelDifference) {
    if (baseA === baseB || (distanceKm !== null && distanceKm < 150)) {
      reasons.push('administrative_level_or_scope_difference', `types_${itemA.type}_vs_${itemB.type}`);
      return {
        relationship: 'related_scope',
        confidence: baseA === baseB ? 0.90 : 0.85,
        reasons,
        comparedFields,
        classifierVersion: CLASSIFIER_VERSION,
      };
    }
  }

  // Type specific scope limits
  const isIslandOrRegion =
    itemA.type === 'island' ||
    itemB.type === 'island' ||
    itemA.type === 'tourism_region' ||
    itemB.type === 'tourism_region';
  const scopeDistanceThreshold = isIslandOrRegion ? 75 : 30;

  if (baseA === baseB || (distanceKm !== null && distanceKm < scopeDistanceThreshold)) {
    if (itemA.type !== itemB.type || itemA.type === 'tourism_region' || itemB.type === 'tourism_region') {
      reasons.push('overlapping_scope', `types_${itemA.type}_and_${itemB.type}`);
      if (distanceKm !== null) reasons.push(`distance_${Math.round(distanceKm)}km`);
      return {
        relationship: 'related_scope',
        confidence: baseA === baseB ? 0.90 : 0.80,
        reasons,
        comparedFields,
        classifierVersion: CLASSIFIER_VERSION,
      };
    }
  }

  reasons.push('no_geographic_or_type_relation');
  return {
    relationship: 'unrelated',
    confidence: 0.0,
    reasons,
    comparedFields,
    classifierVersion: CLASSIFIER_VERSION,
  };
}

export function groupAndDeduplicateDestinations(
  items: DestinationSearchItem[],
  query: string
): DestinationSearchItem[] {
  const normalizedQuery = normalizeSearchText(query);

  const getBaseName = (name: string) => {
    let base = normalizeSearchText(name);
    base = base.replace(/(시|도|섬|현|군|구|특별자치도|특별자치시|여행권역)$/, '');
    base = base.replace(/island|city|province|prefecture/g, '');
    return base.trim();
  };

  // Step 1: Deduplication (ONLY if relationship === 'same_entity' AND confidence >= 0.95)
  // Confidence < 0.95 is NOT auto-merged (review_required)
  const deduplicatedItems: DestinationSearchItem[] = [];

  for (const item of items) {
    let isDuplicate = false;
    for (let i = 0; i < deduplicatedItems.length; i++) {
      const judgment = classifyDestinationRelationship(item, deduplicatedItems[i]);
      if (judgment.relationship === 'same_entity' && judgment.confidence >= 0.95) {
        isDuplicate = true;
        // Keep internal over external if duplicate
        if (item.source === 'internal' && deduplicatedItems[i].source === 'external') {
          deduplicatedItems[i] = item;
        }
        break;
      }
    }
    if (!isDuplicate) {
      deduplicatedItems.push(item);
    }
  }

  // Step 2: Grouping items with 'related_scope' while keeping 'same_name_different_place' SEPARATE
  const groups: DestinationSearchItem[][] = [];

  for (const item of deduplicatedItems) {
    let assigned = false;

    for (const group of groups) {
      const anchor = group[0];
      const judgment = classifyDestinationRelationship(item, anchor);

      if (judgment.relationship === 'related_scope') {
        group.push(item);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      groups.push([item]);
    }
  }

  // Step 3: Build Final Results List with Intent-First Priority
  const finalResults: DestinationSearchItem[] = [];

  for (const group of groups) {
    if (group.length === 1) {
      finalResults.push(group[0]);
    } else {
      const baseName = getBaseName(group[0].names?.ko || group[0].displayName);

      // 1. Explicit search intent (Exact query match e.g. "미야코지마시", "미야코지마섬", "제주시")
      const exactQueryMatch = group.find((i) => {
        const nameKo = normalizeSearchText(i.names?.ko || i.displayName || '');
        const nameEn = normalizeSearchText(i.names?.en || '');
        return nameKo === normalizedQuery || nameEn === normalizedQuery;
      });

      // If user typed exact suffix or entity name (e.g. "제주시" or "미야코지마섬") -> return entity directly
      if (exactQueryMatch && normalizedQuery !== baseName) {
        finalResults.push(exactQueryMatch);
        continue;
      }

      let recommended: DestinationSearchItem | undefined = exactQueryMatch;

      if (!recommended) {
        recommended = group.find((i) => i.type === 'tourism_region');
      }

      if (!recommended) {
        recommended = group.find((i) => i.type === 'city') || group.find((i) => i.type === 'island') || group[0];
      }

      const alternatives = group
        .filter((i) => i !== recommended)
        .map((i) => ({
          source: i.source || 'internal',
          destinationId: i.destinationId,
          externalId: i.externalId,
          type: i.type || 'city',
          label: i.names?.ko || i.displayName,
          rawDestination: i.rawDestination,
        }));

      finalResults.push({
        isGroup: true,
        groupId: `group-${baseName}`,
        displayName: recommended.names?.ko || recommended.displayName,
        recommendedItem: {
          source: recommended.source || 'internal',
          destinationId: recommended.destinationId,
          externalId: recommended.externalId,
          type: recommended.type || 'city',
          label:
            recommended.type === 'tourism_region'
              ? `${baseName} 여행권역`
              : recommended.names?.ko || recommended.displayName,
          rawDestination: recommended.rawDestination,
        },
        alternatives,
        groupingReason: 'related_scope',
      });
    }
  }

  return finalResults;
}
