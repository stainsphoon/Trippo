import React, { useState, useEffect } from 'react';
import { X, MapPin, Building2, Check, RefreshCw } from 'lucide-react';
import { DailyAnchor, Accommodation, LocationAnchor, createAnchorFromAcc } from '../services/accommodationService';
import { Language, translateText } from '../utils/translations';
import GooglePlaceInput from './GooglePlaceInput';

interface DailyAnchorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateIso: string;
  currentAnchor?: DailyAnchor;
  accommodations: Accommodation[];
  onSaveAnchor: (dateIso: string, updatedAnchor: DailyAnchor) => void;
  language?: Language;
}

export default function DailyAnchorModal({
  isOpen,
  onClose,
  dateIso,
  currentAnchor,
  accommodations = [],
  onSaveAnchor,
  language = 'ko'
}: DailyAnchorModalProps) {
  const t = (key: Parameters<typeof translateText>[0], params?: Record<string, string | number>) =>
    translateText(key, language, params);

  const [startLoc, setStartLoc] = useState<LocationAnchor>({
    type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic'
  });

  const [endLoc, setEndLoc] = useState<LocationAnchor>({
    type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic'
  });

  const [noReturnToday, setNoReturnToday] = useState(false);
  const [customStartName, setCustomStartName] = useState('');
  const [customEndName, setCustomEndName] = useState('');

  useEffect(() => {
    if (currentAnchor) {
      setStartLoc(currentAnchor.startLocation || { type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' });
      setEndLoc(currentAnchor.endLocation || { type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' });
      setNoReturnToday(Boolean(currentAnchor.noReturnToday));
      setCustomStartName(currentAnchor.startLocation?.name || '');
      setCustomEndName(currentAnchor.endLocation?.name || '');
    } else {
      setStartLoc({ type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' });
      setEndLoc({ type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' });
      setNoReturnToday(false);
      setCustomStartName('');
      setCustomEndName('');
    }
  }, [currentAnchor, isOpen]);

  if (!isOpen) return null;

  const handleSelectAccommodationStart = (acc: Accommodation) => {
    const anchor = createAnchorFromAcc(acc, 'manual');
    setStartLoc(anchor);
    setCustomStartName(acc.name);
  };

  const handleSelectAccommodationEnd = (acc: Accommodation) => {
    const anchor = createAnchorFromAcc(acc, 'manual');
    setEndLoc(anchor);
    setCustomEndName(acc.name);
    setNoReturnToday(false);
  };

  const handleCustomStartPlaceSelect = (place: { name: string; formatted_address: string; lat: number; lng: number; place_id?: string }) => {
    setStartLoc({
      type: 'custom',
      referenceId: null,
      name: place.name,
      placeId: place.place_id || null,
      address: place.formatted_address,
      latitude: place.lat,
      longitude: place.lng,
      source: 'manual'
    });
    setCustomStartName(place.name);
  };

  const handleCustomEndPlaceSelect = (place: { name: string; formatted_address: string; lat: number; lng: number; place_id?: string }) => {
    setEndLoc({
      type: 'custom',
      referenceId: null,
      name: place.name,
      placeId: place.place_id || null,
      address: place.formatted_address,
      latitude: place.lat,
      longitude: place.lng,
      source: 'manual'
    });
    setCustomEndName(place.name);
    setNoReturnToday(false);
  };

  const handleSave = () => {
    const updatedAnchor: DailyAnchor = {
      date: dateIso,
      startLocation: startLoc,
      endLocation: noReturnToday
        ? { type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'manual' }
        : endLoc,
      noReturnToday
    };
    onSaveAnchor(dateIso, updatedAnchor);
    onClose();
  };

  const handleResetToAuto = () => {
    setStartLoc({ type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' });
    setEndLoc({ type: null, referenceId: null, name: null, placeId: null, latitude: null, longitude: null, source: 'automatic' });
    setNoReturnToday(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1c1b26] rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-[#161521]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                {t('set_anchor_locations')} ({dateIso})
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Start Location Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>{language === 'ko' ? '하루 출발 장소' : 'Daily Start Location'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                startLoc.source === 'manual' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              }`}>
                {startLoc.source === 'manual' ? t('manual_setting') : t('automatic_setting')}
              </span>
            </label>

            {accommodations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {accommodations.map((acc) => {
                  const isSelected = startLoc.referenceId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectAccommodationStart(acc)}
                      className={`px-2.5 py-1 text-xs rounded-xl border transition-all flex items-center gap-1 font-medium ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                          : 'bg-gray-50 dark:bg-zinc-800/60 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                      }`}
                    >
                      <Building2 className="w-3 h-3" />
                      {acc.name}
                    </button>
                  );
                })}
              </div>
            )}

            <GooglePlaceInput
              value={customStartName}
              onChange={(val, addr, latLng, pId) => {
                setCustomStartName(val);
                if (latLng) {
                  handleCustomStartPlaceSelect({
                    name: val,
                    formatted_address: addr || '',
                    lat: latLng.lat,
                    lng: latLng.lng,
                    place_id: pId
                  });
                }
              }}
              placeholder={language === 'ko' ? '다른 출발 장소 검색 (예: 인천공항, 도쿄역)' : 'Search other start location'}
              inputClassName="w-full px-3 py-2 bg-gray-50 dark:bg-[#13121a] border border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-gray-900 dark:text-zinc-100"
            />
          </div>

          {/* End Location Section */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>{language === 'ko' ? '하루 복귀 장소' : 'Daily Return Location'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                endLoc.source === 'manual' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              }`}>
                {endLoc.source === 'manual' ? t('manual_setting') : t('automatic_setting')}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl">
              <input
                type="checkbox"
                checked={noReturnToday}
                onChange={(e) => setNoReturnToday(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-amber-900 dark:text-amber-200 font-semibold">
                {t('today_no_return')}
              </span>
            </label>

            {!noReturnToday && (
              <>
                {accommodations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {accommodations.map((acc) => {
                      const isSelected = endLoc.referenceId === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleSelectAccommodationEnd(acc)}
                          className={`px-2.5 py-1 text-xs rounded-xl border transition-all flex items-center gap-1 font-medium ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                              : 'bg-gray-50 dark:bg-zinc-800/60 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          {acc.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                <GooglePlaceInput
                  value={customEndName}
                  onChange={(val, addr, latLng, pId) => {
                    setCustomEndName(val);
                    if (latLng) {
                      handleCustomEndPlaceSelect({
                        name: val,
                        formatted_address: addr || '',
                        lat: latLng.lat,
                        lng: latLng.lng,
                        place_id: pId
                      });
                    }
                  }}
                  placeholder={language === 'ko' ? '다른 복귀 장소 검색 (예: 야간 야시장, 공항)' : 'Search other return location'}
                  inputClassName="w-full px-3 py-2 bg-gray-50 dark:bg-[#13121a] border border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-gray-900 dark:text-zinc-100"
                />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-[#161521]/60">
          <button
            type="button"
            onClick={handleResetToAuto}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {language === 'ko' ? '자동 설정으로 초기화' : 'Reset to Auto'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
