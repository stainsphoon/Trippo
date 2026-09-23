import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Info, X, Sparkles, Building2, Globe, Search, Clock } from 'lucide-react';
import { DestinationSearchItem, DestinationType } from '../types/destination';
import { destinationSearchRepository } from '../services/DestinationSearchRepository';
import { searchInternalDestinations } from '../services/destinationSearchService';
import { groupAndDeduplicateDestinations } from '../utils/destinationGrouping';

export interface GooglePlaceInputProps {
  value: string;
  address?: string;
  placeId?: string;
  onChange: (
    value: string,
    address?: string,
    latLng?: { lat: number; lng: number },
    placeId?: string,
    item?: DestinationSearchItem | null
  ) => void;
  placeholder?: string;
  language?: 'ko' | 'en';
  icon?: React.ReactNode;
  inputClassName?: string;
  onSelectDestination?: (item: DestinationSearchItem) => void;
}

export const POPULAR_DESTINATION_TAGS = [
  { id: 'kr-jeonju', nameKo: '전주', nameEn: 'Jeonju', subKo: '전북특별자치도 · 대한민국', subEn: 'Jeonbuk · South Korea', type: 'city' as DestinationType },
  { id: 'jp-tokyo', nameKo: '도쿄', nameEn: 'Tokyo', subKo: '도쿄도 · 일본', subEn: 'Tokyo Metropolis · Japan', type: 'city' as DestinationType },
  { id: 'kr-jeju-island', nameKo: '제주도', nameEn: 'Jeju Island', subKo: '제주특별자치도 · 대한민국', subEn: 'Jeju Province · South Korea', type: 'island' as DestinationType },
  { id: 'ph-boracay', nameKo: '보라카이', nameEn: 'Boracay', subKo: '아클란 · 필리핀', subEn: 'Aklan · Philippines', type: 'tourism_region' as DestinationType },
  { id: 'fr-paris', nameKo: '파리', nameEn: 'Paris', subKo: '일드프랑스 · 프랑스', subEn: 'Île-de-France · France', type: 'city' as DestinationType },
  { id: 'kr-seoul', nameKo: '서울', nameEn: 'Seoul', subKo: '서울특별시 · 대한민국', subEn: 'Seoul · South Korea', type: 'city' as DestinationType },
];

export const renderTypeIcon = (type?: DestinationType) => {
  switch (type) {
    case 'city':
      return <Building2 size={14} className="text-blue-500 shrink-0" />;
    case 'island':
    case 'tourism_region':
      return <Sparkles size={14} className="text-amber-500 shrink-0" />;
    case 'country':
      return <Globe size={14} className="text-emerald-500 shrink-0" />;
    default:
      return <MapPin size={14} className="text-purple-500 shrink-0" />;
  }
};

export const renderTypeLabel = (type?: DestinationType, isKo: boolean = true) => {
  switch (type) {
    case 'city':
      return isKo ? '도시' : 'City';
    case 'island':
      return isKo ? '섬·해양' : 'Island';
    case 'tourism_region':
      return isKo ? '여행권역' : 'Region';
    case 'country':
      return isKo ? '국가' : 'Country';
    case 'admin_area':
      return isKo ? '지역' : 'State';
    case 'district':
      return isKo ? '지역' : 'District';
    default:
      return isKo ? '목적지' : 'Destination';
  }
};

interface DestinationGroupItemProps {
  group: DestinationSearchItem;
  onSelect: (item: DestinationSearchItem) => void;
  isKo: boolean;
}

const DestinationGroupItemComponent: React.FC<DestinationGroupItemProps> = ({ group, onSelect, isKo }) => {
  const rec = group.recommendedItem;
  const alts = group.alternatives || [];

  if (!rec) return null;

  const recSearchItem: DestinationSearchItem = {
    source: rec.source,
    destinationId: rec.destinationId,
    externalId: rec.externalId,
    type: rec.type,
    displayName: rec.label,
    secondaryText: isKo ? 'Trippo 추천 여행지' : 'Trippo Recommended',
    rawDestination: rec.rawDestination
  };

  return (
    <div className="border-b border-gray-100 dark:border-zinc-800/60 last:border-0 bg-blue-50/20 dark:bg-blue-900/10">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-blue-500 uppercase px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">
            {isKo ? 'Trippo 추천' : 'Trippo Recommended'}
          </span>
          {group.groupingReason && (
            <span className="text-[10px] text-gray-400">
              {isKo ? '관련 범위 연관' : 'Related Scope'}
            </span>
          )}
        </div>
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); }}
          onClick={() => onSelect(recSearchItem)}
          className="w-full text-left p-3 bg-white dark:bg-zinc-900 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm transition-all flex items-start gap-3 cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-900/30"
        >
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 shrink-0 mt-0.5">
            {renderTypeIcon(rec.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 dark:text-zinc-100 truncate">
                {rec.label}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                {renderTypeLabel(rec.type, isKo)}
              </span>
            </div>
            <p className="text-[11px] font-medium text-gray-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {rec.type === 'tourism_region'
                ? (isKo ? '섬과 주요 시내를 포함해 대표 여행권역으로 분석해요' : 'Analyzes the region including islands and downtown.')
                : rec.type === 'island'
                ? (isKo ? '섬의 위치와 기후를 중심으로 분석해요.' : 'Analyzes the island location and climate.')
                : (isKo ? '해당 행정구역과 시내를 중심으로 분석해요.' : 'Analyzes the specific administrative area.')
              }
            </p>
          </div>
        </button>
      </div>

      {alts.length > 0 && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 mb-1.5 px-1 mt-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">
              {isKo ? '정확한 범위 선택' : 'Specific Scope'}
            </span>
          </div>
          <div className="space-y-1">
            {alts.map((alt, aIdx) => {
              const altSearchItem: DestinationSearchItem = {
                source: alt.source,
                destinationId: alt.destinationId,
                externalId: alt.externalId,
                type: alt.type,
                displayName: alt.label,
                secondaryText: renderTypeLabel(alt.type, isKo),
                rawDestination: alt.rawDestination
              };
              return (
                <button
                  key={aIdx}
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); }}
                  onClick={() => onSelect(altSearchItem)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/80 dark:hover:bg-zinc-800/80 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="font-medium text-gray-700 dark:text-zinc-300">
                    {alt.label}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {renderTypeLabel(alt.type, isKo)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const hasIncompleteJamo = (str: string): boolean => {
  const normalized = str.normalize('NFC');
  return /[\u3130-\u318F]/.test(normalized);
};

export const GooglePlaceInput: React.FC<GooglePlaceInputProps> = ({
  value,
  address,
  placeId,
  onChange,
  placeholder,
  language = 'ko',
  icon,
  inputClassName = '',
  onSelectDestination,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [searchState, setSearchState] = useState<
    | 'idle'
    | 'searching'
    | 'internal_results'
    | 'external_searching'
    | 'results'
    | 'empty'
    | 'empty_verified'
    | 'external_error'
    | 'unsupported_type'
    | 'error'
  >('idle');
  const [items, setItems] = useState<DestinationSearchItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<DestinationSearchItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isImeComposing, setIsImeComposing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSequenceRef = useRef<number>(0);
  const isImeComposingRef = useRef<boolean>(false);
  const parentUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const compositionSessionIdRef = useRef<string>('');
  const inputValueRef = useRef<string>(value || '');
  const resolvingExternalIdRef = useRef<string | null>(null);

  if (!compositionSessionIdRef.current) {
    compositionSessionIdRef.current = Math.random().toString(36).substring(2, 9);
  }

  const isKo = language === 'ko';
  const lang: 'ko' | 'en' = isKo ? 'ko' : 'en';

  const logTrace = (params: {
    eventType: string;
    eventValue?: string;
    nativeIsComposing?: boolean | null;
    debounceScheduled?: boolean | null;
    debounceCancelled?: boolean | null;
    autocompleteTriggered?: boolean | null;
    autocompleteQuery?: string | null;
    responseAccepted?: boolean | null;
    responseDiscardReason?: string | null;
  }) => {
    const timestamp = Date.now();
    console.log(`[DESTINATION_INPUT_TRACE]`, {
      eventType: params.eventType,
      eventTimestamp: timestamp,
      eventValue: params.eventValue !== undefined ? params.eventValue : inputValueRef.current,
      reactQueryState: inputValueRef.current,
      nativeEventIsComposing: params.nativeIsComposing !== undefined ? params.nativeIsComposing : null,
      reactIsComposingState: isImeComposing,
      compositionSessionId: compositionSessionIdRef.current,
      debounceScheduled: params.debounceScheduled !== undefined ? params.debounceScheduled : null,
      debounceCancelled: params.debounceCancelled !== undefined ? params.debounceCancelled : null,
      autocompleteTriggered: params.autocompleteTriggered !== undefined ? params.autocompleteTriggered : null,
      autocompleteQuery: params.autocompleteQuery !== undefined ? params.autocompleteQuery : null,
      requestSequence: requestSequenceRef.current,
      responseAccepted: params.responseAccepted !== undefined ? params.responseAccepted : null,
      responseDiscardReason: params.responseDiscardReason || null,
    });
  };

  useEffect(() => {
    setInputValue(value || '');
    inputValueRef.current = value || '';
  }, [value]);

  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('trippo_recent_destinations');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [isOpen, items]);

  // Clean up timers and abort active requests on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (parentUpdateTimerRef.current) {
        clearTimeout(parentUpdateTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('component_unmounted');
      }
    };
  }, []);

  const executeDestinationAutocomplete = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setSearchState('idle');
      setItems([]);
      return;
    }

    const currentSeq = ++requestSequenceRef.current;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('new_request_started');
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = `req_${currentSeq}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[DESTINATION_ABORT_TRACE] Created Request:`, {
      requestId,
      abortControllerId: currentSeq,
      createdAt: Date.now(),
      query: trimmed
    });

    const isCjk = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/i.test(trimmed);
    const minExternalLength = isCjk ? 2 : 3;

    // Check internal coverage
    const internalItems = searchInternalDestinations(trimmed, 8, lang);

    // Exact Match check
    const normalizedQuery = trimmed.toLowerCase().replace(/\s+/g, '');
    const hasExactMatch = internalItems.some(item => {
      const namesList = [
        item.names?.ko,
        item.names?.en,
        item.names?.local,
        item.displayName,
        item.names?.displayKo,
        item.names?.displayEn,
        item.names?.officialKo,
        item.names?.officialEn
      ];
      return namesList.some(name => {
        if (!name) return false;
        return name.trim().toLowerCase().replace(/\s+/g, '') === normalizedQuery;
      });
    });

    // Complete Coverage check
    const groupedInternal = groupAndDeduplicateDestinations(internalItems, trimmed);
    const hasCompleteGrouping = groupedInternal.some(item => {
      if (!item.isGroup) return false;
      const types = new Set<string>();
      if (item.recommendedItem?.type) types.add(item.recommendedItem.type);
      if (item.alternatives) {
        item.alternatives.forEach(alt => {
          if (alt.type) types.add(alt.type);
        });
      }
      return types.has('city') && types.has('island');
    });

    const isExternalFallbackRequired = !(hasExactMatch || hasCompleteGrouping);
    const incomplete = hasIncompleteJamo(trimmed);
    const isExternalEligible = !incomplete && isExternalFallbackRequired && trimmed.length >= minExternalLength;

    if (isExternalEligible) {
      setSearchState('external_searching');
    } else {
      setSearchState('searching');
    }

    const searchStartedAt = Date.now();
    logTrace({ eventType: 'executeDestinationAutocomplete started', eventValue: trimmed });

    try {
      const res = await destinationSearchRepository.autocomplete(
        trimmed,
        lang,
        8,
        false,
        false,
        controller.signal
      );

      if (requestSequenceRef.current !== currentSeq) {
        logTrace({ eventType: 'responseAccepted', eventValue: trimmed, responseAccepted: false, responseDiscardReason: 'stale_sequence' });
        return;
      }

      logTrace({ eventType: 'responseAccepted', eventValue: trimmed, responseAccepted: true });

      const internalCompleteAt = Date.now();
      console.log(`[DESTINATION_PERFORMANCE_TRACE] q="${trimmed}" internalCompleteAt=${internalCompleteAt - searchStartedAt}ms`);

      if (res.items && res.items.length > 0) {
        setItems(res.items);
        if (res.status === 'results_internal') {
          setSearchState('internal_results');
        } else {
          setSearchState('results');
        }
      } else {
        setItems([]);
        if (res.status === 'empty_verified') {
          setSearchState('empty_verified');
        } else if (res.status === 'external_error') {
          setSearchState('external_error');
        } else if (res.status === 'unsupported_type') {
          setSearchState('unsupported_type');
        } else {
          setSearchState('empty_verified');
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`[DESTINATION_ABORT_TRACE] Aborted Request:`, {
          requestId,
          abortControllerId: currentSeq,
          abortedAt: Date.now(),
          abortReason: 'new_request_started_or_cleanup',
          query: trimmed
        });
        return;
      }
      if (requestSequenceRef.current !== currentSeq) {
        return;
      }
      console.error('Destination search error:', err);
      setSearchState('external_error');
    }
  };

  const triggerAutocompleteWithDebounce = (val: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = val.trim();
    if (trimmed.length === 0) {
      setSearchState('idle');
      setItems([]);
      return;
    }

    const AUTOCOMPLETE_DEBOUNCE_MS = isImeComposing ? 350 : 250;
    logTrace({ eventType: 'useEffect execution', debounceScheduled: true, eventValue: trimmed });

    debounceTimerRef.current = setTimeout(() => {
      const querySnapshot = inputValueRef.current.trim();
      executeDestinationAutocomplete(querySnapshot);
    }, AUTOCOMPLETE_DEBOUNCE_MS);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    logTrace({ eventType: 'onChange', eventValue: val, nativeIsComposing: (e.nativeEvent as any).isComposing });
    setInputValue(val);
    setIsOpen(true);

    const wasEmpty = !inputValue || inputValue.trim() === '';
    const isEmpty = !val || val.trim() === '';

    if (wasEmpty !== isEmpty || isEmpty) {
      onChange(val, '', undefined, '', null);
    }

    triggerAutocompleteWithDebounce(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    const maxIndex = items.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
        break;
      case 'Enter':
        if (focusedIndex >= 0 && focusedIndex <= maxIndex) {
          e.preventDefault();
          const selected = items[focusedIndex];
          if (selected.isGroup && selected.recommendedItem) {
            handleSelect({
              source: selected.recommendedItem.source,
              destinationId: selected.recommendedItem.destinationId,
              externalId: selected.recommendedItem.externalId,
              type: selected.recommendedItem.type,
              displayName: selected.recommendedItem.label,
              secondaryText: renderTypeLabel(selected.recommendedItem.type, isKo),
              rawDestination: selected.recommendedItem.rawDestination
            });
          } else {
            handleSelect(selected);
          }
        } else {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          const querySnapshot = inputValueRef.current.trim();
          executeDestinationAutocomplete(querySnapshot);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = async (item: DestinationSearchItem) => {
    if (item.source === 'external' && item.externalId) {
      if (resolvingExternalIdRef.current === item.externalId) {
        console.log(`[DOUBLE_TAP_PREVENT] Already resolving externalId: ${item.externalId}`);
        return;
      }
    }

    setInputValue(item.displayName);
    setIsOpen(false);

    try {
      const updated = [item, ...recentSearches.filter((r) => r.displayName !== item.displayName)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('trippo_recent_destinations', JSON.stringify(updated));
    } catch (e) {
      // Ignore
    }

    if (item.source === 'external' && item.externalId) {
      resolvingExternalIdRef.current = item.externalId;

      const pendingItem: DestinationSearchItem = {
        ...item,
        isResolving: true
      };

      onChange(
        item.displayName,
        item.secondaryText,
        undefined,
        item.externalId,
        pendingItem
      );
      if (onSelectDestination) onSelectDestination(pendingItem);

      try {
        const resolved = await destinationSearchRepository.resolve(item.externalId, lang, item.displayName);
        
        if (resolvingExternalIdRef.current !== item.externalId) {
          console.log(`[RESOLVE_STALE_DISCARD] Discard stale resolve for externalId: ${item.externalId}`);
          return;
        }

        let secondaryParts: string[] = [];
        if (resolved.hierarchy.admin2NameKo || resolved.hierarchy.admin2NameEn) {
          secondaryParts.push(
            isKo
              ? resolved.hierarchy.admin2NameKo || resolved.hierarchy.admin2NameEn!
              : resolved.hierarchy.admin2NameEn || resolved.hierarchy.admin2NameKo!
          );
        }
        if (resolved.hierarchy.admin1NameKo || resolved.hierarchy.admin1NameEn) {
          secondaryParts.push(
            isKo
              ? resolved.hierarchy.admin1NameKo || resolved.hierarchy.admin1NameEn!
              : resolved.hierarchy.admin1NameEn || resolved.hierarchy.admin1NameKo!
          );
        }
        if (resolved.hierarchy.countryNameKo || resolved.hierarchy.countryNameEn) {
          secondaryParts.push(
            isKo
              ? resolved.hierarchy.countryNameKo || resolved.hierarchy.countryNameEn!
              : resolved.hierarchy.countryNameEn || resolved.hierarchy.countryNameKo!
          );
        }
        const resolvedSecondaryText = secondaryParts.join(' · ') || (isKo ? '여행지' : 'Destination');

        const resolvedItem: DestinationSearchItem = {
          source: 'internal',
          destinationId: resolved.id,
          type: resolved.type,
          displayName: isKo ? resolved.names.ko : resolved.names.en,
          secondaryText: resolvedSecondaryText,
          names: resolved.names,
          countryCode: resolved.hierarchy.countryCode,
          timezoneId: resolved.timezoneId,
          location: resolved.location,
          rawDestination: resolved,
          isResolving: false
        };

        onChange(
          resolvedItem.displayName,
          resolvedItem.secondaryText,
          resolvedItem.location,
          resolvedItem.destinationId,
          resolvedItem
        );
        if (onSelectDestination) onSelectDestination(resolvedItem);
      } catch (err) {
        console.error('[RESOLVE_FAILED]', err);
        if (resolvingExternalIdRef.current === item.externalId) {
          const errorItem: DestinationSearchItem = {
            ...item,
            isResolving: false,
            isResolveError: true
          };
          onChange(item.displayName, item.secondaryText, undefined, item.externalId, errorItem);
          if (onSelectDestination) onSelectDestination(errorItem);
        }
      } finally {
        if (resolvingExternalIdRef.current === item.externalId) {
          resolvingExternalIdRef.current = null;
        }
      }
    } else {
      resolvingExternalIdRef.current = null;
      onChange(item.displayName, item.secondaryText, item.location, item.destinationId, item);
      if (onSelectDestination) onSelectDestination(item);
    }
  };

  const handleSelectPopularTag = (tag: typeof POPULAR_DESTINATION_TAGS[0]) => {
    const name = isKo ? tag.nameKo : tag.nameEn;
    const sub = isKo ? tag.subKo : tag.subEn;

    const item: DestinationSearchItem = {
      source: 'internal',
      destinationId: tag.id,
      type: tag.type,
      displayName: name,
      secondaryText: sub,
      names: { ko: tag.nameKo, en: tag.nameEn },
      countryCode: tag.id.startsWith('kr') ? 'KR' : tag.id.startsWith('jp') ? 'JP' : tag.id.startsWith('ph') ? 'PH' : 'FR',
    };

    resolvingExternalIdRef.current = null;
    setInputValue(name);
    setIsOpen(false);
    onChange(name, sub, undefined, tag.id, item);
    if (onSelectDestination) onSelectDestination(item);
  };

  const handleClear = () => {
    setInputValue('');
    setItems([]);
    setSearchState('idle');
    setIsOpen(true);
    onChange('', '', undefined, '', null);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-gray-400 dark:text-zinc-500">
          {icon || <Search size={16} />}
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true);
            logTrace({ eventType: 'onFocus' });
          }}
          onBlur={() => {
            logTrace({ eventType: 'onBlur' });
          }}
          onCompositionStart={() => {
            setIsImeComposing(true);
            isImeComposingRef.current = true;
            logTrace({ eventType: 'onCompositionStart', nativeIsComposing: true });
          }}
          onCompositionEnd={(e) => {
            setIsImeComposing(false);
            isImeComposingRef.current = false;
            setInputValue(e.currentTarget.value);
            logTrace({ eventType: 'onCompositionEnd', eventValue: e.currentTarget.value, nativeIsComposing: false });
          }}
          onInput={(e) => {
            logTrace({ eventType: 'onInput', eventValue: e.currentTarget.value, nativeIsComposing: (e.nativeEvent as any).isComposing });
          }}
          placeholder={
            placeholder ||
            (isKo ? '방문 도시, 지역 또는 섬 입력 (예: 전주, 도쿄, 제주도, 보라카이)' : 'Search city, island or region (e.g., Jeonju, Tokyo, Boracay)')
          }
          className={`w-full pl-10 pr-9 py-3 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 dark:border-zinc-700/80 bg-white dark:bg-[#181724] text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all ${inputClassName}`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={isKo ? "여행 목적지 검색" : "Search travel destination"}
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-[#1c1b2b] border border-gray-200 dark:border-zinc-700/80 rounded-2xl shadow-xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar transition-all">
          {searchState === 'searching' && (
            <div className="p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <Loader2 size={16} className="animate-spin" />
                <span>
                  {isKo ? '목적지를 찾고 있어요...' : 'Finding destination...'}
                </span>
              </div>
            </div>
          )}

          {searchState === 'external_searching' && (
            <div className="p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <Loader2 size={16} className="animate-spin" />
                <span>
                  {isKo ? `“${inputValue}”을 찾고 있어요...` : `Searching for "${inputValue}"...`}
                </span>
              </div>
            </div>
          )}

          {searchState === 'idle' && inputValue.trim().length === 0 && (
            <div className="p-3.5 space-y-3">
              {recentSearches.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    <Clock size={12} />
                    <span>{isKo ? '최근 검색한 목적지' : 'Recent Searches'}</span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((item, idx) => (
                      <button
                        key={`${item.displayName}-${idx}`}
                        type="button"
                        onPointerDown={(e) => { e.preventDefault(); }}
                        onClick={() => handleSelect(item)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-gray-50 dark:hover:bg-zinc-800/60 flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-semibold text-gray-800 dark:text-zinc-200">
                          {item.displayName}
                        </span>
                        <span className="text-[10px] text-gray-400">{item.secondaryText}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase block">
                  {isKo ? '🔥 인기 추천 목적지' : '🔥 Popular Destinations'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_DESTINATION_TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onPointerDown={(e) => { e.preventDefault(); }}
                      onClick={() => handleSelectPopularTag(tag)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>{renderTypeIcon(tag.type)}</span>
                      <span>{isKo ? tag.nameKo : tag.nameEn}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(searchState === 'results' || searchState === 'internal_results') && (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-800/60">
              <div className="divide-y divide-gray-100 dark:divide-zinc-800/60 overflow-y-auto max-h-64 custom-scrollbar">
                {items.map((item, index) =>
                  item.isGroup ? (
                    <DestinationGroupItemComponent
                      key={`group-${index}`}
                      group={item}
                      onSelect={handleSelect}
                      isKo={isKo}
                    />
                  ) : (
                    <button
                      key={`${item.destinationId || item.externalId || index}`}
                      type="button"
                      onPointerDown={(e) => { e.preventDefault(); }}
                        onClick={() => handleSelect(item)}
                      className={`w-full text-left p-3 transition-all flex items-start gap-3 cursor-pointer group ${
                        index === focusedIndex
                          ? 'bg-blue-50/90 dark:bg-blue-950/50 ring-1 ring-blue-400 dark:ring-blue-500/50'
                          : 'hover:bg-blue-50/60 dark:hover:bg-blue-950/30'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 shrink-0 mt-0.5">
                        {renderTypeIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-zinc-100 truncate">
                            {item.displayName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 shrink-0">
                            {renderTypeLabel(item.type, isKo)}
                          </span>
                        </div>
                        {item.secondaryText && (
                          <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                            {item.secondaryText}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                )}
              </div>
              {items.some((item) => item.source === 'external') && (
                <div className="px-3.5 py-1.5 bg-gray-50/50 dark:bg-zinc-900/10 flex items-center justify-end text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                  Powered by Google
                </div>
              )}
            </div>
          )}

          {(searchState === 'empty' || searchState === 'empty_verified') && (
            <div className="p-4 text-center space-y-1.5">
              <Info size={18} className="mx-auto text-gray-400 dark:text-zinc-500" />
              <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 leading-relaxed">
                {isKo
                  ? '여행지를 찾지 못했어요. 도시, 국가, 지역 또는 섬 이름으로 검색해 주세요.'
                  : 'No matching results found. Please search again by city, country, island, or region name.'}
              </p>
            </div>
          )}

          {searchState === 'external_error' && (
            <div className="p-4 text-center space-y-2">
              <Info size={18} className="mx-auto text-amber-500" />
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 leading-relaxed">
                {isKo
                  ? '지역 검색 서비스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
                  : 'We couldn’t load the location search service. Please try again shortly.'}
              </p>
              <button
                type="button"
                onClick={() => executeDestinationAutocomplete(inputValue.trim())}
                className="mt-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                {isKo ? '다시 검색' : 'Try again'}
              </button>
            </div>
          )}

          {searchState === 'unsupported_type' && (
            <div className="p-4 text-center space-y-1.5">
              <Info size={18} className="mx-auto text-blue-500" />
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 leading-relaxed">
                {isKo
                  ? '현재 Trippo는 도시, 지역 및 섬 단위 여행만 지원합니다. (선택한 장소는 지원하지 않는 유형입니다)'
                  : 'Trippo currently only supports city, region, and island travel. (Selected location is an unsupported type)'}
              </p>
            </div>
          )}

          {searchState === 'error' && (
            <div className="p-4 text-center space-y-1.5">
              <Info size={18} className="mx-auto text-red-500" />
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 leading-relaxed">
                {errorMessage ||
                  (isKo
                    ? '목적지 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
                    : 'Failed to retrieve destination details. Please try again.')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GooglePlaceInput;
