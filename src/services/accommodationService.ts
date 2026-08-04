import { TravelPlan, DayPlan, PlanItem } from '../types';

export interface LocationAnchor {
  type: 'accommodation' | 'airport' | 'station' | 'custom' | null;
  referenceId: string | null;
  name: string | null;
  placeId: string | null;
  address?: string | null;
  latitude: number | null;
  longitude: number | null;
  source: 'automatic' | 'manual';
}

export interface DailyAnchor {
  tripId?: string;
  date: string; // "YYYY-MM-DD"
  startLocation: LocationAnchor;
  endLocation: LocationAnchor;
  noReturnToday?: boolean;
  returnRouteInfo?: any;
}

export interface Accommodation {
  id: string;
  tripId: string;
  name: string;
  placeId: string | null;
  address: string;
  latitude: number;
  longitude: number;
  timezoneId: string;
  checkInDate: string; // "YYYY-MM-DD"
  checkOutDate: string; // "YYYY-MM-DD"
  checkInTime: string; // "15:00"
  checkOutTime: string; // "11:00"
  applyAsDayStart: boolean;
  applyAsDayEnd: boolean;
  addCheckInToTimeline: boolean;
  addCheckOutToTimeline: boolean;
  excludedDates: string[]; // dates ("YYYY-MM-DD") where user disabled auto-apply
  reservationNumber: string | null;
  phone: string | null;
  memo: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccommodationConflict {
  existingAcc: Accommodation;
  overlappingDates: string[];
}

/**
 * Normalizes various date strings (e.g. "2024. 10. 15", "2024.10.15", "2024-10-15") to "YYYY-MM-DD"
 */
export function normalizeDateToISO(dateStr: string): string {
  if (!dateStr) return '';
  const cleaned = dateStr.replace(/\./g, '-').replace(/\s+/g, '').replace(/\/+/g, '-');
  const parts = cleaned.split('-').filter(Boolean);
  if (parts.length === 3) {
    const year = parts[0].padStart(4, '20');
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return dateStr.trim();
}

/**
 * Returns list of stay nights [checkInDate, checkOutDate) (checkInDate inclusive, checkOutDate exclusive)
 */
export function getStayNights(checkInDate: string, checkOutDate: string): string[] {
  const normIn = normalizeDateToISO(checkInDate);
  const normOut = normalizeDateToISO(checkOutDate);
  const result: string[] = [];
  
  let current = new Date(`${normIn}T00:00:00`);
  const end = new Date(`${normOut}T00:00:00`);

  while (current < end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    result.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }
  return result;
}

/**
 * Helper to build a LocationAnchor from an Accommodation
 */
export function createAnchorFromAcc(acc: Accommodation, source: 'automatic' | 'manual' = 'automatic'): LocationAnchor {
  return {
    type: 'accommodation',
    referenceId: acc.id,
    name: acc.name,
    placeId: acc.placeId,
    address: acc.address,
    latitude: acc.latitude,
    longitude: acc.longitude,
    source,
  };
}

/**
 * Recalculates DailyAnchors for all days in a TravelPlan.
 * Preserves user's manual settings!
 */
export function recalculateDailyAnchors(
  days: DayPlan[],
  accommodations: Accommodation[] = [],
  existingAnchors: Record<string, DailyAnchor> = {}
): Record<string, DailyAnchor> {
  const newAnchors: Record<string, DailyAnchor> = { ...existingAnchors };

  days.forEach((day, index) => {
    const isoDate = normalizeDateToISO(day.date);
    const existing = newAnchors[isoDate] || {
      date: isoDate,
      startLocation: { type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' },
      endLocation: { type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' }
    };

    let startLoc = { ...existing.startLocation };
    let endLoc = { ...existing.endLocation };

    const isDayOne = day.dayNumber === 1 || index === 0;

    // 1. Calculate Auto Start Location if source is automatic
    if (startLoc.source !== 'manual') {
      if (isDayOne) {
        // Day 1 always starts from home/elsewhere, never auto-start from accommodation
        startLoc = { type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' };
      } else {
        // Priority 1: Check-out accommodation on this date
        const checkOutAcc = accommodations.find((acc) =>
          normalizeDateToISO(acc.checkOutDate) === isoDate &&
          acc.applyAsDayStart !== false &&
          !acc.excludedDates?.includes(isoDate)
        );

        // Priority 2: Stay night accommodation on this date (must be strictly after check-in day)
        const stayAcc = accommodations.find((acc) => {
          const checkIn = normalizeDateToISO(acc.checkInDate);
          const checkOut = normalizeDateToISO(acc.checkOutDate);
          return isoDate > checkIn && isoDate < checkOut &&
            acc.applyAsDayStart !== false &&
            !acc.excludedDates?.includes(isoDate);
        });

        if (checkOutAcc) {
          startLoc = createAnchorFromAcc(checkOutAcc, 'automatic');
        } else if (stayAcc) {
          startLoc = createAnchorFromAcc(stayAcc, 'automatic');
        } else if (startLoc.type === 'accommodation') {
          // Was mapped to accommodation before, but no longer applies
          startLoc = { type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' };
        }
      }
    }

    // 2. Calculate Auto End Location if source is automatic
    if (endLoc.source !== 'manual' && !existing.noReturnToday) {
      // Priority 1: Check-in accommodation on this date
      const checkInAcc = accommodations.find((acc) =>
        normalizeDateToISO(acc.checkInDate) === isoDate &&
        acc.applyAsDayEnd !== false &&
        !acc.excludedDates?.includes(isoDate)
      );

      // Priority 2: Stay night accommodation on this date
      const stayAcc = accommodations.find((acc) => {
        const checkIn = normalizeDateToISO(acc.checkInDate);
        const checkOut = normalizeDateToISO(acc.checkOutDate);
        return isoDate >= checkIn && isoDate < checkOut &&
          acc.applyAsDayEnd !== false &&
          !acc.excludedDates?.includes(isoDate);
      });

      if (checkInAcc) {
        endLoc = createAnchorFromAcc(checkInAcc, 'automatic');
      } else if (stayAcc) {
        endLoc = createAnchorFromAcc(stayAcc, 'automatic');
      } else if (endLoc.type === 'accommodation') {
        // Was mapped to accommodation before, but no longer applies
        endLoc = { type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' };
      }
    } else if (existing.noReturnToday && endLoc.source !== 'manual') {
      endLoc = { type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' };
    }

    newAnchors[isoDate] = {
      ...existing,
      date: isoDate,
      startLocation: startLoc,
      endLocation: endLoc
    };
  });

  return newAnchors;
}

/**
 * Checks if a new or updated accommodation overlaps on stay dates with existing ones
 */
export function checkAccommodationConflicts(
  existingAccommodations: Accommodation[],
  targetAcc: Accommodation
): AccommodationConflict | null {
  const targetNights = getStayNights(targetAcc.checkInDate, targetAcc.checkOutDate);
  if (targetNights.length === 0) return null;

  for (const existing of existingAccommodations) {
    if (existing.id === targetAcc.id) continue;
    const existingNights = getStayNights(existing.checkInDate, existing.checkOutDate);
    const overlapping = targetNights.filter((date) => existingNights.includes(date));

    if (overlapping.length > 0) {
      return {
        existingAcc: existing,
        overlappingDates: overlapping
      };
    }
  }

  return null;
}

/**
 * Checks for exact duplicate accommodation (same Place ID or same normalized name + address with overlapping dates)
 */
export function checkExactDuplicateAccommodation(
  existingAccommodations: Accommodation[],
  targetAcc: Accommodation
): boolean {
  const targetNights = getStayNights(targetAcc.checkInDate, targetAcc.checkOutDate);

  for (const existing of existingAccommodations) {
    if (existing.id === targetAcc.id) continue;

    const existingNights = getStayNights(existing.checkInDate, existing.checkOutDate);
    const isOverlappingDates = targetNights.some((d) => existingNights.includes(d));

    if (!isOverlappingDates) continue;

    // Check Place ID match
    if (targetAcc.placeId && existing.placeId && targetAcc.placeId === existing.placeId) {
      return true;
    }

    // Check Normalized Name + Address match
    const normTargetName = targetAcc.name.trim().toLowerCase();
    const normExistingName = existing.name.trim().toLowerCase();
    const normTargetAddr = (targetAcc.address || '').trim().toLowerCase();
    const normExistingAddr = (existing.address || '').trim().toLowerCase();

    if (normTargetName === normExistingName && normTargetAddr === normExistingAddr) {
      return true;
    }
  }

  return false;
}

/**
 * Synchronizes optional check-in/out timeline cards into plan days
 */
export function syncAccommodationTimelineItems(
  days: DayPlan[],
  acc: Accommodation,
  isDelete: boolean = false
): DayPlan[] {
  const normCheckIn = normalizeDateToISO(acc.checkInDate);
  const normCheckOut = normalizeDateToISO(acc.checkOutDate);

  const checkInCardId = `acc-checkin-${acc.id}`;
  const checkOutCardId = `acc-checkout-${acc.id}`;

  return days.map((day) => {
    const isoDate = normalizeDateToISO(day.date);
    let items = [...day.items];

    // Filter out previous auto-generated timeline items for this accommodation
    items = items.filter((item) => item.id !== checkInCardId && item.id !== checkOutCardId);

    if (!isDelete) {
      // Check-in day timeline item
      if (isoDate === normCheckIn && acc.addCheckInToTimeline) {
        const checkInItem: PlanItem = {
          id: checkInCardId,
          title: `호텔 체크인 (${acc.name})`,
          time: acc.checkInTime || '15:00',
          location: acc.name,
          locationAddress: acc.address,
          locationLatLng: { lat: acc.latitude, lng: acc.longitude },
          locationPlaceId: acc.placeId || undefined,
          stayDurationMinutes: 30,
          content: acc.memo || undefined,
        };
        items.push(checkInItem);
      }

      // Check-out day timeline item
      if (isoDate === normCheckOut && acc.addCheckOutToTimeline) {
        const checkOutItem: PlanItem = {
          id: checkOutCardId,
          title: `호텔 체크아웃 (${acc.name})`,
          time: acc.checkOutTime || '11:00',
          location: acc.name,
          locationAddress: acc.address,
          locationLatLng: { lat: acc.latitude, lng: acc.longitude },
          locationPlaceId: acc.placeId || undefined,
          stayDurationMinutes: 30,
          content: acc.memo || undefined,
        };
        items.push(checkOutItem);
      }
    }

    // Sort items by time
    items.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    return { ...day, items };
  });
}

/**
 * Calculates straight line distance in km between 2 lat/lng points
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
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
 * Estimates travel duration in minutes based on distance
 */
export function estimateTravelMinutes(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dist = calculateDistanceKm(lat1, lon1, lat2, lon2);
  if (dist <= 0.2) return 5;
  // Estimate ~30km/h average urban speed
  const mins = Math.ceil((dist / 30) * 60);
  return Math.max(10, Math.min(180, mins));
}

/**
 * Calculates suggested departure time and estimated arrival times for a day's anchor
 */
export interface DayAnchorMovementDetails {
  startToFirstItemTravelMins?: number;
  recommendedDepartureTime?: string;
  lastItemToReturnTravelMins?: number;
  estimatedReturnArrivalTime?: string;
  checkInTimeWarning?: string | null;
  checkOutTimeWarning?: string | null;
}

export function calculateAnchorMovementDetails(
  anchor: DailyAnchor,
  items: PlanItem[],
  prepBufferMins: number = 10,
  accommodations: Accommodation[] = []
): DayAnchorMovementDetails {
  const result: DayAnchorMovementDetails = {};
  if (!items || items.length === 0) return result;

  // 1. First item movement from startLocation
  const firstItem = items[0];
  if (
    anchor.startLocation &&
    anchor.startLocation.latitude !== null &&
    anchor.startLocation.longitude !== null &&
    firstItem.locationLatLng?.lat !== undefined &&
    firstItem.locationLatLng?.lng !== undefined
  ) {
    const travelMins = estimateTravelMinutes(
      anchor.startLocation.latitude,
      anchor.startLocation.longitude,
      firstItem.locationLatLng.lat,
      firstItem.locationLatLng.lng
    );
    result.startToFirstItemTravelMins = travelMins;

    // Calculate suggested departure time
    if (firstItem.time) {
      const firstItemMins = timeToMinutes(firstItem.time);
      let depMins = firstItemMins - travelMins - prepBufferMins;
      if (depMins < 0) depMins += 24 * 60;
      // Round to nearest 5 mins
      depMins = Math.round(depMins / 5) * 5;
      result.recommendedDepartureTime = minutesToTime(depMins);
    }
  }

  // 2. Last item movement to endLocation
  const lastItem = items[items.length - 1];
  if (
    anchor.endLocation &&
    anchor.endLocation.latitude !== null &&
    anchor.endLocation.longitude !== null &&
    lastItem.locationLatLng?.lat !== undefined &&
    lastItem.locationLatLng?.lng !== undefined
  ) {
    const travelMins = estimateTravelMinutes(
      lastItem.locationLatLng.lat,
      lastItem.locationLatLng.lng,
      anchor.endLocation.latitude,
      anchor.endLocation.longitude
    );
    result.lastItemToReturnTravelMins = travelMins;

    // Calculate estimated return arrival
    if (lastItem.time) {
      const lastItemStartMins = timeToMinutes(lastItem.time);
      const stayDuration = lastItem.stayDurationMinutes || 60;
      const arrMins = (lastItemStartMins + stayDuration + travelMins) % (24 * 60);
      result.estimatedReturnArrivalTime = minutesToTime(arrMins);
    }
  }

  // 3. Check-in & Check-out time warnings
  if (anchor.endLocation?.referenceId) {
    const acc = accommodations.find((a) => a.id === anchor.endLocation.referenceId);
    if (acc && normalizeDateToISO(acc.checkInDate) === anchor.date && result.estimatedReturnArrivalTime && acc.checkInTime) {
      const arrMins = timeToMinutes(result.estimatedReturnArrivalTime);
      const checkInMins = timeToMinutes(acc.checkInTime);
      if (arrMins < checkInMins) {
        result.checkInTimeWarning = `체크인 가능 시간(${acc.checkInTime})보다 이른 도착(${result.estimatedReturnArrivalTime})이에요.`;
      }
    }
  }

  if (anchor.startLocation?.referenceId) {
    const acc = accommodations.find((a) => a.id === anchor.startLocation.referenceId);
    if (acc && normalizeDateToISO(acc.checkOutDate) === anchor.date && result.recommendedDepartureTime && acc.checkOutTime) {
      const depMins = timeToMinutes(result.recommendedDepartureTime);
      const checkOutMins = timeToMinutes(acc.checkOutTime);
      if (depMins > checkOutMins) {
        result.checkOutTimeWarning = `체크아웃 시간(${acc.checkOutTime}) 이후까지 숙소에 머무는 일정이에요. (출발 추천: ${result.recommendedDepartureTime})`;
      }
    }
  }

  return result;
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toLowerCase();
  const isPM = cleaned.includes('pm') || cleaned.includes('오후');
  const isAM = cleaned.includes('am') || cleaned.includes('오전');

  const numbersOnly = cleaned.replace(/[apm오전오후\s]/g, '').trim();
  const parts = numbersOnly.split(':');
  if (parts.length === 0) return 0;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
  if (isNaN(hours)) return 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function minutesToTime(totalMins: number): string {
  let adjusted = totalMins;
  while (adjusted < 0) adjusted += 24 * 60;
  adjusted = adjusted % (24 * 60);

  const h = Math.floor(adjusted / 60);
  const m = Math.floor(adjusted % 60);

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
}
