import React from 'react';
import { Building2, ArrowRight, Clock, AlertTriangle, Settings2, Plus, CheckCircle2 } from 'lucide-react';
import { DailyAnchor, Accommodation, calculateAnchorMovementDetails } from '../services/accommodationService';
import { PlanItem } from '../types';
import { Language, translateText } from '../utils/translations';

interface DailyAnchorCardProps {
  dateIso: string;
  anchor?: DailyAnchor;
  items: PlanItem[];
  accommodations: Accommodation[];
  onOpenAnchorModal: () => void;
  onOpenAddAccModal: () => void;
  language?: Language;
}

export default function DailyAnchorCard({
  dateIso,
  anchor,
  items,
  accommodations,
  onOpenAnchorModal,
  onOpenAddAccModal,
  language = 'ko'
}: DailyAnchorCardProps) {
  const t = (key: Parameters<typeof translateText>[0], params?: Record<string, string | number>) =>
    translateText(key, language, params);

  const startLoc = anchor?.startLocation;
  const endLoc = anchor?.endLocation;

  const hasStartAcc = startLoc?.type === 'accommodation' && startLoc.name;
  const hasEndAcc = endLoc?.type === 'accommodation' && endLoc.name;

  const isTransferDay = hasStartAcc && hasEndAcc && startLoc.referenceId !== endLoc.referenceId;
  const isSameStayDay = hasStartAcc && hasEndAcc && startLoc.referenceId === endLoc.referenceId;
  const isCheckInOnly = !hasStartAcc && hasEndAcc;
  const isCheckOutOnly = hasStartAcc && !hasEndAcc;

  const movementDetails = anchor ? calculateAnchorMovementDetails(anchor, items, 10, accommodations) : {};

  if (!hasStartAcc && !hasEndAcc && !startLoc?.name && !endLoc?.name) {
    return (
      <div className="mb-4 p-3.5 bg-stone-50/80 dark:bg-[#161521]/70 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-gray-500 dark:text-zinc-400">
          <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs font-medium">
            {t('no_accommodation_registered')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenAddAccModal}
            className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            {t('add_accommodation')}
          </button>
          <button
            onClick={onOpenAnchorModal}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg"
            title={t('set_anchor_locations')}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/50 dark:from-[#131a29]/80 dark:via-[#161524]/60 dark:to-[#131a29]/70 border border-blue-100/80 dark:border-blue-900/40 rounded-2xl shadow-xs space-y-2.5">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
            <Building2 className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
            {isTransferDay && t('accommodation_transfer')}
            {isSameStayDay && t('base_accommodation')}
            {isCheckInOnly && t('checkin_today')}
            {isCheckOutOnly && t('checkout_today')}
            {!isTransferDay && !isSameStayDay && !isCheckInOnly && !isCheckOutOnly && (language === 'ko' ? '하루 이동 기준점' : 'Daily Base Location')}
          </span>
        </div>

        <button
          onClick={onOpenAnchorModal}
          className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-950/50 rounded-lg transition-colors flex items-center gap-1"
        >
          <Settings2 className="w-3 h-3" />
          {t('set_anchor_locations')}
        </button>
      </div>

      {/* Main Location Display */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-900 dark:text-zinc-100 pl-1">
        {isTransferDay ? (
          <div className="flex items-center gap-2">
            <span className="text-blue-700 dark:text-blue-300">{startLoc?.name}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-indigo-700 dark:text-indigo-300">{endLoc?.name}</span>
          </div>
        ) : isSameStayDay ? (
          <span className="text-blue-800 dark:text-blue-200">{startLoc?.name}</span>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600 dark:text-zinc-400">
              {language === 'ko' ? '출발:' : 'Start:'} <strong className="text-gray-900 dark:text-zinc-200">{startLoc?.name || (language === 'ko' ? '미지정' : 'None')}</strong>
            </span>
            <span className="text-gray-300 dark:text-zinc-600">•</span>
            <span className="text-gray-600 dark:text-zinc-400">
              {language === 'ko' ? '복귀:' : 'Return:'} <strong className="text-gray-900 dark:text-zinc-200">{endLoc?.name || (language === 'ko' ? '미지정' : 'None')}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Recommended Movement / Time Calculation Summary */}
      {(movementDetails.recommendedDepartureTime || movementDetails.estimatedReturnArrivalTime) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-blue-100/60 dark:border-blue-900/30 text-[11px]">
          {movementDetails.recommendedDepartureTime && (
            <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
              <Clock className="w-3 h-3 text-blue-500 shrink-0" />
              <span>
                {language === 'ko' ? '추천 출발:' : 'Rec. Departure:'} <strong>{movementDetails.recommendedDepartureTime}</strong>
                {movementDetails.startToFirstItemTravelMins && (
                  <span className="text-gray-500 dark:text-zinc-400 font-normal"> (이동 약 {movementDetails.startToFirstItemTravelMins}분)</span>
                )}
              </span>
            </div>
          )}

          {movementDetails.estimatedReturnArrivalTime && (
            <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300">
              <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>
                {language === 'ko' ? '숙소 복귀 예상:' : 'Est. Return:'} <strong>{movementDetails.estimatedReturnArrivalTime}</strong>
                {movementDetails.lastItemToReturnTravelMins && (
                  <span className="text-gray-500 dark:text-zinc-400 font-normal"> (이동 약 {movementDetails.lastItemToReturnTravelMins}분)</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Check-in / Check-out Time Warnings if any */}
      {(movementDetails.checkInTimeWarning || movementDetails.checkOutTimeWarning) && (
        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {movementDetails.checkInTimeWarning && <div>{movementDetails.checkInTimeWarning}</div>}
            {movementDetails.checkOutTimeWarning && <div>{movementDetails.checkOutTimeWarning}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
