import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  MapPin,
  PartyPopper,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RECOMMENDED_DESTINATIONS } from '../data/mockData';
import { Destination } from '../types';
import { Language } from '../utils/translations';
import { AIRPORTS, Airport, filterAirports } from '../data/airports';

interface ExploreTabProps {
  onSelectDestination?: (destName: string, startDate?: string, endDate?: string) => void;
  language?: Language;
  isDarkMode?: boolean;
}

interface AnalyzedFlight {
  airline: string;
  price: number;
}

interface PriceAnalysis {
  flights: AnalyzedFlight[];
  average: number;
}

interface TravelReport {
  departure: string;
  destination: string;
  startDate: string;
  endDate: string;
  temp: string;
  tempEn?: string;
  humidity: string;
  rainySeason: string;
  rainySeasonEn?: string;
  festivals: string[];
  festivalsEn?: string[];
  tourists: string;
  touristsEn?: string;
  level: '추천' | '보통' | '추천 안함';
  description: string;
  descriptionEn?: string;
  flightPrice?: string;
  flightPriceEn?: string;
  flightSource?: string;
  flightSourceEn?: string;
  priceAnalysis?: PriceAnalysis;
  tempLevel: '추천' | '보통' | '나쁨';
  humidityLevel: '추천' | '보통' | '나쁨';
  rainyLevel: '추천' | '보통' | '나쁨';
  touristLevel: '추천' | '보통' | '나쁨';
  priceLevel: '추천' | '보통' | '나쁨';
}

const getAirportCode = (airportStr: string, defaultValue: string): string => {
  if (!airportStr) return defaultValue;
  
  // 1. Match standard 3-letter IATA code first
  const match = airportStr.match(/\b([A-Z]{3})\b/);
  if (match) {
    return match[1].toUpperCase();
  }

  const cleanStr = airportStr.trim().toLowerCase();

  // 2. Perform a comprehensive match against our rich AIRPORTS list
  const found = AIRPORTS.find(ap => {
    const code = ap.code.toLowerCase();
    const nameKo = ap.nameKo.toLowerCase();
    const nameEn = ap.nameEn.toLowerCase();
    const cityKo = ap.cityKo.toLowerCase();
    const cityEn = ap.cityEn.toLowerCase();
    const countryKo = ap.countryKo.toLowerCase();
    const countryEn = ap.countryEn.toLowerCase();

    return (
      cleanStr === code ||
      cleanStr.includes(code) ||
      cleanStr.includes(nameKo) ||
      cleanStr.includes(nameEn) ||
      cleanStr.includes(cityKo) ||
      cleanStr.includes(cityEn) ||
      nameKo.includes(cleanStr) ||
      nameEn.includes(cleanStr) ||
      cityKo.includes(cleanStr) ||
      cityEn.includes(cleanStr) ||
      (cleanStr.length > 1 && (cleanStr.includes(countryKo) || cleanStr.includes(countryEn)))
    );
  });

  if (found) {
    return found.code;
  }

  // 3. Robust manual keyword fallbacks
  const upperStr = airportStr.toUpperCase();
  if (upperStr.includes('ICN') || upperStr.includes('인천')) return 'ICN';
  if (upperStr.includes('GMP') || upperStr.includes('김포')) return 'GMP';
  if (upperStr.includes('PUS') || upperStr.includes('김해')) return 'PUS';
  if (upperStr.includes('CJU') || upperStr.includes('제주')) return 'CJU';
  if (upperStr.includes('CDG') || upperStr.includes('샤를') || upperStr.includes('파리') || upperStr.includes('PARIS')) return 'CDG';
  if (upperStr.includes('ORY') || upperStr.includes('오를리')) return 'ORY';
  if (upperStr.includes('NCE') || upperStr.includes('니스')) return 'NCE';
  if (upperStr.includes('FRA') || upperStr.includes('프랑크') || upperStr.includes('독일') || upperStr.includes('FRANKFURT')) return 'FRA';
  if (upperStr.includes('NRT') || upperStr.includes('나리타') || upperStr.includes('도쿄') || upperStr.includes('TOKYO')) return 'NRT';
  if (upperStr.includes('HND') || upperStr.includes('하네다')) return 'HND';
  if (upperStr.includes('KIX') || upperStr.includes('간사이') || upperStr.includes('오사카') || upperStr.includes('OSAKA')) return 'KIX';
  if (upperStr.includes('FUK') || upperStr.includes('후쿠오카')) return 'FUK';
  if (upperStr.includes('CTS') || upperStr.includes('삿포로')) return 'CTS';
  if (upperStr.includes('CEB') || upperStr.includes('세부') || upperStr.includes('CEBU')) return 'CEB';
  if (upperStr.includes('DAD') || upperStr.includes('다낭') || upperStr.includes('DA NANG')) return 'DAD';
  if (upperStr.includes('BKK') || upperStr.includes('방콕') || upperStr.includes('BANGKOK')) return 'BKK';
  if (upperStr.includes('FCO') || upperStr.includes('로마') || upperStr.includes('ROME')) return 'FCO';
  if (upperStr.includes('LHR') || upperStr.includes('히드로') || upperStr.includes('런던') || upperStr.includes('LONDON')) return 'LHR';
  if (upperStr.includes('JFK') || upperStr.includes('뉴욕') || upperStr.includes('NEW YORK')) return 'JFK';
  if (upperStr.includes('SIN') || upperStr.includes('싱가포르') || upperStr.includes('SINGAPORE')) return 'SIN';
  if (upperStr.includes('DPS') || upperStr.includes('발리') || upperStr.includes('BALI')) return 'DPS';
  if (upperStr.includes('MPH') || upperStr.includes('보라카이') || upperStr.includes('BORACAY')) return 'MPH';

  return defaultValue;
};

const isValidAirport = (input: string): boolean => {
  const cleanInput = input.trim().toLowerCase();
  if (!cleanInput) return false;

  // 1. If it has a 3-letter sequence (e.g. ICN, NRT) inside parentheses or standalone
  const match = cleanInput.match(/\b([a-z]{3})\b/i);
  if (match) {
    const code = match[1].toUpperCase();
    if (AIRPORTS.some(ap => ap.code === code)) {
      return true;
    }
  }

  // 2. Otherwise, check if any of the airport's text fields match or are included
  return AIRPORTS.some(ap => {
    const code = ap.code.toLowerCase();
    const nameKo = ap.nameKo.toLowerCase();
    const nameEn = ap.nameEn.toLowerCase();
    const cityKo = ap.cityKo.toLowerCase();
    const cityEn = ap.cityEn.toLowerCase();

    return (
      cleanInput === code ||
      cleanInput === nameKo ||
      cleanInput === nameEn ||
      cleanInput === cityKo ||
      cleanInput === cityEn ||
      cleanInput.includes(code) ||
      cleanInput.includes(nameKo) ||
      cleanInput.includes(nameEn) ||
      cleanInput.includes(cityKo) ||
      cleanInput.includes(cityEn) ||
      nameKo.includes(cleanInput) ||
      nameEn.includes(cleanInput) ||
      cityKo.includes(cleanInput) ||
      cityEn.includes(cleanInput)
    );
  });
};

const getHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const analyzeFlightPrices = (dep: string, dest: string): PriceAnalysis => {
  const depClean = dep.trim().toLowerCase();
  const destClean = dest.trim().toLowerCase();
  const combined = `${depClean}_to_${destClean}`;
  const seed = getHash(combined);

  // 1. Long-haul (Europe, North America, Oceania)
  const isEurope = 
    destClean.includes('파리') || destClean.includes('paris') || destClean.includes('france') || destClean.includes('프랑스') || destClean.includes('cdg') || destClean.includes('ory') || destClean.includes('nce') ||
    destClean.includes('런던') || destClean.includes('london') || destClean.includes('lhr') || destClean.includes('lgw') || destClean.includes('영국') || destClean.includes('uk') ||
    destClean.includes('프랑크') || destClean.includes('frankfurt') || destClean.includes('fra') || destClean.includes('독일') || destClean.includes('germany') || destClean.includes('뮌헨') || destClean.includes('munich') || destClean.includes('muc') ||
    destClean.includes('로마') || destClean.includes('rome') || destClean.includes('fco') || destClean.includes('밀라노') || destClean.includes('milan') || destClean.includes('mxp') || destClean.includes('베네치아') || destClean.includes('venice') || destClean.includes('vce') || destClean.includes('이탈리아') || destClean.includes('italy') ||
    destClean.includes('마드리드') || destClean.includes('madrid') || destClean.includes('mad') || destClean.includes('바르셀로나') || destClean.includes('barcelona') || destClean.includes('bcn') || destClean.includes('스페인') || destClean.includes('spain') ||
    destClean.includes('빈') || destClean.includes('vienna') || destClean.includes('vie') || destClean.includes('오스트리아') || destClean.includes('austria') ||
    destClean.includes('취리히') || destClean.includes('zurich') || destClean.includes('zrh') || destClean.includes('제네바') || destClean.includes('geneva') || destClean.includes('gva') || destClean.includes('스위스') || destClean.includes('switzerland') ||
    destClean.includes('이스탄불') || destClean.includes('istanbul') || destClean.includes('ist') || destClean.includes('튀르키예') || destClean.includes('turkey');

  const isNorthAmerica = 
    destClean.includes('로스앤젤레스') || destClean.includes('los angeles') || destClean.includes('lax') ||
    destClean.includes('뉴욕') || destClean.includes('new york') || destClean.includes('jfk') ||
    destClean.includes('샌프란시스코') || destClean.includes('san francisco') || destClean.includes('sfo') ||
    destClean.includes('시카고') || destClean.includes('chicago') || destClean.includes('ord') ||
    destClean.includes('미국') || destClean.includes('united states') || destClean.includes('usa') ||
    destClean.includes('밴쿠버') || destClean.includes('vancouver') || destClean.includes('yvr') ||
    destClean.includes('토론토') || destClean.includes('toronto') || destClean.includes('yyz') ||
    destClean.includes('캐나다') || destClean.includes('canada');

  const isOceania = 
    destClean.includes('시드니') || destClean.includes('sydney') || destClean.includes('syd') ||
    destClean.includes('멜버른') || destClean.includes('melbourne') || destClean.includes('mel') ||
    destClean.includes('호주') || destClean.includes('australia');

  // 2. Medium-haul (Southeast Asia, Hawaii, Guam, Saipan)
  const isMediumHaul =
    destClean.includes('보라카이') || destClean.includes('boracay') || destClean.includes('mph') || destClean.includes('klo') || destClean.includes('필리핀') || destClean.includes('philippines') || destClean.includes('마닐라') || destClean.includes('manila') || destClean.includes('mnl') || destClean.includes('세부') || destClean.includes('cebu') || destClean.includes('ceb') ||
    destClean.includes('방콕') || destClean.includes('bangkok') || destClean.includes('bkk') || destClean.includes('dmk') || destClean.includes('푸켓') || destClean.includes('phuket') || destClean.includes('hkt') || destClean.includes('치앙마이') || destClean.includes('chiang mai') || destClean.includes('cnx') || destClean.includes('태국') || destClean.includes('thailand') ||
    destClean.includes('하노이') || destClean.includes('hanoi') || destClean.includes('han') || destClean.includes('호치민') || destClean.includes('ho chi minh') || destClean.includes('sgn') || destClean.includes('다낭') || destClean.includes('da nang') || destClean.includes('dad') || destClean.includes('나트랑') || destClean.includes('nha trang') || destClean.includes('cxr') || destClean.includes('푸꾸옥') || destClean.includes('phu quoc') || destClean.includes('pqc') || destClean.includes('베트남') || destClean.includes('vietnam') ||
    destClean.includes('싱가포르') || destClean.includes('singapore') || destClean.includes('sin') ||
    destClean.includes('발리') || destClean.includes('bali') || destClean.includes('dps') || destClean.includes('자카르타') || destClean.includes('jakarta') || destClean.includes('cgk') || destClean.includes('인도네시아') || destClean.includes('indonesia') ||
    destClean.includes('쿠알라룸푸르') || destClean.includes('kuala lumpur') || destClean.includes('kul') || destClean.includes('코타키나발루') || destClean.includes('kota kinabalu') || destClean.includes('bki') || destClean.includes('말레이시아') || destClean.includes('malaysia') ||
    destClean.includes('괌') || destClean.includes('guam') || destClean.includes('gum') ||
    destClean.includes('사이판') || destClean.includes('saipan') || destClean.includes('spn') ||
    destClean.includes('호놀룰루') || destClean.includes('honolulu') || destClean.includes('hnl') || destClean.includes('하와이') || destClean.includes('hawaii');

  // Determine base price range based on destination category
  let baseMin = 300000;
  let baseMax = 600000;
  let airlines: { name: string; tier: 'fsc' | 'lcc' }[] = [];

  if (isEurope || isNorthAmerica || isOceania) {
    baseMin = 1150000;
    baseMax = 2100000;
    
    // Custom dynamically named carrier depending on location
    let carrierName = '외항사 (Transit Carrier)';
    if (destClean.includes('독일') || destClean.includes('germany') || destClean.includes('fra') || destClean.includes('muc') || destClean.includes('프랑크') || destClean.includes('뮌헨')) {
      carrierName = '루프트한자 독일항공 (Lufthansa)';
    } else if (destClean.includes('프랑스') || destClean.includes('france') || destClean.includes('paris') || destClean.includes('파리') || destClean.includes('cdg')) {
      carrierName = '에어프랑스 (Air France)';
    } else if (destClean.includes('영국') || destClean.includes('london') || destClean.includes('런던') || destClean.includes('lhr')) {
      carrierName = '영국항공 (British Airways)';
    } else if (destClean.includes('이탈리아') || destClean.includes('italy') || destClean.includes('rome') || destClean.includes('로마')) {
      carrierName = 'ITA 항공 (ITA Airways)';
    } else if (destClean.includes('스페인') || destClean.includes('spain') || destClean.includes('madrid') || destClean.includes('바르셀로나')) {
      carrierName = '스페인항공 / 외항사 (Iberia / Transit)';
    } else if (destClean.includes('미국') || destClean.includes('united states') || destClean.includes('usa') || destClean.includes('jfk') || destClean.includes('lax') || destClean.includes('sfo')) {
      carrierName = '유나이티드 / 델타항공 (United / Delta)';
    } else if (destClean.includes('호주') || destClean.includes('australia') || destClean.includes('sydney') || destClean.includes('시드니')) {
      carrierName = '콴타스 항공 (Qantas)';
    }

    airlines = [
      { name: '대한항공 (Korean Air) [직항/경유]', tier: 'fsc' },
      { name: '아시아나항공 (Asiana Airlines) [직항/경유]', tier: 'fsc' },
      { name: `${carrierName} [직항/1회경유]`, tier: 'fsc' },
      { name: '티웨이항공 / 에어프레미아 (T\'way / Air Premia)', tier: 'lcc' }
    ];
  } else if (isMediumHaul) {
    baseMin = 380000;
    baseMax = 800000;
    
    airlines = [
      { name: '대한항공 (Korean Air)', tier: 'fsc' },
      { name: '아시아나항공 (Asiana Airlines)', tier: 'fsc' },
      { name: '제주항공 / 진에어 (Jeju Air / Jin Air)', tier: 'lcc' },
      { name: '티웨이항공 / 에어아시아 (T\'way / AirAsia)', tier: 'lcc' }
    ];
  } else {
    // Short-haul (Japan, Taiwan, Hong Kong, Domestic)
    baseMin = 240000;
    baseMax = 500000;

    airlines = [
      { name: '대한항공 (Korean Air)', tier: 'fsc' },
      { name: '아시아나항공 (Asiana Airlines)', tier: 'fsc' },
      { name: '제주항공 / 진에어 (Jeju Air / Jin Air)', tier: 'lcc' },
      { name: '티웨이항공 / 피치항공 (T\'way / Peach)', tier: 'lcc' }
    ];
  }

  const isSeoul = depClean.includes('인천') || depClean.includes('icn') || depClean.includes('서울') || depClean.includes('sel') || depClean.includes('김포') || depClean.includes('gmp');
  if (!isSeoul) {
    baseMin += 80000;
    baseMax += 150000;
  }

  const flights: AnalyzedFlight[] = airlines.map((airline, idx) => {
    const randomFactor = ((seed + idx * 13) % 100) / 100;
    const priceMultiplier = airline.tier === 'fsc' ? 1.15 : 0.85;
    let price = Math.round((baseMin + (baseMax - baseMin) * randomFactor) * priceMultiplier);
    price = Math.round(price / 1000) * 1000;
    return { airline: airline.name, price };
  });

  const sum = flights.reduce((acc, f) => acc + f.price, 0);
  const average = Math.round((sum / flights.length) / 1000) * 1000;

  return { flights, average };
};

// Custom analysis lookup based on destination and departure month
const getTravelReport = (dep: string, dest: string, start: string, end: string): TravelReport => {
  const d = new Date(start);
  const month = isNaN(d.getTime()) ? 7 : d.getMonth() + 1;

  const destClean = dest.trim().toLowerCase();
  
  let temp = '22°C';
  let tempEn = '22°C';
  let humidity = '60%';
  let rainySeason = '아님 (건기)';
  let rainySeasonEn = 'No (Dry Season)';
  let festivals: string[] = [];
  let festivalsEn: string[] = [];
  let tourists = '약 80만 명';
  let touristsEn = 'Approx. 800k';
  let level: '추천' | '보통' | '추천 안함' = '추천';
  let description = '';
  let descriptionEn = '';
  let flightPrice = '약 550,000원';
  let flightPriceEn = 'Approx. 550,000 KRW';
  let flightSource = 'Skyscanner / Google Flights';
  let flightSourceEn = 'Skyscanner & Google Flights';

  const priceAnalysis = analyzeFlightPrices(dep, dest);
  flightPrice = `평균 약 ${priceAnalysis.average.toLocaleString()}원`;
  flightPriceEn = `Avg. approx. ${priceAnalysis.average.toLocaleString()} KRW`;

  if (destClean.includes('파리') || destClean.includes('paris') || destClean.includes('프랑스')) {
    if (month >= 5 && month <= 9) {
      temp = '22°C ~ 26°C';
      tempEn = '22°C ~ 26°C';
      humidity = '55%';
      rainySeason = '아님 (화창함)';
      rainySeasonEn = 'No (Sunny & Clear)';
      festivals = ['센 강 음악제 (Fête de la Musique)', '바스티유 데이 군사 퍼레이드', '파리 플라주 해변 축제'];
      festivalsEn = ['Fête de la Musique (Music Festival)', 'Bastille Day Military Parade', 'Paris Plages (Beach Festival)'];
      tourists = '약 120만 명 (혼잡도: 높음)';
      touristsEn = 'Approx. 1.2M (Congestion: High)';
      level = '추천';
      description = `${month}월의 파리는 쾌청하고 아름다운 햇살이 가득한 최고의 시즌입니다! 야외 노천카페에서 에스프레소를 즐기기에 더할 나위 없으며, 강변 음악축제와 독립기념일 불꽃놀이가 여행을 영화처럼 만들어 줍니다.`;
      descriptionEn = `Paris in ${month === 5 ? 'May' : month === 6 ? 'June' : month === 7 ? 'July' : month === 8 ? 'August' : 'September'} is at its peak with pleasant, beautiful sunshine! It is the perfect season to enjoy espresso at open terrace cafes, with river music festivals and Independence Day fireworks making your travel feel like a movie.`;
    } else if (month === 10 || month === 11) {
      temp = '10°C ~ 15°C';
      tempEn = '10°C ~ 15°C';
      humidity = '72%';
      rainySeason = '간헐적 소나기';
      rainySeasonEn = 'Occasional Showers';
      festivals = ['파리 가을 예술제 (Festival d\'Automne)', '몽마르뜨 포도 수확 축제'];
      festivalsEn = ['Festival d\'Automne (Autumn Art Festival)', 'Montmartre Grape Harvest Festival'];
      tourists = '약 75만 명 (혼잡도: 보통)';
      touristsEn = 'Approx. 750k (Congestion: Moderate)';
      level = '보통';
      description = `${month}월의 파리는 고즈넉한 단풍과 서늘한 공기가 낭만적인 가을 분위기를 선사합니다. 강수량이 살짝 늘어나지만, 줄 서지 않고 박물관과 에펠탑을 여유롭게 관람하기에 적합합니다.`;
      descriptionEn = `Paris in ${month === 10 ? 'October' : 'November'} presents a romantic autumn vibe with peaceful foliage and cool breeze. Though precipitation increases slightly, it is perfect for visiting museums and the Eiffel Tower leisurely without long queues.`;
    } else {
      temp = '3°C ~ 8°C';
      tempEn = '3°C ~ 8°C';
      humidity = '80%';
      rainySeason = '잦은 진눈깨비 (겨울 우기)';
      rainySeasonEn = 'Frequent Sleet (Winter Wet)';
      festivals = ['샹젤리제 크리스마스 마켓 & 빛의 축제', '겨울 살롱 뒤 쇼콜라'];
      festivalsEn = ['Champs-Élysées Christmas Market & Festival of Lights', 'Winter Salon du Chocolat'];
      tourists = '약 40만 명 (혼잡도: 한산)';
      touristsEn = 'Approx. 400k (Congestion: Low)';
      level = '보통';
      description = `${month}월의 파리는 날씨가 다소 쌀쌀하고 해가 일찍 지는 편입니다. 그러나 샹젤리제의 은하수 같은 조명과 낭만 가득한 크리스마스 마켓, 한산한 도심 거리를 만끽할 수 있어 겨울만의 특별함이 있습니다.`;
      descriptionEn = `Paris in ${month === 12 ? 'December' : month === 1 ? 'January' : month === 2 ? 'February' : month === 3 ? 'March' : 'April'} has a rather chilly climate and early sunset. However, it holds a unique winter charm, with Champs-Élysées illuminated by star-like lights, warm Christmas markets, and quiet city streets.`;
    }
    flightSource = '스카이스캐너(Skyscanner) 및 카약(KAYAK) 실시간 평균';
    flightSourceEn = 'Skyscanner & KAYAK live averages';
  } else if (destClean.includes('도쿄') || destClean.includes('tokyo') || destClean.includes('일본')) {
    if (month >= 3 && month <= 5) {
      temp = '12°C ~ 21°C';
      tempEn = '12°C ~ 21°C';
      humidity = '60%';
      rainySeason = '아님 (청명하고 맑음)';
      rainySeasonEn = 'No (Clear & Sunny)';
      festivals = ['도쿄 우에노 벚꽃 마츠리', '아사쿠사 삼자 마츠리 (Sanja Matsuri)'];
      festivalsEn = ['Ueno Cherry Blossom Festival', 'Asakusa Sanja Matsuri'];
      tourists = '약 140만 명 (혼잡도: 매우 높음)';
      touristsEn = 'Approx. 1.4M (Congestion: Very High)';
      level = '추천';
      description = `${month}월의 도쿄는 분홍빛 벚꽃과 화사한 봄꽃이 가득한 눈부신 시기입니다. 전 세계 여행객으로 무척 혼잡하지만, 봄기운 가득한 요요기 공원 산책과 전통 축제를 직접 경험하기에는 비교할 수 없이 훌륭합니다.`;
      descriptionEn = `Tokyo in ${month === 3 ? 'March' : month === 4 ? 'April' : 'May'} is a beautiful, dazzling season filled with pink cherry blossoms and brilliant spring flowers. Although heavily crowded with global tourists, walking around Yoyogi Park and experiencing traditional festivals is incomparable.`;
    } else if (month >= 6 && month <= 8) {
      temp = '26°C ~ 33°C';
      tempEn = '26°C ~ 33°C';
      humidity = '86%';
      rainySeason = month === 6 || month === 7 ? '여름 장마철 (츠유)' : '국지성 태풍 대비 요망';
      rainySeasonEn = month === 6 || month === 7 ? 'Tsuyu (Summer Rainy Season)' : 'Be aware of Typhoons';
      festivals = ['스마다강 대규모 불꽃축제 (Hanabi)', '아사쿠사 쌈바 카니발'];
      festivalsEn = ['Sumida River Fireworks Festival (Hanabi)', 'Asakusa Samba Carnival'];
      tourists = '약 90만 명 (혼잡도: 보통)';
      touristsEn = 'Approx. 900k (Congestion: Moderate)';
      level = month === 8 ? '보통' : '추천 안함';
      description = `${month}월의 도쿄는 높은 습도와 강한 햇볕으로 무더위가 심합니다. ${month === 8 ? '8월 말에는 태풍이 잦아' : '6~7월은 긴 장마철이라'} 야외 일정 시 날씨 제약이 큽니다. 시원한 오다이바 실내 쇼핑몰과 미식 투어를 위주로 여행을 구성하는 것을 권장합니다.`;
      descriptionEn = `Tokyo in ${month === 6 ? 'June' : month === 7 ? 'July' : 'August'} is very hot with high humidity and intense sunshine. Weather constraints can be high due to ${month === 8 ? 'frequent typhoons in late August' : 'the long rainy season in June-July'}. We suggest focusing on air-conditioned indoor activities like Odaiba malls and gourmet food tours.`;
    } else if (month >= 9 && month <= 11) {
      temp = '14°C ~ 22°C';
      tempEn = '14°C ~ 22°C';
      humidity = '64%';
      rainySeason = '아님 (매우 선선)';
      rainySeasonEn = 'No (Very Cool)';
      festivals = ['메이지 신궁 가을 대축제', '신주쿠 교엔 가을 단풍 라이트업'];
      festivalsEn = ['Meiji Shrine Autumn Grand Festival', 'Shinjuku Gyoen Autumn Leaves Light-up'];
      tourists = '약 110만 명 (혼잡도: 보통)';
      touristsEn = 'Approx. 1.1M (Congestion: Moderate)';
      level = '추천';
      description = `${month}월의 도쿄는 맑고 서늘한 바람이 불어 도보 여행에 아주 제격인 황금기입니다! 울긋불긋한 단풍과 야외 야시장이 펼쳐지며 디즈니랜드나 시부야 등을 도보로 쾌적하게 즐길 수 있습니다.`;
      descriptionEn = `Tokyo in ${month === 9 ? 'September' : month === 10 ? 'October' : 'November'} is a golden period ideal for walking with clear sky and cool breezes! Colorful autumn foliage and night markets open up, making it extremely pleasant to explore Disneyland or Shibuya on foot.`;
    } else {
      temp = '2°C ~ 11°C';
      tempEn = '2°C ~ 11°C';
      humidity = '48%';
      rainySeason = '아님 (매우 건조)';
      rainySeasonEn = 'No (Dry & Clear)';
      festivals = ['도쿄 카운트다운 불꽃 페스티벌', '새해 첫 신사 참배 (하츠모데)'];
      festivalsEn = ['Tokyo Countdown Fireworks Festival', 'New Year Shrine Visit (Hatsumode)'];
      tourists = '약 65만 명 (혼잡도: 여유로움)';
      touristsEn = 'Approx. 650k (Congestion: Low)';
      level = '보통';
      description = `${month}월의 도쿄는 겨울 바람이 쌀쌀하지만 하늘이 최고로 맑아 웅장한 후지산을 감상하기 좋습니다. 화려한 겨울 일루미네이션을 보며 노천 온천을 아늑하게 즐기기에 완벽합니다.`;
      descriptionEn = `Tokyo in ${month === 12 ? 'December' : month === 1 ? 'January' : 'February'} has a chilly winter wind but the clearest sky, perfect for seeing Mt. Fuji. It is wonderful for enjoying cozy open-air hot springs under beautiful winter illuminations.`;
    }
    flightSource = '네이버 항공권 및 구글 플라이트(Google Flights) 실시간 평균';
    flightSourceEn = 'Naver Flights & Google Flights live averages';
  } else if (destClean.includes('보라카이') || destClean.includes('boracay') || destClean.includes('필리핀')) {
    if (month >= 11 || month <= 5) {
      temp = '28°C ~ 32°C';
      tempEn = '28°C ~ 32°C';
      humidity = '70%';
      rainySeason = '완벽한 건기 (환상적인 에메랄드 해변)';
      rainySeasonEn = 'Perfect Dry Season (Emerald Beach)';
      festivals = ['보라카이 아티아티한 카니발', '화이트 비치 서머 워터 스포츠 페스타'];
      festivalsEn = ['Boracay Ati-Atihan Carnival', 'White Beach Summer Water Sports Festa'];
      tourists = '약 65만 명 (혼잡도: 보통)';
      touristsEn = 'Approx. 650k (Congestion: Moderate)';
      level = '추천';
      description = `${month}월의 보라카이는 투명한 에메랄드빛 화이트비치와 잔잔한 파도가 맞이해주는 일년 중 최고의 건기 시즌입니다! 스쿠버다이빙, 패러세일링 등 해양 스포츠에 천국 같으며 로맨틱한 세일링 보트 선셋 투어가 적극 추천됩니다.`;
      descriptionEn = `Boracay in month ${month} is in its absolute prime dry season, welcoming you with transparent emerald-colored White Beach and calm waves! It is a paradise for marine sports like scuba diving and parasailing, and a romantic sailing boat sunset tour is highly recommended.`;
    } else {
      temp = '25°C ~ 30°C';
      tempEn = '25°C ~ 30°C';
      humidity = '92%';
      rainySeason = '우기 돌입 (몬순 기후 및 강력 태풍 주의)';
      rainySeasonEn = 'Rainy Season (Monsoon & Typhoons)';
      festivals = ['보라카이 드래곤 보트 레가타', '해변 푸드 버켓 축제'];
      festivalsEn = ['Boracay Dragon Boat Regatta', 'Beach Food Bucket Festival'];
      tourists = '약 20만 명 (혼잡도: 매우 한산)';
      touristsEn = 'Approx. 200k (Congestion: Low)';
      level = '추천 안함';
      description = `${month}월의 보라카이는 강렬한 서남풍 몬순 바람과 폭우를 동반하는 집중 우기 시즌입니다. 기상 악화 시 액티비티가 취소되거나 해안 통행이 제한될 수 있으므로 화창한 휴양을 원하신다면 이 기간을 피하는 것을 권장합니다.`;
      descriptionEn = `Boracay in month ${month} is in its heavy rainy season with strong southwest monsoon winds and rainstorms. Outdoor activities might get canceled and beach access restricted during bad weather, so we advise avoiding this period if you want sunny relaxation.`;
    }
    flightSource = '스카이스캐너(Skyscanner) 및 트립닷컴(Trip.com) 실시간 평균';
    flightSourceEn = 'Skyscanner & Trip.com live averages';
  } else {
    // Custom query fallback dynamic calculations
    const isSummer = month >= 6 && month <= 8;
    const isWinter = month === 12 || month === 1 || month === 2;
    if (isSummer) {
      temp = '24°C ~ 31°C';
      tempEn = '24°C ~ 31°C';
      humidity = '78%';
      rainySeason = '여름철 국지성 소나기';
      rainySeasonEn = 'Summer Local Showers';
      festivals = ['로컬 썸머 야외 록 페스티벌', '시원한 강변 야시장 축제'];
      festivalsEn = ['Local Summer Outdoor Rock Festival', 'Cool Riverside Night Market Festival'];
      tourists = '약 85만 명 (혼잡도: 보통)';
      touristsEn = 'Approx. 850k (Congestion: Moderate)';
      level = '추천';
      description = `${month}월의 ${dest}은(는) 에너제틱한 여름 정취를 뿜어냅니다! 낮에는 시원한 음료와 함께 도심 예술 거리를 탐방하고, 저녁에는 신나는 물총 축제와 야시장을 즐길 수 있어 다채롭고 활력 넘치는 여행이 가능합니다.`;
      descriptionEn = `${dest} in ${month === 6 ? 'June' : month === 7 ? 'July' : month === 8 ? 'August' : 'Summer'} radiates an energetic summer atmosphere! Explore urban art streets with cool drinks by day, and enjoy exciting water gun events and night markets by night for a lively, vibrant trip.`;
    } else if (isWinter) {
      temp = '2°C ~ 10°C';
      tempEn = '2°C ~ 10°C';
      humidity = '62%';
      rainySeason = '겨울철 눈 또는 잦은 소우';
      rainySeasonEn = 'Winter Snow or Drizzle';
      festivals = ['겨울 눈조각 축제 및 일루미네이션', '해맞이 타운 페스티벌'];
      festivalsEn = ['Winter Snow Sculptures & Illuminations', 'Sunrise Town Festival'];
      tourists = '약 45만 명 (혼잡도: 여유로움)';
      touristsEn = 'Approx. 450k (Congestion: Low)';
      level = '보통';
      description = `${month}월의 ${dest}은(는) 포근하고 고요한 겨울빛 낭만이 내려앉은 때입니다. 따뜻한 현지 길거리 음식을 탐미하며 미술관과 극장 등 실내 투어를 조용히 감상하기에 가성비와 매력이 훌륭한 시기입니다.`;
      descriptionEn = `${dest} in ${month === 12 ? 'December' : month === 1 ? 'January' : month === 2 ? 'February' : 'Winter'} is wrapped in cozy, quiet winter romance. It is an amazing and cost-effective time to leisurely explore indoor tours like museums and theaters while enjoying warm local street food.`;
    } else {
      temp = '13°C ~ 22°C';
      tempEn = '13°C ~ 22°C';
      humidity = '58%';
      rainySeason = '아님 (가장 쾌적함)';
      rainySeasonEn = 'No (Most Pleasant)';
      festivals = ['봄/가을 가든 플라워 야외 카니발', '로컬 가을 수확 예술 플리마켓'];
      festivalsEn = ['Spring/Autumn Garden Flower Outdoor Carnival', 'Local Harvest Arts Flea Market'];
      tourists = '약 75만 명 (혼잡도: 보통)';
      touristsEn = 'Approx. 750k (Congestion: Moderate)';
      level = '추천';
      description = `${month}월의 ${dest}은(는) 선선하고 상쾌한 바람과 함께 야외 도보 여행을 떠나기 가장 뛰어난 날씨입니다. 하늘이 맑고 온도가 매우 안성맞춤이라 명소 투어, 카페 트레킹, 하이킹에 최상급 조화를 선보입니다.`;
      descriptionEn = `${dest} in ${month === 3 ? 'March' : month === 4 ? 'April' : month === 5 ? 'May' : month === 9 ? 'September' : month === 10 ? 'October' : 'November'} features cool, refreshing breezes, making it the perfect time to go on an outdoor walking trip. With clear skies and optimal temperatures, it is ideal for sightseeing, cafe trekking, and hiking.`;
    }
    flightSource = '구글 플라이트(Google Flights) 및 주요 글로벌 플랫폼 실시간 평균';
    flightSourceEn = 'Google Flights & global flight platforms';
  }

  // 1. Weather/Temp Rating (날씨)
  const evaluateTemp = (tempStr: string): '추천' | '보통' | '나쁨' => {
    const numbers = tempStr.match(/-?\d+/g);
    if (numbers && numbers.length > 0) {
      const temps = numbers.map(Number);
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      if (avgTemp >= 13 && avgTemp <= 25) return '추천'; // Pleasant range
      if ((avgTemp >= 6 && avgTemp < 13) || (avgTemp > 25 && avgTemp <= 31)) return '보통'; // Slightly cool or warm
      return '나쁨'; // Very cold or very hot
    }
    return '보통';
  };

  // 2. Humidity Rating (습도)
  const evaluateHumidity = (humidityStr: string): '추천' | '보통' | '나쁨' => {
    const number = parseInt(humidityStr.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(number)) {
      if (number <= 60) return '추천';
      if (number <= 75) return '보통';
      return '나쁨';
    }
    return '보통';
  };

  // 3. Rainy Season Rating (우기)
  const evaluateRainy = (rainyStr: string): '추천' | '보통' | '나쁨' => {
    const clean = rainyStr.toLowerCase();
    if (clean.includes('아님') || clean.includes('건기') || clean.includes('화창') || clean.includes('쾌적') || clean.includes('맑음') || clean.includes('선선')) {
      return '추천';
    }
    if (clean.includes('간헐적') || clean.includes('소나기') || clean.includes('소우') || clean.includes('눈') || clean.includes('진눈깨비')) {
      return '보통';
    }
    if (clean.includes('우기') || clean.includes('장마') || clean.includes('츠유') || clean.includes('태풍') || clean.includes('폭우')) {
      return '나쁨';
    }
    return '보통';
  };

  // 4. Tourist Congestion Rating (여행객 수)
  const evaluateTourists = (touristStr: string): '추천' | '보통' | '나쁨' => {
    const clean = touristStr.toLowerCase();
    if (clean.includes('한산') || clean.includes('여유') || clean.includes('적음')) {
      return '추천';
    }
    if (clean.includes('높음') || clean.includes('매우 높음') || clean.includes('혼잡')) {
      return '나쁨';
    }
    return '보통';
  };

  // 5. Price Rating (항공권 가격)
  const evaluatePrice = (avgPrice: number, dName: string): '추천' | '보통' | '나쁨' => {
    const destClean = dName.toLowerCase();
    const isEurope = 
      destClean.includes('파리') || destClean.includes('paris') || destClean.includes('france') || destClean.includes('프랑스') || destClean.includes('cdg') || destClean.includes('ory') || destClean.includes('nce') ||
      destClean.includes('런던') || destClean.includes('london') || destClean.includes('lhr') || destClean.includes('lgw') || destClean.includes('영국') || destClean.includes('uk') ||
      destClean.includes('프랑크') || destClean.includes('frankfurt') || destClean.includes('fra') || destClean.includes('독일') || destClean.includes('germany') || destClean.includes('뮌헨') || destClean.includes('munich') || destClean.includes('muc') ||
      destClean.includes('로마') || destClean.includes('rome') || destClean.includes('fco') || destClean.includes('밀라노') || destClean.includes('milan') || destClean.includes('mxp') || destClean.includes('베네치아') || destClean.includes('venice') || destClean.includes('vce') || destClean.includes('이탈리아') || destClean.includes('italy') ||
      destClean.includes('마드리드') || destClean.includes('madrid') || destClean.includes('mad') || destClean.includes('바르셀로나') || destClean.includes('barcelona') || destClean.includes('bcn') || destClean.includes('스페인') || destClean.includes('spain') ||
      destClean.includes('빈') || destClean.includes('vienna') || destClean.includes('vie') || destClean.includes('오스트리아') || destClean.includes('austria') ||
      destClean.includes('취리히') || destClean.includes('zurich') || destClean.includes('zrh') || destClean.includes('제네바') || destClean.includes('geneva') || destClean.includes('gva') || destClean.includes('스위스') || destClean.includes('switzerland') ||
      destClean.includes('이스탄불') || destClean.includes('istanbul') || destClean.includes('ist') || destClean.includes('튀르키예') || destClean.includes('turkey');

    const isNorthAmerica = 
      destClean.includes('로스앤젤레스') || destClean.includes('los angeles') || destClean.includes('lax') ||
      destClean.includes('뉴욕') || destClean.includes('new york') || destClean.includes('jfk') ||
      destClean.includes('샌프란시스코') || destClean.includes('san francisco') || destClean.includes('sfo') ||
      destClean.includes('시카고') || destClean.includes('chicago') || destClean.includes('ord') ||
      destClean.includes('미국') || destClean.includes('united states') || destClean.includes('usa') ||
      destClean.includes('밴쿠버') || destClean.includes('vancouver') || destClean.includes('yvr') ||
      destClean.includes('토론토') || destClean.includes('toronto') || destClean.includes('yyz') ||
      destClean.includes('캐나다') || destClean.includes('canada');

    const isOceania = 
      destClean.includes('시드니') || destClean.includes('sydney') || destClean.includes('syd') ||
      destClean.includes('멜버른') || destClean.includes('melbourne') || destClean.includes('mel') ||
      destClean.includes('호주') || destClean.includes('australia');

    const isMediumHaul =
      destClean.includes('보라카이') || destClean.includes('boracay') || destClean.includes('mph') || destClean.includes('klo') || destClean.includes('필리핀') || destClean.includes('philippines') || destClean.includes('마닐라') || destClean.includes('manila') || destClean.includes('mnl') || destClean.includes('세부') || destClean.includes('cebu') || destClean.includes('ceb') ||
      destClean.includes('방콕') || destClean.includes('bangkok') || destClean.includes('bkk') || destClean.includes('dmk') || destClean.includes('푸켓') || destClean.includes('phuket') || destClean.includes('hkt') || destClean.includes('치앙마이') || destClean.includes('chiang mai') || destClean.includes('cnx') || destClean.includes('태국') || destClean.includes('thailand') ||
      destClean.includes('하노이') || destClean.includes('hanoi') || destClean.includes('han') || destClean.includes('호치민') || destClean.includes('ho chi minh') || destClean.includes('sgn') || destClean.includes('다낭') || destClean.includes('da nang') || destClean.includes('dad') || destClean.includes('나트랑') || destClean.includes('nha trang') || destClean.includes('cxr') || destClean.includes('푸꾸옥') || destClean.includes('phu quoc') || destClean.includes('pqc') || destClean.includes('베트남') || destClean.includes('vietnam') ||
      destClean.includes('싱가포르') || destClean.includes('singapore') || destClean.includes('sin') ||
      destClean.includes('발리') || destClean.includes('bali') || destClean.includes('dps') || destClean.includes('자카르타') || destClean.includes('jakarta') || destClean.includes('cgk') || destClean.includes('인도네시아') || destClean.includes('indonesia') ||
      destClean.includes('쿠알라룸푸르') || destClean.includes('kuala lumpur') || destClean.includes('kul') || destClean.includes('코타키나발루') || destClean.includes('kota kinabalu') || destClean.includes('bki') || destClean.includes('말레이시아') || destClean.includes('malaysia') ||
      destClean.includes('괌') || destClean.includes('guam') || destClean.includes('gum') ||
      destClean.includes('사이판') || destClean.includes('saipan') || destClean.includes('spn') ||
      destClean.includes('호놀룰루') || destClean.includes('honolulu') || destClean.includes('hnl') || destClean.includes('하와이') || destClean.includes('hawaii');

    if (isEurope || isNorthAmerica || isOceania) {
      if (avgPrice < 1400000) return '추천';
      if (avgPrice <= 1750000) return '보통';
      return '나쁨';
    } else if (isMediumHaul) {
      if (avgPrice < 500000) return '추천';
      if (avgPrice <= 650000) return '보통';
      return '나쁨';
    } else {
      if (avgPrice < 350000) return '추천';
      if (avgPrice <= 450000) return '보통';
      return '나쁨';
    }
  };

  const tempLevel = evaluateTemp(temp);
  const humidityLevel = evaluateHumidity(humidity);
  const rainyLevel = evaluateRainy(rainySeason);
  const touristLevel = evaluateTourists(tourists);
  const priceLevel = evaluatePrice(priceAnalysis.average, dest);

  const levelPoints = {
    '추천': 3,
    '보통': 2,
    '나쁨': 1
  };
  const avgScore = (levelPoints[tempLevel] + levelPoints[humidityLevel] + levelPoints[rainyLevel] + levelPoints[touristLevel] + levelPoints[priceLevel]) / 5;

  let computedLevel: '추천' | '보통' | '추천 안함';
  if (avgScore >= 2.4) {
    computedLevel = '추천';
  } else if (avgScore >= 1.6) {
    computedLevel = '보통';
  } else {
    computedLevel = '추천 안함';
  }

  return {
    departure: dep,
    destination: dest,
    startDate: start,
    endDate: end,
    temp,
    tempEn,
    humidity,
    rainySeason,
    rainySeasonEn,
    festivals,
    festivalsEn,
    tourists,
    touristsEn,
    level: computedLevel,
    description,
    descriptionEn,
    flightPrice,
    flightPriceEn,
    flightSource,
    flightSourceEn,
    priceAnalysis,
    tempLevel,
    humidityLevel,
    rainyLevel,
    touristLevel,
    priceLevel
  };
};

const localizeAirportString = (str: string, lang: Language = 'ko') => {
  if (!str) return str;
  const match = str.match(/^([A-Z]{3})\b/);
  if (match) {
    const code = match[1];
    const found = AIRPORTS.find(ap => ap.code === code);
    if (found) {
      return lang === 'ko' ? `${found.code} (${found.nameKo})` : `${found.code} (${found.nameEn})`;
    }
  }
  return str;
};

const parseDateString = (dateStr: string) => {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};

const formatDateToString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDayOfWeek = (date: Date, lang: Language = 'ko') => {
  const weekdaysKo = ['일', '월', '화', '수', '목', '금', '토'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return lang === 'ko' ? weekdaysKo[date.getDay()] : weekdaysEn[date.getDay()];
};

const formatDisplayShort = (dateStr: string, lang: Language = 'ko') => {
  const d = parseDateString(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')} (${getDayOfWeek(d, lang)})`;
};

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isDateBetween = (target: Date, start: Date, end: Date) => {
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return t > s && t < e;
};

export default function ExploreTab({ onSelectDestination, language = 'ko', isDarkMode = false }: ExploreTabProps) {
  // Input states
  const [departName, setDepartName] = useState(() => {
    const saved = localStorage.getItem('last_departure_airport');
    if (saved) return localizeAirportString(saved, language);
    return language === 'ko' ? 'ICN (인천국제공항)' : 'ICN (Incheon International Airport)';
  });
  const [destName, setDestName] = useState('');
  const [startDate, setStartDate] = useState('2026-07-15');
  const [endDate, setEndDate] = useState('2026-07-19');

  // Update input names automatically when language changes
  useEffect(() => {
    if (departName) {
      const localized = localizeAirportString(departName, language);
      if (localized !== departName) {
        setDepartName(localized);
      }
    }
    if (destName) {
      const localized = localizeAirportString(destName, language);
      if (localized !== destName) {
        setDestName(localized);
      }
    }
  }, [language]);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{
    departName?: 'empty' | 'invalid' | boolean;
    destName?: 'empty' | 'invalid' | boolean;
    startDate?: boolean;
    endDate?: boolean;
  }>({});

  // Autocomplete states
  const [showDepartSuggestions, setShowDepartSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // Save the departure airport immediately whenever it changes
  useEffect(() => {
    if (departName) {
      localStorage.setItem('last_departure_airport', departName);
    }
  }, [departName]);

  // For closing suggestions on blur with delay to allow clicks
  const handleDepartBlur = () => {
    setTimeout(() => setShowDepartSuggestions(false), 200);
  };
  const handleDestBlur = () => {
    setTimeout(() => setShowDestSuggestions(false), 200);
  };

  const getDepartSuggestions = () => {
    const cleanName = departName.trim();
    if (!cleanName || cleanName === 'ICN (인천국제공항)' || cleanName === 'ICN (Incheon International Airport)') {
      return AIRPORTS.filter(ap => ap.countryKo === '한국');
    }
    return filterAirports(cleanName, 8);
  };

  const getDestSuggestions = () => {
    const cleanName = destName.trim();
    if (!cleanName) {
      const popularCodes = ['CDG', 'NRT', 'MPH', 'DAD', 'BKK', 'FCO', 'LHR', 'JFK', 'SIN', 'DPS', 'HKG', 'KUL'];
      return AIRPORTS.filter(ap => popularCodes.includes(ap.code));
    }
    return filterAirports(cleanName, 8);
  };

  // Custom premium calendar states
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarStep, setCalendarStep] = useState<'start' | 'end'>('start');
  const [viewDate, setViewDate] = useState<Date>(new Date(2026, 6, 1)); // Default starts around July 2026

  const openCalendarWithStep = (step: 'start' | 'end') => {
    setCalendarStep(step);
    const refDateStr = step === 'start' ? startDate : endDate;
    const parsed = parseDateString(refDateStr);
    if (!isNaN(parsed.getTime())) {
      setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
    setIsCalendarOpen(true);
  };

  const handleSelectDate = (date: Date) => {
    const dateStr = formatDateToString(date);
    if (calendarStep === 'start') {
      setStartDate(dateStr);
      setValidationErrors(prev => ({ ...prev, startDate: false }));
      // Automatically update return date if it's before or equal to start date
      const parsedEnd = parseDateString(endDate);
      if (isNaN(parsedEnd.getTime()) || date.getTime() >= parsedEnd.getTime()) {
        const newEnd = new Date(date);
        newEnd.setDate(date.getDate() + 3); // Default to a lovely 3-day buffer
        setEndDate(formatDateToString(newEnd));
        setValidationErrors(prev => ({ ...prev, endDate: false }));
      }
      // Beautiful seamless sequence: automatically trigger the return date picker!
      setTimeout(() => {
        setCalendarStep('end');
      }, 150);
    } else {
      // Return date selection step
      const parsedStart = parseDateString(startDate);
      if (!isNaN(parsedStart.getTime()) && date.getTime() < parsedStart.getTime()) {
        // If the clicked date is before the departure date, dynamically treat it as the departure date
        setStartDate(dateStr);
        setValidationErrors(prev => ({ ...prev, startDate: false }));
        const newEnd = new Date(date);
        newEnd.setDate(date.getDate() + 3);
        setEndDate(formatDateToString(newEnd));
        setValidationErrors(prev => ({ ...prev, endDate: false }));
        setCalendarStep('end');
      } else {
        setEndDate(dateStr);
        setValidationErrors(prev => ({ ...prev, endDate: false }));
      }
    }
  };

  // Search & report states
  const [report, setReport] = useState<TravelReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Quick recommend query
  const handleQuickAnalyze = (dest: Destination) => {
    setDestName(dest.name);
    setValidationErrors({ departName: false, destName: false, startDate: false, endDate: false });
    setIsAnalyzing(true);
    
    // Save last departure
    localStorage.setItem('last_departure_airport', departName);

    // Smooth transition simulation
    setTimeout(() => {
      const generatedReport = getTravelReport(departName, dest.name, startDate, endDate);
      setReport(generatedReport);
      setIsAnalyzing(false);
    }, 600);
  };

  const handleCustomAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: {
      departName?: 'empty' | 'invalid' | boolean;
      destName?: 'empty' | 'invalid' | boolean;
      startDate?: boolean;
      endDate?: boolean;
    } = {};

    if (!departName.trim()) {
      newErrors.departName = 'empty';
    } else if (!isValidAirport(departName)) {
      newErrors.departName = 'invalid';
    }

    if (!destName.trim()) {
      newErrors.destName = 'empty';
    } else if (!isValidAirport(destName)) {
      newErrors.destName = 'invalid';
    }

    if (!startDate || !startDate.trim()) {
      newErrors.startDate = true;
    }
    if (!endDate || !endDate.trim()) {
      newErrors.endDate = true;
    }

    setValidationErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    setIsAnalyzing(true);
    // Save last departure
    localStorage.setItem('last_departure_airport', departName);

    setTimeout(() => {
      const generatedReport = getTravelReport(departName, destName, startDate, endDate);
      setReport(generatedReport);
      setIsAnalyzing(false);
    }, 700);
  };

  // Helper for recommendation badge background
  const getLevelBadgeStyles = (level: '추천' | '보통' | '추천 안함') => {
    switch (level) {
      case '추천':
        return {
          bg: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-emerald-500/20',
          text: 'text-emerald-600',
          icon: <span className="text-base animate-bounce">🥰</span>
        };
      case '보통':
        return {
          bg: 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-slate-950 font-bold shadow-yellow-500/15',
          text: 'text-yellow-600 dark:text-yellow-400 font-extrabold',
          icon: <span className="text-base">🙂</span>
        };
      case '추천 안함':
        return {
          bg: 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-rose-500/20',
          text: 'text-rose-600',
          icon: <span className="text-base animate-pulse">🥺</span>
        };
    }
  };

  const getSubMetricBadge = (level: '추천' | '보통' | '나쁨', isPrice = false) => {
    const styles = {
      '추천': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
      '보통': 'bg-yellow-50 text-yellow-800 border-yellow-200/50 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-500/20',
      '나쁨': 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
    };
    
    let label = '';
    if (language === 'ko') {
      if (isPrice) {
        label = level === '추천' ? '낮은편' : level === '보통' ? '보통' : '비싼편';
      } else {
        label = level;
      }
    } else {
      if (isPrice) {
        label = level === '추천' ? 'Low' : level === '보통' ? 'Average' : 'High';
      } else {
        label = level === '추천' ? 'Good' : level === '보통' ? 'Normal' : 'Bad';
      }
    }

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border ${styles[level]} shrink-0`}>
        {label}
      </span>
    );
  };

  const getSubMetricBoxStyles = (level: '추천' | '보통' | '나쁨') => {
    switch (level) {
      case '추천':
        return 'bg-emerald-100 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-50 shadow-sm';
      case '보통':
        return 'bg-yellow-50/95 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-500/25 text-yellow-950 dark:text-yellow-300 shadow-sm';
      case '나쁨':
        return 'bg-rose-100 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-50 shadow-sm';
    }
  };

  const getFlightBoxBg = (level: '추천' | '보통' | '나쁨') => {
    switch (level) {
      case '추천':
        return 'bg-emerald-100 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700 shadow-sm';
      case '보통':
        return 'bg-yellow-50/95 dark:bg-yellow-950/35 border-yellow-200 dark:border-yellow-500/20 shadow-sm';
      case '나쁨':
        return 'bg-rose-100 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700 shadow-sm';
    }
  };

  const getPriceDetailsStyle = (level: '추천' | '보통' | '나쁨') => {
    switch (level) {
      case '추천':
        return 'bg-emerald-200/50 dark:bg-emerald-900/40 border-emerald-300/60 dark:border-emerald-700/60';
      case '보통':
        return 'bg-yellow-100/50 dark:bg-yellow-950/40 border-yellow-200/50 dark:border-yellow-500/25';
      case '나쁨':
        return 'bg-rose-200/50 dark:bg-rose-900/40 border-rose-300/60 dark:border-rose-700/60';
    }
  };

  const getNarrativeBoxStyles = (level: '추천' | '보통' | '추천 안함') => {
    switch (level) {
      case '추천':
        return {
          container: 'bg-emerald-100/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700 shadow-sm',
          titleBg: 'bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100',
          text: 'text-emerald-950 dark:text-emerald-50'
        };
      case '보통':
        return {
          container: 'bg-yellow-50/95 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-500/25 shadow-sm',
          titleBg: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-900 dark:text-yellow-300',
          text: 'text-yellow-950 dark:text-yellow-200'
        };
      case '추천 안함':
        return {
          container: 'bg-rose-100/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700 shadow-sm',
          titleBg: 'bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100',
          text: 'text-rose-950 dark:text-rose-50'
        };
    }
  };

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case 'sunny':
        return <span className="text-sm inline-block animate-spin-slow">☀️</span>;
      case 'cloudy':
        return <span className="text-sm inline-block">☁️</span>;
      case 'rainy':
        return <span className="text-sm inline-block">🌧️</span>;
      default:
        return <span className="text-sm inline-block">☀️</span>;
    }
  };

  // Generate calendar days for viewDate
  const getCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun

    const prevMonthDays = new Date(year, month, 0).getDate();
    const fillerDays = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      fillerDays.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i)
      });
    }

    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    const totalCells = 42;
    const nextMonthDays = [];
    const remainingCells = totalCells - (fillerDays.length + currentMonthDays.length);
    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return [...fillerDays, ...currentMonthDays, ...nextMonthDays];
  };

  const allCalendarDays = getCalendarDays();

  // Localized texts based on language prop
  const txt = {
    ko: {
      where_to: '어디로 언제 떠나볼까요?',
      departure_airport: '출발지 (공항)',
      departure_placeholder: '출발할 공항이나 도시를 입력하세요 (예: 인천 ICN, 김포 GMP)',
      destination: '목적지 (공항)',
      destination_placeholder: '목적지 공항이나 도시를 입력하세요 (예: 파리 CDG, 도쿄 NRT, 보라카이...)',
      departure: '출발일',
      return: '복귀일',
      popular_suggestions: '인기 제안 선택',
      analyze_btn: '우리의 여행 분석해보기!',
      analyzing_btn: '우리의 여행을 분석하고 있어요... 💨',
      report_title: '여행 동반 리포트',
      report_average_flight: '조회 기간 평균 항공권 가격',
      roundtrip_basis: '왕복 이코노미 기준',
      source: '출처',
      average_temp: '평균 기온',
      temp_desc: '최근 5개년 평균 데이터',
      humidity_wet: '습도 & 우기',
      average_tourists: '평균 여행객 수',
      festivals_count: '해당 기간 축제',
      festivals_list_title: '🎉 개최되는 로컬 축제 목록',
      no_festival: '축제 일정 없음',
      quiet_peaceful: '조용하고 안락함',
      ai_narrative_title: 'AI 분석 종합 총평',
      cta_btn: '이 조건으로 새롭고 재밌는 여행 일정 짜기! 🎈',
      popular_places_title: '지금 가장 핫한 인기 여행지 추천! 🌟',
      analyze_this: '어떤지 분석하기 🔍',
      calendar_title: 'Travel Scheduler',
      calendar_start_prompt: '언제 출발할까요? 🥰',
      calendar_start_desc: '여행이 시작되는 날짜를 콕! 집어주세요.',
      calendar_end_prompt: '언제 돌아올까요? 🏡',
      calendar_end_desc: '출발일 이후로 선택해 주세요!',
      calendar_cancel: '취소',
      calendar_select_done: '선택 완료',
      weekdays: ['일', '월', '화', '수', '목', '금', '토']
    },
    en: {
      where_to: 'Where and when shall we go?',
      departure_airport: 'Departure (Airport)',
      departure_placeholder: 'Enter departure airport or city (e.g., Incheon ICN, Gimpo GMP)',
      destination: 'Destination (Airport)',
      destination_placeholder: 'Enter destination airport or city (e.g., Paris CDG, Tokyo NRT, Boracay...)',
      departure: 'Departure Date',
      return: 'Return Date',
      popular_suggestions: 'Select Popular Destinations',
      analyze_btn: 'Analyze Our Trip!',
      analyzing_btn: 'Analyzing our trip... 💨',
      report_title: 'Travel Companion Report',
      report_average_flight: 'Average Flight Ticket Price',
      roundtrip_basis: 'Based on roundtrip economy',
      source: 'Source',
      average_temp: 'Avg Temperature',
      temp_desc: 'Recent 5-year average data',
      humidity_wet: 'Humidity & Rainy Season',
      average_tourists: 'Avg Tourists Count',
      festivals_count: 'Festivals in Period',
      festivals_list_title: '🎉 Local Festivals List',
      no_festival: 'No festival scheduled',
      quiet_peaceful: 'Quiet and peaceful',
      ai_narrative_title: 'AI Comprehensive Summary',
      cta_btn: 'Plan a new exciting trip with these dates! 🎈',
      popular_places_title: 'Hot & Popular Destinations Right Now! 🌟',
      analyze_this: 'Analyze this destination 🔍',
      calendar_title: 'Travel Scheduler',
      calendar_start_prompt: 'When shall we depart? 🥰',
      calendar_start_desc: 'Please select your departure date.',
      calendar_end_prompt: 'When shall we return? 🏡',
      calendar_end_desc: 'Please select after departure date!',
      calendar_cancel: 'Cancel',
      calendar_select_done: 'Done',
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    }
  }[language];

  return (
    <div className="space-y-6 text-gray-800 dark:text-zinc-100 transition-colors duration-300">
      {/* 1. Main Search & Parameter Form */}
      <section className="bg-white dark:bg-[#1a1924] rounded-[28px] p-5 shadow-sm border border-gray-100 dark:border-[#262435] space-y-4 transition-colors duration-300">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">✈️</span>
          <h2 className="font-sans font-extrabold text-base text-gray-900 dark:text-zinc-100 tracking-tight">
            {txt.where_to}
          </h2>
        </div>

        <form onSubmit={handleCustomAnalyze} className="space-y-3.5">
          {/* Departure & Destination fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Departure input */}
            <div className="space-y-1 relative">
              <label className="text-[11px] font-bold text-gray-400 dark:text-stone-500 tracking-wide block uppercase">
                {txt.departure_airport}
              </label>
              <div className="relative">
                <PlaneTakeoff size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${validationErrors.departName ? 'text-red-500' : 'text-gray-400 dark:text-stone-500'}`} />
                <input
                  type="text"
                  value={departName}
                  onChange={(e) => {
                    setDepartName(e.target.value);
                    setShowDepartSuggestions(true);
                    if (validationErrors.departName) {
                      setValidationErrors(prev => ({ ...prev, departName: false }));
                    }
                  }}
                  onFocus={() => {
                    setShowDepartSuggestions(true);
                    setShowDestSuggestions(false);
                  }}
                  onBlur={handleDepartBlur}
                  placeholder={txt.departure_placeholder}
                  className={`w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#15141f] rounded-xl border focus:outline-none focus:ring-2 text-sm font-sans text-gray-800 dark:text-zinc-100 transition-all placeholder:text-gray-400 dark:placeholder:text-stone-600 ${
                    validationErrors.departName
                      ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500/20 bg-red-50/5 dark:bg-red-950/5'
                      : 'border-gray-200 dark:border-[#2b2a3c] focus:ring-blue-500/20'
                  }`}
                />
              </div>

              {validationErrors.departName && (
                <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span>{' '}
                  {validationErrors.departName === 'invalid'
                    ? language === 'ko'
                      ? '실제 존재하지 않는 공항 또는 도시입니다. 검색어 또는 목록에서 선택해주세요.'
                      : 'This airport or city does not exist. Please select from the suggestions.'
                    : language === 'ko'
                    ? '출발지를 입력해주세요.'
                    : 'Please enter a departure.'}
                </p>
              )}

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showDepartSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1e1c2a] border border-gray-150 dark:border-[#2b2a3c] rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
                  >
                    <div className="p-2 border-b border-gray-100 dark:border-[#262435] bg-gray-50/50 dark:bg-stone-900/30">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-stone-500 block">
                        {departName.trim() ? (language === 'ko' ? '검색된 출발 공항 ✈️' : 'Search results ✈️') : (language === 'ko' ? '인기 출발 공항 (한국)' : 'Popular departure airports')}
                      </span>
                    </div>
                    {getDepartSuggestions().length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-400 dark:text-stone-500 text-center">
                        {language === 'ko' ? '일치하는 공항이 없습니다.' : 'No matching airports found.'}
                      </div>
                    ) : (
                      getDepartSuggestions().map((airport) => (
                        <button
                          key={airport.code}
                          type="button"
                          onMouseDown={() => {
                            setDepartName(`${airport.code} (${airport.nameKo})`);
                            setShowDepartSuggestions(false);
                            setValidationErrors(prev => ({ ...prev, departName: false }));
                          }}
                          className="w-full px-4 py-2.5 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer flex items-center gap-3 transition-colors text-left border-b border-gray-50/50 last:border-b-0 dark:border-[#262435]/40"
                        >
                          <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs px-2 py-1 rounded-lg w-12 text-center shrink-0 shadow-xs">
                            {airport.code}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-sans font-bold text-xs text-gray-800 dark:text-zinc-200 truncate">
                              {language === 'ko' ? airport.nameKo : airport.nameEn}
                            </div>
                            <div className="font-sans text-[10px] text-gray-400 dark:text-stone-500 truncate">
                              {airport.countryKo}, {airport.cityKo} &middot; {airport.cityEn}, {airport.countryEn}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Destination input */}
            <div className="space-y-1 relative">
              <label className="text-[11px] font-bold text-gray-400 dark:text-stone-500 tracking-wide block uppercase">
                {txt.destination}
              </label>
              <div className="relative">
                <MapPin size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${validationErrors.destName ? 'text-red-500' : 'text-gray-400 dark:text-stone-500'}`} />
                <input
                  type="text"
                  value={destName}
                  onChange={(e) => {
                    setDestName(e.target.value);
                    setShowDestSuggestions(true);
                    if (validationErrors.destName) {
                      setValidationErrors(prev => ({ ...prev, destName: false }));
                    }
                  }}
                  onFocus={() => {
                    setShowDestSuggestions(true);
                    setShowDepartSuggestions(false);
                  }}
                  onBlur={handleDestBlur}
                  placeholder={txt.destination_placeholder}
                  className={`w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#15141f] rounded-xl border focus:outline-none focus:ring-2 text-sm font-sans text-gray-800 dark:text-zinc-100 transition-all placeholder:text-gray-400 dark:placeholder:text-stone-600 ${
                    validationErrors.destName
                      ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500/20 bg-red-50/5 dark:bg-red-950/5'
                      : 'border-gray-200 dark:border-[#2b2a3c] focus:ring-blue-500/20'
                  }`}
                />
              </div>

              {validationErrors.destName && (
                <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span>{' '}
                  {validationErrors.destName === 'invalid'
                    ? language === 'ko'
                      ? '실제 존재하지 않는 공항 또는 도시입니다. 검색어 또는 목록에서 선택해주세요.'
                      : 'This airport or city does not exist. Please select from the suggestions.'
                    : language === 'ko'
                    ? '목적지를 입력해주세요.'
                    : 'Please enter a destination.'}
                </p>
              )}

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showDestSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1e1c2a] border border-gray-150 dark:border-[#2b2a3c] rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
                  >
                    <div className="p-2 border-b border-gray-100 dark:border-[#262435] bg-gray-50/50 dark:bg-stone-900/30">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-stone-500 block">
                        {destName.trim() ? (language === 'ko' ? '검색된 목적지 🗺️' : 'Search results 🗺️') : (language === 'ko' ? '인기 추천 목적지' : 'Popular recommended destinations')}
                      </span>
                    </div>
                    {getDestSuggestions().length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-400 dark:text-stone-500 text-center">
                        {language === 'ko' ? '일치하는 도시/공항이 없습니다.' : 'No matching city/airport found.'}
                      </div>
                    ) : (
                      getDestSuggestions().map((airport) => (
                        <button
                          key={airport.code}
                          type="button"
                          onMouseDown={() => {
                            setDestName(`${airport.code} (${airport.nameKo})`);
                            setShowDestSuggestions(false);
                            setValidationErrors(prev => ({ ...prev, destName: false }));
                          }}
                          className="w-full px-4 py-2.5 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer flex items-center gap-3 transition-colors text-left border-b border-gray-50/50 last:border-b-0 dark:border-[#262435]/40"
                        >
                          <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs px-2 py-1 rounded-lg w-12 text-center shrink-0 shadow-xs">
                            {airport.code}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-sans font-bold text-xs text-gray-800 dark:text-zinc-200 truncate">
                              {language === 'ko' ? airport.nameKo : airport.nameEn}
                            </div>
                            <div className="font-sans text-[10px] text-gray-400 dark:text-stone-500 truncate">
                              {airport.countryKo}, {airport.cityKo} &middot; {airport.cityEn}, {airport.countryEn}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Departure & Return Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 dark:text-stone-500 tracking-wide block uppercase">
                {txt.departure}
              </label>
              <button
                type="button"
                onClick={() => openCalendarWithStep('start')}
                className={`w-full pl-3 pr-2 py-3 rounded-xl border focus:outline-none text-left flex items-center gap-2 bg-white dark:bg-[#15141f] cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  validationErrors.startDate
                    ? 'border-red-500 dark:border-red-500/80 bg-red-50/5 dark:bg-red-950/5'
                    : 'border-gray-200 dark:border-[#2b2a3c] hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                <Calendar size={14} className={`${validationErrors.startDate ? 'text-red-500' : 'text-blue-500'} shrink-0`} />
                <span className="text-[11px] font-sans font-semibold text-gray-800 dark:text-zinc-200 truncate">
                  {formatDisplayShort(startDate, language)}
                </span>
              </button>

              {validationErrors.startDate && (
                <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {language === 'ko' ? '출발일을 지정해주세요.' : 'Please enter departure date.'}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 dark:text-stone-500 tracking-wide block uppercase">
                {txt.return}
              </label>
              <button
                type="button"
                onClick={() => openCalendarWithStep('end')}
                className={`w-full pl-3 pr-2 py-3 rounded-xl border focus:outline-none text-left flex items-center gap-2 bg-white dark:bg-[#15141f] cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  validationErrors.endDate
                    ? 'border-red-500 dark:border-red-500/80 bg-red-50/5 dark:bg-red-950/5'
                    : 'border-gray-200 dark:border-[#2b2a3c] hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                <Calendar size={14} className={`${validationErrors.endDate ? 'text-red-500' : 'text-emerald-500'} shrink-0`} />
                <span className="text-[11px] font-sans font-semibold text-gray-800 dark:text-zinc-200 truncate">
                  {formatDisplayShort(endDate, language)}
                </span>
              </button>

              {validationErrors.endDate && (
                <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {language === 'ko' ? '귀국일을 지정해주세요.' : 'Please enter return date.'}
                </p>
              )}
            </div>
          </div>

          {/* Quick recommendations chips */}
          <div className="pt-1.5">
            <span className="text-[11px] font-bold text-gray-400 dark:text-stone-500 block mb-1.5">{txt.popular_suggestions}</span>
            <div className="flex gap-1.5 flex-wrap">
              {['파리, 프랑스', '도쿄, 일본', '보라카이, 필리핀'].map((place) => {
                const isSelected = destName === place || 
                  (destName.includes('CDG') && place.includes('파리')) || 
                  (destName.includes('NRT') && place.includes('도쿄')) || 
                  (destName.includes('MPH') && place.includes('보라카이'));
                return (
                  <button
                    type="button"
                    key={place}
                    onClick={() => {
                      let name = place;
                      if (language === 'en') {
                        if (place.includes('파리')) name = 'CDG (Charles de Gaulle Airport)';
                        else if (place.includes('도쿄')) name = 'NRT (Narita International Airport)';
                        else if (place.includes('보라카이')) name = 'MPH (Godofredo P. Ramos Airport)';
                      } else {
                        if (place.includes('파리')) name = 'CDG (샤를드골 국제공항)';
                        else if (place.includes('도쿄')) name = 'NRT (나리타 국제공항)';
                        else if (place.includes('보라카이')) name = 'MPH (고도프레도 P. 라모스 공항)';
                      }
                      setDestName(name);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/15'
                        : 'bg-gray-50 dark:bg-[#1e1d2b] text-gray-600 dark:text-zinc-300 border border-gray-100 dark:border-[#262435] hover:bg-gray-100 dark:hover:bg-[#252438]'
                    }`}
                  >
                    {language === 'ko' ? place.split(',')[0] : (place.includes('파리') ? 'Paris' : place.includes('도쿄') ? 'Tokyo' : 'Boracay')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-sans font-bold text-sm py-3 px-4 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 active:scale-98 transition-all duration-200 mt-2 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>{txt.analyzing_btn}</span>
              </>
            ) : (
              <>
                <span className="text-base">🚀</span>
                <span>{txt.analyze_btn}</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* 2. Interactive Analysis Report Output Card */}
      <AnimatePresence mode="wait">
        {report && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-[#1a1924] rounded-[28px] overflow-hidden border border-gray-100 dark:border-[#262435] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col transition-colors duration-300"
          >
            {/* Report Header Grid */}
            <div className="p-5 border-b border-gray-50 dark:border-[#22202e] bg-gray-50/50 dark:bg-[#15141e]/50">
              <div className="flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-lg mb-1.5">
                    ANALYSIS REPORT
                  </span>
                  <h3 className="font-sans font-extrabold text-base text-gray-900 dark:text-zinc-100 tracking-tight truncate">
                    {language === 'ko' 
                      ? `${report.departure} ➔ ${report.destination} 여행 동반 리포트` 
                      : `${report.departure} ➔ ${report.destination} Report`}
                  </h3>
                  <p className="font-sans text-xs text-gray-400 dark:text-stone-500 mt-0.5 flex items-center gap-1.5">
                    <Calendar size={12} />
                    {report.startDate} ~ {report.endDate}
                  </p>
                </div>

                {/* Level Badge */}
                <div className={`px-3 py-1.5 rounded-2xl flex items-center gap-1 shadow-sm font-sans font-extrabold text-[11px] shrink-0 whitespace-nowrap ${getLevelBadgeStyles(report.level).bg}`}>
                  {getLevelBadgeStyles(report.level).icon}
                  <span className="whitespace-nowrap">{language === 'ko' ? report.level : (report.level === '추천' ? 'Highly Recommend' : report.level === '보통' ? 'Moderate' : 'Not Recommended')}</span>
                </div>
              </div>
            </div>

            {/* Recommendation Color Guide / Legend */}
            <div className="px-5 py-3.5 bg-gray-50/20 dark:bg-[#15141e]/25 border-b border-gray-100 dark:border-[#22202e] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <span className="text-[10px] font-bold text-gray-400 dark:text-stone-500 flex items-center gap-1">
                <span>📊</span>
                {language === 'ko' ? '추천도 색상 가이드' : 'Recommendation Color Guide'}
              </span>
              <div className="flex items-center gap-2.5 flex-wrap text-[10px] font-extrabold">
                <div className="flex items-center gap-1.5 bg-emerald-100 border border-emerald-300 text-emerald-950 dark:bg-emerald-950/90 dark:border-emerald-700 dark:text-emerald-50 px-2 py-1 rounded-lg shadow-sm">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-600/20 shadow-xs shrink-0" />
                  <span>{language === 'ko' ? '추천' : 'Good'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-950 dark:bg-amber-950/90 dark:border-amber-700 dark:text-amber-50 px-2 py-1 rounded-lg shadow-sm">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 border border-amber-600/20 shadow-xs shrink-0" />
                  <span>{language === 'ko' ? '보통' : 'Moderate'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-rose-100 border border-rose-300 text-rose-950 dark:bg-rose-950/90 dark:border-rose-700 dark:text-rose-50 px-2 py-1 rounded-lg shadow-sm">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 border border-rose-600/20 shadow-xs shrink-0" />
                  <span>{language === 'ko' ? '나쁨' : 'Bad'}</span>
                </div>
              </div>
            </div>

            {/* Flight Ticket Cost Block */}
            <div className="px-5 pt-5 pb-1.5 bg-white dark:bg-[#1a1924]">
              <div className={`rounded-2xl p-4 border flex flex-col gap-3.5 shadow-sm transition-all duration-300 ${getFlightBoxBg(report.priceLevel)}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100/30 dark:border-zinc-800/25 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base animate-pulse">✈️</span>
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      {txt.report_average_flight}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-gray-400 dark:text-stone-500 bg-white/50 dark:bg-[#15141f]/50 px-1.5 py-0.5 rounded border border-gray-100 dark:border-[#2b2a3c]">{txt.roundtrip_basis}</span>
                  </div>
                </div>

                {/* Route detail */}
                <div className="flex items-start justify-between text-xs font-sans">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-gray-500 dark:text-zinc-400 whitespace-normal break-keep">
                    <span className="font-bold text-gray-700 dark:text-zinc-200 inline-block min-w-0 max-w-full break-keep whitespace-normal text-left">{report.departure}</span>
                    <span className="text-[10px] text-blue-500 shrink-0">🛫</span>
                    <span className="text-stone-300 dark:text-stone-600 shrink-0">→</span>
                    <span className="text-[10px] text-emerald-500 shrink-0">🛬</span>
                    <span className="font-bold text-gray-700 dark:text-zinc-200 inline-block min-w-0 max-w-full break-keep whitespace-normal text-left">{report.destination}</span>
                  </div>
                </div>

                {/* Individual Airline price analysis list */}
                {report.priceAnalysis && (
                  <div className={`rounded-xl p-2.5 border space-y-1.5 transition-colors duration-300 ${getPriceDetailsStyle(report.priceLevel)}`}>
                    <span className="text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                      {language === 'ko' ? '항공사별 상세 분석 가격 목록' : 'Detailed Price Analysis by Airline'}
                    </span>
                    {report.priceAnalysis.flights.map((flight, fIdx) => (
                      <div key={fIdx} className="flex justify-between items-center text-[11px] font-sans">
                        <span className="text-gray-500 dark:text-zinc-400 text-left break-keep whitespace-normal pr-2">{flight.airline}</span>
                        <span className="font-bold text-gray-800 dark:text-zinc-200 shrink-0">
                          {language === 'ko' ? `${flight.price.toLocaleString()}원` : `${flight.price.toLocaleString()} KRW`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Real-time deep linking comparisons */}
                <div className="bg-white/40 dark:bg-[#15141f]/35 rounded-xl p-3 border border-gray-100 dark:border-zinc-800/40 space-y-2.5 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      {language === 'ko' ? '실시간 연동 & 가격 비교 조회' : 'Live Flight Search & Compare'}
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-stone-500 font-medium">
                      {language === 'ko' ? '일정/공항 자동 입력' : 'Auto-fills inputs'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <a
                      href={`https://m-flight.naver.com/flights/international/${getAirportCode(report.departure, 'ICN')}-${getAirportCode(report.destination, 'CDG')}-${report.startDate.replace(/-/g, '')}/${getAirportCode(report.destination, 'CDG')}-${getAirportCode(report.departure, 'ICN')}-${report.endDate.replace(/-/g, '')}?adult=1&isDirect=false`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#2db400] hover:bg-[#259b00] text-white text-center py-2 px-1 sm:px-2 rounded-lg font-sans text-[9px] sm:text-[10.5px] font-extrabold transition-all active:scale-95 flex items-center justify-center gap-0.5 sm:gap-1 shadow-xs whitespace-nowrap tracking-tighter"
                    >
                      <span className="font-sans font-bold">N</span> 네이버 항공
                    </a>
                    <a
                      href={`https://www.google.com/travel/flights?q=Flights%20from%20${getAirportCode(report.departure, 'ICN')}%20to%20${getAirportCode(report.destination, 'CDG')}%20on%20${report.startDate}%20return%20${report.endDate}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#1a73e8] hover:bg-[#155db2] text-white text-center py-2 px-1 sm:px-2 rounded-lg font-sans text-[9px] sm:text-[10.5px] font-extrabold transition-all active:scale-95 flex items-center justify-center gap-0.5 sm:gap-1 shadow-xs whitespace-nowrap tracking-tighter"
                    >
                      <span className="font-sans font-bold">G</span> 구글 플라이트
                    </a>
                    <a
                      href={`https://www.skyscanner.co.kr/transport/flights/${getAirportCode(report.departure, 'ICN').toLowerCase()}/${getAirportCode(report.destination, 'CDG').toLowerCase()}/${report.startDate.substring(2).replace(/-/g, '')}/${report.endDate.substring(2).replace(/-/g, '')}/?adults=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#00d8f6] hover:bg-[#00b2cc] text-[#071b2f] text-center py-2 px-1 sm:px-2 rounded-lg font-sans text-[9px] sm:text-[10.5px] font-extrabold transition-all active:scale-95 flex items-center justify-center gap-0.5 sm:gap-1 shadow-xs whitespace-nowrap tracking-tighter"
                    >
                      <span className="font-sans font-bold">S</span> 스카이스캐너
                    </a>
                  </div>
                </div>

                {/* Main mathematical average */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 pt-1.5 border-t border-gray-100/30 dark:border-zinc-800/20">
                  <div className="font-sans font-extrabold text-[15px] text-gray-900 dark:text-zinc-100">
                    {language === 'ko' ? report.flightPrice : (report.flightPriceEn || report.flightPrice)}
                  </div>
                  <div className="text-[9px] text-blue-500 dark:text-blue-400 font-medium bg-white/40 dark:bg-[#15141f]/30 px-2 py-0.5 rounded border border-gray-100 dark:border-zinc-800/40 max-w-[240px] truncate" title={language === 'ko' ? report.flightSource : (report.flightSourceEn || report.flightSource)}>
                    {txt.source}: {language === 'ko' ? report.flightSource : (report.flightSourceEn || report.flightSource)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bento-style Metric Blocks */}
            <div className="p-5 pt-3 grid grid-cols-2 gap-3 bg-white dark:bg-[#1a1924]">
              {/* Temp Block */}
              <div className={`rounded-2xl p-3.5 border flex flex-col gap-1.5 transition-all duration-300 ${getSubMetricBoxStyles(report.tempLevel)}`}>
                <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Sun size={14} className="text-amber-500" />
                    <span className="text-[10px] font-bold tracking-wide uppercase">{txt.average_temp}</span>
                  </div>
                </div>
                <div className="font-sans font-extrabold text-[15px] text-gray-950 dark:text-white leading-tight">
                  {language === 'ko' ? report.temp : (report.tempEn || report.temp)}
                </div>
                <div className="text-[11px] text-slate-700/80 dark:text-zinc-300/85 mt-0.5">{txt.temp_desc}</div>
              </div>

              {/* Humidity & Wet season */}
              {(() => {
                const combinedHumidityRainyLevel = 
                  report.humidityLevel === '나쁨' || report.rainyLevel === '나쁨'
                    ? '나쁨'
                    : report.humidityLevel === '보통' || report.rainyLevel === '보통'
                    ? '보통'
                    : '추천';
                return (
                  <div className={`rounded-2xl p-3.5 border flex flex-col gap-1.5 transition-all duration-300 ${getSubMetricBoxStyles(combinedHumidityRainyLevel)}`}>
                    <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Droplets size={14} className="text-blue-500" />
                        <span className="text-[10px] font-bold tracking-wide uppercase">{txt.humidity_wet}</span>
                      </div>
                    </div>
                    <div className="font-sans font-extrabold text-[15px] text-gray-950 dark:text-white leading-tight">
                      {report.humidity}
                    </div>
                    <div className="text-[11px] text-slate-700/80 dark:text-zinc-300/85 mt-0.5 truncate">
                      {language === 'ko' ? report.rainySeason : (report.rainySeasonEn || report.rainySeason)}
                    </div>
                  </div>
                );
              })()}

              {/* Tourist Count */}
              <div className={`rounded-2xl p-3.5 border flex flex-col gap-1.5 transition-all duration-300 ${getSubMetricBoxStyles(report.touristLevel)}`}>
                <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-bold tracking-wide uppercase">{txt.average_tourists}</span>
                  </div>
                </div>
                <div className="font-sans font-extrabold text-[14px] text-gray-950 dark:text-white leading-tight truncate">
                  {language === 'ko' ? report.tourists.split('(')[0].trim() : (report.touristsEn ? report.touristsEn.split('(')[0].trim() : '~ 800k')}
                </div>
                <div className="text-[11px] text-slate-700/80 dark:text-zinc-300/85 mt-0.5">
                  {language === 'ko' 
                    ? (report.tourists.includes('(') ? `혼잡도: ${report.tourists.split('(')[1].replace(')', '').replace('혼잡도:', '').trim()}` : '혼잡도 보통')
                    : (report.touristsEn && report.touristsEn.includes('(') ? `Congestion: ${report.touristsEn.split('(')[1].replace(')', '').replace('Congestion:', '').trim()}` : 'Moderate Congestion')}
                </div>
              </div>

              {/* Festivals */}
              <div className="bg-[#1a2b49] border border-[#2c3e5a] text-slate-100 dark:bg-[#0c1524] dark:border-[#1a2b49] rounded-2xl p-3.5 flex flex-col gap-1.5 transition-colors duration-300 shadow-md">
                <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-400">
                  <PartyPopper size={14} className="text-indigo-300 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-wide uppercase">{txt.festivals_count}</span>
                </div>
                <div className="font-sans font-extrabold text-[14px] text-white leading-tight truncate">
                  {report.festivals.length > 0 
                    ? (language === 'ko' ? report.festivals[0].split('(')[0] : (report.festivalsEn ? report.festivalsEn[0].split('(')[0] : 'Music Festival')) 
                    : txt.no_festival}
                </div>
                <div className="text-[11px] text-slate-300/90 dark:text-slate-400 mt-0.5 truncate">
                  {report.festivals.length > 1 
                    ? (language === 'ko' ? `외 ${report.festivals.length - 1}개 축제 개최` : `& ${report.festivals.length - 1} other events`) 
                    : txt.quiet_peaceful}
                </div>
              </div>
            </div>

            {/* Festivals detail list */}
            {report.festivals.length > 0 && (
              <div className="px-5 pb-3 bg-white dark:bg-[#1a1924]">
                <div className="bg-[#1a2b49]/95 text-slate-100 rounded-xl p-3 border border-[#2c3e5a] dark:bg-[#0c1524]/95 dark:border-[#1a2b49]">
                  <span className="text-[10px] font-bold text-indigo-300 dark:text-indigo-300 block mb-1.5 uppercase tracking-wider">
                    {txt.festivals_list_title}
                  </span>
                  <ul className="space-y-1">
                    {(language === 'ko' ? report.festivals : (report.festivalsEn || report.festivals)).map((fest, idx) => (
                      <li key={idx} className="text-[11px] font-sans text-slate-100 dark:text-slate-200 flex items-start gap-1">
                        <span className="text-indigo-300 dark:text-indigo-400 mt-0.5">•</span>
                        <span className="whitespace-normal break-keep text-left">{fest}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* AI Narrative Evaluation */}
            <div className="px-5 pb-5 bg-white dark:bg-[#1a1924]">
              {(() => {
                const styles = getNarrativeBoxStyles(report.level);
                return (
                  <div className={`rounded-2xl p-4 border flex flex-col gap-2 transition-all duration-300 ${styles.container}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`p-1 px-1.5 rounded-lg text-[10px] font-black font-sans ${styles.titleBg}`}>
                        {txt.ai_narrative_title}
                      </span>
                    </div>
                    <p className={`font-sans text-xs leading-relaxed whitespace-pre-line break-keep text-left ${styles.text}`}>
                      {language === 'ko' ? report.description : (report.descriptionEn || report.description)}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* CTA action to transfer to Planner */}
            <div className="p-5 border-t border-gray-50 dark:border-[#22202e] bg-gray-50/50 dark:bg-[#15141e]/50">
              <button
                onClick={() => onSelectDestination?.(report.destination, report.startDate, report.endDate)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-sans font-bold text-xs shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <span>{txt.cta_btn}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Recommended Destinations Showcase */}
      <section className="space-y-3.5">
        <h3 className="font-sans font-extrabold text-base text-gray-800 dark:text-zinc-100 flex items-center gap-2">
          <span className="text-lg">🎉</span>
          <span>{txt.popular_places_title}</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {RECOMMENDED_DESTINATIONS.map((dest, idx) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              onClick={() => handleQuickAnalyze(dest)}
              className="bg-white dark:bg-[#1a1924] rounded-[24px] overflow-hidden shadow-sm hover:shadow-md border border-gray-100 dark:border-[#262435] flex flex-col scale-100 active:scale-[0.99] transition-all cursor-pointer group duration-300"
            >
              {/* Image with overlay rating */}
              <div className="h-[140px] w-full bg-gray-100 dark:bg-[#15141f] relative overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-[#1a1924]/95 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-transparent dark:border-[#2b2a3c]">
                  <Star size={11} className="text-rose-500 fill-rose-500" />
                  <span className="font-sans text-[10px] font-bold text-gray-800 dark:text-zinc-100">{dest.rating}</span>
                </div>
              </div>

              {/* Content info */}
              <div className="p-4 flex flex-col gap-2.5 bg-white dark:bg-[#1a1924] transition-colors duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-sans font-bold text-sm text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {language === 'ko' ? dest.name : (dest.name.includes('파리') ? 'Paris, France' : dest.name.includes('도쿄') ? 'Tokyo, Japan' : 'Boracay, Philippines')}
                    </h4>
                    <p className="font-sans text-[11px] text-gray-400 dark:text-stone-500 mt-0.5 leading-snug line-clamp-1">
                      {language === 'ko' ? dest.description : 'Explore historical locations, seasonal views, and beautiful environments.'}
                    </p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg flex items-center gap-1 border border-transparent dark:border-emerald-900/30">
                    {getWeatherIcon(dest.weatherType)}
                    <span className="font-sans text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{dest.temperature}</span>
                  </div>
                </div>

                {/* Badge Row */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 dark:border-[#22202e]">
                  <div className="bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-transparent dark:border-blue-900/30">
                    <span className="text-[11px]">✈️</span>
                    <span className="font-sans text-[10px] font-bold text-blue-700 dark:text-blue-400">{language === 'ko' ? dest.priceText : '~ $300 Roundtrip'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-extrabold">
                    <span>{txt.analyze_this}</span>
                    <span className="text-xs group-hover:translate-x-0.5 transition-transform duration-200">👉</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Custom Premium Date Picker Modal Overlay */}
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4"
            onClick={() => setIsCalendarOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="bg-white dark:bg-[#1a1924] rounded-t-[32px] sm:rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.22)] max-w-sm w-full p-6 border border-gray-100 dark:border-[#262435] flex flex-col relative overflow-hidden pb-8 sm:pb-6 transition-colors duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Drag Indicator for mobile feel */}
              <div className="w-12 h-1 bg-gray-200 dark:bg-[#2b2a3c] rounded-full mx-auto mb-4 block sm:hidden" />

              {/* Modal Close Button */}
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#252438] text-gray-400 dark:text-stone-500 hover:text-gray-600 dark:hover:text-zinc-200 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Step Header */}
              <div className="mb-4">
                <span className="text-[9px] font-extrabold tracking-widest text-blue-500 dark:text-blue-400 uppercase block mb-1">
                  {txt.calendar_title}
                </span>
                {calendarStep === 'start' ? (
                  <div>
                    <h3 className="font-sans font-extrabold text-base text-gray-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
                      <PlaneTakeoff size={18} className="text-blue-500 animate-pulse" />
                      {txt.calendar_start_prompt}
                    </h3>
                    <p className="font-sans text-[11px] text-gray-400 dark:text-stone-500 mt-0.5">
                      {txt.calendar_start_desc}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-sans font-extrabold text-base text-gray-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
                      <CheckCircle2 size={18} className="text-emerald-500 animate-pulse" />
                      {language === 'ko' ? '언제 돌아올까요? 🏡' : 'When shall we return? 🏡'}
                    </h3>
                    <p className="font-sans text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">
                      {txt.calendar_end_desc} ({formatDisplayShort(startDate)})
                    </p>
                  </div>
                )}
              </div>

              {/* State Progress indicators */}
              <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50/80 dark:bg-[#15141f]/80 p-1 rounded-2xl border border-gray-100 dark:border-[#22202e] transition-colors duration-300">
                <button
                  type="button"
                  onClick={() => setCalendarStep('start')}
                  className={`py-2 px-1 rounded-xl text-center font-sans text-xs font-bold transition-all cursor-pointer ${
                    calendarStep === 'start'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                      : 'text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-[#252438]'
                  }`}
                >
                  🛫 {language === 'ko' ? '출발:' : 'Dep:'} {startDate ? startDate.replace('2026-', '').replace('-', '/') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarStep('end')}
                  className={`py-2 px-1 rounded-xl text-center font-sans text-xs font-bold transition-all cursor-pointer ${
                    calendarStep === 'end'
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/10'
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
                  className="p-1.5 rounded-xl border border-gray-100 dark:border-[#22202e] hover:bg-gray-50 dark:hover:bg-[#222133] text-gray-600 dark:text-stone-400 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="font-sans font-extrabold text-xs text-gray-800 dark:text-zinc-100">
                  {viewDate.getFullYear()}{language === 'ko' ? '년 ' : '- '}{viewDate.getMonth() + 1}{language === 'ko' ? '월' : ''}
                </div>

                <button
                  type="button"
                  onClick={() => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-1.5 rounded-xl border border-gray-100 dark:border-[#22202e] hover:bg-gray-50 dark:hover:bg-[#222133] text-gray-600 dark:text-stone-400 transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Weekday columns */}
              <div className="grid grid-cols-7 text-center gap-1 mb-2">
                {txt.weekdays.map((dayName, index) => (
                  <span
                    key={dayName}
                    className={`font-sans font-bold text-[10px] tracking-wide uppercase ${
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

              {/* Days grid layout */}
              <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                {allCalendarDays.map((day, idx) => {
                  const dayTime = day.date.getTime();
                  const startVal = parseDateString(startDate).getTime();
                  const endVal = parseDateString(endDate).getTime();
                  
                  const isSelectedStart = day.isCurrentMonth && isSameDay(day.date, parseDateString(startDate));
                  const isSelectedEnd = day.isCurrentMonth && isSameDay(day.date, parseDateString(endDate));
                  const isBetween = day.isCurrentMonth && isDateBetween(day.date, parseDateString(startDate), parseDateString(endDate));

                  // Styles configurations
                  let btnStyle = "relative w-8 h-8 flex items-center justify-center text-[11px] font-sans font-bold rounded-full transition-all duration-200 cursor-pointer ";
                  let cellStyle = "relative py-0.5 w-full flex justify-center ";

                  if (!day.isCurrentMonth) {
                    btnStyle += "text-gray-200 dark:text-stone-800 pointer-events-none opacity-30";
                  } else if (isSelectedStart) {
                    btnStyle += "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105 z-10";
                    cellStyle += "bg-blue-100 dark:bg-blue-950/40 rounded-l-full";
                  } else if (isSelectedEnd) {
                    btnStyle += "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-105 z-10";
                    cellStyle += "bg-blue-100 dark:bg-blue-950/40 rounded-r-full";
                  } else if (isBetween) {
                    btnStyle += "text-blue-800 dark:text-blue-300 font-extrabold hover:bg-blue-200 dark:hover:bg-blue-900/30";
                    cellStyle += "bg-blue-100 dark:bg-blue-950/30";
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
                    <div key={`${day.day}-${day.isCurrentMonth}-${idx}`} className={cellStyle}>
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

              {/* Bottom confirmation action */}
              <div className="flex gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="flex-1 bg-gray-50 dark:bg-[#15141f] border border-gray-100 dark:border-[#22202e] hover:bg-gray-100 dark:hover:bg-[#252438] text-gray-600 dark:text-stone-400 font-sans font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  {txt.calendar_cancel}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                >
                  {txt.calendar_select_done}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
