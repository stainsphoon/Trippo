import { Timestamp } from "firebase/firestore";

export type DestinationType =
  | "country"
  | "admin_area"
  | "city"
  | "district"
  | "island"
  | "tourism_region";

export interface DestinationNames {
  ko: string;
  en: string;
  local?: string;
  displayKo?: string;
  officialKo?: string;
  displayEn?: string;
  officialEn?: string;
}

export interface DestinationAliases {
  ko: string[];
  en: string[];
  local: string[];
}

export interface DestinationHierarchy {
  countryCode: string;
  countryNameKo: string;
  countryNameEn: string;
  admin1Code?: string;
  admin1NameKo?: string;
  admin1NameEn?: string;
  admin2Code?: string;
  admin2NameKo?: string;
  admin2NameEn?: string;
  parentDestinationId?: string;
}

export interface CanonicalLocationProvenance {
  sourceProvider: "osm" | "trippo_curated" | "geonames" | "wikidata";
  sourceRecordId: string;
  licenseId: "ODbL-1.0" | "CC-BY-4.0" | "Trippo-Proprietary";
  licenseUrl: string;
  normalizedBy: "trippo";
  importedAt: Timestamp | string;
  verifiedAt: Timestamp | string;
}

export interface DestinationLocation {
  latitude: number;
  longitude: number;
  provenance?: CanonicalLocationProvenance;
  viewport?: {
    northeast: {
      latitude: number;
      longitude: number;
    };
    southwest: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface GoogleCoordinatesCache {
  googlePlaceId: string;
  latitude: number;
  longitude: number;
  source: "google_places_api";
  fetchedAt: Timestamp | string;
  expiresAt: Timestamp | string;
  refreshPolicy: "ttl_30d_refresh_on_query";
}

export interface DestinationProviderIds {
  googlePlaceId?: string;
  geonamesId?: string;
  wikidataId?: string;
}

export interface DestinationSearchData {
  normalizedNames: string[];
  prefixes: string[];
  tokens: string[];
}

export interface DestinationPopularity {
  globalScore: number;
  countryScore?: number;
  searchCount: number;
  recentSearchCount: number;
}

export interface CapabilityStatus {
  status: "verified" | "partial" | "pending" | "unsupported" | "error";
  provider: string | null;
}

export interface DestinationCapabilities {
  weather: CapabilityStatus | boolean;
  holidays: CapabilityStatus | boolean;
  festivals: CapabilityStatus | boolean;
  routes: CapabilityStatus | boolean;
  airQuality: CapabilityStatus | boolean;
}

export interface DestinationEventSearchContext {
  aliases: string[];
  includedAdminAreas: string[];
  includedDistricts: string[];
}

export interface DestinationSourceMetadata {
  primarySource: "geonames" | "google" | "manual" | "hybrid";
  verifiedAt?: string;
  providerRefreshedAt?: string;
}

export interface Destination {
  id: string;
  type: DestinationType;
  names: DestinationNames;
  aliases: DestinationAliases;
  pendingAliases?: string[];
  pendingAliasesMetadata?: PendingAliasMetadata[];
  normalizedNames?: string[];
  prefixes?: string[];
  tokens?: string[];
  hierarchySearchTokens?: string[];
  lifecycleStatus?: "provisional" | "enriching" | "active" | "limited" | "inactive" | "rejected" | "merged";
  searchable?: boolean;
  hierarchy: DestinationHierarchy;
  location: DestinationLocation;
  googleCoordinatesCache?: GoogleCoordinatesCache;
  timezoneId: string;
  providerIds: DestinationProviderIds;
  search: DestinationSearchData;
  popularity: DestinationPopularity;
  capabilities: DestinationCapabilities;
  eventSearchContext?: DestinationEventSearchContext;
  status: "active" | "limited" | "inactive" | "provisional";
  enrichment?: any;
  migrationVersion?: number;
  migratedAt?: string;
  sourceMetadata: DestinationSourceMetadata;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface DestinationSearchItem {
  source?: "internal" | "external";
  destinationId?: string;
  externalId?: string;
  type?: DestinationType;
  displayName: string;
  secondaryText?: string;
  names?: DestinationNames;
  countryCode?: string;
  timezoneId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  capabilities?: {
    weather: boolean;
    holidays: boolean;
    festivals: boolean;
    routes?: boolean;
    airQuality?: boolean;
  };
  rawDestination?: Destination;
  matchCategory?: 'strong' | 'contextual';
  isResolving?: boolean;
  isResolveError?: boolean;

  // Grouping fields
  groupId?: string;
  isGroup?: boolean;
  recommendedItem?: {
    source: "internal" | "external";
    destinationId?: string;
    externalId?: string;
    type: DestinationType;
    label: string;
    rawDestination?: Destination;
  };
  alternatives?: {
    source: "internal" | "external";
    destinationId?: string;
    externalId?: string;
    type: DestinationType;
    label: string;
    rawDestination?: Destination;
  }[];
  groupingReason?: string;
}

export interface DestinationAutocompleteResponse {
  query: string;
  status: "success" | "empty" | "empty_verified" | "external_error" | "unsupported_type" | "error" | "results_internal" | "results_external";
  items: DestinationSearchItem[];
  meta: {
    internalCount: number;
    externalCount: number;
    cacheHit: boolean;
  };
  message?: string;
}

export interface TourismRegion {
  id: string;
  names: DestinationNames;
  aliases: DestinationAliases;
  regionType: "island" | "resort_area" | "coastal_region" | "mountain_region" | "cultural_region";
  parentAdminAreas: string[];
  includedCities: string[];
  includedDistricts: string[];
  centroid: {
    latitude: number;
    longitude: number;
  };
  boundingBox?: {
    northeast: {
      latitude: number;
      longitude: number;
    };
    southwest: {
      latitude: number;
      longitude: number;
    };
  };
  weatherReferencePoint: {
    latitude: number;
    longitude: number;
  };
  holidayCountryCode: string;
  timezoneId: string;
  eventSearchAliases: string[];
}

export interface PendingAliasMetadata {
  alias: string;
  source: string;
  status: "pending" | "approved" | "rejected";
  searchable: boolean;
  selectionCount: number;
  createdAt: string;
  lastSelectedAt: string;
}

