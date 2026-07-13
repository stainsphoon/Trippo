import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { PenTool, CalendarCheck, MapPin, CalendarDays, Waves, Plus, Trash2, Image as ImageIcon, X, ArrowLeft, ChevronRight, FileText, Check, Clock, ChevronLeft, BookOpen, Globe, User, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TravelLog, TravelPlan } from '../types';
import { Language } from '../utils/translations';

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

export default function RecordTab({ logs, onAddLog, onDeleteLog, onUpdateLog, onNavigateToPlan, plan, language = 'ko', isDarkMode = false }: RecordTabProps) {
  // Passport specific states
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [activeLogIndex, setActiveLogIndex] = useState(0); // 0 is Info page, 1..N are Logs
  const [selectedLog, setSelectedLog] = useState<TravelLog | null>(null);
  const [editingLog, setEditingLog] = useState<TravelLog | null>(null);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  // Draft Form states
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftDate, setDraftDate] = useState(new Date().toISOString().split('T')[0].replace(/-/g, '.'));
  const [draftImage, setDraftImage] = useState('');
  const [draftTag, setDraftTag] = useState('');
  
  // Custom Memory Scrapbook States
  const [draftMood, setDraftMood] = useState('🥰 설렘');
  const [draftWeather, setDraftWeather] = useState('☀️ 맑음');
  const [draftAnecdote, setDraftAnecdote] = useState('');
  const [draftBestBite, setDraftBestBite] = useState('');
  const [draftVisitedSpots, setDraftVisitedSpots] = useState<string[]>([]);
  const [availableSpots, setAvailableSpots] = useState<string[]>([]);
  const [draftStickers, setDraftStickers] = useState<string[]>([]);

  // Import Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportPlan, setSelectedImportPlan] = useState<TravelPlan | null>(null);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Wheel tracking for MacBook trackpad horizontal swipes
  const lastWheelTime = useRef<number>(0);

  // Auto-open and focus on newly created stamps
  const prevLogsLength = useRef(logs.length);
  useEffect(() => {
    if (logs.length > prevLogsLength.current) {
      setIsPassportOpen(true);
      // Open the latest log index (logs.length because index 0 is Info page, so logs[logs.length-1] is index logs.length)
      setActiveLogIndex(logs.length);
    }
    prevLogsLength.current = logs.length;
  }, [logs.length]);

  // Sample static images for quick selection (hotlinked from high quality ones provided)
  const sampleImages = [
    { name: '파리 에펠탑', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo8E1CUWLqh5h5-RW4LTMTds36iv9SrH3YENHdWfPSNORN_A7R_yJUpRmIGUREKwiVl8t109wGxIkYhYWQgfzdkS5fbsjpwV1P7wqLDD0Ghre_vdVFttq7qcqHJSM3hN2I3QS92bosNC-Ei1LBps8FrOi2Cp4N3agWPKQgkDVi_kcTgj_JSZyClXvxGnvkfzeqZ6W5gCl_QITMOcnXfBs67y-pOdybURI5P4hQQWVzny6F8HK-jgsiEYcQc8yBUgOL0kGw36aMr6_g' },
    { name: '도쿄 골목', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfPr6McA7a_VtAfeJrSYg93U6LtIj6szwoP3rf9CBwdRpFvcrFBSroQs-1metghR4G_dYx7YAeV2JFvArJRBE4z7Wz0rF0mSfFS36WYrQtxodwYw1Mn0XMR0ueTIeK82ReHHKadoA3Wrl5PnYOGVX0f8e1gZF_QLDX8FRF6Ba-KxIgyiepnwzDExk-pNggaSdho7UuY3YyMUUnYkIX2AqBGmWidLw2MJBijLwjZa6sZbjecOXUOVAWYabS12AppTibmwkMzYsGAuAo' },
    { name: '보라카이 바다', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWGj2W8QQZEcJENttTEWnT6iqUvk2UMneKIDrzr7-ohw7agq9tBG4ZZRGxYpO7w3smi9mpEF0vx563iKLpliig1l19w2a85l_cv_GWTdRUYqjI29fJzkYWBoycogSOGk8k1LKAbUuogwhVrcgazEZoVpZ1JzpSjwS8VwqQQAmjadT3B-T-3OeLQnLRmUrbzIvGbDLvC6UsEJmaD3LtVadjzFPlJMY2GOdm50_OMaOppvlGpxvn9dGs-UWbXclJDqUiMUJQpME2yhri' }
  ];

  // Preset stickers for stamping and decorating
  const PRESET_STICKERS = [
    { id: 'stamp_pass', emoji: '🛂', label: 'APPROVED' },
    { id: 'stamp_plane', emoji: '✈️', label: 'DEPARTURE' },
    { id: 'stamp_camera', emoji: '📸', label: 'MEMORY' },
    { id: 'stamp_star', emoji: '⭐️', label: 'FAVORITE' },
    { id: 'stamp_food', emoji: '😋', label: 'YUMMY!' },
    { id: 'stamp_heart', emoji: '💖', label: 'LOVE IT' },
    { id: 'stamp_clover', emoji: '🍀', label: 'LUCKY' },
    { id: 'stamp_ticket', emoji: '🎟️', label: 'ADMIT ONE' },
    { id: 'stamp_coffee', emoji: '☕', label: 'RELAX' }
  ];

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setDraftImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartEdit = (log: TravelLog) => {
    setEditingLog(log);
    setDraftTitle(log.title);
    setDraftLocation(log.location || '');
    setDraftDate(log.date);
    setDraftImage(log.image || '');
    setDraftTag(log.tag || '');

    let scrapbookData: any = null;
    let isScrapbook = false;
    if (log.content && log.content.startsWith('{')) {
      try {
        scrapbookData = JSON.parse(log.content);
        isScrapbook = true;
      } catch (e) {}
    }

    if (isScrapbook && scrapbookData) {
      setDraftContent(scrapbookData.story || '');
      setDraftMood(scrapbookData.mood || '🥰 설렘');
      setDraftWeather(scrapbookData.weather || '☀️ 맑음');
      setDraftAnecdote(scrapbookData.anecdote || '');
      setDraftBestBite(scrapbookData.bestBite || '');
      setDraftVisitedSpots(scrapbookData.visitedSpots || []);
      setDraftStickers(scrapbookData.stickers || []);
    } else {
      setDraftContent(log.content || '');
      setDraftMood('🥰 설렘');
      setDraftWeather('☀️ 맑음');
      setDraftAnecdote('');
      setDraftBestBite('');
      setDraftVisitedSpots([]);
      setDraftStickers([]);
    }

    if (plan) {
      const spots: string[] = [];
      for (const day of plan.days) {
        for (const item of day.items) {
          spots.push(item.title);
        }
      }
      const uniqueSpots = Array.from(new Set(spots));
      setAvailableSpots(uniqueSpots);
    } else {
      setAvailableSpots([]);
    }

    setSelectedLog(null);
    setIsWriteModalOpen(true);
  };

  const handleSave = () => {
    if (!draftTitle.trim() || !draftContent.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    // Pack rich scrapbook memories together in structured JSON!
    const scrapbookData = {
      story: draftContent,
      mood: draftMood,
      weather: draftWeather,
      anecdote: draftAnecdote,
      bestBite: draftBestBite,
      visitedSpots: draftVisitedSpots,
      stickers: draftStickers
    };

    if (editingLog) {
      onUpdateLog({
        id: editingLog.id,
        title: draftTitle,
        content: JSON.stringify(scrapbookData),
        location: draftLocation || undefined,
        date: draftDate,
        image: draftImage || undefined,
        tag: draftTag || undefined
      });
      setEditingLog(null);
    } else {
      onAddLog({
        title: draftTitle,
        content: JSON.stringify(scrapbookData),
        location: draftLocation || undefined,
        date: draftDate,
        image: draftImage || undefined,
        tag: draftTag || undefined
      });
    }

    // Reset states
    setDraftTitle('');
    setDraftContent('');
    setDraftLocation('');
    setDraftImage('');
    setDraftTag('');
    setDraftMood('🥰 설렘');
    setDraftWeather('☀️ 맑음');
    setDraftAnecdote('');
    setDraftBestBite('');
    setDraftVisitedSpots([]);
    setAvailableSpots([]);
    setDraftStickers([]);
    setIsWriteModalOpen(false);
    alert(editingLog ? '소중한 여행의 기억이 아름답게 수정되었습니다! 💖' : '추억의 조각들이 따뜻하게 여권에 기록되었습니다! 💖');
  };

  const handleImportPlan = (p: TravelPlan) => {
    // Populate draft states
    setDraftTitle(`${p.title} 추억 저장`);
    
    // Convert e.g., "2024. 10. 15" -> "2024.10.15" or keep clean
    const cleanDate = p.startDate.replace(/\s+/g, '');
    setDraftDate(cleanDate);
    
    const loc = p.title.replace(' 여행 계획', '').replace(' 계획', '').trim();
    setDraftLocation(loc);

    // Find first image in the items
    let firstImage = '';
    const spots: string[] = [];
    for (const day of p.days) {
      for (const item of day.items) {
        spots.push(item.title);
        if (item.images && item.images.length > 0 && !firstImage) {
          firstImage = item.images[0];
        }
      }
    }
    setDraftImage(firstImage);
    setDraftTag('계획추억');
    
    const uniqueSpots = Array.from(new Set(spots));
    setAvailableSpots(uniqueSpots);
    setDraftVisitedSpots(uniqueSpots); // Precheck all spots by default so users can select/customize!

    setDraftMood('🤩 신남');
    setDraftWeather('☀️ 맑음');
    setDraftAnecdote('');
    setDraftBestBite('');
    setDraftContent(`계획했던 ${p.title} 여행을 마친 후 느낀 사소한 기쁨이나 잊지 못할 추억을 가득 적어보세요.`);

    setIsImportModalOpen(false);
    setSelectedImportPlan(null);
    setIsWriteModalOpen(true); // Open the write editor modal directly!
  };

  return (
    <div className="space-y-8">
      {/* Interactive Passport Book Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between relative pb-1">
          <h3 className="font-sans font-black text-xl text-stone-800 flex items-center gap-2">
            <BookOpen className="text-[#3b82f6]" size={24} />
            <span>나의 여행 여권</span>
          </h3>
          <div className="flex items-center gap-2">
            {/* The + Button for adding logs */}
            <div className="relative">
              <button
                onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                className="w-10 h-10 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all z-40 relative"
                title="기록 추가하기"
              >
                <Plus size={22} className={`transition-transform duration-200 ${isAddDropdownOpen ? 'rotate-45' : ''}`} />
              </button>
              
              {/* Dropdown menu */}
              <AnimatePresence>
                {isAddDropdownOpen && (
                  <>
                    {/* Backdrop to close */}
                    <div className="fixed inset-0 z-35" onClick={() => setIsAddDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-2xl shadow-xl py-1.5 z-40"
                    >
                      <button
                        onClick={() => {
                          setIsAddDropdownOpen(false);
                          setIsWriteModalOpen(true);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-stone-50 flex items-center gap-2.5 font-sans text-xs font-bold text-stone-700 transition-colors"
                      >
                        <PenTool size={15} className="text-blue-500" />
                        <span>✍️ 새로 기록하기</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsAddDropdownOpen(false);
                          setIsImportModalOpen(true);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-stone-50 flex items-center gap-2.5 font-sans text-xs font-bold text-stone-700 transition-colors"
                      >
                        <CalendarCheck size={15} className="text-emerald-500" />
                        <span>📂 계획에서 불러오기</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {isPassportOpen && (
              <button
                onClick={() => setIsPassportOpen(false)}
                className="text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1 h-10"
              >
                여권 닫기
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isPassportOpen ? (
            // PASSPORT COVER (Pastel Sage Green Style - No dynamic cover animations)
            <div
              key="passport-cover"
              onClick={() => setIsPassportOpen(true)}
              className="relative overflow-hidden w-full max-w-[320px] mx-auto aspect-[3/4.2] rounded-[32px] bg-[#dbebe1] border-4 border-stone-800 shadow-2xl flex flex-col justify-between p-6 select-none cursor-pointer active:opacity-95"
            >
              {/* Subtle Grid Diary Paper Background Pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:16px_16px]" />

              {/* Passport Spine (Stitch / Binder scrapbook style) */}
              <div className="absolute left-0 top-0 bottom-0 w-5 bg-stone-800/5 border-r-3 border-dashed border-stone-800/20 z-10" />

              {/* Top Text / Logo (Bubble Style with crisp thick black stroke like sticker) */}
              <div className="text-center mt-3 space-y-1.5 z-10 flex flex-col items-center pl-4">
                <h4 
                  className="font-sans font-black text-5xl text-[#5da3f4] tracking-wide select-none filter drop-shadow-[0_2.5px_0_rgba(28,55,103,1)]"
                  style={{
                    WebkitTextStroke: "2.5px #1c1917",
                    paintOrder: "stroke fill"
                  }}
                >
                  Trippo
                </h4>
                <p className="font-sans font-extrabold tracking-[0.2em] text-[#3d6052] text-[10px] uppercase">
                  Travel Passport
                </p>
              </div>

              {/* Minimalist Globe Stamp Emblem in center - Static, no spin animations */}
              <div className="flex flex-col items-center justify-center py-4 z-10 pl-4">
                <div className="relative w-40 h-40 rounded-full border-4 border-stone-800 bg-white/40 flex items-center justify-center shadow-md">
                  <div className="absolute inset-2 border-2 border-dashed border-stone-800/15 rounded-full pointer-events-none" />
                  <div className="w-24 h-24 rounded-full border-3 border-stone-800 bg-white flex flex-col items-center justify-center shadow-inner">
                    <Globe className="text-[#4a7865] w-12 h-12" strokeWidth={2.5} />
                    <span className="font-mono text-[6px] text-stone-400 font-bold tracking-widest mt-1">JOURNAL</span>
                  </div>
                  {/* Clean badge accent */}
                  <div className="absolute text-stone-900 text-[9px] font-black tracking-widest bg-[#fbbf24] border-2 border-stone-800 px-3 py-0.5 rounded-lg shadow-sm bottom-4">
                    EST. 2026
                  </div>
                </div>
              </div>

              {/* Cute scrapbook stickers to make it extra casual & decorative */}
              <div className="absolute top-[38%] left-8 bg-[#f87171] text-white border-2 border-stone-800 rounded-lg px-2 py-0.5 text-[8px] font-bold tracking-widest font-sans uppercase -rotate-12 shadow-sm select-none">
                SEOUL
              </div>
              <div className="absolute bottom-[35%] right-6 bg-[#34d399] text-stone-800 border-2 border-stone-800 rounded-full w-9 h-9 flex items-center justify-center text-xs font-bold rotate-12 shadow-sm select-none">
                ✈️
              </div>
              <div className="absolute bottom-16 left-12 bg-[#fbbf24] text-stone-900 border-2 border-stone-800 rounded-lg px-1.5 py-0.5 text-[7px] font-black uppercase rotate-[15deg] shadow-sm select-none">
                BOARDING
              </div>

              {/* Bottom Text / Touch cue - Simple and static */}
              <div className="text-center mb-1 space-y-1.5 z-10 pl-4">
                <div className="inline-flex items-center gap-1.5 bg-[#4a7865]/10 text-[#4a7865] px-4 py-2 rounded-2xl border border-[#4a7865]/20 text-xs font-black shadow-sm bg-white">
                  <span>여권 열어보기</span>
                  <span>📖</span>
                </div>
              </div>
            </div>
          ) : (
            // PASSPORT OPENED
            <motion.div
              key="passport-opened"
              initial={{ opacity: 0, scale: 0.95, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.95, rotateY: -10 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-[#4d3c2e] p-2.5 rounded-3xl border border-stone-800 shadow-2xl relative"
            >
              {/* Spine shadow overlay */}
              <div className="absolute left-[24px] top-4 bottom-4 w-[1px] bg-black/30 z-20 pointer-events-none" />

              {/* Inside paper (Supports trackpad horizontal swipes on MacBook with stable sensitivity) */}
              <div 
                onWheel={(e) => {
                  // Only swipe on dominant horizontal trackpad gestures with a higher, stable threshold (e.g. 35) to prevent hypersensitivity
                  if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 35) {
                    const now = Date.now();
                    if (now - lastWheelTime.current > 700) {
                      if (e.deltaX > 35) {
                        // Swiped trackpad left -> go to next page
                        if (activeLogIndex < logs.length) {
                          setDragDirection('left');
                          setActiveLogIndex((prev) => prev + 1);
                          lastWheelTime.current = now;
                        }
                      } else if (e.deltaX < -35) {
                        // Swiped trackpad right -> go to previous page
                        if (activeLogIndex > 0) {
                          setDragDirection('right');
                          setActiveLogIndex((prev) => prev - 1);
                          lastWheelTime.current = now;
                        }
                      }
                    }
                  }
                }}
                className="bg-[#faf6eb] text-stone-800 rounded-2xl p-4 sm:p-5 min-h-[460px] relative overflow-hidden flex flex-col justify-between border border-stone-200 shadow-inner select-none"
              >
                {/* Guilloché pattern background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none">
                  <Globe className="w-64 h-64 text-blue-900" />
                </div>

                {/* Header info */}
                <div className="border-b border-stone-200 pb-2 flex justify-between items-center z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🇰🇷</span>
                    <span className="font-sans font-black text-[10px] text-stone-500 uppercase tracking-widest">
                      {activeLogIndex === 0 ? '신원정보면 / Identity Page' : `출입국 사증 / VISAS (Page ${activeLogIndex})`}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] font-black text-stone-400">
                    {activeLogIndex + 1} / {logs.length + 1}
                  </span>
                </div>

                {/* Main page slide */}
                <div className="flex-1 my-3 flex flex-col justify-center relative z-10 min-h-[300px]">
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(e, info) => {
                      // Moderate sensitivity for drag swipes: requires clear drag offset (80px) or deliberate fast flick
                      const swipeThreshold = 80;
                      const isSwipeLeft = info.offset.x < -swipeThreshold || (info.offset.x < -25 && info.velocity.x < -350);
                      const isSwipeRight = info.offset.x > swipeThreshold || (info.offset.x > 25 && info.velocity.x > 350);
                      if (isSwipeLeft && activeLogIndex < logs.length) {
                        setDragDirection('left');
                        setActiveLogIndex(activeLogIndex + 1);
                      } else if (isSwipeRight && activeLogIndex > 0) {
                        setDragDirection('right');
                        setActiveLogIndex(activeLogIndex - 1);
                      }
                    }}
                    style={{ touchAction: 'pan-y' }}
                    className="cursor-grab active:cursor-grabbing w-full h-full flex flex-col justify-center"
                  >
                    <AnimatePresence mode="wait">
                      {activeLogIndex === 0 ? (
                        // IDENTITY PAGE
                        <motion.div
                          key="identity-page"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="flex gap-4 items-start">
                            {/* Profile photo */}
                            <div className="w-24 h-32 bg-stone-100 rounded-lg border-2 border-stone-300 shadow-md overflow-hidden relative shrink-0 flex items-center justify-center">
                              <div className="absolute inset-0 bg-gradient-to-b from-stone-200 to-stone-400 flex items-end justify-center">
                                <User className="w-16 h-16 text-stone-100 mb-1" />
                              </div>
                              <div className="absolute bottom-2 -right-2 rotate-[-12deg] border border-blue-500/60 bg-white/80 text-blue-600 font-sans font-black text-[8px] py-0.5 px-1.5 rounded uppercase tracking-wider select-none pointer-events-none scale-90">
                                SEOUL IMMIG
                              </div>
                            </div>

                            {/* Identity detail */}
                            <div className="flex-1 space-y-2 text-[10px] sm:text-xs">
                              <div>
                                <span className="block text-[8px] font-black text-stone-400 uppercase leading-none">성 / Surname</span>
                                <span className="font-sans font-black text-stone-800">TRIPPO</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-black text-stone-400 uppercase leading-none">이름 / Given Name</span>
                                <span className="font-sans font-black text-stone-800">TRAVELLER</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="block text-[8px] font-black text-stone-400 uppercase leading-none">국적 / Nationality</span>
                                  <span className="font-sans font-bold text-stone-800">KOR</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] font-black text-stone-400 uppercase leading-none">여권번호 / Passport No</span>
                                  <span className="font-mono font-bold text-stone-800">TR20260711</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="block text-[8px] font-black text-stone-400 uppercase leading-none">발행일 / Date of Issue</span>
                                  <span className="font-sans font-medium text-stone-700">11 JUL 2026</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] font-black text-stone-400 uppercase leading-none">기간만료 / Date of Expiry</span>
                                  <span className="font-sans font-medium text-stone-700">10 JUL 2036</span>
                                </div>
                              </div>
                              <div>
                                <span className="block text-[8px] font-black text-stone-400 uppercase leading-none">소지한 스탬프 / Stamps Count</span>
                                <span className="font-sans font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5 shadow-sm">
                                  {logs.length} Stamps
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Barcode & MRZ */}
                          <div className="pt-4 border-t border-dashed border-stone-300 space-y-1.5">
                            <div className="flex flex-col items-center justify-center opacity-70">
                              <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,#1c1917,#1c1917_2px,transparent_2px,transparent_6px,#1c1917_6px,#1c1917_9px)]" />
                              <span className="font-mono text-[8px] tracking-widest text-stone-500 pt-0.5">TRIPPO-TRAVEL-ENGINE-2026</span>
                            </div>
                            <div className="bg-stone-100/60 p-2 rounded-lg border border-stone-200/50">
                              <p className="font-mono text-[9px] text-stone-500 uppercase tracking-widest leading-none whitespace-pre-wrap">
                                {`P<KORTravel<<Trippo<<<<<<<<<<<<<<<<<<<<<<\nTR20260711<3KOR8812301M2607110<<<<<<<<`}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        // STAMP / VISA SLIDE
                        (() => {
                          const logIndex = activeLogIndex - 1;
                          const log = logs[logIndex];
                          if (!log) return null;

                          const stampStyle = logIndex % 3;

                          // Parse JSON if possible for rich memory scrapbook visuals
                          let scrapbookData: any = null;
                          let isScrapbook = false;
                          if (log.content && log.content.startsWith('{')) {
                            try {
                              scrapbookData = JSON.parse(log.content);
                              isScrapbook = true;
                            } catch (e) {
                              isScrapbook = false;
                            }
                          }

                          return (
                            <motion.div
                              key={`stamp-page-${log.id}`}
                              initial={{ opacity: 0, x: dragDirection === 'left' ? 30 : -30 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: dragDirection === 'left' ? -30 : 30 }}
                              transition={{ duration: 0.25 }}
                              onTap={() => setSelectedLog(log)}
                              className="space-y-4 flex flex-col items-center justify-center select-none cursor-pointer"
                            >
                              {/* Stamp Render */}
                              <div className="w-full flex justify-center py-1">
                                {stampStyle === 0 && (
                                  <div className="w-24 h-24 border-4 border-double border-teal-600/80 rounded-full flex flex-col items-center justify-center p-1.5 relative text-teal-600/80 font-sans font-bold select-none rotate-3 shadow-sm bg-teal-50/10">
                                    <span className="text-[7px] tracking-[0.2em] uppercase leading-none mb-1">DEPARTED</span>
                                    <div className="flex items-center gap-1 border-y border-teal-600/50 py-0.5 px-1.5 text-[11px] font-mono leading-none my-0.5">
                                      <span>✈️</span>
                                      <span>{log.date}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider truncate max-w-[80px] text-center">{log.location || 'KOREA'}</span>
                                    <span className="text-[6px] tracking-widest text-teal-600/60 uppercase mt-0.5">KOR IMMIG</span>
                                  </div>
                                )}

                                {stampStyle === 1 && (
                                  <div className="w-32 h-20 border-2 border-rose-600/80 rounded-xl flex flex-col items-center justify-center p-2 relative text-rose-600/80 font-sans font-bold select-none -rotate-6 shadow-sm bg-rose-50/10">
                                    <span className="text-[8px] tracking-[0.15em] uppercase leading-none mb-1">IMMIGRATION / ARRIVED</span>
                                    <div className="w-full border-t border-dashed border-rose-600/60 my-0.5" />
                                    <span className="text-[11px] font-mono font-black py-0.5 px-2 bg-rose-100/30 rounded">{log.date}</span>
                                    <div className="w-full border-b border-dashed border-rose-600/60 my-0.5" />
                                    <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-[110px]">{log.location || 'TOKYO'}</span>
                                  </div>
                                )}

                                {stampStyle === 2 && (
                                  <div className="w-32 h-22 border-2 border-dashed border-indigo-600/80 rounded-lg flex flex-col items-center justify-center p-1.5 relative text-indigo-600/80 font-sans font-bold select-none rotate-6 shadow-sm bg-indigo-50/10">
                                    <div className="absolute top-0.5 left-1 text-[6px] tracking-wider text-indigo-500">APPROVED ENTRY</div>
                                    <span className="text-[10px] font-black uppercase tracking-widest mb-1">{log.location || 'PARIS'}</span>
                                    <div className="flex items-center gap-1 py-0.5 px-2 bg-indigo-100/30 border border-indigo-600/40 rounded font-mono text-[10px] leading-none mb-1">
                                      <span>✈️</span>
                                      <span>{log.date}</span>
                                    </div>
                                    <span className="text-[6px] tracking-[0.1em] text-indigo-600/60 uppercase">IMMIGRATION OFFICER</span>
                                  </div>
                                )}
                              </div>

                              {/* Polaroid photo representation with tape and stickers */}
                              {log.image ? (
                                <div className="w-48 bg-white p-2.5 pb-4 rounded-md shadow-md border border-stone-200/60 rotate-[-1.5deg] relative group transition-transform hover:rotate-1">
                                  {/* Scrapbook Washi Tape Deco */}
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-amber-200/65 border border-amber-300/30 transform rotate-[-3deg] select-none pointer-events-none" />
                                  
                                  {/* Cute Mood/Weather Sticker Badges pinned to Polaroid */}
                                  {isScrapbook && (
                                    <div className="absolute -bottom-2 -left-2 flex flex-col gap-0.5 z-10 scale-90">
                                      <span className="bg-white border-2 border-stone-800 text-xs px-1.5 py-0.5 rounded-full font-sans font-bold shadow-md transform rotate-[-8deg] shrink-0 text-stone-800">
                                        {scrapbookData.mood}
                                      </span>
                                      <span className="bg-white border-2 border-stone-800 text-xs px-1.5 py-0.5 rounded-full font-sans font-bold shadow-md transform rotate-[5deg] shrink-0 text-stone-800">
                                        {scrapbookData.weather}
                                      </span>
                                    </div>
                                  )}

                                  {/* Stamp Stickers preview overlay on Polaroid top-right */}
                                  {isScrapbook && scrapbookData?.stickers && scrapbookData.stickers.length > 0 && (
                                    <div className="absolute -top-2.5 -right-2 flex gap-0.5 z-15">
                                      {scrapbookData.stickers.slice(0, 3).map((emoji: string, idx: number) => (
                                        <span 
                                          key={idx} 
                                          className="bg-white border-2 border-stone-800 w-6 h-6 flex items-center justify-center rounded-full text-xs shadow-md font-bold select-none"
                                          style={{ transform: `rotate(${(idx % 2 === 0 ? 10 : -10) * (idx + 1)}deg)` }}
                                        >
                                          {emoji}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <div className="w-full h-28 bg-stone-100 rounded overflow-hidden">
                                    <img
                                      src={log.image}
                                      alt={log.title}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <p className="font-sans italic font-bold text-[10px] text-stone-600 text-center mt-2.5 truncate">
                                    "{log.title}"
                                  </p>
                                </div>
                              ) : (
                                <div className="w-44 bg-white/95 p-3 rounded-xl border border-stone-200/50 flex flex-col items-center justify-center py-6 text-center space-y-1 rotate-1 relative">
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 bg-blue-200/50 border border-blue-300/20 transform rotate-[2deg] select-none" />
                                  <span className="text-xl">✍️</span>
                                  <h4 className="font-sans font-bold text-xs text-stone-700 truncate max-w-[140px]">{log.title}</h4>
                                  <p className="font-sans text-[10px] text-stone-500">{log.date}</p>
                                </div>
                              )}

                              {/* Preview Content */}
                              <div className="text-center max-w-[220px]">
                                <p className="font-sans text-[11px] text-stone-600 leading-relaxed line-clamp-2">
                                  {isScrapbook ? scrapbookData.story : log.content}
                                </p>
                                {isScrapbook && scrapbookData.visitedSpots && scrapbookData.visitedSpots.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1 justify-center max-w-[210px] mx-auto opacity-90 scale-90">
                                    <span className="bg-[#4a7865]/10 text-[#4a7865] border border-[#4a7865]/20 font-sans font-black text-[8px] px-2 py-0.5 rounded-full">
                                      📍 {scrapbookData.visitedSpots.length}곳의 소중한 기록
                                    </span>
                                  </div>
                                )}
                                <span className="inline-flex items-center gap-1 font-sans text-[9px] font-black text-[#4a7865] bg-[#4a7865]/10 px-2 py-0.5 rounded-md mt-2 select-none">
                                  🔍 터치하여 추억 펼치기
                                </span>
                              </div>
                            </motion.div>
                          );
                        })()
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Bottom Swipe Controls */}
                <div className="border-t border-stone-200/80 pt-3 flex justify-between items-center z-10">
                  <button
                    onClick={() => {
                      setDragDirection('right');
                      if (activeLogIndex > 0) setActiveLogIndex(activeLogIndex - 1);
                    }}
                    disabled={activeLogIndex === 0}
                    className="p-1.5 hover:bg-stone-200/50 rounded-lg text-stone-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex gap-1.5 items-center justify-center max-w-[140px] overflow-hidden">
                    {Array.from({ length: logs.length + 1 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDragDirection(i > activeLogIndex ? 'left' : 'right');
                          setActiveLogIndex(i);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          i === activeLogIndex ? 'bg-blue-600 scale-125 w-3' : 'bg-stone-300'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setDragDirection('left');
                      if (activeLogIndex < logs.length) setActiveLogIndex(activeLogIndex + 1);
                    }}
                    disabled={activeLogIndex === logs.length}
                    className="p-1.5 hover:bg-stone-200/50 rounded-lg text-stone-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Travel Record Write Modal Overlay */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => { setIsWriteModalOpen(false); setEditingLog(null); }} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white dark:bg-[#1a1924] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-gray-100 dark:border-[#262435] flex flex-col max-h-[90vh] text-stone-800 dark:text-stone-100"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-[#262435] flex items-center justify-between bg-white dark:bg-[#15141f] sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✍️</span>
                  <h3 className="font-sans font-bold text-base text-gray-800 dark:text-zinc-100">
                    {editingLog 
                      ? (language === 'ko' ? '여행 기록 수정하기' : 'Edit Travel Record') 
                      : (language === 'ko' ? '새로운 여행 기록 남기기' : 'Write Travel Record')}
                  </h3>
                </div>
                <button
                  onClick={() => { setIsWriteModalOpen(false); setEditingLog(null); }}
                  className="p-1.5 hover:bg-gray-50 dark:hover:bg-stone-800 rounded-lg text-gray-400 dark:text-stone-500 hover:text-gray-700 dark:hover:text-stone-300 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-stone-50/30 dark:bg-[#13121a]/30">
                {/* 1. Memory Photo Section */}
                <div className="space-y-2.5 text-left">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">📸 추억의 한 장면 (사진 업로드 / 선택)</label>
                  {draftImage ? (
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm group">
                      <img src={draftImage} alt="Draft" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        onClick={() => setDraftImage('')}
                        className="absolute top-2.5 right-2.5 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-all active:scale-90 shadow"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="w-full h-32 border-2 border-dashed border-stone-300 rounded-2xl bg-white flex flex-col items-center justify-center text-stone-400 p-4 gap-2.5 shadow-inner">
                        <div className="flex flex-col items-center">
                          <ImageIcon size={24} className="mb-1 text-[#4a7865]" />
                          <span className="font-sans text-[11px] font-extrabold text-stone-700">추억하고 싶은 순간의 사진</span>
                          <span className="font-sans text-[9px] text-stone-400">사진첩에서 올리거나 샘플 사진을 선택해보세요</span>
                        </div>
                        
                        {/* Native Album Photo Upload */}
                        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#4a7865] rounded-xl border border-emerald-200 text-[10px] font-black cursor-pointer transition-all shadow-xs active:scale-95">
                          <Upload size={12} />
                          내 사진첩에서 가져오기
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      
                      {/* Image URL Input */}
                      <input
                        type="text"
                        placeholder="또는 http://... 이미지 주소 직접 입력"
                        value={draftImage}
                        onChange={(e) => setDraftImage(e.target.value)}
                        className="w-full bg-white rounded-xl border border-stone-200 px-3 py-2 text-[11px] font-sans text-stone-700 outline-none focus:ring-1 focus:ring-stone-400"
                      />

                      {/* Quick Sample Image Selection */}
                      <div className="grid grid-cols-3 gap-2">
                        {sampleImages.map((img) => (
                          <button
                            key={img.url}
                            onClick={() => {
                              setDraftImage(img.url);
                              if (img.name === '보라카이 바다') {
                                setDraftTag('자연휴양');
                              } else if (img.name === '파리 에펠탑') {
                                setDraftLocation('Paris');
                                setDraftTag('로맨틱');
                              } else {
                                setDraftLocation('Tokyo');
                                setDraftTag('도심탐방');
                              }
                            }}
                            className="rounded-xl overflow-hidden h-10 relative border border-stone-200/60 hover:opacity-90 active:scale-95 transition-all shadow-xs"
                          >
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-[9px] text-white font-extrabold whitespace-nowrap">{img.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Custom Stickers (Mood & Weather & Stamp Presets) */}
                <div className="grid grid-cols-1 gap-4.5 text-left">
                  {/* Mood Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest ml-1">🎭 그날의 기분 스티커</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['🥰 설렘', '🤩 신남', '😴 피곤', '😋 먹부림', '☕ 여유', '🌧️ 운치', '💖 완벽'].map((mood) => (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => setDraftMood(mood)}
                          className={`px-3 py-1.5 rounded-full font-sans text-xs font-bold border transition-all active:scale-95 ${
                            draftMood === mood
                              ? 'bg-amber-100 dark:bg-amber-950/50 border-amber-400 text-stone-800 dark:text-amber-200 shadow-sm scale-105'
                              : 'bg-white dark:bg-[#15141f] border-stone-200 dark:border-[#2b2a3c] text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900'
                          }`}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weather Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest ml-1">🌤️ 그날의 날씨 스탬프</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['☀️ 맑음', '☁️ 흐림', '🌧️ 비', '❄️ 눈', '💨 바람'].map((weather) => (
                        <button
                          key={weather}
                          type="button"
                          onClick={() => setDraftWeather(weather)}
                          className={`px-3 py-1.5 rounded-full font-sans text-xs font-bold border transition-all active:scale-95 ${
                            draftWeather === weather
                              ? 'bg-blue-100 dark:bg-blue-950/50 border-blue-400 text-stone-800 dark:text-blue-200 shadow-sm scale-105'
                              : 'bg-white dark:bg-[#15141f] border-stone-200 dark:border-[#2b2a3c] text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900'
                          }`}
                        >
                          {weather}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pre-saved Stamp Stickers */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4a7865] uppercase tracking-widest ml-1 flex items-center gap-1">
                      <span>🎟️ 추억 스탬프 스티커 붙이기</span>
                      <span className="bg-[#4a7865]/10 text-[#4a7865] text-[8px] px-1 rounded-sm">Hot!</span>
                    </label>
                    <p className="text-[9px] text-stone-400 leading-none mb-1.5">원하는 스탬프들을 클릭하여 폴라로이드 사진에 이쁘게 소장해보세요!</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_STICKERS.map((sticker) => {
                        const isSelected = draftStickers.includes(sticker.emoji);
                        return (
                          <button
                            key={sticker.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setDraftStickers(draftStickers.filter((s) => s !== sticker.emoji));
                              } else {
                                setDraftStickers([...draftStickers, sticker.emoji]);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border font-sans text-[11px] font-black transition-all active:scale-95 flex items-center gap-1 shadow-xs ${
                              isSelected
                                ? 'bg-[#4a7865] text-white border-[#4a7865] scale-105 shadow-sm'
                                : 'bg-white border-stone-200/80 text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <span>{sticker.emoji}</span>
                            <span className="text-[9px] font-sans font-bold tracking-tight text-inherit">{sticker.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Visited Places checklist from Plan */}
                {availableSpots.length > 0 && (
                  <div className="bg-[#fcfbf7] border border-stone-200/70 rounded-2xl p-4 text-left space-y-2 shadow-xs">
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">🗺️ 계획된 장소 중 다녀온 곳 발도장 찍기 (추가 기록)</span>
                    <p className="text-[9px] text-stone-400 leading-none">방문한 곳을 터치하여 이번 기록과 연동해보세요!</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {availableSpots.map((spot, i) => {
                        const isChecked = draftVisitedSpots.includes(spot);
                        return (
                          <button
                            key={`${spot}-${i}`}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setDraftVisitedSpots(draftVisitedSpots.filter((s) => s !== spot));
                              } else {
                                setDraftVisitedSpots([...draftVisitedSpots, spot]);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl font-sans text-[11px] font-semibold border transition-all active:scale-95 flex items-center gap-1 ${
                              isChecked
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50'
                            }`}
                          >
                            <span>{isChecked ? '✅' : '📌'}</span>
                            <span>{spot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Core Details Inputs (Location, Date, Tag) */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest ml-1">📍 방문 도시</label>
                      <input
                        type="text"
                        value={draftLocation}
                        onChange={(e) => setDraftLocation(e.target.value)}
                        className="w-full bg-white dark:bg-[#15141f] rounded-xl border border-stone-200 dark:border-[#2b2a3c] px-3.5 py-2.5 text-xs font-sans text-gray-700 dark:text-stone-200 outline-none focus:ring-1 focus:ring-stone-400 transition-all shadow-xs placeholder:text-stone-400 dark:placeholder:text-stone-600"
                        placeholder="예: 파리, Paris"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest ml-1">📅 기억할 날짜</label>
                      <input
                        type="text"
                        value={draftDate}
                        onChange={(e) => setDraftDate(e.target.value)}
                        className="w-full bg-white dark:bg-[#15141f] rounded-xl border border-stone-200 dark:border-[#2b2a3c] px-3.5 py-2.5 text-xs font-sans text-gray-700 dark:text-stone-200 outline-none focus:ring-1 focus:ring-stone-400 transition-all shadow-xs placeholder:text-stone-400 dark:placeholder:text-stone-600"
                        placeholder="예: 2026.07.11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest ml-1">🏷️ 추억 태그</label>
                    <input
                      type="text"
                      value={draftTag}
                      onChange={(e) => setDraftTag(e.target.value)}
                      className="w-full bg-white dark:bg-[#15141f] rounded-xl border border-stone-200 dark:border-[#2b2a3c] px-3.5 py-2.5 text-xs font-sans text-gray-700 dark:text-stone-200 outline-none focus:ring-1 focus:ring-stone-400 transition-all shadow-xs placeholder:text-stone-400 dark:placeholder:text-stone-600"
                      placeholder="예: 힐링, 커플여행, 빵지순례"
                    />
                  </div>

                  {/* 5. Scrapbook Cute mini prompts */}
                  <div className="grid grid-cols-1 gap-3 text-left pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-orange-500 dark:text-orange-400 uppercase tracking-widest ml-1">🍕 오늘 최고의 한 입 (Tasty Bite)</label>
                      <input
                        type="text"
                        value={draftBestBite}
                        onChange={(e) => setDraftBestBite(e.target.value)}
                        className="w-full bg-orange-50/20 dark:bg-orange-950/20 rounded-xl border border-orange-200/40 dark:border-orange-900/30 px-3.5 py-2.5 text-xs font-sans text-stone-800 dark:text-stone-200 outline-none focus:ring-1 focus:ring-orange-300 transition-all shadow-xs placeholder:text-stone-400 dark:placeholder:text-stone-650"
                        placeholder="예: 에펠탑 앞 잔디밭에서 한 입 베어문 누텔라 크레페!"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest ml-1">💡 사소한 해프닝 / 웃겼던 이야기</label>
                      <textarea
                        value={draftAnecdote}
                        onChange={(e) => setDraftAnecdote(e.target.value)}
                        className="w-full bg-purple-50/20 dark:bg-purple-950/20 rounded-xl border border-purple-200/40 dark:border-purple-900/30 px-3.5 py-2.5 text-xs font-sans text-stone-850 dark:text-stone-200 outline-none focus:ring-1 focus:ring-purple-300 transition-all shadow-xs placeholder:text-stone-400 dark:placeholder:text-stone-650 h-16 resize-none"
                        placeholder="예: 우산이 없어서 역 앞 처마 밑에 30분 서있었는데, 그곳 뷰가 너무 평화롭고 음악 같았다."
                      />
                    </div>
                  </div>

                  {/* 6. Title and Story Content */}
                  <div className="bg-[#4a7865]/5 dark:bg-[#4a7865]/10 rounded-2xl p-4 border border-[#4a7865]/20 space-y-2 text-left">
                    <label className="text-[10px] font-black text-[#4a7865] dark:text-[#5fa286] uppercase tracking-widest">📖 이 추억의 한줄 제목</label>
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-stone-800 dark:text-stone-100 font-sans font-black text-base focus:ring-0 placeholder:text-stone-400 dark:placeholder:text-stone-600 outline-none"
                      placeholder="여운을 담은 제목을 작성해주세요"
                    />
                    <div className="border-t border-[#4a7865]/10 my-2" />
                    <label className="text-[10px] font-black text-[#4a7865] dark:text-[#5fa286] uppercase tracking-widest">✍️ 자유로운 여행의 여운 (추억 에세이)</label>
                    <textarea
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-stone-600 dark:text-stone-300 font-sans text-xs sm:text-sm focus:ring-0 placeholder:text-stone-400 dark:placeholder:text-stone-600 resize-none h-28 outline-none leading-relaxed"
                      placeholder="계획에는 없던, 길을 가다 멈춰 선 골목길 풍경, 따뜻했던 바람 등 소중한 오감의 기억들을 소박하게 적어주세요..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-stone-100 dark:border-[#262435] bg-stone-55 dark:bg-[#15141f] flex items-center justify-between sticky bottom-0 z-15">
                <button
                  onClick={() => { setIsWriteModalOpen(false); setEditingLog(null); }}
                  className="bg-white dark:bg-[#1a1924] hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-[#2b2a3c] px-5 py-2.5 rounded-xl font-sans text-xs font-black transition-all active:scale-95"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="bg-[#4a7865] hover:bg-[#3d6353] text-white px-6 py-2.5 rounded-xl font-sans text-xs font-black transition-all active:scale-95 shadow-md flex items-center gap-1"
                >
                  저장하고 간직하기 💖
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Plan Modal Overlay */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Modal backdrop closer */}
            <div className="absolute inset-0" onClick={() => { setIsImportModalOpen(false); setSelectedImportPlan(null); }} />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  {selectedImportPlan && (
                    <button
                      onClick={() => setSelectedImportPlan(null)}
                      className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <h3 className="font-sans font-bold text-base text-gray-800">
                    {selectedImportPlan ? '일정 세부 정보 확인' : '내 계획에서 불러오기'}
                  </h3>
                </div>
                <button
                  onClick={() => { setIsImportModalOpen(false); setSelectedImportPlan(null); }}
                  className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main content body */}
              <div className="p-6 overflow-y-auto flex-1">
                {!selectedImportPlan ? (
                  // Plan List view (ONLY displays main title and dates!)
                  <div className="space-y-4">
                    <p className="font-sans text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">계획 목록</p>
                    {!plan ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 space-y-2">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200">
                          <FileText size={24} className="text-gray-300" />
                        </div>
                        <p className="font-sans text-xs font-semibold text-gray-600">작성된 계획이 없습니다.</p>
                        <p className="font-sans text-[11px] text-gray-400">새로운 여행 계획을 계획 탭에서 먼저 세워보세요!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div
                          onClick={() => setSelectedImportPlan(plan)}
                          className="bg-gray-50 hover:bg-blue-50/30 border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] group"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <h4 className="font-sans font-extrabold text-gray-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                              {plan.title}
                            </h4>
                            <p className="font-sans text-xs text-gray-500 font-medium flex items-center gap-1.5">
                              <CalendarDays size={13} className="text-gray-400 shrink-0" />
                              <span>{plan.startDate} ~ {plan.endDate} ({plan.durationText})</span>
                            </p>
                          </div>
                          <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0 ml-3" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Detailed Plan contents view
                  <div className="space-y-5">
                    {/* Header info card */}
                    <div className="bg-blue-50/50 border border-blue-100/30 p-5 rounded-2xl space-y-1">
                      <span className="inline-flex font-mono text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-md mb-1">
                        Travel Plan
                      </span>
                      <h4 className="font-sans font-extrabold text-gray-900 text-base">{selectedImportPlan.title}</h4>
                      <p className="font-sans text-xs text-gray-500 font-medium flex items-center gap-1.5 pt-1">
                        <CalendarDays size={13} className="text-gray-400" />
                        <span>{selectedImportPlan.startDate} ~ {selectedImportPlan.endDate} ({selectedImportPlan.durationText})</span>
                      </p>
                    </div>

                    {/* Day by Day contents list */}
                    <div className="space-y-4">
                      {selectedImportPlan.days.map((day) => (
                        <div key={day.dayNumber} className="border border-gray-100/80 rounded-2xl bg-white p-4 space-y-3 shadow-sm">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="font-sans font-black text-xs text-gray-800 flex items-center gap-1.5">
                              <span className="text-xs">📅</span> {day.dayNumber}일차 ({day.dayOfWeek})
                            </span>
                            <span className="font-mono text-[10px] text-gray-400 font-medium">{day.date}</span>
                          </div>
                          {day.items.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">등록된 세부 일정이 없습니다.</p>
                          ) : (
                            <div className="space-y-4 pl-3.5 relative before:content-[''] before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-blue-100/50">
                              {day.items.map((item, idx) => (
                                <div key={`${item.id}-${idx}`} className="relative space-y-1">
                                  <div className="absolute left-[-16.5px] top-[4px] w-2 h-2 rounded-full bg-blue-500 border border-white shadow-sm" />
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-sans font-extrabold text-xs text-gray-800 leading-tight flex-1">{item.title}</span>
                                    {item.time && (
                                      <span className="font-mono text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md shrink-0">
                                        {item.time}
                                      </span>
                                    )}
                                  </div>
                                  {item.content && (
                                    <p className="font-sans text-[11px] text-gray-500 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                                  )}
                                  {item.images && item.images.length > 0 && (
                                    <div className="pt-1.5">
                                      <img
                                        src={item.images[0]}
                                        alt={item.title}
                                        className="w-full h-24 object-cover rounded-xl border border-gray-100"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Footer Action (only in details view) */}
              {selectedImportPlan && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end sticky bottom-0 z-15">
                  <button
                    onClick={() => handleImportPlan(selectedImportPlan)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs px-6 py-3.5 rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={14} />
                    이 계획 기록으로 불러오기
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stamp Detail Modal Overlay */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#faf6eb] dark:bg-[#13121a] text-stone-800 dark:text-stone-100 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-stone-200/80 dark:border-[#262435] flex flex-col max-h-[85vh]"
            >
              {/* guilloche pattern background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Header */}
              <div className="px-6 py-4 border-b border-stone-200/60 dark:border-[#262435] flex items-center justify-between bg-stone-100/50 dark:bg-[#1a1924] sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🛂</span>
                  <h3 className="font-sans font-black text-xs text-stone-600 dark:text-stone-400 uppercase tracking-widest font-mono">
                    출입국 기록 증명 / Certificate
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* Image & Stamp Stickers Overlap */}
                {(() => {
                  let isScrapbook = false;
                  let scrapbookData: any = null;
                  if (selectedLog.content && selectedLog.content.startsWith('{')) {
                    try {
                      scrapbookData = JSON.parse(selectedLog.content);
                      isScrapbook = true;
                    } catch (e) {}
                  }

                  return (
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-stone-100 dark:bg-[#1a1924] border border-stone-200 dark:border-[#262435] shadow-sm">
                      {selectedLog.image ? (
                        <img
                          src={selectedLog.image}
                          alt={selectedLog.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-100 dark:bg-[#1a1924] flex items-center justify-center text-stone-400 dark:text-stone-500 text-xs font-semibold">
                          사진 없음
                        </div>
                      )}

                      {/* Floating Overlap Stamp Stickers */}
                      {isScrapbook && scrapbookData?.stickers && scrapbookData.stickers.length > 0 && (
                        <div className="absolute top-2.5 right-2.5 flex flex-wrap gap-1 max-w-[80%] justify-end pointer-events-none select-none z-10">
                          {scrapbookData.stickers.map((emoji: string, idx: number) => {
                            const preset = PRESET_STICKERS.find(p => p.emoji === emoji);
                            return (
                              <div
                                key={idx}
                                className="bg-white/95 text-stone-800 rounded-xl px-2 py-1 flex items-center gap-1 text-[10px] font-black border border-stone-200 shadow-md"
                                style={{
                                  transform: `rotate(${(idx % 2 === 0 ? 5 : -5) * (idx + 1)}deg) translateY(${idx * 1.5}px)`,
                                }}
                              >
                                <span>{emoji}</span>
                                {preset && <span className="text-[7px] text-stone-500 font-bold uppercase tracking-tight">{preset.label}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Stamp Details */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-sans font-black text-stone-900 dark:text-stone-100 text-lg">
                      {selectedLog.title}
                    </h4>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLog.location && (
                      <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <MapPin size={12} />
                        {selectedLog.location}
                      </span>
                    )}
                    <span className="bg-stone-100 dark:bg-[#1a1924] text-stone-600 dark:text-stone-400 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CalendarDays size={12} />
                      {selectedLog.date}
                    </span>
                    {selectedLog.tag && (
                      <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Waves size={12} />
                        {selectedLog.tag}
                      </span>
                    )}
                  </div>

                  {/* Scrapbook content layout */}
                  {(() => {
                    let isScrapbook = false;
                    let scrapbookData: any = null;
                    if (selectedLog.content && selectedLog.content.startsWith('{')) {
                      try {
                        scrapbookData = JSON.parse(selectedLog.content);
                        isScrapbook = true;
                      } catch (e) {}
                    }

                    if (isScrapbook && scrapbookData) {
                      return (
                        <div className="space-y-4">
                          {/* Stickers row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-2.5 rounded-2xl flex items-center gap-2">
                              <span className="text-xl">🎭</span>
                              <div className="text-left">
                                <span className="block text-[8px] text-amber-500 dark:text-amber-400 font-bold leading-none">그날의 기분</span>
                                <span className="text-xs font-sans font-extrabold text-stone-700 dark:text-stone-200">{scrapbookData.mood}</span>
                              </div>
                            </div>
                            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-900/30 p-2.5 rounded-2xl flex items-center gap-2">
                              <span className="text-xl">🌤️</span>
                              <div className="text-left">
                                <span className="block text-[8px] text-blue-500 dark:text-blue-400 font-bold leading-none">그날의 날씨</span>
                                <span className="text-xs font-sans font-extrabold text-stone-700 dark:text-stone-200">{scrapbookData.weather}</span>
                              </div>
                            </div>
                          </div>

                          {/* Story Text - styled like aesthetic notebook */}
                          <div className="bg-white dark:bg-[#1a1924] border-2 border-stone-200/80 dark:border-[#262435] p-4 rounded-2xl shadow-sm relative overflow-hidden text-left">
                            {/* cute paper lines background lines */}
                            <div className="absolute inset-0 opacity-[0.04] pointer-events-none select-none bg-[repeating-linear-gradient(transparent,transparent_23px,#000_23px,#000_24px)]" />
                            <p className="font-sans text-xs text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest border-b border-stone-100 dark:border-[#262435] pb-1 mb-2">My Story 📖</p>
                            <p className="font-sans text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed relative z-10 font-medium">
                              {scrapbookData.story}
                            </p>
                          </div>

                          {/* Extra Memories */}
                          {(scrapbookData.anecdote || scrapbookData.bestBite) && (
                            <div className="space-y-2">
                              {scrapbookData.bestBite && (
                                <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/30 dark:border-orange-900/30 p-3 rounded-2xl space-y-1 text-left">
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase bg-orange-100/50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md">
                                    🍕 최고의 한 입 (Yum!)
                                  </span>
                                  <p className="font-sans text-xs text-stone-700 dark:text-stone-200 font-bold">{scrapbookData.bestBite}</p>
                                </div>
                              )}
                              {scrapbookData.anecdote && (
                                <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/30 dark:border-purple-900/30 p-3 rounded-2xl space-y-1 text-left">
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase bg-purple-100/50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                                    💡 소소한 해프닝 / 기억에 남는 일
                                  </span>
                                  <p className="font-sans text-xs text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">{scrapbookData.anecdote}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Selected Stamp Stickers */}
                          {scrapbookData.stickers && scrapbookData.stickers.length > 0 && (
                            <div className="bg-stone-50 dark:bg-[#1a1924] border border-stone-200/60 dark:border-[#262435] p-3.5 rounded-2xl text-left space-y-2">
                              <span className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest block">기록에 찍힌 추억 스탬프 🎟️</span>
                              <div className="flex flex-wrap gap-1.5">
                                {scrapbookData.stickers.map((emoji: string, i: number) => {
                                  const preset = PRESET_STICKERS.find(p => p.emoji === emoji);
                                  return (
                                    <span key={i} className="bg-white dark:bg-[#13121a] border border-stone-200 dark:border-[#2b2a3c] text-[10px] text-stone-700 dark:text-stone-200 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-xs">
                                      <span className="text-sm">{emoji}</span>
                                      <span className="text-[8px] text-stone-400 dark:text-stone-500 uppercase font-sans tracking-wider">{preset ? preset.label : 'STAMP'}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Checked spots / locations visited */}
                          {scrapbookData.visitedSpots && scrapbookData.visitedSpots.length > 0 && (
                            <div className="bg-stone-50 dark:bg-[#1a1924] border border-stone-200/60 dark:border-[#262435] p-3.5 rounded-2xl text-left space-y-2">
                              <span className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest block">발도장 찍은 장소들 👣</span>
                              <div className="flex flex-wrap gap-1.5">
                                {scrapbookData.visitedSpots.map((spot: string, i: number) => (
                                  <span key={i} className="bg-white dark:bg-[#13121a] border border-stone-200 dark:border-[#2b2a3c] text-[10px] text-stone-700 dark:text-stone-200 px-2 py-1 rounded-xl font-medium flex items-center gap-1 shadow-xs">
                                    <span className="text-emerald-500">✓</span> {spot}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Fallback to legacy/simple text display
                    return (
                      <div className="bg-white/80 dark:bg-[#1a1924] p-4 rounded-2xl border border-stone-200/50 dark:border-[#262435] shadow-inner text-left">
                        <p className="font-sans text-sm text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
                          {selectedLog.content}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-stone-200/60 dark:border-[#262435] bg-stone-100/50 dark:bg-[#13121a] flex items-center justify-between sticky bottom-0 z-15 gap-2">
                <button
                  onClick={() => {
                    if (confirm('이 여행 기록을 지우시겠습니까?')) {
                      onDeleteLog(selectedLog.id);
                      setSelectedLog(null);
                      // Adjust active index
                      if (activeLogIndex > 0) {
                        setActiveLogIndex(activeLogIndex - 1);
                      }
                    }
                  }}
                  className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 px-3 py-2.5 rounded-xl font-sans text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 size={14} />
                  삭제
                </button>
                <button
                  onClick={() => handleStartEdit(selectedLog)}
                  className="bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-3.5 py-2.5 rounded-xl font-sans text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 flex-1 justify-center"
                >
                  <PenTool size={14} />
                  수정하기
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-sans text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <Check size={14} />
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
