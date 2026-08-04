import React, { useState, useEffect } from 'react';
import { X, Building2, Calendar, Clock, MapPin, Check, AlertTriangle, Phone, FileText, Hash, Info } from 'lucide-react';
import { Accommodation, AccommodationConflict, checkAccommodationConflicts, checkExactDuplicateAccommodation, getStayNights, normalizeDateToISO } from '../services/accommodationService';
import { TravelPlan } from '../types';
import { Language, translateText } from '../utils/translations';
import GooglePlaceInput from './GooglePlaceInput';

interface AccommodationModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TravelPlan;
  editingAccommodation?: Accommodation | null;
  onSave: (accommodation: Accommodation, conflictResolution?: 'replace' | 'adjust' | 'keep_both') => void;
  onDelete?: (accId: string) => void;
  language?: Language;
}

export default function AccommodationModal({
  isOpen,
  onClose,
  plan,
  editingAccommodation = null,
  onSave,
  onDelete,
  language = 'ko'
}: AccommodationModalProps) {
  const t = (key: Parameters<typeof translateText>[0], params?: Record<string, string | number>) =>
    translateText(key, language, params);

  // Extract trip start/end date in ISO
  const tripStartDateIso = normalizeDateToISO(plan.startDate) || '2026-07-22';
  const tripEndDateIso = normalizeDateToISO(plan.endDate) || '2026-07-28';

  // Form states
  const [name, setName] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(35.6953);
  const [longitude, setLongitude] = useState<number>(139.7020);
  const [checkInDate, setCheckInDate] = useState(tripStartDateIso);
  const [checkOutDate, setCheckOutDate] = useState(tripEndDateIso);
  const [checkInTime, setCheckInTime] = useState('15:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [applyAsDayStart, setApplyAsDayStart] = useState(true);
  const [applyAsDayEnd, setApplyAsDayEnd] = useState(true);
  const [addCheckInToTimeline, setAddCheckInToTimeline] = useState(false);
  const [addCheckOutToTimeline, setAddCheckOutToTimeline] = useState(false);
  const [excludedDates, setExcludedDates] = useState<string[]>([]);
  const [reservationNumber, setReservationNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [memo, setMemo] = useState('');

  // Conflict handling state
  const [conflictData, setConflictData] = useState<AccommodationConflict | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingAccToSave, setPendingAccToSave] = useState<Accommodation | null>(null);

  useEffect(() => {
    if (editingAccommodation) {
      setName(editingAccommodation.name || '');
      setPlaceId(editingAccommodation.placeId || null);
      setAddress(editingAccommodation.address || '');
      setLatitude(editingAccommodation.latitude || 35.6953);
      setLongitude(editingAccommodation.longitude || 139.7020);
      setCheckInDate(editingAccommodation.checkInDate || tripStartDateIso);
      setCheckOutDate(editingAccommodation.checkOutDate || tripEndDateIso);
      setCheckInTime(editingAccommodation.checkInTime || '15:00');
      setCheckOutTime(editingAccommodation.checkOutTime || '11:00');
      setApplyAsDayStart(editingAccommodation.applyAsDayStart ?? true);
      setApplyAsDayEnd(editingAccommodation.applyAsDayEnd ?? true);
      setAddCheckInToTimeline(editingAccommodation.addCheckInToTimeline ?? false);
      setAddCheckOutToTimeline(editingAccommodation.addCheckOutToTimeline ?? false);
      setExcludedDates(editingAccommodation.excludedDates || []);
      setReservationNumber(editingAccommodation.reservationNumber || '');
      setPhone(editingAccommodation.phone || '');
      setMemo(editingAccommodation.memo || '');
    } else {
      setName('');
      setPlaceId(null);
      setAddress('');
      setLatitude(35.6953);
      setLongitude(139.7020);
      setCheckInDate(tripStartDateIso);
      setCheckOutDate(tripEndDateIso);
      setCheckInTime('15:00');
      setCheckOutTime('11:00');
      setApplyAsDayStart(true);
      setApplyAsDayEnd(true);
      setAddCheckInToTimeline(false);
      setAddCheckOutToTimeline(false);
      setExcludedDates([]);
      setReservationNumber('');
      setPhone('');
      setMemo('');
    }
    setConflictData(null);
    setShowConflictDialog(false);
  }, [editingAccommodation, isOpen, tripStartDateIso, tripEndDateIso]);

  if (!isOpen) return null;

  const stayNights = getStayNights(checkInDate, checkOutDate);

  const handlePlaceSelect = (place: { name: string; formatted_address: string; lat: number; lng: number; place_id?: string }) => {
    setName(place.name);
    setAddress(place.formatted_address || '');
    setLatitude(place.lat);
    setLongitude(place.lng);
    setPlaceId(place.place_id || null);
  };

  const handleToggleExcludedDate = (dateIso: string) => {
    if (excludedDates.includes(dateIso)) {
      setExcludedDates(excludedDates.filter((d) => d !== dateIso));
    } else {
      setExcludedDates([...excludedDates, dateIso]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(language === 'ko' ? '숙소 이름을 입력해주세요.' : 'Please enter accommodation name.');
      return;
    }
    if (checkInDate >= checkOutDate) {
      alert(language === 'ko' ? '체크아웃 날짜는 체크인 날짜 이후여야 합니다.' : 'Check-out date must be after check-in date.');
      return;
    }

    const newAcc: Accommodation = {
      id: editingAccommodation?.id || `acc-${Date.now()}`,
      tripId: plan.id,
      name: name.trim(),
      placeId,
      address: address.trim(),
      latitude,
      longitude,
      timezoneId: plan.timezone?.id || 'Asia/Tokyo',
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime,
      applyAsDayStart,
      applyAsDayEnd,
      addCheckInToTimeline,
      addCheckOutToTimeline,
      excludedDates,
      reservationNumber: reservationNumber.trim() || null,
      phone: phone.trim() || null,
      memo: memo.trim() || null,
      createdAt: editingAccommodation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingAccs = plan.accommodations || [];

    // Exact Duplicate Check
    const isDuplicate = checkExactDuplicateAccommodation(existingAccs, newAcc);
    if (isDuplicate) {
      alert(language === 'ko'
        ? '이미 동일한 숙소가 해당 기간에 등록되어 있습니다.'
        : 'This accommodation is already registered for this date range.'
      );
      return;
    }

    // Overlap Conflict Check
    const conflict = checkAccommodationConflicts(existingAccs, newAcc);
    if (conflict) {
      setConflictData(conflict);
      setPendingAccToSave(newAcc);
      setShowConflictDialog(true);
      return;
    }

    onSave(newAcc);
    onClose();
  };

  const handleResolveConflict = (mode: 'replace' | 'adjust' | 'keep_both') => {
    if (pendingAccToSave) {
      onSave(pendingAccToSave, mode);
    }
    setShowConflictDialog(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-white dark:bg-[#1c1b26] rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-[#161521]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
              {editingAccommodation ? t('edit_accommodation') : t('add_accommodation')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Accommodation Name & Place Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              {t('accommodation_name')} <span className="text-red-500">*</span>
            </label>
            <GooglePlaceInput
              value={name}
              address={address}
              placeId={placeId}
              onChange={(val, addr, latLng, pId) => {
                setName(val);
                if (addr) setAddress(addr);
                if (latLng) {
                  setLatitude(latLng.lat);
                  setLongitude(latLng.lng);
                }
                if (pId) setPlaceId(pId);
              }}
              placeholder={t('accommodation_name_placeholder')}
              inputClassName="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#13121a] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-zinc-100 placeholder-gray-400"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              {language === 'ko' ? '주소' : 'Address'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={language === 'ko' ? '숙소 상세 주소' : 'Full address'}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#13121a] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-zinc-100"
            />
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 dark:bg-[#13121a]/80 rounded-xl border border-gray-100 dark:border-zinc-800/80">
            {/* Check-in */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-zinc-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                {t('check_in_date')}
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1c1b26] border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-gray-900 dark:text-zinc-100"
              />
            </div>
            {/* Check-out */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-zinc-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                {t('check_out_date')}
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1c1b26] border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-gray-900 dark:text-zinc-100"
              />
            </div>

            {/* Check-in Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-zinc-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                {t('check_in_time')}
              </label>
              <input
                type="text"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                placeholder="15:00"
                className="w-full px-3 py-2 bg-white dark:bg-[#1c1b26] border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-gray-900 dark:text-zinc-100"
              />
            </div>
            {/* Check-out Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-zinc-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {t('check_out_time')}
              </label>
              <input
                type="text"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                placeholder="11:00"
                className="w-full px-3 py-2 bg-white dark:bg-[#1c1b26] border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-gray-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Automation Rules / Toggles */}
          <div className="space-y-2.5 p-3.5 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100/60 dark:border-blue-900/30">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              {language === 'ko' ? '일정 자동 연동 옵션' : 'Schedule Automation Options'}
            </span>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={applyAsDayStart}
                onChange={(e) => setApplyAsDayStart(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 dark:text-zinc-300 font-medium">
                {t('apply_day_start')}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={applyAsDayEnd}
                onChange={(e) => setApplyAsDayEnd(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 dark:text-zinc-300 font-medium">
                {t('apply_day_end')}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={addCheckInToTimeline}
                onChange={(e) => setAddCheckInToTimeline(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 dark:text-zinc-300 font-medium">
                {t('add_checkin_timeline')}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={addCheckOutToTimeline}
                onChange={(e) => setAddCheckOutToTimeline(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 dark:text-zinc-300 font-medium">
                {t('add_checkout_timeline')}
              </span>
            </label>
          </div>

          {/* Granular Date Inclusion */}
          {stayNights.length > 0 && (
            <div className="space-y-2 p-3.5 bg-gray-50 dark:bg-[#13121a] rounded-xl border border-gray-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                {t('date_settings_title')} ({stayNights.length} {language === 'ko' ? '박' : 'nights'})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {stayNights.map((dateIso) => {
                  const isExcluded = excludedDates.includes(dateIso);
                  return (
                    <button
                      key={dateIso}
                      type="button"
                      onClick={() => handleToggleExcludedDate(dateIso)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium flex items-center justify-between transition-all ${
                        !isExcluded
                          ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-zinc-800/60 border-gray-200 dark:border-zinc-700 text-gray-400 line-through'
                      }`}
                    >
                      <span>{dateIso.slice(5)}</span>
                      {!isExcluded && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Info: Reservation Number & Phone & Memo */}
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-gray-400" />
                  {t('reservation_number')}
                </label>
                <input
                  type="text"
                  value={reservationNumber}
                  onChange={(e) => setReservationNumber(e.target.value)}
                  placeholder={t('reservation_number_placeholder')}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#13121a] border border-gray-200 dark:border-zinc-800 rounded-lg text-xs text-gray-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {t('accommodation_phone')}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('accommodation_phone_placeholder')}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#13121a] border border-gray-200 dark:border-zinc-800 rounded-lg text-xs text-gray-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                <FileText className="w-3 h-3 text-gray-400" />
                {language === 'ko' ? '숙소 메모 (선택)' : 'Memo (Optional)'}
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
                placeholder={language === 'ko' ? '예: 체크인 전 짐 보관 가능, 비밀번호 1234#' : 'e.g. Free luggage storage before check-in'}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#13121a] border border-gray-200 dark:border-zinc-800 rounded-lg text-xs text-gray-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
            {editingAccommodation && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(language === 'ko' ? '이 숙소를 삭제하시겠습니까?' : 'Delete this accommodation?')) {
                    onDelete(editingAccommodation.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
              >
                {t('delete')}
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </form>

        {/* Conflict Resolution Dialog */}
        {showConflictDialog && conflictData && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-5">
            <div className="w-full max-w-md p-6 bg-white dark:bg-[#1c1b26] rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-900/50 space-y-4">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="text-base font-bold">
                  {language === 'ko' ? '숙박 기간 중복 안내' : 'Stay Period Conflict'}
                </h4>
              </div>

              <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
                {language === 'ko'
                  ? `${conflictData.overlappingDates.join(', ')}일에 기존 숙소 [${conflictData.existingAcc.name}]가 이미 등록되어 있습니다.`
                  : `Another accommodation [${conflictData.existingAcc.name}] is already registered for ${conflictData.overlappingDates.join(', ')}.`}
              </p>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleResolveConflict('replace')}
                  className="w-full px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl text-left shadow-xs transition-colors"
                >
                  1. {language === 'ko' ? '새 숙소로 교체' : 'Replace with new accommodation'}
                </button>

                <button
                  type="button"
                  onClick={() => handleResolveConflict('adjust')}
                  className="w-full px-4 py-2.5 text-xs font-bold text-gray-800 dark:text-zinc-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl text-left transition-colors"
                >
                  2. {language === 'ko' ? '기존 숙소 기간 자동 수정' : 'Adjust existing accommodation dates'}
                </button>

                <button
                  type="button"
                  onClick={() => handleResolveConflict('keep_both')}
                  className="w-full px-4 py-2.5 text-xs font-bold text-gray-800 dark:text-zinc-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl text-left transition-colors"
                >
                  3. {language === 'ko' ? '두 숙소 모두 유지 (날짜별 직접 설정)' : 'Keep both (Set dates manually)'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowConflictDialog(false)}
                  className="w-full px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300 text-center transition-colors pt-1"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
