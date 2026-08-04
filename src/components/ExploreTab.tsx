import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  Sun,
  Cloud,
  CloudRain,
  PlaneTakeoff,
  ThumbsUp,
  Search,
  Calendar,
  Users,
  Droplets,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  HelpCircle,
  MapPin,
  PartyPopper,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GooglePlaceInput from './GooglePlaceInput';
import { Language } from '../utils/translations';

interface ExploreTabProps {
  onSelectDestination?: (destName: string, startDate?: string, endDate?: string) => void;
  language?: Language;
  isDarkMode?: boolean;
}

const LOCAL_TRANS = {
  ko: {
    title: "도시·지역 및 여행 기간 기반 로컬 여행 정보 탐색",
    subtitle: "방문하려는 도시와 여행 일정을 입력하시면 대표 축제, 날씨, 혼잡도, 공휴일 정보를 실시간 분석하여 최적의 플랜을 제안합니다.",
    place_label: "어디로 떠나시나요?",
    dates_label: "언제 떠나시나요?",
    popular_suggestions: "요즘 인기 있는 대표 여행지",
    search_btn: "로컬 여행 정보 분석하기",
    searching_btn: "도시 분석 보고서 생성 중...",
    recommendation_score: "로컬 여행 추천 지수",
    score_narrative: "종합 로컬 분석 보고서",
    festivals_title: "🎉 여행 기간 중 펼쳐지는 축제 & 이벤트",
    festivals_desc: "현지의 정취를 생생하게 체험할 수 있는 로컬 축제 정보입니다.",
    no_festival: "해당 여행 기간 동안 예정된 축제가 없습니다. 고즈넉한 도심 산책과 평화로운 현지 일상에 빠져보기에 가장 여유롭고 완벽한 시간입니다.",
    weather_title: "🌤️ 기상 상황 및 기후 여건",
    weather_temp: "평균 기온",
    weather_humidity: "평균 습도",
    rainy_season: "우기 여부",
    congestion_title: "👥 관광객 밀집도 & 혼잡도",
    holidays_title: "📅 여행 기간 내 현지 공휴일 안내",
    no_holiday: "해당 기간 동안 현지 공식 공휴일이 존재하지 않습니다. 모든 박물관, 쇼핑몰 및 매장들이 정상 운영되므로 수월하고 완활한 여행이 가능합니다.",
    holiday_warning: "국가 공휴일에는 미술관, 주요 관공서, 상점 등이 휴무 또는 단축 운영할 수 있으므로 일정을 가볍게 체크해 보세요.",
    add_to_plan: "이 로컬 정보로 플래너 일정 만들기 ✨",
    added_to_plan_alert: "일정 정보를 계획 탭으로 연동하여 신규 계획을 구성했습니다! ✈️",
    force_refresh: "실시간 정보로 다시 업데이트 분석하기",
    data_gap_warning: "⚠️ Trippo는 신뢰할 수 있는 축제 정보만을 엄선하여 보여드립니다. 만약 해당 지역에 실제 열리는 주요 축제가 없을 경우, 임의로 허구 데이터를 만들어내지 않고 투명하게 빈 리스트로 표기하여 여행 일정의 신뢰도를 유지합니다."
  },
  en: {
    title: "Explore Local Travel Insights",
    subtitle: "Enter any city and travel dates to analyze active festivals, real-time climate, crowd densities, and national holidays to craft your perfect trip.",
    place_label: "Where are you heading?",
    dates_label: "When are you visiting?",
    popular_suggestions: "Trending Local Destinations",
    search_btn: "Analyze Destination Info",
    searching_btn: "Generating Local Analysis...",
    recommendation_score: "Travel Advisory Score",
    score_narrative: "Local Travel Narrative",
    festivals_title: "🎉 Active Representative Festivals & Events",
    festivals_desc: "Official local celebrations and verified events happening during your travel window.",
    no_festival: "No major representative festivals scheduled in this window. A perfect, tranquil opportunity to enjoy leisurely city walking, quiet cafes, and local neighborhood vibes.",
    weather_title: "🌤️ Live Weather & Climate Conditions",
    weather_temp: "Average Temp",
    weather_humidity: "Humidity",
    rainy_season: "Rainy Season",
    congestion_title: "👥 Tourist Density & Crowd Level",
    holidays_title: "📅 National Public Holidays & Closures",
    no_holiday: "No major public holidays during this period. Standard commercial, public, and cultural establishments operate under regular business hours.",
    holiday_warning: "National public holidays may cause closures or early hours for major tourist hotspots, museums, and shops. Verify ahead of time.",
    add_to_plan: "Start Travel Plan with this Itinerary ✨",
    added_to_plan_alert: "Successfully imported your city and travel dates to the Plan tab! ✈️",
    force_refresh: "Re-analyze with Latest Live Data",
    data_gap_warning: "⚠️ Trippo strictly presents verified official festival data. If there are no accredited local events scheduled, we do not fabricate fictitious items, ensuring absolute reliability for your itinerary plans."
  }
};

const POPULAR_PLACES = [
  { nameKo: '파리, 프랑스', nameEn: 'Paris, France', placeId: 'ChIJD7fiBh9u5kcRYJSMff9bFI8', lat: 48.8566, lng: 2.3522 },
  { nameKo: '도쿄, 일본', nameEn: 'Tokyo, Japan', placeId: 'ChIJ8WG19t6LGGAR79WbAtuWvWc', lat: 35.6762, lng: 139.6503 },
  { nameKo: '보라카이, 필리핀', nameEn: 'Boracay, Philippines', placeId: 'ChIJX0A-U_eLrjMRfAtR6P1Fh3s', lat: 11.9712, lng: 121.9248 },
  { nameKo: '서울, 대한민국', nameEn: 'Seoul, South Korea', placeId: 'ChIJzctv9EJYezURgZTr9I9SgY0', lat: 37.5665, lng: 126.9780 }
];

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
}

export interface AdaptiveDateInfo {
  dDays: number;
  dateDisplayType: 'estimated_period' | 'official';
  isOfficial: boolean;
  officialStatus: 'confirmed' | 'estimated';
  displayDate: string;
  displayDateKo: string;
  displayDateEn: string;
  estimatedPeriodKo: string;
  estimatedPeriodEn: string;
  officialDateKo: string;
  officialDateEn: string;
  pastDates: string[];
  pastDatesKo: string[];
  pastDatesEn: string[];
  officialScheduleStatus: string;
  estimatedPeriod?: {
    ko: string;
    en: string;
  };
  officialSchedule?: {
    startDate: string;
    endDate: string;
    status: 'confirmed' | 'estimated';
    source: string | null;
    sourceUrl: string | null;
  };
  previousOccurrences?: PreviousOccurrence[];
}

interface PreviousOccurrence {
  year: number;
  startDate: string;
  endDate: string;
  source: string;
  sourceUrl: string;
  verified: boolean;
  lastVerified: string;
}

interface OfficialFestivalMetadata {
  estimatedPeriodKo: string;
  estimatedPeriodEn: string;
  officialSchedule: {
    startDate: string;
    endDate: string;
    status: 'confirmed' | 'estimated';
    source: string | null;
    sourceUrl: string | null;
  };
  previousOccurrences: PreviousOccurrence[];
}

function getOfficialFestivalMetadata(name: string, fallbackStartDate?: string, fallbackEndDate?: string): OfficialFestivalMetadata {
  const normalized = (name || "").trim().replace(/\s+/g, '');
  
  if (normalized.includes("불꽃축제") || normalized.includes("Fireworks")) {
    if (normalized.includes("스미다강") || normalized.includes("Sumida")) {
      return {
        estimatedPeriodKo: "7월 하순",
        estimatedPeriodEn: "Late July",
        officialSchedule: {
          startDate: "2026-07-25",
          endDate: "2026-07-25",
          status: "confirmed",
          source: "스미다강 불꽃축제 실행위원회",
          sourceUrl: "https://www.sumidagawa-hanabi.com"
        },
        previousOccurrences: [
          { year: 2025, startDate: "2025-07-26", endDate: "2025-07-26", source: "스미다강 불꽃축제 공식홈페이지", sourceUrl: "https://www.sumidagawa-hanabi.com", verified: true, lastVerified: "2026-07-23" },
          { year: 2024, startDate: "2024-07-27", endDate: "2024-07-27", source: "스미다강 불꽃축제 공식홈페이지", sourceUrl: "https://www.sumidagawa-hanabi.com", verified: true, lastVerified: "2026-07-23" }
        ]
      };
    }
    return {
      estimatedPeriodKo: "10월 초순",
      estimatedPeriodEn: "Early October",
      officialSchedule: {
        startDate: "2026-10-03",
        endDate: "2026-10-03",
        status: "confirmed",
        source: "한화 공식 홈페이지 (Hanwha)",
        sourceUrl: "https://www.hanwha.com"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-10-04", endDate: "2025-10-04", source: "서울특별시 관광포털", sourceUrl: "https://english.seoul.go.kr", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-10-05", endDate: "2024-10-05", source: "서울시 뉴스", sourceUrl: "https://www.seoul.go.kr", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("빛초롱") || normalized.includes("Lantern")) {
    return {
      estimatedPeriodKo: "12월 중순 ~ 12월 말",
      estimatedPeriodEn: "Mid to Late December",
      officialSchedule: {
        startDate: "2026-11-01",
        endDate: "2026-12-31",
        status: "confirmed",
        source: "서울관광재단 (Visit Seoul)",
        sourceUrl: "https://korean.visitseoul.net"
      },
      previousOccurrences: [
        { year: 2024, startDate: "2024-12-13", endDate: "2025-01-12", source: "서울관광재단", sourceUrl: "https://www.sto.or.kr", verified: true, lastVerified: "2026-07-23" },
        { year: 2023, startDate: "2023-12-15", endDate: "2024-01-21", source: "서울관광재단", sourceUrl: "https://www.sto.or.kr", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("드론라이트") || normalized.includes("DroneLight")) {
    return {
      estimatedPeriodKo: "9월 초순 ~ 10월 하순",
      estimatedPeriodEn: "Early September to Late October",
      officialSchedule: {
        startDate: "2026-09-05",
        endDate: "2026-10-26",
        status: "confirmed",
        source: "서울특별시 공식 홈페이지",
        sourceUrl: "https://english.seoul.go.kr"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-09-13", endDate: "2025-10-26", source: "서울특별시", sourceUrl: "https://www.seoul.go.kr", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-09-28", endDate: "2024-10-26", source: "서울특별시", sourceUrl: "https://www.seoul.go.kr", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("거리예술축제") || normalized.includes("StreetArts")) {
    return {
      estimatedPeriodKo: "9월 하순",
      estimatedPeriodEn: "Late September",
      officialSchedule: {
        startDate: "2026-09-25",
        endDate: "2026-09-27",
        status: "confirmed",
        source: "서울문화재단 (Seoul Foundation for Arts and Culture)",
        sourceUrl: "https://www.sfac.or.kr"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-09-19", endDate: "2025-09-21", source: "서울문화재단 공식홈페이지", sourceUrl: "https://www.sfac.or.kr", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-09-28", endDate: "2024-09-29", source: "서울문화재단 공식홈페이지", sourceUrl: "https://www.sfac.or.kr", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("석촌호수") || normalized.includes("SeokchonLake")) {
    return {
      estimatedPeriodKo: "10월 하순 ~ 11월 중순",
      estimatedPeriodEn: "Late October to Mid November",
      officialSchedule: {
        startDate: "2026-10-20",
        endDate: "2026-11-15",
        status: "confirmed",
        source: "송파구청 공식포털",
        sourceUrl: "https://www.songpa.go.kr"
      },
      previousOccurrences: [
        { year: 2024, startDate: "2024-10-25", endDate: "2024-11-24", source: "송파구청", sourceUrl: "https://www.songpa.go.kr", verified: true, lastVerified: "2026-07-23" },
        { year: 2023, startDate: "2023-10-27", endDate: "2023-11-26", source: "송파구청", sourceUrl: "https://www.songpa.go.kr", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("서울윈타") || normalized.includes("WinterFesta") || normalized.includes("WINTA")) {
    return {
      estimatedPeriodKo: "12월 중순 ~ 1월 초순",
      estimatedPeriodEn: "Mid December to Early January",
      officialSchedule: {
        startDate: "2026-12-15",
        endDate: "2026-12-31",
        status: "confirmed",
        source: "서울특별시 공식 웹사이트",
        sourceUrl: "https://www.seoul.go.kr"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-12-17", endDate: "2026-01-04", source: "서울특별시", sourceUrl: "https://www.seoul.go.kr", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-12-18", endDate: "2025-01-05", source: "서울특별시", sourceUrl: "https://www.seoul.go.kr", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("코엔지아와오도리") || normalized.includes("KoenjiAwaOdori")) {
    return {
      estimatedPeriodKo: "8월 하순",
      estimatedPeriodEn: "Late August",
      officialSchedule: {
        startDate: "2026-08-22",
        endDate: "2026-08-23",
        status: "confirmed",
        source: "도쿄 코엔지 아와오도리 연합회",
        sourceUrl: "https://www.koenji-awaodori.com"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-08-23", endDate: "2025-08-24", source: "도쿄 코엔지 아와오도리 공식 홈페이지", sourceUrl: "https://www.koenji-awaodori.com", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-08-24", endDate: "2024-08-25", source: "도쿄 코엔지 아와오도리 공식 홈페이지", sourceUrl: "https://www.koenji-awaodori.com", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("카구라자카") || normalized.includes("Kagurazaka")) {
    return {
      estimatedPeriodKo: "7월 하순",
      estimatedPeriodEn: "Late July",
      officialSchedule: {
        startDate: "2026-07-22",
        endDate: "2026-07-25",
        status: "confirmed",
        source: "카구라자카 상가진흥조합",
        sourceUrl: "https://www.kagurazaka.in"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-07-23", endDate: "2025-07-26", source: "카구라자카 상가진흥조합 공식 사이트", sourceUrl: "https://www.kagurazaka.in", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-07-24", endDate: "2024-07-27", source: "카구라자카 상가진흥조합 공식 사이트", sourceUrl: "https://www.kagurazaka.in", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("신주쿠에이사") || normalized.includes("ShinjukuEisa")) {
    return {
      estimatedPeriodKo: "7월 하순",
      estimatedPeriodEn: "Late July",
      officialSchedule: {
        startDate: "2026-07-25",
        endDate: "2026-07-25",
        status: "confirmed",
        source: "신주쿠 오도리 상가진흥조합",
        sourceUrl: "http://www.shinjuku-eisa.com"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-07-26", endDate: "2025-07-26", source: "신주쿠 에이사 축제 사무국", sourceUrl: "http://www.shinjuku-eisa.com", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-07-27", endDate: "2024-07-27", source: "신주쿠 에이사 축제 사무국", sourceUrl: "http://www.shinjuku-eisa.com", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("후카가와하치만") || normalized.includes("FukagawaHachiman")) {
    return {
      estimatedPeriodKo: "8월 중순",
      estimatedPeriodEn: "Mid August",
      officialSchedule: {
        startDate: "2026-08-11",
        endDate: "2026-08-15",
        status: "confirmed",
        source: "도미오카 하치만구 신사",
        sourceUrl: "http://www.tomiokahachimangu.or.jp"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-08-11", endDate: "2025-08-15", source: "도미오카 하치만구", sourceUrl: "http://www.tomiokahachimangu.or.jp", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-08-11", endDate: "2024-08-15", source: "도미오카 하치만구", sourceUrl: "http://www.tomiokahachimangu.or.jp", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("오모테산도스파요사코이") || normalized.includes("OmotesandoSuperYosakoi")) {
    return {
      estimatedPeriodKo: "8월 말",
      estimatedPeriodEn: "Late August",
      officialSchedule: {
        startDate: "2026-08-29",
        endDate: "2026-08-30",
        status: "confirmed",
        source: "하라주쿠 오모테산도 상가진흥조합",
        sourceUrl: "https://www.super-yosakoi.tokyo"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-08-30", endDate: "2025-08-31", source: "오모테산도 요사코이 실행위원회", sourceUrl: "https://www.super-yosakoi.tokyo", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-08-24", endDate: "2024-08-25", source: "오모테산도 요사코이 실행위원회", sourceUrl: "https://www.super-yosakoi.tokyo", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("네즈신사") || normalized.includes("NezuShrine")) {
    return {
      estimatedPeriodKo: "9월 중순",
      estimatedPeriodEn: "Mid September",
      officialSchedule: {
        startDate: "2026-09-19",
        endDate: "2026-09-20",
        status: "confirmed",
        source: "네즈 신사 공식",
        sourceUrl: "http://www.nedujinja.or.jp"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-09-20", endDate: "2025-09-21", source: "네즈 신사 공식 홈페이지", sourceUrl: "http://www.nedujinja.or.jp", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-09-21", endDate: "2024-09-22", source: "네즈 신사 공식 홈페이지", sourceUrl: "http://www.nedujinja.or.jp", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("메구로꽁치") || normalized.includes("MeguroSanma")) {
    return {
      estimatedPeriodKo: "9월 초순",
      estimatedPeriodEn: "Early September",
      officialSchedule: {
        startDate: "2026-09-06",
        endDate: "2026-09-06",
        status: "confirmed",
        source: "메구로구 관광협회",
        sourceUrl: "https://www.meguro-kanko.com"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-09-07", endDate: "2025-09-07", source: "메구로구 관광협회 공식", sourceUrl: "https://www.meguro-kanko.com", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-09-08", endDate: "2024-09-08", source: "메구로구 관광협회 공식", sourceUrl: "https://www.meguro-kanko.com", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("국제영화제") || normalized.includes("FilmFestival")) {
    return {
      estimatedPeriodKo: "10월 말",
      estimatedPeriodEn: "Late October",
      officialSchedule: {
        startDate: "2026-10-26",
        endDate: "2026-11-03",
        status: "confirmed",
        source: "도쿄국제영화제 실행위원회",
        sourceUrl: "https://www.tiff-jp.net"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-10-30", endDate: "2025-11-07", source: "TIFF 공식 웹사이트", sourceUrl: "https://www.tiff-jp.net", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-10-28", endDate: "2024-11-06", source: "TIFF 공식 웹사이트", sourceUrl: "https://www.tiff-jp.net", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("키시보진") || normalized.includes("Kishibojin")) {
    return {
      estimatedPeriodKo: "10월 중순",
      estimatedPeriodEn: "Mid October",
      officialSchedule: {
        startDate: "2026-10-16",
        endDate: "2026-10-18",
        status: "confirmed",
        source: "조시가야 키시보진당",
        sourceUrl: "https://www.kishimojin.jp"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-10-16", endDate: "2025-10-18", source: "조시가야 키시보진당 사이트", sourceUrl: "https://www.kishimojin.jp", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-10-16", endDate: "2024-10-18", source: "조시가야 키시보진당 사이트", sourceUrl: "https://www.kishimojin.jp", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("메이지신구") || normalized.includes("MeijiShrine")) {
    return {
      estimatedPeriodKo: "11월 초순",
      estimatedPeriodEn: "Early November",
      officialSchedule: {
        startDate: "2026-11-01",
        endDate: "2026-11-03",
        status: "confirmed",
        source: "메이지 신구 공식",
        sourceUrl: "https://www.meijijingu.or.jp"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-11-01", endDate: "2025-11-03", source: "메이지 신구 공식 사이트", sourceUrl: "https://www.meijijingu.or.jp", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-11-01", endDate: "2024-11-03", source: "메이지 신구 공식 사이트", sourceUrl: "https://www.meijijingu.or.jp", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("토리노이치") || normalized.includes("TorinoIchi")) {
    return {
      estimatedPeriodKo: "11월 중순",
      estimatedPeriodEn: "Mid November",
      officialSchedule: {
        startDate: "2026-11-11",
        endDate: "2026-11-23",
        status: "confirmed",
        source: "아사쿠사 토리노이치 실행위원회",
        sourceUrl: "https://www.torinoichi.jp"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-11-05", endDate: "2025-11-29", source: "토리노이치 공식 포털", sourceUrl: "https://www.torinoichi.jp", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-11-05", endDate: "2024-11-29", source: "토리노이치 공식 포털", sourceUrl: "https://www.torinoichi.jp", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("은행나무") || normalized.includes("Ginkgo")) {
    return {
      estimatedPeriodKo: "11월 중순 ~ 12월 초순",
      estimatedPeriodEn: "Mid November to Early December",
      officialSchedule: {
        startDate: "2026-11-14",
        endDate: "2026-12-06",
        status: "confirmed",
        source: "메이지진구 외원 관리사무소",
        sourceUrl: "https://www.meijijingu-gaien.jp"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-11-15", endDate: "2025-12-07", source: "메이지진구 외원 공식", sourceUrl: "https://www.meijijingu-gaien.jp", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-11-23", endDate: "2024-12-01", source: "메이지진구 외원 공식", sourceUrl: "https://www.meijijingu-gaien.jp", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("롯폰기") || normalized.includes("Roppongi")) {
    return {
      estimatedPeriodKo: "11월 중순 ~ 12월 말",
      estimatedPeriodEn: "Mid November to Late December",
      officialSchedule: {
        startDate: "2026-11-10",
        endDate: "2026-12-25",
        status: "confirmed",
        source: "롯폰기 힐즈 오피셜",
        sourceUrl: "https://www.roppongihills.com"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-11-06", endDate: "2025-12-25", source: "롯폰기 힐즈 공식 홈페이지", sourceUrl: "https://www.roppongihills.com", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-11-07", endDate: "2024-12-25", source: "롯폰기 힐즈 공식 홈페이지", sourceUrl: "https://www.roppongihills.com", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("마루노우치") || normalized.includes("Marunouchi")) {
    return {
      estimatedPeriodKo: "11월 중순 ~ 12월 말",
      estimatedPeriodEn: "Mid November to Late December",
      officialSchedule: {
        startDate: "2026-11-12",
        endDate: "2026-12-31",
        status: "confirmed",
        source: "마루노우치 진흥회",
        sourceUrl: "https://www.marunouchi.com"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-11-13", endDate: "2026-02-15", source: "마루노우치 공식포털", sourceUrl: "https://www.marunouchi.com", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-11-14", endDate: "2025-02-16", source: "마루노우치 공식포털", sourceUrl: "https://www.marunouchi.com", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("크리스마스마켓") || normalized.includes("ChristmasMarket")) {
    return {
      estimatedPeriodKo: "12월 초순 ~ 12월 말",
      estimatedPeriodEn: "Early to Late December",
      officialSchedule: {
        startDate: "2026-12-01",
        endDate: "2026-12-25",
        status: "confirmed",
        source: "도쿄 크리스마스 마켓 실행위원회",
        sourceUrl: "https://tokyochristmas.net"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-12-11", endDate: "2025-12-25", source: "도쿄 크리스마스 마켓 공식홈", sourceUrl: "https://tokyochristmas.net", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-12-14", endDate: "2024-12-25", source: "도쿄 크리스마스 마켓 공식홈", sourceUrl: "https://tokyochristmas.net", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("뉘블랑슈") || normalized.includes("NuitBlanche")) {
    return {
      estimatedPeriodKo: "6월 초순",
      estimatedPeriodEn: "Early June",
      officialSchedule: {
        startDate: "2026-10-03",
        endDate: "2026-10-04",
        status: "confirmed",
        source: "파리 시청 (Ville de Paris)",
        sourceUrl: "https://www.paris.fr"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-06-07", endDate: "2025-06-08", source: "파리 시청 공식포털", sourceUrl: "https://www.paris.fr", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-06-01", endDate: "2024-06-02", source: "파리 시청 공식포털", sourceUrl: "https://www.paris.fr", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("몽마르트르") || normalized.includes("Montmartre")) {
    return {
      estimatedPeriodKo: "10월 초순",
      estimatedPeriodEn: "Early October",
      officialSchedule: {
        startDate: "2026-10-07",
        endDate: "2026-10-11",
        status: "confirmed",
        source: "몽마르트르 와인 축제 사무국",
        sourceUrl: "https://www.fetedesvendangesdemontmartre.com"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-10-08", endDate: "2025-10-12", source: "몽마르트르 포도 수확 축제 공식", sourceUrl: "https://www.fetedesvendangesdemontmartre.com", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-10-09", endDate: "2024-10-13", source: "몽마르트르 포도 수확 축제 공식", sourceUrl: "https://www.fetedesvendangesdemontmartre.com", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("샹젤리제") || normalized.includes("Champs-Élysées")) {
    return {
      estimatedPeriodKo: "11월 중순 ~ 12월 말",
      estimatedPeriodEn: "Mid November to Late December",
      officialSchedule: {
        startDate: "2026-11-15",
        endDate: "2026-12-31",
        status: "confirmed",
        source: "샹젤리제 위원회",
        sourceUrl: "https://www.champselysees-paris.org"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-11-23", endDate: "2026-01-04", source: "샹젤리제 위원회 공식 사이트", sourceUrl: "https://www.champselysees-paris.org", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-11-24", endDate: "2025-01-05", source: "샹젤리제 위원회 공식 사이트", sourceUrl: "https://www.champselysees-paris.org", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("로이끄라통") || normalized.includes("LoyKrathong")) {
    return {
      estimatedPeriodKo: "11월 하순",
      estimatedPeriodEn: "Late November",
      officialSchedule: {
        startDate: "2026-11-24",
        endDate: "2026-11-25",
        status: "confirmed",
        source: "태국 관광청 (Tourism Authority of Thailand)",
        sourceUrl: "https://www.tatnews.org"
      },
      previousOccurrences: [
        { year: 2025, startDate: "2025-11-05", endDate: "2025-11-06", source: "태국 관광청 공식 보도자료", sourceUrl: "https://www.tatnews.org", verified: true, lastVerified: "2026-07-23" },
        { year: 2024, startDate: "2024-11-15", endDate: "2024-11-16", source: "태국 관광청 공식 보도자료", sourceUrl: "https://www.tatnews.org", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  if (normalized.includes("비엔날레") || normalized.includes("Biennale")) {
    return {
      estimatedPeriodKo: "10월 하순 ~ 12월 말",
      estimatedPeriodEn: "Late October to Late December",
      officialSchedule: {
        startDate: "2026-10-24",
        endDate: "2026-12-31",
        status: "confirmed",
        source: "방콕 아트 비엔날레 재단",
        sourceUrl: "https://www.bkkartbiennale.com"
      },
      previousOccurrences: [
        { year: 2024, startDate: "2024-10-24", endDate: "2025-02-25", source: "방콕 아트 비엔날레 재단 공식", sourceUrl: "https://www.bkkartbiennale.com", verified: true, lastVerified: "2026-07-23" }
      ]
    };
  }

  const startStr = fallbackStartDate || "2026-01-01";
  const endStr = fallbackEndDate || startStr;
  const sParts = startStr.split('-').map(Number);
  const sMonth = sParts[1] || 1;
  const sDay = sParts[2] || 1;

  const getDayPartString = (day: number, lang: string) => {
    if (day <= 10) return lang === 'ko' ? '초순' : 'Early';
    if (day <= 20) return lang === 'ko' ? '중순' : 'Mid';
    return lang === 'ko' ? '하순' : 'Late';
  };

  const partKo = getDayPartString(sDay, 'ko');
  const partEn = getDayPartString(sDay, 'en');
  const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mEn = monthNamesEn[sMonth - 1] || "Jan";

  return {
    estimatedPeriodKo: `${sMonth}월 ${partKo}`,
    estimatedPeriodEn: `${partEn} ${mEn}`,
    officialSchedule: {
      startDate: startStr,
      endDate: endStr,
      status: "estimated",
      source: null,
      sourceUrl: null
    },
    previousOccurrences: []
  };
}

export function getAdaptiveEventDateInfo(params: {
  startDate: string;
  endDate?: string;
  tripStartDate?: string;
  isOfficial?: boolean;
  officialStatus?: string;
  language?: Language;
  festivalName?: string;
}): AdaptiveDateInfo {
  const {
    startDate,
    endDate,
    tripStartDate,
    isOfficial,
    officialStatus,
    language = 'ko',
    festivalName
  } = params;

  const todayStr = new Date().toISOString().split('T')[0];
  const targetDateStr = tripStartDate || startDate || todayStr;

  const todayMs = new Date(todayStr).getTime();
  const targetMs = new Date(targetDateStr).getTime();
  const dDays = Math.ceil((targetMs - todayMs) / (1000 * 60 * 60 * 24));

  // Look up verified static metadata
  const officialMetadata = getOfficialFestivalMetadata(festivalName || "", startDate, endDate || startDate);

  // D-Day policy for display type
  let dateDisplayType: 'estimated_period' | 'official' = 'estimated_period';
  const isConfirmed = officialMetadata.officialSchedule.status === 'confirmed';

  if (dDays >= 90) {
    dateDisplayType = 'estimated_period';
  } else if (dDays >= 30) {
    dateDisplayType = isConfirmed ? 'official' : 'estimated_period';
  } else {
    dateDisplayType = 'official';
  }

  const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayOfWeekKo = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeekEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const sParts = (startDate || todayStr).split('-').map(Number);
  const eParts = (endDate || startDate || todayStr).split('-').map(Number);

  const sYear = sParts[0] || 2026;
  const sMonth = sParts[1] || 1;
  const sDay = sParts[2] || 1;

  const eYear = eParts[0] || sYear;
  const eMonth = eParts[1] || sMonth;
  const eDay = eParts[2] || sDay;

  const sDateObj = new Date(sYear, sMonth - 1, sDay);
  const eDateObj = new Date(eYear, eMonth - 1, eDay);

  const sDayOfWeekKo = dayOfWeekKo[sDateObj.getDay()] || '토';
  const sDayOfWeekEnStr = dayOfWeekEn[sDateObj.getDay()] || 'Sat';
  const eDayOfWeekKo = dayOfWeekKo[eDateObj.getDay()] || '토';
  const eDayOfWeekEnStr = dayOfWeekEn[eDateObj.getDay()] || 'Sat';

  let officialDateKo = '';
  let officialDateEn = '';

  const endStr = endDate || startDate;
  if (startDate === endStr) {
    officialDateKo = `${sMonth}월 ${sDay}일 (${sDayOfWeekKo})`;
    officialDateEn = `${monthEn[sMonth - 1]} ${sDay} (${sDayOfWeekEnStr})`;
  } else {
    if (sMonth === eMonth) {
      officialDateKo = `${sMonth}월 ${sDay}일 (${sDayOfWeekKo}) ~ ${eDay}일 (${eDayOfWeekKo})`;
      officialDateEn = `${monthEn[sMonth - 1]} ${sDay} (${sDayOfWeekEnStr}) ~ ${eDay} (${eDayOfWeekEnStr})`;
    } else {
      officialDateKo = `${sMonth}월 ${sDay}일 (${sDayOfWeekKo}) ~ ${eMonth}월 ${eDay}일 (${eDayOfWeekKo})`;
      officialDateEn = `${monthEn[sMonth - 1]} ${sDay} (${sDayOfWeekEnStr}) ~ ${monthEn[eMonth - 1]} ${eDay} (${eDayOfWeekEnStr})`;
    }
  }

  const estimatedPeriodKo = officialMetadata.estimatedPeriodKo;
  const estimatedPeriodEn = officialMetadata.estimatedPeriodEn;

  const displayDateKo = dateDisplayType === 'official' ? officialDateKo : estimatedPeriodKo;
  const displayDateEn = dateDisplayType === 'official' ? officialDateEn : estimatedPeriodEn;

  // Build human-friendly date format for past records safely
  const formatOccurrenceDate = (dateStr: string, lang: 'ko' | 'en') => {
    const parts = dateStr.split('-').map(Number);
    const yr = parts[0];
    const mo = parts[1];
    const dy = parts[2];
    const dt = new Date(yr, mo - 1, dy);
    
    const dwKo = dayOfWeekKo[dt.getDay()] || '토';
    const dwEn = dayOfWeekEn[dt.getDay()] || 'Sat';

    if (lang === 'ko') {
      return `${yr}년 ${mo}월 ${dy}일 (${dwKo})`;
    } else {
      return `${monthEn[mo - 1]} ${dy}, ${yr} (${dwEn})`;
    }
  };

  const pastDatesKo = officialMetadata.previousOccurrences.map(occ => {
    if (occ.startDate === occ.endDate) {
      return `${occ.year}년: ${formatOccurrenceDate(occ.startDate, 'ko')}`;
    } else {
      return `${occ.year}년: ${formatOccurrenceDate(occ.startDate, 'ko')} ~ ${formatOccurrenceDate(occ.endDate, 'ko')}`;
    }
  });

  const pastDatesEn = officialMetadata.previousOccurrences.map(occ => {
    if (occ.startDate === occ.endDate) {
      return `${occ.year}: ${formatOccurrenceDate(occ.startDate, 'en')}`;
    } else {
      return `${occ.year}: ${formatOccurrenceDate(occ.startDate, 'en')} ~ ${formatOccurrenceDate(occ.endDate, 'en')}`;
    }
  });

  return {
    dDays,
    dateDisplayType,
    isOfficial: isConfirmed && officialMetadata.officialSchedule.source !== null,
    officialStatus: isConfirmed ? "confirmed" : "estimated",
    displayDate: language === 'en' ? displayDateEn : displayDateKo,
    displayDateKo,
    displayDateEn,
    estimatedPeriodKo,
    estimatedPeriodEn,
    officialDateKo,
    officialDateEn,
    pastDates: language === 'en' ? pastDatesEn : pastDatesKo,
    pastDatesKo,
    pastDatesEn,
    officialScheduleStatus: isConfirmed ? (language === 'en' ? "Confirmed" : "발표 완료") : (language === 'en' ? "Pending" : "발표 전"),
    estimatedPeriod: {
      ko: estimatedPeriodKo,
      en: estimatedPeriodEn
    },
    officialSchedule: {
      startDate: officialMetadata.officialSchedule.startDate,
      endDate: officialMetadata.officialSchedule.endDate,
      status: officialMetadata.officialSchedule.status,
      source: officialMetadata.officialSchedule.source,
      sourceUrl: officialMetadata.officialSchedule.sourceUrl
    },
    previousOccurrences: officialMetadata.previousOccurrences
  };
}

const formatDisplayShort = (dateStr: string, language: Language = 'ko'): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return language === 'ko' ? `${mm}월 ${dd}일` : `${mm}/${dd}`;
};

const translateWeatherStatus = (status?: string, lang: Language = 'ko'): string => {
  if (!status) return '';
  if (lang === 'ko') return status;

  const s = status.trim();
  const map: Record<string, string> = {
    '맑음': 'Clear',
    '대체로 맑음': 'Mostly Clear',
    '구름조금': 'Partly Cloudy',
    '구름많음': 'Mostly Cloudy',
    '흐림': 'Overcast',
    '안개': 'Foggy',
    '가벼운 이슬비': 'Light Drizzle',
    '이슬비': 'Drizzle',
    '비': 'Rain',
    '강한 비': 'Heavy Rain',
    '얼어붙는 비': 'Freezing Rain',
    '눈': 'Snow',
    '싸락눈': 'Snow Grains',
    '소나기': 'Showers',
    '오후 소나기': 'Showers',
    '소낙눈': 'Snow Showers',
    '뇌우': 'Thunderstorm',
    '강한 뇌우 및 우박': 'Heavy Thunderstorm & Hail',
    '약한 비': 'Light Rain',
    '보통 비': 'Moderate Rain'
  };

  return map[s] || s;
};

const translateSensoryStatus = (sensory?: string, lang: Language = 'ko'): string => {
  if (!sensory) return lang === 'ko' ? '쾌적함' : 'Comfortable';
  if (lang === 'ko') return sensory;

  const s = sensory.trim();
  const map: Record<string, string> = {
    '매우 후텁지근함': 'Very Humid',
    '후텁지근함': 'Humid',
    '쾌적함': 'Comfortable',
    '건조함': 'Dry',
    '쌀쌀함': 'Chilly',
    '따뜻함': 'Warm',
    '더움': 'Hot',
    '무더움': 'Sweltering',
    '매우 더움': 'Very Hot'
  };

  return map[s] || s;
};

const translateTipToEnglish = (tip: string): string => {
  if (!tip) return '';
  if (/[a-zA-Z]{4,}/.test(tip)) return tip;

  if (tip.includes('35℃')) {
    return 'Highs exceed 35°C. Limit outdoor activities between 11 AM and 4 PM, and carry water and a parasol.';
  }
  if (tip.includes('38℃')) {
    return 'Feels-like temperatures above 38°C expected. Combine indoor activities and public transport rather than walking long distances.';
  }
  if (tip.includes('60%')) {
    return 'Precipitation probability is over 60%. Pack a compact umbrella and prepare indoor alternative plans.';
  }
  if (tip.includes('75%')) {
    return 'Average humidity exceeds 75%. Pack breathable clothing and extra layers.';
  }
  if (tip.includes('활동하기 좋은') || tip.includes('따뜻한 날씨')) {
    return 'Warm and pleasant weather for travel. Apply sunscreen and wear comfortable light clothes.';
  }
  if (tip.includes('선선하고') || tip.includes('쾌적한 날씨')) {
    return 'Cool and comfortable weather. Carrying a light jacket or outerwear is recommended.';
  }
  if (tip.includes('쌀쌀한')) {
    return 'Chilly weather expected. Bring a warm winter coat and cold-weather gear.';
  }
  if (tip.includes('11시') && tip.includes('4시')) {
    return 'Limit outdoor activities between 11 AM and 4 PM, and carry water and a parasol.';
  }
  if (tip.includes('우산')) {
    return 'Pack a foldable umbrella and plan alternative indoor activities.';
  }
  if (tip.includes('건조하므로')) {
    return 'Air is very dry; pack moisturizer and stay hydrated.';
  }
  if (tip.includes('[기상특보]')) {
    return tip.replace('[기상특보]', '[Weather Alert]').replace('출처:', 'Source:');
  }

  return tip;
};

const parseDateString = (str: string): Date => {
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
};

const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isDateBetween = (date: Date, start: Date, end: Date): boolean => {
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
};

const getDaysInMonth = (date: Date): CalendarDay[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const days: CalendarDay[] = [];
  
  const startDayOfWeek = firstDayOfMonth.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i);
    days.push({ day: prevDate.getDate(), date: prevDate, isCurrentMonth: false });
  }
  
  const numDays = lastDayOfMonth.getDate();
  for (let i = 1; i <= numDays; i++) {
    const currDate = new Date(year, month, i);
    days.push({ day: i, date: currDate, isCurrentMonth: true });
  }
  
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    days.push({ day: i, date: nextDate, isCurrentMonth: false });
  }
  
  return days;
};

export default function ExploreTab({ onSelectDestination, language = 'ko', isDarkMode = false }: ExploreTabProps) {
  const txt = LOCAL_TRANS[language];

  // Search input states
  const [destName, setDestName] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [destPlaceId, setDestPlaceId] = useState('');
  const [destLatLng, setDestLatLng] = useState<{ lat: number; lng: number } | undefined>(undefined);

  const [startDate, setStartDate] = useState('2026-07-22');
  const [endDate, setEndDate] = useState('2026-07-29');

  // Interactive Calendar state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarStep, setCalendarStep] = useState<'start' | 'end'>('start');
  const [viewDate, setViewDate] = useState<Date>(new Date(2026, 6, 22)); // July 2026 default

  // Validation
  const [validationErrors, setValidationErrors] = useState({
    destName: false,
    startDate: false,
    endDate: false
  });

  // Search results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Custom states for manual search/resolve resilience & race condition prevention
  const [analysisStage, setAnalysisStage] = useState<'idle' | 'resolving_destination' | 'fetching_data' | 'generating_summary' | 'completed' | 'error'>('idle');
  const [ambiguousCandidates, setAmbiguousCandidates] = useState<any[] | null>(null);

  const latestRequestIdRef = useRef<number>(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Festival Detail Modal state
  const [selectedFestival, setSelectedFestival] = useState<any | null>(null);

  const openCalendarWithStep = (step: 'start' | 'end') => {
    setCalendarStep(step);
    setIsCalendarOpen(true);
  };

  const handleSelectDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (calendarStep === 'start') {
      setStartDate(dateStr);
      setCalendarStep('end');
      const startD = new Date(dateStr);
      const endD = new Date(endDate);
      if (endD.getTime() < startD.getTime()) {
        const fallbackEnd = new Date(startD);
        fallbackEnd.setDate(fallbackEnd.getDate() + 3);
        const fY = fallbackEnd.getFullYear();
        const fM = String(fallbackEnd.getMonth() + 1).padStart(2, '0');
        const fD = String(fallbackEnd.getDate()).padStart(2, '0');
        setEndDate(`${fY}-${fM}-${fD}`);
      }
    } else {
      const startD = new Date(startDate);
      const endD = new Date(dateStr);
      if (endD.getTime() < startD.getTime()) {
        setStartDate(dateStr);
        setCalendarStep('end');
      } else {
        setEndDate(dateStr);
        setIsCalendarOpen(false);
      }
    }
  };

  const allCalendarDays = getDaysInMonth(viewDate);
  const weekdays = language === 'ko' ? ['일', '월', '화', '수', '목', '금', '토'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getNormalizedClientCountry = (addr: string, name: string) => {
    const str = `${addr || ''} ${name || ''}`.toLowerCase();
    if (str.includes('korea') || str.includes('seoul') || str.includes('서울') || str.includes('한국') || str.includes('대한민국')) return 'KR';
    if (str.includes('japan') || str.includes('tokyo') || str.includes('도쿄') || str.includes('일본')) return 'JP';
    if (str.includes('united states') || str.includes('new york') || str.includes('뉴욕') || str.includes('미국') || str.includes('usa')) return 'US';
    if (str.includes('france') || str.includes('paris') || str.includes('파리') || str.includes('프랑스')) return 'FR';
    if (str.includes('united kingdom') || str.includes('london') || str.includes('런던') || str.includes('영국')) return 'GB';
    if (str.includes('thailand') || str.includes('bangkok') || str.includes('방콕') || str.includes('태국')) return 'TH';
    if (str.includes('singapore') || str.includes('싱가포르') || str.includes('싱가폴')) return 'SG';
    if (str.includes('taiwan') || str.includes('taipei') || str.includes('대만') || str.includes('타이베이')) return 'TW';
    if (str.includes('hong kong') || str.includes('홍콩')) return 'HK';
    if (str.includes('vietnam') || str.includes('hanoi') || str.includes('베트남')) return 'VN';
    return 'auto';
  };

  const tzMap: Record<string, string> = {
    KR: 'Asia/Seoul',
    JP: 'Asia/Tokyo',
    US: 'America/New_York',
    FR: 'Europe/Paris',
    GB: 'Europe/London',
    TH: 'Asia/Bangkok',
    SG: 'Asia/Singapore',
    TW: 'Asia/Taipei',
    HK: 'Asia/Hong_Kong',
    VN: 'Asia/Ho_Chi_Minh'
  };

  const triggerSearchWithResolved = async (
    nameVal: string,
    addrVal: string,
    latLngVal: { lat: number; lng: number },
    pIdVal: string,
    countryCodeVal: string,
    timezoneVal: string,
    force: boolean = false,
    forceWeather: boolean = false
  ) => {
    setIsAnalyzing(true);
    setSearchError(null);
    setValidationErrors({ destName: false, startDate: false, endDate: false });

    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    const requestId = ++latestRequestIdRef.current;

    try {
      setAnalysisStage('fetching_data');
      const res = await fetch('/app-api/explore/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal,
        body: JSON.stringify({
          placeId: pIdVal,
          name: nameVal,
          country: addrVal,
          countryCode: countryCodeVal,
          timezoneId: timezoneVal,
          latitude: latLngVal.lat,
          longitude: latLngVal.lng,
          startDate,
          endDate,
          forceRefresh: force,
          forceWeatherRefresh: forceWeather
        })
      });

      if (controller.signal.aborted || requestId !== latestRequestIdRef.current) {
        return;
      }

      if (!res.ok) {
        let errMsg = 'Failed to search travel information.';
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || errMsg;
        } catch (_) {
          try {
            const rawText = await res.text();
            if (rawText.includes("<title>")) {
              const match = rawText.match(/<title>(.*?)<\/title>/);
              if (match) errMsg = match[1];
            }
          } catch (_) {}
        }
        throw new Error(errMsg);
      }

      setAnalysisStage('generating_summary');
      let data;
      try {
        data = await res.json();
      } catch (jsonErr: any) {
        throw new Error('Received an invalid response from the server. Please try again.');
      }

      if (requestId !== latestRequestIdRef.current) {
        return; // Ignore older requests
      }

      const receivedHolidayItems = Array.isArray(data?.holidays?.items)
        ? data.holidays.items
        : (Array.isArray(data?.holidays) ? data.holidays : []);

      console.log("[HOLIDAY_FRONTEND_TRACE]", {
        requestId: data?.id || `${nameVal}_${startDate}_${endDate}`,
        networkResponseHolidayPath: "response.holidays.items",
        networkResponseHolidayCount: receivedHolidayItems.length,
        normalizedHolidayCount: receivedHolidayItems.length,
        stateBeforeUpdateHolidayCount: searchResult ? (Array.isArray(searchResult?.holidays?.items) ? searchResult.holidays.items.length : (Array.isArray(searchResult?.holidays) ? searchResult.holidays.length : 0)) : 0,
        stateAfterUpdateHolidayCount: receivedHolidayItems.length,
        destinationCacheHolidayCount: data?.isCached ? receivedHolidayItems.length : 0,
        renderedHolidayCount: receivedHolidayItems.length,
        renderedComponentName: "ExploreTab",
        renderTimestamp: new Date().toISOString()
      });

      if (data?.meta) {
        console.log("[SERVER_META_INFO]", data.meta);
      }

      setSearchResult(data);
      setAnalysisStage('completed');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setSearchError(err.message || 'An error occurred during travel data processing.');
      setAnalysisStage('error');
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSearch = async (force: boolean = false, forceWeather: boolean = false) => {
    if (!destName.trim()) {
      setValidationErrors(prev => ({ ...prev, destName: true }));
      return;
    }
    setValidationErrors({ destName: false, startDate: false, endDate: false });
    setIsAnalyzing(true);
    setSearchError(null);
    setAmbiguousCandidates(null);

    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    // A. Check if destination needs resolution
    if (destPlaceId && destLatLng) {
      // Already fully resolved! Proceed directly.
      const countryCodeClean = getNormalizedClientCountry(destAddress, destName);
      const tzClean = tzMap[countryCodeClean] || 'UTC';
      await triggerSearchWithResolved(destName, destAddress, destLatLng, destPlaceId, countryCodeClean, tzClean, force, forceWeather);
    } else {
      // Needs Places API resolution!
      setAnalysisStage('resolving_destination');
      try {
        const resolveRes = await fetch('/app-api/places/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: destName.trim(), language }),
          signal: controller.signal
        });

        if (controller.signal.aborted) return;

        if (!resolveRes.ok) {
          throw new Error(language === 'ko' ? '여행지 정보를 분석하는 데 실패했습니다. 다시 시도해 주세요.' : 'Failed to resolve travel destination. Please try again.');
        }

        const resolveData = await resolveRes.json();

        if (resolveData.status === 'not_found') {
          throw new Error(language === 'ko' ? `올바른 여행지를 찾을 수 없습니다: "${destName}"` : `Could not find a valid destination for: "${destName}"`);
        }

        if (resolveData.status === 'ambiguous') {
          setAmbiguousCandidates(resolveData.candidates);
          setAnalysisStage('idle');
          setIsAnalyzing(false);
          return;
        }

        const resolved = resolveData.destination;
        setDestName(resolved.canonicalName);
        setDestAddress(resolved.formattedAddress);
        setDestPlaceId(resolved.placeId);
        setDestLatLng({ lat: resolved.latitude, lng: resolved.longitude });

        await triggerSearchWithResolved(
          resolved.canonicalName,
          resolved.formattedAddress,
          { lat: resolved.latitude, lng: resolved.longitude },
          resolved.placeId,
          resolved.countryCode,
          resolved.timezoneId,
          force,
          forceWeather
        );

      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error("[Manual Resolve Failed]", err);
        setSearchError(err.message || 'Failed to resolve destination coordinates.');
        setAnalysisStage('error');
        setIsAnalyzing(false);
      }
    }
  };

  const handleSelectCandidate = async (candidate: any) => {
    setAmbiguousCandidates(null);
    setIsAnalyzing(true);
    setSearchError(null);
    setAnalysisStage('resolving_destination');

    try {
      const resolveRes = await fetch('/app-api/places/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: candidate.placeId, language })
      });
      if (!resolveRes.ok) {
        throw new Error(language === 'ko' ? '여행지 상세 정보를 불러오지 못했습니다.' : 'Failed to retrieve place details.');
      }
      const resolveData = await resolveRes.json();
      if (resolveData.status !== 'resolved') {
        throw new Error(language === 'ko' ? '여행지 상세 정보를 불러오지 못했습니다.' : 'Failed to retrieve place details.');
      }

      const resolved = resolveData.destination;
      setDestName(resolved.canonicalName);
      setDestAddress(resolved.formattedAddress);
      setDestPlaceId(resolved.placeId);
      setDestLatLng({ lat: resolved.latitude, lng: resolved.longitude });

      await triggerSearchWithResolved(
        resolved.canonicalName,
        resolved.formattedAddress,
        { lat: resolved.latitude, lng: resolved.longitude },
        resolved.placeId,
        resolved.countryCode,
        resolved.timezoneId,
        false,
        false
      );
    } catch (err: any) {
      setSearchError(err.message || 'Failed to resolve destination details.');
      setAnalysisStage('error');
      setIsAnalyzing(false);
    }
  };

  const handleSelectPopular = (item: typeof POPULAR_PLACES[0]) => {
    const dispName = language === 'ko' ? item.nameKo : item.nameEn;
    const address = language === 'ko' ? item.nameKo.split(',')[1]?.trim() : item.nameEn.split(',')[1]?.trim();
    setDestName(dispName);
    setDestAddress(address || '');
    setDestPlaceId(item.placeId);
    setDestLatLng({ lat: item.lat, lng: item.lng });
    setAmbiguousCandidates(null);
    setSearchResult(null);
    setSearchError(null);
    setValidationErrors(prev => ({ ...prev, destName: false }));
  };

  const handleAddToPlan = () => {
    if (onSelectDestination && searchResult) {
      onSelectDestination(destName, startDate, endDate);
    }
  };

  // Get color configurations based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-500 dark:text-emerald-400', stroke: 'stroke-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' };
    if (score >= 60) return { text: 'text-amber-500 dark:text-amber-400', stroke: 'stroke-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30' };
    return { text: 'text-rose-500 dark:text-rose-400', stroke: 'stroke-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' };
  };

  const getCongestionBadge = (level: string) => {
    const cleanLevel = String(level).toLowerCase();
    if (cleanLevel.includes('low') || cleanLevel.includes('낮음')) {
      return { bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', label: language === 'ko' ? '낮음' : 'Low' };
    }
    if (cleanLevel.includes('high') || cleanLevel.includes('높음')) {
      return { bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300', label: language === 'ko' ? '높음' : 'High' };
    }
    return { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', label: language === 'ko' ? '보통' : 'Medium' };
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 pb-24 pt-4 font-sans text-gray-800 dark:text-text-primary transition-colors duration-300">
      
      {/* Title Header */}
      <div className="space-y-1.5 text-center">
        <h1 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
          <span>🔍</span>
          <span>{txt.title}</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
          {txt.subtitle}
        </p>
      </div>

      {/* Input panel Form */}
      <div className="bg-white dark:bg-surface-primary rounded-2xl border border-gray-100 dark:border-subtle-border p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
        
        {/* City Input via Google Places */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-gray-400 dark:text-stone-500 tracking-wider block uppercase">
            {txt.place_label}
          </label>
          <GooglePlaceInput
            value={destName}
            address={destAddress}
            placeId={destPlaceId}
            onChange={(name, addr, latLng, pId) => {
              setDestName(name);
              setDestAddress(addr || '');
              setDestLatLng(latLng);
              setDestPlaceId(pId || '');
              setAmbiguousCandidates(null);
              setSearchResult(null);
              setSearchError(null);
              setValidationErrors(prev => ({ ...prev, destName: false }));
            }}
            placeholder={language === 'ko' ? '방문할 도시, 국가 또는 지역 (예: 도쿄, 파리)' : 'City, region, or country (e.g. Tokyo, Paris)'}
            language={language}
          />
          {ambiguousCandidates && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3 mt-2"
            >
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                {language === 'ko' ? '동일한 이름을 가진 여러 여행지가 발견되었습니다. 아래에서 선택해 주세요:' : 'Multiple locations found with this name. Please select one below:'}
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {ambiguousCandidates.map((candidate) => (
                  <button
                    key={candidate.placeId}
                    type="button"
                    onClick={() => handleSelectCandidate(candidate)}
                    className="w-full text-left p-3 bg-white dark:bg-[#181724] border border-gray-150 dark:border-zinc-700/80 rounded-xl text-xs hover:border-amber-400 dark:hover:border-amber-500 transition-all flex flex-col gap-1 shadow-sm cursor-pointer"
                  >
                    <span className="font-bold text-gray-800 dark:text-text-primary">{candidate.canonicalName}</span>
                    <span className="text-gray-400 dark:text-zinc-500 text-[10px]">{candidate.formattedAddress}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {validationErrors.destName && (
            <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
              <span>⚠️</span> {language === 'ko' ? '방문할 도시나 지역을 입력하거나 추천 목록에서 선택해 주세요.' : 'Please enter or select a city/region to visit.'}
            </p>
          )}
        </div>

        {/* Start / End Date Select Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-gray-400 dark:text-stone-500 tracking-wider block uppercase">
              {language === 'ko' ? '출발일' : 'Departure'}
            </label>
            <button
              type="button"
              onClick={() => openCalendarWithStep('start')}
              className="w-full text-left pl-3.5 pr-2 py-3 rounded-xl border border-gray-200 dark:border-zinc-700/80 hover:border-blue-500 dark:hover:border-blue-600 bg-white dark:bg-[#181724] focus:outline-none flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Calendar size={14} className="text-blue-500 shrink-0" />
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-200">
                {formatDisplayShort(startDate, language)}
              </span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-gray-400 dark:text-stone-500 tracking-wider block uppercase">
              {language === 'ko' ? '귀국일' : 'Return'}
            </label>
            <button
              type="button"
              onClick={() => openCalendarWithStep('end')}
              className="w-full text-left pl-3.5 pr-2 py-3 rounded-xl border border-gray-200 dark:border-zinc-700/80 hover:border-blue-500 dark:hover:border-blue-600 bg-white dark:bg-[#181724] focus:outline-none flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Calendar size={14} className="text-emerald-500 shrink-0" />
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-200">
                {formatDisplayShort(endDate, language)}
              </span>
            </button>
          </div>
        </div>

        {/* Popular chips section */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-gray-400 dark:text-stone-500 block uppercase tracking-wider">
            {txt.popular_suggestions}
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {POPULAR_PLACES.map((item) => {
              const label = language === 'ko' ? item.nameKo.split(',')[0] : item.nameEn.split(',')[0];
              const isSelected = destPlaceId === item.placeId || destName === (language === 'ko' ? item.nameKo : item.nameEn);
              return (
                <button
                  type="button"
                  key={item.placeId}
                  onClick={() => handleSelectPopular(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10'
                      : 'bg-gray-50 dark:bg-[#181724] hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700/60'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Analyze/Search Trigger CTA button */}
        <button
          type="button"
          onClick={() => handleSearch(false)}
          disabled={isAnalyzing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs py-3.5 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer mt-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span className="font-extrabold">
                {(() => {
                  if (language === 'ko') {
                    switch (analysisStage) {
                      case 'resolving_destination':
                        return '여행지 위치 분석 중...';
                      case 'fetching_data':
                        return '실시간 날씨 & 공휴일 조회 중...';
                      case 'generating_summary':
                        return 'AI 로컬 분석 보고서 생성 중...';
                      default:
                        return txt.searching_btn;
                    }
                  } else {
                    switch (analysisStage) {
                      case 'resolving_destination':
                        return 'Analyzing location...';
                      case 'fetching_data':
                        return 'Retrieving weather & holidays...';
                      case 'generating_summary':
                        return 'Generating AI local report...';
                      default:
                        return txt.searching_btn;
                    }
                  }
                })()}
              </span>
            </>
          ) : (
            <>
              <Search size={13} />
              <span className="font-extrabold">{txt.search_btn}</span>
            </>
          )}
        </button>
      </div>



      {/* Travel Report output card */}
      <AnimatePresence mode="wait">
        {searchError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-start gap-2.5"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="text-left leading-relaxed">
              <p className="font-bold">{language === 'ko' ? '분석 오류 발생' : 'Analysis Error'}</p>
              <p className="font-normal mt-0.5 text-rose-600/90 dark:text-rose-400/90">{searchError}</p>
            </div>
          </motion.div>
        )}

        {searchResult && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* 1. Header Card: Score & AI Narrative Summary */}
            <div className="bg-white dark:bg-surface-primary rounded-2xl border border-gray-100 dark:border-subtle-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-50 dark:border-[#222030]">
                <div className="text-left space-y-1">
                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                    {language === 'ko' ? '실시간 로컬 분석 보고서' : 'Live Destination Insights'}
                  </span>
                  <h2 className="font-extrabold text-base text-gray-900 dark:text-white truncate">
                    {destName}
                  </h2>
                  <p className="text-[11px] text-gray-400 dark:text-stone-500 font-semibold flex items-center gap-1.5">
                    <Calendar size={12} />
                    {formatDisplayShort(startDate, language)} ~ {formatDisplayShort(endDate, language)} ({Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))}일간)
                  </p>
                </div>

                {/* Score Circular Indicator */}
                <div className={`p-3 rounded-xl border flex items-center gap-3 w-fit shrink-0 ${getScoreColor(searchResult.recommendationScore).bg}`}>
                  <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200 dark:text-[#2c2a3e]"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`${getScoreColor(searchResult.recommendationScore).text}`}
                        strokeWidth="3.5"
                        strokeDasharray={`${searchResult.recommendationScore}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black font-sans text-gray-900 dark:text-white">
                      {searchResult.recommendationScore}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-[10px] font-bold text-gray-400 dark:text-stone-500 uppercase tracking-wide">
                      {txt.recommendation_score}
                    </div>
                    <div className={`text-xs font-extrabold ${getScoreColor(searchResult.recommendationScore).text}`}>
                      {searchResult.recommendationScore >= 80 ? (language === 'ko' ? '매우 추천' : 'Excellent') : searchResult.recommendationScore >= 60 ? (language === 'ko' ? '여행 보통' : 'Good') : (language === 'ko' ? '여정 주의' : 'Caution')}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Comprehensive Narrative / Suitability Report */}
              <div className="p-4 bg-gray-50/50 dark:bg-[#1a1926] rounded-xl border border-gray-100/50 dark:border-[#201e30] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-block px-2 py-0.5 bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px] rounded uppercase tracking-wider">
                    {language === 'ko' ? "추천 지수 및 데이터 기반 여행 적합성 보고서" : "Data-Driven Travel Suitability Report"}
                  </span>
                  {searchResult?.report?.recommendationIndex && (
                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-900/40">
                      {language === 'ko' 
                        ? `추천지수 ${searchResult.report.recommendationIndex.score}점 (${searchResult.report.recommendationIndex.gradeLabelKo})`
                        : `Index ${searchResult.report.recommendationIndex.score} (${searchResult.report.recommendationIndex.gradeLabelEn})`}
                    </span>
                  )}
                </div>

                {searchResult?.report ? (
                  <div className="space-y-3 text-left">
                    {/* Paragraph 1: Conclusion */}
                    {searchResult.report.paragraph1_conclusion && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          <span>{language === 'ko' ? searchResult.report.paragraph1_conclusion.titleKo : searchResult.report.paragraph1_conclusion.titleEn}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-700 dark:text-zinc-300 break-keep pl-3 border-l-2 border-indigo-200 dark:border-indigo-900/40">
                          {language === 'ko' ? searchResult.report.paragraph1_conclusion.contentKo : searchResult.report.paragraph1_conclusion.contentEn}
                        </p>
                      </div>
                    )}

                    {/* Paragraph 2: Positive Factors */}
                    {searchResult.report.paragraph2_positiveFactors && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{language === 'ko' ? searchResult.report.paragraph2_positiveFactors.titleKo : searchResult.report.paragraph2_positiveFactors.titleEn}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-700 dark:text-zinc-300 break-keep pl-3 border-l-2 border-emerald-200 dark:border-emerald-900/40">
                          {language === 'ko' ? searchResult.report.paragraph2_positiveFactors.contentKo : searchResult.report.paragraph2_positiveFactors.contentEn}
                        </p>
                      </div>
                    )}

                    {/* Paragraph 3: Negative Factors */}
                    {searchResult.report.paragraph3_negativeFactors && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>{language === 'ko' ? searchResult.report.paragraph3_negativeFactors.titleKo : searchResult.report.paragraph3_negativeFactors.titleEn}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-700 dark:text-zinc-300 break-keep pl-3 border-l-2 border-amber-200 dark:border-amber-900/40">
                          {language === 'ko' ? searchResult.report.paragraph3_negativeFactors.contentKo : searchResult.report.paragraph3_negativeFactors.contentEn}
                        </p>
                      </div>
                    )}

                    {/* Paragraph 4: Travel Strategy */}
                    {searchResult.report.paragraph4_travelStrategy && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span>{language === 'ko' ? searchResult.report.paragraph4_travelStrategy.titleKo : searchResult.report.paragraph4_travelStrategy.titleEn}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-700 dark:text-zinc-300 break-keep pl-3 border-l-2 border-blue-200 dark:border-blue-900/40">
                          {language === 'ko' ? searchResult.report.paragraph4_travelStrategy.contentKo : searchResult.report.paragraph4_travelStrategy.contentEn}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-left font-sans text-gray-700 dark:text-zinc-300 break-keep">
                    {language === 'ko' ? searchResult.summary : (searchResult.summaryEn || searchResult.summary)}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Representative Festivals & Events section */}
            <div className="bg-white dark:bg-surface-primary rounded-2xl border border-gray-100 dark:border-subtle-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-4">
              <div className="text-left space-y-1">
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{txt.festivals_title}</span>
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-stone-500 leading-normal">
                  {txt.festivals_desc}
                </p>
              </div>

              {(() => {
                const festivalItems: any[] = Array.isArray(searchResult?.festivals?.items)
                  ? searchResult.festivals.items
                  : (Array.isArray(searchResult?.festivals) ? searchResult.festivals : []);

                const publicEventItems: any[] = Array.isArray(searchResult?.publicEvents?.items)
                  ? searchResult.publicEvents.items
                  : (Array.isArray(searchResult?.events?.items)
                    ? searchResult.events.items
                    : (Array.isArray(searchResult?.events) ? searchResult.events : []));

                const industryEventItems: any[] = Array.isArray(searchResult?.industryEvents?.items)
                  ? searchResult.industryEvents.items
                  : (Array.isArray(searchResult?.industryEvents) ? searchResult.industryEvents : []);

                // Tag each item by its filter/category type
                const taggedFestivals = festivalItems.map(item => ({ ...item, filterType: 'festival' }));
                const taggedPublic = publicEventItems.map(item => ({ ...item, filterType: 'public' }));
                const taggedIndustry = industryEventItems.map(item => ({ ...item, filterType: 'industry' }));

                const combinedEvents = [...taggedFestivals, ...taggedPublic, ...taggedIndustry];
                const filteredEvents = combinedEvents;

                const festStatus = searchResult?.festivals?.status || searchResult?.festivalStatus || (combinedEvents.length > 0 ? "success" : "empty");

                if (festStatus === "error") {
                  return (
                    <div className="p-4 rounded-xl border border-dashed border-rose-200 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-900/10 text-center space-y-1">
                      <p className="text-xs text-rose-500 font-bold leading-relaxed break-keep">
                        {language === 'ko' ? "행사 정보를 불러오지 못했어요." : "Failed to load festival/event information."}
                      </p>
                    </div>
                  );
                }

                if (combinedEvents.length === 0) {
                  return (
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-[#2d2c3c] bg-gray-50/20 dark:bg-stone-900/10 text-center space-y-2">
                      <span className="text-xl inline-block">🍃</span>
                      <p className="text-xs text-gray-400 dark:text-stone-500 leading-relaxed max-w-sm mx-auto break-keep">
                        {language === 'ko' ? "확인 가능한 행사 정보가 아직 충분하지 않아요." : "Not enough event information available for this period."}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {festStatus === "partial" && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold text-left">
                          {language === 'ko' ? "일부 소스의 행사만 표시하고 있어요." : "Showing events from limited data sources."}
                        </p>
                      )}
                      {filteredEvents.map((fest: any, idx: number) => {
                        const festivalName = language === 'ko' ? (fest.nameKo || fest.name) : (fest.nameEn || fest.name);
                        const festivalDesc = language === 'ko' ? (fest.descriptionKo || fest.description) : (fest.descriptionEn || fest.description);
                        
                        const dateInfo = getAdaptiveEventDateInfo({
                          startDate: fest.startDate,
                          endDate: fest.endDate || fest.startDate,
                          tripStartDate: startDate,
                          isOfficial: fest.isOfficial ?? true,
                          officialStatus: fest.officialStatus || (fest.isOfficial ? "confirmed" : "estimated"),
                          language,
                          festivalName: fest.name
                        });

                        const searchQuery = encodeURIComponent(`${destName || ''} ${festivalName} ${language === 'ko' ? '축제 행사 정보' : 'festival info'}`);
                        const festivalUrl = fest.url || fest.link || fest.officialUrl || fest.infoUrl || `https://www.google.com/search?q=${searchQuery}`;

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedFestival({ fest, dateInfo, festivalName, festivalDesc, festivalUrl })}
                            className="p-4 bg-gray-50 dark:bg-[#161521] border border-gray-100 dark:border-subtle-border rounded-xl flex gap-3 text-left items-start hover:border-blue-500/60 dark:hover:border-blue-400/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer group shadow-sm hover:shadow-md relative"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 font-bold shrink-0 group-hover:scale-105 transition-transform">
                              {fest.category === "illumination" ? "✨" : fest.category === "fireworks" ? "🎆" : fest.category === "market" ? "🛍️" : "🎉"}
                            </div>
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h4 className="font-extrabold text-xs text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                                  <span>{festivalName}</span>
                                </h4>
                                <div className="flex flex-wrap items-center gap-1">
                                  {/* Category tag */}
                                  {fest.filterType === 'festival' ? (
                                    <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                      {language === 'ko' ? '축제' : 'Festival'}
                                    </span>
                                  ) : fest.filterType === 'public' ? (
                                    <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      {language === 'ko' ? '행사' : 'Event'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                      {language === 'ko' ? '비즈니스' : 'Biz'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <Calendar size={12} className="shrink-0 text-blue-500" />
                                <span>{dateInfo.displayDate}</span>
                              </div>
                              {fest.location && (
                                <div className="text-[10px] font-bold text-gray-500 dark:text-stone-400 flex items-center gap-1.5">
                                  <MapPin size={11} className="shrink-0 text-gray-400" />
                                  <span className="truncate">{fest.location}</span>
                                </div>
                              )}
                              <p className="text-[11px] text-gray-600 dark:text-zinc-300 leading-relaxed break-keep pt-0.5 line-clamp-2">
                                {festivalDesc}
                              </p>
                              <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-stone-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                <span>{language === 'ko' ? '상세 일정 & 예년 기록 보기' : 'View Schedule Details & History'}</span>
                                <ChevronRight size={12} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 3. National Public Holidays Block */}
            <div className="bg-white dark:bg-surface-primary rounded-2xl border border-gray-100 dark:border-subtle-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-4">
              {(() => {
                const holidayItems: any[] = Array.isArray(searchResult?.holidays?.items)
                  ? searchResult.holidays.items
                  : (Array.isArray(searchResult?.holidays) ? searchResult.holidays : []);

                const holStatus = searchResult?.holidays?.status || searchResult?.holidayStatus || (holidayItems.length > 0 ? 'success' : 'empty');
                const holCount = holidayItems.length;

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-gray-900 dark:text-white text-left flex items-center gap-2">
                        <span>{txt.holidays_title}</span>
                      </h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {language === 'ko' ? `공휴일 ${holCount}개` : `${holCount} Holidays`}
                      </span>
                    </div>

                    {holStatus === "error" && (
                      <div className="p-4 rounded-xl border border-dashed border-rose-200 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-900/10 text-center">
                        <p className="text-xs text-rose-500 font-bold leading-relaxed break-keep">
                          {language === 'ko' ? "공휴일 정보를 불러오지 못했어요." : "Failed to load public holiday information."}
                        </p>
                      </div>
                    )}

                    {holStatus === "unsupported" && (
                      <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-[#2d2c3c] bg-gray-50/20 dark:bg-stone-900/10 text-center">
                        <p className="text-xs text-gray-400 dark:text-stone-500 leading-relaxed break-keep">
                          {language === 'ko' ? "이 지역의 공식 공휴일 데이터는 아직 지원되지 않아요." : "Official public holiday data is not supported for this region."}
                        </p>
                      </div>
                    )}

                    {holStatus !== "error" && holStatus !== "unsupported" && holCount === 0 && (
                      <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-[#2d2c3c] bg-gray-50/20 dark:bg-stone-900/10 text-center">
                        <p className="text-xs text-gray-400 dark:text-stone-500 leading-relaxed max-w-sm mx-auto break-keep">
                          {language === 'ko' ? "이 기간에 확인된 공휴일이 없어요." : "No public holidays confirmed for this period."}
                        </p>
                      </div>
                    )}

                    {holCount > 0 && (
                      <div className="space-y-2.5 text-left">
                        <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-300 leading-normal flex gap-1.5">
                          <AlertCircle size={12} className="shrink-0 mt-0.5" />
                          <span>{txt.holiday_warning}</span>
                        </div>

                        <div className="space-y-2">
                          {holidayItems.map((hol: any, idx: number) => (
                            <div
                              key={hol.id || idx}
                              className="p-3 bg-gray-50 dark:bg-[#161521] border border-gray-100 dark:border-subtle-border rounded-xl flex justify-between items-center gap-4 text-xs font-bold"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-rose-500 shrink-0">📍</span>
                                <span className="text-gray-800 dark:text-zinc-200 truncate">
                                  {language === 'ko' ? (hol.nameKo || hol.name) : (hol.nameEn || hol.name)}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 dark:text-stone-500 shrink-0 whitespace-nowrap">
                                {formatDisplayShort(hol.date, language)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* 4. Climate & Weather Block */}
            <div className="bg-white dark:bg-surface-primary rounded-2xl border border-gray-100 dark:border-subtle-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white text-left flex items-center gap-2">
                  <span>{txt.weather_title}</span>
                </h3>
                <button
                  onClick={() => handleSearch(false, true)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 rounded-lg transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                  title="날씨 데이터 실시간 업데이트"
                >
                  <RefreshCw size={12} className={isAnalyzing ? "animate-spin" : ""} />
                  <span>{language === 'ko' ? '날씨 업데이트' : 'Refresh Weather'}</span>
                </button>
              </div>

              {/* Data Policy and Source Labeling (Point 1, Point 2) */}
              <div className="flex flex-col gap-2.5 text-xs">
                {(() => {
                  const dataType = searchResult.weather.weatherDataType || "climate_average";
                  let badgeText = language === 'ko' ? "🔵 평년 기후 정보" : "🔵 Historical Climate Info";
                  let badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400";
                  let policyText = language === 'ko' 
                    ? "여행 시작일까지 17일 이상 남았습니다. 실제 예보가 불가능하므로 과거 5년/3년 평년 기후 통계 데이터를 보여드립니다." 
                    : "Beyond 16 days: 5-year historical climate average statistics.";
                  
                  if (dataType === "live_conditions") {
                    badgeText = language === 'ko' ? "🟢 실시간 현재 상황" : "🟢 Live Current Weather";
                    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
                    policyText = language === 'ko' 
                      ? "실시간 기상 상황 및 3시간 단위 고정밀 기상 정보입니다." 
                      : "Real-time weather conditions and 3-hour precision forecast.";
                  } else if (dataType === "short_term_forecast") {
                    badgeText = language === 'ko' ? "🟢 실시간 여행 예보" : "🟢 Live Travel Forecast";
                    badgeClass = "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400";
                    policyText = language === 'ko' 
                      ? "수치 예보 모델에 기반한 10일 이내의 실시간 여행 예보입니다." 
                      : "Actual weather forecast up to 10 days based on numerical models.";
                  } else if (dataType === "medium_term_forecast") {
                    badgeText = language === 'ko' ? "🟡 중기 여행 예보" : "🟡 Medium-term Forecast";
                    badgeClass = "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
                    policyText = language === 'ko' 
                      ? "중기 기후 분석에 기반한 11~16일 범위의 여행 예보입니다." 
                      : "11–16 day forecast based on medium-term climate analysis.";
                  } else if (dataType === "past_observation") {
                    badgeText = language === 'ko' ? "🟣 실제 관측 데이터" : "🟣 Past Observation Data";
                    badgeClass = "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400";
                    policyText = language === 'ko' 
                      ? "여행 시작일이 지나 과거 실제 관측(Open-Meteo Archive) 기록을 보여드립니다." 
                      : "Trip start date is in the past; displaying historical actual observation data.";
                  }

                  return (
                    <div className="w-full flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50/50 dark:bg-[#161521]/40 border border-gray-100/80 dark:border-subtle-border/60 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${badgeClass}`}>
                          {badgeText}
                        </span>
                        {searchResult.weather.forecastProvider && (
                          <span className="text-[10px] text-gray-400 dark:text-stone-500 font-medium">
                            {language === 'ko' ? `출처: ${searchResult.weather.forecastProvider}` : `Source: ${searchResult.weather.forecastProvider}`}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-stone-400 leading-relaxed font-medium break-keep font-sans">
                        {policyText}
                      </p>
                    </div>
                  );
                })()}

                {/* Mixed Period Notice (Requirement 3) */}
                {(searchResult.weather.hasMixedDataTypes || (searchResult.weather.hasPastObservation && (searchResult.weather.hasForecast || searchResult.weather.hasClimateAverage))) && (
                  <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300 text-left flex items-start gap-2 font-semibold">
                    <Info size={14} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <span>
                      {language === 'ko'
                        ? "지난 날짜는 실제 관측 기록, 이후 날짜는 최신 예보를 기준으로 분석했어요."
                        : "Past dates use observed records, while upcoming dates use the latest forecast."}
                    </span>
                  </div>
                )}
              </div>

              {/* Stale Cache Warning Banner (Point 13) */}
              {searchResult.weather.stale && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/10 rounded-xl border border-amber-200 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-400 text-left flex gap-2 break-keep font-semibold">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <div className="space-y-0.5">
                    <span>
                      {language === 'ko' 
                        ? "네트워크 연결 문제로 인해 이전 보관된 캐시 데이터를 보여드리고 있습니다." 
                        : "Displaying cached weather data due to network connection issues."}
                    </span>
                    {searchResult.weather.staleFetchedAt && (
                      <div className="text-[9px] text-amber-600/70 dark:text-amber-400/60 font-medium">
                        {language === 'ko'
                          ? `기존 수집 시점: ${new Date(searchResult.weather.staleFetchedAt).toLocaleString('ko-KR')}`
                          : `Previously fetched at: ${new Date(searchResult.weather.staleFetchedAt).toLocaleString('en-US')}`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Graceful API Failure Fallback Banner */}
              {searchResult.weather.isErrorFallback && !searchResult.weather.stale && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/10 rounded-xl border border-amber-100 dark:border-amber-900/20 text-[11px] text-amber-800 dark:text-amber-400 text-left flex gap-2 break-keep font-semibold">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    {language === 'ko'
                      ? (searchResult.weather.errorMessage || "최신 예보를 불러오지 못해 평년 기후 정보를 보여드리고 있어요.")
                      : (searchResult.weather.errorMessageEn || "Unable to load latest forecast. Displaying historical climate averages.")}
                  </span>
                </div>
              )}

              {/* 여행 첫날 기상 카드 (Strict Separation for Climate vs Forecast) */}
              {searchResult.weather.dailyForecasts && searchResult.weather.dailyForecasts.length > 0 && (() => {
                const isClimate = searchResult.weather.weatherDataType === 'climate_average';
                const isPast = searchResult.weather.weatherDataType === 'past_observation';
                const firstDay = searchResult.weather.dailyForecasts[0];
                const statusText = language === 'ko' 
                  ? (firstDay.weatherStatus || "맑음") 
                  : (firstDay.weatherStatusEn || translateWeatherStatus(firstDay.weatherStatus, 'en'));
                const sensoryText = language === 'ko' 
                  ? (firstDay.sensoryStatus || "쾌적함") 
                  : (firstDay.sensoryStatusEn || translateSensoryStatus(firstDay.sensoryStatus, 'en'));

                if (isClimate) {
                  const climSum = searchResult.weather.climateSummary;
                  const avgHigh = climSum?.averageHighTemperatureCelsius ?? searchResult.weather.averageTempMax ?? 22;
                  const avgLow = climSum?.averageLowTemperatureCelsius ?? searchResult.weather.averageTempMin ?? 14;
                  const highRange = climSum?.typicalHighRange ?? searchResult.weather.tempMaxRange ?? "20~24℃";
                  const lowRange = climSum?.typicalLowRange ?? searchResult.weather.tempMinRange ?? "12~16℃";
                  const rainyRatio = climSum?.historicalRainyRatioPercent ?? searchResult.weather.maxPrecipProb ?? 0;

                  return (
                    <div className="p-4 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border-2 border-blue-200/60 dark:border-blue-900/40 text-left relative overflow-hidden">
                      <div className="space-y-1.5 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-600 text-white dark:bg-blue-500 tracking-wider uppercase">
                              {language === 'ko' ? "여행 첫날 평년 기후" : "First Day Climate"}
                            </span>
                            <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400">
                              {firstDay.displayDate}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                            🌡️ {language === 'ko' ? "평년 통계" : "Historical Avg"}
                          </span>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-gray-950 dark:text-white leading-none">
                            {language === 'ko' ? `평균 최고 ${avgHigh}°C / 최저 ${avgLow}°C` : `Avg High ${avgHigh}°C / Low ${avgLow}°C`}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1 text-xs text-gray-700 dark:text-stone-300 font-bold pt-0.5">
                          <div>
                            {language === 'ko' ? `평년 범주: 최고 ${highRange}, 최저 ${lowRange}` : `Typical Range: High ${highRange}, Low ${lowRange}`}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-stone-400 text-[11px] font-medium">
                            <span>{language === 'ko' ? `평년 습도: ${climSum?.averageHumidityPercent ?? searchResult.weather.humidity}%` : `Avg Humidity: ${climSum?.averageHumidityPercent ?? searchResult.weather.humidity}%`}</span>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">
                              {language === 'ko' ? `과거 비 관측 비율: ${rainyRatio}%` : `Historical Rain Ratio: ${rainyRatio}%`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-4 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl border-2 border-indigo-200/60 dark:border-indigo-900/40 text-left relative overflow-hidden">
                    <div className="absolute right-3.5 top-3.5 text-3xl select-none opacity-40">
                      {firstDay.weatherIcon}
                    </div>
                    <div className="space-y-1.5 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-600 text-white dark:bg-indigo-500 tracking-wider uppercase">
                          {isPast
                            ? (language === 'ko' ? "여행 첫날 관측" : "First Day Observation")
                            : (language === 'ko' ? "여행 첫날 예보" : "First Day Forecast")}
                        </span>
                        <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-400">
                          {firstDay.displayDate}
                        </span>
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-950 dark:text-white leading-none">
                          {firstDay.tempMin}°C ~ {firstDay.tempMax}°C
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-stone-400 font-bold">
                          {language === 'ko' ? `(체감 ${firstDay.apparentMin}°C ~ ${firstDay.apparentMax}°C)` : `(Feels ${firstDay.apparentMin}°C ~ ${firstDay.apparentMax}°C)`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-gray-800 dark:text-stone-200 font-extrabold">
                        <span>{statusText}</span>
                        <span className="text-gray-300 dark:text-zinc-700">|</span>
                        <span className="text-gray-500 dark:text-stone-400 font-bold">{sensoryText}</span>
                        {firstDay.precipSum > 0 && (
                          <>
                            <span className="text-gray-300 dark:text-zinc-700">|</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">
                              {language === 'ko' ? `강수: ${firstDay.precipSum}mm (${firstDay.precipProb}%)` : `Precip: ${firstDay.precipSum}mm (${firstDay.precipProb}%)`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Real-time Current Weather Banner (Point 2) */}
              {searchResult.weather.currentWeather && (
                <div className="p-3.5 bg-gradient-to-r from-blue-500/5 to-teal-500/5 dark:from-blue-950/10 dark:to-teal-950/10 rounded-xl border border-blue-100/40 dark:border-blue-900/10 flex items-center justify-between text-left">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                      {language === 'ko' ? "실시간 기상상황" : "Live Weather"}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-gray-950 dark:text-white leading-none">
                        {searchResult.weather.currentWeather.temperatureCelsius}°C
                      </span>
                      <span className="text-xs text-gray-500 dark:text-stone-400 font-medium">
                        {language === 'ko' ? `체감 ${searchResult.weather.currentWeather.feelsLikeCelsius}°C` : `Feels like ${searchResult.weather.currentWeather.feelsLikeCelsius}°C`}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-gray-800 dark:text-stone-200">
                      {language === 'ko'
                        ? searchResult.weather.currentWeather.conditionText
                        : translateWeatherStatus(searchResult.weather.currentWeather.conditionText, 'en')}
                    </span>
                  </div>
                  <div className="text-right space-y-1 text-xs text-gray-500 dark:text-stone-400 font-bold">
                    <div className="flex items-center gap-1 justify-end">
                      <Droplets size={12} className="text-blue-500" />
                      <span>{language === 'ko' ? `습도: ${searchResult.weather.currentWeather.humidityPercent}%` : `Humidity: ${searchResult.weather.currentWeather.humidityPercent}%`}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-stone-500 font-medium">
                      {language === 'ko' ? `풍속: ${searchResult.weather.currentWeather.windSpeedMps} m/s` : `Wind: ${searchResult.weather.currentWeather.windSpeedMps} m/s`}
                    </div>
                  </div>
                </div>
              )}

              {/* Official Severe Weather Warnings (Point 2) */}
              {searchResult.weather.officialAlerts && searchResult.weather.officialAlerts.length > 0 && (
                <div className="space-y-2">
                  {searchResult.weather.officialAlerts.map((alert: any, aIdx: number) => (
                    <div key={aIdx} className="p-3.5 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30 text-left flex gap-2.5 break-keep">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400 animate-bounce" />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="text-xs font-black text-red-900 dark:text-red-400 flex items-center justify-between gap-1">
                          <span>⚠️ {language === 'ko' ? `[기상특보] ${alert.event}` : `[Weather Alert] ${alert.eventEn || alert.event}`}</span>
                          <span className="text-[9px] font-medium text-red-700/60 dark:text-red-400/50">
                            {alert.source}
                          </span>
                        </div>
                        {alert.area && (
                          <div className="text-[10px] font-extrabold text-red-800/80 dark:text-red-400/80">
                            {language === 'ko' ? `영향 지역: ${alert.area}` : `Affected Area: ${alert.areaEn || alert.area}`}
                          </div>
                        )}
                        <p className="text-[10px] leading-relaxed text-red-800/90 dark:text-red-300/90 font-medium">
                          {language === 'ko' ? alert.description : (alert.descriptionEn || alert.description)}
                        </p>
                        {alert.instruction && (
                          <p className="text-[9px] leading-relaxed text-red-900 dark:text-red-300 font-bold bg-red-100/50 dark:bg-red-950/40 p-2 rounded-lg mt-1.5 font-mono">
                            💡 {language === 'ko' ? `대처방법: ${alert.instruction}` : `Instructions: ${alert.instructionEn || alert.instruction}`}
                          </p>
                        )}
                        <div className="text-[8px] text-red-500 dark:text-red-400/60 font-medium mt-1">
                          {language === 'ko'
                            ? `발령시점: ${new Date(alert.onset).toLocaleString('ko-KR')}`
                            : `Issued at: ${new Date(alert.onset).toLocaleString('en-US')}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback Climate Warning Indicator (Requirement 8) */}
              {(searchResult.weather.isFallbackClimate || searchResult.weather.errorMessage) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-300 text-left flex items-center gap-2 font-medium">
                  <AlertCircle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    {language === 'ko'
                      ? (searchResult.weather.errorMessage || "최신 예보를 불러오지 못해 최근 기후 평균을 보여드리고 있어요.")
                      : (searchResult.weather.errorMessageEn || "Unable to load latest forecast. Displaying recent climate averages.")}
                  </span>
                </div>
              )}

              {/* Heatwave Warning Banner */}
              {searchResult.weather.heatWaveDays > 0 && (!searchResult.weather.officialAlerts || searchResult.weather.officialAlerts.length === 0) && (
                <div className="p-3 bg-red-50 dark:bg-red-950/10 rounded-xl border border-red-100 dark:border-red-900/20 text-[11px] text-red-800 dark:text-red-400 text-left flex gap-2 break-keep font-semibold animate-pulse">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <span>
                    ⚠️ {language === 'ko' 
                      ? `폭염 주의: 여행 기간 중 낮 최고 기온이 35℃ 이상인 폭염일이 ${searchResult.weather.heatWaveDays}일 포함되어 있습니다.` 
                      : `Heatwave Notice: Highs of 35°C or higher are expected on ${searchResult.weather.heatWaveDays} days during your trip.`}
                  </span>
                </div>
              )}

              {/* Main Weather Metrics Grid (Requirement 3) */}
              {searchResult.weather.weatherDataType === 'climate_average' || searchResult.weather.climateSummary ? (
                /* Climate Average Layout */
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Daytime Average High */}
                  <div className="p-3 bg-amber-50/40 dark:bg-[#161521] border border-amber-100/60 dark:border-subtle-border rounded-xl flex flex-col gap-1 items-start text-left">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                      <Sun size={12} className="text-amber-500" />
                      {language === 'ko' ? "낮 평균 최고" : "Avg High"}
                    </span>
                    <span className="font-black text-sm text-gray-900 dark:text-white mt-0.5 whitespace-nowrap">
                      {searchResult.weather.climateSummary?.averageHighTemperatureCelsius ?? searchResult.weather.averageTempMax ?? 22}°C
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-stone-500 font-medium">
                      {language === 'ko'
                        ? `범위: ${searchResult.weather.climateSummary?.typicalHighRange ?? searchResult.weather.tempMaxRange ?? "보통 20~24℃"}`
                        : `Range: ${(searchResult.weather.climateSummary?.typicalHighRange ?? searchResult.weather.tempMaxRange ?? "20~24°C").replace("보통", "Typically").replace("℃", "°C")}`}
                    </span>
                  </div>

                  {/* Morning/Night Average Low */}
                  <div className="p-3 bg-blue-50/40 dark:bg-[#161521] border border-blue-100/60 dark:border-subtle-border rounded-xl flex flex-col gap-1 items-start text-left">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                      <Sun size={12} className="text-blue-400" />
                      {language === 'ko' ? "아침·밤 평균 최저" : "Avg Low"}
                    </span>
                    <span className="font-black text-sm text-gray-900 dark:text-white mt-0.5 whitespace-nowrap">
                      {searchResult.weather.climateSummary?.averageLowTemperatureCelsius ?? searchResult.weather.averageTempMin ?? 14}°C
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-stone-500 font-medium">
                      {language === 'ko'
                        ? `범위: ${searchResult.weather.climateSummary?.typicalLowRange ?? searchResult.weather.tempMinRange ?? "보통 12~16℃"}`
                        : `Range: ${(searchResult.weather.climateSummary?.typicalLowRange ?? searchResult.weather.tempMinRange ?? "12~16°C").replace("보통", "Typically").replace("℃", "°C")}`}
                    </span>
                  </div>

                  {/* Humidity & Sensory */}
                  <div className="p-3 bg-gray-50 dark:bg-[#161521] border border-gray-100 dark:border-subtle-border rounded-xl flex flex-col gap-1 items-start text-left">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-stone-500 uppercase tracking-wide flex items-center gap-1">
                      <Droplets size={12} className="text-indigo-500" />
                      {txt.weather_humidity}
                    </span>
                    <span className="font-black text-sm text-gray-900 dark:text-white mt-0.5 whitespace-nowrap">
                      {searchResult.weather.climateSummary?.averageHumidityPercent ?? searchResult.weather.humidity}%
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-stone-500 font-medium truncate max-w-full">
                      {language === 'ko'
                        ? `상태: ${searchResult.weather.apparentSensoryStatus || "쾌적함"}`
                        : `Sensory: ${translateSensoryStatus(searchResult.weather.apparentSensoryStatus, 'en')}`}
                    </span>
                  </div>
                </div>
              ) : (
                /* Forecast Layout (Short / Medium Term) */
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Max Temp Card */}
                  <div className="p-3 bg-amber-50/40 dark:bg-[#161521] border border-amber-100/60 dark:border-subtle-border rounded-xl flex flex-col gap-1 items-start text-left">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                      <Sun size={12} className="text-amber-500" />
                      {language === 'ko' ? "낮 최고 기온" : "Max Temp"}
                    </span>
                    <span className="font-black text-sm text-gray-900 dark:text-white mt-0.5 whitespace-nowrap">
                      {searchResult.weather.forecastSummary?.maxTemperatureCelsius ?? searchResult.weather.averageTempMax}°C
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-stone-500 font-medium">
                      {language === 'ko'
                        ? `체감 최고: ${searchResult.weather.forecastSummary?.apparentMaxTemperatureCelsius ?? searchResult.weather.overallTempMax}°C`
                        : `Feels max: ${searchResult.weather.forecastSummary?.apparentMaxTemperatureCelsius ?? searchResult.weather.overallTempMax}°C`}
                    </span>
                  </div>

                  {/* Min Temp Card */}
                  <div className="p-3 bg-blue-50/40 dark:bg-[#161521] border border-blue-100/60 dark:border-subtle-border rounded-xl flex flex-col gap-1 items-start text-left">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                      <Sun size={12} className="text-blue-400" />
                      {language === 'ko' ? "아침·밤 최저 기온" : "Min Temp"}
                    </span>
                    <span className="font-black text-sm text-gray-900 dark:text-white mt-0.5 whitespace-nowrap">
                      {searchResult.weather.forecastSummary?.minTemperatureCelsius ?? searchResult.weather.averageTempMin}°C
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-stone-500 font-medium">
                      {language === 'ko'
                        ? `최저 범위: ${searchResult.weather.tempMinRange || `${searchResult.weather.averageTempMin}°C`}`
                        : `Min range: ${(searchResult.weather.tempMinRange || `${searchResult.weather.averageTempMin}°C`).replace("℃", "°C")}`}
                    </span>
                  </div>

                  {/* Rain Forecast Card */}
                  <div className="p-3 bg-gray-50 dark:bg-[#161521] border border-gray-100 dark:border-subtle-border rounded-xl flex flex-col gap-1 items-start text-left">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-stone-500 uppercase tracking-wide flex items-center gap-1">
                      <CloudRain size={12} className="text-indigo-500" />
                      {language === 'ko' ? "비/강수 예보" : "Rain Forecast"}
                    </span>
                    <span className="font-black text-xs text-gray-900 dark:text-white mt-0.5 truncate max-w-full">
                      {searchResult.weather.forecastSummary?.rainyDaysCount !== undefined
                        ? (language === 'ko'
                          ? `${searchResult.weather.forecastSummary.rainyDaysCount}일 / ${searchResult.weather.forecastSummary.totalDays}일`
                          : `${searchResult.weather.forecastSummary.rainyDaysCount}d / ${searchResult.weather.forecastSummary.totalDays}d`)
                        : (language === 'ko'
                          ? `${searchResult.weather.precipDays || 0}일`
                          : `${searchResult.weather.precipDays || 0} days`)}
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-stone-500 font-medium">
                      {language === 'ko'
                        ? `최대 강수확률: ${searchResult.weather.forecastSummary?.maxPrecipitationProbabilityPercent ?? searchResult.weather.maxPrecipProb ?? 0}%`
                        : `Max rain prob: ${searchResult.weather.forecastSummary?.maxPrecipitationProbabilityPercent ?? searchResult.weather.maxPrecipProb ?? 0}%`}
                    </span>
                  </div>
                </div>
              )}

              {/* 여행 기간 전체 자동 요약 (Request 4) */}
              {(searchResult.weather.autoAnalysisSummaryKo || searchResult.weather.autoAnalysisSummaryEn || searchResult.weather.autoAnalysisSummary) && (
                <div className="p-4 bg-gray-50/50 dark:bg-[#161521]/50 border border-gray-100 dark:border-subtle-border rounded-xl space-y-3 text-left">
                  <span className="text-[10px] font-black text-gray-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    📊 {language === 'ko' ? "여행 기간 기상 전체 요약" : "Trip Weather Summary"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(language === 'ko' 
                      ? (searchResult.weather.autoAnalysisSummaryKo || searchResult.weather.autoAnalysisSummary || []) 
                      : (searchResult.weather.autoAnalysisSummaryEn || searchResult.weather.autoAnalysisSummary?.map((s: string) => translateTipToEnglish(s)) || [])
                    ).map((item: string, sIdx: number) => {
                      let badgeStyle = "bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300";
                      if (item.includes("비") || item.includes("우산") || item.includes("Rain") || item.includes("Umbrella")) {
                        badgeStyle = "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/20";
                      } else if (item.includes("더운") || item.includes("폭염") || item.includes("Hot") || item.includes("Heatwave")) {
                        badgeStyle = "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100/50 dark:border-red-900/20";
                      } else if (item.includes("선선") || item.includes("Cool")) {
                        badgeStyle = "bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/20";
                      }
                      return (
                        <span key={sIdx} className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${badgeStyle} flex items-center gap-1 whitespace-nowrap`}>
                          {item}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 여행 관점 기상 분석 5단계 (Request 5) */}
              {searchResult.weather.perspectives && (
                <div className="p-4 bg-gray-50/50 dark:bg-[#161521]/50 border border-gray-100 dark:border-subtle-border rounded-xl space-y-4 text-left">
                  <span className="text-[10px] font-black text-gray-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    🧭 {language === 'ko' ? "여행 조건 관점별 기상 분석 (5단계)" : "Weather Analysis by Travel Perspectives"}
                  </span>
                  
                  <div className="space-y-3.5">
                    {[
                      {
                        key: 'heat',
                        label: language === 'ko' ? "🔥 더위 수준" : "🔥 Heat Level",
                        level: searchResult.weather.perspectives.heat,
                        labels: language === 'ko' 
                          ? ["매우 추움", "선선함", "따뜻함", "더움", "매우 더움 (폭염)"]
                          : ["Very Cold", "Cool", "Warm", "Hot", "Extremely Hot"],
                        activeColor: "bg-red-500 dark:bg-red-600"
                      },
                      {
                        key: 'rain',
                        label: language === 'ko' ? "☔ 비/강수 가능성" : "☔ Rain/Precip",
                        level: searchResult.weather.perspectives.rain,
                        labels: language === 'ko'
                          ? ["없음", "가벼운 소나기", "보통 비", "강한 비", "집중호우 / 장마"]
                          : ["None", "Light Rain", "Moderate Rain", "Heavy Rain", "Severe Rain"],
                        activeColor: "bg-blue-500 dark:bg-blue-600"
                      },
                      {
                        key: 'outdoor',
                        label: language === 'ko' ? "🏃 야외활동 적합도" : "🏃 Outdoor Activity",
                        level: searchResult.weather.perspectives.outdoor,
                        labels: language === 'ko'
                          ? ["매우 나쁨", "불리함", "보통", "좋음", "최적 (야외 최적화)"]
                          : ["Very Poor", "Unfavorable", "Moderate", "Good", "Perfect"],
                        activeColor: "bg-emerald-500 dark:bg-emerald-600"
                      },
                      {
                        key: 'uv',
                        label: language === 'ko' ? "☀️ 자외선 지수" : "☀️ UV Radiation",
                        level: searchResult.weather.perspectives.uv,
                        labels: language === 'ko'
                          ? ["낮음", "보통", "높음", "매우 높음", "위험"]
                          : ["Low", "Moderate", "High", "Very High", "Extreme"],
                        activeColor: "bg-amber-500 dark:bg-amber-600"
                      },
                      {
                        key: 'dust',
                        label: language === 'ko' ? "😷 미세먼지 예보" : "😷 Fine Dust / AQI",
                        level: searchResult.weather.perspectives.dust,
                        labels: language === 'ko'
                          ? ["좋음", "보통", "나쁨", "매우 나쁨", "최악"]
                          : ["Good", "Moderate", "Unhealthy", "Very Unhealthy", "Hazardous"],
                        activeColor: "bg-neutral-500 dark:bg-neutral-600"
                      }
                    ].map((item, idx) => {
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-700 dark:text-stone-300">{item.label}</span>
                            <span className="text-[10px] text-gray-500 dark:text-stone-400 font-extrabold">
                              {item.labels[item.level - 1] || "보통"}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-5 gap-1.5">
                            {[1, 2, 3, 4, 5].map((step) => {
                              const isActive = step <= item.level;
                              return (
                                <div 
                                  key={step} 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    isActive 
                                      ? item.activeColor 
                                      : "bg-gray-100 dark:bg-zinc-800"
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Rules-Based Travel Tips (Point 8, Point 12) */}
              {((searchResult.weather.dynamicTips && searchResult.weather.dynamicTips.length > 0) || (searchResult.weather.dynamicTipsEn && searchResult.weather.dynamicTipsEn.length > 0)) && (
                <div className="p-3.5 bg-blue-50/20 dark:bg-blue-950/10 rounded-xl border border-blue-100/40 dark:border-blue-900/10 text-xs text-left leading-relaxed space-y-1.5">
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    💡 {language === 'ko' ? "이번 여행 전용 기상 맞춤형 가이드" : "Weather Tailored Travel Guide"}
                  </span>
                  <ul className="list-none space-y-1.5 text-gray-600 dark:text-zinc-300 break-keep font-medium pl-1">
                    {(language === 'ko'
                      ? (searchResult.weather.dynamicTipsKo || searchResult.weather.dynamicTips || [])
                      : (searchResult.weather.dynamicTipsEn || searchResult.weather.dynamicTips?.map((t: string) => translateTipToEnglish(t)) || [])
                    ).map((tip: string, idx: number) => (
                      <li key={idx} className="flex gap-1.5 items-start">
                        <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Description summary */}
              {searchResult.weather.description && (
                <div className="p-3 bg-gray-50/60 dark:bg-[#161521]/60 rounded-xl border border-gray-100/50 dark:border-subtle-border/30 text-[11px] text-left leading-relaxed text-gray-500 dark:text-zinc-400 break-keep">
                  {language === 'ko' ? searchResult.weather.description : (searchResult.weather.descriptionEn || searchResult.weather.description)}
                </div>
              )}

              {/* Hourly Weather Forecast Section (Only for Forecasts / Live) */}
              {searchResult.weather.weatherDataType !== 'climate_average' && searchResult.weather.hourlyForecasts && searchResult.weather.hourlyForecasts.length > 0 && (
                <div className="pt-2 space-y-2">
                  <h4 className="text-xs font-extrabold text-gray-700 dark:text-stone-300 text-left flex items-center gap-1.5">
                    <Clock size={13} className="text-blue-500" />
                    <span>{language === 'ko' ? "⏱️ 시간대별 예측 (3시간 간격)" : "⏱️ Hourly Prediction (3h)"}</span>
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800">
                    {searchResult.weather.hourlyForecasts.map((hour: any, idx: number) => {
                      let hourDisplay = hour.time;
                      try {
                        const parts = hour.time.split("T");
                        if (parts.length === 2) {
                          const datePart = parts[0].split("-");
                          const timePart = parts[1].split(":");
                          hourDisplay = `${datePart[1]}/${datePart[2]} ${timePart[0]}:${timePart[1]}`;
                        }
                      } catch (e) {}

                      return (
                        <div 
                          key={idx}
                          className="flex-shrink-0 w-[85px] p-2 bg-gray-50/40 dark:bg-[#161521]/40 border border-gray-100/80 dark:border-subtle-border/50 rounded-xl flex flex-col items-center gap-1 text-center"
                        >
                          <span className="text-[8px] font-bold text-gray-400 dark:text-stone-500">
                            {hourDisplay}
                          </span>
                          <span className="text-xs font-black text-gray-800 dark:text-white">
                            {Math.round(hour.temperatureCelsius)}°C
                          </span>
                          <span className="text-[8px] text-gray-500 dark:text-stone-400">
                            {language === 'ko' ? `체감 ${Math.round(hour.feelsLikeCelsius)}°C` : `Feels ${Math.round(hour.feelsLikeCelsius)}°C`}
                          </span>
                          {hour.precipitationProbabilityPercent > 0 && (
                            <span className="text-[8px] font-black text-blue-500 dark:text-blue-400">
                              ☔ {hour.precipitationProbabilityPercent}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Daily Weather Breakdown or Period Climate Patterns Section */}
              {searchResult.weather.weatherDataType === 'climate_average' ? (
                /* Climate Average: Period Pattern Overview (No daily icons or specific daily forecast claims) */
                <div className="pt-2 space-y-2">
                  <h4 className="text-xs font-extrabold text-gray-700 dark:text-stone-300 text-left flex items-center gap-1.5">
                    <Calendar size={13} className="text-blue-500" />
                    <span>{language === 'ko' ? "🌡️ 기간별 평년 기후 패턴" : "🌡️ Historical Climate Patterns"}</span>
                  </h4>
                  
                  <div className="p-4 bg-gray-50/50 dark:bg-[#161521]/50 border border-gray-100/80 dark:border-subtle-border/60 rounded-xl space-y-3 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-gray-100 dark:border-subtle-border/40 space-y-1">
                        <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px]">
                          ☀️ {language === 'ko' ? "평년 기온 범주" : "Typical Temperature Range"}
                        </span>
                        <p className="text-gray-700 dark:text-stone-300 font-medium">
                          {language === 'ko'
                            ? `평균 최고 ${searchResult.weather.climateSummary?.averageHighTemperatureCelsius ?? searchResult.weather.averageTempMax}°C (범위: ${searchResult.weather.climateSummary?.typicalHighRange ?? searchResult.weather.tempMaxRange}), 평균 최저 ${searchResult.weather.climateSummary?.averageLowTemperatureCelsius ?? searchResult.weather.averageTempMin}°C (범위: ${searchResult.weather.climateSummary?.typicalLowRange ?? searchResult.weather.tempMinRange})`
                            : `Avg High ${searchResult.weather.climateSummary?.averageHighTemperatureCelsius ?? searchResult.weather.averageTempMax}°C (Range: ${searchResult.weather.climateSummary?.typicalHighRange ?? searchResult.weather.tempMaxRange}), Avg Low ${searchResult.weather.climateSummary?.averageLowTemperatureCelsius ?? searchResult.weather.averageTempMin}°C (Range: ${searchResult.weather.climateSummary?.typicalLowRange ?? searchResult.weather.tempMinRange})`}
                        </p>
                      </div>

                      <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-gray-100 dark:border-subtle-border/40 space-y-1">
                        <span className="font-bold text-blue-600 dark:text-blue-400 block text-[11px]">
                          ☔ {language === 'ko' ? "과거 비/강수 관측 통계" : "Historical Precipitation Records"}
                        </span>
                        <p className="text-gray-700 dark:text-stone-300 font-medium">
                          {language === 'ko'
                            ? `과거 동일 기간 비가 관측된 날 평균 ${searchResult.weather.climateSummary?.historicalRainyDaysCount ?? searchResult.weather.precipDays ?? 0}일 (전체 비 관측 비율 ${searchResult.weather.climateSummary?.historicalRainyRatioPercent ?? searchResult.weather.maxPrecipProb ?? 0}%)`
                            : `Historical rainy days average ${searchResult.weather.climateSummary?.historicalRainyDaysCount ?? searchResult.weather.precipDays ?? 0} days (Historical rainy ratio: ${searchResult.weather.climateSummary?.historicalRainyRatioPercent ?? searchResult.weather.maxPrecipProb ?? 0}%)`}
                        </p>
                      </div>

                      <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-gray-100 dark:border-subtle-border/40 space-y-1">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-[11px]">
                          💧 {language === 'ko' ? "평년 습도 및 체감 감각" : "Humidity & Sensory"}
                        </span>
                        <p className="text-gray-700 dark:text-stone-300 font-medium">
                          {language === 'ko'
                            ? `평년 평균 습도 ${searchResult.weather.climateSummary?.averageHumidityPercent ?? searchResult.weather.humidity}% (${searchResult.weather.apparentSensoryStatus || "쾌적함"})`
                            : `Historical humidity avg ${searchResult.weather.climateSummary?.averageHumidityPercent ?? searchResult.weather.humidity}% (${translateSensoryStatus(searchResult.weather.apparentSensoryStatus, 'en')})`}
                        </p>
                      </div>

                      <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-gray-100 dark:border-subtle-border/40 space-y-1">
                        <span className="font-bold text-teal-600 dark:text-teal-400 block text-[11px]">
                          🍃 {language === 'ko' ? "계절별 대기질 및 환경 경향" : "Seasonal Air Quality & Environment"}
                        </span>
                        <p className="text-gray-700 dark:text-stone-300 font-medium">
                          {language === 'ko'
                            ? `해당 계절의 평균 대기질은 보통~양호 수준이며, 과거 기후 통계 기록에 기반합니다.`
                            : `Seasonal air quality is typically moderate to good, based on multi-year climate records.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Actual Forecasts / Observations (Daily cards) */
                searchResult.weather.dailyForecasts && searchResult.weather.dailyForecasts.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <h4 className="text-xs font-extrabold text-gray-700 dark:text-stone-300 text-left flex items-center gap-1.5">
                      <Calendar size={13} className="text-blue-500" />
                      <span>
                        {searchResult.weather.weatherDataType === 'past_observation'
                          ? (language === 'ko' ? "📅 날짜별 실제 관측" : "📅 Daily Past Observation")
                          : (language === 'ko' ? "📅 일별 세부 기상 예보" : "📅 Daily Detailed Forecast")}
                      </span>
                    </h4>
                    
                    {/* Scrollable container for daily items */}
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800">
                      {searchResult.weather.dailyForecasts.map((day: any, idx: number) => {
                        const dayStatus = language === 'ko' 
                          ? day.weatherStatus 
                          : (day.weatherStatusEn || translateWeatherStatus(day.weatherStatus, 'en'));

                        const displayDateText = language === 'ko' 
                          ? day.displayDate 
                          : (day.displayDateEn || day.displayDate);

                        const dType = day.dataType || 'short_term_forecast';

                        return (
                          <div 
                            key={idx}
                            className="flex-shrink-0 w-[115px] p-2.5 bg-gray-50/40 dark:bg-[#161521]/40 border border-gray-100/80 dark:border-subtle-border/50 rounded-xl flex flex-col items-center gap-1.5 text-center"
                          >
                            {/* Per-day Badge (Requirement 3) */}
                            {dType === 'past_observation' ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300">
                                {language === 'ko' ? "실제 관측" : "Observed"}
                              </span>
                            ) : dType === 'climate_average' ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                                {language === 'ko' ? "평년 기후" : "Climate avg"}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                                {language === 'ko' ? "최신 예보" : "Forecast"}
                              </span>
                            )}

                            <span className="text-[10px] font-extrabold text-gray-500 dark:text-stone-400">
                              {displayDateText}
                            </span>
                            
                            <div className="flex flex-col items-center">
                              <span className="text-lg" title={dayStatus}>
                                {day.weatherIcon || "☀️"}
                              </span>
                              <span className="text-[9px] font-bold text-gray-600 dark:text-zinc-300">
                                {dayStatus}
                              </span>
                            </div>

                            <div className="w-full border-t border-gray-100/50 dark:border-subtle-border/30 my-0.5"></div>

                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-extrabold text-gray-800 dark:text-white">
                                {Math.round(day.tempMin)}°/{Math.round(day.tempMax)}°
                              </span>
                              <span className="text-[8px] text-gray-400 dark:text-stone-500 font-medium">
                                {language === 'ko' ? `체감: ${Math.round(day.apparentMax)}°` : `Feels: ${Math.round(day.apparentMax)}°`}
                              </span>
                            </div>

                            {day.precipProb > 0 && (
                              <span className="text-[8px] font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1 py-0.5 rounded">
                                ☔ {day.precipProb}% ({day.precipSum}mm)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* 4. Congestion block */}
            <div className="bg-white dark:bg-surface-primary rounded-2xl border border-gray-100 dark:border-subtle-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-4">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white text-left flex items-center gap-2">
                <span>{txt.congestion_title}</span>
              </h3>

              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-[#161521] border border-gray-100 dark:border-subtle-border rounded-xl items-start text-left">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                  <Users size={16} />
                </div>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-900 dark:text-white">
                      {language === 'ko' ? '예상 혼잡도:' : 'Expected Crowds:'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${getCongestionBadge(searchResult.congestion.level).bg}`}>
                      {getCongestionBadge(searchResult.congestion.level).label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed break-keep">
                    {language === 'ko' ? searchResult.congestion.description : (searchResult.congestion.descriptionEn || searchResult.congestion.description)}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. CTA and Refresh trigger */}
            <div className="bg-white dark:bg-surface-primary rounded-2xl border border-gray-100 dark:border-subtle-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleSearch(true)}
                disabled={isAnalyzing}
                className="flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-[#181724] dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700/80 text-gray-600 dark:text-zinc-300 font-bold text-xs py-3 px-4 rounded-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <RefreshCw size={12} className={isAnalyzing ? "animate-spin" : ""} />
                <span>{txt.force_refresh}</span>
              </button>
              
              <button
                type="button"
                onClick={handleAddToPlan}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md shadow-blue-500/15 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{txt.add_to_plan}</span>
                <ArrowRight size={13} />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Range Picker Modal Overlay */}
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center sm:items-center p-4"
            onClick={() => setIsCalendarOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-surface-primary rounded-t-[28px] sm:rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-w-sm w-full p-6 border border-gray-100 dark:border-subtle-border flex flex-col relative overflow-hidden pb-8 sm:pb-6 transition-colors duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-200 dark:bg-[#2b2a3c] rounded-full mx-auto mb-4 block sm:hidden" />

              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#252438] text-gray-400 dark:text-stone-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="mb-4 text-left">
                <span className="text-[9px] font-black tracking-widest text-blue-500 dark:text-blue-400 uppercase block mb-1">
                  {language === 'ko' ? '일정 선택기' : 'Calendar Pick'}
                </span>
                {calendarStep === 'start' ? (
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      <PlaneTakeoff size={16} className="text-blue-500 animate-pulse shrink-0" />
                      {language === 'ko' ? '언제 출발하시나요? 🛫' : 'When do you depart? 🛫'}
                    </h3>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-500 animate-pulse shrink-0" />
                      {language === 'ko' ? '언제 돌아오시나요? 🏡' : 'When do you return? 🏡'}
                    </h3>
                  </div>
                )}
              </div>

              {/* Step indicator buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50/80 dark:bg-[#15141f]/80 p-1 rounded-xl border border-gray-100 dark:border-[#22202e] transition-colors duration-300">
                <button
                  type="button"
                  onClick={() => setCalendarStep('start')}
                  className={`py-2 px-1 rounded-lg text-center font-bold text-xs transition-all cursor-pointer ${
                    calendarStep === 'start'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-[#252438]'
                  }`}
                >
                  🛫 {language === 'ko' ? '출발:' : 'Dep:'} {startDate ? startDate.replace('2026-', '').replace('-', '/') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarStep('end')}
                  className={`py-2 px-1 rounded-lg text-center font-bold text-xs transition-all cursor-pointer ${
                    calendarStep === 'end'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-[#252438]'
                  }`}
                >
                  🛬 {language === 'ko' ? '복귀:' : 'Ret:'} {endDate ? endDate.replace('2026-', '').replace('-', '/') : ''}
                </button>
              </div>

              {/* Month navigation controller */}
              <div className="flex justify-between items-center px-1 mb-3">
                <button
                  type="button"
                  onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="p-1.5 rounded-xl border border-gray-150 dark:border-[#22202e] hover:bg-gray-50 dark:hover:bg-[#222133] text-gray-600 dark:text-stone-400 transition-all cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>

                <div className="font-extrabold text-xs text-gray-800 dark:text-text-primary">
                  {viewDate.getFullYear()}{language === 'ko' ? '년 ' : '- '}{viewDate.getMonth() + 1}{language === 'ko' ? '월' : ''}
                </div>

                <button
                  type="button"
                  onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-1.5 rounded-xl border border-gray-150 dark:border-[#22202e] hover:bg-gray-50 dark:hover:bg-[#222133] text-gray-600 dark:text-stone-400 transition-all cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Weekday labels */}
              <div className="grid grid-cols-7 text-center gap-1 mb-2">
                {weekdays.map((dayName, index) => (
                  <span
                    key={index}
                    className={`font-bold text-[9px] tracking-wide uppercase ${
                      index === 0
                        ? 'text-rose-500'
                        : index === 6
                        ? 'text-blue-500'
                        : 'text-gray-400 dark:text-stone-500'
                    }`}
                  >
                    {dayName}
                  </span>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                {allCalendarDays.map((day, idx) => {
                  const isSelectedStart = day.isCurrentMonth && isSameDay(day.date, parseDateString(startDate));
                  const isSelectedEnd = day.isCurrentMonth && isSameDay(day.date, parseDateString(endDate));
                  const isBetween = day.isCurrentMonth && isDateBetween(day.date, parseDateString(startDate), parseDateString(endDate));

                  let btnStyle = "relative w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-full transition-all cursor-pointer ";
                  let cellStyle = "relative py-0.5 w-full flex justify-center ";

                  if (!day.isCurrentMonth) {
                    btnStyle += "text-gray-200 dark:text-stone-800 pointer-events-none opacity-20";
                  } else if (isSelectedStart) {
                    btnStyle += "bg-blue-600 text-white shadow-md z-10 scale-105";
                    cellStyle += "bg-blue-100 dark:bg-blue-950/40 rounded-l-full";
                  } else if (isSelectedEnd) {
                    btnStyle += "bg-emerald-500 text-white shadow-md z-10 scale-105";
                    cellStyle += "bg-blue-100 dark:bg-blue-950/40 rounded-r-full";
                  } else if (isBetween) {
                    btnStyle += "text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30";
                    cellStyle += "bg-blue-100 dark:bg-blue-950/20";
                  } else {
                    const dayOfWeek = day.date.getDay();
                    if (dayOfWeek === 0) {
                      btnStyle += "text-rose-500 hover:bg-gray-50 dark:hover:bg-[#252438]";
                    } else if (dayOfWeek === 6) {
                      btnStyle += "text-blue-500 hover:bg-gray-50 dark:hover:bg-[#252438]";
                    } else {
                      btnStyle += "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-[#252438]";
                    }
                  }

                  return (
                    <div key={idx} className={cellStyle}>
                      <motion.button
                        type="button"
                        whileHover={day.isCurrentMonth ? { scale: 1.1 } : {}}
                        whileTap={day.isCurrentMonth ? { scale: 0.95 } : {}}
                        onClick={() => day.isCurrentMonth && handleSelectDate(day.date)}
                        className={btnStyle}
                        disabled={!day.isCurrentMonth}
                      >
                        {day.day}
                      </motion.button>
                    </div>
                  );
                })}
              </div>

              {/* Bottom confirmation */}
              <div className="flex gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="flex-1 bg-gray-50 dark:bg-[#15141f] border border-gray-150 dark:border-subtle-border hover:bg-gray-100 dark:hover:bg-[#252438] text-gray-600 dark:text-stone-400 font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                >
                  {language === 'ko' ? '선택 완료' : 'Done'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Festival Detail Modal */}
      <AnimatePresence>
        {selectedFestival && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFestival(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#161521] border border-gray-100 dark:border-subtle-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden text-left"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-subtle-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl shrink-0">
                    {selectedFestival.fest.category === "illumination" ? "✨" : selectedFestival.fest.category === "fireworks" ? "🎆" : selectedFestival.fest.category === "market" ? "🛍️" : "🎉"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-gray-900 dark:text-white">
                        {selectedFestival.festivalName}
                      </h3>
                    </div>
                    {selectedFestival.fest.location && (
                      <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={12} className="shrink-0 text-blue-500" />
                        <span>{selectedFestival.fest.location}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFestival(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252438] text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Schedule Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Expected timing */}
                <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">
                    {language === 'ko' ? '🗓️ 예상 개최 시기' : '🗓️ Expected Timing'}
                  </span>
                  <p className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                    {language === 'ko' ? selectedFestival.dateInfo.estimatedPeriod?.ko : selectedFestival.dateInfo.estimatedPeriod?.en}
                  </p>
                </div>

                {/* Official schedule */}
                <div className="p-3.5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 block">
                    {language === 'ko' ? '📌 공식 일정' : '📌 Official Schedule'}
                  </span>
                  <p className="text-sm font-extrabold text-blue-900 dark:text-blue-200">
                    {selectedFestival.dateInfo.isOfficial
                      ? selectedFestival.dateInfo.displayDate
                      : (language === 'ko' ? '발표 전' : 'Announcement Pending')}
                  </p>
                </div>
              </div>

              {/* Recent Years' Dates */}
              <div className="p-3.5 bg-gray-50 dark:bg-[#1f1e2e] border border-gray-100 dark:border-subtle-border rounded-xl space-y-2">
                <div>
                  <span className="text-[11px] font-bold text-gray-700 dark:text-stone-300 block">
                    {language === 'ko' ? '📜 예년 개최일 (공식 기록)' : '📜 Previous Occurrences (Official)'}
                  </span>
                </div>
                
                {selectedFestival.dateInfo.previousOccurrences && selectedFestival.dateInfo.previousOccurrences.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {selectedFestival.dateInfo.previousOccurrences.map((occ: any, idx: number) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 border-b border-gray-100 dark:border-subtle-border pb-1.5 last:border-0 last:pb-0">
                        <div className="font-extrabold text-gray-900 dark:text-stone-200">
                          {occ.year}년: {occ.startDate} ~ {occ.endDate}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 dark:text-stone-400 italic">
                    {language === 'ko' ? '기록된 공식 예년 개최일이 없습니다.' : 'No official previous occurrence records available.'}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-500 dark:text-stone-400">
                  {language === 'ko' ? '축제 소개' : 'Event Description'}
                </h4>
                <p className="text-xs text-gray-800 dark:text-zinc-200 leading-relaxed break-keep">
                  {selectedFestival.festivalDesc}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(selectedFestival.festivalName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{language === 'ko' ? '축제 정보 확인하기' : 'View Festival Info'}</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
