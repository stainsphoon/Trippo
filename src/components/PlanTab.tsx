import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  CloudSun,
  MapPin,
  Clock,
  Wallet,
  Car,
  Bus,
  Train,
  Plane,
  Footprints,
  Bike,
  Plus,
  CheckCircle2,
  ChevronDown,
  Trash2,
  Copy,
  ChevronUp,
  X,
  FileEdit,
  ClipboardList,
  Image as ImageIcon,
  Check,
  Share2,
  Download,
  MoreVertical,
  MoreHorizontal,
  Search,
  UserPlus,
  Star,
  Minus,
  MessageCircle,
  Mail,
  AlertTriangle,
  Info,
  RefreshCw,
  Globe,
  PlaneTakeoff,
  PlaneLanding,
  Building2,
  ShieldCheck,
  Wrench
} from 'lucide-react';
import AccommodationModal from './AccommodationModal';
import DailyAnchorCard from './DailyAnchorCard';
import DailyAnchorModal from './DailyAnchorModal';
import AccommodationTestRunnerModal from './AccommodationTestRunnerModal';
import {
  Accommodation,
  DailyAnchor,
  recalculateDailyAnchors,
  checkAccommodationConflicts,
  syncAccommodationTimelineItems,
  normalizeDateToISO
} from '../services/accommodationService';

const AIRPORT_COORDINATES: Record<string, { lat: number; lng: number; nameKo: string; nameEn: string }> = {
  ICN: { lat: 37.4602, lng: 126.4407, nameKo: '인천국제공항 (ICN)', nameEn: "Incheon Int'l Airport (ICN)" },
  GMP: { lat: 37.5587, lng: 126.7945, nameKo: '김포국제공항 (GMP)', nameEn: "Gimpo Int'l Airport (GMP)" },
  PUS: { lat: 35.1795, lng: 128.9382, nameKo: '김해국제공항 (PUS)', nameEn: "Gimhae Int'l Airport (PUS)" },
  CJU: { lat: 33.5113, lng: 126.4930, nameKo: '제주국제공항 (CJU)', nameEn: "Jeju Int'l Airport (CJU)" },
  NRT: { lat: 35.7720, lng: 140.3929, nameKo: '나리타국제공항 (NRT)', nameEn: "Narita Int'l Airport (NRT)" },
  HND: { lat: 35.5494, lng: 139.7798, nameKo: '하네다공항 (HND)', nameEn: "Haneda Airport (HND)" },
  KIX: { lat: 34.4320, lng: 135.2304, nameKo: '간사이국제공항 (KIX)', nameEn: "Kansai Int'l Airport (KIX)" },
  CTS: { lat: 42.7752, lng: 141.6923, nameKo: '신치토세공항 (CTS)', nameEn: "New Chitose Airport (CTS)" },
  KUL: { lat: 2.7456, lng: 101.7099, nameKo: '쿠알라룸푸르국제공항 (KUL)', nameEn: "Kuala Lumpur Int'l Airport (KUL)" },
  SIN: { lat: 1.3644, lng: 103.9915, nameKo: '싱가포르 창이공항 (SIN)', nameEn: "Singapore Changi Airport (SIN)" },
  BKK: { lat: 13.6900, lng: 100.7501, nameKo: '수완나품공항 (BKK)', nameEn: "Suvarnabhumi Airport (BKK)" },
  LAX: { lat: 33.9416, lng: -118.4085, nameKo: '로스앤젤레스국제공항 (LAX)', nameEn: "Los Angeles Int'l Airport (LAX)" },
  JFK: { lat: 40.6413, lng: -73.7781, nameKo: '존 F. 케네디 국제공항 (JFK)', nameEn: "John F. Kennedy Int'l Airport (JFK)" },
  SYD: { lat: -33.9399, lng: 151.1753, nameKo: '시드니공항 (SYD)', nameEn: "Sydney Airport (SYD)" },
  ORD: { lat: 41.9742, lng: -87.9073, nameKo: "오헤어국제공항 (ORD)", nameEn: "O'Hare Int'l Airport (ORD)" },
  ZRH: { lat: 47.4582, lng: 8.5555, nameKo: '취리히공항 (ZRH)', nameEn: "Zurich Airport (ZRH)" },
};
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { toPng, toBlob } from 'html-to-image';
import { TravelPlan, PlanItem, DayPlan, TransportationType, ChecklistItem } from '../types';
import KakaoIcon from '../assets/images/kakaotalk_icon_1784287194798.jpg';
import { Language, translateText } from '../utils/translations';
import { getFlightInformation, recordManualFlightDuration, getFlightMetricsSummary, formatMinutesToDuration } from '../services/flightService';
import { searchUsers, subscribeToSyncStatus, getCloudSyncStatus, CloudSyncStatus } from '../lib/firebaseService';
import { auth } from '../lib/firebase';
import { isDeepEqual } from '../utils/deepEqual';
import { APIProvider } from '@vis.gl/react-google-maps';
import GooglePlaceInput from './GooglePlaceInput';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY' && GOOGLE_MAPS_API_KEY.trim() !== '';

const translateDayOfWeek = (dayOfWeek: string, lang: Language) => {
  if (lang === 'ko') return dayOfWeek;
  const mapping: Record<string, string> = {
    '일': 'Sun', '월': 'Mon', '화': 'Tue', '수': 'Wed', '목': 'Thu', '금': 'Fri', '토': 'Sat',
    '일요일': 'Sunday', '월요일': 'Monday', '화요일': 'Tuesday', '수요일': 'Wednesday', '목요일': 'Thursday', '금요일': 'Friday', '토요일': 'Saturday'
  };
  return mapping[dayOfWeek] || dayOfWeek;
};

const parseTimeToPickerState = (timeStr: string): { amPm: 'AM' | 'PM', hour: number, minute: number } => {
  if (!timeStr) return { amPm: 'AM', hour: 12, minute: 0 };
  const cleaned = timeStr.trim().toLowerCase();
  const isPM = cleaned.includes('pm') || cleaned.includes('오후');
  
  const numbersOnly = cleaned.replace(/[apm오전오후\s]/g, '').trim();
  const parts = numbersOnly.split(':');
  let hour = parts[0] ? parseInt(parts[0], 10) : 12;
  let minute = parts[1] ? parseInt(parts[1], 10) : 0;
  
  if (isNaN(hour) || hour < 1 || hour > 24) hour = 12;
  if (isNaN(minute) || minute < 0 || minute > 59) minute = 0;
  
  let amPm: 'AM' | 'PM' = 'AM';
  if (isPM) {
    amPm = 'PM';
    if (hour > 12) hour -= 12;
  } else {
    if (hour >= 12) {
      amPm = 'PM';
      if (hour > 12) hour -= 12;
    } else {
      amPm = 'AM';
      if (hour === 0) hour = 12;
    }
  }
  return { amPm, hour, minute };
};

const convertTimeToMinutes = (timeStr: string): number => {
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
  
  if (isPM) {
    if (hours < 12) {
      hours += 12;
    }
  } else if (isAM) {
    if (hours === 12) {
      hours = 0;
    }
  }
  return hours * 60 + minutes;
};

const convertMinutesToTime = (totalMinutes: number, language: 'ko' | 'en'): string => {
  let adjustedMins = totalMinutes;
  while (adjustedMins < 0) adjustedMins += 24 * 60;
  adjustedMins = adjustedMins % (24 * 60);
  
  let h = Math.floor(adjustedMins / 60);
  const m = Math.floor(adjustedMins % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  
  h = h % 12;
  if (h === 0) h = 12;
  
  const mStr = m.toString().padStart(2, '0');
  
  if (language === 'ko') {
    return `${ampm === 'AM' ? '오전' : '오후'} ${h}:${mStr}`;
  } else {
    return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
  }
};

const addMinutesToTime = (timeStr: string, addMins: number, language: 'ko' | 'en'): string => {
  const currentMins = convertTimeToMinutes(timeStr);
  return convertMinutesToTime(currentMins + addMins, language);
};

const parseTravelDurationToMins = (durStr: string | undefined): number => {
  if (!durStr) return 0;
  let mins = 0;
  const hMatch = durStr.match(/(\d+)\s*(h|시간)/i);
  const mMatch = durStr.match(/(\d+)\s*(m|분)/i);
  if (hMatch) mins += parseInt(hMatch[1]) * 60;
  if (mMatch) mins += parseInt(mMatch[1]);
  if (!hMatch && !mMatch) {
      const raw = parseInt(durStr);
      if (!isNaN(raw)) mins = raw;
  }
  return mins;
};

const recalculateSchedulesForDay = (items: PlanItem[], language: 'ko' | 'en'): PlanItem[] => {
  if (!items || items.length === 0) return [];
  
  let prevEndTime: string | null = null;

  return items.map((item, index) => {
    const newItem = { ...item };
    const prevItem = index > 0 ? items[index - 1] : null;

    // Check if prevItem is a flight item and determine effective end time after flight
    let effectivePrevEndTime = prevEndTime;
    if (prevItem) {
      const isPrevFlight = prevItem.transportation === 'flight' ||
        prevItem.title?.toLowerCase().includes('비행') ||
        prevItem.title?.toLowerCase().includes('flight');
      
      if (isPrevFlight) {
        const flightMins = prevItem.stayDurationMinutes ||
          parseTravelDurationToMins(prevItem.duration || prevItem.manualDuration || prevItem.autoDuration);
        if (flightMins > 0) {
          const flightStartTime = prevItem.time || '10:00 AM';
          effectivePrevEndTime = prevItem.manualEndTime || addMinutesToTime(flightStartTime, flightMins, language);
        }
      }
    }
    
    // Auto-populate stayDurationMinutes if this item itself is a flight or has duration set
    if (newItem.stayDurationMinutes === undefined) {
      const isSelfFlight = newItem.transportation === 'flight' ||
        newItem.title?.toLowerCase().includes('비행') ||
        newItem.title?.toLowerCase().includes('flight');
      if (isSelfFlight) {
        const flightMins = parseTravelDurationToMins(newItem.duration || newItem.manualDuration || newItem.autoDuration);
        if (flightMins > 0) {
          newItem.stayDurationMinutes = flightMins;
        }
      }
    }
    
    // 1. Calculate suggested start time based on effectivePrevEndTime + travel duration
    if (index > 0 && effectivePrevEndTime) {
      const travelMins = parseTravelDurationToMins(newItem.duration || newItem.manualDuration || newItem.autoDuration);
      newItem.suggestedStartTime = addMinutesToTime(effectivePrevEndTime, travelMins, language);
    } else {
      newItem.suggestedStartTime = undefined;
    }

    const effectiveStartTime = (newItem.manualTimeOverride ? newItem.time : newItem.suggestedStartTime) || newItem.time;
    
    if (newItem.suggestedStartTime && !newItem.manualTimeOverride) {
      newItem.time = newItem.suggestedStartTime;
    }

    // 3. Calculate calculatedEndTime
    if (newItem.stayDurationMinutes !== undefined) {
      newItem.calculatedEndTime = addMinutesToTime(effectiveStartTime, newItem.stayDurationMinutes, language);
    } else {
      newItem.calculatedEndTime = undefined;
    }
    
    prevEndTime = newItem.manualEndTime || newItem.calculatedEndTime || effectiveStartTime;
    
    return newItem;
  });
};

const getTimeOfDaySegment = (timeStr: string): 'morning' | 'day' | 'evening' | 'night' => {
  if (!timeStr) return 'day';
  
  const cleaned = timeStr.trim().toLowerCase();
  const isPM = cleaned.includes('pm') || cleaned.includes('오후');
  const isAM = cleaned.includes('am') || cleaned.includes('오전');
  
  const numbersOnly = cleaned.replace(/[apm오전오후\s]/g, '').trim();
  const parts = numbersOnly.split(':');
  if (parts.length === 0) return 'day';
  
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
  
  if (isNaN(hours)) return 'day';
  
  if (isPM) {
    if (hours < 12) {
      hours += 12;
    }
  } else if (isAM) {
    if (hours === 12) {
      hours = 0;
    }
  }
  
  const totalMinutes = hours * 60 + minutes;
  
  // 아침: 05:00 ~ 10:59 (300 mins to 659 mins)
  // 낮: 11:00 ~ 16:59 (660 mins to 1019 mins)
  // 저녁: 17:00 ~ 20:59 (1020 mins to 1259 mins)
  // 밤: 21:00 ~ 04:59 (1260 mins to 299 mins)
  if (totalMinutes >= 300 && totalMinutes <= 659) {
    return 'morning';
  } else if (totalMinutes >= 660 && totalMinutes <= 1019) {
    return 'day';
  } else if (totalMinutes >= 1020 && totalMinutes <= 1259) {
    return 'evening';
  } else {
    return 'night';
  }
};

const TimeScrollWheel = ({
  value,
  min,
  max,
  onChange,
  label,
  zeroPad = true
}: {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  label: string;
  zeroPad?: boolean;
}) => {
  const dragStartY = useRef<number | null>(null);
  const dragStartVal = useRef<number>(value);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    dragStartVal.current = value;
    if (e.currentTarget && typeof (e.currentTarget as HTMLElement).setPointerCapture === 'function') {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch (err) {
        console.warn("setPointerCapture failed in TimeScrollWheel:", err);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const deltaY = dragStartY.current - e.clientY;
    const stepSize = 18; // Smaller size for quick response
    const steps = Math.round(deltaY / stepSize);
    
    let newVal = dragStartVal.current + steps;
    const range = max - min + 1;
    
    while (newVal < min) newVal += range;
    while (newVal > max) newVal -= range;
    
    if (newVal !== value) {
      onChange(newVal);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragStartY.current = null;
    if (e.currentTarget && typeof (e.currentTarget as HTMLElement).releasePointerCapture === 'function') {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignored if pointer capture not set or released automatically
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    let newVal = value + direction;
    const range = max - min + 1;
    while (newVal < min) newVal += range;
    while (newVal > max) newVal -= range;
    onChange(newVal);
  };

  const getVisibleItems = () => {
    const items = [];
    const range = max - min + 1;
    for (let offset = -2; offset <= 2; offset++) {
      let val = value + offset;
      while (val < min) val += range;
      while (val > max) val -= range;
      items.push({ val, offset });
    }
    return items;
  };

  return (
    <div className="flex flex-col items-center select-none w-full">
      <span className="text-[10px] font-bold text-gray-400 dark:text-stone-500 mb-1.5 uppercase tracking-wider">
        {label}
      </span>
      
      <div 
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full h-32 bg-gray-50/60 dark:bg-app-bg rounded-2xl border border-gray-100 dark:border-subtle-border overflow-hidden flex flex-col items-center justify-center cursor-ns-resize touch-none"
      >
        {/* Sleek Top & Bottom Fading Gradient Overlays to give cylindrical mask look */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-50/95 via-gray-50/60 to-transparent dark:from-[#13121a] dark:via-[#13121a]/60 dark:to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50/95 via-gray-50/60 to-transparent dark:from-[#13121a] dark:via-[#13121a]/60 dark:to-transparent pointer-events-none z-10" />

        {/* Central highlight overlay */}
        <div className="absolute left-1.5 right-1.5 h-9 top-1/2 -translate-y-1/2 bg-blue-50/60 dark:bg-blue-950/25 rounded-xl pointer-events-none border border-blue-100/30 dark:border-blue-900/10 shadow-[inset_0_1px_2px_rgba(59,130,246,0.05)]" />

        {/* 3D cylindrical vertical view with perspective scroll animation */}
        <div className="relative flex flex-col items-center justify-center w-full h-full pointer-events-none z-0">
          {getVisibleItems().map(({ val, offset }) => {
            let opacity = 1;
            let scale = 1;
            let rotateX = 0;
            let translateY = 0;
            
            if (offset === 0) {
              opacity = 1;
              scale = 1.25;
              rotateX = 0;
              translateY = 0;
            } else if (Math.abs(offset) === 1) {
              opacity = 0.55;
              scale = 0.95;
              rotateX = offset * 25;
              translateY = offset * 2;
            } else if (Math.abs(offset) === 2) {
              opacity = 0.18;
              scale = 0.75;
              rotateX = offset * 50;
              translateY = offset * 4;
            }

            return (
              <div
                key={offset}
                className={`font-mono text-base transition-all duration-150 h-5 flex items-center justify-center ${
                  offset === 0 
                    ? 'text-blue-600 dark:text-blue-400 font-extrabold' 
                    : 'text-gray-400 dark:text-zinc-600 font-medium'
                }`}
                style={{
                  opacity,
                  transform: `perspective(100px) rotateX(${rotateX}deg) scale(${scale}) translateY(${translateY}px)`,
                }}
              >
                {zeroPad ? val.toString().padStart(2, '0') : val}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface PlanTabProps {
  plan: TravelPlan;
  onUpdatePlan: (updater: TravelPlan | ((prev: TravelPlan) => TravelPlan)) => void;
  language?: Language;
  isDarkMode?: boolean;
  sharedPlanId?: string | null;
  currentUserUid?: string;
  onExitSharedMode?: () => void;
  onStartSharedMode?: (silent?: boolean) => Promise<string | void>;
}

export default function PlanTab({
  plan,
  onUpdatePlan,
  language = 'ko',
  isDarkMode = false,
  sharedPlanId = null,
  currentUserUid,
  onExitSharedMode,
  onStartSharedMode
}: PlanTabProps) {
  const t = (key: Parameters<typeof translateText>[0], params?: Record<string, string | number>) => translateText(key, language, params);
  const [selectedDayNum, setSelectedDayNum] = useState(1);
  const [expandedItemId, setExpandedItemId] = useState<string | null>('item-1-1'); // Default open for demonstration
  
  // Share modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTheme, setShareTheme] = useState<'slate' | 'pink' | 'green' | 'midnight' | 'custom'>('slate');
  const [customStartColor, setCustomStartColor] = useState(() => {
    return localStorage.getItem('trippo_custom_theme_start') || '#a855f7';
  });
  const [customEndColor, setCustomEndColor] = useState(() => {
    return localStorage.getItem('trippo_custom_theme_end') || '#6366f1';
  });
  const [shareScope, setShareScope] = useState<'current' | 'all'>('current');
  const [isGenerating, setIsGenerating] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const shareCardCaptureRef = useRef<HTMLDivElement>(null);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Sheet states (for adding or editing items)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [sheetDayNum, setSheetDayNum] = useState(1);

  // Bottom sheet form fields
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('12:00 PM');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [pickerAmPm, setPickerAmPm] = useState<'AM' | 'PM'>('PM');
  const [pickerHour, setPickerHour] = useState(12);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [formCost, setFormCost] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTrans, setFormTrans] = useState<TransportationType>('walk');
  const [formTransLine, setFormTransLine] = useState('');
  const [formDuration, setFormDuration] = useState(''); // travel duration
  const [formStayDurationMinutes, setFormStayDurationMinutes] = useState<number | ''>(60);
  const [formEndTime, setFormEndTime] = useState<string>('01:00 PM');
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end'>('start');
  const [formManualTimeOverride, setFormManualTimeOverride] = useState(false);
  const [suggestedStartTime, setSuggestedStartTime] = useState<string | null>(null);
  const [formChecklist, setFormChecklist] = useState<ChecklistItem[]>([]);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formLocation, setFormLocation] = useState('');
  const [formLocationAddress, setFormLocationAddress] = useState('');
  const [formLocationLatLng, setFormLocationLatLng] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [formLocationPlaceId, setFormLocationPlaceId] = useState('');

  // Arrival location state (for flight)
  const [formArrivalLocation, setFormArrivalLocation] = useState('');
  const [formArrivalLocationAddress, setFormArrivalLocationAddress] = useState('');
  const [formArrivalLocationLatLng, setFormArrivalLocationLatLng] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [formArrivalLocationPlaceId, setFormArrivalLocationPlaceId] = useState('');
  const [newCheckItemText, setNewCheckItemText] = useState('');
  
  // Flight info state
  const [flightInfo, setFlightInfo] = useState<any>(null);
  const [isSearchingFlight, setIsSearchingFlight] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(plan.title);
  
  // Image gallery state
  const [viewingImages, setViewingImages] = useState<string[]>([]);

  // Accommodation schedule states
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Accommodation | null>(null);
  const [isAnchorModalOpen, setIsAnchorModalOpen] = useState(false);
  const [anchorModalDateIso, setAnchorModalDateIso] = useState<string>('');
  const [isTestRunnerModalOpen, setIsTestRunnerModalOpen] = useState(false);
  const [isChecklistOverviewOpen, setIsChecklistOverviewOpen] = useState(false);
  const [checklistDayNums, setChecklistDayNums] = useState<number[]>([1]);

  // Active day and dateIso helper
  const activeDay = plan.days.find((d) => Number(d.dayNumber) === Number(selectedDayNum)) || plan.days[0] || { dayNumber: 1, date: '', dayOfWeek: '', items: [] };
  const activeDayIso = normalizeDateToISO(activeDay.date);

  // Auto-sync anchors whenever plan accommodations or days change if missing
  useEffect(() => {
    if (plan.accommodations && plan.accommodations.length > 0) {
      const recalculated = recalculateDailyAnchors(plan.days, plan.accommodations, plan.dailyAnchors || {});
      if (!isDeepEqual(recalculated, plan.dailyAnchors)) {
        onUpdatePlan((currentPlan) => ({ ...currentPlan, dailyAnchors: recalculated }));
      }
    }
  }, [plan.accommodations?.length, plan.days.length, onUpdatePlan]);

  const handleSaveAccommodation = (acc: Accommodation, conflictResolution?: 'replace' | 'adjust' | 'keep_both') => {
    onUpdatePlan((currentPlan) => {
      let existingAccs = [...(currentPlan.accommodations || [])];

      if (conflictResolution === 'replace') {
        const conflict = checkAccommodationConflicts(existingAccs, acc);
        if (conflict) {
          existingAccs = existingAccs.filter((a) => a.id !== conflict.existingAcc.id);
        }
      } else if (conflictResolution === 'adjust') {
        const conflict = checkAccommodationConflicts(existingAccs, acc);
        if (conflict) {
          existingAccs = existingAccs.map((a) => {
            if (a.id === conflict.existingAcc.id) {
              return { ...a, checkOutDate: acc.checkInDate };
            }
            return a;
          });
        }
      }

      const index = existingAccs.findIndex((a) => a.id === acc.id);
      if (index >= 0) {
        existingAccs[index] = acc;
      } else {
        existingAccs.push(acc);
      }

      const updatedDays = syncAccommodationTimelineItems(currentPlan.days, acc, false);
      const updatedAnchors = recalculateDailyAnchors(updatedDays, existingAccs, currentPlan.dailyAnchors || {});

      return {
        ...currentPlan,
        days: updatedDays,
        accommodations: existingAccs,
        dailyAnchors: updatedAnchors
      };
    });
  };

  const handleDeleteAccommodation = (accId: string) => {
    onUpdatePlan((currentPlan) => {
      const targetAcc = currentPlan.accommodations?.find((a) => a.id === accId);
      const updatedAccs = (currentPlan.accommodations || []).filter((a) => a.id !== accId);

      let updatedDays = currentPlan.days;
      if (targetAcc) {
        updatedDays = syncAccommodationTimelineItems(currentPlan.days, targetAcc, true);
      }

      const updatedAnchors = recalculateDailyAnchors(updatedDays, updatedAccs, currentPlan.dailyAnchors || {});

      return {
        ...currentPlan,
        days: updatedDays,
        accommodations: updatedAccs,
        dailyAnchors: updatedAnchors
      };
    });
  };

  const handleSaveDailyAnchor = (dateIso: string, updatedAnchor: DailyAnchor) => {
    onUpdatePlan((currentPlan) => {
      const currentAnchors = currentPlan.dailyAnchors || {};
      const newAnchors = {
        ...currentAnchors,
        [dateIso]: updatedAnchor
      };

      return {
        ...currentPlan,
        dailyAnchors: newAnchors
      };
    });
  };

  // Helper to find first coordinate with lat and lng
  const findFirstCoordinate = (p: TravelPlan) => {
    for (const d of p.days) {
      for (const item of d.items) {
        if (item.locationLatLng && typeof item.locationLatLng.lat === 'number' && typeof item.locationLatLng.lng === 'number') {
          return item.locationLatLng;
        }
      }
    }
    return null;
  };

  // Timezone auto-resolver and manual resolver
  const handleResolveTimezoneManually = async () => {
    const coord = findFirstCoordinate(plan);
    if (!coord) {
      alert(language === 'ko' 
        ? "일정에 주소나 장소가 포함되어 있지 않아 시간대를 자동으로 조회할 수 없습니다. 장소를 먼저 추가해 주세요."
        : "Cannot resolve timezone. No locations with coordinates found in the itinerary yet."
      );
      return;
    }

    try {
      let idToken = '';
      const user = auth.currentUser;
      if (user) {
        idToken = await user.getIdToken();
      }

      const res = await fetch("/app-api/timezone/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ lat: coord.lat, lng: coord.lng })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Manual timezone resolution error:", errText);
        alert(language === 'ko'
          ? "시간대를 조회하는 데 실패했습니다. 다시 시도해 주세요."
          : "Failed to resolve timezone. Please try again."
        );
        return;
      }

      const data = await res.json();
      if (data.timezoneId) {
        onUpdatePlan({
          ...plan,
          timezone: {
            id: data.timezoneId,
            name: data.timezoneName,
            rawOffsetSeconds: data.rawOffsetSeconds,
            dstOffsetSeconds: data.dstOffsetSeconds,
            resolvedAt: new Date().toISOString()
          }
        });
        alert(language === 'ko'
          ? `시간대 조회가 완료되었습니다! (${data.timezoneName})`
          : `Timezone successfully updated to ${data.timezoneName}!`
        );
      }
    } catch (err) {
      console.error("Error manual resolving timezone:", err);
    }
  };

  // Determine first coordinate string to use as dependency instead of whole plan
  const firstCoord = plan ? findFirstCoordinate(plan) : null;
  const coordKey = firstCoord ? `${firstCoord.lat},${firstCoord.lng}` : null;
  const hasTimezone = !!plan?.timezone;

  useEffect(() => {
    const autoResolve = async () => {
      if (hasTimezone || !firstCoord) return;

      try {
        let idToken = '';
        const user = auth.currentUser;
        if (user) {
          idToken = await user.getIdToken();
        }

        const res = await fetch("/app-api/timezone/resolve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {})
          },
          body: JSON.stringify({ lat: firstCoord.lat, lng: firstCoord.lng })
        });

        if (!res.ok) {
          console.warn("Auto timezone resolution response not OK:", res.status);
          return;
        }

        const data = await res.json();
        if (data.timezoneId) {
          onUpdatePlan((currentPlan) => {
            if (currentPlan.timezone) return currentPlan; // Avoid overwriting if already set
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`[PlanMutation] source: timezone-update timestamp: ${Date.now()}`);
            }

            return {
              ...currentPlan,
              timezone: {
                id: data.timezoneId,
                name: data.timezoneName,
                rawOffsetSeconds: data.rawOffsetSeconds,
                dstOffsetSeconds: data.dstOffsetSeconds,
                resolvedAt: new Date().toISOString()
              }
            };
          });
        }
      } catch (err) {
        console.warn("Auto resolving timezone failed silently:", err);
      }
    };

    autoResolve();
  }, [coordKey, hasTimezone, onUpdatePlan]);

  // Cloud sync status state
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(getCloudSyncStatus());
  useEffect(() => {
    return subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
  }, []);

  // Coalesced route updates refs
  const pendingRouteUpdatesRef = useRef<Record<string, any>>({});
  const pendingRouteTimerRef = useRef<any>(null);

  const updatePlanItemRouteInfo = (
    itemId: string,
    updates: {
      autoDuration?: string;
      autoDistance?: string;
      manualDuration?: string | null;
      lastCalculatedAt?: string;
      calculatedAt?: string;
      departureTimeUsed?: string;
      routeStatus?: 'success' | 'none' | 'error';
      routeError?: boolean;
      isTrafficAware?: boolean;
      transitDebugInfo?: any;
      transportation?: TransportationType;
    }
  ) => {
    pendingRouteUpdatesRef.current[itemId] = {
      ...(pendingRouteUpdatesRef.current[itemId] || {}),
      ...updates
    };

    if (pendingRouteTimerRef.current) {
      clearTimeout(pendingRouteTimerRef.current);
    }

    pendingRouteTimerRef.current = setTimeout(() => {
      pendingRouteTimerRef.current = null;
      const allUpdates = { ...pendingRouteUpdatesRef.current };
      pendingRouteUpdatesRef.current = {};

      onUpdatePlan((currentPlan) => {
        let planModified = false;
        let updatedPlan = currentPlan;

        Object.entries(allUpdates).forEach(([targetItemId, itemUpdates]: [string, any]) => {
          if (targetItemId.startsWith('end-acc-')) {
            const dateIso = targetItemId.replace('end-acc-', '');
            const existingAnchors = updatedPlan.dailyAnchors || {};
            const anchor = existingAnchors[dateIso];
            if (anchor) {
              planModified = true;
              updatedPlan = {
                ...updatedPlan,
                dailyAnchors: {
                  ...existingAnchors,
                  [dateIso]: {
                    ...anchor,
                    returnRouteInfo: { ...anchor.returnRouteInfo, ...itemUpdates }
                  }
                }
              };
            }
            return;
          }

          const updatedDays = updatedPlan.days.map((day) => {
            const hasItem = day.items.some((it) => it.id === targetItemId);
            if (!hasItem) return day;

            planModified = true;
            const updatedItems = day.items.map((it) => {
              if (it.id === targetItemId) {
                const merged = { ...it };
                if (itemUpdates.transportation !== undefined) merged.transportation = itemUpdates.transportation;
                if (itemUpdates.autoDuration !== undefined) {
                  merged.autoDuration = itemUpdates.autoDuration;
                  if (!merged.manualDuration) merged.duration = itemUpdates.autoDuration;
                }
                if (itemUpdates.autoDistance !== undefined) merged.autoDistance = itemUpdates.autoDistance;
                if (itemUpdates.lastCalculatedAt !== undefined) merged.lastCalculatedAt = itemUpdates.lastCalculatedAt;
                if (itemUpdates.calculatedAt !== undefined) merged.calculatedAt = itemUpdates.calculatedAt;
                if (itemUpdates.departureTimeUsed !== undefined) merged.departureTimeUsed = itemUpdates.departureTimeUsed;
                if (itemUpdates.routeStatus !== undefined) merged.routeStatus = itemUpdates.routeStatus;
                if (itemUpdates.routeError !== undefined) merged.routeError = itemUpdates.routeError;
                if (itemUpdates.isTrafficAware !== undefined) merged.isTrafficAware = itemUpdates.isTrafficAware;
                if (itemUpdates.transitDebugInfo !== undefined) merged.transitDebugInfo = itemUpdates.transitDebugInfo;

                if (itemUpdates.manualDuration === null) {
                  delete merged.manualDuration;
                  merged.duration = merged.autoDuration;
                } else if (itemUpdates.manualDuration !== undefined) {
                  merged.manualDuration = itemUpdates.manualDuration;
                  merged.duration = itemUpdates.manualDuration;
                }
                return merged;
              }
              return it;
            });
            return { ...day, items: recalculateSchedulesForDay(updatedItems, language) };
          });

          if (planModified) {
            updatedPlan = { ...updatedPlan, days: updatedDays };
          }
        });

        return planModified ? updatedPlan : currentPlan;
      });
    }, 300);
  };

  // Companion Bottom Sheet states
  const [isCompanionSheetOpen, setIsCompanionSheetOpen] = useState(false);
  const [companionSearchTerm, setCompanionSearchTerm] = useState('');
  const [companionSearchResults, setCompanionSearchResults] = useState<any[]>([]);
  const [isSearchingCompanions, setIsSearchingCompanions] = useState(false);
  const [isCreatingLocalCompanion, setIsCreatingLocalCompanion] = useState(false);
  const [localCompanionName, setLocalCompanionName] = useState('');
  const [localCompanionPhoto, setLocalCompanionPhoto] = useState<string | null>(null);

  // Friend List State (populated automatically & manually)
  const [favoriteUsers, setFavoriteUsers] = useState<any[]>(() => {
    try {
      const savedFriends = localStorage.getItem('trippo_friends');
      if (savedFriends) return JSON.parse(savedFriends);
      
      const savedFavs = localStorage.getItem('trippo_favorite_users');
      if (savedFavs) {
        const parsed = JSON.parse(savedFavs);
        localStorage.setItem('trippo_friends', JSON.stringify(parsed));
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isFormInitialized, setIsFormInitialized] = useState(false);

  useEffect(() => {
    if (isSheetOpen) {
      const timer = setTimeout(() => {
        setIsFormInitialized(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsFormInitialized(false);
    }
  }, [isSheetOpen]);

  const getPreviousItemForForm = () => {
    const sheetDay = plan.days.find((d) => Number(d.dayNumber) === Number(sheetDayNum));
    if (!sheetDay) return null;

    const sheetDayIso = normalizeDateToISO(sheetDay.date);
    const anchor = plan.dailyAnchors?.[sheetDayIso];

    if (sheetDay.items.length === 0) {
      if (anchor?.startLocation?.name) {
        const startLoc = anchor.startLocation;
        return {
          id: `start-acc-${sheetDayIso}`,
          title: `${startLoc.name} (${language === 'ko' ? '숙소 출발' : 'Acc. Departure'})`,
          location: startLoc.name,
          locationPlaceId: startLoc.placeId || undefined,
          locationLatLng: startLoc.latitude && startLoc.longitude ? { lat: startLoc.latitude, lng: startLoc.longitude } : undefined,
          time: '09:00 AM',
          isPseudoItem: true,
          pseudoType: 'start'
        } as PlanItem;
      }
      return null;
    }

    if (!editingItem) {
      // For a new item, the previous item is the chronologically last item of the day
      const sorted = [...sheetDay.items].sort(
        (a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time)
      );
      return sorted[sorted.length - 1];
    } else {
      // For an existing item, it is the item that precedes it in the current sorted schedule
      const sorted = [...sheetDay.items].sort(
        (a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time)
      );
      const currentIndex = sorted.findIndex((it) => it.id === editingItem.id);
      if (currentIndex > 0) {
        return sorted[currentIndex - 1];
      }
      
      // If it is the first actual item, is there a start accommodation?
      if (currentIndex === 0 && anchor?.startLocation?.name) {
        const startLoc = anchor.startLocation;
        return {
          id: `start-acc-${sheetDayIso}`,
          title: `${startLoc.name} (${language === 'ko' ? '숙소 출발' : 'Acc. Departure'})`,
          location: startLoc.name,
          locationPlaceId: startLoc.placeId || undefined,
          locationLatLng: startLoc.latitude && startLoc.longitude ? { lat: startLoc.latitude, lng: startLoc.longitude } : undefined,
          time: '09:00 AM',
          isPseudoItem: true,
          pseudoType: 'start'
        } as PlanItem;
      }
      return null;
    }
  };

  useEffect(() => {
    if (!isFormInitialized || !isSheetOpen) return;

    const mode = formTrans;

    if (mode === 'flight') {
      if (flightInfo) {
        const cleanDuration = flightInfo.duration
          ? flightInfo.duration.replace(/^예정 비행시간\s*/, '').replace(/^approx\.\s*/, '')
          : (flightInfo.durationMinutes ? formatMinutesToDuration(flightInfo.durationMinutes, language) : '');
        if (cleanDuration) {
          setFormDuration(cleanDuration);
          return;
        }
      }

      if (formLocationLatLng && formArrivalLocationLatLng) {
        const distKm = getHaversineDistance(
          formLocationLatLng.lat,
          formLocationLatLng.lng,
          formArrivalLocationLatLng.lat,
          formArrivalLocationLatLng.lng
        );
        const flightHours = distKm / 800;
        const totalMinutes = Math.round(flightHours * 60 + 30);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        
        let durStr = '';
        if (language === 'ko') {
          durStr = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
        } else {
          durStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        }
        setFormDuration(durStr);
      }
      return;
    }

    if (!formLocationLatLng) return;

    const prevItem = getPreviousItemForForm();
    if (!prevItem) return;

    let prevLat: number | undefined;
    let prevLng: number | undefined;

    if (prevItem.transportation === 'flight') {
      prevLat = prevItem.arrivalLocationLatLng?.lat;
      prevLng = prevItem.arrivalLocationLatLng?.lng;

      if (prevLat === undefined || prevLng === undefined) {
        const arrAirport = prevItem.flightInfo?.arrivalAirport;
        if (arrAirport && AIRPORT_COORDINATES[arrAirport]) {
          prevLat = AIRPORT_COORDINATES[arrAirport].lat;
          prevLng = AIRPORT_COORDINATES[arrAirport].lng;
        } else if (prevItem.arrivalLocation) {
          for (const [code, meta] of Object.entries(AIRPORT_COORDINATES)) {
            if (
              prevItem.arrivalLocation.includes(code) ||
              prevItem.arrivalLocation.includes(meta.nameKo) ||
              prevItem.arrivalLocation.includes(meta.nameEn)
            ) {
              prevLat = meta.lat;
              prevLng = meta.lng;
              break;
            }
          }
        }
      }

      if (prevLat === undefined || prevLng === undefined) {
        prevLat = prevItem.locationLatLng?.lat;
        prevLng = prevItem.locationLatLng?.lng;
      }
    } else {
      prevLat = prevItem.locationLatLng?.lat;
      prevLng = prevItem.locationLatLng?.lng;
    }

    if (prevLat === undefined || prevLng === undefined) return;

    const lat1 = prevLat;
    const lng1 = prevLng;
    const lat2 = formLocationLatLng.lat;
    const lng2 = formLocationLatLng.lng;

    if (hasValidMapsKey && typeof window !== 'undefined' && (window as any).google?.maps) {
      try {
        const g = (window as any).google;
        let googleMode = g.maps.TravelMode.WALKING;
        if (mode === 'taxi' || mode === 'car') {
          googleMode = g.maps.TravelMode.DRIVING;
        } else if (mode === 'bus') {
          googleMode = g.maps.TravelMode.TRANSIT;
        } else if (mode === 'bike') {
          googleMode = g.maps.TravelMode.BICYCLING;
        }

        const request: any = {
          origins: [new g.maps.LatLng(lat1, lng1)],
          destinations: [new g.maps.LatLng(lat2, lng2)],
          travelMode: googleMode,
        };

        if (googleMode === g.maps.TravelMode.TRANSIT) {
          request.transitOptions = {
            departureTime: new Date()
          };
        }

        const service = new g.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          request,
          (response: any, status: string) => {
            if (status === 'OK' && response && response.rows?.[0]?.elements?.[0]) {
              const element = response.rows[0].elements[0];
              if (element.status === 'OK' && element.duration && element.duration.value) {
                const totalMinutes = Math.round(element.duration.value / 60);
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                let durStr = '';
                if (language === 'ko') {
                  durStr = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
                } else {
                  durStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                }
                setFormDuration(durStr);
              } else {
                const distKm = getHaversineDistance(lat1, lng1, lat2, lng2);
                const durStr = getFallbackDuration(distKm, mode, language);
                setFormDuration(durStr.replace(/^약\s*/, '').replace(/^approx\.\s*/, ''));
              }
            } else {
              const distKm = getHaversineDistance(lat1, lng1, lat2, lng2);
              const durStr = getFallbackDuration(distKm, mode, language);
              setFormDuration(durStr.replace(/^약\s*/, '').replace(/^approx\.\s*/, ''));
            }
          }
        );
      } catch (err) {
        console.error('Error auto-calculating duration:', err);
        const distKm = getHaversineDistance(lat1, lng1, lat2, lng2);
        const durStr = getFallbackDuration(distKm, mode, language);
        setFormDuration(durStr.replace(/^약\s*/, '').replace(/^approx\.\s*/, ''));
      }
    } else {
      const distKm = getHaversineDistance(lat1, lng1, lat2, lng2);
      const durStr = getFallbackDuration(distKm, mode, language);
      setFormDuration(durStr.replace(/^약\s*/, '').replace(/^approx\.\s*/, ''));
    }
  }, [plan, formLocationLatLng, formArrivalLocationLatLng, formTrans, formTime, isFormInitialized, isSheetOpen, language, hasValidMapsKey, sheetDayNum, flightInfo]);

  // Auto-calculate suggested start time based on route duration
  useEffect(() => {
    if (!isSheetOpen || !isFormInitialized) return;
    const prevItem = getPreviousItemForForm();
    if (!prevItem) return;

    const parseTravelDuration = (durStr: string) => {
      if (!durStr) return 0;
      let mins = 0;
      const hMatch = durStr.match(/(\d+)\s*(h|시간)/i);
      const mMatch = durStr.match(/(\d+)\s*(m|분)/i);
      if (hMatch) mins += parseInt(hMatch[1]) * 60;
      if (mMatch) mins += parseInt(mMatch[1]);
      if (!hMatch && !mMatch) {
         const raw = parseInt(durStr);
         if (!isNaN(raw)) mins = raw;
      }
      return mins;
    };
    
    const travelMins = parseTravelDuration(formDuration);
    
    const prevEndTime = prevItem.manualEndTime || prevItem.calculatedEndTime || (prevItem.stayDurationMinutes ? addMinutesToTime(prevItem.time, prevItem.stayDurationMinutes, language) : prevItem.time);
    const suggested = addMinutesToTime(prevEndTime, travelMins, language);
    setSuggestedStartTime(suggested); console.log("AUTO CALC TIME:", { prevEndTime, travelMins, suggested, formManualTimeOverride });
    
    // Only auto-fill if the user hasn't manually overridden the time
    if (!formManualTimeOverride) {
      setFormTime(suggested);
    }
  }, [plan, formDuration, isSheetOpen, isFormInitialized, language, sheetDayNum, formManualTimeOverride]);

  // Automatically add plan companions to the local friend list if they are registered users
  useEffect(() => {
    if (plan && plan.companions && plan.companions.length > 0) {
      setFavoriteUsers((prevFriends) => {
        let updated = [...prevFriends];
        let changed = false;
        plan.companions?.forEach((comp) => {
          const alreadyInFriends = updated.some(u => u.uid === comp.id || u.id === comp.id);
          const isMe = auth.currentUser && (auth.currentUser.uid === comp.id || auth.currentUser.email === comp.email);
          
          if (!comp.isLocal && !alreadyInFriends && !isMe) {
            updated.push({
              uid: comp.id,
              displayName: comp.name,
              email: comp.email || '',
              photoURL: ''
            });
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('trippo_friends', JSON.stringify(updated));
          localStorage.setItem('trippo_favorite_users', JSON.stringify(updated));
          return updated;
        }
        return prevFriends;
      });
    }
  }, [plan?.companions]);

  const removeFriend = (uid: string) => {
    setFavoriteUsers((prev) => {
      const updated = prev.filter((u) => u.uid !== uid);
      localStorage.setItem('trippo_friends', JSON.stringify(updated));
      localStorage.setItem('trippo_favorite_users', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddCompanion = (userObj: any) => {
    const currentCompanions = plan.companions || [];
    const uid = userObj.uid || userObj.id;
    if (currentCompanions.some((c) => c.id === uid)) {
      alert(language === 'ko' ? '이미 추가된 일행입니다.' : 'This companion is already added.');
      return;
    }
    const newCompanion = {
      id: uid,
      name: userObj.displayName || userObj.name || 'Unknown',
      photoURL: userObj.photoURL || undefined,
      email: userObj.email,
      isLocal: false
    };
    const updatedCompanions = [...currentCompanions, newCompanion];
    onUpdatePlan((currentPlan) => ({ ...currentPlan, companions: updatedCompanions }));
  };

  const handleAddLocalCompanion = () => {
    if (!localCompanionName.trim()) {
      alert(language === 'ko' ? '일행 이름을 입력해주세요.' : 'Please enter companion name.');
      return;
    }
    const currentCompanions = plan.companions || [];
    const newCompanion = {
      id: `local-${Date.now()}`,
      name: localCompanionName.trim(),
      photoURL: localCompanionPhoto || undefined,
      isLocal: true
    };
    const updatedCompanions = [...currentCompanions, newCompanion];
    onUpdatePlan((currentPlan) => ({ ...currentPlan, companions: updatedCompanions }));
    setLocalCompanionName('');
    setLocalCompanionPhoto(null);
    setIsCreatingLocalCompanion(false);
  };

  const handleRemoveCompanion = (id: string) => {
    onUpdatePlan((currentPlan) => {
      const currentCompanions = currentPlan.companions || [];
      const updatedCompanions = currentCompanions.filter((c) => c.id !== id);
      return { ...currentPlan, companions: updatedCompanions };
    });
  };

  useEffect(() => {
    if (isCompanionSheetOpen && !sharedPlanId && onStartSharedMode) {
      onStartSharedMode(true).catch(console.error);
    }
  }, [isCompanionSheetOpen, sharedPlanId, onStartSharedMode]);

  useEffect(() => {
    if (!activeMenuId) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.menu-trigger-${activeMenuId}`) && !target.closest(`.menu-dropdown-${activeMenuId}`)) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('click', handleOutsideClick, true);
    return () => {
      document.removeEventListener('click', handleOutsideClick, true);
    };
  }, [activeMenuId]);

  const activeCardTheme = {
    slate: {
      name: '네이비',
      bgDot: 'bg-[#1a2238]',
      cardBgClass: 'bg-[#1a2238] text-white',
      style: { background: '#1a2238' },
      isLight: false,
      textClass: 'text-white',
      subTextClass: 'text-white/70',
      headerSubTextClass: 'text-white/90',
      borderClass: 'border-white/10',
      notchBg: 'bg-gray-100',
      dividerClass: 'border-white/20',
      badgeClass: 'bg-white/15 border-white/10 text-white',
      innerBoxClass: 'bg-black/15 border-white/10',
      barcodeClass: 'bg-white',
      timelineNodeBg: 'bg-white/25 border-white/60',
      timelineDotBg: 'bg-white',
      textMutedClass: 'text-white/40',
      textSystemMutedClass: 'text-white/50'
    },
    pink: {
      name: '아이보리',
      bgDot: 'bg-[#FAF9F6] border border-stone-200',
      cardBgClass: 'bg-[#FAF9F6] text-stone-800 border border-stone-200/50',
      style: { background: '#FAF9F6' },
      isLight: true,
      textClass: 'text-stone-800',
      subTextClass: 'text-stone-500 font-medium',
      headerSubTextClass: 'text-stone-600 font-bold',
      borderClass: 'border-stone-200',
      notchBg: 'bg-gray-100',
      dividerClass: 'border-stone-200',
      badgeClass: 'bg-stone-100 border-stone-200/60 text-stone-700',
      innerBoxClass: 'bg-stone-50 border-stone-150',
      barcodeClass: 'bg-stone-800',
      timelineNodeBg: 'bg-stone-200 border-stone-400',
      timelineDotBg: 'bg-stone-700',
      textMutedClass: 'text-stone-400',
      textSystemMutedClass: 'text-stone-400'
    },
    green: {
      name: '세이지',
      bgDot: 'bg-[#202c25]',
      cardBgClass: 'bg-[#202c25] text-white',
      style: { background: '#202c25' },
      isLight: false,
      textClass: 'text-white',
      subTextClass: 'text-white/70',
      headerSubTextClass: 'text-white/90',
      borderClass: 'border-white/10',
      notchBg: 'bg-gray-100',
      dividerClass: 'border-white/20',
      badgeClass: 'bg-white/15 border-white/10 text-white',
      innerBoxClass: 'bg-black/15 border-white/10',
      barcodeClass: 'bg-white',
      timelineNodeBg: 'bg-white/25 border-white/60',
      timelineDotBg: 'bg-white',
      textMutedClass: 'text-white/40',
      textSystemMutedClass: 'text-white/50'
    },
    midnight: {
      name: '차콜',
      bgDot: 'bg-[#16161a]',
      cardBgClass: 'bg-[#16161a] text-white',
      style: { background: '#16161a' },
      isLight: false,
      textClass: 'text-white',
      subTextClass: 'text-white/70',
      headerSubTextClass: 'text-white/90',
      borderClass: 'border-white/10',
      notchBg: 'bg-gray-100',
      dividerClass: 'border-white/20',
      badgeClass: 'bg-white/15 border-white/10 text-white',
      innerBoxClass: 'bg-black/15 border-white/10',
      barcodeClass: 'bg-white',
      timelineNodeBg: 'bg-white/25 border-white/60',
      timelineDotBg: 'bg-white',
      textMutedClass: 'text-white/40',
      textSystemMutedClass: 'text-white/50'
    },
    custom: {
      name: '커스텀',
      bgDot: '',
      cardBgClass: 'text-white',
      style: { background: `linear-gradient(135deg, ${customStartColor}, ${customEndColor})` },
      isLight: false,
      textClass: 'text-white',
      subTextClass: 'text-white/70',
      headerSubTextClass: 'text-white/90',
      borderClass: 'border-white/10',
      notchBg: 'bg-gray-100',
      dividerClass: 'border-white/20',
      badgeClass: 'bg-white/15 border-white/10 text-white',
      innerBoxClass: 'bg-black/15 border-white/10',
      barcodeClass: 'bg-white',
      timelineNodeBg: 'bg-white/25 border-white/60',
      timelineDotBg: 'bg-white',
      textMutedClass: 'text-white/40',
      textSystemMutedClass: 'text-white/50'
    }
  }[shareTheme];

  const handleSaveTitle = () => {
    if (!titleInput.trim()) {
      setTitleInput(plan?.title || '');
      setIsEditingTitle(false);
      return;
    }
    onUpdatePlan((currentPlan) => ({ ...currentPlan, title: titleInput.trim() }));
    setIsEditingTitle(false);
  };

  const handleFlightSearch = async (forceRefresh: boolean = false) => {
    if (!formTransLine.trim()) return;
    setIsSearchingFlight(true);
    setFlightInfo(null);
    setSearchMessage(null);
    try {
        const depDate = plan?.startDate || new Date().toISOString().slice(0, 10);
        const info = await getFlightInformation(formTransLine, depDate, { forceRefresh });
        if (info) {
            setFlightInfo(info);
            const cleanDuration = info.duration
              ? info.duration.replace(/^예정 비행시간\s*/, '').replace(/^approx\.\s*/, '')
              : (info.durationMinutes ? formatMinutesToDuration(info.durationMinutes, language) : '');
            setFormDuration(cleanDuration || info.duration);
            if (info.durationMinutes) {
              setFormStayDurationMinutes(info.durationMinutes);
            }

            const getAirportMeta = (airportStr: string) => {
              if (!airportStr) return null;
              const clean = airportStr.trim();
              const codeUpper = clean.toUpperCase();
              if (AIRPORT_COORDINATES[codeUpper]) return AIRPORT_COORDINATES[codeUpper];
              return Object.values(AIRPORT_COORDINATES).find((m) => {
                return (
                  m.nameKo.includes(clean) ||
                  clean.includes(m.nameKo) ||
                  m.nameEn.toLowerCase().includes(clean.toLowerCase()) ||
                  clean.toLowerCase().includes(m.nameEn.toLowerCase())
                );
              }) || null;
            };

            // Populate Departure location (출발지)
            if (info.departureAirport) {
              const meta = getAirportMeta(info.departureAirport);
              const name = meta ? (language === 'ko' ? meta.nameKo : meta.nameEn) : info.departureAirport;
              setFormLocation(name);
              if (meta) {
                setFormLocationLatLng({ lat: meta.lat, lng: meta.lng });
              } else {
                geocodeAddress(info.departureAirport).then((coords) => {
                  if (coords) setFormLocationLatLng(coords);
                });
              }
            }

            // Populate Arrival location (도착지)
            if (info.arrivalAirport) {
              const meta = getAirportMeta(info.arrivalAirport);
              const name = meta ? (language === 'ko' ? meta.nameKo : meta.nameEn) : info.arrivalAirport;
              setFormArrivalLocation(name);
              if (meta) {
                setFormArrivalLocationLatLng({ lat: meta.lat, lng: meta.lng });
              } else {
                geocodeAddress(info.arrivalAirport).then((coords) => {
                  if (coords) setFormArrivalLocationLatLng(coords);
                });
              }
            }
        } else {
            setSearchMessage(
              language === 'ko'
                ? '해당 날짜의 항공편 정보를 찾지 못했어요. 직접 입력해 주세요.'
                : 'Could not find flight information for this date. Please enter manually.'
            );
        }
    } catch (e) {
        console.error('Error during flight search:', e);
        setSearchMessage(
          language === 'ko'
            ? '해당 날짜의 항공편 정보를 찾지 못했어요. 직접 입력해 주세요.'
            : 'Could not find flight information for this date. Please enter manually.'
        );
    } finally {
        setIsSearchingFlight(false);
    }
  };

  const handleToggleItemCheck = (dayNum: number, itemId: string, chkId: string) => {
    const updatedDays = plan.days.map((day) => {
      if (Number(day.dayNumber) !== Number(dayNum)) return day;
      return {
        ...day,
        items: day.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            checklist: item.checklist?.map((chk) => {
              if (chk.id !== chkId) return chk;
              return { ...chk, checked: !chk.checked };
            })
          };
        })
      };
    });
    onUpdatePlan({ ...plan, days: updatedDays });
  };

  const handleToggleAccordion = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  const [localReorderedItems, setLocalReorderedItems] = useState<PlanItem[] | null>(null);

  const handleReorderItems = (reorderedItems: PlanItem[]) => {
    if (!isEditMode) return;
    setLocalReorderedItems(reorderedItems);
  };

  const handleCommitReorder = () => {
    if (!localReorderedItems) return;
    const itemsToCommit = localReorderedItems;
    setLocalReorderedItems(null);

    const realItems = itemsToCommit.filter((item) => !item.isPseudoItem);

    onUpdatePlan((currentPlan) => {
      const targetDay = currentPlan.days.find(d => Number(d.dayNumber) === Number(selectedDayNum));
      if (!targetDay) return currentPlan;

      if (realItems.length !== targetDay.items.length) {
        return currentPlan;
      }

      const updatedDays = currentPlan.days.map((day) => {
        if (Number(day.dayNumber) === Number(selectedDayNum)) {
          return {
            ...day,
            items: recalculateSchedulesForDay(realItems, language)
          };
        }
        return day;
      });
      return { ...currentPlan, days: updatedDays };
    });
  };

  // Add or Edit schedule sheet trigger
  const openScheduleSheet = (item: PlanItem | null = null, dayNum: number = selectedDayNum) => {
    setSheetDayNum(dayNum);
    setTimePickerTarget('start');
    if (item) {
      setEditingItem(item);
      setFormTitle(item.title);
      setFormTime(item.time);
      const computedEndTime = item.manualEndTime || item.calculatedEndTime || (item.stayDurationMinutes ? addMinutesToTime(item.time, item.stayDurationMinutes, language) : addMinutesToTime(item.time, 60, language));
      setFormEndTime(computedEndTime);
      setFormCost(item.cost || '');
      setFormContent(item.content || '');
      setFormTrans(item.transportation || 'walk');
      setFormTransLine(item.transportationLine || '');
      setFormDuration(formatDurationByLanguage(item.duration, language) || '');
      setFormStayDurationMinutes(item.stayDurationMinutes || 60);
      setFormManualTimeOverride(item.manualTimeOverride || false);
      setSuggestedStartTime(item.suggestedStartTime || null);
      setFormChecklist(item.checklist || []);
      setFormImages(item.images || []);
      setFormLocation(item.location || '');
      setFormLocationAddress(item.locationAddress || '');
      setFormLocationLatLng(item.locationLatLng || undefined);
      setFormLocationPlaceId(item.locationPlaceId || '');

      setFormArrivalLocation(item.arrivalLocation || '');
      setFormArrivalLocationAddress(item.arrivalLocationAddress || '');
      setFormArrivalLocationLatLng(item.arrivalLocationLatLng || undefined);
      setFormArrivalLocationPlaceId(item.arrivalLocationPlaceId || '');
      
      const parsed = parseTimeToPickerState(item.time);
      setPickerAmPm(parsed.amPm);
      setPickerHour(parsed.hour);
      setPickerMinute(parsed.minute);
    } else {
      setEditingItem(null);
      setFormTitle('');
      setFormTime('12:00 PM');
      setFormEndTime(addMinutesToTime('12:00 PM', 60, language));
      setFormCost('');
      setFormContent('');
      setFormTrans('walk');
      setFormTransLine('');
      setFormDuration('');
      setFormStayDurationMinutes(60);
      setFormManualTimeOverride(false);
      setSuggestedStartTime(null);
      setFormChecklist([]);
      setFormImages([]);
      setFormLocation('');
      setFormLocationAddress('');
      setFormLocationLatLng(undefined);
      setFormLocationPlaceId('');

      setFormArrivalLocation('');
      setFormArrivalLocationAddress('');
      setFormArrivalLocationLatLng(undefined);
      setFormArrivalLocationPlaceId('');
      
      setPickerAmPm('PM');
      setPickerHour(12);
      setPickerMinute(0);
    }
    setIsSheetOpen(true);
    setIsTimePickerOpen(false);
    setFlightInfo(null);
    setIsSearchingFlight(false);
  };

  const handleAddChecklistItem = () => {
    if (!newCheckItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newCheckItemText.trim(),
      checked: false
    };
    setFormChecklist([...formChecklist, newItem]);
    setNewCheckItemText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormChecklist(formChecklist.filter((chk) => chk.id !== id));
  };

  const handleSaveSheetData = () => {
    if (!formTitle.trim()) {
      alert(language === 'ko' ? '일정 제목을 입력해주세요.' : 'Please enter a schedule title.');
      return;
    }

    let computedStayMinutes = 60;
    if (formTime && formEndTime) {
      const startMins = convertTimeToMinutes(formTime);
      const endMins = convertTimeToMinutes(formEndTime);
      let diff = endMins - startMins;
      if (diff < 0) {
        diff += 24 * 60; // handle cross midnight
      }
      computedStayMinutes = diff;
    }

    const itemData: PlanItem = {
      id: editingItem?.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: formTitle,
      time: formTime,
      stayDurationMinutes: computedStayMinutes,
      manualEndTime: formEndTime,
      manualTimeOverride: formManualTimeOverride,
      suggestedStartTime: suggestedStartTime || undefined,
      cost: formCost ? formCost : undefined,
      content: formContent ? formContent : undefined,
      transportation: formTrans,
      transportationLine: formTransLine ? formTransLine : undefined,
      duration: formDuration ? formDuration : undefined,
      checklist: formChecklist.length > 0 ? formChecklist : undefined,
      images: formImages.length > 0 ? formImages : undefined,
      location: formLocation ? formLocation : undefined,
      locationAddress: formLocationAddress ? formLocationAddress : undefined,
      locationLatLng: formLocationLatLng ? formLocationLatLng : undefined,
      locationPlaceId: formLocationPlaceId ? formLocationPlaceId : undefined,
      arrivalLocation: formTrans === 'flight' && formArrivalLocation ? formArrivalLocation : undefined,
      arrivalLocationAddress: formTrans === 'flight' && formArrivalLocationAddress ? formArrivalLocationAddress : undefined,
      arrivalLocationLatLng: formTrans === 'flight' && formArrivalLocationLatLng ? formArrivalLocationLatLng : undefined,
      arrivalLocationPlaceId: formTrans === 'flight' && formArrivalLocationPlaceId ? formArrivalLocationPlaceId : undefined
    };

    if (formTrans === 'flight' && itemData.stayDurationMinutes === undefined && formDuration) {
      const flightMins = parseTravelDurationToMins(formDuration);
      if (flightMins > 0) {
        itemData.stayDurationMinutes = flightMins;
      }
    }

    const sortItemsByTime = (items: PlanItem[]) => {
      return [...items].sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time));
    };

    onUpdatePlan((currentPlan) => {
      let updatedDays = [...currentPlan.days];

      if (editingItem) {
        // Edit mode
        
        // First, find which day the item is currently on.
        let oldDayNum: number = -1;
        for (const day of updatedDays) {
          if (day.items.some(item => item.id === editingItem.id)) {
            oldDayNum = Number(day.dayNumber);
            break;
          }
        }

        if (oldDayNum === Number(sheetDayNum)) {
          // Day hasn't changed. Just update in place.
          updatedDays = updatedDays.map((day) => {
            if (Number(day.dayNumber) !== oldDayNum) return day;
            const newItems = day.items.map((item) => (item.id === editingItem.id ? itemData : item));
            const sorted = sortItemsByTime(newItems);
            return {
              ...day,
              items: recalculateSchedulesForDay(sorted, language)
            };
          });
        } else {
          // Day has changed! Remove from old day, add to new day.
          let foundNewDay = false;
          
          updatedDays = updatedDays.map((day) => {
            if (Number(day.dayNumber) === oldDayNum) {
              // Remove from old day
              const newItems = day.items.filter((item) => item.id !== editingItem.id);
              return {
                ...day,
                items: recalculateSchedulesForDay(newItems, language)
              };
            }
            if (Number(day.dayNumber) === Number(sheetDayNum)) {
              // Add to new day
              foundNewDay = true;
              const sorted = sortItemsByTime([...day.items, itemData]);
              return {
                ...day,
                items: recalculateSchedulesForDay(sorted, language)
              };
            }
            return day;
          });

          // If the new day doesn't exist yet, push it
          if (!foundNewDay) {
            updatedDays.push({
              dayNumber: Number(sheetDayNum),
              date: activeDay?.date || currentPlan.startDate || '',
              dayOfWeek: activeDay?.dayOfWeek || '',
              items: [itemData]
            });
          }
        }
      } else {
        // Add mode - append to specified day
        let foundDay = false;
        updatedDays = updatedDays.map((day) => {
          if (Number(day.dayNumber) !== Number(sheetDayNum)) return day;
          foundDay = true;
          const sorted = sortItemsByTime([...day.items, itemData]);
          return {
            ...day,
            items: recalculateSchedulesForDay(sorted, language)
          };
        });

        if (!foundDay) {
          updatedDays.push({
            dayNumber: Number(sheetDayNum),
            date: activeDay?.date || currentPlan.startDate || '',
            dayOfWeek: activeDay?.dayOfWeek || '',
            items: [itemData]
          });
        }
      }

      if (currentPlan.accommodations && currentPlan.accommodations.length > 0) {
        currentPlan.accommodations.forEach((acc) => {
          updatedDays = syncAccommodationTimelineItems(updatedDays, acc, false);
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[PlanMutation] source: add/edit targetItemId: ${itemData.id} timestamp: ${Date.now()}`);
      }

      return { ...currentPlan, days: updatedDays };
    });

    setIsSheetOpen(false);
    setEditingItem(null);
  };

  // Edit Mode multi-select logic
  const handleToggleSelectId = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter((i) => i !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleSelectAll = () => {
    const activeDayItemIds = activeDay.items.map((i) => i.id);
    const allSelected = activeDayItemIds.every((id) => selectedItemIds.includes(id));
    
    if (allSelected) {
      setSelectedItemIds(selectedItemIds.filter((id) => !activeDayItemIds.includes(id)));
    } else {
      const newSelection = Array.from(new Set([...selectedItemIds, ...activeDayItemIds]));
      setSelectedItemIds(newSelection);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItemIds.length === 0) return;

    onUpdatePlan((currentPlan) => {
      let updatedAccs = currentPlan.accommodations ? [...currentPlan.accommodations] : [];
      let updatedAnchors = currentPlan.dailyAnchors ? { ...currentPlan.dailyAnchors } : {};

      selectedItemIds.forEach((itemId) => {
        if (itemId.startsWith('acc-checkin-')) {
          const accId = itemId.replace('acc-checkin-', '');
          updatedAccs = updatedAccs.map((acc) =>
            acc.id === accId ? { ...acc, addCheckInToTimeline: false } : acc
          );
        } else if (itemId.startsWith('acc-checkout-')) {
          const accId = itemId.replace('acc-checkout-', '');
          updatedAccs = updatedAccs.map((acc) =>
            acc.id === accId ? { ...acc, addCheckOutToTimeline: false } : acc
          );
        } else if (itemId.startsWith('start-acc-') || itemId.startsWith('end-acc-')) {
          const dateIso = itemId.replace('start-acc-', '').replace('end-acc-', '');
          if (updatedAnchors[dateIso]) {
            if (itemId.startsWith('start-acc-')) {
              const { startLocation, ...rest } = updatedAnchors[dateIso];
              updatedAnchors[dateIso] = rest as DailyAnchor;
            } else if (itemId.startsWith('end-acc-')) {
              const { endLocation, returnRouteInfo, ...rest } = updatedAnchors[dateIso];
              updatedAnchors[dateIso] = rest as DailyAnchor;
            }
          }
        }
      });

      let updatedDays = currentPlan.days.map((day) => {
        const filteredItems = day.items.filter((item) => !selectedItemIds.includes(item.id));
        return {
          ...day,
          items: recalculateSchedulesForDay(filteredItems, language)
        };
      });

      if (updatedAccs.length > 0) {
        updatedAccs.forEach((acc) => {
          updatedDays = syncAccommodationTimelineItems(updatedDays, acc, false);
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[PlanMutation] source: delete-selected timestamp: ${Date.now()}`);
      }

      return {
        ...currentPlan,
        days: updatedDays,
        accommodations: updatedAccs,
        dailyAnchors: updatedAnchors
      };
    });

    setSelectedItemIds([]);
    setIsEditMode(false);
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdatePlan((currentPlan) => {
      let updatedAccs = currentPlan.accommodations ? [...currentPlan.accommodations] : [];
      let updatedAnchors = currentPlan.dailyAnchors ? { ...currentPlan.dailyAnchors } : {};

      // 1. If deleting accommodation timeline card (check-in / check-out)
      if (itemId.startsWith('acc-checkin-')) {
        const accId = itemId.replace('acc-checkin-', '');
        updatedAccs = updatedAccs.map((acc) =>
          acc.id === accId ? { ...acc, addCheckInToTimeline: false } : acc
        );
      } else if (itemId.startsWith('acc-checkout-')) {
        const accId = itemId.replace('acc-checkout-', '');
        updatedAccs = updatedAccs.map((acc) =>
          acc.id === accId ? { ...acc, addCheckOutToTimeline: false } : acc
        );
      }

      // 2. If deleting pseudo anchor item
      if (itemId.startsWith('start-acc-') || itemId.startsWith('end-acc-')) {
        const dateIso = itemId.replace('start-acc-', '').replace('end-acc-', '');
        if (updatedAnchors[dateIso]) {
          if (itemId.startsWith('start-acc-')) {
            const { startLocation, ...rest } = updatedAnchors[dateIso];
            updatedAnchors[dateIso] = rest as DailyAnchor;
          } else if (itemId.startsWith('end-acc-')) {
            const { endLocation, returnRouteInfo, ...rest } = updatedAnchors[dateIso];
            updatedAnchors[dateIso] = rest as DailyAnchor;
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PlanMutation] source: delete-anchor targetItemId: ${itemId} timestamp: ${Date.now()}`);
        }

        return { ...currentPlan, dailyAnchors: updatedAnchors, accommodations: updatedAccs };
      }

      // 3. Normal timeline item deletion
      let updatedDays = currentPlan.days.map((day) => {
        const filteredItems = day.items.filter((item) => item.id !== itemId);
        return {
          ...day,
          items: recalculateSchedulesForDay(filteredItems, language)
        };
      });

      if (updatedAccs.length > 0) {
        updatedAccs.forEach((acc) => {
          updatedDays = syncAccommodationTimelineItems(updatedDays, acc, false);
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`[PlanMutation] source: delete targetItemId: ${itemId} timestamp: ${Date.now()}`);
      }

      return {
        ...currentPlan,
        days: updatedDays,
        accommodations: updatedAccs,
        dailyAnchors: updatedAnchors
      };
    });

    if (expandedItemId === itemId) {
      setExpandedItemId(null);
    }
  };

  const handleCopySelected = () => {
    if (selectedItemIds.length === 0) return;

    onUpdatePlan((currentPlan) => {
      const itemsToCopy: PlanItem[] = [];
      currentPlan.days.forEach((day) => {
        day.items.forEach((item) => {
          if (selectedItemIds.includes(item.id)) {
            const prefix = language === 'ko' ? '[복사] ' : '[Copy] ';
            itemsToCopy.push({
              ...item,
              id: `item-copy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              title: `${prefix}${item.title}`
            });
          }
        });
      });

      const sortItemsByTime = (items: PlanItem[]) => {
        return [...items].sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time));
      };

      const updatedDays = currentPlan.days.map((day) => {
        if (Number(day.dayNumber) !== Number(selectedDayNum)) return day;
        return {
          ...day,
          items: sortItemsByTime([...day.items, ...itemsToCopy])
        };
      });

      return { ...currentPlan, days: updatedDays };
    });

    setSelectedItemIds([]);
    setIsEditMode(false);
    const alertMsg = language === 'ko'
      ? `선택한 일정이 현재 일차에 복사되었습니다.`
      : `Selected schedule(s) have been copied to this day.`;
    alert(alertMsg);
  };

  const getTransIcon = (type?: TransportationType, size: number = 18) => {
    switch (type) {
      case 'taxi':
        return <Car size={size} className="text-amber-500" />;
      case 'bus':
        return <Train size={size} />;
      case 'flight':
        return <Plane size={size} />;
      case 'walk':
        return <Footprints size={size} />;
      case 'bike':
        return <Bike size={size} />;
      case 'car':
        return <Car size={size} />;
      default:
        return <Footprints size={size} />;
    }
  };

  const getTransLabel = (type: TransportationType) => {
    switch (type) {
      case 'taxi': return language === 'ko' ? '택시' : 'Taxi';
      case 'bus': return language === 'ko' ? '대중교통' : 'Transit';
      case 'flight': return language === 'ko' ? '비행기' : 'Flight';
      case 'walk': return language === 'ko' ? '도보' : 'Walk';
      case 'bike': return language === 'ko' ? '자전거' : 'Bike';
      case 'car': return language === 'ko' ? '자동차' : 'Car';
      default: return '';
    }
  };

  const handleDownloadImage = async () => {
    if (!shareCardCaptureRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!shareCardCaptureRef.current) {
        throw new Error('Capture reference is null after delay');
      }
      const dataUrl = await toPng(shareCardCaptureRef.current, {
        cacheBust: true,
        style: {
          transform: 'scale(1)',
        }
      });
      const link = document.createElement('a');
      link.download = `${plan.title.replace(/\s+/g, '_')}_Day${selectedDayNum}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert(language === 'ko' 
        ? '이미지 생성 도중 오류가 발생했습니다. 다시 시도해 주세요.' 
        : 'An error occurred during image generation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!shareCardCaptureRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!shareCardCaptureRef.current) {
        throw new Error('Capture reference is null after delay');
      }
      const blob = await toBlob(shareCardCaptureRef.current, {
        cacheBust: true,
      });
      if (blob) {
        let copied = false;
        if (typeof ClipboardItem !== 'undefined' && typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function') {
          try {
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            copied = true;
          } catch (clipErr) {
            console.warn('Direct image clipboard copy failed:', clipErr);
          }
        }
        
        if (copied) {
          alert(language === 'ko'
            ? '📋 이미지가 클립보드에 성공적으로 복사되었습니다!\n원하는 채팅방이나 SNS에 바로 붙여넣기(Ctrl+V) 하세요! 🥰'
            : '📋 Image copied to clipboard successfully!\nPaste it (Ctrl+V) directly into your chat or SNS! 🥰');
        } else {
          // Fallback to downloading the image directly
          handleDownloadImage();
          alert(language === 'ko'
            ? '직접 클립보드 이미지 복사를 지원하지 않는 브라우저이거나 권한 제한이 발생하여 기기에 이미지로 다운로드되었습니다. 🥰'
            : 'Direct clipboard copy is not supported in this environment, so the image has been saved to your device instead. 🥰');
        }
      } else {
        throw new Error('Blob generation failed');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      alert(language === 'ko'
        ? '클립보드 이미지 복사 또는 다운로드 처리 중 오류가 발생했습니다. 대신 "기기에 저장하기"를 시도해 주세요!'
        : 'An error occurred during clipboard copy or download. Please try the "Save to Device" button instead!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWebShare = async () => {
    if (!shareCardCaptureRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!shareCardCaptureRef.current) {
        throw new Error('Capture reference is null after delay');
      }
      const blob = await toBlob(shareCardCaptureRef.current, { cacheBust: true });
      if (blob) {
        const file = new File([blob], `${plan.title.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          const shareTitle = plan.title;
          const shareText = language === 'ko'
            ? `[Trippo] ${plan.title} 여행 일정을 함께 가요! 🎈`
            : `[Trippo] Let's go to ${plan.title} together! 🎈`;
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: shareText
          });
        } else if (navigator.share) {
          const shareTextMsg = language === 'ko'
            ? `[Trippo] ${plan.title} (${plan.startDate} ~ ${plan.endDate})\n\n친구야, 나와 함께 갈 여행 코스를 확인해봐! 🎈`
            : `[Trippo] ${plan.title} (${plan.startDate} ~ ${plan.endDate})\n\nHey, check out our travel itinerary! 🎈`;
          await navigator.share({
            title: plan.title,
            text: shareTextMsg,
            url: window.location.href
          });
        } else {
          let copied = false;
          if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
              await navigator.clipboard.writeText(window.location.href);
              copied = true;
            } catch (clipErr) {
              console.warn('Failed to write text to clipboard:', clipErr);
            }
          }
          
          if (copied) {
            alert(language === 'ko'
              ? '🔗 링크가 복사되었습니다! 친구에게 보내서 여행 일정을 자랑해 보세요.'
              : '🔗 Link copied! Share this link with your friends to show your travel itinerary.');
          } else {
            alert(language === 'ko'
              ? `공유 링크: ${window.location.href}`
              : `Share Link: ${window.location.href}`);
          }
        }
      }
    } catch (error) {
      console.error('Web Share error:', error);
      handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }
  };

  const MapWrapper = hasValidMapsKey ? APIProvider : React.Fragment;
  const mapWrapperProps = hasValidMapsKey
    ? { apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly', language: language === 'ko' ? 'ko' : 'en' }
    : {};

  return (
    <MapWrapper {...mapWrapperProps}>
      <div className="space-y-6 pb-36 relative">
      {/* Header Info */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {sharedPlanId && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-950/50 border border-blue-200/40 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-[9px] font-sans font-extrabold uppercase tracking-wider shadow-sm w-fit">
                <span>{language === 'ko' ? '초대됨' : 'Invited'}</span>
              </div>
            )}
            {syncStatus && (
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-md text-[9px] font-sans font-bold tracking-wider shadow-sm w-fit ${
                syncStatus === 'local_only'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  : syncStatus === 'saving'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40 animate-pulse'
                  : syncStatus === 'saved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40'
                  : syncStatus === 'conflict'
                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40'
              }`}>
                <span>{
                  syncStatus === 'local_only'
                    ? (language === 'ko' ? 'Firestore 한도 초과 — 기기에 임시 저장됨' : 'Firestore Quota Exceeded — Saved locally')
                    : syncStatus === 'saving'
                    ? (language === 'ko' ? '클라우드 저장 중...' : 'Saving to cloud...')
                    : syncStatus === 'saved'
                    ? (language === 'ko' ? '저장됨' : 'Saved')
                    : syncStatus === 'conflict'
                    ? (language === 'ko' ? '원격 서버 변경 사항과 충돌' : 'Conflict with remote edits')
                    : (language === 'ko' ? '클라우드 동기화 오류' : 'Cloud sync error')
                }</span>
              </div>
            )}
          </div>
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 w-full">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTitle();
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setTitleInput(plan.title);
                  }
                }}
                className="font-sans font-bold text-lg text-gray-800 dark:text-text-primary bg-white dark:bg-[#15141f] border border-gray-300 dark:border-subtle-border rounded-lg px-2 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex-shrink-0"
                title="저장"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => {
                  setIsEditingTitle(false);
                  setTitleInput(plan.title);
                }}
                className="p-1.5 bg-gray-50 dark:bg-[#15141f] text-gray-500 dark:text-text-secondary rounded-lg hover:bg-gray-100 dark:hover:bg-[#222133] transition-colors flex-shrink-0"
                title="취소"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
              <h2 
                className="font-sans font-bold text-xl text-gray-800 dark:text-text-primary cursor-pointer group-hover:text-blue-600 transition-colors truncate select-none"
                onClick={() => {
                  setIsEditingTitle(true);
                  setTitleInput(plan.title);
                }}
                title="제목 수정하기"
              >
                {plan.title}
              </h2>
          )}
          <p className="font-sans text-xs text-gray-400 flex items-center gap-1.5 mt-1">
            <CalendarDays size={14} className="text-gray-400 shrink-0" />
            <span className="truncate">{plan.startDate} - {plan.endDate} ({plan.durationText})</span>
          </p>
          
          {/* Companions Badge List */}
          {plan.companions && plan.companions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-gray-400 font-extrabold dark:text-stone-500 mr-1">일행:</span>
              {plan.companions.map((comp) => (
                <div 
                  key={comp.id} 
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                    comp.isLocal 
                      ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' 
                      : 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}
                >
                  <span>{comp.isLocal ? '👤' : '👥'}</span>
                  <span>{comp.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center shrink-0">
          <button
            onClick={() => setIsCompanionSheetOpen(true)}
            className="text-gray-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 p-2.5 transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/20"
            title={language === 'ko' ? '일행 관리 및 추가' : 'Manage & Add Companions'}
          >
            <UserPlus size={22} className="stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Edit Mode Selection Header */}
      {isEditMode && (
        <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl px-4 py-3 border border-blue-100/30 dark:border-blue-900/30 flex justify-between items-center animate-fade-in">
          <span className="font-sans text-sm font-semibold text-blue-700 dark:text-blue-400">
            {language === 'ko' ? `${selectedItemIds.length}개 선택됨` : `${selectedItemIds.length} selected`}
          </span>
          <button
            onClick={handleSelectAll}
            className="font-sans text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {activeDay.items.every((i) => selectedItemIds.includes(i.id))
              ? (language === 'ko' ? '전체 해제' : 'Deselect All')
              : (language === 'ko' ? '전체 선택' : 'Select All')}
          </button>
        </div>
      )}

      {/* Action Bar & Accommodations Overview */}
      <div className="bg-white dark:bg-surface-primary rounded-2xl p-3 shadow-sm border border-gray-100/80 dark:border-zinc-800/50 space-y-3">
        {/* Main Action Buttons Grid */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => openScheduleSheet()}
            className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <Plus size={14} className="stroke-[2.5] shrink-0" />
            <span className="truncate">{t('add_schedule')}</span>
          </button>

          <button
            onClick={() => {
              setEditingAcc(null);
              setIsAccModalOpen(true);
            }}
            className="py-2.5 px-3 bg-stone-50 dark:bg-zinc-800/50 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 border border-stone-200/50 dark:border-zinc-700/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <Building2 size={14} className="text-blue-500 shrink-0" />
            <span className="truncate">{t('add_accommodation')}</span>
          </button>

          <button
            onClick={() => {
              setChecklistDayNums([Number(selectedDayNum)]);
              setIsChecklistOverviewOpen(true);
            }}
            className="py-2.5 px-3 bg-stone-50 dark:bg-zinc-800/50 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 border border-stone-200/50 dark:border-zinc-700/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <ClipboardList size={14} className="text-blue-500 shrink-0" />
            <span className="truncate">{language === 'ko' ? '체크리스트' : 'Checklist'}</span>
          </button>
        </div>

        {/* Supplementary Tools / Registered Accommodations Row */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-gray-100 dark:border-zinc-800/60 text-xs">
          {/* Registered Accommodations Badge List */}
          <div className="flex-1 min-w-0">
            {plan.accommodations && plan.accommodations.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider shrink-0">
                  {language === 'ko' ? '숙소' : 'Accs'}
                </span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                  {plan.accommodations.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setEditingAcc(acc);
                        setIsAccModalOpen(true);
                      }}
                      className="px-2 py-0.5 bg-gray-50 dark:bg-zinc-800/30 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200/30 dark:border-zinc-700/30 rounded-lg text-[10.5px] font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Building2 size={10} className="text-blue-500" />
                      <span className="max-w-[80px] truncate">{acc.name}</span>
                      <span className="text-[9px] text-gray-400 font-mono">({acc.checkInDate.slice(5)}~{acc.checkOutDate.slice(5)})</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 italic">
                {language === 'ko' ? '등록된 숙소 없음' : 'No accommodations'}
              </span>
            )}
          </div>

          {/* Test verification button */}
          <button
            onClick={() => setIsTestRunnerModalOpen(true)}
            className="shrink-0 px-2 py-1 bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/60 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="숙박 일정 자동화 15개 통합 검증 테스트"
          >
            <ShieldCheck size={11} className="text-emerald-500" />
            <span>{language === 'ko' ? '검증' : 'Verify'}</span>
          </button>
        </div>
      </div>

      {/* Timeline Days Navigation */}
      <section className="bg-white dark:bg-surface-primary rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-subtle-border">
<div className="flex overflow-x-auto gap-2.5 pb-1 scrollbar-none snap-x">
          {plan.days.map((day) => {
            const isActive = Number(day.dayNumber) === Number(selectedDayNum);
            return (
              <button
                key={day.dayNumber}
                onClick={() => {
                  setSelectedDayNum(Number(day.dayNumber));
                  setExpandedItemId(null);
                }}
                className={`flex flex-col items-center justify-center min-w-[64px] py-2.5 px-2 rounded-xl cursor-pointer snap-start transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-100'
                    : 'bg-gray-50 dark:bg-[#15141f] text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-[#222133]'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-tight opacity-75">
                  {language === 'ko' ? `${day.dayNumber}일차` : `Day ${day.dayNumber}`}
                </span>
                <span className="font-sans font-bold text-lg leading-tight mt-0.5">
                  {day.date.split('.')[2]?.trim() || day.dayNumber}
                </span>
                <span className="text-[10px] font-semibold opacity-75">{translateDayOfWeek(day.dayOfWeek, language)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Itinerary List */}
      <section className="relative space-y-6">
        {(() => {
          const anchor = plan.dailyAnchors?.[activeDayIso];
          const displayItems = [...activeDay.items];
          let recommendedDepartureTime = '';
          
          if (anchor?.startLocation?.name) {
            const startLoc = anchor.startLocation;
            if (activeDay.items.length > 0) {
              recommendedDepartureTime = '09:00';
              const firstItem = activeDay.items[0];
              const travelDurationText = firstItem.autoDuration || firstItem.manualDuration || firstItem.duration;
              const travelMins = parseTravelDurationToMins(travelDurationText || '');
              if (firstItem.time && travelMins > 0) {
                recommendedDepartureTime = addMinutesToTime(firstItem.time, -travelMins, language);
              }
            }
            displayItems.unshift({
              id: `start-acc-${activeDayIso}`,
              title: `${startLoc.name} (${language === 'ko' ? '숙소 출발' : 'Acc. Departure'})`,
              location: startLoc.name,
              locationPlaceId: startLoc.placeId || undefined,
              locationLatLng: startLoc.latitude && startLoc.longitude ? { lat: startLoc.latitude, lng: startLoc.longitude } : undefined,
              time: recommendedDepartureTime,
              isPseudoItem: true,
              pseudoType: 'start'
            } as PlanItem);
          }

          if (anchor?.endLocation?.name) {
            const endLoc = anchor.endLocation;
            let estimatedArrivalTime = '';
            const returnDur = anchor.returnRouteInfo?.manualDuration || anchor.returnRouteInfo?.autoDuration;
            if (returnDur) {
              const travelMins = parseTravelDurationToMins(returnDur);
              if (activeDay.items.length > 0) {
                const lastItem = activeDay.items[activeDay.items.length - 1];
                if (lastItem.time && travelMins > 0) {
                  const stayMins = lastItem.stayDurationMinutes || 60;
                  estimatedArrivalTime = addMinutesToTime(lastItem.time, stayMins + travelMins, language);
                }
              }
            }
            displayItems.push({
              id: `end-acc-${activeDayIso}`,
              title: `${endLoc.name} (${language === 'ko' ? '숙소 도착' : 'Acc. Arrival'})`,
              location: endLoc.name,
              locationPlaceId: endLoc.placeId || undefined,
              locationLatLng: endLoc.latitude && endLoc.longitude ? { lat: endLoc.latitude, lng: endLoc.longitude } : undefined,
              time: estimatedArrivalTime,
              isPseudoItem: true,
              pseudoType: 'end',
              transportation: anchor.returnRouteInfo?.transportation || 'walk',
              autoDuration: anchor.returnRouteInfo?.autoDuration,
              manualDuration: anchor.returnRouteInfo?.manualDuration,
              duration: anchor.returnRouteInfo?.manualDuration || anchor.returnRouteInfo?.autoDuration || '',
              transitDebugInfo: anchor.returnRouteInfo?.transitDebugInfo,
              routeStatus: anchor.returnRouteInfo?.routeStatus,
              routeError: anchor.returnRouteInfo?.routeError
            } as PlanItem);
          }
          return (
            <>

              {/* Timeline Vertical Line */}
              {displayItems.length > 0 && (
                <div className="absolute left-[24px] -translate-x-1/2 top-6 bottom-6 w-0.5 border-l border-gray-200 dark:border-subtle-border z-0"></div>
              )}

              {displayItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50/50 dark:bg-[#15141f]/50 rounded-2xl border border-dashed border-gray-100 dark:border-subtle-border">
                  <p className="text-gray-400 text-sm">{language === 'ko' ? '등록된 일정이 없습니다.' : 'No schedules registered.'}</p>
                  <button
                    onClick={() => openScheduleSheet()}
                    className="mt-3 inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl font-sans text-xs font-bold"
                  >
                    <Plus size={14} /> {language === 'ko' ? '일정 만들기' : 'Add Activity'}
                  </button>
                </div>
              ) : (
                <Reorder.Group axis="y" values={displayItems} onReorder={handleReorderItems} className="space-y-6">
                  {displayItems.map((item, idx) => {
              const isExpanded = expandedItemId === item.id;
              const isSelected = selectedItemIds.includes(item.id);
              const segment = getTimeOfDaySegment(item.time);
              
              let iconEl = <Sun size={18} />;
              let bgClass = 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
              
              if (segment === 'morning') {
                iconEl = <Sunrise size={18} className="animate-pulse text-sky-600 dark:text-sky-400" />;
                bgClass = 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400';
              } else if (segment === 'day') {
                iconEl = <Sun size={18} className="text-amber-600 dark:text-amber-400" style={{ animation: 'spin 12s linear infinite' }} />;
                bgClass = 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
              } else if (segment === 'evening') {
                iconEl = <Sunset size={18} className="animate-pulse text-orange-600 dark:text-orange-400" />;
                bgClass = 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400';
              } else if (segment === 'night') {
                iconEl = <Moon size={18} className="text-indigo-600 dark:text-indigo-400" />;
                bgClass = 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400';
              }

              const prevItem = idx > 0 ? displayItems[idx - 1] : null;
              const hasRoute = prevItem !== null && !(prevItem.isPseudoItem && item.isPseudoItem);

              return (
                <Reorder.Item value={item} key={item.id} className="relative z-10" dragListener={isEditMode && !item.isPseudoItem} onDragEnd={handleCommitReorder} layout transition={{ type: "spring", bounce: 0, duration: 0.4 }}>
                  {hasRoute && (
                    <TimelineRouteConnector
                      from={prevItem!}
                      to={item}
                      language={language}
                      getTransIcon={getTransIcon}
                      dayDate={activeDay.date}
                      planId={plan.id}
                      onUpdateRouteInfo={(updates) => updatePlanItemRouteInfo(item.id, updates)}
                      onUpdateFromRouteInfo={(updates) => updatePlanItemRouteInfo(prevItem!.id, updates)}
                    />
                  )}
                  <motion.div layout transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className={`relative flex gap-4 items-start ${
                      activeMenuId === item.id ? 'z-40' : 'z-10'
                    }`}
                  >
                {/* Timeline Icon Marker */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-[#13121a] flex-shrink-0 shadow-sm transition-all ${bgClass}`}
                >
                  {iconEl}
                </div>

                {/* Card Container */}
                <motion.div layout transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="flex-1 flex gap-3 items-center">
                  {/* Multi-select checkmark in Edit Mode */}
                  {isEditMode && !item.isPseudoItem && (
                    <button
                      onClick={() => handleToggleSelectId(item.id)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-gray-200 dark:border-subtle-border hover:border-blue-400 bg-white dark:bg-surface-primary'
                      }`}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </button>
                  )}

                  {/* Schedule Card */}
                  <motion.div layout transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className={`relative flex-1 bg-white dark:bg-surface-primary rounded-2xl p-4 shadow-sm border transition-colors ${
                      isExpanded
                        ? 'border-blue-500/30 ring-1 ring-blue-500/5 shadow-md shadow-blue-500/[0.02]'
                        : 'border-gray-100 dark:border-subtle-border hover:shadow-md'
                    }`}
                  >
                    {/* Collapsed Header */}
                    <div
                      onClick={() => !isEditMode && !item.isPseudoItem && handleToggleAccordion(item.id)}
                      className="pr-8 flex justify-between items-start cursor-pointer select-none"
                    >
                      <div>
                        <h4
                          className={`font-sans font-bold text-sm leading-tight ${
                            isExpanded ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-text-primary'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <p className="font-sans text-xs font-bold text-blue-500 dark:text-blue-400">
                            {item.time}
                            {(item.manualEndTime || item.calculatedEndTime) && (
                              <span className="text-gray-400 dark:text-zinc-500 font-medium ml-1 text-[10px]">
                                ~ {item.manualEndTime || item.calculatedEndTime}
                              </span>
                            )}
                          </p>
                          {(item.location || item.arrivalLocation) && (
                            <div className="flex items-center gap-1 text-[10px] font-sans font-semibold text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-stone-900/50 px-1.5 py-0.5 rounded-md border border-gray-100 dark:border-stone-800">
                              <MapPin size={10} className="text-gray-400 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {item.transportation === 'flight' && item.arrivalLocation
                                  ? `${item.location || (language === 'ko' ? '출발지' : 'Departure')} → ${item.arrivalLocation}`
                                  : item.location}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isEditMode && (
                      <div className="absolute top-2 right-2 z-50 flex items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setActiveMenuId(activeMenuId === item.id ? null : item.id);
                          }}
                          className={`menu-trigger-${item.id} text-gray-400 dark:text-text-tertiary hover:text-gray-600 dark:hover:text-zinc-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#222133] active:scale-95 transition-all`}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu Popup */}
                        <AnimatePresence>
                          {activeMenuId === item.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.12, ease: "easeOut" }}
                              className={`menu-dropdown-${item.id} absolute right-0 top-full mt-1 w-24 bg-white dark:bg-[#1f1e2d] border border-gray-100 dark:border-subtle-border rounded-xl shadow-xl py-1 z-50 origin-top-right text-left`}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveMenuId(null);
                                  if (item.isPseudoItem) {
                                    setAnchorModalDateIso(activeDayIso);
                                    setIsAnchorModalOpen(true);
                                  } else {
                                    openScheduleSheet(item);
                                  }
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 transition-all"
                              >
                                <FileEdit size={13} className="text-gray-400 dark:text-text-secondary" />
                                <span>{language === 'ko' ? '수정' : 'Edit'}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveMenuId(null);
                                  handleDeleteItem(item.id);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 flex items-center gap-2 transition-all border-t border-gray-50 dark:border-subtle-border"
                              >
                                <Trash2 size={13} className="text-rose-500" />
                                <span>{language === 'ko' ? '삭제' : 'Delete'}</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Short preview content when not expanded */}
                    <AnimatePresence initial={false}>
                      {!isExpanded && item.content && (
                        <motion.p
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 8, transition: { type: "spring", bounce: 0, duration: 0.4 } }}
                          exit={{ opacity: 0, height: 0, marginTop: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }}
                          className="font-sans text-xs text-gray-500 dark:text-stone-400 line-clamp-1 border-l border-gray-100 dark:border-subtle-border pl-2 overflow-hidden"
                        >
                          {item.content}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Accordion Expanded Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto", transition: { type: "spring", bounce: 0, duration: 0.4 } }}
                          exit={{ opacity: 0, height: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-subtle-border space-y-4">
                            {/* Expanded image */}
                        {item.images && item.images.length > 0 && (
                          <div 
                            className="relative w-full h-36 cursor-pointer mb-2"
                            onClick={() => setViewingImages(item.images || [])}
                          >
                            {/* Stacked effect layers */}
                            {item.images.length > 2 && (
                              <div className="absolute top-2 left-2 right-[-8px] bottom-[-8px] rounded-xl bg-gray-200 dark:bg-stone-800 border border-gray-300 dark:border-stone-700 opacity-60 z-0" />
                            )}
                            {item.images.length > 1 && (
                              <div className="absolute top-1 left-1 right-[-4px] bottom-[-4px] rounded-xl bg-gray-100 dark:bg-stone-700 border border-gray-200 dark:border-stone-600 opacity-80 z-10" />
                            )}
                            <div className="absolute inset-0 rounded-xl overflow-hidden bg-gray-50 dark:bg-[#15141f] border border-gray-100 dark:border-subtle-border z-20 shadow-sm">
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              {item.images.length > 1 && (
                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold font-sans shadow-sm flex items-center gap-1">
                                  <ImageIcon size={12} />
                                  +{item.images.length - 1}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Content text */}
                        {item.content && (
                          <p className="font-sans text-xs leading-relaxed text-gray-600 dark:text-zinc-300 border-l-2 border-blue-500/20 pl-2.5 whitespace-pre-wrap">
                            {item.content}
                          </p>
                        )}

                        {/* Cost & Transportation */}
                        {(item.cost || item.transportation || item.duration) && (
                          <div className="flex flex-wrap gap-3">
                            {item.cost && (
                              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#15141f] px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-subtle-border">
                                <Wallet size={12} className="text-blue-600 dark:text-blue-400" />
                                <span className="font-sans text-[11px] font-bold text-gray-700 dark:text-zinc-200">{item.cost}</span>
                              </div>
                            )}
                            {item.transportation && (
                              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#15141f] px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-subtle-border">
                                <span className="text-blue-600 dark:text-blue-400">{getTransIcon(item.transportation, 13)}</span>
                                <span className="font-sans text-[11px] font-bold text-gray-700 dark:text-zinc-200">
                                  {item.transportationLine || getTransLabel(item.transportation)}
                                </span>
                              </div>
                            )}
                            {item.duration && (
                              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#15141f] px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-subtle-border">
                                <Clock size={12} className="text-gray-500" />
                                <span className="font-sans text-[11px] font-semibold text-gray-600 dark:text-stone-400">
                                  {formatDurationByLanguage(item.duration, language)} {language === 'ko' ? '소요' : 'takes'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Location Details block */}
                        {(item.location || item.arrivalLocation) && (
                          <div className="space-y-2">
                            {item.location && (
                              <div className="bg-gray-50 dark:bg-[#15141f] rounded-xl p-3 border border-gray-100 dark:border-subtle-border flex items-start gap-2.5">
                                {item.transportation === 'flight' ? (
                                  <PlaneTakeoff size={15} className="text-blue-500 shrink-0 mt-0.5" />
                                ) : (
                                  <MapPin size={15} className="text-blue-500 shrink-0 mt-0.5" />
                                )}
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                    {item.transportation === 'flight' && (
                                      <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold leading-none">
                                        {language === 'ko' ? '출발' : 'Dep'}
                                      </span>
                                    )}
                                    <h5 className="font-sans text-xs font-bold text-gray-800 dark:text-text-primary break-keep leading-snug flex-1 min-w-0">
                                      {item.location}
                                    </h5>
                                  </div>
                                  {item.locationAddress && (
                                    <p className="font-sans text-[10px] text-gray-400 dark:text-zinc-500 line-clamp-1 leading-normal break-keep">
                                      {item.locationAddress}
                                    </p>
                                  )}
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.locationAddress || item.location)}${item.locationPlaceId ? `&query_place_id=${item.locationPlaceId}` : ''}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-sans font-semibold text-blue-500 dark:text-blue-400 hover:underline shrink-0 self-center bg-blue-500/5 hover:bg-blue-500/10 dark:bg-blue-400/5 dark:hover:bg-blue-400/10 px-2 py-1 rounded-lg transition-colors border border-blue-500/10"
                                >
                                  {language === 'ko' ? '지도 보기' : 'View Map'}
                                </a>
                              </div>
                            )}

                            {item.transportation === 'flight' && item.arrivalLocation && (
                              <div className="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-2.5">
                                <PlaneLanding size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold leading-none">
                                      {language === 'ko' ? '도착' : 'Arr'}
                                    </span>
                                    <h5 className="font-sans text-xs font-bold text-gray-800 dark:text-text-primary break-keep leading-snug flex-1 min-w-0">
                                      {item.arrivalLocation}
                                    </h5>
                                  </div>
                                  {item.arrivalLocationAddress && (
                                    <p className="font-sans text-[10px] text-gray-400 dark:text-zinc-500 line-clamp-1 leading-normal break-keep">
                                      {item.arrivalLocationAddress}
                                    </p>
                                  )}
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.arrivalLocationAddress || item.arrivalLocation)}${item.arrivalLocationPlaceId ? `&query_place_id=${item.arrivalLocationPlaceId}` : ''}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-sans font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 self-center bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-400/5 dark:hover:bg-emerald-400/10 px-2 py-1 rounded-lg transition-colors border border-emerald-500/10"
                                >
                                  {language === 'ko' ? '지도 보기' : 'View Map'}
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Checklist */}
                        {item.checklist && item.checklist.length > 0 && (
                          <div className="bg-blue-50/20 dark:bg-blue-950/20 rounded-xl p-3 border border-blue-500/5 dark:border-blue-500/10 space-y-2.5">
                            <h5 className="font-sans text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-blue-600 dark:text-blue-400" />
                              {language === 'ko' ? '체크리스트' : 'Checklist'}
                            </h5>
                            <div className="space-y-2">
                              {item.checklist.map((chk) => (
                                <label
                                  key={chk.id}
                                  className="flex items-center gap-2 cursor-pointer select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={chk.checked}
                                    onChange={() => handleToggleItemCheck(selectedDayNum, item.id, chk.id)}
                                    className="rounded border-gray-200 dark:border-subtle-border text-blue-600 focus:ring-blue-500/20 h-4 w-4 bg-transparent cursor-pointer"
                                  />
                                  <span
                                    className={`font-sans text-xs leading-none transition-all ${
                                      chk.checked ? 'line-through text-gray-400 dark:text-stone-500' : 'text-gray-700 dark:text-zinc-200'
                                    }`}
                                  >
                                    {chk.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                  </motion.div>
                </motion.div>
              </motion.div>
            </Reorder.Item>
            );
          })}
          </Reorder.Group>
        )}
        </>
        );
        })()}
      </section>

      {/* Edit Mode Context Action Bar (Floating bottom) */}
      {isEditMode && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-gray-900 text-white rounded-[20px] px-4 py-3.5 shadow-lg flex justify-around items-center md:max-w-[416px] md:mx-auto">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedItemIds.length === 0}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-rose-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Trash2 size={18} />
            <span className="text-[10px] font-sans font-bold">삭제</span>
          </button>
          <button
            onClick={handleCopySelected}
            disabled={selectedItemIds.length === 0}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Copy size={18} />
            <span className="text-[10px] font-sans font-bold">복사</span>
          </button>
          <button
            onClick={() => {
              if (selectedItemIds.length === 0) return;
              const targetDay = prompt('이동할 일차를 입력하세요 (예: 1, 2, 3...)');
              const targetDayNum = parseInt(targetDay || '');
              if (isNaN(targetDayNum) || targetDayNum < 1 || targetDayNum > plan.days.length) {
                alert('올바른 일차 번호를 입력해주세요.');
                return;
              }

              // Cut from source and append to destination
              let movedItems: PlanItem[] = [];
              let updatedDays = plan.days.map((day) => {
                const itemsToKeep = day.items.filter((item) => {
                  const isMatch = selectedItemIds.includes(item.id);
                  if (isMatch) movedItems.push(item);
                  return !isMatch;
                });
                return { ...day, items: itemsToKeep };
              });

              updatedDays = updatedDays.map((day) => {
                if (Number(day.dayNumber) !== Number(targetDayNum)) return day;
                return { ...day, items: [...day.items, ...movedItems] };
              });

              onUpdatePlan({ ...plan, days: updatedDays });
              setSelectedItemIds([]);
              setIsEditMode(false);
              alert(`${movedItems.length}개의 일정이 Day ${targetDayNum}으로 이동되었습니다.`);
            }}
            disabled={selectedItemIds.length === 0}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-emerald-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ClipboardList size={18} />
            <span className="text-[10px] font-sans font-bold">이동</span>
          </button>
        </div>
      )}

      {/* Add/Edit Schedule Sheet Modal */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSheetOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:max-w-md md:mx-auto"
            />

            {/* Bottom Sheet Container */}
            <motion.div initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 dark:bg-app-bg rounded-t-[28px] h-[86vh] max-h-[86vh] overflow-hidden flex flex-col shadow-2xl md:max-w-md md:mx-auto border-t border-gray-100 dark:border-subtle-border"
            >
              {/* Drag Indicator Handle */}
              <div className="w-full flex justify-center pt-3 pb-1 bg-white dark:bg-surface-primary">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full" />
              </div>

              {/* Sheet Sticky Header */}
              <div className="flex items-center justify-between px-6 pb-3 pt-1 border-b border-gray-100 dark:border-subtle-border bg-white dark:bg-surface-primary sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <h2 className="font-sans font-bold text-lg text-gray-800 dark:text-text-primary">
                    {editingItem ? (language === 'ko' ? '일정 수정' : 'Edit Activity') : (language === 'ko' ? '새 일정 등록' : 'Add New Activity')}
                  </h2>
                  <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                    Day {sheetDayNum}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setIsSheetOpen(false)}
                    className="bg-gray-100 dark:bg-surface-secondary text-gray-500 dark:text-text-secondary p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={handleSaveSheetData}
                    className="bg-blue-600 text-white font-sans font-bold text-xs px-4 py-2 rounded-full shadow-sm hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
                  >
                    {language === 'ko' ? '저장' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Sheet Scrollable Forms */}
              <div className="p-6 space-y-5 overflow-y-auto pb-12 flex-1 bg-gray-50 dark:bg-app-bg custom-scrollbar">
                {/* Form fields layout */}
                <div className="bg-white dark:bg-surface-primary rounded-2xl p-4 border border-gray-100 dark:border-subtle-border space-y-4">
                  <div className="space-y-1">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '일정 제목' : 'Activity Title'}</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 text-sm font-sans text-gray-800 dark:text-text-primary focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none transition-colors"
                      placeholder={language === 'ko' ? '제목을 입력하세요' : 'Enter activity title'}
                    />
                  </div>

                  {formTrans === 'flight' ? (
                    <div className="space-y-3 bg-gray-50/80 dark:bg-app-bg/60 p-3.5 rounded-2xl border border-gray-100 dark:border-subtle-border">
                      {/* Departure Location */}
                      <div className="space-y-1">
                        <label className="font-sans font-semibold text-xs text-gray-600 dark:text-zinc-300 pl-1 flex items-center gap-1.5">
                          <PlaneTakeoff size={14} className="text-blue-500" />
                          {language === 'ko' ? '출발지 (공항/장소)' : 'Departure (Airport/Place)'}
                        </label>
                        <GooglePlaceInput
                          value={formLocation}
                          address={formLocationAddress}
                          placeId={formLocationPlaceId}
                          icon={<PlaneTakeoff size={16} className="text-blue-500" />}
                          onChange={(val, addr, latLng, placeId) => {
                            setFormLocation(val);
                            if (addr !== undefined || latLng !== undefined || placeId !== undefined) {
                              setFormLocationAddress(addr || '');
                              setFormLocationLatLng(latLng || undefined);
                              setFormLocationPlaceId(placeId || '');
                            } else {
                              setFormLocationAddress('');
                              setFormLocationLatLng(undefined);
                              setFormLocationPlaceId('');
                            }
                          }}
                          placeholder={language === 'ko' ? '출발 공항 또는 장소 입력/검색' : 'Enter or search departure place'}
                          language={language}
                        />
                      </div>

                      {/* Arrival Location */}
                      <div className="space-y-1">
                        <label className="font-sans font-semibold text-xs text-gray-600 dark:text-zinc-300 pl-1 flex items-center gap-1.5">
                          <PlaneLanding size={14} className="text-emerald-500" />
                          {language === 'ko' ? '도착지 (공항/장소)' : 'Arrival / Destination (Airport/Place)'}
                        </label>
                        <GooglePlaceInput
                          value={formArrivalLocation}
                          address={formArrivalLocationAddress}
                          placeId={formArrivalLocationPlaceId}
                          icon={<PlaneLanding size={16} className="text-emerald-500" />}
                          onChange={(val, addr, latLng, placeId) => {
                            setFormArrivalLocation(val);
                            if (addr !== undefined || latLng !== undefined || placeId !== undefined) {
                              setFormArrivalLocationAddress(addr || '');
                              setFormArrivalLocationLatLng(latLng || undefined);
                              setFormArrivalLocationPlaceId(placeId || '');
                            } else {
                              setFormArrivalLocationAddress('');
                              setFormArrivalLocationLatLng(undefined);
                              setFormArrivalLocationPlaceId('');
                            }
                          }}
                          placeholder={language === 'ko' ? '도착 공항 또는 장소 입력/검색' : 'Enter or search destination place'}
                          language={language}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '장소 / 위치' : 'Place / Location'}</label>
                      <GooglePlaceInput
                        value={formLocation}
                        address={formLocationAddress}
                        placeId={formLocationPlaceId}
                        onChange={(val, addr, latLng, placeId) => {
                          setFormLocation(val);
                          if (addr !== undefined || latLng !== undefined || placeId !== undefined) {
                            setFormLocationAddress(addr || '');
                            setFormLocationLatLng(latLng || undefined);
                            setFormLocationPlaceId(placeId || '');
                          } else {
                            setFormLocationAddress('');
                            setFormLocationLatLng(undefined);
                            setFormLocationPlaceId('');
                          }
                        }}
                        placeholder={language === 'ko' ? '장소 검색 (예: 도쿄 타워)' : 'Search place (e.g., Tokyo Tower)'}
                        language={language}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '시작 시간' : 'Start Time'}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formTime}
                          readOnly
                          onClick={() => {
                            setTimePickerTarget('start');
                            const parsed = parseTimeToPickerState(formTime);
                            setPickerAmPm(parsed.amPm);
                            setPickerHour(parsed.hour);
                            setPickerMinute(parsed.minute);
                            setIsTimePickerOpen(true);
                          }}
                          className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 text-sm font-sans text-gray-800 dark:text-text-primary cursor-pointer focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none transition-colors pr-10"
                          placeholder={language === 'ko' ? '예: 10:30 AM' : 'e.g., 10:30 AM'}
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <Clock size={16} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '종료 시간' : 'End Time'}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formEndTime}
                          readOnly
                          onClick={() => {
                            setTimePickerTarget('end');
                            const parsed = parseTimeToPickerState(formEndTime || addMinutesToTime(formTime, 60, language));
                            setPickerAmPm(parsed.amPm);
                            setPickerHour(parsed.hour);
                            setPickerMinute(parsed.minute);
                            setIsTimePickerOpen(true);
                          }}
                          className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 text-sm font-sans text-gray-800 dark:text-text-primary cursor-pointer focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none transition-colors pr-10"
                          placeholder={language === 'ko' ? '예: 11:30 AM' : 'e.g., 11:30 AM'}
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <Clock size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {formTime && formEndTime && (
                    <div className="text-xs text-gray-500 pl-1 -mt-2">
                      {language === 'ko' ? '체류 예상 시간:' : 'Estimated Duration:'} {(() => {
                        const startMins = convertTimeToMinutes(formTime);
                        const endMins = convertTimeToMinutes(formEndTime);
                        let diff = endMins - startMins;
                        if (diff < 0) diff += 24 * 60;
                        const hours = Math.floor(diff / 60);
                        const mins = diff % 60;
                        if (hours > 0) {
                          return language === 'ko' ? `${hours}시간 ${mins}분` : `${hours}h ${mins}m`;
                        }
                        return language === 'ko' ? `${mins}분` : `${mins}m`;
                      })()}
                    </div>
                  )}

                  {suggestedStartTime && formManualTimeOverride && convertTimeToMinutes(formTime) < convertTimeToMinutes(suggestedStartTime) && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] p-2.5 rounded-xl flex items-start gap-1.5 mt-2">
                      <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
                      <div className="font-sans leading-relaxed flex-1">
                        {language === 'ko'
                          ? `현재 이동시간 기준으로 약 ${convertTimeToMinutes(suggestedStartTime) - convertTimeToMinutes(formTime)}분 늦을 수 있어요. (추천: ${suggestedStartTime})`
                          : `Based on travel time, you may be ${convertTimeToMinutes(suggestedStartTime) - convertTimeToMinutes(formTime)} minutes late. (Suggested: ${suggestedStartTime})`}
                        <div className="mt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormTime(suggestedStartTime);
                              setFormManualTimeOverride(false);
                            }}
                            className="font-bold underline text-amber-900"
                          >
                            {language === 'ko' ? '추천 시간 적용' : 'Apply Suggested'}
                          </button>
                          <span className="text-amber-700/50">|</span>
                          <span className="font-medium text-amber-700">
                            {language === 'ko' ? '그대로 유지' : 'Keep it'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 mt-3">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '비용' : 'Cost'}</label>
                    <input
                      type="text"
                      value={formCost}
                      onChange={(e) => setFormCost(e.target.value)}
                      className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 text-sm font-sans text-gray-800 dark:text-text-primary focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none transition-colors"
                      placeholder={language === 'ko' ? '예: ¥2,570' : 'e.g., ¥2,570'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '일정 내용' : 'Activity Notes'}</label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 text-sm font-sans text-gray-800 dark:text-text-primary focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none resize-none transition-colors"
                      rows={3}
                      placeholder={language === 'ko' ? '자유롭게 기록해보세요' : 'Feel free to write notes'}
                    ></textarea>
                  </div>
                </div>

                {/* Optional Info Box */}
                <div className="bg-white dark:bg-surface-primary rounded-2xl p-4 border border-gray-100 dark:border-subtle-border space-y-4">
                  {/* Transportation buttons selection */}
                  <div className="space-y-2">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '이동 수단' : 'Transportation'}</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(['walk', 'bus', 'car', 'bike', 'flight'] as TransportationType[]).map((type) => {
                        const isSelected = formTrans === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setFormTrans(type);
                              setFormTransLine('');
                              setFormDuration('');
                              setFlightInfo(null);
                              setSearchMessage('');
                            }}
                            className={`w-full flex flex-col items-center justify-center py-2.5 rounded-xl border transition-colors duration-150 ease-out ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400'
                                : 'bg-gray-50 dark:bg-app-bg border-transparent text-gray-400 dark:text-text-tertiary hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-[#13121a]'
                            }`}
                          >
                            {getTransIcon(type, 18)}
                            <span className="text-[10px] mt-1 font-bold">{getTransLabel(type)}</span>
                          </button>
                        );
                      })}
                    </div>

                    {(formTrans === 'car' || formTrans === 'taxi') && (
                      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-400 text-[10px] p-2.5 rounded-xl flex items-start gap-1.5 mt-2">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <p className="font-sans leading-relaxed">
                          {language === 'ko'
                            ? '교통 정체 등 도로 상황에 따라 소요 시간이 변동될 수 있습니다.'
                            : 'Travel duration may vary depending on traffic conditions.'}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 pt-2 relative">
                      {formTrans === 'flight' ? (
                          <div className="relative">
                              <input
                                  type="text"
                                  value={formTransLine}
                                  onChange={(e) => setFormTransLine(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleFlightSearch()}
                                  className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 pr-10 text-xs font-sans text-gray-800 dark:text-text-primary focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none transition-colors"
                                  placeholder={language === 'ko' ? '항공편 번호 (예: KE428)' : 'Flight number (e.g., KE428)'}
                              />
                              <button onClick={() => handleFlightSearch(false)} className="absolute right-3 top-3 text-gray-400 hover:text-blue-600 disabled:opacity-50" disabled={isSearchingFlight}>
                                  <Search size={16} />
                              </button>
                              {isSearchingFlight ? (
                                  <div className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5 px-2.5 py-2 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                      <Plane size={13} className="animate-spin text-blue-500 shrink-0" />
                                      <span>{language === 'ko' ? '항공편 정보를 확인하고 있어요...' : 'Checking flight information...'}</span>
                                  </div>
                              ) : flightInfo ? (
                                  <div className="mt-2 p-2.5 bg-blue-50/70 dark:bg-[#181726] border border-blue-200/60 dark:border-blue-800/40 rounded-xl text-xs font-sans space-y-1 shadow-xs">
                                      <div className="flex items-center justify-between gap-1">
                                          <span className="font-extrabold text-blue-900 dark:text-blue-200">{flightInfo.airline} ({flightInfo.flightKey})</span>
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                              flightInfo.source === 'stable_profile'
                                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                          }`}>
                                              {language === 'ko' ? flightInfo.sourceLabelKo : flightInfo.sourceLabelEn}
                                          </span>
                                      </div>
                                      <div className="text-gray-600 dark:text-gray-300 text-[11px]">
                                          {flightInfo.departureAirport} → {flightInfo.arrivalAirport}
                                      </div>
                                      <div className="font-extrabold text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between pt-0.5">
                                          <span>{flightInfo.duration}</span>
                                          <button
                                              type="button"
                                              onClick={() => handleFlightSearch(true)}
                                              className="text-[10px] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-normal flex items-center gap-0.5"
                                              title="새로고침"
                                          >
                                              <RefreshCw size={10} />
                                              {language === 'ko' ? '새로고침' : 'Refresh'}
                                          </button>
                                      </div>
                                  </div>
                              ) : searchMessage ? (
                                  <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/30 p-2.5 rounded-xl font-medium whitespace-pre-line">
                                      {searchMessage}
                                  </div>
                              ) : null}
                          </div>
                      ) : (
                          <input
                              type="text"
                              value={formTransLine}
                              onChange={(e) => setFormTransLine(e.target.value)}
                              className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 text-xs font-sans text-gray-800 dark:text-text-primary focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none transition-colors"
                              placeholder={language === 'ko' ? '이동 수단 상세' : 'Transportation details'}
                          />
                      )}
                      <input
                        type="text"
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                        className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 text-xs font-sans text-gray-800 dark:text-text-primary focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none transition-colors"
                        placeholder={language === 'ko' ? '이동 소요 시간 (예: 30분, 45분)' : 'Travel duration (e.g., 30 mins, 45 mins)'}
                      />
                    </div>
                  </div>

                  {/* Checklist input group */}
                  <div className="space-y-3 pt-3 border-t border-gray-50 dark:border-subtle-border">
                    <div className="flex items-center justify-between">
                      <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '체크리스트' : 'Checklist'}</label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={newCheckItemText}
                          onChange={(e) => setNewCheckItemText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddChecklistItem();
                            }
                          }}
                          className="bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3 py-1.5 text-xs font-sans text-gray-700 dark:text-zinc-300 outline-none focus:border-blue-500"
                          placeholder={language === 'ko' ? '새 할 일 추가' : 'Add new task'}
                        />
                        <button
                          type="button"
                          onClick={handleAddChecklistItem}
                          className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 p-1.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/60 active:scale-95 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {formChecklist.length > 0 && (
                      <div className="space-y-2">
                        {formChecklist.map((chk) => (
                          <div
                            key={chk.id}
                            className="flex items-center justify-between bg-gray-50 dark:bg-app-bg p-3 rounded-xl border border-gray-100/50 dark:border-subtle-border"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={chk.checked}
                                onChange={() => {
                                  setFormChecklist(
                                    formChecklist.map((item) =>
                                      item.id === chk.id ? { ...item, checked: !item.checked } : item
                                    )
                                  );
                                }}
                                className="rounded border-gray-200 text-blue-600 focus:ring-blue-500/20 h-4 w-4 bg-transparent cursor-pointer"
                              />
                              <span
                                className={`font-sans text-xs ${
                                  chk.checked ? 'line-through text-gray-400 dark:text-text-tertiary' : 'text-gray-700 dark:text-zinc-300'
                                }`}
                              >
                                {chk.text}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveChecklistItem(chk.id)}
                              className="text-gray-400 hover:text-rose-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Photo additions simulator */}
                  <div className="space-y-3 pt-3 border-t border-gray-50 dark:border-subtle-border">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '사진 등록' : 'Add Photos'}</label>
                    <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x">
                      {/* Simulating preset hotlink image additions */}
                      <button
                        type="button"
                        onClick={() => {
                          const presetUrls = [
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDhG9fmczTvzS3iU6S-HtXOsixJBGqzktg0aaQ44y0iDBfeg6SKHDBeI_0c1tCx1I4BYdo-LL9d6YBlDmSLzSWrG-DqISbOMf31OhaOWrynXwW97Tu6PkbPle2FQCxWn9B5HI7Wio-OC9EacngjWehBUMk2COI0Qj628lj2dKeGN9GSpUhlJ8SkdOVFBMsV6ZbcvofqW8gXqannIj5g8rneeBmFyHcyXYfX0WvryT1kzqbQHdlukRJA_tXnX4r5afYogwhs5TJD4z',
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuCunSARS6lJPHGy-yiWsqeOKCWeJA3zjBpNbS3MUt3QALmR3C-Fp2Q74qFhk-9xw1OAsQZdFxevsZX9Oltbn3WTocawUgwuIuI-z3c7SCKuPu412pILcKZXFXyi5A5-ky-UCRHP-vThiyZsceEU4CiLsYftHl_8H8TsatPG7n31dcNvol7BfshiVQe25TsF3y1lU3Ar-WQ_3L3IK0rQ6hCo9smb07GnrENXx9KfmKGBu2f2rruns3mGXFPEazSxHggiuK9q_sn3Skox',
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuDxm554cBa4mZ-t2u2Od-gfse_yv35BpDsJNItAY19gnnhROGQ6BDt7O7AESBYxQhMeTR2ykABIpgX_oXCT9uZHUTbd3pxvAwhF9uW-pmtS04fYSHXF2hWPWV3NnXPOJTxC0L737rVJyJ_rRNGDvdgFcE-qMbFf1u0RIm1x38xhEzZIAzV2_AMurbckG6gfrQLz_h9NhFPITHXm6zA6ijLyACgD0BQKa4jQW0lczp6tDOnba1vkvZG0v7a4b451tABn4U74F8iX8KZx'
                          ];
                          // Choose one of the preset image urls randomly or next-in-turn
                          const selectedUrl = presetUrls[formImages.length % presetUrls.length];
                          if (!formImages.includes(selectedUrl)) {
                            setFormImages([...formImages, selectedUrl]);
                          }
                        }}
                        className="min-w-[80px] h-[80px] rounded-xl border-2 border-dashed border-gray-200 dark:border-subtle-border flex flex-col items-center justify-center text-gray-400 dark:text-text-tertiary hover:text-blue-500 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all snap-start flex-shrink-0"
                      >
                        <Plus size={16} />
                        <span className="text-[10px] font-bold mt-1">{language === 'ko' ? '추가' : 'Add'}</span>
                      </button>

                      {formImages.map((imgUrl, i) => (
                        <div
                          key={i}
                          className="min-w-[80px] h-[80px] rounded-xl overflow-hidden relative snap-start flex-shrink-0 border border-gray-100 dark:border-subtle-border"
                        >
                          <img src={imgUrl} alt="Uploaded" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setFormImages(formImages.filter((url) => url !== imgUrl))}
                            className="absolute top-1.5 right-1.5 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-all active:scale-90"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delete Activity Full-Width Button at Bottom of Edit Modal */}
                {editingItem && (
                  <div className="pt-2 pb-4">
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteItem(editingItem.id);
                        setIsSheetOpen(false);
                      }}
                      className="w-full py-3.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-sans font-bold text-sm rounded-2xl border border-rose-200/50 dark:border-rose-900/40 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Trash2 size={16} />
                      <span>{language === 'ko' ? '일정 삭제' : 'Delete Activity'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sliding Time Picker Bottom Sheet Overlay */}
              <AnimatePresence>
                {isTimePickerOpen && (
                  <>
                    <motion.div initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsTimePickerOpen(false)}
                      className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[1px] rounded-t-[28px]"
                    />

                    <motion.div initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                      className="absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-surface-primary rounded-t-[24px] border-t border-gray-100 dark:border-subtle-border shadow-[0_-10px_35px_rgba(0,0,0,0.12)] flex flex-col p-5 space-y-4"
                    >
                      {/* Drag Handle */}
                      <div className="w-full flex justify-center -mt-2 -mb-1">
                        <div className="w-8 h-1 bg-gray-200 dark:bg-surface-secondary rounded-full" />
                      </div>

                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-gray-50 dark:border-subtle-border pb-3">
                        <span className="font-sans font-bold text-sm text-gray-800 dark:text-text-primary">
                          {language === 'ko' ? '시간대/시간 선택' : 'Select Time'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const formattedTime = `${pickerHour.toString().padStart(2, '0')}:${pickerMinute.toString().padStart(2, '0')} ${pickerAmPm}`;
                            if (timePickerTarget === 'start') {
                              setFormTime(formattedTime);
                              setFormManualTimeOverride(true);
                            } else {
                              setFormEndTime(formattedTime);
                            }
                            setIsTimePickerOpen(false);
                          }}
                          className="bg-blue-600 text-white text-xs font-bold px-4.5 py-2 rounded-full hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                        >
                          {language === 'ko' ? '선택 완료' : 'Done'}
                        </button>
                      </div>

                      {/* AM / PM Segment Buttons */}
                      <div className="flex bg-gray-100 dark:bg-app-bg p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPickerAmPm('AM')}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                            pickerAmPm === 'AM'
                              ? 'bg-white dark:bg-surface-primary text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-gray-400 dark:text-stone-500 hover:text-gray-600'
                          }`}
                        >
                          AM (오전)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPickerAmPm('PM')}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                            pickerAmPm === 'PM'
                              ? 'bg-white dark:bg-surface-primary text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-gray-400 dark:text-stone-500 hover:text-gray-600'
                          }`}
                        >
                          PM (오후)
                        </button>
                      </div>

                      {/* Touch Scroll Wheels for Hours and Minutes */}
                      <div className="grid grid-cols-2 gap-4 py-1.5">
                        <TimeScrollWheel
                          value={pickerHour}
                          min={1}
                          max={12}
                          onChange={setPickerHour}
                          label={language === 'ko' ? '시 (Hour)' : 'Hour'}
                          zeroPad={true}
                        />
                        <TimeScrollWheel
                          value={pickerMinute}
                          min={0}
                          max={59}
                          onChange={setPickerMinute}
                          label={language === 'ko' ? '분 (Minute)' : 'Minute'}
                          zeroPad={true}
                        />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {isShareModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md md:max-w-md md:mx-auto"
            />

            {/* Bottom/Center Share Drawer */}
            <motion.div initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 rounded-t-[28px] max-h-[92vh] flex flex-col shadow-2xl md:max-w-md md:mx-auto overflow-hidden"
            >
              {/* Static Header Section (Non-scrolling, containing handle + title) */}
              <div className="shrink-0 bg-white border-b border-gray-100 rounded-t-[28px] z-10 shadow-sm">
                {/* Drag Indicator Handle */}
                <div className="w-full flex justify-center py-3">
                  <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header Title Bar */}
                <div className="flex items-center justify-between px-6 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📸</span>
                    <h2 className="font-sans font-black text-base text-gray-800">
                      여행 일정 카드 만들기
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="bg-gray-100 text-gray-500 p-2 rounded-full hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Body Section */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 pb-12 custom-scrollbar">
                
                {/* Style Customizer */}
                <div className="space-y-4">
                  <div>
                    <label className="font-sans font-extrabold text-xs text-gray-500 uppercase tracking-wider block mb-2">
                      1. 카드 테마 스타일 선택
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { id: 'slate', name: '네이비', bg: 'bg-[#1a2238]' },
                        { id: 'pink', name: '아이보리', bg: 'bg-[#FAF9F6] border border-stone-200' },
                        { id: 'green', name: '세이지', bg: 'bg-[#202c25]' },
                        { id: 'midnight', name: '차콜', bg: 'bg-[#16161a]' },
                        { id: 'custom', name: '커스텀', bg: '' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setShareTheme(t.id as any)}
                          className={`py-2 px-0.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1.5 ${
                            shareTheme === t.id
                              ? 'border-blue-600 bg-white text-blue-600 shadow-sm'
                              : 'border-gray-200 bg-white/50 text-gray-500 hover:bg-white'
                          }`}
                        >
                          {t.id === 'custom' ? (
                            <div
                              className="w-4 h-4 rounded-full border border-gray-200/50"
                              style={{ background: `linear-gradient(135deg, ${customStartColor}, ${customEndColor})` }}
                            />
                          ) : (
                            <div className={`w-4 h-4 rounded-full ${t.bg}`} />
                          )}
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Theme Setup Panel */}
                  <AnimatePresence>
                    {shareTheme === 'custom' && (
                      <motion.div initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm space-y-3 overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold text-xs text-gray-700">나만의 그라데이션 색상</span>
                          <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                            ✨ 자동 저장 중
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 block">시작 색상</span>
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/60 p-1.5 rounded-xl">
                              <input
                                type="color"
                                value={customStartColor}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomStartColor(val);
                                  localStorage.setItem('trippo_custom_theme_start', val);
                                }}
                                className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent shrink-0"
                              />
                              <span className="font-mono text-[10px] font-bold text-gray-600">{customStartColor.toUpperCase()}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 block">종료 색상</span>
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/60 p-1.5 rounded-xl">
                              <input
                                type="color"
                                value={customEndColor}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomEndColor(val);
                                  localStorage.setItem('trippo_custom_theme_end', val);
                                }}
                                className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent shrink-0"
                              />
                              <span className="font-mono text-[10px] font-bold text-gray-600">{customEndColor.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation presets */}
                        <div className="space-y-1 pt-1 border-t border-gray-50">
                          <span className="text-[10px] font-bold text-gray-400 block">추천 컬러셋 프리셋</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { start: '#a855f7', end: '#6366f1', label: '퍼플 헤이즈' },
                              { start: '#f43f5e', end: '#fb923c', label: '오렌지 선셋' },
                              { start: '#10b981', end: '#3b82f6', label: '오션 브리즈' },
                              { start: '#ec4899', end: '#8b5cf6', label: '핑크 판타지' },
                              { start: '#f59e0b', end: '#ef4444', label: '파이어 번' },
                            ].map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setCustomStartColor(p.start);
                                  setCustomEndColor(p.end);
                                  localStorage.setItem('trippo_custom_theme_start', p.start);
                                  localStorage.setItem('trippo_custom_theme_end', p.end);
                                }}
                                className="px-1.5 py-1 bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-lg text-[9px] font-bold text-gray-600 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              >
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: `linear-gradient(135deg, ${p.start}, ${p.end})` }}
                                />
                                <span className="text-[9px]">{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="font-sans font-extrabold text-xs text-gray-500 uppercase tracking-wider block mb-2">
                      2. 공유할 일정 범위
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShareScope('current')}
                        className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          shareScope === 'current'
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">📅</span>
                        <span>현재 선택한 일차 ({selectedDayNum}일차)</span>
                      </button>
                      <button
                        onClick={() => setShareScope('all')}
                        className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          shareScope === 'all'
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🗺️</span>
                        <span>전체 일정 한눈에 보기</span>
                      </button>
                    </div>
                  </div>
                </div>

                 {/* Hidden, fully expanded card specifically for high-res lossless image download/clipboard generation */}
                <div className="absolute pointer-events-none opacity-0 select-none" style={{ left: '-9999px', top: '-9999px' }}>
                  <div
                    ref={shareCardCaptureRef}
                    className={`w-[340px] p-6 relative overflow-hidden flex flex-col justify-between shrink-0 shadow-xl ${activeCardTheme.cardBgClass}`}
                    style={{
                      minHeight: '490px',
                      borderRadius: '28px',
                      ...activeCardTheme.style
                    }}
                  >
                    {/* Premium Decorative elements - ambient glow circles */}
                    {!activeCardTheme.isLight && (
                      <>
                        <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                        <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
                      </>
                    )}
                    {activeCardTheme.isLight && (
                      <>
                        <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full bg-stone-200/40 blur-2xl pointer-events-none"></div>
                        <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-stone-100/30 blur-xl pointer-events-none"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
                      </>
                    )}

                    <div className="relative z-10 space-y-4 flex-1 flex flex-col">
                      {/* Ticket top header */}
                      <div className={`flex justify-between items-center border-b ${activeCardTheme.borderClass} pb-3`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">✈️</span>
                          <span className={`font-sans font-black text-[9px] tracking-[0.2em] uppercase ${activeCardTheme.headerSubTextClass}`}>TRIPPO BOARDING PASS</span>
                        </div>
                        <span className={`text-[8px] font-mono font-bold ${activeCardTheme.badgeClass} px-2 py-0.5 rounded-md backdrop-blur-md uppercase tracking-wider`}>
                          {shareScope === 'current' ? `DAY ${selectedDayNum}` : 'ALL DAYS'}
                        </span>
                      </div>

                      {/* Title and details */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-sans font-extrabold text-lg tracking-tight leading-snug ${activeCardTheme.textClass} drop-shadow-sm`}>
                            {plan.title}
                          </h3>
                          <div className={`font-mono text-[9px] ${activeCardTheme.isLight ? 'text-stone-500 bg-stone-100 border-stone-200' : 'text-white/60 bg-black/15 border-white/5'} px-1.5 py-0.5 rounded border uppercase whitespace-nowrap`}>
                            PASS NO. {plan.days.length}D-{selectedDayNum}
                          </div>
                        </div>
                        <p className={`font-sans text-[9.5px] ${activeCardTheme.subTextClass} flex items-center gap-1.5`}>
                          <span>📅</span> {plan.startDate} ~ {plan.endDate} ({plan.durationText})
                        </p>
                      </div>

                      {/* Elegant Dashed Ticket Line */}
                      <div className="relative my-1">
                        <div className={`border-t border-dashed ${activeCardTheme.dividerClass} w-full`}></div>
                        {/* Left notch */}
                        <div className={`absolute left-[-29px] top-[-6px] w-3.5 h-3.5 rounded-full ${activeCardTheme.notchBg} shadow-inner z-20`}></div>
                        {/* Right notch */}
                        <div className={`absolute right-[-29px] top-[-6px] w-3.5 h-3.5 rounded-full ${activeCardTheme.notchBg} shadow-inner z-20`}></div>
                      </div>

                      {/* Itinerary Contents Section */}
                      <div className="space-y-3 flex-1 flex flex-col justify-center">
                        {shareScope === 'current' ? (
                          <div className={`space-y-3 ${activeCardTheme.innerBoxClass} rounded-2xl p-4 border backdrop-blur-md flex-1 flex flex-col justify-between`}>
                            <div>
                              <div className={`flex justify-between items-center border-b ${activeCardTheme.borderClass} pb-2 mb-2`}>
                                <span className={`font-sans text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${activeCardTheme.textClass}`}>
                                  <span className="text-xs">📅</span> Day {selectedDayNum} ({translateDayOfWeek(activeDay.dayOfWeek, language)})
                                </span>
                                <span className={`font-mono text-[9px] font-bold ${activeCardTheme.subTextClass}`}>
                                  {activeDay.date}
                                </span>
                              </div>

                              {activeDay.items.length === 0 ? (
                                <div className={`flex flex-col items-center justify-center py-8 ${activeCardTheme.textMutedClass} space-y-1`}>
                                  <span className="text-lg">📭</span>
                                  <p className="font-sans text-[10px]">{language === 'ko' ? '등록된 일정이 없습니다.' : 'No registered activities.'}</p>
                                </div>
                              ) : (
                                <div className={`space-y-3 relative pl-4 before:content-[''] before:absolute before:left-[4px] before:top-1.5 before:bottom-1.5 before:w-[1px] ${activeCardTheme.isLight ? "before:bg-stone-200" : "before:bg-white/15"}`}>
                                  {activeDay.items.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="relative group">
                                      {/* Premium glass-morphic timeline node */}
                                      <div className={`absolute left-[-16px] top-[4px] w-2.5 h-2.5 rounded-full ${activeCardTheme.isLight ? 'bg-stone-100 border-stone-400' : 'bg-white/25 border-white/60'} flex items-center justify-center shadow-sm`}>
                                        <div className={`w-1 h-1 rounded-full ${activeCardTheme.isLight ? 'bg-stone-600' : 'bg-white'}`} />
                                      </div>
                                      <div>
                                        <div className="flex items-baseline justify-between gap-1.5">
                                          <span className={`font-sans font-bold text-xs tracking-tight truncate max-w-[185px] ${activeCardTheme.textClass}`}>
                                            {item.title}
                                          </span>
                                          <span className={`font-mono text-[8px] font-bold ${activeCardTheme.isLight ? 'bg-stone-200/60 text-stone-700' : 'bg-white/10 text-white'} px-1.5 py-0.5 rounded-md whitespace-nowrap`}>
                                            {item.time}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className={`space-y-2 ${activeCardTheme.innerBoxClass} rounded-2xl p-3 border backdrop-blur-md flex-1`}>
                            {plan.days.map((day) => (
                              <div key={day.dayNumber} className={`${activeCardTheme.isLight ? 'bg-stone-100/50 border-stone-200/40' : 'bg-white/5 border-white/5'} rounded-xl p-2.5 border space-y-1.5`}>
                                <div className={`flex justify-between items-center border-b ${activeCardTheme.isLight ? 'border-stone-200/40' : 'border-white/5'} pb-1 mb-1`}>
                                  <span className={`font-sans text-[10px] font-extrabold flex items-center gap-1 ${activeCardTheme.textClass}`}>
                                    <span className="text-[10px]">📍</span> {language === 'ko' ? `${day.dayNumber}일차 (${day.dayOfWeek})` : `Day ${day.dayNumber} (${translateDayOfWeek(day.dayOfWeek, language)})`}
                                  </span>
                                </div>
                                {day.items.length === 0 ? (
                                  <p className={`text-[9px] italic ${activeCardTheme.textMutedClass}`}>{language === 'ko' ? '등록된 일정 없음' : 'No activities'}</p>
                                ) : (
                                  <div className={`flex flex-col gap-1 text-[9px] ${activeCardTheme.isLight ? 'text-stone-700' : 'text-white/80'}`}>
                                    {day.items.map((item, idx) => (
                                      <div key={`${item.id}-${idx}`} className="flex justify-between items-center gap-1.5">
                                        <span className="font-sans font-bold truncate max-w-[170px]">
                                          <span className={`${activeCardTheme.isLight ? 'text-stone-400' : 'text-white/40'} font-mono mr-1`}>{idx + 1}</span>{item.title}
                                        </span>
                                        <span className={`font-mono text-[7px] ${activeCardTheme.isLight ? 'text-stone-400' : 'text-white/50'}`}>{item.time}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom branding footer styled as ticket details */}
                    <div className={`border-t ${activeCardTheme.dividerClass} pt-4 flex justify-between items-center relative z-10 mt-2`}>
                      <div className="text-left space-y-0.5">
                        <p className={`font-mono text-[7px] tracking-wider ${activeCardTheme.textSystemMutedClass} uppercase`}>SYSTEM POWERED BY</p>
                        <p className={`font-logo font-semibold text-xs tracking-wide ${activeCardTheme.textClass}`}>
                          Trippo
                        </p>
                      </div>

                      {/* Beautiful simulated barcode for digital boarding pass aesthetic */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex gap-[1.5px] items-stretch h-6 opacity-60">
                          {[1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 1, 3, 2, 1, 2, 1].map((width, idx) => (
                            <div
                              key={idx}
                              className={`${activeCardTheme.barcodeClass} h-full shrink-0`}
                              style={{ width: `${width}px` }}
                            />
                          ))}
                        </div>
                        <span className={`font-mono text-[6.5px] ${activeCardTheme.textMutedClass} tracking-[0.25em]`}>TRIPPO-SYSTEM-2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shareable Card Canvas Container (Live interactive preview) */}
                <div className="space-y-2">
                  <label className="font-sans font-extrabold text-xs text-gray-500 uppercase tracking-wider block">
                    미리보기
                  </label>
                  
                  <div className="bg-gray-100 rounded-3xl p-4 shadow-inner flex justify-center overflow-hidden border border-gray-200/50 relative">
                    {/* Capturable Target */}
                    <div
                      ref={shareCardRef}
                      className={`w-[340px] p-6 relative overflow-hidden flex flex-col justify-between shrink-0 select-none shadow-xl ${activeCardTheme.cardBgClass}`}
                      style={{
                        minHeight: '490px',
                        borderRadius: '28px',
                        ...activeCardTheme.style
                      }}
                    >
                      {/* Premium Decorative elements - ambient glow circles */}
                      {!activeCardTheme.isLight && (
                        <>
                          <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                          <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none"></div>
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
                        </>
                      )}
                      {activeCardTheme.isLight && (
                        <>
                          <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full bg-stone-200/40 blur-2xl pointer-events-none"></div>
                          <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-stone-100/30 blur-xl pointer-events-none"></div>
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
                        </>
                      )}

                      <div className="relative z-10 space-y-4 flex-1 flex flex-col">
                        {/* Ticket top header */}
                        <div className={`flex justify-between items-center border-b ${activeCardTheme.borderClass} pb-3`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">✈️</span>
                            <span className={`font-sans font-black text-[9px] tracking-[0.2em] uppercase ${activeCardTheme.headerSubTextClass}`}>TRIPPO BOARDING PASS</span>
                          </div>
                          <span className={`text-[8px] font-mono font-bold ${activeCardTheme.badgeClass} px-2 py-0.5 rounded-md backdrop-blur-md uppercase tracking-wider`}>
                            {shareScope === 'current' ? `DAY ${selectedDayNum}` : 'ALL DAYS'}
                          </span>
                        </div>

                        {/* Title and details */}
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`font-sans font-extrabold text-lg tracking-tight leading-snug ${activeCardTheme.textClass} drop-shadow-sm`}>
                              {plan.title}
                            </h3>
                            <div className={`font-mono text-[9px] ${activeCardTheme.isLight ? 'text-stone-500 bg-stone-100 border-stone-200' : 'text-white/60 bg-black/15 border-white/5'} px-1.5 py-0.5 rounded border uppercase whitespace-nowrap`}>
                              PASS NO. {plan.days.length}D-{selectedDayNum}
                            </div>
                          </div>
                          <p className={`font-sans text-[9.5px] ${activeCardTheme.subTextClass} flex items-center gap-1.5`}>
                            <span>📅</span> {plan.startDate} ~ {plan.endDate} ({plan.durationText})
                          </p>
                        </div>

                        {/* Elegant Dashed Ticket Line */}
                        <div className="relative my-1">
                          <div className={`border-t border-dashed ${activeCardTheme.dividerClass} w-full`}></div>
                          {/* Left notch */}
                          <div className={`absolute left-[-29px] top-[-6px] w-3.5 h-3.5 rounded-full ${activeCardTheme.notchBg} shadow-inner z-20`}></div>
                          {/* Right notch */}
                          <div className={`absolute right-[-29px] top-[-6px] w-3.5 h-3.5 rounded-full ${activeCardTheme.notchBg} shadow-inner z-20`}></div>
                        </div>

                        {/* Itinerary Contents Section */}
                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                          {shareScope === 'current' ? (
                            <div className={`space-y-3 ${activeCardTheme.innerBoxClass} rounded-2xl p-4 border backdrop-blur-md flex-1 flex flex-col justify-between`}>
                              <div>
                                <div className={`flex justify-between items-center border-b ${activeCardTheme.borderClass} pb-2 mb-2`}>
                                  <span className={`font-sans text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${activeCardTheme.textClass}`}>
                                    <span className="text-xs">📅</span> Day {selectedDayNum} ({translateDayOfWeek(activeDay.dayOfWeek, language)})
                                  </span>
                                  <span className={`font-mono text-[9px] font-bold ${activeCardTheme.subTextClass}`}>
                                    {activeDay.date}
                                  </span>
                                </div>

                                {activeDay.items.length === 0 ? (
                                  <div className={`flex flex-col items-center justify-center py-8 ${activeCardTheme.textMutedClass} space-y-1`}>
                                    <span className="text-lg">📭</span>
                                    <p className="font-sans text-[10px]">{language === 'ko' ? '등록된 일정이 없습니다.' : 'No registered activities.'}</p>
                                  </div>
                                ) : (
                                  <div className={`space-y-3 relative pl-4 before:content-[''] before:absolute before:left-[4px] before:top-1.5 before:bottom-1.5 before:w-[1px] ${activeCardTheme.isLight ? "before:bg-stone-200" : "before:bg-white/15"}`}>
                                    {activeDay.items.slice(0, 5).map((item, idx) => (
                                      <div key={`${item.id}-${idx}`} className="relative group">
                                        {/* Premium glass-morphic timeline node */}
                                        <div className={`absolute left-[-16px] top-[4px] w-2.5 h-2.5 rounded-full ${activeCardTheme.isLight ? 'bg-stone-100 border-stone-400' : 'bg-white/25 border-white/60'} flex items-center justify-center shadow-sm`}>
                                          <div className={`w-1 h-1 rounded-full ${activeCardTheme.isLight ? 'bg-stone-600' : 'bg-white'}`} />
                                        </div>
                                        <div>
                                          <div className="flex items-baseline justify-between gap-1.5">
                                            <span className={`font-sans font-bold text-xs tracking-tight truncate max-w-[185px] ${activeCardTheme.textClass}`}>
                                              {item.title}
                                            </span>
                                            <span className={`font-mono text-[8px] font-bold ${activeCardTheme.isLight ? 'bg-stone-200/60 text-stone-700' : 'bg-white/10 text-white'} px-1.5 py-0.5 rounded-md whitespace-nowrap`}>
                                              {item.time}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    {activeDay.items.length > 5 && (
                                      <p className={`text-[9px] pl-0.5 font-sans font-medium ${activeCardTheme.subTextClass}`}>
                                        {language === 'ko' ? `+ 외 ${activeDay.items.length - 5}개의 소중한 일정들` : `+ ${activeDay.items.length - 5} more activities`}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className={`space-y-2 ${activeCardTheme.innerBoxClass} rounded-2xl p-3 border backdrop-blur-md max-h-[230px] overflow-y-auto pr-1 custom-scrollbar flex-1`}>
                              {plan.days.map((day) => (
                                <div key={day.dayNumber} className={`${activeCardTheme.isLight ? 'bg-stone-100/50 border-stone-200/40' : 'bg-white/5 border-white/5'} rounded-xl p-2.5 border space-y-1.5`}>
                                  <div className={`flex justify-between items-center border-b ${activeCardTheme.isLight ? 'border-stone-200/40' : 'border-white/5'} pb-1 mb-1`}>
                                    <span className={`font-sans text-[10px] font-extrabold flex items-center gap-1 ${activeCardTheme.textClass}`}>
                                      <span className="text-[10px]">📍</span> {language === 'ko' ? `${day.dayNumber}일차 (${day.dayOfWeek})` : `Day ${day.dayNumber} (${translateDayOfWeek(day.dayOfWeek, language)})`}
                                    </span>
                                  </div>
                                  {day.items.length === 0 ? (
                                    <p className={`text-[9px] italic ${activeCardTheme.textMutedClass}`}>{language === 'ko' ? '등록된 일정 없음' : 'No activities'}</p>
                                  ) : (
                                    <div className={`flex flex-col gap-1 text-[9px] ${activeCardTheme.isLight ? 'text-stone-700' : 'text-white/80'}`}>
                                      {day.items.slice(0, 3).map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="flex justify-between items-center gap-1.5">
                                          <span className="font-sans font-bold truncate max-w-[170px]">
                                            <span className={`${activeCardTheme.isLight ? 'text-stone-400' : 'text-white/40'} font-mono mr-1`}>{idx + 1}</span>{item.title}
                                          </span>
                                          <span className={`font-mono text-[7px] ${activeCardTheme.isLight ? 'text-stone-400' : 'text-white/50'}`}>{item.time}</span>
                                        </div>
                                      ))}
                                      {day.items.length > 3 && (
                                        <span className={`text-[8px] font-bold pl-3 ${activeCardTheme.textMutedClass}`}>
                                          {language === 'ko' ? `+ 외 ${day.items.length - 3}개의 일정 더보기` : `+ ${day.items.length - 3} more activities`}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom branding footer styled as ticket details */}
                      <div className={`border-t ${activeCardTheme.dividerClass} pt-4 flex justify-between items-center relative z-10 mt-2`}>
                        <div className="text-left space-y-0.5">
                          <p className={`font-mono text-[7px] tracking-wider ${activeCardTheme.textSystemMutedClass} uppercase`}>SYSTEM POWERED BY</p>
                          <p className={`font-logo font-semibold text-xs tracking-wide ${activeCardTheme.textClass}`}>
                            Trippo
                          </p>
                        </div>

                        {/* Beautiful simulated barcode for digital boarding pass aesthetic */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex gap-[1.5px] items-stretch h-6 opacity-60">
                            {[1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 1, 3, 2, 1, 2, 1].map((width, idx) => (
                              <div
                                key={idx}
                                className={`${activeCardTheme.barcodeClass} h-full shrink-0`}
                                style={{ width: `${width}px` }}
                              />
                            ))}
                          </div>
                          <span className={`font-mono text-[6.5px] ${activeCardTheme.textMutedClass} tracking-[0.25em]`}>TRIPPO-SYSTEM-2026</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shared action triggers */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleCopyToClipboard}
                    disabled={isGenerating}
                    className="w-full bg-white hover:bg-gray-100 text-gray-700 font-sans font-bold text-sm py-3 px-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>📋</span>
                    <span>클립보드 복사</span>
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm py-3 px-4 rounded-xl shadow-md shadow-blue-500/15 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} />
                    <span>{isGenerating ? '이미지 생성중...' : '이미지로 저장'}</span>
                  </button>
                </div>

                {/* Mobile Web Share API trigger */}
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    onClick={handleWebShare}
                    disabled={isGenerating}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-sans font-bold text-sm py-3 px-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Share2 size={14} />
                    <span>친구에게 직접 공유하기 (SNS / 카카오톡)</span>
                  </button>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Gallery Modal */}
      <AnimatePresence>
        {viewingImages.length > 0 && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingImages([])}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overscroll-none"
            />
            
            {/* Slide-up Sheet Content */}
            <motion.div initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[101] flex flex-col bg-gray-50 dark:bg-app-bg rounded-t-3xl h-[85vh] md:max-w-md md:mx-auto shadow-2xl overscroll-none"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  setViewingImages([]);
                }
              }}
            >
              {/* Drag Handle Area */}
              <div 
                className="w-full flex justify-center pt-4 pb-2 cursor-pointer active:opacity-70"
                onClick={() => setViewingImages([])}
              >
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              <div className="flex-1 overflow-y-auto px-4 pt-2 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-4 custom-scrollbar">
                {viewingImages.map((src, idx) => (
                  <div key={idx} className="w-full rounded-2xl overflow-hidden bg-white dark:bg-[#15141f] border border-gray-200 dark:border-subtle-border shadow-sm">
                    <img
                      src={src}
                      alt={`Gallery image ${idx + 1}`}
                      className="w-full h-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Companion Sliding Bottom Sheet */}
      <AnimatePresence>
        {isCompanionSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (isCreatingLocalCompanion) {
                  setIsCreatingLocalCompanion(false);
                } else {
                  setIsCompanionSheetOpen(false);
                  setCompanionSearchTerm('');
                  setCompanionSearchResults([]);
                }
              }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overscroll-none"
            />
            
            {/* Slide-up Sheet Content */}
            <motion.div initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[101] flex flex-col bg-gray-50 dark:bg-app-bg rounded-t-3xl h-[85vh] md:max-w-md md:mx-auto shadow-2xl overscroll-none"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  if (isCreatingLocalCompanion) {
                    setIsCreatingLocalCompanion(false);
                  } else {
                    setIsCompanionSheetOpen(false);
                    setCompanionSearchTerm('');
                    setCompanionSearchResults([]);
                  }
                }
              }}
            >
              {/* Drag Handle Area */}
              <div 
                className="w-full flex justify-center pt-4 pb-2 cursor-pointer active:opacity-70"
                onClick={() => {
                  if (isCreatingLocalCompanion) {
                    setIsCreatingLocalCompanion(false);
                  } else {
                    setIsCompanionSheetOpen(false);
                    setCompanionSearchTerm('');
                    setCompanionSearchResults([]);
                  }
                }}
              >
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 border-b border-gray-100 dark:border-subtle-border flex justify-between items-center">
                <h3 className="font-sans font-bold text-base text-gray-800 dark:text-text-primary">
                  {isCreatingLocalCompanion 
                    ? (language === 'ko' ? '일행 생성' : 'Create Companion')
                    : (language === 'ko' ? '일행 추가' : 'Add Companions')}
                </h3>
                
                {/* 일행 생성 Button in top right */}
                {!isCreatingLocalCompanion && (
                  <button
                    onClick={() => setIsCreatingLocalCompanion(true)}
                    className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-sans text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                  >
                    {language === 'ko' ? '일행 생성' : 'Create Companion'}
                  </button>
                )}
              </div>

              {/* Sheet Body */}
              <div 
                className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-5 custom-scrollbar"
                style={{ scrollbarGutter: 'stable' }}
              >
                {isCreatingLocalCompanion ? (
                  /* Create Local Companion View */
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="w-full text-center">
                      <p className="text-sm text-gray-500 dark:text-text-secondary">
                        {language === 'ko' 
                          ? '직접 일행을 생성합니다.' 
                          : 'I will create a companion directly.'}
                      </p>
                    </div>

                    {/* Profile Photo Editor */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id="local-companion-photo-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setLocalCompanionPhoto(e.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="local-companion-photo-upload"
                        className="cursor-pointer block relative"
                      >
                        {localCompanionPhoto ? (
                          <img 
                            src={localCompanionPhoto} 
                            alt="Profile" 
                            className="w-24 h-24 rounded-full object-cover shadow-sm border-2 border-white dark:border-stone-800"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border-2 border-dashed border-blue-200 dark:border-blue-900/50">
                            <ImageIcon size={32} className="text-blue-300 dark:text-blue-500/50" />
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white dark:border-surface-primary shadow-sm text-white">
                          <Plus size={16} />
                        </div>
                      </label>
                    </div>

                    <div className="space-y-2 w-full">
                      <label className="font-sans font-extrabold text-xs text-gray-400 dark:text-stone-500 uppercase tracking-wider block">
                        {language === 'ko' ? '일행 이름' : 'Companion Name'}
                      </label>
                      <input
                        type="text"
                        value={localCompanionName}
                        onChange={(e) => setLocalCompanionName(e.target.value)}
                        placeholder={language === 'ko' ? '예: 길동이, 엄빠' : 'e.g. Mom, Buddy'}
                        className="w-full bg-white dark:bg-[#15141f] border border-gray-200 dark:border-subtle-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-text-primary"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddLocalCompanion();
                        }}
                      />
                    </div>

                    <button
                      onClick={handleAddLocalCompanion}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm py-3.5 rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      {language === 'ko' ? '일행 생성하기' : 'Create Companion'}
                    </button>
                  </div>
                ) : (
                  /* Main Companions & Friends View */
                  <div className="space-y-5 w-full">
                    
                    {/* 1. Real-Time Invite Section */}
                    <div className="shrink-0 space-y-3 p-4 bg-white dark:bg-[#15141f] border border-gray-200 dark:border-subtle-border rounded-2xl shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <Share2 size={16} className="text-blue-500" />
                        <span className="font-sans font-extrabold text-xs text-gray-800 dark:text-text-primary uppercase tracking-wider block">
                          {language === 'ko' ? '일행 초대 링크' : 'Invite Link'}
                        </span>
                      </div>

                      {!sharedPlanId ? (
                        <div className="space-y-3 py-4 flex flex-col items-center justify-center">
                          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mb-1"></div>
                          <p className="text-[11px] text-gray-500 dark:text-text-secondary">
                            {language === 'ko' ? '초대 링크를 생성하는 중...' : 'Generating invite link...'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          
                          {/* Readonly invite URL input with Copy button */}
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}${window.location.pathname}?sharedPlanId=${sharedPlanId}`}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              className="flex-1 min-w-0 bg-gray-50 dark:bg-stone-900 border border-gray-200 dark:border-subtle-border rounded-xl px-3 py-2 text-xs font-mono text-gray-600 dark:text-stone-300 select-all"
                            />
                            <button
                              onClick={async () => {
                                const inviteUrl = `${window.location.origin}${window.location.pathname}?sharedPlanId=${sharedPlanId}`;
                                try {
                                  await navigator.clipboard.writeText(inviteUrl);
                                  alert(language === 'ko' ? '초대 링크가 복사되었습니다! 📋' : 'Invite link copied! 📋');
                                } catch (e) {
                                  alert(inviteUrl);
                                }
                              }}
                              className="shrink-0 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Copy size={13} />
                              <span>{language === 'ko' ? '링크 복사' : 'Copy Link'}</span>
                            </button>
                          </div>

                          {/* Quick Share Buttons Grid */}
                          <div className="grid grid-cols-4 gap-2 pt-1">
                            {/* KakaoTalk */}
                            <button
                              onClick={() => {
                                const inviteUrl = `${window.location.origin}${window.location.pathname}?sharedPlanId=${sharedPlanId}`;
                                const shareText = language === 'ko'
                                  ? `[Trippo] ${plan.title} 여행 일정을 함께가요! 🎈 초대 링크: `
                                  : `[Trippo] Join our travel plan to ${plan.title}! 🎈 Link: `;
                                window.open(`https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
                              }}
                              className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-stone-900/40 hover:bg-slate-100 dark:hover:bg-stone-800/50 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-stone-800 min-w-0"
                            >
                              <img src={KakaoIcon} alt="KakaoTalk" className="w-9 h-9 rounded-full shadow-sm object-cover shrink-0" />
                              <span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary truncate w-full text-center block">
                                {language === 'ko' ? '카카오톡' : 'Kakao'}
                              </span>
                            </button>
                            {/* Messages */}
                            <button
                              onClick={() => {
                                const inviteUrl = `${window.location.origin}${window.location.pathname}?sharedPlanId=${sharedPlanId}`;
                                const shareText = language === 'ko'
                                  ? `[Trippo] ${plan.title} 여행 일정을 함께 만들어요! 🎈\n${inviteUrl}`
                                  : `[Trippo] Join my travel plan to ${plan.title}! 🎈\n${inviteUrl}`;
                                window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_self');
                              }}
                              className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-stone-900/40 hover:bg-slate-100 dark:hover:bg-stone-800/50 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-stone-800 min-w-0"
                            >
                              <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                                <MessageCircle size={16} className="shrink-0" />
                              </div>
                              <span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary truncate w-full text-center block">
                                {language === 'ko' ? '메세지' : 'Messages'}
                              </span>
                            </button>
                            {/* Gmail */}
                            <button
                              onClick={() => {
                                const inviteUrl = `${window.location.origin}${window.location.pathname}?sharedPlanId=${sharedPlanId}`;
                                const subject = language === 'ko'
                                  ? `[Trippo] ${plan.title} 여행 일정에 여러분을 초대합니다! 🎈`
                                  : `[Trippo] Invitation to join travel itinerary for ${plan.title}! 🎈`;
                                const body = language === 'ko'
                                  ? `안녕하세요!\n\n${plan.title} 여행 일정(${plan.startDate} ~ ${plan.endDate})에 초대받으셨습니다.\n아래 링크로 접속하여 일행으로 함께 참여해 보세요:\n\n${inviteUrl}`
                                  : `Hello!\n\nYou have been invited to join the travel itinerary for ${plan.title} (${plan.startDate} ~ ${plan.endDate}).\nPlease click the link below to join as a companion:\n\n${inviteUrl}`;
                                window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                              }}
                              className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-red-950/20 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-stone-800 min-w-0"
                            >
                              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                <Mail size={16} className="shrink-0" />
                              </div>
                              <span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary truncate w-full text-center block">
                                Gmail
                              </span>
                            </button>
                            {/* Native Share (More) */}
                            {typeof navigator !== 'undefined' && navigator.share ? (
                              <button
                                onClick={async () => {
                                  const inviteUrl = `${window.location.origin}${window.location.pathname}?sharedPlanId=${sharedPlanId}`;
                                  try {
                                    await navigator.share({
                                      title: language === 'ko' ? `${plan.title} 여행 일정에 여러분을 초대합니다! 🎈` : `Invitation to join travel itinerary for ${plan.title}! 🎈`,
                                      text: language === 'ko' 
                                        ? `안녕하세요!\n\n${plan.title} 여행 일정(${plan.startDate} ~ ${plan.endDate})에 초대받으셨습니다.\n아래 링크로 접속하여 일행으로 함께 참여해 보세요:\n`
                                        : `Hello!\n\nYou have been invited to join the travel itinerary for ${plan.title} (${plan.startDate} ~ ${plan.endDate}).\nPlease click the link below to join as a companion:\n`,
                                      url: inviteUrl
                                    });
                                  } catch (e) {
                                    console.warn('Native share failed or cancelled', e);
                                  }
                                }}
                                className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-stone-900/40 hover:bg-slate-100 dark:hover:bg-stone-800/50 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-stone-800 min-w-0"
                              >
                                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                  <MoreHorizontal size={16} className="shrink-0" />
                                </div>
                                <span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary truncate w-full text-center block">
                                  {language === 'ko' ? '더보기' : 'More'}
                                </span>
                              </button>
                            ) : (
                              <div className="hidden"></div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Added Companions in Active Plan */}
                    <div className="border-t border-b border-gray-100 dark:border-subtle-border py-4 my-2">
                      <span className="font-sans font-extrabold text-xs text-gray-400 dark:text-stone-500 uppercase tracking-wider block mb-2.5">
                        {language === 'ko' ? '추가된 일행' : 'Added Companions'} ({plan.companions?.length || 0})
                      </span>
                      <div className="flex flex-col max-h-[160px] overflow-y-auto custom-scrollbar pr-1 overflow-x-hidden">
                        <AnimatePresence initial={false}>
                          {plan.companions && plan.companions.map((comp) => (
                            <motion.div 
                              key={`added-${comp.id}`}
                              initial={{ opacity: 0, height: 0, scale: 0.95, y: -8, marginBottom: 0 }}
                              animate={{ opacity: 1, height: "auto", scale: 1, y: 0, marginBottom: 8 }}
                              exit={{ 
                                opacity: 0, 
                                height: 0, 
                                scale: 0.95, 
                                y: -8, 
                                marginBottom: 0,
                                transition: {
                                  height: { duration: 0.2 },
                                  opacity: { duration: 0.15 },
                                  scale: { duration: 0.15 },
                                  y: { duration: 0.15 }
                                }
                              }}
                              transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300
                              }}
                              className="w-full overflow-hidden"
                            >
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-[#15141f] border border-gray-100 dark:border-subtle-border rounded-xl shadow-sm">
                                <div className="flex items-center gap-2.5">
                                  {comp.photoURL ? (
                                    <img src={comp.photoURL} alt={comp.name} className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                      comp.isLocal ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {comp.isLocal ? '👤' : '👥'}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-sans font-bold text-xs text-gray-800 dark:text-text-primary flex items-center gap-1.5">
                                      {comp.name}
                                      {comp.isLocal && (
                                        <span className="text-[9px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded font-extrabold">
                                          {language === 'ko' ? '직접 추가' : 'Direct Add'}
                                        </span>
                                      )}
                                    </p>
                                    {comp.email && (
                                      <p className="font-mono text-[10px] text-gray-400 dark:text-stone-500 truncate max-w-[150px]">{comp.email}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {!favoriteUsers.some(f => f.uid === comp.id || f.id === comp.id) && comp.id !== currentUserUid && (
                                    <button
                                      onClick={() => {
                                        setFavoriteUsers(prev => {
                                          const next = [...prev, {
                                            uid: comp.id,
                                            displayName: comp.name,
                                            email: comp.email || '',
                                            photoURL: comp.photoURL || ''
                                          }];
                                          localStorage.setItem('trippo_friends', JSON.stringify(next));
                                          return next;
                                        });
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                      title={language === 'ko' ? '친구 목록에 추가' : 'Add to Friend List'}
                                    >
                                      <UserPlus size={14} />
                                    </button>
                                  )}
                                  {comp.id !== currentUserUid && (
                                    <button
                                      onClick={() => handleRemoveCompanion(comp.id)}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                      title={language === 'ko' ? '제거' : 'Remove'}
                                    >
                                      <Minus size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* 3. Friend List Section (Visual replacement for Favorite Users) */}
                    <div className="space-y-3">
                      <span className="font-sans font-extrabold text-xs text-gray-400 dark:text-stone-500 uppercase tracking-wider block">
                        {language === 'ko' ? '친구 목록' : 'Friend List'}
                      </span>
                      
                      {favoriteUsers.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                          {favoriteUsers.filter(Boolean).map((userObj) => {
                            const isAdded = (plan.companions || []).some((c) => c.id === (userObj.uid || userObj.id));
                            return (
                              <div 
                                key={userObj.uid || userObj.id} 
                                className="flex items-center justify-between p-3 bg-white dark:bg-[#15141f] border border-gray-100 dark:border-subtle-border rounded-xl shadow-sm"
                              >
                                <div className="flex items-center gap-2.5">
                                  {userObj.photoURL ? (
                                    <img 
                                      src={userObj.photoURL} 
                                      alt={userObj?.displayName || userObj?.name || 'Unknown'} 
                                      className="w-8 h-8 rounded-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                      {(userObj?.displayName || userObj?.name || '').slice(0, 1)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-sans font-bold text-xs text-gray-800 dark:text-text-primary">{userObj?.displayName || userObj?.name || 'Unknown'}</p>
                                    <p className="font-mono text-[10px] text-gray-400 dark:text-stone-500">{userObj.email}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5">
                                  {isAdded ? (
                                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-stone-800 text-gray-400 dark:text-stone-500 rounded-lg text-[10px] font-bold">
                                      {language === 'ko' ? '추가됨' : 'Added'}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleAddCompanion(userObj)}
                                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                    >
                                      {language === 'ko' ? '추가' : 'Add'}
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => removeFriend(userObj.uid || userObj.id)}
                                    className="p-1 text-gray-400 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-stone-800 rounded transition-colors cursor-pointer"
                                    title={language === 'ko' ? '친구 삭제' : 'Delete Friend'}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-white dark:bg-[#15141f] border border-gray-100 dark:border-subtle-border rounded-2xl text-center shadow-sm">
                          <p className="text-xs text-gray-400">
                            {language === 'ko' 
                              ? '아직 등록된 친구가 없습니다.' 
                              : 'Your friend list is empty.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Accommodation Schedule Modals */}
      <AccommodationModal
        isOpen={isAccModalOpen}
        onClose={() => setIsAccModalOpen(false)}
        plan={plan}
        editingAccommodation={editingAcc}
        onSave={handleSaveAccommodation}
        onDelete={handleDeleteAccommodation}
        language={language}
      />

      <DailyAnchorModal
        isOpen={isAnchorModalOpen}
        onClose={() => setIsAnchorModalOpen(false)}
        dateIso={anchorModalDateIso}
        currentAnchor={plan.dailyAnchors?.[anchorModalDateIso]}
        accommodations={plan.accommodations || []}
        onSaveAnchor={handleSaveDailyAnchor}
        language={language}
      />

      <AccommodationTestRunnerModal
        isOpen={isTestRunnerModalOpen}
        onClose={() => setIsTestRunnerModalOpen(false)}
        language={language}
      />

      {/* Checklist Overview Modal */}
      <AnimatePresence>
        {isChecklistOverviewOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChecklistOverviewOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:max-w-md md:mx-auto"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 dark:bg-[#12111a] rounded-t-[28px] max-h-[85vh] flex flex-col shadow-2xl md:max-w-md md:mx-auto overflow-hidden"
            >
              {/* Static Header Section */}
              <div className="shrink-0 bg-white dark:bg-surface-primary border-b border-gray-100 dark:border-zinc-800 rounded-t-[28px] z-10 shadow-sm">
                {/* Drag Indicator */}
                <div className="w-full flex justify-center py-3">
                  <div className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full" />
                </div>

                {/* Header Title Bar */}
                <div className="flex items-center justify-between px-6 pb-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="text-amber-600 dark:text-amber-400" size={20} />
                    <div>
                      <h2 className="font-sans font-black text-base text-gray-800 dark:text-zinc-100">
                        {language === 'ko' ? `체크리스트 확인` : `Checklist`}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {language === 'ko' ? '일정별 체크리스트' : 'Daily checklist items'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChecklistOverviewOpen(false)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 rounded-full transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Day Buttons Carousel */}
                <div className="flex overflow-x-auto gap-2 px-6 pb-4 pt-2 scrollbar-none snap-x border-t border-gray-50 dark:border-zinc-800/40">
                  {plan.days.map((day) => {
                    const isDayActive = checklistDayNums.includes(Number(day.dayNumber));
                    
                    // Calculate checklist progress for this day
                    const itemsWithChecklists = day.items.filter(
                      (item) => item.checklist && item.checklist.length > 0
                    );
                    const total = itemsWithChecklists.reduce(
                      (acc, item) => acc + (item.checklist?.length || 0),
                      0
                    );
                    const completed = itemsWithChecklists.reduce(
                      (acc, item) => acc + (item.checklist?.filter((chk) => chk.checked).length || 0),
                      0
                    );

                    return (
                      <button
                        key={day.dayNumber}
                        onClick={() => {
                          const dNum = Number(day.dayNumber);
                          setChecklistDayNums((prev) => {
                            if (prev.includes(dNum)) {
                              return prev.filter((n) => n !== dNum);
                            } else {
                              return [...prev, dNum].sort((a, b) => a - b);
                            }
                          });
                        }}
                        className={`shrink-0 flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer snap-start ${
                          isDayActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10 dark:bg-blue-500'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <span>
                          {language === 'ko' ? `${day.dayNumber}일차` : `Day ${day.dayNumber}`}
                        </span>
                        {total > 0 && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                            isDayActive 
                              ? 'bg-blue-700 dark:bg-blue-600 text-blue-100' 
                              : completed === total 
                                ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300'
                                : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          }`}>
                            {completed === total ? '✓' : `${completed}/${total}`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable Contents */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                {/* Progress Card */}
                {(() => {
                  const selectedDaysData = plan.days.filter((d) => checklistDayNums.includes(Number(d.dayNumber)));
                  const itemsWithChecklists = selectedDaysData.flatMap((day) => 
                    day.items
                      .filter((item) => item.checklist && item.checklist.length > 0)
                      .map((item) => ({ ...item, dayNumber: Number(day.dayNumber) }))
                  );

                  const total = itemsWithChecklists.reduce(
                    (acc, item) => acc + (item.checklist?.length || 0),
                    0
                  );
                  const completed = itemsWithChecklists.reduce(
                    (acc, item) => acc + (item.checklist?.filter((chk) => chk.checked).length || 0),
                    0
                  );
                  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                  if (checklistDayNums.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800/50 flex items-center justify-center text-gray-400">
                          <ClipboardList size={22} />
                        </div>
                        <div className="space-y-1">
                          <p className="font-sans font-bold text-sm text-gray-700 dark:text-zinc-300">
                            {language === 'ko' ? '선택된 일차가 없습니다' : 'No Days Selected'}
                          </p>
                          <p className="font-sans text-xs text-gray-400 max-w-[240px] leading-relaxed mx-auto">
                            {language === 'ko'
                              ? '상단의 일차 버튼을 눌러 체크리스트를 확인해 보세요!'
                              : 'Tap on the day buttons above to view checklist items!'}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (total === 0) {
                    const daysStr = checklistDayNums.join(', ');
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600">
                          <ClipboardList size={22} />
                        </div>
                        <div className="space-y-1">
                          <p className="font-sans font-bold text-sm text-gray-700 dark:text-zinc-300">
                            {language === 'ko' ? `${daysStr}일차에 등록된 체크리스트가 없습니다` : `No Checklist Items on Day ${daysStr}`}
                          </p>
                          <p className="font-sans text-xs text-gray-400 max-w-[240px] leading-relaxed mx-auto">
                            {language === 'ko'
                              ? '일정 카드를 누르고 상세 페이지에서 체크리스트를 추가해 보세요!'
                              : 'Tap on an activity card and edit its details to add checklist items!'}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="bg-white dark:bg-surface-primary rounded-2xl p-4 border border-gray-100 dark:border-subtle-border shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-sans font-bold text-xs text-gray-500 dark:text-zinc-400">
                            {language === 'ko' ? '선택된 일차의 진행 상황' : 'Selected Days Progress'}
                          </span>
                          <span className="font-sans font-black text-xs text-blue-600 dark:text-blue-400">
                            {completed} / {total} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
                          />
                        </div>
                      </div>

                      {/* Schedule Checklist Groups */}
                      <div className="space-y-5">
                        {selectedDaysData.map((day) => {
                          const dayItemsWithChecklist = day.items.filter(
                            (item) => item.checklist && item.checklist.length > 0
                          );
                          if (dayItemsWithChecklist.length === 0) return null;

                          return (
                            <div key={day.dayNumber} className="space-y-2">
                              <div className="flex items-center gap-1.5 px-1 pt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="font-sans font-black text-xs text-gray-500 dark:text-zinc-400">
                                  {language === 'ko' ? `${day.dayNumber}일차 (${day.date})` : `Day ${day.dayNumber} (${day.date})`}
                                </span>
                              </div>

                              <div className="space-y-3">
                                {dayItemsWithChecklist.map((item) => (
                                  <div
                                    key={item.id}
                                    className="bg-white dark:bg-surface-primary rounded-2xl p-4 border border-gray-100 dark:border-subtle-border shadow-xs space-y-3"
                                  >
                                    <div className="flex items-center gap-2 border-b border-gray-50 dark:border-zinc-800/50 pb-2">
                                      {/* Schedule Index Badge or Time */}
                                      <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 rounded-md">
                                        {item.time || '12:00 PM'}
                                      </div>
                                      <span className="font-sans font-bold text-xs text-gray-800 dark:text-zinc-200 truncate flex-1">
                                        {item.title}
                                      </span>
                                    </div>

                                    <div className="space-y-2.5 pl-1">
                                      {item.checklist?.map((chk) => (
                                        <label
                                          key={chk.id}
                                          className="flex items-center gap-2.5 cursor-pointer select-none"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={chk.checked}
                                            onChange={() => handleToggleItemCheck(Number(day.dayNumber), item.id, chk.id)}
                                            className="rounded border-gray-200 dark:border-subtle-border text-blue-600 focus:ring-blue-500/20 h-4.5 w-4.5 bg-transparent cursor-pointer transition-colors"
                                          />
                                          <span
                                            className={`font-sans text-xs transition-all ${
                                              chk.checked
                                                ? 'line-through text-gray-400 dark:text-stone-500'
                                                : 'text-gray-700 dark:text-zinc-200'
                                            }`}
                                          >
                                            {chk.text}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </MapWrapper>
  );
}

const routeCache: Record<string, { distance: string; duration: string }> = {};

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in km
}

function getFallbackDuration(distKm: number, mode: TransportationType, language: 'ko' | 'en'): string {
  let speed = 5; // km/h walking
  if (mode === 'taxi') speed = 40;
  else if (mode === 'bus') speed = 25;
  else if (mode === 'bike') speed = 15;
  else if (mode === 'flight') speed = 800;
  else if (mode === 'car') speed = 40;

  const hours = distKm / speed;
  const totalMinutes = Math.max(1, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (language === 'ko') {
    return h > 0 ? `약 ${h}시간 ${m}분` : `약 ${m}분`;
  } else {
    return h > 0 ? `approx. ${h}h ${m}m` : `approx. ${m}m`;
  }
}

// -------------------------------------------------------------
// Interactive & Cached Routing Connector Component
// -------------------------------------------------------------

const formatDurationByLanguage = (durationStr: string | undefined, language: 'ko' | 'en'): string => {
  if (!durationStr) return language === 'ko' ? '-' : '-';
  
  const cleaned = durationStr.trim().toLowerCase();
  let totalMins = 0;
  
  const hourMatchKo = cleaned.match(/(\d+)\s*시간/);
  if (hourMatchKo) totalMins += parseInt(hourMatchKo[1], 10) * 60;
  
  const minMatchKo = cleaned.match(/(\d+)\s*분/);
  if (minMatchKo) totalMins += parseInt(minMatchKo[1], 10);
  
  const hourMatchEn = cleaned.match(/(\d+)\s*(h|hour)/);
  if (hourMatchEn && !hourMatchKo) totalMins += parseInt(hourMatchEn[1], 10) * 60;
  
  const minMatchEn = cleaned.match(/(\d+)\s*(m|min|minute)/);
  if (minMatchEn && !minMatchKo) totalMins += parseInt(minMatchEn[1], 10);
  
  if (totalMins === 0) {
    const numMatch = cleaned.match(/(\d+)/);
    if (numMatch) totalMins = parseInt(numMatch[1], 10);
  }
  
  if (totalMins === 0) return durationStr; // fallback to original string if no numbers parsed
  
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  
  if (language === 'ko') {
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  } else {
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
};

const parseDurationToMinutes = (durationStr?: string): number => {
  if (!durationStr) return 0;
  const cleaned = durationStr.trim().toLowerCase();
  
  let totalMins = 0;
  const hourMatchKo = cleaned.match(/(\d+)\s*시간/);
  if (hourMatchKo) {
    totalMins += parseInt(hourMatchKo[1], 10) * 60;
  }
  const minMatchKo = cleaned.match(/(\d+)\s*분/);
  if (minMatchKo) {
    totalMins += parseInt(minMatchKo[1], 10);
  }
  
  const hourMatchEn = cleaned.match(/(\d+)\s*(h|hour)/);
  if (hourMatchEn && !hourMatchKo) {
    totalMins += parseInt(hourMatchEn[1], 10) * 60;
  }
  const minMatchEn = cleaned.match(/(\d+)\s*(m|min|minute)/);
  if (minMatchEn && !minMatchKo) {
    totalMins += parseInt(minMatchEn[1], 10);
  }
  
  if (totalMins === 0) {
    const numMatch = cleaned.match(/(\d+)/);
    if (numMatch) {
      return parseInt(numMatch[1], 10);
    }
  }
  return totalMins;
};

// Consolidated Routes API request helper (Requirement 2)
async function requestRouteCalculation(params: {
  planId: string;
  originPlaceId?: string;
  destinationPlaceId?: string;
  originLatLng: { lat: number; lng: number };
  destinationLatLng: { lat: number; lng: number };
  travelMode: string;
  dateStr: string;
  timeStr: string;
  selectedPref: 'NONE' | 'FEWER_TRANSFERS' | 'LESS_WALKING';
  forceRefresh: boolean;
  language: 'ko' | 'en';
}) {
  const user = auth.currentUser;
  let token = '';
  try {
    token = user ? await user.getIdToken() : '';
  } catch (tErr) {
    console.warn('[Route Calculation] Auth token retrieval skipped:', tErr);
  }

  // Get App Check token safely from Firebase App Check if initialized
  let appCheckToken = '';
  try {
    const appCheckModule = await import('firebase/app-check');
    const getAppCheck = (appCheckModule as any).getAppCheck;
    const getToken = (appCheckModule as any).getToken;
    const appCheck = getAppCheck();
    const tokenResult = await getToken(appCheck, false);
    appCheckToken = tokenResult.token;
  } catch (err) {
    console.log('[App Check] App Check token not retrieved or not initialized:', err);
  }

  const payload = {
    originLatLng: params.originLatLng,
    destinationLatLng: params.destinationLatLng,
    originPlaceId: params.originPlaceId,
    destinationPlaceId: params.destinationPlaceId,
    travelMode: params.travelMode,
    departureLocal: {
      date: params.dateStr,
      time: params.timeStr
    },
    planId: params.planId,
    lang: params.language,
    forceRefresh: params.forceRefresh,
    transitPreferences: {
      routingPreference: params.selectedPref
    }
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (appCheckToken) {
    headers['x-firebase-appcheck'] = appCheckToken;
  }

  try {
    const response = await fetch('/app-api/compute-route', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    return response;
  } catch (fetchErr: any) {
    console.warn('[Route Calculation Network Notice]:', fetchErr?.message || fetchErr);
    const errorMsg = params.language === 'ko'
      ? '네트워크 연결 상태를 확인해 주세요. 경로 계산 서비스에 연결할 수 없습니다.'
      : 'Unable to connect to route calculation service. Please check network connection.';
    return new Response(JSON.stringify({ error: errorMsg, routeStatus: 'error' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

// Calculate transit representative time based on policy (Requirement 6)
const calculateTransitAveraging = (routes: any[]) => {
  if (!routes || routes.length === 0) return null;
  
  // Sort routes by duration in seconds
  const sortedRoutes = [...routes].sort((a, b) => {
    const durA = a.rawDurationSeconds ?? a.totalDurationSeconds ?? 0;
    const durB = b.rawDurationSeconds ?? b.totalDurationSeconds ?? 0;
    return durA - durB;
  });
  
  const fastestDuration = sortedRoutes[0].rawDurationSeconds ?? sortedRoutes[0].totalDurationSeconds ?? 0;
  
  // Filter out routes that are >15% longer than the fastest
  const filteredRoutes = sortedRoutes.filter(route => {
    const dur = route.rawDurationSeconds ?? route.totalDurationSeconds ?? 0;
    return dur <= fastestDuration * 1.15;
  });
  
  // Select maximum 3 routes from the filtered list
  const selectedRoutes = filteredRoutes.slice(0, 3);
  
  // Calculate arithmetic mean of the selected routes
  const totalSec = selectedRoutes.reduce((sum, route) => sum + (route.rawDurationSeconds ?? route.totalDurationSeconds ?? 0), 0);
  const averageSeconds = totalSec / selectedRoutes.length;
  
  // Round the average to nearest minute (Requirement 6)
  const roundedMinutes = Math.round(averageSeconds / 60);
  
  const fastestMinutes = Math.round(fastestDuration / 60);
  const averageMinutes = roundedMinutes;
  
  const durationsInMins = sortedRoutes.map(r => Math.round((r.rawDurationSeconds ?? r.totalDurationSeconds ?? 0) / 60));
  const minMins = Math.min(...durationsInMins);
  const maxMins = Math.max(...durationsInMins);
  
  // Format the representative time according to lang settings (Requirement 8)
  const formatRepTime = (mins: number, lang: 'ko' | 'en') => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (lang === 'ko') {
      return h > 0 ? `${h}시간 ${m}분` : `${mins}분`;
    } else {
      return h > 0 ? `${h}h ${m}m` : `${mins}m`;
    }
  };

  return {
    representativeMinutes: averageMinutes,
    representativeTextKo: formatRepTime(averageMinutes, 'ko'),
    representativeTextEn: formatRepTime(averageMinutes, 'en'),
    fastestMinutes,
    averageMinutes,
    minMinutes: minMins,
    maxMinutes: maxMins,
    totalCount: routes.length
  };
};

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || typeof window === 'undefined') return null;
  if ((window as any).google?.maps?.Geocoder) {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      const res = await new Promise<any>((resolve) => {
        geocoder.geocode({ address }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0]);
          } else {
            resolve(null);
          }
        });
      });
      if (res && res.geometry?.location) {
        return {
          lat: typeof res.geometry.location.lat === 'function' ? res.geometry.location.lat() : res.geometry.location.lat,
          lng: typeof res.geometry.location.lng === 'function' ? res.geometry.location.lng() : res.geometry.location.lng,
        };
      }
    } catch (e) {
      console.warn('Geocoding error:', e);
    }
  }
  return null;
}

interface TimelineRouteConnectorProps {
  from: PlanItem;
  to: PlanItem;
  language: 'ko' | 'en';
  getTransIcon: (type?: TransportationType, size?: number) => React.ReactNode;
  dayDate: string;
  planId: string;
  onUpdateRouteInfo: (updates: any) => void;
  onUpdateFromRouteInfo?: (updates: any) => void;
}

function TimelineRouteConnector({
  from,
  to,
  language,
  getTransIcon,
  dayDate,
  planId,
  onUpdateRouteInfo,
  onUpdateFromRouteInfo,
}: TimelineRouteConnectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);
  const [pref, setPref] = useState<'NONE' | 'FEWER_TRANSFERS' | 'LESS_WALKING'>('NONE');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeErrorMsg, setRouteErrorMsg] = useState<string | null>(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);

  const isFromFlight = from.transportation === 'flight' || from.title?.toLowerCase().includes('비행') || from.title?.toLowerCase().includes('flight');
  const isToFlight = to.transportation === 'flight' || to.title?.toLowerCase().includes('비행') || to.title?.toLowerCase().includes('flight');
  const targetFlightItem = isFromFlight ? from : to;

  // Flight-specific states
  const [flightNumber, setFlightNumber] = useState(targetFlightItem.transportationLine || '');
  const [flightInfo, setFlightInfo] = useState<any>(null);
  const [isSearchingFlight, setIsSearchingFlight] = useState(false);
  const [flightSearchMsg, setFlightSearchMsg] = useState<string | null>(null);
  const [manualDurText, setManualDurText] = useState(targetFlightItem.duration || '');

  // Sync inputs with targetFlightItem properties when they change
  useEffect(() => {
    setFlightNumber(targetFlightItem.transportationLine || '');
  }, [targetFlightItem.transportationLine]);

  useEffect(() => {
    setManualDurText(targetFlightItem.duration || '');
  }, [targetFlightItem.duration]);

  // Load flight info automatically if targetFlightItem transportation is 'flight' and flight number is set
  useEffect(() => {
    if (targetFlightItem.transportation === 'flight' && targetFlightItem.transportationLine) {
      setIsSearchingFlight(true);
      setFlightSearchMsg(null);
      const depDate = dayDate || new Date().toISOString().slice(0, 10);
      getFlightInformation(targetFlightItem.transportationLine, depDate)
        .then((info) => {
          if (info) {
            setFlightInfo(info);
            if (targetFlightItem.duration !== info.duration && !targetFlightItem.manualDuration) {
              const updates = {
                autoDuration: info.duration,
                routeStatus: 'success',
              };
              if (isFromFlight && onUpdateFromRouteInfo) {
                onUpdateFromRouteInfo(updates);
              } else {
                onUpdateRouteInfo(updates);
              }
            }
          } else {
            setFlightInfo(null);
            setFlightSearchMsg(
              language === 'ko'
                ? '해당 날짜의 항공편 정보를 찾지 못했어요. 직접 입력해 주세요.'
                : 'Could not find flight information for this date. Please enter manually.'
            );
          }
        })
        .catch((err) => {
          console.error('Error fetching flight info in connector:', err);
          setFlightSearchMsg(
            language === 'ko'
              ? '해당 날짜의 항공편 정보를 찾지 못했어요. 직접 입력해 주세요.'
              : 'Could not find flight information for this date. Please enter manually.'
          );
        })
        .finally(() => {
          setIsSearchingFlight(false);
        });
    } else {
      setFlightInfo(null);
    }
  }, [targetFlightItem.transportation, targetFlightItem.transportationLine]);

  const handleConnectorFlightSearch = async (forceRefresh: boolean = false) => {
    if (!flightNumber.trim()) return;
    setIsSearchingFlight(true);
    setFlightSearchMsg(null);
    try {
      const depDate = dayDate || new Date().toISOString().slice(0, 10);
      const info = await getFlightInformation(flightNumber.trim(), depDate, { forceRefresh });
      if (info) {
        setFlightInfo(info);
        const updates = {
          autoDuration: info.duration,
          routeStatus: 'success',
          transportationLine: flightNumber.trim()
        };
        if (isFromFlight && onUpdateFromRouteInfo) {
          onUpdateFromRouteInfo(updates);
        } else {
          onUpdateRouteInfo(updates);
        }
        setFlightSearchMsg(null);
      } else {
        setFlightInfo(null);
        setFlightSearchMsg(
          language === 'ko'
            ? '해당 날짜의 항공편 정보를 찾지 못했어요. 직접 입력해 주세요.'
            : 'Could not find flight information for this date. Please enter manually.'
        );
      }
    } catch (e) {
      console.error(e);
      setFlightSearchMsg(
        language === 'ko'
          ? '해당 날짜의 항공편 정보를 찾지 못했어요. 직접 입력해 주세요.'
          : 'Could not find flight information for this date. Please enter manually.'
      );
    } finally {
      setIsSearchingFlight(false);
    }
  };

  const handleSaveManualDuration = () => {
    if (!manualDurText.trim()) return;
    const updates = {
      manualDuration: manualDurText.trim(),
      routeStatus: 'success'
    };
    if (isFromFlight && onUpdateFromRouteInfo) {
      onUpdateFromRouteInfo(updates);
    } else {
      onUpdateRouteInfo(updates);
    }
    if (targetFlightItem.transportation === 'flight' && flightNumber) {
      recordManualFlightDuration(flightNumber);
    }
  };

  const rawDur = to.duration || to.manualDuration || to.autoDuration;
  const formattedDur = formatDurationByLanguage(rawDur, language);
  const displayDuration = (formattedDur === '-' || !rawDur)
    ? (language === 'ko' ? '이동 소요시간' : 'Travel time')
    : formattedDur;

  // Sync preference state from saved transitDebugInfo
  useEffect(() => {
    if (to.transitDebugInfo?.scenarioPreferences) {
      setPref(to.transitDebugInfo.scenarioPreferences as any);
    }
  }, [to.transitDebugInfo?.scenarioPreferences]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDetailedRoute = async (
    selectedPref: 'NONE' | 'FEWER_TRANSFERS' | 'LESS_WALKING' = pref,
    forceRefresh: boolean = false
  ) => {
    if (to.transportation === 'flight') return;
    setIsLoadingRoute(true);
    setRouteErrorMsg(null);

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    try {
      let lat1 = from.transportation === 'flight'
        ? (from.arrivalLocationLatLng?.lat ?? from.locationLatLng?.lat)
        : from.locationLatLng?.lat;
      let lng1 = from.transportation === 'flight'
        ? (from.arrivalLocationLatLng?.lng ?? from.locationLatLng?.lng)
        : from.locationLatLng?.lng;
      let lat2 = to.locationLatLng?.lat;
      let lng2 = to.locationLatLng?.lng;

      if ((lat1 === undefined || lng1 === undefined)) {
        const query = from.transportation === 'flight'
          ? (from.arrivalLocation || from.arrivalLocationAddress || flightInfo?.arrivalAirport || from.location || from.locationAddress || from.title || '')
          : (from.location || from.locationAddress || from.title || '');
        if (query) {
          const coords = await geocodeAddress(query);
          if (signal.aborted) return;
          if (coords) {
            lat1 = coords.lat;
            lng1 = coords.lng;
          }
        }
      }

      if ((lat2 === undefined || lng2 === undefined) && (to.location || to.locationAddress || to.title)) {
        const query = to.location || to.locationAddress || to.title || '';
        const coords = await geocodeAddress(query);
        if (signal.aborted) return;
        if (coords) {
          lat2 = coords.lat;
          lng2 = coords.lng;
        }
      }

      if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) {
        throw new Error(language === 'ko' ? '출발지 또는 도착지의 좌표 정보가 없습니다.' : 'Missing coordinates.');
      }

      let travelMode = 'WALK';
      if (to.transportation === 'car' || to.transportation === 'taxi') {
        travelMode = 'DRIVE';
      } else if (to.transportation === 'bus') {
        travelMode = 'TRANSIT';
      } else if (to.transportation === 'bike') {
        travelMode = 'BICYCLE';
      }

      const dateStr = dayDate.replace(/\s+/g, '').replace(/\./g, '-');
      // Set the previous item's time as the departure reference, or fall back to to.time
      const timeStr = from.time || to.time || '12:00 PM';

      const response = await requestRouteCalculation({
        planId,
        originPlaceId: from.transportation === 'flight' ? (from.arrivalLocationPlaceId || from.locationPlaceId) : from.locationPlaceId,
        destinationPlaceId: to.locationPlaceId,
        originLatLng: { lat: lat1, lng: lng1 },
        destinationLatLng: { lat: lat2, lng: lng2 },
        travelMode,
        dateStr,
        timeStr,
        selectedPref,
        forceRefresh,
        language
      });
      
      if (signal.aborted) return;

      if (!response.ok) {
        let errMsg = 'Failed to fetch route';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errData = await response.json();
            errMsg = errData.error || errMsg;
          } else {
            const rawText = await response.text();
            console.error("Route request error diagnostics:", {
              url: '/app-api/compute-route',
              method: 'POST',
              origin: window.location.origin,
              contentType,
              status: response.status,
              responsePreview: rawText.substring(0, 500)
            });
            errMsg = language === 'ko' 
              ? `서버 응답 오류 (${response.status}) - 경로 정보를 불러올 수 없습니다.` 
              : `Server error (${response.status}) - Unable to fetch route.`;
          }
        } catch (e) {
          errMsg = `Server error (${response.status})`;
        }
        throw new Error(errMsg);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const rawText = await response.text();
        console.warn("Non-JSON response received from compute-route:", rawText.substring(0, 200));
        throw new Error(language === 'ko' ? '서버 응답 형식이 올바르지 않습니다.' : 'Invalid response format from server');
      }

      const data = await response.json();

      if (data.routeStatus === 'success' && data.routes && data.routes.length > 0) {
        const firstRoute = data.routes[0];
        
        let finalDuration = data.duration;
        let averagingResult = null;

        if (travelMode === 'TRANSIT') {
          averagingResult = calculateTransitAveraging(data.routes);
          if (averagingResult) {
            finalDuration = language === 'ko' ? averagingResult.representativeTextKo : averagingResult.representativeTextEn;
          }
        }

        onUpdateRouteInfo({
          autoDuration: finalDuration,
          autoDistance: data.distance,
          calculatedAt: new Date().toISOString(),
          departureTimeUsed: data.computedDepartureTime,
          routeStatus: 'success',
          routeError: false,
          isTrafficAware: data.isTrafficAware,
          transitDebugInfo: {
            routeCacheVersion: 'v2',
            transportation: to.transportation,
            originPlaceId: from.locationPlaceId,
            originLatLng: { lat: lat1, lng: lng1 },
            destinationPlaceId: to.locationPlaceId,
            destinationLatLng: { lat: lat2, lng: lng2 },
            timezoneId: data.timezoneId,
            localDepartureTime: `${dateStr} ${timeStr}`,
            utcDepartureTime: data.computedDepartureTime,
            totalDuration: finalDuration,
            isCached: data.isCached || false,
            cachedAt: data.cachedAt || null,
            transitAveraging: averagingResult,
            firstTransitDepartureTime: firstRoute.firstTransitDepartureTime,
            finalArrivalTime: firstRoute.finalArrivalTime,
            initialWaitSeconds: firstRoute.initialWaitSeconds,
            totalWalkSeconds: firstRoute.totalWalkSeconds,
            transferCount: firstRoute.transferCount,
            usedLines: firstRoute.usedLines,
            accessWalkSeconds: firstRoute.accessWalkSeconds,
            initialWaitSecondsBreakdown: firstRoute.initialWaitSeconds,
            inVehicleSeconds: firstRoute.inVehicleSeconds,
            transferWaitSeconds: firstRoute.transferWaitSeconds,
            transferWalkSeconds: firstRoute.transferWalkSeconds,
            egressWalkSeconds: firstRoute.egressWalkSeconds,
            totalDurationSeconds: firstRoute.totalDurationSeconds,
            scenarioPreferences: selectedPref,
            alternatives: data.routes
          }
        });
        setSelectedRouteIdx(0);
      } else {
        onUpdateRouteInfo({
          routeStatus: 'none',
          routeError: true
        });
      }
    } catch (err: any) {
      console.warn('Detailed Route Fetch Notice:', err?.message || err);
      const isFetchErr = err?.message === 'Failed to fetch' || err?.message?.includes('Failed to fetch');
      const friendlyMsg = isFetchErr
        ? (language === 'ko' ? '네트워크 연결 오류로 경로 정보를 불러올 수 없습니다.' : 'Failed to fetch route due to network error.')
        : (err?.message || (language === 'ko' ? '경로 계산 중 오류가 발생했습니다.' : 'Error fetching route'));
      setRouteErrorMsg(friendlyMsg);
      onUpdateRouteInfo({
        routeStatus: 'error',
        routeError: true
      });
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Fetch route automatically if route cache is missing/stale or autoDuration is missing
  useEffect(() => {
    if (to.transportation === 'flight') return;
    if (isLoadingRoute) return;

    const dateStr = dayDate.replace(/\s+/g, '').replace(/\./g, '-');
    const timeStr = from.time || to.time || '12:00 PM';
    const expectedLocalDepartureTime = `${dateStr} ${timeStr}`;

    const debug = to.transitDebugInfo;
    const isFromFlight = from.transportation === 'flight';
    const originPlaceId = isFromFlight ? (from.arrivalLocationPlaceId || from.locationPlaceId || '') : (from.locationPlaceId || '');
    const isCacheInvalid = !debug ||
      debug.routeCacheVersion !== 'v2' ||
      debug.originPlaceId !== originPlaceId ||
      debug.destinationPlaceId !== (to.locationPlaceId || '') ||
      debug.scenarioPreferences !== pref ||
      debug.localDepartureTime !== expectedLocalDepartureTime ||
      debug.transportation !== to.transportation ||
      !to.autoDuration;

    if (isCacheInvalid) {
      fetchDetailedRoute(pref, false);
    }
  }, [
    to.transitDebugInfo,
    from.locationPlaceId,
    from.arrivalLocationPlaceId,
    to.locationPlaceId,
    from.locationLatLng?.lat,
    from.locationLatLng?.lng,
    from.arrivalLocationLatLng?.lat,
    from.arrivalLocationLatLng?.lng,
    from.location,
    from.arrivalLocation,
    to.location,
    dayDate,
    from.time,
    to.time,
    pref,
    from.transportation,
    to.transportation,
    to.autoDuration,
    isFromFlight
  ]);

  // Calculations for schedule conflict warnings
  const isConflict = (() => {
    if (!from.time || !to.time) return false;
    const fromStartMin = convertTimeToMinutes(from.time);
    const fromDurMin = parseDurationToMinutes(from.duration);
    let toStartMin = convertTimeToMinutes(to.time);
    
    if (toStartMin < fromStartMin) {
      toStartMin += 24 * 60;
    }
    
    const fromEndMin = fromStartMin + fromDurMin;
    const travelMinutes = parseDurationToMinutes(to.duration);
    
    const arrivalExpectedMin = fromEndMin + travelMinutes;
    return arrivalExpectedMin > toStartMin;
  })();

  const alternatives = to.transitDebugInfo?.alternatives || [];
  const activeRoute = alternatives[selectedRouteIdx] || to.transitDebugInfo;

  const getTransLabelLocal = (type?: string) => {
    switch (type) {
      case 'taxi': return language === 'ko' ? '택시' : 'Taxi';
      case 'bus': return language === 'ko' ? '대중교통' : 'Transit';
      case 'flight': return language === 'ko' ? '비행기' : 'Flight';
      case 'walk': return language === 'ko' ? '도보' : 'Walk';
      case 'bike': return language === 'ko' ? '자전거' : 'Bike';
      case 'car': return language === 'ko' ? '자동차' : 'Car';
      default: return language === 'ko' ? '이동' : 'Travel';
    }
  };

  // If previous item was a flight, render Flight timeline node FIRST, then Next Schedule transportation timeline node
  if (isFromFlight) {
    const flightDur = from.duration || from.manualDuration || from.autoDuration || (from.stayDurationMinutes ? `${from.stayDurationMinutes}m` : '') || '0m';
    const flightDisplayDuration = formatDurationByLanguage(flightDur, language);
    const flightLine = from.transportationLine;

    const rawNextDur = to.duration || to.manualDuration || to.autoDuration;
    const formattedNextDur = formatDurationByLanguage(rawNextDur, language);
    const nextDisplayDuration = (formattedNextDur && formattedNextDur !== '-')
      ? formattedNextDur
      : (language === 'ko' ? '이동 소요시간' : 'Travel time');

    return (
      <div className="relative pl-[60px] mt-[-12px] pt-0 pb-3 flex flex-col items-start gap-5 select-none w-full">
        {/* Continuous dashed background connector line */}
        <div className="absolute left-[24px] -translate-x-1/2 top-0 bottom-0 w-0.5 pointer-events-none">
          <div className="h-full w-0.5 border-l-2 border-dashed border-blue-400/80 dark:border-blue-700/80"></div>
        </div>

        {/* 1. Separate Flight Timeline Node Row */}
        <div className="relative flex items-center z-10 w-full min-h-[32px]">
          {/* Flight Node Icon centered on vertical line */}
          <div className="absolute left-[-36px] -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-600 text-white border-2 border-white dark:border-[#13121a] flex items-center justify-center shadow-sm z-10 pointer-events-auto">
            <Plane size={14} className="rotate-90" />
          </div>

          <div className="inline-flex items-center gap-2 bg-blue-50/90 dark:bg-[#181726] border border-blue-200/80 dark:border-blue-800/40 px-3 py-1.5 rounded-full text-xs font-sans text-blue-900 dark:text-blue-200 shadow-2xs">
            <Plane size={13} className="rotate-90 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-extrabold text-blue-700 dark:text-blue-300">
              {language === 'ko'
                ? `비행 ${flightDisplayDuration !== '-' ? flightDisplayDuration : ''}`.trim()
                : `Flight ${flightDisplayDuration !== '-' ? flightDisplayDuration : ''}`.trim()}
            </span>
            {flightLine && (
              <span className="text-[10px] font-mono font-bold text-blue-600/80 dark:text-blue-400/80 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-md">
                {flightLine}
              </span>
            )}
          </div>
        </div>

        {/* 2. Separate Next Schedule Transportation Timeline Node Row */}
        {!isToFlight && (
          <div className="relative flex flex-col gap-2 max-w-full z-10 w-full">
            <div className="relative flex items-center z-10 w-full min-h-[32px]">
              {/* Next Schedule Ground Node Icon centered on vertical line */}
              <div className="absolute left-[-36px] -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-[#111019] border border-gray-200 dark:border-stone-800/80 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-sm z-10 pointer-events-auto">
                {getTransIcon(to.transportation, 15)}
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`inline-flex items-center gap-2 bg-white dark:bg-[#1f1e2d] border border-gray-100 dark:border-subtle-border px-3.5 py-1.5 rounded-full text-xs font-sans text-gray-700 dark:text-zinc-300 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-[#252438] hover:border-blue-500/30 ${
                  isConflict ? 'border-rose-300/60 dark:border-rose-950/50 bg-rose-50/20 dark:bg-rose-950/10' : ''
                }`}
              >
                <span className="font-bold shrink-0 text-blue-600 dark:text-blue-400">
                  {nextDisplayDuration}
                </span>

                {isConflict && (
                  <span className="text-rose-500 animate-bounce shrink-0 ml-0.5">⚠️</span>
                )}

                <ChevronDown
                  size={12}
                  className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Collapsible Panel details for Next Schedule Ground Route */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="popover"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="relative bg-white dark:bg-[#1a1926] border border-gray-100 dark:border-subtle-border rounded-2xl p-4 shadow-md w-full max-w-sm text-xs font-sans text-gray-600 dark:text-zinc-300 space-y-3 overflow-hidden"
                >
                   <div className="border-b border-gray-50 dark:border-white/5 pb-2 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                        {language === 'ko' ? '이동 정보' : 'TRANSIT INFO'}
                      </p>
                      <div className="font-bold text-gray-800 dark:text-text-primary flex items-center gap-2">
                        <span className="truncate max-w-[100px]">{from.location || (language === 'ko' ? '출발지' : 'Origin')}</span>
                        <span className="text-gray-400 font-normal">→</span>
                        <span className="truncate max-w-[100px]">{to.location || (language === 'ko' ? '도착지' : 'Destination')}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDevMode(!showDevMode);
                      }}
                      className={`p-1 rounded-md text-[10px] transition-colors cursor-pointer ${
                        showDevMode
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                      }`}
                      title={language === 'ko' ? '개발자 디버그 정보' : 'Developer Debug Info'}
                    >
                      <Wrench size={11} />
                    </button>
                  </div>

                  {/* Transportation selection if pseudoItem (Accommodation Arrival) */}
                  {to.isPseudoItem && to.pseudoType === 'end' && (
                    <div className="border-b border-gray-50 dark:border-white/5 pb-2">
                      <p className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                        {language === 'ko' ? '이동 수단 선택' : 'TRANSPORTATION'}
                      </p>
                      <div className="grid grid-cols-4 gap-1">
                        {(['walk', 'bus', 'car', 'bike'] as const).map((type) => {
                          const isSelected = to.transportation === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                onUpdateRouteInfo({ transportation: type });
                              }}
                              className={`py-2 px-1 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400'
                                  : 'bg-gray-50 dark:bg-stone-800/40 border-transparent text-gray-400 dark:text-stone-500 hover:text-gray-600 dark:hover:text-zinc-300'
                              }`}
                            >
                               {getTransIcon(type, 14)}
                              <span className="text-[8px] mt-0.5">{getTransLabelLocal(type)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{language === 'ko' ? '소요 시간' : 'Duration'}</span>
                      <span className="font-bold text-gray-800 dark:text-text-primary">{displayDuration}</span>
                    </div>
                  </div>

                  {/* Car / Taxi warning */}
                  {(to.transportation === 'car' || to.transportation === 'taxi') && (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-400 text-[10px] p-2.5 rounded-xl leading-normal flex flex-col gap-1.5">
                      <div className="flex gap-1.5">
                        <Info size={13} className="shrink-0 mt-0.5" />
                        <span>
                          {language === 'ko'
                            ? '도로 및 교통 상황에 따라 실제 소요 시간이 달라질 수 있습니다.'
                            : 'Actual duration may vary depending on road and traffic conditions.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Schedule Conflict Warning */}
                  {isConflict && (
                    <div className="bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] p-2.5 rounded-xl leading-normal flex gap-1.5">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>
                        {language === 'ko'
                          ? '이동시간이 부족합니다. 다음 일정 시작 시간이나 이동수단을 조정해 주세요.'
                          : 'Insufficient travel time. Please adjust the next activity start time or travel method.'}
                      </span>
                    </div>
                  )}

                  {/* Dev Debug section (Transit Analysis Dashboard) */}
                  {showDevMode && (
                    <div className="border-t border-dashed border-gray-100 dark:border-white/5 pt-2.5 mt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[9px] text-amber-500 uppercase tracking-wider">
                          🔧 Dev Mode (Transit Analysis)
                        </span>
                        <button
                          type="button"
                          onClick={() => fetchDetailedRoute(pref, true)}
                          disabled={isLoadingRoute}
                          className="p-1 px-2 text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg flex items-center gap-1 font-bold border border-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <RefreshCw size={9} className={isLoadingRoute ? "animate-spin" : ""} />
                          {language === 'ko' ? '분석 실행' : 'Analyze Route'}
                        </button>
                      </div>

                      {isLoadingRoute && (
                        <div className="mt-2 p-2 bg-blue-500/5 border border-blue-500/10 text-[10px] text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center gap-1.5">
                          <RefreshCw size={10} className="animate-spin text-blue-500" />
                          <span>{language === 'ko' ? 'Routes API 실시간 경로 분석 중...' : 'Analyzing Routes API route...'}</span>
                        </div>
                      )}

                      {routeErrorMsg && (
                        <div className="mt-2 p-2.5 bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-1.5 leading-normal">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5 text-rose-500" />
                          <span>{routeErrorMsg}</span>
                        </div>
                      )}

                      {to.transitDebugInfo && (
                        <div className="mt-2.5 space-y-2.5 bg-gray-50/50 dark:bg-[#151421] rounded-xl p-3 border border-gray-100 dark:border-stone-800/60 text-[10px]">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-gray-400">
                              {language === 'ko' ? '경로 선호도 시나리오' : 'Routing Scenario'}
                            </span>
                            <div className="grid grid-cols-3 gap-1">
                              {(['NONE', 'FEWER_TRANSFERS', 'LESS_WALKING'] as const).map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    setPref(p);
                                    fetchDetailedRoute(p);
                                  }}
                                  className={`py-1 px-1.5 rounded text-[9px] font-bold transition-all ${
                                    pref === p
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-white dark:bg-stone-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                                  }`}
                                >
                                  {p === 'NONE'
                                    ? (language === 'ko' ? '기본' : 'Default')
                                    : p === 'FEWER_TRANSFERS'
                                    ? (language === 'ko' ? '최소환승' : 'Min Transfer')
                                    : (language === 'ko' ? '최소도보' : 'Min Walk')}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // If current item target `to` is a flight, render Flight timeline node
  if (isToFlight) {
    const flightDur = to.duration || to.manualDuration || to.autoDuration || (to.stayDurationMinutes ? `${to.stayDurationMinutes}m` : '') || '0m';
    const flightDisplayDuration = formatDurationByLanguage(flightDur, language);
    const flightLine = to.transportationLine;

    return (
      <div className="relative pl-[60px] py-2 flex flex-col items-start select-none w-full">
        {/* Dashed background connector line */}
        <div className="absolute left-[24px] -translate-x-1/2 top-0 bottom-0 w-0.5 pointer-events-none">
          <div className="h-full w-0.5 border-l-2 border-dashed border-blue-400/80 dark:border-blue-700/80"></div>
        </div>

        <div className="relative flex items-center z-10 w-full min-h-[32px]">
          {/* Flight Node Icon centered on vertical line */}
          <div className="absolute left-[-36px] -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-600 text-white border-2 border-white dark:border-[#13121a] flex items-center justify-center shadow-sm z-10 pointer-events-auto">
            <Plane size={14} className="rotate-90" />
          </div>

          {/* Flight Duration Pill */}
          <div className="flex flex-col gap-1.5 z-10">
            <div className="inline-flex items-center gap-2 bg-blue-50/90 dark:bg-[#181726] border border-blue-200/80 dark:border-blue-800/40 px-3 py-1.5 rounded-full text-xs font-sans text-blue-900 dark:text-blue-200 shadow-2xs">
              <Plane size={13} className="rotate-90 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-extrabold text-blue-700 dark:text-blue-300">
                {language === 'ko' ? `비행 ${flightDisplayDuration !== '-' ? flightDisplayDuration : ''}`.trim() : `Flight ${flightDisplayDuration !== '-' ? flightDisplayDuration : ''}`.trim()}
              </span>
              {flightLine && (
                <span className="text-[10px] font-mono font-bold text-blue-600/80 dark:text-blue-400/80 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-md">
                  {flightLine}
                </span>
              )}
            </div>

            {isConflict && (
              <div className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-bold px-1">
                <AlertTriangle size={12} className="shrink-0" />
                <span>
                  {language === 'ko'
                    ? '이동시간이 부족합니다.'
                    : 'Insufficient travel time.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-[60px] mt-[-12px] pt-0 pb-3 flex flex-col items-start select-none w-full">
      {/* Dashed background connector line */}
      <div className="absolute left-[24px] -translate-x-1/2 top-0 bottom-0 w-0.5 pointer-events-none">
        <div className="h-full w-0.5 border-l-2 border-dashed border-gray-300 dark:border-stone-800"></div>
      </div>

      {/* Main interactive capsule button row */}
      <div className="relative flex flex-col gap-2 max-w-full z-10 w-full">
        <div className="relative flex items-center z-10 w-full min-h-[32px]">
          {/* Node Icon centered on vertical line */}
          <div className="absolute left-[-36px] -translate-x-1/2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white dark:bg-[#111019] border border-gray-200 dark:border-stone-800/80 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-sm z-10 pointer-events-auto">
            {getTransIcon(to.transportation, 16)}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-2 bg-white dark:bg-[#1f1e2d] border border-gray-100 dark:border-subtle-border px-3.5 py-1.5 rounded-full text-xs font-sans text-gray-700 dark:text-zinc-300 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-[#252438] hover:border-blue-500/30 ${
              isConflict ? 'border-rose-300/60 dark:border-rose-950/50 bg-rose-50/20 dark:bg-rose-950/10' : ''
            }`}
          >
            <span className="font-bold shrink-0 text-blue-600 dark:text-blue-400">
              {displayDuration}
            </span>
            
            {isConflict && (
              <span className="text-rose-500 animate-bounce shrink-0 ml-0.5">⚠️</span>
            )}

            <ChevronDown
              size={12}
              className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Collapsible Panel details */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="popover"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="relative bg-white dark:bg-[#1a1926] border border-gray-100 dark:border-subtle-border rounded-2xl p-4 shadow-md w-full max-w-sm text-xs font-sans text-gray-600 dark:text-zinc-300 space-y-3 overflow-hidden"
            >
              <div className="border-b border-gray-50 dark:border-white/5 pb-2 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                    {language === 'ko' ? '이동 정보' : 'TRANSIT INFO'}
                  </p>
                  <div className="font-bold text-gray-800 dark:text-text-primary flex items-center gap-2">
                    <span className="truncate max-w-[100px]">{from.location || (language === 'ko' ? '출발지' : 'Origin')}</span>
                    <span className="text-gray-400 font-normal">→</span>
                    <span className="truncate max-w-[100px]">{to.location || (language === 'ko' ? '도착지' : 'Destination')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDevMode(!showDevMode);
                  }}
                  className={`p-1 rounded-md text-[10px] transition-colors cursor-pointer ${
                    showDevMode
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                  }`}
                  title={language === 'ko' ? '개발자 디버그 정보' : 'Developer Debug Info'}
                >
                  <Wrench size={11} />
                </button>
              </div>

              {/* Transportation selection if pseudoItem (Accommodation Arrival) */}
              {to.isPseudoItem && to.pseudoType === 'end' && (
                <div className="border-b border-gray-50 dark:border-white/5 pb-2">
                  <p className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                    {language === 'ko' ? '이동 수단 선택' : 'TRANSPORTATION'}
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {(['walk', 'bus', 'car', 'bike'] as const).map((type) => {
                      const isSelected = to.transportation === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            onUpdateRouteInfo({ transportation: type });
                          }}
                          className={`py-2 px-1 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400'
                              : 'bg-gray-50 dark:bg-stone-800/40 border-transparent text-gray-400 dark:text-stone-500 hover:text-gray-600 dark:hover:text-zinc-300'
                          }`}
                        >
                          {getTransIcon(type, 14)}
                          <span className="text-[8px] mt-0.5">{getTransLabelLocal(type)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">{language === 'ko' ? '소요 시간' : 'Duration'}</span>
                  <span className="font-bold text-gray-800 dark:text-text-primary">{displayDuration}</span>
                </div>
              </div>

              {/* Car / Taxi warning */}
              {(to.transportation === 'car' || to.transportation === 'taxi') && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-400 text-[10px] p-2.5 rounded-xl leading-normal flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <Info size={13} className="shrink-0 mt-0.5" />
                    <span>
                      {language === 'ko'
                        ? '도로 및 교통 상황에 따라 실제 소요 시간이 달라질 수 있습니다.'
                        : 'Actual duration may vary depending on road and traffic conditions.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Schedule Conflict Warning */}
              {isConflict && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] p-2.5 rounded-xl leading-normal flex gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    {language === 'ko'
                      ? '이동시간이 부족합니다. 다음 일정 시작 시간이나 이동수단을 조정해 주세요.'
                      : 'Insufficient travel time. Please adjust the next activity start time or travel method.'}
                  </span>
                </div>
              )}

              {/* Dev Debug section (Transit Analysis Dashboard) */}
              {showDevMode && (
                <div className="border-t border-dashed border-gray-100 dark:border-white/5 pt-2.5 mt-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[9px] text-amber-500 uppercase tracking-wider">
                    🔧 Dev Mode (Transit Analysis)
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchDetailedRoute(pref, true)}
                    disabled={isLoadingRoute}
                    className="p-1 px-2 text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg flex items-center gap-1 font-bold border border-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={9} className={isLoadingRoute ? "animate-spin" : ""} />
                    {language === 'ko' ? '분석 실행' : 'Analyze Route'}
                  </button>
                </div>

                {isLoadingRoute && (
                  <div className="mt-2 p-2 bg-blue-500/5 border border-blue-500/10 text-[10px] text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center gap-1.5">
                    <RefreshCw size={10} className="animate-spin text-blue-500" />
                    <span>{language === 'ko' ? 'Routes API 실시간 경로 분석 중...' : 'Analyzing Routes API route...'}</span>
                  </div>
                )}

                {routeErrorMsg && (
                  <div className="mt-2 p-2.5 bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-1.5 leading-normal">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5 text-rose-500" />
                    <span>{routeErrorMsg}</span>
                  </div>
                )}

                {to.transitDebugInfo && (
                  <div className="mt-2.5 space-y-2.5 bg-gray-50/50 dark:bg-[#151421] rounded-xl p-3 border border-gray-100 dark:border-stone-800/60 text-[10px]">
                    
                    {/* Scenario Preferences selectors */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-gray-400">
                        {language === 'ko' ? '경로 선호도 시나리오' : 'Routing Scenario'}
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {(['NONE', 'FEWER_TRANSFERS', 'LESS_WALKING'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setPref(p);
                              fetchDetailedRoute(p);
                            }}
                            className={`px-1 py-1 text-[8px] font-extrabold rounded-md border text-center transition-all ${
                              pref === p
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                : 'bg-white border-gray-100 dark:bg-[#1c1b29] dark:border-stone-800/40 text-gray-500'
                            }`}
                          >
                            {p === 'NONE' ? (language === 'ko' ? '기본' : 'Default') :
                             p === 'FEWER_TRANSFERS' ? (language === 'ko' ? '환승 최소' : 'Fewer Tx') :
                             (language === 'ko' ? '도보 최소' : 'Less Walk')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Alternative Routes selection if present */}
                    {alternatives.length > 1 && (
                      <div className="space-y-1 pt-1.5 border-t border-gray-100/50 dark:border-white/5">
                        <span className="text-[9px] font-bold text-gray-400">
                          {language === 'ko' ? '추천 대안 노선' : 'Alternative Routes'}
                        </span>
                        <div className="flex flex-col gap-1">
                          {alternatives.map((alt: any, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedRouteIdx(idx)}
                              className={`w-full text-left px-2 py-1.5 text-[9px] font-bold rounded-lg border transition-all flex items-center justify-between ${
                                selectedRouteIdx === idx
                                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-600 dark:text-blue-400'
                                  : 'bg-white border-gray-100 dark:bg-[#1c1b29] dark:border-stone-800/40 text-gray-500'
                              }`}
                            >
                              <span>{language === 'ko' ? `경로 ${idx + 1}` : `Route ${idx + 1}`} ({alt.durationText})</span>
                              <span className="text-[8px] text-gray-400 font-normal">
                                {alt.transferCount} Tx • {Math.floor((alt.totalWalkSeconds || 0) / 60)}m walk
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Basic Place ID info */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-gray-100/50 dark:border-white/5 text-[9px]">
                      <div>
                        <span className="text-gray-400 block font-semibold">Origin Place ID</span>
                        <span className="font-mono text-gray-600 dark:text-zinc-400 break-all bg-white dark:bg-[#1c1b29] p-1 rounded border border-gray-100 dark:border-stone-800/30 block max-h-10 overflow-y-auto">
                          {to.transitDebugInfo?.originPlaceId || 'N/A'}
                        </span>
                        <span className="text-[8px] text-gray-400 font-mono block mt-0.5">
                          Lat: {to.transitDebugInfo?.originLatLng?.lat?.toFixed(5) || 'N/A'}, Lng: {to.transitDebugInfo?.originLatLng?.lng?.toFixed(5) || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">Dest Place ID</span>
                        <span className="font-mono text-gray-600 dark:text-zinc-400 break-all bg-white dark:bg-[#1c1b29] p-1 rounded border border-gray-100 dark:border-stone-800/30 block max-h-10 overflow-y-auto">
                          {to.transitDebugInfo?.destinationPlaceId || 'N/A'}
                        </span>
                        <span className="text-[8px] text-gray-400 font-mono block mt-0.5">
                          Lat: {to.transitDebugInfo?.destinationLatLng?.lat?.toFixed(5) || 'N/A'}, Lng: {to.transitDebugInfo?.destinationLatLng?.lng?.toFixed(5) || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Time and timezone info */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-gray-100/50 dark:border-white/5 text-[9px]">
                      <div>
                        <span className="text-gray-400 block font-semibold">{language === 'ko' ? '여행지 타임존' : 'Timezone'}</span>
                        <span className="font-mono text-gray-700 dark:text-stone-300 break-all">
                          {to.transitDebugInfo?.timezoneId || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-semibold">{language === 'ko' ? '입력한 현지 시각' : 'Local Dep Time'}</span>
                        <span className="font-mono text-gray-700 dark:text-stone-300">
                          {to.transitDebugInfo?.localDepartureTime || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-gray-100/50 dark:border-white/5 text-[9px]">
                      <span className="text-gray-400 block font-semibold">UTC Departure Time</span>
                      <span className="font-mono text-gray-600 dark:text-zinc-400 break-all block">
                        {to.transitDebugInfo?.utcDepartureTime || 'N/A'}
                      </span>
                    </div>

                    {/* Breakdown metrics */}
                    <div className="pt-1.5 border-t border-gray-100/50 dark:border-white/5 text-[9px] space-y-1">
                      <span className="text-gray-400 block font-semibold mb-1">{language === 'ko' ? '세부 소요 시간 분석' : 'Time Breakdown Metrics'}</span>
                      
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="bg-white dark:bg-[#1c1b29] p-1.5 rounded border border-gray-100 dark:border-stone-800/30">
                          <span className="text-[8px] text-gray-400 block">{language === 'ko' ? 'API 전체 소요시간' : 'Total Duration'}</span>
                          <span className="font-bold text-gray-800 dark:text-text-primary text-[10px]">
                            {activeRoute?.totalDuration || activeRoute?.durationText || 'N/A'}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-[#1c1b29] p-1.5 rounded border border-gray-100 dark:border-stone-800/30">
                          <span className="text-[8px] text-gray-400 block">{language === 'ko' ? '최종 도착 시각' : 'Arrival Time'}</span>
                          <span className="font-bold text-gray-800 dark:text-text-primary text-[10px] truncate block">
                            {activeRoute?.finalArrivalTime ? new Date(activeRoute.finalArrivalTime).toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1">
                        <div className="bg-white dark:bg-[#1c1b29] p-1.5 rounded border border-gray-100 dark:border-stone-800/30 text-center">
                          <span className="text-[8px] text-gray-400 block">{language === 'ko' ? '첫 탑승 시각' : 'First Boarding'}</span>
                          <span className="font-bold text-gray-700 dark:text-stone-300 text-[9px] block truncate">
                            {activeRoute?.firstTransitDepartureTime ? new Date(activeRoute.firstTransitDepartureTime).toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-[#1c1b29] p-1.5 rounded border border-gray-100 dark:border-stone-800/30 text-center">
                          <span className="text-[8px] text-gray-400 block">{language === 'ko' ? '탑승 전 대기' : 'Initial Wait'}</span>
                          <span className="font-bold text-gray-700 dark:text-stone-300 text-[9px] block">
                            {Math.floor((activeRoute?.initialWaitSeconds || 0) / 60)}m
                          </span>
                        </div>
                        <div className="bg-white dark:bg-[#1c1b29] p-1.5 rounded border border-gray-100 dark:border-stone-800/30 text-center">
                          <span className="text-[8px] text-gray-400 block">{language === 'ko' ? '총 도보시간' : 'Total Walk'}</span>
                          <span className="font-bold text-gray-700 dark:text-stone-300 text-[9px] block">
                            {Math.floor((activeRoute?.totalWalkSeconds || 0) / 60)}m
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1">
                        <div className="bg-white dark:bg-[#1c1b29] p-1.5 rounded border border-gray-100 dark:border-stone-800/30 text-center">
                          <span className="text-[8px] text-gray-400 block">{language === 'ko' ? '환승 횟수' : 'Transfers'}</span>
                          <span className="font-bold text-gray-700 dark:text-stone-300 text-[9px] block">
                            {activeRoute?.transferCount || 0}회
                          </span>
                        </div>
                        <div className="bg-white dark:bg-[#1c1b29] p-1.5 rounded border border-gray-100 dark:border-stone-800/30 text-center overflow-hidden">
                          <span className="text-[8px] text-gray-400 block">{language === 'ko' ? '사용된 노선명' : 'Used Lines'}</span>
                          <span className="font-bold text-gray-700 dark:text-stone-300 text-[9px] truncate block" title={activeRoute?.usedLines?.join(', ') || 'None'}>
                            {activeRoute?.usedLines?.join(', ') || 'None'}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Segment Times */}
                      <div className="bg-white dark:bg-[#1c1b29] p-2 rounded border border-gray-100 dark:border-stone-800/30 text-[8px] space-y-1 font-mono text-gray-500">
                        <div className="flex justify-between">
                          <span>• {language === 'ko' ? '출발 도보 (Access Walk):' : 'Access Walk:'}</span>
                          <span>{Math.floor((activeRoute?.accessWalkSeconds || 0) / 60)}m { (activeRoute?.accessWalkSeconds || 0) % 60 }s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• {language === 'ko' ? '첫 차량 대기 (Initial Wait):' : 'Initial Wait:'}</span>
                          <span>{Math.floor((activeRoute?.initialWaitSeconds || 0) / 60)}m { (activeRoute?.initialWaitSeconds || 0) % 60 }s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• {language === 'ko' ? '차량 탑승 시간 (In-Vehicle):' : 'In-Vehicle Time:'}</span>
                          <span>{Math.floor((activeRoute?.inVehicleSeconds || 0) / 60)}m { (activeRoute?.inVehicleSeconds || 0) % 60 }s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• {language === 'ko' ? '환승 대기 시간 (Transfer Wait):' : 'Transfer Wait:'}</span>
                          <span>{Math.floor((activeRoute?.transferWaitSeconds || 0) / 60)}m { (activeRoute?.transferWaitSeconds || 0) % 60 }s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• {language === 'ko' ? '환승 도보 시간 (Transfer Walk):' : 'Transfer Walk:'}</span>
                          <span>{Math.floor((activeRoute?.transferWalkSeconds || 0) / 60)}m { (activeRoute?.transferWalkSeconds || 0) % 60 }s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• {language === 'ko' ? '하차 후 도보 (Egress Walk):' : 'Egress Walk:'}</span>
                          <span>{Math.floor((activeRoute?.egressWalkSeconds || 0) / 60)}m { (activeRoute?.egressWalkSeconds || 0) % 60 }s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
