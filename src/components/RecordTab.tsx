import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, BookOpen, Image as ImageIcon, SmilePlus, Upload, Trash2, PenTool, ChevronLeft, ChevronRight, CalendarDays, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TravelLog, TravelPlan, CustomStamp, DraggableStamp } from '../types';
import { Language, translateText } from '../utils/translations';
import { RecordCard } from './RecordCard';
import RecordEmptyState from './RecordEmptyState';
import { getCustomStamps, addCustomStamp, deleteCustomStamp, getDefaultStamps } from '../services/stampService';
import { CanvasEditor, EditorStamp } from './CanvasEditor';

interface RecordTabProps {
  logs: TravelLog[];
  onAddLog: (newLog: Omit<TravelLog, 'id'>) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (updatedLog: TravelLog) => void;
  onNavigateToPlan?: () => void;
  plan: TravelPlan | null;
  language?: Language;
  isDarkMode?: boolean;
}

export default function RecordTab({ logs = [], onAddLog, onDeleteLog, onUpdateLog, language = 'ko', isDarkMode = false }: RecordTabProps) {
  const t = (key: Parameters<typeof translateText>[0]) => translateText(key, language);
  
  // Draft Form states
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftDate, setDraftDate] = useState(new Date().toISOString().split('T')[0].replace(/-/g, '.'));
  const [draftImage, setDraftImage] = useState('');
  const [draftTag, setDraftTag] = useState('');
  const [draftStamps, setDraftStamps] = useState<EditorStamp[]>([]);
  
  // Modal states
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TravelLog | null>(null);
  const [viewingLog, setViewingLog] = useState<TravelLog | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [viewingLog]);

  const [customStamps, setCustomStamps] = useState<CustomStamp[]>([]);
  const [defaultStamps, setDefaultStamps] = useState<CustomStamp[]>([]);
  const [isStampDrawerOpen, setIsStampDrawerOpen] = useState(false);

  // iOS Photos-style Year Group view state
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [zoomDirection, setZoomDirection] = useState<'in' | 'out'>('in');
  const [collapsingYear, setCollapsingYear] = useState<boolean>(false);

  // Group logs by Year
  const groupedByYear = React.useMemo(() => {
    return logs.filter(Boolean).reduce((acc, log) => {
      if (!log || !log.id) return acc;
      const year = log.date ? (log.date.split('.')[0] || log.date.split('-')[0] || '2026') : '2026';
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(log);
      return acc;
    }, {} as Record<string, TravelLog[]>);
  }, [logs]);

  const sortedYears = React.useMemo(() => {
    return Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));
  }, [groupedByYear]);

  // Logs for the currently selected year
  const currentYearLogs = React.useMemo(() => {
    if (!selectedYear) return [];
    return groupedByYear[selectedYear] || [];
  }, [selectedYear, groupedByYear]);

  // Touch pinch zoom gesture states
  const [pinchScale, setPinchScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const [touchDistance, setTouchDistance] = useState<number | null>(null);

  // Automatically reset selectedYear if its logs become empty (e.g. deleted)
  useEffect(() => {
    if (selectedYear && (!groupedByYear[selectedYear] || groupedByYear[selectedYear].length === 0)) {
      setZoomDirection('out');
      setSelectedYear(null);
      setCurrentIndex(0);
    }
  }, [logs, selectedYear, groupedByYear]);

  // Carousel states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentYearIndex, setCurrentYearIndex] = useState(0);
  const [expandingYear, setExpandingYear] = useState<string | null>(null);
  const [cardWidth, setCardWidth] = useState(300);
  const [viewportWidth, setViewportWidth] = useState(() => typeof window !== 'undefined' ? Math.min(window.innerWidth, 390) : 380);
  const prevLogsLength = useRef(currentYearLogs.length);
  const prevSelectedYear = useRef(selectedYear);
  const skipNextTransition = useRef(true);

  // Single-touch tracking for swipe guesture
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Wheel accumulation for trackpad/mouse horizontal swipes
  const wheelAccumulator = useRef(0);
  const lastWheelTime = useRef(0);

  // Refs for native scroll snap containers
  const yearsScrollRef = useRef<HTMLDivElement>(null);
  const logsScrollRef = useRef<HTMLDivElement>(null);

  // Mouse drag scrolling state
  const isDraggingMouse = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  // Scrolling active state to prevent programmatic centering from fighting user gestures
  const isScrollingActive = useRef(false);
  const scrollActiveTimeout = useRef<NodeJS.Timeout | null>(null);

  const markScrollActive = () => {
    isScrollingActive.current = true;
    if (scrollActiveTimeout.current) {
      clearTimeout(scrollActiveTimeout.current);
    }
    scrollActiveTimeout.current = setTimeout(() => {
      isScrollingActive.current = false;
    }, 150);
  };

  // Synchronize Years scroll container with currentYearIndex
  useEffect(() => {
    if (selectedYear === null && yearsScrollRef.current) {
      if (isScrollingActive.current) return;
      const step = cardWidth + 16;
      const targetScrollLeft = currentYearIndex * step;
      if (Math.abs(yearsScrollRef.current.scrollLeft - targetScrollLeft) > 5) {
        yearsScrollRef.current.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [currentYearIndex, selectedYear, cardWidth]);

  // Synchronize Logs scroll container with currentIndex
  useEffect(() => {
    if (selectedYear !== null && logsScrollRef.current) {
      if (isScrollingActive.current) return;
      const step = cardWidth + 16;
      const targetScrollLeft = currentIndex * step;
      if (Math.abs(logsScrollRef.current.scrollLeft - targetScrollLeft) > 5) {
        logsScrollRef.current.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex, selectedYear, cardWidth]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingMouse.current = true;
    dragStartX.current = e.clientX;
    dragStartScrollLeft.current = e.currentTarget.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingMouse.current) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (x - dragStartX.current) * 1.5;
    e.currentTarget.scrollLeft = dragStartScrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLDivElement>, type: 'years' | 'logs') => {
    if (!isDraggingMouse.current) return;
    isDraggingMouse.current = false;
    
    const scrollLeft = e.currentTarget.scrollLeft;
    const step = cardWidth + 16;
    const index = Math.round(scrollLeft / step);
    
    const maxIndex = type === 'years' 
      ? sortedYears.length - 1 
      : currentYearLogs.filter(l => l && l.id).length - 1;
      
    const clampedIndex = Math.max(0, Math.min(maxIndex, index));
    
    e.currentTarget.scrollTo({
      left: clampedIndex * step,
      behavior: 'smooth'
    });
  };

  const handleYearsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    markScrollActive();
    const scrollLeft = e.currentTarget.scrollLeft;
    const step = cardWidth + 16;
    const index = Math.round(scrollLeft / step);
    const clampedIndex = Math.max(0, Math.min(sortedYears.length - 1, index));
    if (clampedIndex !== currentYearIndex) {
      setCurrentYearIndex(clampedIndex);
    }
  };

  const handleLogsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    markScrollActive();
    const scrollLeft = e.currentTarget.scrollLeft;
    const step = cardWidth + 16;
    const validLogs = currentYearLogs.filter(l => l && l.id);
    const index = Math.round(scrollLeft / step);
    const clampedIndex = Math.max(0, Math.min(validLogs.length - 1, index));
    if (clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex);
    }
  };

  useEffect(() => {
    // Skip the initial positioning animation on tab switch / mount
    const timer = setTimeout(() => {
      skipNextTransition.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const viewportObserverRef = useRef<ResizeObserver | null>(null);
  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    if (viewportObserverRef.current) {
      viewportObserverRef.current.disconnect();
      viewportObserverRef.current = null;
    }
    if (node !== null) {
      setViewportWidth(node.getBoundingClientRect().width);
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setViewportWidth(entry.contentRect.width);
        }
      });
      observer.observe(node);
      viewportObserverRef.current = observer;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (viewportObserverRef.current) {
        viewportObserverRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (window.innerWidth >= 640) {
        setCardWidth(400);
      } else if (window.innerWidth >= 480) {
        setCardWidth(310);
      } else {
        setCardWidth(270);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (prevSelectedYear.current !== selectedYear) {
      prevSelectedYear.current = selectedYear;
      prevLogsLength.current = currentYearLogs.length;
      return;
    }

    if (currentYearLogs.length > prevLogsLength.current) {
      setCurrentIndex(currentYearLogs.length - 1);
    } else if (currentIndex >= currentYearLogs.length && currentYearLogs.length > 0) {
      setCurrentIndex(currentYearLogs.length - 1);
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(20);
      } catch (e) {
        // ignore
      }
    }
    
    prevLogsLength.current = currentYearLogs.length;
  }, [currentYearLogs.length, currentIndex, selectedYear]);

  // Gesture events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistance(dist);
      setIsPinching(true);
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistance !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = currentDist / touchDistance;
      setPinchScale(scale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinching) {
      if (selectedYear !== null && pinchScale < 0.82) {
        // Pinch in -> Zoom out back to Years Grid View
        setZoomDirection('out');
        setCollapsingYear(true);
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(20);
        }
        setTimeout(() => {
          setSelectedYear(null);
          setCurrentIndex(0);
          setCollapsingYear(false);
        }, 180);
      } else if (selectedYear === null && pinchScale > 1.18) {
        // Pinch out -> Zoom into the most recent year
        if (sortedYears.length > 0) {
          setZoomDirection('in');
          setSelectedYear(sortedYears[0]);
          setCurrentIndex(0);
          if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(20);
          }
        }
      }
      setTouchDistance(null);
      setPinchScale(1);
      setIsPinching(false);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => {
    const fetchStamps = async () => {
      const [custom, defaults] = await Promise.all([
        getCustomStamps(),
        getDefaultStamps()
      ]);
      setCustomStamps(custom);
      setDefaultStamps(defaults);
    };
    fetchStamps();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  const handleAddStampToCanvas = (imageUrl: string) => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const baseSize = 80;
      let w = baseSize;
      let h = baseSize;
      if (aspectRatio > 1) {
        h = baseSize / aspectRatio;
      } else {
        w = baseSize * aspectRatio;
      }

      const newStamp: EditorStamp = {
        id: Date.now().toString() + Math.random().toString(),
        imageUrl,
        x: 20 + (draftStamps.length * 10),
        y: 20 + (draftStamps.length * 10),
        w,
        h
      };
      setDraftStamps(prev => [...prev, newStamp]);
    };
  };

  // Helpers for plan importing
  const cleanLocation = (title: string) => {
    return title.replace(/여행\s*계획|여행|계획/g, '').trim() || title;
  };

  const sanitizeDate = (dateStr: string) => {
    return dateStr.replace(/\s+/g, '').replace(/[-/]/g, '.');
  };

  const generatePlanSummary = (p: TravelPlan, lang: Language) => {
    let summary = lang === 'ko' 
      ? `✈️ [${p.title}] 여행 기록\n\n🗓️ 여행 일정: ${p.startDate} ~ ${p.endDate} (${p.durationText})\n\n🗺️ 일자별 경로 요약:\n`
      : `✈️ [${p.title}] Travel Journal\n\n🗓️ Period: ${p.startDate} ~ ${p.endDate} (${p.durationText})\n\n🗺️ Daily Itinerary Summary:\n`;

    p.days.forEach(day => {
      const dayHeader = lang === 'ko'
        ? `• Day ${day.dayNumber} (${day.date} ${day.dayOfWeek}요일):\n`
        : `• Day ${day.dayNumber} (${day.date} ${day.dayOfWeek}):\n`;
      
      summary += dayHeader;
      if (day.items && day.items.length > 0) {
        day.items.forEach(item => {
          summary += `   - [${item.time}] ${item.title}`;
          if (item.content) {
            summary += ` : ${item.content}`;
          }
          summary += '\n';
        });
      } else {
        summary += lang === 'ko' ? `   - 등록된 일정이 없습니다.\n` : `   - No scheduled activities.\n`;
      }
      summary += '\n';
    });
    
    summary += lang === 'ko'
      ? `✍️ 이 일정을 바탕으로 소중한 여행 이야기를 자유롭게 기록해 보세요!`
      : `✍️ Feel free to write your precious travel stories based on this itinerary!`;

    return summary;
  };

  const getPlansHistory = (): TravelPlan[] => {
    const saved = localStorage.getItem('trippo_plans_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse trippo_plans_history:", e);
      }
    }
    // Fallback to active plan if present
    const activePlanSaved = localStorage.getItem('trippo_plan');
    if (activePlanSaved) {
      try {
        const active = JSON.parse(activePlanSaved);
        if (active) return [active];
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  };

  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isPlanListModalOpen, setIsPlanListModalOpen] = useState(false);

  const handleStartAdd = () => {
    setEditingLog(null);
    setDraftTitle('');
    setDraftContent('');
    setDraftLocation('');
    setDraftDate(new Date().toISOString().split('T')[0].replace(/-/g, '.'));
    setDraftImage('');
    setDraftTag('');
    setDraftStamps([]);
    setIsStampDrawerOpen(false);
    setIsChoiceModalOpen(true);
  };

  const handleStartEdit = (log: TravelLog) => {
    setEditingLog(log);
    setDraftTitle(log.title);
    setDraftLocation(log.location || '');
    setDraftDate(log.date);
    setDraftImage(log.image || '');
    setDraftTag(log.tag || '');
    setDraftContent(log.content || '');
    setDraftStamps((Array.isArray(log.stamps) ? log.stamps : []).filter(Boolean).map((s, i) => {
      if (typeof s === 'string') {
        return { id: `legacy-${i}`, imageUrl: s, x: 20 + i*10, y: 20 + i*10, w: 40, h: 40 } as any;
      }
      return {
        ...s,
        id: s.id !== undefined && s.id !== null ? String(s.id) : `stamp-${i}`
      };
    }));
    setIsStampDrawerOpen(false);
    setIsWriteModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const baseSize = 120; // larger for photos
          let w = baseSize;
          let h = baseSize;
          if (aspectRatio > 1) {
            h = baseSize / aspectRatio;
          } else {
            w = baseSize * aspectRatio;
          }

          const newStamp: EditorStamp = {
            id: Date.now().toString() + Math.random().toString(),
            imageUrl: reader.result as string,
            x: 20 + (draftStamps.length * 10),
            y: 20 + (draftStamps.length * 10),
            w,
            h
          };
          setDraftStamps(prev => [...prev, newStamp]);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Img = reader.result as string;
        const newStamp = await addCustomStamp(base64Img);
        if (newStamp) {
           setCustomStamps(prev => [newStamp, ...prev]);
           handleAddStampToCanvas(newStamp.imageUrl);
        } else {
           alert("Failed to upload stamp.");
        }
      };
      reader.readAsDataURL(file);
    }
    // reset so same file can be uploaded again if needed
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleDeleteCustomStamp = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteCustomStamp(id);
    if (success) {
      setCustomStamps(prev => prev.filter(s => s.id !== id));
    }
  };

  const getCleanStamps = () => {
    return draftStamps.map(s => {
      const { imageObj, ...rest } = s as any;
      return rest;
    });
  };

  const handleSave = () => {
    if (!draftTitle.trim() || !draftContent.trim()) {
      alert(t('alert_input_required'));
      return;
    }

    const cleanedStamps = getCleanStamps();

    const savedYear = draftDate ? (draftDate.split('.')[0] || draftDate.split('-')[0] || '2026') : '2026';
    if (editingLog) {
      onUpdateLog({
        ...editingLog,
        title: draftTitle,
        content: draftContent,
        location: draftLocation || undefined,
        date: draftDate,
        image: draftImage || undefined,
        tag: draftTag || undefined,
        stamps: cleanedStamps.length > 0 ? cleanedStamps : undefined
      });
      setEditingLog(null);
    } else {
      onAddLog({
        title: draftTitle,
        content: draftContent,
        location: draftLocation || undefined,
        date: draftDate,
        image: draftImage || undefined,
        tag: draftTag || undefined,
        stamps: cleanedStamps.length > 0 ? cleanedStamps : undefined
      });
    }
    setZoomDirection('in');
    setSelectedYear(savedYear);
    setCurrentIndex(0);

    // Reset states
    setDraftTitle('');
    setDraftContent('');
    setDraftLocation('');
    setDraftImage('');
    setDraftTag('');
    setDraftStamps([]);
    setIsWriteModalOpen(false);
    alert(language === 'ko' ? '기록이 저장되었습니다!' : 'Record saved!');
  };

  return (
    <div className="flex flex-col h-full -mt-2">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="font-logo font-bold text-[22px] text-stone-900 dark:text-text-primary flex items-center gap-2">
          <BookOpen className="text-blue-500 dark:text-brand-primary" size={24} />
          <span>{language === 'ko' ? '여행 기록' : 'Travel Logs'}</span>
        </h3>
        <motion.button
          onClick={handleStartAdd}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="bg-blue-500 dark:bg-brand-primary text-white text-xs font-bold py-1.5 px-3.5 rounded-full flex items-center gap-1 shadow-sm hover:bg-blue-600 dark:hover:bg-brand-primary/90 transition-all active:scale-95"
        >
          <Plus size={14} />
          <span>{language === 'ko' ? '기록 추가' : 'Add Log'}</span>
        </motion.button>
      </div>

      {logs.filter(Boolean).length === 0 ? (
        <RecordEmptyState language={language} />
      ) : (
        <div 
          ref={viewportRef}
          className="flex-1 flex flex-col min-h-0 select-none relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: isPinching ? `scale(${pinchScale})` : 'scale(1)',
            transition: isPinching ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {selectedYear === null ? (
              <motion.div
                key="years-carousel"
                initial={{ opacity: 0, scale: zoomDirection === 'out' ? 1.15 : 0.92, filter: 'blur(2px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: zoomDirection === 'in' ? 1.15 : 0.92, filter: 'blur(4px)' }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full flex-1 flex flex-col min-h-0 origin-center"
              >
                {/* Main Years Carousel Area */}
                <div 
                  ref={yearsScrollRef}
                  onScroll={handleYearsScroll}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={(e) => handleMouseUpOrLeave(e, 'years')}
                  onMouseLeave={(e) => handleMouseUpOrLeave(e, 'years')}
                  className="flex-1 min-h-0 w-full overflow-x-auto snap-x snap-mandatory scrollbar-none py-2 flex items-center cursor-grab active:cursor-grabbing gap-4"
                  style={{
                    paddingLeft: `${(viewportWidth - cardWidth) / 2}px`,
                    paddingRight: '0px',
                    scrollPaddingLeft: `${(viewportWidth - cardWidth) / 2}px`,
                    scrollPaddingRight: `${(viewportWidth - cardWidth) / 2}px`
                  }}
                >
                  {sortedYears.map((year, index) => {
                    const isActive = index === currentYearIndex;
                    const yearLogs = groupedByYear[year] || [];
                    const locations = Array.from(new Set(yearLogs.map(l => l.location || l.title.split(' ')[0]).filter(Boolean))).slice(0, 3);

                    return (
                      <motion.div
                        key={year}
                        style={{ width: cardWidth }}
                        className="flex-shrink-0 origin-center flex flex-col justify-center snap-center"
                        animate={
                          expandingYear === year
                            ? { scale: 1.25, opacity: 0, filter: 'blur(2px)' }
                            : expandingYear !== null
                            ? { scale: 0.8, opacity: 0, filter: 'blur(4px)' }
                            : {
                                scale: isActive ? 1.0 : 0.94,
                                opacity: isActive ? 1.0 : 0.7,
                                filter: 'blur(0px)',
                              }
                        }
                        transition={
                          skipNextTransition.current
                            ? { duration: 0 }
                            : expandingYear !== null
                            ? { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
                            : { type: "spring", duration: 0.26, bounce: 0.2 }
                        }
                      >
                        <div
                          onClick={() => {
                            if (isActive) {
                              if (expandingYear) return;
                              setZoomDirection('in');
                              setExpandingYear(year);
                              setTimeout(() => {
                                setSelectedYear(year);
                                setCurrentIndex(0);
                                setExpandingYear(null);
                              }, 150);
                            } else {
                              setCurrentYearIndex(index);
                            }
                          }}
                          className="bg-white dark:bg-surface-primary rounded-[32px] p-6 border border-stone-100 dark:border-subtle-border shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center group relative overflow-hidden h-[360px] justify-between"
                        >
                          {/* Polaroid Stack Collage */}
                          <div className="relative w-full h-[200px] flex items-center justify-center mb-4 mt-2">
                            {yearLogs.slice(0, 3).reverse().map((log, idx, arr) => {
                              const reverseIdx = arr.length - 1 - idx; // 0: frontmost, 1: middle, 2: back
                              const rotation = reverseIdx === 0 ? -2 : reverseIdx === 1 ? 5 : -6;
                              const xOffset = reverseIdx === 0 ? 0 : reverseIdx === 1 ? 12 : -12;
                              const yOffset = reverseIdx === 0 ? 0 : reverseIdx === 1 ? -6 : -12;
                              const zIndex = 10 - reverseIdx;
                              const scale = reverseIdx === 0 ? 1 : reverseIdx === 1 ? 0.93 : 0.86;
                              const opacity = reverseIdx === 0 ? 1 : reverseIdx === 1 ? 0.78 : 0.45;

                              return (
                                <div
                                  key={log.id}
                                  style={{
                                    transform: `rotate(${rotation}deg) translate(${xOffset}px, ${yOffset}px) scale(${scale})`,
                                    zIndex,
                                    opacity,
                                    backgroundImage: log.image ? `url(${log.image})` : 'none'
                                  }}
                                  className="absolute w-[170px] h-[170px] rounded-2xl shadow-md border-4 border-white dark:border-zinc-800 bg-gradient-to-tr from-stone-50 to-stone-100 dark:from-zinc-900 dark:to-zinc-800 bg-cover bg-center overflow-hidden flex flex-col justify-end p-2.5 transition-transform duration-300 group-hover:translate-y-[-4px]"
                                >
                                  {/* Bottom dark overlay for legibility */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                                  
                                  {/* Inner content preview if there is no image */}
                                  {!log.image && log.content && (
                                    <div className="absolute inset-x-2 top-2 bottom-10 overflow-hidden opacity-40 pointer-events-none scale-75 origin-top-left">
                                      <p className="font-mono text-[9px] text-stone-700 dark:text-stone-300 line-clamp-4 leading-normal">{log.content}</p>
                                    </div>
                                  )}
                                  
                                  {/* Inner Stamp images */}
                                  {log.stamps && log.stamps.length > 0 && (
                                    <div className="absolute top-1.5 right-1.5 flex -space-x-1.5">
                                      {log.stamps.slice(0, 2).map((st, sIdx) => (
                                        <img 
                                          key={sIdx}
                                          src={typeof st === 'string' ? st : st.imageUrl} 
                                          alt="stamp" 
                                          className="w-5 h-5 object-contain drop-shadow"
                                          referrerPolicy="no-referrer"
                                        />
                                      ))}
                                    </div>
                                  )}

                                  <div className="relative z-10">
                                    <span className="text-[10px] font-sans font-bold text-white truncate block">{log.title}</span>
                                    <span className="text-[8px] font-mono text-white/75 block mt-0.5">{log.date}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Year Information */}
                          <div className="text-center space-y-1 pb-2">
                            <span className="font-logo font-black text-3xl tracking-tight text-stone-900 dark:text-text-primary">
                              {year}
                            </span>
                            <p className="font-sans text-xs font-bold text-blue-500 dark:text-brand-primary">
                              {language === 'ko' ? `${yearLogs.length}개의 기록` : `${yearLogs.length} Records`}
                            </p>
                            {locations.length > 0 && (
                              <p className="font-sans text-[11px] text-stone-400 dark:text-stone-500 max-w-[200px] truncate mx-auto">
                                {locations.join(' • ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {sortedYears.length > 0 && (
                    <div 
                      style={{ width: `${Math.max(0, (viewportWidth - cardWidth) / 2 - 16)}px` }} 
                      className="flex-shrink-0 h-1" 
                    />
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="year-detail"
                initial={{ opacity: 0, scale: zoomDirection === 'in' ? 0.88 : 1.15, filter: 'blur(2px)' }}
                animate={collapsingYear 
                  ? { opacity: 0, scale: 0.78, filter: 'blur(4px)' } 
                  : { opacity: 1, scale: 1, filter: 'blur(0px)' }
                }
                exit={{ opacity: 0, scale: zoomDirection === 'out' ? 0.88 : 1.15, filter: 'blur(4px)' }}
                transition={{ 
                  duration: collapsingYear ? 0.18 : 0.38, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="w-full h-full flex-1 flex flex-col min-h-0 origin-center"
              >
                {/* Year Detail Header Menu with Zoom back button */}
                <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                  <button
                    onClick={() => {
                      if (collapsingYear) return;
                      setZoomDirection('out');
                      setCollapsingYear(true);
                      setTimeout(() => {
                        setSelectedYear(null);
                        setCurrentIndex(0);
                        setCollapsingYear(false);
                      }, 180);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-zinc-800/70 py-1.5 px-3.5 rounded-full hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-sm"
                  >
                    <ChevronLeft size={14} />
                    <span>{language === 'ko' ? `${selectedYear}년 전체 보기` : `All in ${selectedYear}`}</span>
                  </button>
                </div>

                {/* Swipable Carousel for Selected Year */}
                <div 
                  ref={logsScrollRef}
                  onScroll={handleLogsScroll}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={(e) => handleMouseUpOrLeave(e, 'logs')}
                  onMouseLeave={(e) => handleMouseUpOrLeave(e, 'logs')}
                  className="flex-1 min-h-0 w-full overflow-x-auto snap-x snap-mandatory scrollbar-none py-2 flex items-center cursor-grab active:cursor-grabbing gap-4"
                  style={{
                    paddingLeft: `${(viewportWidth - cardWidth) / 2}px`,
                    paddingRight: '0px',
                    scrollPaddingLeft: `${(viewportWidth - cardWidth) / 2}px`,
                    scrollPaddingRight: `${(viewportWidth - cardWidth) / 2}px`
                  }}
                >
                  {currentYearLogs.filter(l => l && l.id).map((log, index) => {
                    const isActive = index === currentIndex;
                    return (
                      <motion.div
                        key={log.id}
                        style={{ width: cardWidth }}
                        className="flex-shrink-0 origin-center flex flex-col justify-center snap-center"
                        animate={{
                          scale: isActive ? 1.0 : 0.94,
                          opacity: isActive ? 1.0 : 0.7,
                        }}
                        transition={{ type: "spring", duration: 0.26, bounce: 0.2 }}
                      >
                        <RecordCard 
                          log={log} 
                          onEdit={handleStartEdit} 
                          onDelete={onDeleteLog} 
                          onClick={() => {
                            if (isActive) {
                              setViewingLog(log);
                            } else {
                              setCurrentIndex(index);
                            }
                          }} 
                          isDarkMode={isDarkMode} 
                        />
                      </motion.div>
                    );
                  })}
                  {currentYearLogs.filter(l => l && l.id).length > 0 && (
                    <div 
                      style={{ width: `${Math.max(0, (viewportWidth - cardWidth) / 2 - 16)}px` }} 
                      className="flex-shrink-0 h-1" 
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unified Bottom Page Indicator */}
          <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 h-[12px] flex justify-center items-center z-30">
            <div className="flex items-center gap-2">
              {selectedYear === null 
                ? sortedYears.map((_, index) => {
                    const isActive = index === currentYearIndex;
                    return (
                      <motion.button
                        key={`year-dot-${index}`}
                        onClick={() => setCurrentYearIndex(index)}
                        initial={false}
                        animate={{
                          width: isActive ? 24 : 6,
                          height: 6,
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`rounded-full ${
                          isActive
                            ? 'bg-blue-600'
                            : 'bg-stone-400/45'
                        }`}
                        aria-label={`Go to year slide ${index + 1}`}
                      />
                    );
                  })
                : currentYearLogs.filter(l => l && l.id).map((_, index) => {
                    const isActive = index === currentIndex;
                    return (
                      <motion.button
                        key={`log-dot-${index}`}
                        onClick={() => setCurrentIndex(index)}
                        initial={false}
                        animate={{
                          width: isActive ? 24 : 6,
                          height: 6,
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`rounded-full ${
                          isActive
                            ? 'bg-blue-600'
                            : 'bg-stone-400/45'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    );
                  })}
            </div>
          </div>
        </div>
      )}

      {/* Choice Modal (새 기록 작성 / 계획 불러오기 선택) */}
      <AnimatePresence>
        {isChoiceModalOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChoiceModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:max-w-md md:mx-auto"
            />

            {/* Choice Container (Bottom Sheet styled) */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-app-bg rounded-t-[28px] p-6 pb-8 shadow-2xl md:max-w-md md:mx-auto border-t border-gray-100 dark:border-subtle-border space-y-5"
            >
              {/* Drag Indicator Handle */}
              <div className="w-full flex justify-center pb-2">
                <div className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full" />
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-sans font-bold text-lg text-gray-800 dark:text-text-primary">
                  {language === 'ko' ? '새 기록 작성 방식 선택' : 'Choose Record Creation Method'}
                </h3>
                <button
                  onClick={() => setIsChoiceModalOpen(false)}
                  className="bg-gray-100 dark:bg-surface-secondary text-gray-500 dark:text-text-secondary p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Option 1: Create New Record */}
                <button
                  onClick={() => {
                    setIsChoiceModalOpen(false);
                    setIsWriteModalOpen(true);
                  }}
                  className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-subtle-border hover:border-blue-500 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-surface-primary hover:bg-blue-50/10 dark:hover:bg-blue-950/10 transition-all text-left group"
                >
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all flex-shrink-0">
                    <PenTool size={20} />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-gray-800 dark:text-text-primary">
                      {language === 'ko' ? '새 기록 직접 작성' : 'Write New Record'}
                    </h4>
                    <p className="font-sans text-xs text-gray-400 mt-1 leading-relaxed">
                      {language === 'ko' 
                        ? '일정과 세부 사항을 처음부터 직접 자유롭게 작성합니다.' 
                        : 'Write down your travel stories freely from a blank page.'}
                    </p>
                  </div>
                </button>

                {/* Option 2: Load Plan */}
                <button
                  onClick={() => {
                    setIsChoiceModalOpen(false);
                    setIsPlanListModalOpen(true);
                  }}
                  className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-subtle-border hover:border-emerald-500 dark:hover:border-emerald-500 bg-gray-50/50 dark:bg-surface-primary hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-all text-left group"
                >
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all flex-shrink-0">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-gray-800 dark:text-text-primary">
                      {language === 'ko' ? '여행 계획 불러오기' : 'Load Travel Plan'}
                    </h4>
                    <p className="font-sans text-xs text-gray-400 mt-1 leading-relaxed">
                      {language === 'ko' 
                        ? '계획 탭에서 작성된 나의 일정과 코스를 가져와 기록으로 남깁니다.' 
                        : 'Import coordinates and plans from your Travel Plan tab.'}
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Plan List Modal (작성된 계획 리스트 불러오기) */}
      <AnimatePresence>
        {isPlanListModalOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlanListModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:max-w-md md:mx-auto"
            />

            {/* List Container (Bottom Sheet styled) */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 dark:bg-app-bg rounded-t-[28px] h-[75vh] max-h-[75vh] overflow-hidden flex flex-col shadow-2xl md:max-w-md md:mx-auto border-t border-gray-100 dark:border-subtle-border"
            >
              {/* Drag Indicator Handle */}
              <div className="w-full flex justify-center py-3 flex-shrink-0">
                <div className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full" />
              </div>

              {/* Header with back button */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-subtle-border bg-white dark:bg-surface-primary sticky top-0 z-10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsPlanListModalOpen(false);
                      setIsChoiceModalOpen(true);
                    }}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h3 className="font-sans font-bold text-base text-gray-800 dark:text-text-primary">
                    {language === 'ko' ? '불러올 계획 선택' : 'Select Travel Plan'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsPlanListModalOpen(false)}
                  className="bg-gray-100 dark:bg-surface-secondary text-gray-500 dark:text-text-secondary p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable list of plans */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {(() => {
                  const history = getPlansHistory();
                  if (history.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                        <CalendarDays className="text-gray-300 dark:text-zinc-700" size={48} />
                        <p className="font-sans text-xs font-semibold text-gray-400 leading-relaxed">
                          {language === 'ko' 
                            ? '아직 작성된 여행 계획이 없습니다.\n계획 탭에서 나만의 멋진 여행 계획을 세워보세요!' 
                            : 'No travel plans found.\nTry scheduling some activities in the Plan tab!'}
                        </p>
                      </div>
                    );
                  }
                  
                  return history.map((p) => {
                    const totalActivities = p.days.reduce((acc, d) => acc + (d.items?.length || 0), 0);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setDraftTitle(p.title);
                          setDraftDate(sanitizeDate(p.startDate));
                          setDraftLocation(cleanLocation(p.title));
                          setDraftContent(generatePlanSummary(p, language));
                          
                          setIsPlanListModalOpen(false);
                          setIsWriteModalOpen(true);
                        }}
                        className="w-full flex flex-col p-4 rounded-2xl border border-gray-100 dark:border-subtle-border bg-white dark:bg-surface-primary hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] text-left transition-all space-y-3 group"
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="space-y-1">
                            <h4 className="font-sans font-bold text-sm text-gray-800 dark:text-text-primary group-hover:text-blue-500 transition-colors">
                              {p.title}
                            </h4>
                            <p className="font-sans text-xs text-gray-400 flex items-center gap-1.5">
                              <CalendarDays size={12} className="text-gray-400" />
                              <span>{p.startDate} ~ {p.endDate}</span>
                            </p>
                          </div>
                          <span className="text-[10px] font-sans font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            {p.durationText}
                          </span>
                        </div>
                        
                        <div className="border-t border-gray-50 dark:border-subtle-border/40 pt-2 flex items-center justify-between text-[11px] text-gray-400 font-sans">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            <span>{cleanLocation(p.title)}</span>
                          </span>
                          <span>
                            {language === 'ko' ? `총 ${totalActivities}개 일정` : `${totalActivities} activities`}
                          </span>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Write Modal */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWriteModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:max-w-md md:mx-auto"
            />

            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 dark:bg-app-bg rounded-t-[28px] h-[86vh] max-h-[86vh] overflow-hidden flex flex-col shadow-2xl md:max-w-md md:mx-auto border-t border-gray-100 dark:border-subtle-border"
            >
              {/* Drag Indicator Handle */}
              <div className="w-full flex justify-center py-3">
                <div className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full" />
              </div>

              {/* Sheet Sticky Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-subtle-border bg-white dark:bg-surface-primary sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <h2 className="font-sans font-bold text-lg text-gray-800 dark:text-text-primary">
                    {editingLog ? (language === 'ko' ? '기록 수정' : 'Edit Record') : (language === 'ko' ? '새 기록 작성' : 'New Record')}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsWriteModalOpen(false)}
                    className="bg-gray-100 dark:bg-surface-secondary text-gray-500 dark:text-text-secondary p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-blue-600 text-white font-sans font-bold text-xs px-4 py-2 rounded-full shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    {language === 'ko' ? '저장' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Sheet Scrollable Forms */}
              <div className="p-6 space-y-5 overflow-y-auto pb-12 flex-1 bg-gray-50 dark:bg-app-bg custom-scrollbar">
                {/* Form fields layout card */}
                <div className="bg-white dark:bg-surface-primary rounded-2xl p-4 border border-gray-100 dark:border-subtle-border space-y-4">
                  <div className="space-y-1">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '제목' : 'Title'}</label>
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder={language === 'ko' ? '기억에 남는 멋진 순간' : 'A memorable moment'}
                      className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 text-sm font-sans text-gray-800 dark:text-text-primary focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '위치' : 'Location'}</label>
                      <input
                        type="text"
                        value={draftLocation}
                        onChange={(e) => setDraftLocation(e.target.value)}
                        placeholder="예: 파리 에펠탑"
                        className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 text-sm font-sans text-gray-800 dark:text-text-primary focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '날짜' : 'Date'}</label>
                      <input
                        type="text"
                        value={draftDate}
                        onChange={(e) => setDraftDate(e.target.value)}
                        placeholder="YYYY.MM.DD"
                        className="w-full bg-gray-50/50 dark:bg-app-bg rounded-xl border border-gray-100 dark:border-subtle-border px-3.5 py-3 text-sm font-sans text-gray-800 dark:text-text-primary focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1924] outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">{language === 'ko' ? '내용' : 'Content'}</label>
                    <CanvasEditor 
                      text={draftContent} 
                      onChangeText={setDraftContent} 
                      stamps={draftStamps} 
                      onChangeStamps={setDraftStamps} 
                      placeholder={language === 'ko' ? '이 날의 기분과 있었던 일을 자유롭게 적어보세요. (터치/드래그하여 스탬프 이동)' : 'Write down what happened...'}
                      isDarkMode={isDarkMode}
                    />
                    
                    {draftStamps.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {draftStamps.map((stamp, index) => (
                          <div key={stamp.id || index} className="relative w-10 h-10 bg-stone-100 dark:bg-surface-secondary rounded-lg flex items-center justify-center group shadow-sm border border-stone-200 dark:border-zinc-700">
                            {stamp?.imageUrl && (stamp.imageUrl.startsWith('data:image') || stamp.imageUrl.startsWith('/') || stamp.imageUrl.startsWith('http')) ? (
                               <img src={stamp.imageUrl} alt="stamp" className="w-8 h-8 object-contain" />
                            ) : (
                               <span className="text-xl">{stamp?.imageUrl}</span>
                            )}
                            <button 
                              onClick={() => setDraftStamps(draftStamps.filter((_, i) => i !== index))}
                              className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow hover:bg-red-600"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 h-12 bg-gray-50 dark:bg-app-bg border border-gray-100 dark:border-subtle-border rounded-xl flex items-center justify-center gap-2 text-stone-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-[#1c1a29] transition-colors font-medium text-sm">
                      <ImageIcon size={18} className="text-blue-500" />
                      <span>{language === 'ko' ? '사진 추가' : 'Add Photo'}</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

                    <button onClick={() => setIsStampDrawerOpen(true)} className="flex-1 h-12 bg-gray-50 dark:bg-app-bg border border-gray-100 dark:border-subtle-border rounded-xl flex items-center justify-center gap-2 text-stone-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-[#1c1a29] transition-colors font-medium text-sm">
                      <SmilePlus size={18} className="text-purple-500" />
                      <span>{language === 'ko' ? '스탬프 추가' : 'Add Stamp'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stamp Drawer Overlay */}
            <AnimatePresence>
              {isStampDrawerOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsStampDrawerOpen(false)}
                  className="fixed inset-0 bg-black/20 z-[55] md:max-w-md md:mx-auto"
                />
              )}
            </AnimatePresence>

            {/* Stamp Drawer */}
            <AnimatePresence>
              {isStampDrawerOpen && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-surface-primary rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-[60] flex flex-col max-h-[60vh] border-t border-stone-200 dark:border-subtle-border"
                >
                  <div className="flex justify-between items-center p-4 border-b border-stone-100 dark:border-subtle-border">
                    <h4 className="font-bold text-lg text-stone-800 dark:text-text-primary">{language === 'ko' ? '스탬프 선택' : 'Select Stamp'}</h4>
                    <button onClick={() => setIsStampDrawerOpen(false)} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 bg-stone-50 dark:bg-surface-secondary rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="p-4 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-3 gap-3">
                      {defaultStamps.map(stamp => (
                        <button
                          key={stamp.id}
                          onClick={() => {
                            handleAddStampToCanvas(stamp.imageUrl);
                            setIsStampDrawerOpen(false);
                          }}
                          className="aspect-square bg-stone-50 dark:bg-surface-secondary border border-stone-100 dark:border-subtle-border rounded-2xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all p-2"
                        >
                          <img src={stamp.imageUrl} alt="stamp" className="w-full h-full object-contain drop-shadow-sm" />
                        </button>
                      ))}
                    </div>

                    {customStamps.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-3 px-1">{language === 'ko' ? '내 스탬프' : 'My Stamps'}</p>
                        <div className="grid grid-cols-3 gap-3">
                          {customStamps.map(stamp => (
                            <div key={stamp.id} className="relative aspect-square group">
                              <button
                                onClick={() => {
                                  handleAddStampToCanvas(stamp.imageUrl);
                                  setIsStampDrawerOpen(false);
                                }}
                                className="w-full h-full bg-stone-50 dark:bg-surface-secondary border border-stone-100 dark:border-subtle-border rounded-2xl flex items-center justify-center hover:bg-stone-100 dark:hover:bg-zinc-700 transition-all p-2"
                              >
                                <img src={stamp.imageUrl} alt="custom stamp" className="w-full h-full object-contain drop-shadow-sm" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteCustomStamp(stamp.id, e)}
                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-stone-100 dark:border-subtle-border">
                      <button onClick={() => stampInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-stone-300 dark:border-zinc-700 rounded-xl flex items-center justify-center gap-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-zinc-800 hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-400 transition-colors font-medium">
                        <Plus size={18} />
                        <span>{language === 'ko' ? '나만의 스탬프 추가' : 'Add Custom Stamp'}</span>
                      </button>
                      <input type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>

      {/* Viewing Modal */}
      <AnimatePresence>
        {viewingLog && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingLog(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:max-w-md md:mx-auto"
            />

            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface-primary rounded-t-[28px] h-[86vh] max-h-[86vh] overflow-hidden flex flex-col shadow-2xl md:max-w-md md:mx-auto border-t border-gray-100 dark:border-subtle-border"
              onClick={e => e.stopPropagation()}
            >
              {/* Drag Indicator Handle */}
              <div className="w-full flex justify-center py-3">
                <div className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full" />
              </div>

              <div className="p-6 overflow-y-auto pb-12 flex-1 custom-scrollbar">
                <button
                  onClick={() => setViewingLog(null)}
                  className="absolute top-4 right-4 p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col gap-4">
                  <h2 className="font-logo font-bold text-2xl text-stone-900 dark:text-text-primary pr-12">{viewingLog.title}</h2>
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-stone-100 dark:border-subtle-border">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 dark:text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={16} />
                        <span>{viewingLog.date}</span>
                      </div>
                      {viewingLog.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={16} />
                          <span>{viewingLog.location}</span>
                        </div>
                      )}
                    </div>

                    {!isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setViewingLog(null);
                            handleStartEdit(viewingLog);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                          title={language === 'ko' ? '기록 수정' : 'Edit Log'}
                        >
                          <PenTool size={13} />
                          <span>{language === 'ko' ? '수정' : 'Edit'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsConfirmingDelete(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-full transition-colors"
                          title={language === 'ko' ? '기록 삭제' : 'Delete Log'}
                        >
                          <Trash2 size={13} />
                          <span>{language === 'ko' ? '삭제' : 'Delete'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 px-3 py-1 rounded-2xl border border-red-100 dark:border-red-900/30">
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                          {language === 'ko' ? '정말 삭제할까요?' : 'Delete this log?'}
                        </span>
                        <button
                          onClick={() => {
                            onDeleteLog(viewingLog.id);
                            setIsConfirmingDelete(false);
                            setViewingLog(null);
                          }}
                          className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          {language === 'ko' ? '삭제' : 'Delete'}
                        </button>
                        <button
                          onClick={() => setIsConfirmingDelete(false)}
                          className="px-2 py-0.5 text-xs font-semibold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                          {language === 'ko' ? '취소' : 'Cancel'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-2xl p-2 bg-stone-50 dark:bg-surface-secondary mt-1">
                    <CanvasEditor 
                      text={viewingLog.content || ''} 
                      stamps={(Array.isArray(viewingLog.stamps) ? viewingLog.stamps : []).filter(Boolean).map((s, i) => {
                        if (typeof s === 'string') {
                          return { id: `legacy-${i}`, imageUrl: s, x: 20 + i*10, y: 20 + i*10, w: 40, h: 40 } as any;
                        }
                        return {
                          ...s,
                          id: s.id !== undefined && s.id !== null ? String(s.id) : `stamp-${i}`
                        };
                      })} 
                      readOnly 
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
