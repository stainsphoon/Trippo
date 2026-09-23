import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JourneyPassData } from '../types/journeyPass';
import { Plane, Compass, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface JourneyPassTransitionProps {
  data: JourneyPassData;
  planReady: boolean;
  onTransitionComplete: () => void;
  language?: string;
  isDarkMode?: boolean;
  isPlanError?: boolean;
  onRetryPlan?: () => void;
}

export const JourneyPassTransition: React.FC<JourneyPassTransitionProps> = ({
  data,
  planReady,
  onTransitionComplete,
  language = 'ko',
  isDarkMode = false,
  isPlanError = false,
  onRetryPlan
}) => {
  const isKo = language === 'ko';
  const [printCompleted, setPrintCompleted] = useState(false);
  const [isCognitionFinished, setIsCognitionFinished] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(t => clearTimeout(t));
    timeoutRefs.current = [];
  };

  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  // Format Dates for Display
  const formattedDates = useMemo(() => {
    const formatSingle = (dateStr?: string) => {
      if (!dateStr) return '';
      try {
        const parts = dateStr.split('-').map(Number);
        if (parts.length === 3) {
          const m = parts[1];
          const d = parts[2];
          if (isKo) {
            return `${m}월 ${d}일`;
          }
          const monthsEn = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
          return `${monthsEn[m - 1] || m} ${d}`;
        }
      } catch (_e) {}
      return dateStr;
    };

    const startFmt = formatSingle(data.startDate);
    const endFmt = formatSingle(data.endDate);

    if (data.startDate === data.endDate || !endFmt) {
      return {
        rangeStr: startFmt,
        isSingleDay: true
      };
    }

    return {
      rangeStr: `${startFmt} → ${endFmt}`,
      isSingleDay: false
    };
  }, [data.startDate, data.endDate, isKo]);

  // Format Duration Text
  const durationText = useMemo(() => {
    const nights = data.nights ?? 0;
    const days = data.days ?? (nights + 1);

    if (isKo) {
      if (nights === 0) return '당일 여정 · 1일';
      return `${nights}박 ${days}일`;
    }

    if (nights === 0) return '1 DAY TRIP';
    return `${nights} ${nights === 1 ? 'NIGHT' : 'NIGHTS'} · ${days} ${days === 1 ? 'DAY' : 'DAYS'}`;
  }, [data.nights, data.days, isKo]);

  // Reduced motion direct trigger
  useEffect(() => {
    if (prefersReducedMotion) {
      setPrintCompleted(true);
      const timer = setTimeout(() => {
        setIsCognitionFinished(true);
      }, 400);
      timeoutRefs.current.push(timer);
    }
  }, [prefersReducedMotion]);

  // When printing animation ends: hold for ~500ms cognition window
  const handlePrintAnimationComplete = () => {
    setPrintCompleted(true);
    const timer = setTimeout(() => {
      setIsCognitionFinished(true);
    }, 500);
    timeoutRefs.current.push(timer);
  };

  // Check if both Print Cognition is finished AND Plan is ready
  useEffect(() => {
    if (isCognitionFinished && planReady && !isPlanError && !isExiting) {
      setIsExiting(true);
      const exitTimer = setTimeout(() => {
        onTransitionComplete();
      }, 500); // smooth stage exit (500ms)
      timeoutRefs.current.push(exitTimer);
    }
  }, [isCognitionFinished, planReady, isPlanError, isExiting, onTransitionComplete]);

  // Fallback watchdog: If plan ready takes abnormally long or is already ready
  useEffect(() => {
    const watchdogTimer = setTimeout(() => {
      if (!isCognitionFinished && printCompleted) {
        setIsCognitionFinished(true);
      }
    }, 3500);
    timeoutRefs.current.push(watchdogTimer);
    return () => clearTimeout(watchdogTimer);
  }, [printCompleted, isCognitionFinished]);

  return (
    <motion.div
      id="journey-pass-transition-stage"
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md px-4 py-8 overflow-hidden select-none"
    >
      {/* Screen Reader Announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {planReady
          ? (isKo ? '여행 계획이 준비되었습니다.' : 'Travel plan is ready.')
          : (isKo ? '여행 계획을 준비하고 있습니다.' : 'Preparing your travel plan.')}
      </div>

      {/* Main Transition Canvas Container */}
      <div className="w-full max-w-[360px] sm:max-w-[390px] flex flex-col items-center relative">
        
        {/* Layer 1: Top Printer Slot Housing (z-30) */}
        <div
          id="printer-housing-slot"
          className="relative z-30 w-full bg-stone-100 dark:bg-[#1C212C] border border-stone-300/80 dark:border-white/10 rounded-2xl p-3.5 shadow-xl flex flex-col items-center"
        >
          {/* Subtle Printer Branding */}
          <div className="flex items-center justify-between w-full px-1 mb-2">
            <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
              <Compass size={13} className="text-blue-500 animate-spin-slow" />
              <span className="font-logo font-bold text-[11px] tracking-wider text-stone-700 dark:text-stone-300">
                TRIPPO PASS PRINTER
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-stone-400 font-bold uppercase">
                {printCompleted ? (isKo ? '발권완료' : 'ISSUED') : (isKo ? '출력중' : 'FEEDING')}
              </span>
            </div>
          </div>

          {/* Printer Slot Mouth Aperture (The Paper Exit Line) */}
          <div className="w-full h-2.5 bg-stone-300 dark:bg-[#0B0E14] rounded-full shadow-inner relative flex items-center justify-center overflow-hidden">
            <div className="w-4/5 h-[1.5px] bg-stone-400 dark:bg-white/5 rounded-full" />
          </div>

          {/* Contact Shadow directly below the slot mouth (z-20) */}
          <div className="absolute -bottom-3 left-3 right-3 h-3 bg-gradient-to-b from-black/25 dark:from-black/60 to-transparent pointer-events-none z-20" />
        </div>

        {/* Layer 2: Receipt Reveal Viewport (z-10) */}
        <div
          id="receipt-reveal-viewport"
          className="relative z-10 w-full overflow-hidden flex flex-col items-center pt-0.5 -mt-1.5"
          style={{ minHeight: '340px' }}
        >
          {/* Layer 3: Physical Journey Pass Paper */}
          <motion.div
            id="trippo-journey-pass"
            initial={prefersReducedMotion ? { y: '0%' } : { y: '-97%' }}
            animate={{ y: '0%' }}
            transition={
              prefersReducedMotion
                ? { duration: 0.01 }
                : {
                    duration: 2.3,
                    ease: [0.22, 1, 0.36, 1] // Smooth and readable paper feed deceleration
                  }
            }
            onAnimationComplete={handlePrintAnimationComplete}
            className={`w-[96%] bg-white dark:bg-[#151922] text-stone-900 dark:text-stone-100 rounded-b-2xl border-x border-b border-stone-200/90 dark:border-white/10 shadow-2xl relative flex flex-col overflow-hidden transition-colors duration-200`}
          >
            {/* Top Paper Strip Shadow Overlay */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-black/10 dark:from-black/40 to-transparent pointer-events-none" />

            {/* Side Perforation Notches (Ticket Aesthetics) */}
            <div className="absolute top-[82px] -left-2.5 w-5 h-5 bg-black/60 dark:bg-black/80 rounded-full border-r border-stone-200 dark:border-white/10 z-10" />
            <div className="absolute top-[82px] -right-2.5 w-5 h-5 bg-black/60 dark:bg-black/80 rounded-full border-l border-stone-200 dark:border-white/10 z-10" />

            <div className="p-5 sm:p-6 flex flex-col space-y-4">
              
              {/* Brand Header */}
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-1.5">
                  <Plane size={15} className="text-blue-600 dark:text-blue-400 rotate-45" />
                  <span className="font-logo font-bold text-xs tracking-wider text-blue-600 dark:text-blue-400">
                    TRIPPO
                  </span>
                </div>
                <div className="bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest text-stone-500 dark:text-stone-400 uppercase">
                  JOURNEY PASS
                </div>
              </div>

              {/* Destination & Country (Priority 1 & 2) */}
              <div className="space-y-1 py-1">
                <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                  {isKo ? '목적지' : 'DESTINATION'}
                </div>
                <div className="font-black text-2xl sm:text-3xl tracking-tight text-stone-900 dark:text-white line-clamp-1">
                  {data.destinationName}
                </div>
                {data.countryName && (
                  <div className="text-xs sm:text-sm font-semibold tracking-wider text-stone-500 dark:text-stone-400 uppercase flex items-center gap-1.5">
                    <span>{data.countryName}</span>
                    {data.countryCode && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded">
                        {data.countryCode.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Ticket Perforation Line */}
              <div className="relative py-1">
                <div className="border-t-2 border-dashed border-stone-200 dark:border-white/10 w-full" />
              </div>

              {/* Dates & Duration (Priority 3 & 4) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                    {isKo ? '여행 일정' : 'TRAVEL DATES'}
                  </div>
                  <div className="font-extrabold text-sm sm:text-base text-stone-800 dark:text-stone-200">
                    {formattedDates.rangeStr}
                  </div>
                </div>

                <div className="space-y-0.5 sm:text-right">
                  <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                    {isKo ? '여행 기간' : 'DURATION'}
                  </div>
                  <div>
                    <span className="inline-block bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 font-extrabold text-xs sm:text-sm px-2.5 py-0.5 rounded-lg">
                      {durationText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pass Footer Micro Barcode / Ticket ID */}
              <div className="pt-3 border-t border-stone-100 dark:border-white/5 flex items-center justify-between text-[9px] font-mono text-stone-400">
                <span>PASS #TRP-{data.destinationId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'OFFICIAL'}</span>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Sparkles size={10} />
                  <span>READY FOR PLAN</span>
                </div>
              </div>

            </div>

            {/* Bottom Paper Serrated Edge Effect */}
            <div className="w-full h-1 bg-gradient-to-r from-stone-200/50 via-stone-100/50 to-stone-200/50 dark:from-white/5 dark:via-white/10 dark:to-white/5" />
          </motion.div>
        </div>

        {/* Loading / Status Feedback Bar below the Pass */}
        <div className="mt-4 flex flex-col items-center justify-center min-h-[32px]">
          {isPlanError ? (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-xs font-bold">
              <AlertCircle size={14} />
              <span>{isKo ? '여행 계획을 시작하지 못했어요.' : 'Failed to initialize travel plan.'}</span>
              {onRetryPlan && (
                <button
                  type="button"
                  onClick={onRetryPlan}
                  className="ml-2 underline text-white font-black hover:text-rose-200 cursor-pointer"
                >
                  {isKo ? '다시 시도' : 'Retry'}
                </button>
              )}
            </div>
          ) : !planReady && isCognitionFinished ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-stone-400 text-xs font-semibold"
            >
              <Loader2 size={13} className="animate-spin text-blue-400" />
              <span>{isKo ? '여행 계획을 준비하고 있어요...' : 'Preparing your travel plan...'}</span>
            </motion.div>
          ) : null}
        </div>

      </div>
    </motion.div>
  );
};

export default JourneyPassTransition;
