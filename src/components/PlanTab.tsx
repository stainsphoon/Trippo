import { useState, useRef } from 'react';
import {
  CalendarDays,
  Sun,
  CloudSun,
  MapPin,
  Clock,
  Wallet,
  Car,
  Bus,
  Plane,
  Footprints,
  Bike,
  Plus,
  CheckCircle2,
  ChevronDown,
  Trash2,
  Copy,
  ChevronUp,
  X,
  FileEdit,
  ClipboardList,
  Image as ImageIcon,
  Check,
  Share2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng, toBlob } from 'html-to-image';
import { TravelPlan, PlanItem, DayPlan, TransportationType, ChecklistItem } from '../types';
import { Language, translateText } from '../utils/translations';

interface PlanTabProps {
  plan: TravelPlan;
  onUpdatePlan: (updatedPlan: TravelPlan) => void;
  language?: Language;
  isDarkMode?: boolean;
}

export default function PlanTab({ plan, onUpdatePlan, language = 'ko', isDarkMode = false }: PlanTabProps) {
  const t = (key: Parameters<typeof translateText>[0], params?: Record<string, string | number>) => translateText(key, language, params);
  const [selectedDayNum, setSelectedDayNum] = useState(1);
  const [expandedItemId, setExpandedItemId] = useState<string | null>('item-1-1'); // Default open for demonstration
  
  // Share modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTheme, setShareTheme] = useState<'slate' | 'pink' | 'green' | 'midnight' | 'custom'>('slate');
  const [customStartColor, setCustomStartColor] = useState(() => {
    return localStorage.getItem('trippo_custom_theme_start') || '#a855f7';
  });
  const [customEndColor, setCustomEndColor] = useState(() => {
    return localStorage.getItem('trippo_custom_theme_end') || '#6366f1';
  });
  const [shareScope, setShareScope] = useState<'current' | 'all'>('current');
  const [isGenerating, setIsGenerating] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const shareCardCaptureRef = useRef<HTMLDivElement>(null);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Sheet states (for adding or editing items)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [sheetDayNum, setSheetDayNum] = useState(1);

  // Bottom sheet form fields
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('12:00');
  const [formCost, setFormCost] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTrans, setFormTrans] = useState<TransportationType>('walk');
  const [formTransLine, setFormTransLine] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formChecklist, setFormChecklist] = useState<ChecklistItem[]>([]);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [newCheckItemText, setNewCheckItemText] = useState('');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(plan.title);

  const activeDay = plan.days.find((d) => d.dayNumber === selectedDayNum) || plan.days[0];

  const handleSaveTitle = () => {
    if (!titleInput.trim()) return;
    onUpdatePlan({ ...plan, title: titleInput.trim() });
    setIsEditingTitle(false);
  };

  const handleToggleItemCheck = (dayNum: number, itemId: string, chkId: string) => {
    const updatedDays = plan.days.map((day) => {
      if (day.dayNumber !== dayNum) return day;
      return {
        ...day,
        items: day.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            checklist: item.checklist?.map((chk) => {
              if (chk.id !== chkId) return chk;
              return { ...chk, checked: !chk.checked };
            })
          };
        })
      };
    });
    onUpdatePlan({ ...plan, days: updatedDays });
  };

  const handleToggleAccordion = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  // Add or Edit schedule sheet trigger
  const openScheduleSheet = (item: PlanItem | null = null, dayNum: number = selectedDayNum) => {
    setSheetDayNum(dayNum);
    if (item) {
      setEditingItem(item);
      setFormTitle(item.title);
      setFormTime(item.time);
      setFormCost(item.cost || '');
      setFormContent(item.content || '');
      setFormTrans(item.transportation || 'walk');
      setFormTransLine(item.transportationLine || '');
      setFormDuration(item.duration || '');
      setFormChecklist(item.checklist || []);
      setFormImages(item.images || []);
    } else {
      setEditingItem(null);
      setFormTitle('');
      setFormTime('12:00');
      setFormCost('');
      setFormContent('');
      setFormTrans('walk');
      setFormTransLine('');
      setFormDuration('');
      setFormChecklist([]);
      setFormImages([]);
    }
    setIsSheetOpen(true);
  };

  const handleAddChecklistItem = () => {
    if (!newCheckItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newCheckItemText.trim(),
      checked: false
    };
    setFormChecklist([...formChecklist, newItem]);
    setNewCheckItemText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormChecklist(formChecklist.filter((chk) => chk.id !== id));
  };

  const handleSaveSheetData = () => {
    if (!formTitle.trim()) {
      alert('일정 제목을 입력해주세요.');
      return;
    }

    const itemData: PlanItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      title: formTitle,
      time: formTime,
      cost: formCost ? formCost : undefined,
      content: formContent ? formContent : undefined,
      transportation: formTrans,
      transportationLine: formTransLine ? formTransLine : undefined,
      duration: formDuration ? formDuration : undefined,
      checklist: formChecklist.length > 0 ? formChecklist : undefined,
      images: formImages.length > 0 ? formImages : undefined
    };

    let updatedDays = [...plan.days];

    if (editingItem) {
      // Edit mode
      updatedDays = updatedDays.map((day) => {
        return {
          ...day,
          items: day.items.map((item) => (item.id === editingItem.id ? itemData : item))
        };
      });
    } else {
      // Add mode - append to specified day
      updatedDays = updatedDays.map((day) => {
        if (day.dayNumber !== sheetDayNum) return day;
        return {
          ...day,
          items: [...day.items, itemData]
        };
      });
    }

    onUpdatePlan({ ...plan, days: updatedDays });
    setIsSheetOpen(false);
  };

  // Edit Mode multi-select logic
  const handleToggleSelectId = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter((i) => i !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleSelectAll = () => {
    const activeDayItemIds = activeDay.items.map((i) => i.id);
    const allSelected = activeDayItemIds.every((id) => selectedItemIds.includes(id));
    
    if (allSelected) {
      setSelectedItemIds(selectedItemIds.filter((id) => !activeDayItemIds.includes(id)));
    } else {
      const newSelection = Array.from(new Set([...selectedItemIds, ...activeDayItemIds]));
      setSelectedItemIds(newSelection);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItemIds.length === 0) return;
    if (confirm(`선택한 ${selectedItemIds.length}개의 일정을 삭제하시겠습니까?`)) {
      const updatedDays = plan.days.map((day) => ({
        ...day,
        items: day.items.filter((item) => !selectedItemIds.includes(item.id))
      }));
      onUpdatePlan({ ...plan, days: updatedDays });
      setSelectedItemIds([]);
      setIsEditMode(false);
    }
  };

  const handleCopySelected = () => {
    if (selectedItemIds.length === 0) return;
    const itemsToCopy: PlanItem[] = [];
    plan.days.forEach((day) => {
      day.items.forEach((item) => {
        if (selectedItemIds.includes(item.id)) {
          itemsToCopy.push({
            ...item,
            id: `item-copy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: `[복사] ${item.title}`
          });
        }
      });
    });

    const updatedDays = plan.days.map((day) => {
      if (day.dayNumber !== selectedDayNum) return day;
      return {
        ...day,
        items: [...day.items, ...itemsToCopy]
      };
    });

    onUpdatePlan({ ...plan, days: updatedDays });
    setSelectedItemIds([]);
    setIsEditMode(false);
    alert(`${itemsToCopy.length}개의 일정이 현재 일차에 복사되었습니다.`);
  };

  // Get Transportation icon
  const getTransIcon = (type?: TransportationType, size: number = 18) => {
    switch (type) {
      case 'taxi':
        return <Car size={size} />;
      case 'bus':
        return <Bus size={size} />;
      case 'flight':
        return <Plane size={size} />;
      case 'walk':
        return <Footprints size={size} />;
      case 'bike':
        return <Bike size={size} />;
      default:
        return <Footprints size={size} />;
    }
  };

  const getTransLabel = (type: TransportationType) => {
    switch (type) {
      case 'taxi': return '택시';
      case 'bus': return '버스';
      case 'flight': return '비행기';
      case 'walk': return '도보';
      case 'bike': return '자전거';
    }
  };

  const handleDownloadImage = async () => {
    if (!shareCardCaptureRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const dataUrl = await toPng(shareCardCaptureRef.current, {
        cacheBust: true,
        style: {
          transform: 'scale(1)',
        }
      });
      const link = document.createElement('a');
      link.download = `${plan.title.replace(/\s+/g, '_')}_Day${selectedDayNum}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('이미지 생성 도중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!shareCardCaptureRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const blob = await toBlob(shareCardCaptureRef.current, {
        cacheBust: true,
      });
      if (blob) {
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        alert('📋 이미지가 클립보드에 성공적으로 복사되었습니다!\n원하는 채팅방이나 SNS에 바로 붙여넣기(Ctrl+V) 하세요! 🥰');
      } else {
        throw new Error('Blob generation failed');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      alert('직접 클립보드 이미지 복사를 지원하지 않는 브라우저이거나 보안 차단이 발생했습니다.\n대신 "기기에 저장하기" 버튼을 이용해 다운로드 후 공유해 주세요!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWebShare = async () => {
    if (!shareCardCaptureRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const blob = await toBlob(shareCardCaptureRef.current, { cacheBust: true });
      if (blob) {
        const file = new File([blob], `${plan.title.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: plan.title,
            text: `[Trippo] ${plan.title} 여행 일정을 함께 가요! 🎈`
          });
        } else if (navigator.share) {
          await navigator.share({
            title: plan.title,
            text: `[Trippo] ${plan.title} (${plan.startDate} ~ ${plan.endDate})\n\n친구야, 나와 함께 갈 여행 코스를 확인해봐! 🎈`,
            url: window.location.href
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          alert('🔗 링크가 복사되었습니다! 친구에게 보내서 여행 일정을 자랑해 보세요.');
        }
      }
    } catch (error) {
      console.error('Web Share error:', error);
      handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Info */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 w-full">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTitle();
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setTitleInput(plan.title);
                  }
                }}
                className="font-sans font-bold text-lg text-gray-800 dark:text-zinc-100 bg-white dark:bg-[#15141f] border border-gray-300 dark:border-[#2b2a3c] rounded-lg px-2 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex-shrink-0"
                title="저장"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => {
                  setIsEditingTitle(false);
                  setTitleInput(plan.title);
                }}
                className="p-1.5 bg-gray-50 dark:bg-[#15141f] text-gray-500 dark:text-zinc-400 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222133] transition-colors flex-shrink-0"
                title="취소"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-1.5 group cursor-pointer hover:bg-gray-100/50 dark:hover:bg-[#222133]/50 p-1 -m-1 rounded-lg transition-colors max-w-full"
              onClick={() => {
                setIsEditingTitle(true);
                setTitleInput(plan.title);
              }}
              title="제목 수정하기"
            >
              <h2 className="font-sans font-bold text-xl text-gray-800 dark:text-zinc-100 truncate select-none flex-1">{plan.title}</h2>
              <FileEdit size={14} className="text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
          <p className="font-sans text-xs text-gray-400 flex items-center gap-1.5 mt-1">
            <CalendarDays size={14} className="text-gray-400 shrink-0" />
            <span className="truncate">{plan.startDate} - {plan.endDate} ({plan.durationText})</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl font-sans text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
          >
            <Share2 size={13} />
            <span>{language === 'ko' ? '공유' : 'Share'}</span>
          </button>
          <button
            onClick={() => {
              setIsEditMode(!isEditMode);
              setSelectedItemIds([]);
            }}
            className={`px-3 py-1.5 rounded-xl font-sans text-xs font-semibold border transition-all cursor-pointer shadow-sm active:scale-95 ${
              isEditMode
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400'
                : 'bg-gray-50 dark:bg-[#15141f] border-gray-100 dark:border-[#22202e] text-gray-600 dark:text-stone-300 hover:bg-gray-100 dark:hover:bg-[#222133]'
            }`}
          >
            {isEditMode ? (language === 'ko' ? '취소' : 'Cancel') : (language === 'ko' ? '편집' : 'Edit')}
          </button>
        </div>
      </div>

      {/* Edit Mode Selection Header */}
      {isEditMode && (
        <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl px-4 py-3 border border-blue-100/30 dark:border-blue-900/30 flex justify-between items-center animate-fade-in">
          <span className="font-sans text-sm font-semibold text-blue-700 dark:text-blue-400">
            {language === 'ko' ? `${selectedItemIds.length}개 선택됨` : `${selectedItemIds.length} selected`}
          </span>
          <button
            onClick={handleSelectAll}
            className="font-sans text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {activeDay.items.every((i) => selectedItemIds.includes(i.id))
              ? (language === 'ko' ? '전체 해제' : 'Deselect All')
              : (language === 'ko' ? '전체 선택' : 'Select All')}
          </button>
        </div>
      )}

      {/* Timeline Days Navigation */}
      <section className="bg-white dark:bg-[#1a1924] rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-[#262435]">
        <div className="flex overflow-x-auto gap-2.5 pb-1 scrollbar-none snap-x">
          {plan.days.map((day) => {
            const isActive = day.dayNumber === selectedDayNum;
            return (
              <button
                key={day.dayNumber}
                onClick={() => {
                  setSelectedDayNum(day.dayNumber);
                  setExpandedItemId(null);
                }}
                className={`flex flex-col items-center justify-center min-w-[64px] py-2.5 px-2 rounded-xl cursor-pointer snap-start transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-100'
                    : 'bg-gray-50 dark:bg-[#15141f] text-gray-500 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-[#222133]'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-tight opacity-75">
                  {language === 'ko' ? `${day.dayNumber}일차` : `Day ${day.dayNumber}`}
                </span>
                <span className="font-sans font-bold text-lg leading-tight mt-0.5">
                  {day.date.split('.')[2]?.trim() || day.dayNumber}
                </span>
                <span className="text-[10px] font-semibold opacity-75">{day.dayOfWeek}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Itinerary List */}
      <section className="relative space-y-6">
        {/* Timeline Vertical Line */}
        {activeDay.items.length > 0 && (
          <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-dashed border-l border-gray-200 dark:border-[#262435] z-0"></div>
        )}

        {activeDay.items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 dark:bg-[#15141f]/50 rounded-2xl border border-dashed border-gray-100 dark:border-[#262435]">
            <p className="text-gray-400 text-sm">{language === 'ko' ? '등록된 일정이 없습니다.' : 'No schedules registered.'}</p>
            <button
              onClick={() => openScheduleSheet()}
              className="mt-3 inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl font-sans text-xs font-bold"
            >
              <Plus size={14} /> {language === 'ko' ? '일정 만들기' : 'Add Activity'}
            </button>
          </div>
        ) : (
          activeDay.items.map((item, idx) => {
            const isExpanded = expandedItemId === item.id;
            const isSelected = selectedItemIds.includes(item.id);
            const isMorning = item.time.toLowerCase().includes('am') || parseInt(item.time.split(':')[0]) < 12;

            return (
              <div key={`${item.id}-${idx}`} className="relative z-10 flex gap-4 items-start">
                {/* Timeline Icon Marker */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-[#13121a] flex-shrink-0 shadow-sm transition-all ${
                    isMorning
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <Sun size={18} className={isMorning ? 'animate-pulse' : ''} />
                </div>

                {/* Card Container */}
                <div className="flex-1 flex gap-3 items-center">
                  {/* Multi-select checkmark in Edit Mode */}
                  {isEditMode && (
                    <button
                      onClick={() => handleToggleSelectId(item.id)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-gray-200 dark:border-[#2b2a3c] hover:border-blue-400 bg-white dark:bg-[#1a1924]'
                      }`}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </button>
                  )}

                  {/* Schedule Card */}
                  <div
                    className={`flex-1 bg-white dark:bg-[#1a1924] rounded-2xl p-4 shadow-sm border transition-all ${
                      isExpanded
                        ? 'border-blue-500/30 ring-1 ring-blue-500/5 shadow-md shadow-blue-500/[0.02]'
                        : 'border-gray-100 dark:border-[#262435] hover:shadow-md'
                    }`}
                  >
                    {/* Collapsed Header */}
                    <div
                      onClick={() => !isEditMode && handleToggleAccordion(item.id)}
                      className="flex justify-between items-start cursor-pointer select-none"
                    >
                      <div>
                        <h4
                          className={`font-sans font-bold text-sm leading-tight ${
                            isExpanded ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-zinc-100'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <p className="font-sans text-xs font-bold text-blue-500 dark:text-blue-400 mt-1">{item.time}</p>
                      </div>
                      {!isEditMode && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openScheduleSheet(item);
                            }}
                            className="text-gray-300 dark:text-stone-600 hover:text-blue-500 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#222133] transition-all"
                          >
                            <FileEdit size={14} />
                          </button>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Short preview content when not expanded */}
                    {!isExpanded && item.content && (
                      <p className="font-sans text-xs text-gray-500 dark:text-stone-400 mt-2 line-clamp-1 border-l border-gray-100 dark:border-[#262435] pl-2">
                        {item.content}
                      </p>
                    )}

                    {/* Accordion Expanded Content */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-gray-100 dark:border-[#262435] space-y-4 overflow-hidden"
                      >
                        {/* Expanded image */}
                        {item.images && item.images.length > 0 && (
                          <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-50 dark:bg-[#15141f] border border-gray-100 dark:border-[#262435]">
                            <img
                               src={item.images[0]}
                               alt={item.title}
                               className="w-full h-full object-cover"
                               referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Content text */}
                        {item.content && (
                          <p className="font-sans text-xs leading-relaxed text-gray-600 dark:text-zinc-300 border-l-2 border-blue-500/20 pl-2.5 whitespace-pre-wrap">
                            {item.content}
                          </p>
                        )}

                        {/* Cost & Transportation */}
                        {(item.cost || item.transportation || item.duration) && (
                          <div className="flex flex-wrap gap-3">
                            {item.cost && (
                              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#15141f] px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-[#262435]">
                                <Wallet size={12} className="text-blue-600 dark:text-blue-400" />
                                <span className="font-sans text-[11px] font-bold text-gray-700 dark:text-zinc-200">{item.cost}</span>
                              </div>
                            )}
                            {item.transportation && (
                              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#15141f] px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-[#262435]">
                                <span className="text-blue-600 dark:text-blue-400">{getTransIcon(item.transportation, 13)}</span>
                                <span className="font-sans text-[11px] font-bold text-gray-700 dark:text-zinc-200">
                                  {item.transportationLine || getTransLabel(item.transportation)}
                                </span>
                              </div>
                            )}
                            {item.duration && (
                              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#15141f] px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-[#262435]">
                                <Clock size={12} className="text-gray-500" />
                                <span className="font-sans text-[11px] font-semibold text-gray-600 dark:text-stone-400">
                                  {item.duration} {language === 'ko' ? '소요' : 'takes'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Checklist */}
                        {item.checklist && item.checklist.length > 0 && (
                          <div className="bg-blue-50/20 dark:bg-blue-950/20 rounded-xl p-3 border border-blue-500/5 dark:border-blue-500/10 space-y-2.5">
                            <h5 className="font-sans text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-blue-600 dark:text-blue-400" />
                              {language === 'ko' ? '체크리스트' : 'Checklist'}
                            </h5>
                            <div className="space-y-2">
                              {item.checklist.map((chk) => (
                                <label
                                  key={chk.id}
                                  className="flex items-center gap-2 cursor-pointer select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={chk.checked}
                                    onChange={() => handleToggleItemCheck(selectedDayNum, item.id, chk.id)}
                                    className="rounded border-gray-200 dark:border-[#2b2a3c] text-blue-600 focus:ring-blue-500/20 h-4 w-4 bg-transparent cursor-pointer"
                                  />
                                  <span
                                    className={`font-sans text-xs leading-none transition-all ${
                                      chk.checked ? 'line-through text-gray-400 dark:text-stone-500' : 'text-gray-700 dark:text-zinc-200'
                                    }`}
                                  >
                                    {chk.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Edit Mode Context Action Bar (Floating bottom) */}
      {isEditMode && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-gray-900 text-white rounded-[20px] px-4 py-3.5 shadow-lg flex justify-around items-center md:max-w-[416px] md:mx-auto">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedItemIds.length === 0}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-rose-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Trash2 size={18} />
            <span className="text-[10px] font-sans font-bold">삭제</span>
          </button>
          <button
            onClick={handleCopySelected}
            disabled={selectedItemIds.length === 0}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Copy size={18} />
            <span className="text-[10px] font-sans font-bold">복사</span>
          </button>
          <button
            onClick={() => {
              if (selectedItemIds.length === 0) return;
              const targetDay = prompt('이동할 일차를 입력하세요 (예: 1, 2, 3...)');
              const targetDayNum = parseInt(targetDay || '');
              if (isNaN(targetDayNum) || targetDayNum < 1 || targetDayNum > plan.days.length) {
                alert('올바른 일차 번호를 입력해주세요.');
                return;
              }

              // Cut from source and append to destination
              let movedItems: PlanItem[] = [];
              let updatedDays = plan.days.map((day) => {
                const itemsToKeep = day.items.filter((item) => {
                  const isMatch = selectedItemIds.includes(item.id);
                  if (isMatch) movedItems.push(item);
                  return !isMatch;
                });
                return { ...day, items: itemsToKeep };
              });

              updatedDays = updatedDays.map((day) => {
                if (day.dayNumber !== targetDayNum) return day;
                return { ...day, items: [...day.items, ...movedItems] };
              });

              onUpdatePlan({ ...plan, days: updatedDays });
              setSelectedItemIds([]);
              setIsEditMode(false);
              alert(`${movedItems.length}개의 일정이 Day ${targetDayNum}으로 이동되었습니다.`);
            }}
            disabled={selectedItemIds.length === 0}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-emerald-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ClipboardList size={18} />
            <span className="text-[10px] font-sans font-bold">이동</span>
          </button>
        </div>
      )}

      {/* Floating Add Schedule Button */}
      {!isEditMode && (
        <div className="relative z-10 flex gap-4 items-center justify-center mt-6">
          <button
            onClick={() => openScheduleSheet()}
            className="w-full bg-blue-600 text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 font-sans font-bold text-sm shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} />
            새 일정 추가
          </button>
        </div>
      )}

      {/* Add/Edit Schedule Sheet Modal */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSheetOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:max-w-md md:mx-auto"
            />

            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 rounded-t-[28px] max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl md:max-w-md md:mx-auto"
            >
              {/* Drag Indicator Handle */}
              <div className="w-full flex justify-center py-3">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Sheet Sticky Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <h2 className="font-sans font-bold text-lg text-gray-800">
                    {editingItem ? '일정 수정' : '새 일정 등록'}
                  </h2>
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                    Day {sheetDayNum}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSheetOpen(false)}
                    className="bg-gray-100 text-gray-500 p-2 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={handleSaveSheetData}
                    className="bg-blue-600 text-white font-sans font-bold text-xs px-4 py-2 rounded-full shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    저장
                  </button>
                </div>
              </div>

              {/* Sheet Scrollable Forms */}
              <div className="p-6 space-y-5 overflow-y-auto pb-12">
                {/* Form fields layout */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4">
                  <div className="space-y-1">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">일정 제목</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-gray-50/50 rounded-xl border border-gray-100 px-3.5 py-3 text-sm font-sans text-gray-800 focus:border-blue-500 focus:bg-white outline-none transition-colors"
                      placeholder="제목을 입력하세요"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-sans font-semibold text-xs text-gray-400 pl-1">시간</label>
                      <input
                        type="text"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="w-full bg-gray-50/50 rounded-xl border border-gray-100 px-3.5 py-3 text-sm font-sans text-gray-800 focus:border-blue-500 focus:bg-white outline-none transition-colors"
                        placeholder="예: 10:30 AM"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-sans font-semibold text-xs text-gray-400 pl-1">비용</label>
                      <input
                        type="text"
                        value={formCost}
                        onChange={(e) => setFormCost(e.target.value)}
                        className="w-full bg-gray-50/50 rounded-xl border border-gray-100 px-3.5 py-3 text-sm font-sans text-gray-800 focus:border-blue-500 focus:bg-white outline-none transition-colors"
                        placeholder="예: ¥2,570"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">일정 내용</label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="w-full bg-gray-50/50 rounded-xl border border-gray-100 px-3.5 py-3 text-sm font-sans text-gray-800 focus:border-blue-500 focus:bg-white outline-none resize-none transition-colors"
                      rows={3}
                      placeholder="자유롭게 기록해보세요"
                    ></textarea>
                  </div>
                </div>

                {/* Optional Info Box */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4">
                  {/* Transportation buttons selection */}
                  <div className="space-y-2">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">이동 수단</label>
                    <div className="flex gap-1.5">
                      {(['taxi', 'bus', 'flight', 'walk', 'bike'] as TransportationType[]).map((type) => {
                        const isSelected = formTrans === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormTrans(type)}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
                              isSelected
                                ? 'bg-blue-50 border border-blue-200 text-blue-600'
                                : 'bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {getTransIcon(type, 18)}
                            <span className="text-[10px] mt-1 font-bold">{getTransLabel(type)}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        value={formTransLine}
                        onChange={(e) => setFormTransLine(e.target.value)}
                        className="w-full bg-gray-50/50 rounded-xl border border-gray-100 px-3.5 py-3 text-xs font-sans text-gray-800 focus:border-blue-500 focus:bg-white outline-none transition-colors"
                        placeholder="이동 수단 상세 (예: 우에노행 열차, 마루노우치선)"
                      />
                      <input
                        type="text"
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                        className="w-full bg-gray-50/50 rounded-xl border border-gray-100 px-3.5 py-3 text-xs font-sans text-gray-800 focus:border-blue-500 focus:bg-white outline-none transition-colors"
                        placeholder="이동 소요 시간 (예: 30분, 45분)"
                      />
                    </div>
                  </div>

                  {/* Checklist input group */}
                  <div className="space-y-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <label className="font-sans font-semibold text-xs text-gray-400 pl-1">체크리스트</label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={newCheckItemText}
                          onChange={(e) => setNewCheckItemText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddChecklistItem();
                            }
                          }}
                          className="bg-gray-50/50 rounded-xl border border-gray-100 px-3 py-1.5 text-xs font-sans text-gray-700 outline-none focus:border-blue-500"
                          placeholder="새 할 일 추가"
                        />
                        <button
                          type="button"
                          onClick={handleAddChecklistItem}
                          className="bg-blue-50 text-blue-600 p-1.5 rounded-xl hover:bg-blue-100 active:scale-95 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {formChecklist.length > 0 && (
                      <div className="space-y-2">
                        {formChecklist.map((chk) => (
                          <div
                            key={chk.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100/50"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={chk.checked}
                                onChange={() => {
                                  setFormChecklist(
                                    formChecklist.map((item) =>
                                      item.id === chk.id ? { ...item, checked: !item.checked } : item
                                    )
                                  );
                                }}
                                className="rounded border-gray-200 text-blue-600 focus:ring-blue-500/20 h-4 w-4 bg-transparent cursor-pointer"
                              />
                              <span
                                className={`font-sans text-xs ${
                                  chk.checked ? 'line-through text-gray-400' : 'text-gray-700'
                                }`}
                              >
                                {chk.text}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveChecklistItem(chk.id)}
                              className="text-gray-400 hover:text-rose-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Photo additions simulator */}
                  <div className="space-y-3 pt-3 border-t border-gray-50">
                    <label className="font-sans font-semibold text-xs text-gray-400 pl-1">사진 등록</label>
                    <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x">
                      {/* Simulating preset hotlink image additions */}
                      <button
                        type="button"
                        onClick={() => {
                          const presetUrls = [
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuDWDhG9fmczTvzS3iU6S-HtXOsixJBGqzktg0aaQ44y0iDBfeg6SKHDBeI_0c1tCx1I4BYdo-LL9d6YBlDmSLzSWrG-DqISbOMf31OhaOWrynXwW97Tu6PkbPle2FQCxWn9B5HI7Wio-OC9EacngjWehBUMk2COI0Qj628lj2dKeGN9GSpUhlJ8SkdOVFBMsV6ZbcvofqW8gXqannIj5g8rneeBmFyHcyXYfX0WvryT1kzqbQHdlukRJA_tXnX4r5afYogwhs5TJD4z',
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuCunSARS6lJPHGy-yiWsqeOKCWeJA3zjBpNbS3MUt3QALmR3C-Fp2Q74qFhk-9xw1OAsQZdFxevsZX9Oltbn3WTocawUgwuIuI-z3c7SCKuPu412pILcKZXFXyi5A5-ky-UCRHP-vThiyZsceEU4CiLsYftHl_8H8TsatPG7n31dcNvol7BfshiVQe25TsF3y1lU3Ar-WQ_3L3IK0rQ6hCo9smb07GnrENXx9KfmKGBu2f2rruns3mGXFPEazSxHggiuK9q_sn3Skox',
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuDxm554cBa4mZ-t2u2Od-gfse_yv35BpDsJNItAY19gnnhROGQ6BDt7O7AESBYxQhMeTR2ykABIpgX_oXCT9uZHUTbd3pxvAwhF9uW-pmtS04fYSHXF2hWPWV3NnXPOJTxC0L737rVJyJ_rRNGDvdgFcE-qMbFf1u0RIm1x38xhEzZIAzV2_AMurbckG6gfrQLz_h9NhFPITHXm6zA6ijLyACgD0BQKa4jQW0lczp6tDOnba1vkvZG0v7a4b451tABn4U74F8iX8KZx'
                          ];
                          // Choose one of the preset image urls randomly or next-in-turn
                          const selectedUrl = presetUrls[formImages.length % presetUrls.length];
                          if (!formImages.includes(selectedUrl)) {
                            setFormImages([...formImages, selectedUrl]);
                          }
                        }}
                        className="min-w-[80px] h-[80px] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50/20 transition-all snap-start flex-shrink-0"
                      >
                        <Plus size={16} />
                        <span className="text-[10px] font-bold mt-1">추가</span>
                      </button>

                      {formImages.map((imgUrl, i) => (
                        <div
                          key={i}
                          className="min-w-[80px] h-[80px] rounded-xl overflow-hidden relative snap-start flex-shrink-0 border border-gray-100"
                        >
                          <img src={imgUrl} alt="Uploaded" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setFormImages(formImages.filter((url) => url !== imgUrl))}
                            className="absolute top-1.5 right-1.5 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-all active:scale-90"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {isShareModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md md:max-w-md md:mx-auto"
            />

            {/* Bottom/Center Share Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 rounded-t-[28px] max-h-[92vh] flex flex-col shadow-2xl md:max-w-md md:mx-auto overflow-hidden"
            >
              {/* Static Header Section (Non-scrolling, containing handle + title) */}
              <div className="shrink-0 bg-white border-b border-gray-100 rounded-t-[28px] z-10 shadow-sm">
                {/* Drag Indicator Handle */}
                <div className="w-full flex justify-center py-3">
                  <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header Title Bar */}
                <div className="flex items-center justify-between px-6 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📸</span>
                    <h2 className="font-sans font-black text-base text-gray-800">
                      여행 일정 카드 만들기
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="bg-gray-100 text-gray-500 p-2 rounded-full hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Body Section */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 pb-12">
                
                {/* Style Customizer */}
                <div className="space-y-4">
                  <div>
                    <label className="font-sans font-extrabold text-xs text-gray-500 uppercase tracking-wider block mb-2">
                      1. 카드 테마 스타일 선택
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { id: 'slate', name: '슬레이트', bg: 'bg-indigo-600' },
                        { id: 'pink', name: '체리블라썸', bg: 'bg-pink-500' },
                        { id: 'green', name: '포레스트', bg: 'bg-emerald-500' },
                        { id: 'midnight', name: '미드나잇', bg: 'bg-gray-900' },
                        { id: 'custom', name: '커스텀', bg: '' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setShareTheme(t.id as any)}
                          className={`py-2 px-0.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1.5 ${
                            shareTheme === t.id
                              ? 'border-blue-600 bg-white text-blue-600 shadow-sm'
                              : 'border-gray-200 bg-white/50 text-gray-500 hover:bg-white'
                          }`}
                        >
                          {t.id === 'custom' ? (
                            <div
                              className="w-4 h-4 rounded-full border border-gray-200/50"
                              style={{ background: `linear-gradient(135deg, ${customStartColor}, ${customEndColor})` }}
                            />
                          ) : (
                            <div className={`w-4 h-4 rounded-full ${t.bg} border border-white/20`} />
                          )}
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Theme Setup Panel */}
                  <AnimatePresence>
                    {shareTheme === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm space-y-3 overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold text-xs text-gray-700">나만의 그라데이션 색상</span>
                          <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                            ✨ 자동 저장 중
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 block">시작 색상</span>
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/60 p-1.5 rounded-xl">
                              <input
                                type="color"
                                value={customStartColor}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomStartColor(val);
                                  localStorage.setItem('trippo_custom_theme_start', val);
                                }}
                                className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent shrink-0"
                              />
                              <span className="font-mono text-[10px] font-bold text-gray-600">{customStartColor.toUpperCase()}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 block">종료 색상</span>
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/60 p-1.5 rounded-xl">
                              <input
                                type="color"
                                value={customEndColor}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomEndColor(val);
                                  localStorage.setItem('trippo_custom_theme_end', val);
                                }}
                                className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent shrink-0"
                              />
                              <span className="font-mono text-[10px] font-bold text-gray-600">{customEndColor.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation presets */}
                        <div className="space-y-1 pt-1 border-t border-gray-50">
                          <span className="text-[10px] font-bold text-gray-400 block">추천 컬러셋 프리셋</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { start: '#a855f7', end: '#6366f1', label: '퍼플 헤이즈' },
                              { start: '#f43f5e', end: '#fb923c', label: '오렌지 선셋' },
                              { start: '#10b981', end: '#3b82f6', label: '오션 브리즈' },
                              { start: '#ec4899', end: '#8b5cf6', label: '핑크 판타지' },
                              { start: '#f59e0b', end: '#ef4444', label: '파이어 번' },
                            ].map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setCustomStartColor(p.start);
                                  setCustomEndColor(p.end);
                                  localStorage.setItem('trippo_custom_theme_start', p.start);
                                  localStorage.setItem('trippo_custom_theme_end', p.end);
                                }}
                                className="px-1.5 py-1 bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-lg text-[9px] font-bold text-gray-600 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              >
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: `linear-gradient(135deg, ${p.start}, ${p.end})` }}
                                />
                                <span className="text-[9px]">{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="font-sans font-extrabold text-xs text-gray-500 uppercase tracking-wider block mb-2">
                      2. 공유할 일정 범위
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShareScope('current')}
                        className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          shareScope === 'current'
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">📅</span>
                        <span>현재 선택한 일차 ({selectedDayNum}일차)</span>
                      </button>
                      <button
                        onClick={() => setShareScope('all')}
                        className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          shareScope === 'all'
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🗺️</span>
                        <span>전체 일정 한눈에 보기</span>
                      </button>
                    </div>
                  </div>
                </div>

                 {/* Hidden, fully expanded card specifically for high-res lossless image download/clipboard generation */}
                <div className="absolute pointer-events-none opacity-0 select-none" style={{ left: '-9999px', top: '-9999px' }}>
                  <div
                    ref={shareCardCaptureRef}
                    className={`w-[340px] p-6 text-white relative overflow-hidden flex flex-col justify-between shrink-0 shadow-xl ${
                      shareTheme === 'slate' ? 'bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 text-white' :
                      shareTheme === 'pink' ? 'bg-gradient-to-br from-rose-400 via-pink-500 to-indigo-900 text-white' :
                      shareTheme === 'green' ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 text-white' :
                      shareTheme === 'custom' ? '' :
                      'bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white'
                    }`}
                    style={{
                      minHeight: '490px',
                      borderRadius: '28px',
                      background: shareTheme === 'custom' ? `linear-gradient(135deg, ${customStartColor}, ${customEndColor})` : undefined
                    }}
                  >
                    {/* Premium Decorative elements - ambient glow circles */}
                    <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none"></div>
                    {/* Subtle Grid overlay for high-tech aesthetic */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

                    <div className="relative z-10 space-y-4 flex-1 flex flex-col">
                      {/* Ticket top header */}
                      <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">✈️</span>
                          <span className="font-sans font-black text-[9px] tracking-[0.2em] uppercase text-white/90">TRIPPO BOARDING PASS</span>
                        </div>
                        <span className="text-[8px] font-mono font-bold bg-white/15 border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-md uppercase tracking-wider">
                          {shareScope === 'current' ? `DAY ${selectedDayNum}` : 'ALL DAYS'}
                        </span>
                      </div>

                      {/* Title and details */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-sans font-extrabold text-lg tracking-tight leading-snug text-white drop-shadow-sm">
                            {plan.title}
                          </h3>
                          <div className="font-mono text-[9px] text-white/60 bg-black/15 px-1.5 py-0.5 rounded border border-white/5 uppercase whitespace-nowrap">
                            PASS NO. {plan.days.length}D-{selectedDayNum}
                          </div>
                        </div>
                        <p className="font-sans text-[9.5px] text-white/70 font-semibold flex items-center gap-1.5">
                          <span>📅</span> {plan.startDate} ~ {plan.endDate} ({plan.durationText})
                        </p>
                      </div>

                      {/* Elegant Dashed Ticket Line */}
                      <div className="relative my-1">
                        <div className="border-t border-dashed border-white/20 w-full"></div>
                        {/* Left notch */}
                        <div className="absolute left-[-29px] top-[-6px] w-3.5 h-3.5 rounded-full bg-gray-100 shadow-inner z-20"></div>
                        {/* Right notch */}
                        <div className="absolute right-[-29px] top-[-6px] w-3.5 h-3.5 rounded-full bg-gray-100 shadow-inner z-20"></div>
                      </div>

                      {/* Itinerary Contents Section */}
                      <div className="space-y-3 flex-1 flex flex-col justify-center">
                        {shareScope === 'current' ? (
                          <div className="space-y-3 bg-black/15 rounded-2xl p-4 border border-white/10 backdrop-blur-md flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                                <span className="font-sans text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                                  <span className="text-xs">📅</span> Day {selectedDayNum} ({activeDay.dayOfWeek})
                                </span>
                                <span className="font-mono text-[9px] font-bold text-white/60">
                                  {activeDay.date}
                                </span>
                              </div>

                              {activeDay.items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-white/40 space-y-1">
                                  <span className="text-lg">📭</span>
                                  <p className="font-sans text-[10px]">등록된 일정이 없습니다.</p>
                                </div>
                              ) : (
                                <div className="space-y-3 relative pl-4 before:content-[''] before:absolute before:left-[4px] before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-white/15">
                                  {activeDay.items.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="relative group">
                                      {/* Premium glass-morphic timeline node */}
                                      <div className="absolute left-[-16px] top-[4px] w-2.5 h-2.5 rounded-full bg-white/25 border border-white/60 flex items-center justify-center shadow-sm">
                                        <div className="w-1 h-1 rounded-full bg-white" />
                                      </div>
                                      <div>
                                        <div className="flex items-baseline justify-between gap-1.5">
                                          <span className="font-sans font-bold text-xs text-white tracking-tight truncate max-w-[185px]">
                                            {item.title}
                                          </span>
                                          <span className="font-mono text-[8px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                            {item.time}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 bg-black/15 rounded-2xl p-3 border border-white/10 backdrop-blur-md flex-1">
                            {plan.days.map((day) => (
                              <div key={day.dayNumber} className="bg-white/5 rounded-xl p-2.5 border border-white/5 space-y-1.5">
                                <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1">
                                  <span className="font-sans text-[10px] font-extrabold text-white flex items-center gap-1">
                                    <span className="text-[10px]">📍</span> {day.dayNumber}일차 ({day.dayOfWeek})
                                  </span>
                                </div>
                                {day.items.length === 0 ? (
                                  <p className="text-[9px] text-white/30 italic">등록된 일정 없음</p>
                                ) : (
                                  <div className="flex flex-col gap-1 text-[9px] text-white/80">
                                    {day.items.map((item, idx) => (
                                      <div key={`${item.id}-${idx}`} className="flex justify-between items-center gap-1.5">
                                        <span className="font-sans font-bold truncate max-w-[170px]">
                                          <span className="text-white/40 font-mono mr-1">{idx + 1}</span>{item.title}
                                        </span>
                                        <span className="font-mono text-[7px] text-white/50">{item.time}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom branding footer styled as ticket details */}
                    <div className="border-t border-white/10 pt-4 flex justify-between items-center relative z-10 mt-2">
                      <div className="text-left space-y-0.5">
                        <p className="font-mono text-[7px] tracking-wider text-white/50 uppercase">SYSTEM POWERED BY</p>
                        <p className="font-logo font-semibold text-xs tracking-wide text-white">
                          Trippo
                        </p>
                      </div>

                      {/* Beautiful simulated barcode for digital boarding pass aesthetic */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex gap-[1.5px] items-stretch h-6 opacity-60">
                          {[1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 1, 3, 2, 1, 2, 1].map((width, idx) => (
                            <div
                              key={idx}
                              className="bg-white h-full shrink-0"
                              style={{ width: `${width}px` }}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-[6.5px] text-white/40 tracking-[0.25em]">TRIPPO-SYSTEM-2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shareable Card Canvas Container (Live interactive preview) */}
                <div className="space-y-2">
                  <label className="font-sans font-extrabold text-xs text-gray-500 uppercase tracking-wider block">
                    미리보기
                  </label>
                  
                  <div className="bg-gray-100 rounded-3xl p-4 shadow-inner flex justify-center overflow-hidden border border-gray-200/50 relative">
                    {/* Capturable Target */}
                    <div
                      ref={shareCardRef}
                      className={`w-[340px] p-6 text-white relative overflow-hidden flex flex-col justify-between shrink-0 select-none shadow-xl ${
                        shareTheme === 'slate' ? 'bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 text-white' :
                        shareTheme === 'pink' ? 'bg-gradient-to-br from-rose-400 via-pink-500 to-indigo-900 text-white' :
                        shareTheme === 'green' ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 text-white' :
                        shareTheme === 'custom' ? '' :
                        'bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white'
                      }`}
                      style={{
                        minHeight: '490px',
                        borderRadius: '28px',
                        background: shareTheme === 'custom' ? `linear-gradient(135deg, ${customStartColor}, ${customEndColor})` : undefined
                      }}
                    >
                      {/* Premium Decorative elements - ambient glow circles */}
                      <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                      <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none"></div>
                      {/* Subtle Grid overlay for high-tech aesthetic */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

                      <div className="relative z-10 space-y-4 flex-1 flex flex-col">
                        {/* Ticket top header */}
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">✈️</span>
                            <span className="font-sans font-black text-[9px] tracking-[0.2em] uppercase text-white/90">TRIPPO BOARDING PASS</span>
                          </div>
                          <span className="text-[8px] font-mono font-bold bg-white/15 border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-md uppercase tracking-wider">
                            {shareScope === 'current' ? `DAY ${selectedDayNum}` : 'ALL DAYS'}
                          </span>
                        </div>

                        {/* Title and details */}
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-sans font-extrabold text-lg tracking-tight leading-snug text-white drop-shadow-sm">
                              {plan.title}
                            </h3>
                            <div className="font-mono text-[9px] text-white/60 bg-black/15 px-1.5 py-0.5 rounded border border-white/5 uppercase whitespace-nowrap">
                              PASS NO. {plan.days.length}D-{selectedDayNum}
                            </div>
                          </div>
                          <p className="font-sans text-[9.5px] text-white/70 font-semibold flex items-center gap-1.5">
                            <span>📅</span> {plan.startDate} ~ {plan.endDate} ({plan.durationText})
                          </p>
                        </div>

                        {/* Elegant Dashed Ticket Line */}
                        <div className="relative my-1">
                          <div className="border-t border-dashed border-white/20 w-full"></div>
                          {/* Left notch */}
                          <div className="absolute left-[-29px] top-[-6px] w-3.5 h-3.5 rounded-full bg-gray-100 shadow-inner z-20"></div>
                          {/* Right notch */}
                          <div className="absolute right-[-29px] top-[-6px] w-3.5 h-3.5 rounded-full bg-gray-100 shadow-inner z-20"></div>
                        </div>

                        {/* Itinerary Contents Section */}
                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                          {shareScope === 'current' ? (
                            <div className="space-y-3 bg-black/15 rounded-2xl p-4 border border-white/10 backdrop-blur-md flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                                  <span className="font-sans text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                                    <span className="text-xs">📅</span> Day {selectedDayNum} ({activeDay.dayOfWeek})
                                  </span>
                                  <span className="font-mono text-[9px] font-bold text-white/60">
                                    {activeDay.date}
                                  </span>
                                </div>

                                {activeDay.items.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-8 text-white/40 space-y-1">
                                    <span className="text-lg">📭</span>
                                    <p className="font-sans text-[10px]">등록된 일정이 없습니다.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3 relative pl-4 before:content-[''] before:absolute before:left-[4px] before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-white/15">
                                    {activeDay.items.slice(0, 5).map((item, idx) => (
                                      <div key={`${item.id}-${idx}`} className="relative group">
                                        {/* Premium glass-morphic timeline node */}
                                        <div className="absolute left-[-16px] top-[4px] w-2.5 h-2.5 rounded-full bg-white/25 border border-white/60 flex items-center justify-center shadow-sm">
                                          <div className="w-1 h-1 rounded-full bg-white" />
                                        </div>
                                        <div>
                                          <div className="flex items-baseline justify-between gap-1.5">
                                            <span className="font-sans font-bold text-xs text-white tracking-tight truncate max-w-[185px]">
                                              {item.title}
                                            </span>
                                            <span className="font-mono text-[8px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                              {item.time}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    {activeDay.items.length > 5 && (
                                      <p className="text-[9px] text-white/50 pl-0.5 font-sans font-medium">
                                        + 외 {activeDay.items.length - 5}개의 소중한 일정들
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 bg-black/15 rounded-2xl p-3 border border-white/10 backdrop-blur-md max-h-[230px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 flex-1">
                              {plan.days.map((day) => (
                                <div key={day.dayNumber} className="bg-white/5 rounded-xl p-2.5 border border-white/5 space-y-1.5">
                                  <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1">
                                    <span className="font-sans text-[10px] font-extrabold text-white flex items-center gap-1">
                                      <span className="text-[10px]">📍</span> {day.dayNumber}일차 ({day.dayOfWeek})
                                    </span>
                                  </div>
                                  {day.items.length === 0 ? (
                                    <p className="text-[9px] text-white/30 italic">등록된 일정 없음</p>
                                  ) : (
                                    <div className="flex flex-col gap-1 text-[9px] text-white/80">
                                      {day.items.slice(0, 3).map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="flex justify-between items-center gap-1.5">
                                          <span className="font-sans font-bold truncate max-w-[170px]">
                                            <span className="text-white/40 font-mono mr-1">{idx + 1}</span>{item.title}
                                          </span>
                                          <span className="font-mono text-[7px] text-white/50">{item.time}</span>
                                        </div>
                                      ))}
                                      {day.items.length > 3 && (
                                        <span className="text-[8px] text-white/40 font-bold pl-3">
                                          + 외 {day.items.length - 3}개의 일정 더보기
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom branding footer styled as ticket details */}
                      <div className="border-t border-white/10 pt-4 flex justify-between items-center relative z-10 mt-2">
                        <div className="text-left space-y-0.5">
                          <p className="font-mono text-[7px] tracking-wider text-white/50 uppercase">SYSTEM POWERED BY</p>
                          <p className="font-logo font-semibold text-xs tracking-wide text-white">
                            Trippo
                          </p>
                        </div>

                        {/* Beautiful simulated barcode for digital boarding pass aesthetic */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex gap-[1.5px] items-stretch h-6 opacity-60">
                            {[1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 1, 3, 2, 1, 2, 1].map((width, idx) => (
                              <div
                                key={idx}
                                className="bg-white h-full shrink-0"
                                style={{ width: `${width}px` }}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-[6.5px] text-white/40 tracking-[0.25em]">TRIPPO-SYSTEM-2026</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shared action triggers */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleCopyToClipboard}
                    disabled={isGenerating}
                    className="w-full bg-white hover:bg-gray-100 text-gray-700 font-sans font-bold text-sm py-3 px-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>📋</span>
                    <span>클립보드 복사</span>
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm py-3 px-4 rounded-xl shadow-md shadow-blue-500/15 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} />
                    <span>{isGenerating ? '이미지 생성중...' : '이미지로 저장'}</span>
                  </button>
                </div>

                {/* Mobile Web Share API trigger */}
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    onClick={handleWebShare}
                    disabled={isGenerating}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-sans font-bold text-sm py-3 px-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Share2 size={14} />
                    <span>친구에게 직접 공유하기 (SNS / 카카오톡)</span>
                  </button>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
