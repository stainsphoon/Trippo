/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNavBar from './components/BottomNavBar';
import ExploreTab from './components/ExploreTab';
import RecordTab from './components/RecordTab';
import PlanTab from './components/PlanTab';
import SettingsTab from './components/SettingsTab';
import { INITIAL_LOGS, INITIAL_PLAN } from './data/mockData';
import { TravelLog, TravelPlan, Destination } from './types';
import { Language } from './utils/translations';
import { createSharedPlan, updateSharedPlan, subscribeToSharedPlan } from './lib/firebaseService';

export default function App() {
  const [activeTab, setActiveTab] = useState('explore'); // Initial active tab is 'explore' (조회)

  // Language & Theme states
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('trippo_lang');
    return (saved === 'en' || saved === 'ko') ? saved : 'ko';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('trippo_dark');
    return saved === 'true';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('trippo_lang', lang);
  };

  const handleSetIsDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem('trippo_dark', String(dark));
  };

  // Persistent States
  const [logs, setLogs] = useState<TravelLog[]>([]);
  const [plan, setPlan] = useState<TravelPlan | null>(null);

  // Collaborative Share States
  const [sharedPlanId, setSharedPlanId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('sharedPlanId');
  });
  const [isSharedPlanLoading, setIsSharedPlanLoading] = useState<boolean>(false);
  const [sharedPlanError, setSharedPlanError] = useState<string | null>(null);

  // Load Initial Logs Data from LocalStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('trippo_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      setLogs(INITIAL_LOGS);
      localStorage.setItem('trippo_logs', JSON.stringify(INITIAL_LOGS));
    }
  }, []);

  // Handle Shared Plan loading & subscription or Local fallback
  useEffect(() => {
    if (!sharedPlanId) {
      const savedPlan = localStorage.getItem('trippo_plan');
      if (savedPlan) {
        setPlan(JSON.parse(savedPlan));
      } else {
        setPlan(INITIAL_PLAN);
        localStorage.setItem('trippo_plan', JSON.stringify(INITIAL_PLAN));
      }
      return;
    }

    setIsSharedPlanLoading(true);
    setSharedPlanError(null);

    // Subscribe to shared plan changes in real-time
    const unsubscribe = subscribeToSharedPlan(
      sharedPlanId,
      (fetchedPlan) => {
        setPlan(fetchedPlan);
        setIsSharedPlanLoading(false);
      },
      (error) => {
        console.error("Shared plan subscription failed:", error);
        setSharedPlanError(language === 'ko' ? '일정을 불러오는 데 실패했습니다.' : 'Failed to load schedule.');
        setIsSharedPlanLoading(false);
        // Fallback to local plan
        const savedPlan = localStorage.getItem('trippo_plan');
        setPlan(savedPlan ? JSON.parse(savedPlan) : INITIAL_PLAN);
        setSharedPlanId(null);
        // Remove query param without reload
        const url = new URL(window.location.href);
        url.searchParams.delete('sharedPlanId');
        window.history.pushState({}, '', url.toString());
      }
    );

    // Navigate to Plan tab when accessing via share link
    setActiveTab('plan');

    return () => {
      unsubscribe();
    };
  }, [sharedPlanId, language]);

  // Sync to LocalStorage on updates
  const handleAddLog = (newLog: Omit<TravelLog, 'id'>) => {
    const createdLog: TravelLog = {
      ...newLog,
      id: `log-${Date.now()}`
    };
    const updated = [createdLog, ...logs];
    setLogs(updated);
    localStorage.setItem('trippo_logs', JSON.stringify(updated));
  };

  const handleDeleteLog = (id: string) => {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    localStorage.setItem('trippo_logs', JSON.stringify(updated));
  };

  const handleUpdateLog = (updatedLog: TravelLog) => {
    const updated = logs.map((l) => (l.id === updatedLog.id ? updatedLog : l));
    setLogs(updated);
    localStorage.setItem('trippo_logs', JSON.stringify(updated));
  };

  const handleUpdatePlan = (updatedPlan: TravelPlan) => {
    setPlan(updatedPlan);
    if (sharedPlanId) {
      updateSharedPlan(sharedPlanId, updatedPlan).catch((err) => {
        console.error("Failed to sync shared plan to Firestore:", err);
      });
    } else {
      localStorage.setItem('trippo_plan', JSON.stringify(updatedPlan));
    }
  };

  const handleStartSharedMode = async () => {
    if (!plan) return;
    try {
      const docId = await createSharedPlan(plan);
      setSharedPlanId(docId);
      
      const url = new URL(window.location.href);
      url.searchParams.set('sharedPlanId', docId);
      window.history.pushState({}, '', url.toString());

      const shareUrl = `${url.origin}${url.pathname}?sharedPlanId=${docId}`;
      await navigator.clipboard.writeText(shareUrl);

      const alertMsg = language === 'ko'
        ? '실시간 공동 편집 세션이 시작되었습니다! 초대 링크가 클립보드에 자동 복사되었습니다. 친구에게 보내보세요! 🤝🚀'
        : 'Real-time collaborative session started! The invite link has been automatically copied to your clipboard. Send it to friends! 🤝🚀';
      alert(alertMsg);
    } catch (error) {
      console.error('Failed to initialize collaborative mode:', error);
      throw error;
    }
  };

  const handleExitSharedMode = () => {
    setSharedPlanId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('sharedPlanId');
    window.history.pushState({}, '', url.toString());
    const alertMsg = language === 'ko'
      ? '공유 일정에서 퇴장하여 로컬 일정으로 복귀했습니다.'
      : 'Exited shared schedule and returned to local schedule.';
    alert(alertMsg);
  };

  const handleResetAllData = () => {
    setLogs(INITIAL_LOGS);
    setPlan(INITIAL_PLAN);
    localStorage.setItem('trippo_logs', JSON.stringify(INITIAL_LOGS));
    localStorage.setItem('trippo_plan', JSON.stringify(INITIAL_PLAN));
  };

  // Callback when a recommended destination is clicked or custom analysis is applied
  const handleSelectDestinationWithDates = (destName: string, startDate?: string, endDate?: string) => {
    if (!plan) return;

    // Format dates cleanly, e.g., "2026. 07. 15"
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`;
    };

    const formattedStart = formatDate(startDate) || plan.startDate;
    const formattedEnd = formatDate(endDate) || plan.endDate;

    // Calculate duration text
    let durationText = plan.durationText;
    if (startDate && endDate) {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (!isNaN(diffDays) && diffDays > 0) {
        durationText = `${diffDays}박 ${diffDays + 1}일`;
      }
    }

    // Generate days array based on date range
    let daysArray = plan.days;
    if (startDate && endDate) {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      
      daysArray = [];
      for (let i = 0; i < Math.min(diffDays, 10); i++) { // Limit to max 10 days for performance
        const current = new Date(sDate);
        current.setDate(sDate.getDate() + i);
        const dateStr = `${current.getFullYear()}. ${String(current.getMonth() + 1).padStart(2, '0')}. ${String(current.getDate()).padStart(2, '0')}`;
        const dayOfWeek = weekdays[current.getDay()];
        
        // Find existing items if any, or generate demo items for the new destination
        let items = [];
        if (i === 0) {
          items = [
            {
              id: `item-${Date.now()}-1`,
              title: `${destName} 여행 시작`,
              time: '10:00 AM',
              content: '새로운 도시에서의 설레는 여정이 시작됩니다!'
            }
          ];
        } else if (i === diffDays - 1) {
          items = [
            {
              id: `item-${Date.now()}-2`,
              title: '체크아웃 및 귀국 준비',
              time: '11:00 AM',
              content: '소중한 기억을 안고 일상으로 복귀합니다.'
            }
          ];
        } else {
          items = [
            {
              id: `item-${Date.now()}-${i}-1`,
              title: `${destName} 자유 투어`,
              time: '10:30 AM',
              content: '자유롭게 현지 맛집과 명소를 탐방해보세요.'
            }
          ];
        }

        daysArray.push({
          dayNumber: i + 1,
          date: dateStr,
          dayOfWeek,
          items
        });
      }
    } else {
      // If no custom dates, just change the title
      daysArray = plan.days.map(day => ({
        ...day,
        items: day.items.map(item => ({
          ...item,
          title: item.title.replace('도쿄', destName).replace('나리타', destName)
        }))
      }));
    }

    const updatedPlan: TravelPlan = {
      ...plan,
      title: `${destName} 여행 계획`,
      startDate: formattedStart,
      endDate: formattedEnd,
      durationText,
      days: daysArray
    };

    setPlan(updatedPlan);
    localStorage.setItem('trippo_plan', JSON.stringify(updatedPlan));
    
    const alertMsg = language === 'ko'
      ? `"${destName}" 일정을 계획 탭으로 연동하여 ${durationText} 계획을 새로 구성했습니다! ✈️`
      : `Linked "${destName}" to the Plan tab and created a new ${durationText} itinerary! ✈️`;
    alert(alertMsg);
    
    setActiveTab('plan');
  };

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center p-0 md:p-4">
      {/* Phone Frame mock to deliver premium applet feels */}
      <div className={`w-full max-w-md h-screen md:h-[88vh] md:max-h-[95vh] md:rounded-[40px] md:shadow-2xl overflow-hidden flex flex-col relative border-0 md:border-8 md:border-slate-800 transition-colors duration-300 ${isDarkMode ? 'dark bg-stone-950 text-stone-100' : 'bg-gray-50 text-gray-800'}`}>
        {/* App Topbar */}
        <Header
          title="Trippo"
          language={language}
          isDarkMode={isDarkMode}
          onSearchClick={() => {
            setActiveTab('explore');
          }}
        />

        {/* Main Workspace content */}
        <main className="flex-1 px-5 py-6 overflow-y-auto pb-28 scrollbar-none">
          {activeTab === 'explore' && (
            <ExploreTab 
              onSelectDestination={(dest, start, end) => handleSelectDestinationWithDates(dest, start, end)}
              language={language}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'plan' && plan && (
            isSharedPlanLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-sans text-xs text-gray-400">
                  {language === 'ko' ? '실시간 공유 일정 연결 중...' : 'Connecting to shared schedule...'}
                </p>
              </div>
            ) : sharedPlanError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white dark:bg-[#1a1924] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
                <span className="text-3xl">⚠️</span>
                <p className="font-sans text-xs font-bold text-rose-500">
                  {sharedPlanError}
                </p>
                <button
                  onClick={() => {
                    setSharedPlanError(null);
                    setSharedPlanId(null);
                  }}
                  className="bg-blue-600 text-white font-sans font-bold text-xs px-4 py-2 rounded-xl"
                >
                  {language === 'ko' ? '내 일정으로 돌아가기' : 'Return to My Schedule'}
                </button>
              </div>
            ) : (
              <PlanTab 
                plan={plan} 
                onUpdatePlan={handleUpdatePlan}
                language={language}
                isDarkMode={isDarkMode}
                sharedPlanId={sharedPlanId}
                onExitSharedMode={handleExitSharedMode}
                onStartSharedMode={handleStartSharedMode}
              />
            )
          )}

          {activeTab === 'record' && (
            <RecordTab
              logs={logs}
              onAddLog={handleAddLog}
              onDeleteLog={handleDeleteLog}
              onUpdateLog={handleUpdateLog}
              onNavigateToPlan={() => setActiveTab('plan')}
              plan={plan}
              language={language}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              onResetData={handleResetAllData} 
              logsCount={logs.length}
              language={language}
              setLanguage={handleSetLanguage}
              isDarkMode={isDarkMode}
              setIsDarkMode={handleSetIsDarkMode}
            />
          )}
        </main>

        {/* Persistent Bottom Bar */}
        <BottomNavBar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          language={language}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}
