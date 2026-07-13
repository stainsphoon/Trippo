export interface TravelLog {
  id: string;
  title: string;
  content: string;
  image?: string;
  location?: string;
  date: string;
  tag?: string; // e.g. "Nature", "Urban"
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export type TransportationType = 'taxi' | 'bus' | 'flight' | 'walk' | 'bike';

export interface PlanItem {
  id: string;
  title: string;
  time: string; // e.g. "10:30 AM" or "14:00"
  cost?: string; // e.g. "¥2,570"
  content?: string;
  duration?: string; // e.g. "30분" or "45분"
  transportation?: TransportationType;
  transportationLine?: string; // e.g. "도쿄 메트로 마루노우치선"
  checklist?: ChecklistItem[];
  images?: string[];
}

export interface DayPlan {
  dayNumber: number; // e.g. 1, 2, 3...
  date: string; // e.g. "2024. 10. 15" or "10/15"
  dayOfWeek: string; // e.g. "화", "수"
  items: PlanItem[];
}

export interface TravelPlan {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  durationText: string; // e.g. "5박 6일"
  days: DayPlan[];
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
