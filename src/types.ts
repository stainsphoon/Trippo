export interface DraggableStamp {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number; // rotation angle in degrees
}

export interface TravelLog {
  id: string;
  title: string;
  content: string;
  image?: string;
  location?: string;
  date: string;
  tag?: string; // e.g. "Nature", "Urban"
  stamps?: DraggableStamp[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export type TransportationType = 'taxi' | 'bus' | 'flight' | 'walk' | 'bike' | 'car';

export interface PlanItem {
  id: string;
  title: string;
  time: string; // e.g. "10:30 AM" or "14:00"
  stayDurationMinutes?: number;
  calculatedEndTime?: string;
  manualEndTime?: string;
  suggestedStartTime?: string;
  manualTimeOverride?: boolean;
  cost?: string; // e.g. "¥2,570"
  content?: string;
  duration?: string; // e.g. "30분" or "45분" (Travel Duration)
  fastestDurationMinutes?: number;
  representativeDurationMinutes?: number;
  planningDurationMinutes?: number;
  transportation?: TransportationType;
  transportationLine?: string; // e.g. "도쿄 메트로 마루노우치선"
  checklist?: ChecklistItem[];
  images?: string[];
  location?: string;
  locationAddress?: string;
  locationLatLng?: { lat: number; lng: number };
  locationPlaceId?: string;
  arrivalLocation?: string;
  arrivalLocationAddress?: string;
  arrivalLocationLatLng?: { lat: number; lng: number };
  arrivalLocationPlaceId?: string;
  isPseudoItem?: boolean;
  pseudoType?: 'start' | 'end';
  flightInfo?: any;
  manualDuration?: string;
  autoDuration?: string;
  autoDistance?: string;
  lastCalculatedAt?: string;
  calculatedAt?: string;
  departureTimeUsed?: string;
  routeStatus?: 'success' | 'none' | 'error';
  routeError?: boolean;
  isTrafficAware?: boolean;
  transitDebugInfo?: {
    routeCacheVersion?: string;
    transportation?: TransportationType;
    originPlaceId?: string;
    originLatLng?: { lat: number; lng: number };
    destinationPlaceId?: string;
    destinationLatLng?: { lat: number; lng: number };
    timezoneId?: string;
    localDepartureTime?: string;
    utcDepartureTime?: string;
    totalDuration?: string;
    firstTransitDepartureTime?: string;
    finalArrivalTime?: string;
    initialWaitSeconds?: number;
    totalWalkSeconds?: number;
    transferCount?: number;
    usedLines?: string[];
    accessWalkSeconds?: number;
    initialWaitSecondsBreakdown?: number;
    inVehicleSeconds?: number;
    transferWaitSeconds?: number;
    transferWalkSeconds?: number;
    egressWalkSeconds?: number;
    totalDurationSeconds?: number;
    scenarioPreferences?: string;
    alternatives?: any[];
  };
}

export interface DayPlan {
  dayNumber: number; // e.g. 1, 2, 3...
  date: string; // e.g. "2024. 10. 15" or "10/15"
  dayOfWeek: string; // e.g. "화", "수"
  items: PlanItem[];
}

export interface Companion {
  id: string;
  name: string;
  email?: string;
  isLocal?: boolean;
  photoURL?: string;
}

export interface PlanTimezone {
  id: string;
  name: string;
  rawOffsetSeconds: number;
  dstOffsetSeconds: number;
  resolvedAt: string;
}

import { Accommodation, DailyAnchor } from './services/accommodationService';
export type { Accommodation, DailyAnchor, LocationAnchor } from './services/accommodationService';

export interface TravelPlan {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  durationText: string; // e.g. "5박 6일"
  days: DayPlan[];
  companions?: Companion[];
  creatorId?: string;
  timezone?: PlanTimezone;
  accommodations?: Accommodation[];
  dailyAnchors?: Record<string, DailyAnchor>;
}

export interface CustomStamp {
  id: string;
  imageUrl: string;
  createdAt: number;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  rating: number;
  temperature: string;
  weatherType: 'sunny' | 'cloudy' | 'rainy';
  priceText: string;
  recommendationLevel: '매우 높음' | '높음' | '보통';
  image: string;
  tags: string[];
}
