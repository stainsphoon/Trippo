import React, { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Loader2, Info, X } from 'lucide-react';

interface GooglePlaceInputProps {
  value: string;
  address?: string;
  placeId?: string;
  onChange: (value: string, address?: string, latLng?: { lat: number; lng: number }, placeId?: string) => void;
  placeholder?: string;
  language?: 'ko' | 'en';
  icon?: React.ReactNode;
  inputClassName?: string;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

interface CacheEntry {
  name: string;
  address?: string;
  latLng?: { lat: number; lng: number };
  types?: string[];
}

// Global client-side memory cache for place details to satisfy:
// "DB에는 place_id, 이름, 좌표만 저장하고 이후에는 저장된 정보를 최대한 재사용"
// Avoids making redundant Google Places Detail API calls for already-fetched/stored locations!
const placeDetailsCache: Record<string, CacheEntry> = {};

// 1. Simple input component when API Key is missing (No Hooks from @vis.gl/react-google-maps are called here)
function SimplePlaceInput({
  value,
  onChange,
  placeholder,
  language = 'ko',
  icon,
  inputClassName,
}: Omit<GooglePlaceInputProps, 'address'>) {
  const [inputValue, setInputValue] = useState(value);
  const [showKeyGuide, setShowKeyGuide] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const specificGuide = getSpecificLocationGuide(inputValue || value, language);

  return (
    <div className="space-y-1.5 w-full">
      <div className="relative group">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          className={`w-full bg-white dark:bg-[#181724] rounded-xl border border-gray-200 dark:border-zinc-700/80 pl-10 pr-9 py-3 text-sm font-sans text-gray-800 dark:text-text-primary placeholder:text-gray-400 dark:placeholder:text-zinc-500 shadow-sm hover:border-blue-400 dark:hover:border-blue-600 focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 ${inputClassName || ''}`}
          placeholder={placeholder || (language === 'ko' ? '장소 또는 위치를 입력하세요' : 'Enter place or location')}
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
          {icon || <MapPin size={16} />}
        </div>
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              onChange('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {specificGuide && (
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-700 dark:text-blue-300 rounded-xl flex gap-1.5 leading-normal">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>{specificGuide}</span>
        </div>
      )}
      
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2 items-start">
        <Info size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-800 dark:text-amber-300 font-sans leading-relaxed flex-1">
          <span>
            {language === 'ko'
              ? '구글맵 기준 실시간 장소 검색을 사용하려면 API 키를 입력해 주세요.'
              : 'Please enter a Google Maps API Key to enable real-time location search.'}
          </span>
          <button
            type="button"
            onClick={() => setShowKeyGuide(!showKeyGuide)}
            className="text-blue-500 dark:text-blue-400 font-semibold underline hover:text-blue-600 ml-1"
          >
            {language === 'ko' ? '설정 방법 보기' : 'Show setup instructions'}
          </button>
          
          {showKeyGuide && (
            <div className="mt-2 p-2 bg-white dark:bg-[#1f1e2d] rounded-lg border border-amber-500/10 text-[10px] space-y-1 text-gray-600 dark:text-stone-300">
              <p><strong>1단계:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">API 키 받기</a></p>
              <p><strong>2단계:</strong> 우측 상단 ⚙️ 아이콘 클릭 → <strong>Secrets</strong> → <code>GOOGLE_MAPS_PLATFORM_KEY</code> 이름으로 키 추가</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getSpecificLocationGuide(name: string, language: 'ko' | 'en'): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  
  // Specific check for Narita Airport without Terminal
  if ((lower.includes('narita') || lower.includes('나리타')) && 
      (lower.includes('airport') || lower.includes('공항')) && 
      !lower.includes('terminal') && !lower.includes('터미널') && !lower.includes('제')) {
    return language === 'ko' 
      ? "나리타 공항 검색 시, 가능한 한 구체적인 터미널(예: Narita Airport Terminal 2 / 나리타 공항 제2터미널)을 선택해 주세요."
      : "When searching for Narita Airport, please select a specific terminal (e.g., Narita Airport Terminal 2) for accurate public transit directions.";
  }
  
  // General airport check without Terminal
  if ((lower.includes('airport') || lower.includes('공항')) && 
      !lower.includes('terminal') && !lower.includes('터미널') && !lower.includes('제')) {
    return language === 'ko'
      ? "공항 검색 시, 정확한 대중교통 경로 조회를 위해 구체적인 터미널(예: Terminal 1, Terminal 2)을 선택해 주세요."
      : "For airports, please select a specific terminal (e.g., Terminal 1, Terminal 2) for precise transit routing.";
  }

  // General terminal check
  if (lower.includes('terminal') || lower.includes('터미널')) {
    return null; // already specific
  }

  // Train station, Bus terminal, Shopping mall, Theme park, University check
  const hasKeywords = 
    lower.includes('station') || lower.includes('역') || 
    lower.includes('bus') || lower.includes('버스') ||
    lower.includes('mall') || lower.includes('쇼핑몰') || lower.includes('아울렛') || lower.includes('outlet') ||
    lower.includes('theme park') || lower.includes('테마파크') || lower.includes('disney') || lower.includes('디즈니') || lower.includes('universal studio') || lower.includes('유니버셜') ||
    lower.includes('university') || lower.includes('대학') || lower.includes('campus') || lower.includes('캠퍼스');

  if (hasKeywords) {
    return language === 'ko'
      ? "기차역, 버스터미널, 쇼핑몰, 테마파크, 대학 캠퍼스 등 대형 장소는 대표 좌표 대신 실제 세부 구역이나 역 단위를 선택하시면 정확한 경로가 계산됩니다."
      : "For stations, bus terminals, malls, theme parks, and campuses, selecting a specific station or sub-area rather than the general coordinate provides accurate transit routes.";
  }

  return null;
}

// 2. Full autocomplete input component when API Key is present (Safe to call hooks from @vis.gl/react-google-maps)
function GooglePlaceInputWithMaps({
  value,
  address,
  placeId,
  onChange,
  placeholder,
  language = 'ko',
  icon,
  inputClassName,
}: GooglePlaceInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const specificGuide = getSpecificLocationGuide(inputValue || value, language);

  const placesLib = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep internal state in sync with prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch types on mount/prop change for warnings
  useEffect(() => {
    if (placeId) {
      const cacheKey = `${placeId}_${language}`;
      if (placeDetailsCache[cacheKey]?.types) {
        setSelectedTypes(placeDetailsCache[cacheKey].types || []);
      } else if (placesLib && hasValidKey) {
        const place = new placesLib.Place({ id: placeId });
        place.fetchFields({ fields: ['types'] }).then(() => {
          const types = place.types || [];
          setSelectedTypes(types);
          if (placeDetailsCache[cacheKey]) {
            placeDetailsCache[cacheKey].types = types;
          } else {
            placeDetailsCache[cacheKey] = { name: value, address, types };
          }
        }).catch(err => console.error("Error fetching place types on mount:", err));
      }
    } else {
      setSelectedTypes([]);
    }
  }, [placeId, placesLib, hasValidKey, language]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Autocomplete Service
  useEffect(() => {
    if (placesLib) {
      setAutocompleteService(new placesLib.AutocompleteService());
    }
  }, [placesLib]);

  // Fetch suggestions as user types
  useEffect(() => {
    // Requirements:
    // 1. 입력 후 300~500ms debounce 적용 -> 400ms debounce duration chosen
    // 2. 사용자가 3자 이상 입력했을 때만 Autocomplete 호출 -> length >= 3
    if (!autocompleteService || !inputValue.trim() || !isOpen || inputValue.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      setIsLoading(true);
      autocompleteService.getPlacePredictions(
        {
          input: inputValue,
          language: language === 'ko' ? 'ko' : 'en',
        },
        (predictions, status) => {
          setIsLoading(false);
          if (status === 'OK' && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 400); // 400ms Debounce

    return () => clearTimeout(delayDebounce);
  }, [inputValue, autocompleteService, isOpen, language]);

  const handleSelectPrediction = async (prediction: google.maps.places.AutocompletePrediction) => {
    setIsOpen(false);
    setIsLoading(true);
    setInputValue(prediction.structured_formatting.main_text);
    const placeId = prediction.place_id;

    // "DB에는 place_id, 이름, 좌표만 저장하고 이후에는 저장된 정보를 최대한 재사용"
    // Check our client-side memory cache first to avoid calling the Google Place details fetch
    const cacheKey = `${placeId}_${language}`;
    if (placeDetailsCache[cacheKey]) {
      const cached = placeDetailsCache[cacheKey];
      setSelectedTypes(cached.types || []);
      onChange(cached.name, cached.address, cached.latLng, placeId);
      setIsLoading(false);
      return;
    }
    
    try {
      if (placesLib) {
        // Place Details is called ONLY when the user selects a suggestion (clicked/tapped)
        const place = new placesLib.Place({ 
          id: placeId,
          requestedLanguage: language === 'ko' ? 'ko' : 'en',
        });
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'types'],
        });

        const rawDisplayName = typeof place.displayName === 'string'
          ? place.displayName
          : (place.displayName as any)?.text;

        let name = rawDisplayName || prediction.structured_formatting.main_text;
        let formattedAddress = place.formattedAddress || prediction.description;

        // If in English mode, avoid overriding English prediction with Korean rawDisplayName / address
        if (language === 'en') {
          const hasKoreanInName = /[\u3131-\u318E\uAC00-\uD7A3]/.test(name);
          const predMain = prediction.structured_formatting.main_text;
          const hasKoreanInPred = /[\u3131-\u318E\uAC00-\uD7A3]/.test(predMain);
          if (hasKoreanInName && !hasKoreanInPred && predMain) {
            name = predMain;
          }

          const hasKoreanInAddr = /[\u3131-\u318E\uAC00-\uD7A3]/.test(formattedAddress);
          const predDesc = prediction.description;
          const hasKoreanInDesc = /[\u3131-\u318E\uAC00-\uD7A3]/.test(predDesc);
          if (hasKoreanInAddr && !hasKoreanInDesc && predDesc) {
            formattedAddress = predDesc;
          }
        }

        setInputValue(name);
        const latLng = place.location
          ? { lat: place.location.lat(), lng: place.location.lng() }
          : undefined;
        const types = place.types || [];

        // Save to cache for maximum reuse
        placeDetailsCache[cacheKey] = { name, address: formattedAddress, latLng, types };
        setSelectedTypes(types);

        onChange(name, formattedAddress, latLng, placeId);
      } else {
        setSelectedTypes([]);
        onChange(prediction.structured_formatting.main_text, prediction.description, undefined, placeId);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      setSelectedTypes([]);
      onChange(prediction.structured_formatting.main_text, prediction.description, undefined, placeId);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine warnings
  const isLowAccuracy = selectedTypes.some(t => 
    ['route', 'intersection', 'locality', 'sublocality', 'administrative_area'].some(low => t === low || t.startsWith(low + '_') || t.includes(low))
  );

  const isNaritaTerminal23 = placeId === 'ChIJ4yM7gZ3zImARsGTFuKlNSQc' || 
    placeId === 'ChIJYd_6WXnzImAR89wPaFU25-8' || 
    (value && value.toLowerCase().includes('narita') && 
     (value.toLowerCase().includes('terminal 2') || value.toLowerCase().includes('terminal 3') || value.toLowerCase().includes('2터미널') || value.toLowerCase().includes('3터미널')) && 
     !value.toLowerCase().includes('station'));

  const isGenericAirportTerminal = !isNaritaTerminal23 && value && (
    value.toLowerCase().includes('airport terminal') || 
    value.toLowerCase().includes('공항 터미널') || 
    value.toLowerCase().includes('공항 제') || 
    (value.toLowerCase().includes('airport') && (value.toLowerCase().includes('t1') || value.toLowerCase().includes('t2') || value.toLowerCase().includes('t3')))
  ) && !value.toLowerCase().includes('station') && !value.toLowerCase().includes('역');

  return (
    <div ref={containerRef} className="relative w-full space-y-1">
      <div className="relative group">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`w-full bg-white dark:bg-[#181724] rounded-xl border border-gray-200 dark:border-zinc-700/80 pl-10 pr-9 py-3 text-sm font-sans text-gray-800 dark:text-text-primary placeholder:text-gray-400 dark:placeholder:text-zinc-500 shadow-sm hover:border-blue-400 dark:hover:border-blue-600 focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 ${inputClassName || ''}`}
          placeholder={placeholder || (language === 'ko' ? '예: 도쿄 타워, 신주쿠역' : 'e.g., Tokyo Tower, Shinjuku Station')}
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
          {icon || <MapPin size={16} />}
        </div>
        {isLoading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : inputValue ? (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              onChange('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Address feedback if selected */}
      {address && !isOpen && (
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 px-1 truncate">
          📍 {address}
        </p>
      )}

      {/* Accuracy policy warnings */}
      {isLowAccuracy && !isOpen && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-300 rounded-xl flex gap-1.5 leading-normal">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>
            {language === 'ko'
              ? '정확한 이동시간 계산을 위해 도로명이나 지역명 대신 실제 건물, 역, 관광지 또는 상세 주소를 선택해 주세요.'
              : 'For accurate travel time calculation, please select an actual building, station, attraction, or detailed address instead of a street or area name.'}
          </span>
        </div>
      )}

      {/* Airport Terminal Transit recommendations */}
      {isNaritaTerminal23 && !isOpen && (
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-700 dark:text-blue-300 rounded-xl space-y-1.5 leading-normal">
          <div className="flex gap-1.5">
            <Info size={12} className="shrink-0 mt-0.5" />
            <span>
              {language === 'ko'
                ? "나리타 공항 제2/3터미널에서 대중교통을 이용하시는 경우, 터미널 건물 대신 실제 공항역인 'Narita Airport Terminal 2·3 Station'을 선택하시면 더 정확한 대중교통 경로와 시간이 계산됩니다."
                : "If you are using public transit at Narita Airport Terminal 2/3, selecting the actual station 'Narita Airport Terminal 2·3 Station' instead of the terminal building will provide more accurate transit routes and times."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(
                "Narita Airport Terminal 2·3 Station", 
                "Japan, 〒286-0104 Chiba, Narita, Furugome, Narita Airport Terminal 2･3 Station, 字古込", 
                { lat: 35.7730734, lng: 140.3874543 }, 
                "ChIJVSqON3bzImARUTDmWTxZGRc"
              );
            }}
            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 active:scale-95 transition-all ml-4 bg-white/40 dark:bg-black/20 px-2 py-1 rounded-md border border-blue-500/20"
          >
            🚉 {language === 'ko' ? '추천 공항역으로 변경하기' : 'Switch to recommended Airport Station'}
          </button>
        </div>
      )}

      {isGenericAirportTerminal && !isOpen && (
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-700 dark:text-blue-300 rounded-xl flex gap-1.5 leading-normal">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>
            {language === 'ko'
              ? '공항 터미널에서 대중교통을 이용하시는 경우, 정확한 대중교통 경로 조회를 위해 터미널 건물 대신 공항 기차역/지하철역 장소를 선택해 주세요.'
              : 'When using public transit from an airport terminal, please select the airport train/subway station instead of the terminal building for accurate transit routing.'}
          </span>
        </div>
      )}

      {/* Specific Location Guidance */}
      {specificGuide && !isOpen && !isLowAccuracy && !isNaritaTerminal23 && !isGenericAirportTerminal && (
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-700 dark:text-blue-300 rounded-xl flex gap-1.5 leading-normal">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>{specificGuide}</span>
        </div>
      )}

      {/* Autocomplete Suggestions Dropdown - Only show if input length >= 3 */}
      {isOpen && (inputValue.trim().length >= 3) && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-[#1f1e2d] border border-gray-100 dark:border-subtle-border rounded-xl shadow-xl divide-y divide-gray-50 dark:divide-white/5 custom-scrollbar overflow-hidden">
          {suggestions.length === 0 && !isLoading ? (
            <div className="px-4 py-3 text-xs text-gray-400 dark:text-zinc-500 font-sans text-center rounded-xl">
              {language === 'ko' ? '검색 결과가 없습니다.' : 'No suggestions found.'}
            </div>
          ) : (
            suggestions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectPrediction(prediction)}
                className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-white/5 flex flex-col gap-0.5 transition-all first:rounded-t-[11px] last:rounded-b-[11px]"
              >
                <span className="font-sans font-bold text-gray-800 dark:text-text-primary truncate">
                  {prediction.structured_formatting.main_text}
                </span>
                <span className="font-sans text-[10px] text-gray-400 dark:text-zinc-500 truncate">
                  {prediction.structured_formatting.secondary_text || prediction.description}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// 3. Exported wrapper that conditionally renders either Simple or Maps version depending on hasValidKey
export default function GooglePlaceInput(props: GooglePlaceInputProps) {
  if (hasValidKey) {
    return <GooglePlaceInputWithMaps {...props} />;
  }
  return <SimplePlaceInput {...props} />;
}
