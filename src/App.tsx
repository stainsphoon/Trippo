/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import BottomNavBar from './components/BottomNavBar';
import ExploreTab from './components/ExploreTab';
import RecordTab from './components/RecordTab';
import PlanTab from './components/PlanTab';
import SettingsTab from './components/SettingsTab';
import LoginScreen from './components/LoginScreen';
import { INITIAL_LOGS, INITIAL_PLAN } from './data/mockData';
import { TravelLog, TravelPlan, Destination } from './types';
import { Language } from './utils/translations';
import { JourneyPassData, createJourneyPassData, calculateDateDuration } from './types/journeyPass';
import JourneyPassTransition from './components/JourneyPassTransition';
import { createSharedPlan, updateSharedPlan, subscribeToSharedPlan, syncUserToFirestore } from './lib/firebaseService';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { isDeepEqual } from './utils/deepEqual';

export default function App() {
  const [activeTab, setActiveTab] = useState('explore'); // Initial active tab is 'explore' (조회)
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined means loading

  // Journey Pass Printing Signature Transition States
  const [activeJourneyPassData, setActiveJourneyPassData] = useState<JourneyPassData | null>(null);
  const [isPlanningTransitionActive, setIsPlanningTransitionActive] = useState<boolean>(false);
  const [isPlanReady, setIsPlanReady] = useState<boolean>(false);
  const [isPlanError, setIsPlanError] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        syncUserToFirestore(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSetActiveTab = (tab: string) => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setActiveTab(tab);
  };

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
  const [invitePlanContext, setInvitePlanContext] = useState<TravelPlan | null>(null);

  // Collaborative Share States
  const [sharedPlanId, setSharedPlanId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('sharedPlanId');
  });
  const [isSharedPlanLoading, setIsSharedPlanLoading] = useState<boolean>(false);
  const [sharedPlanError, setSharedPlanError] = useState<string | null>(null);
  const lastRemotePlanRef = useRef<TravelPlan | null>(null);

  // Load Initial Logs Data from LocalStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('trippo_logs');
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) {
          setLogs(parsed);
        } else {
          setLogs(INITIAL_LOGS);
          localStorage.setItem('trippo_logs', JSON.stringify(INITIAL_LOGS));
        }
      } catch (e) {
        console.error("Failed to parse trippo_logs:", e);
        setLogs(INITIAL_LOGS);
        localStorage.setItem('trippo_logs', JSON.stringify(INITIAL_LOGS));
      }
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
        try {
          const parsed = JSON.parse(savedPlan);
          if (parsed && typeof parsed === 'object') {
            setPlan(parsed);
          } else {
            setPlan(INITIAL_PLAN);
            localStorage.setItem('trippo_plan', JSON.stringify(INITIAL_PLAN));
          }
        } catch (e) {
          console.error("Failed to parse trippo_plan:", e);
          setPlan(INITIAL_PLAN);
          localStorage.setItem('trippo_plan', JSON.stringify(INITIAL_PLAN));
        }
      } else {
        setPlan(INITIAL_PLAN);
        localStorage.setItem('trippo_plan', JSON.stringify(INITIAL_PLAN));
      }
      return;
    }

    setIsSharedPlanLoading(true);
    setSharedPlanError(null);

    // Subscribe to shared plan changes in real-time
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = subscribeToSharedPlan(
        sharedPlanId,
        (fetchedPlan) => {
          setIsSharedPlanLoading(false);
          if (fetchedPlan) {
            lastRemotePlanRef.current = fetchedPlan;
            setPlan((prev) => {
              if (prev && isDeepEqual(prev, fetchedPlan, ['updatedAt'])) {
                return prev;
              }
              return fetchedPlan;
            });
          } else {
            setPlan(null);
          }
        },
        (error) => {
          console.error("Shared plan subscription failed:", error);
          setSharedPlanError(language === 'ko' ? '일정을 불러오는 데 실패했습니다.' : 'Failed to load schedule.');
          setIsSharedPlanLoading(false);
          // Fallback to local plan
          const savedPlan = localStorage.getItem('trippo_plan');
          let fallbackPlan = INITIAL_PLAN;
          if (savedPlan) {
            try {
              const parsed = JSON.parse(savedPlan);
              if (parsed && typeof parsed === 'object') {
                fallbackPlan = parsed;
              }
            } catch (e) {
              console.error("Failed to parse fallback plan:", e);
            }
          }
          setPlan(fallbackPlan);
          setSharedPlanId(null);
          // Remove query param without reload
          const url = new URL(window.location.href);
          url.searchParams.delete('sharedPlanId');
          window.history.pushState({}, '', url.toString());
        }
      );
    } catch (e) {
      console.error("Failed to subscribe synchronously:", e);
      setSharedPlanError(language === 'ko' ? '일정을 불러오는 데 실패했습니다.' : 'Failed to load schedule.');
      setIsSharedPlanLoading(false);
    }

    // Navigate to Plan tab when accessing via share link
    handleSetActiveTab('plan');

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sharedPlanId, language]);

  // Handle shared plan invitations
  useEffect(() => {
    if (!sharedPlanId || !plan || !user) return;

    // The creator shouldn't see the invite modal.
    if (plan.creatorId === user.uid) {
      setInvitePlanContext(null);
      return;
    }

    const comps = plan.companions || [];
    const isAlreadyCompanion = comps.some(
      (c) => c.id === user.uid || (c.email && c.email === user.email)
    );

    if (!isAlreadyCompanion) {
      setInvitePlanContext(plan);
    } else {
      setInvitePlanContext(null);
    }
  }, [sharedPlanId, plan, user]);

  // Sync to LocalStorage on updates
  useEffect(() => {
    if (!plan) return;

    const savedHistory = localStorage.getItem('trippo_plans_history');
    let history: TravelPlan[] = [];
    if (savedHistory) {
      try {
        history = JSON.parse(savedHistory);
      } catch (e) {
        console.error("Failed to parse trippo_plans_history:", e);
      }
    }

    if (!Array.isArray(history)) {
      history = [];
    }

    const index = history.findIndex((p) => p.id === plan.id);
    if (index >= 0) {
      history[index] = plan;
    } else {
      history.push(plan);
    }

    localStorage.setItem('trippo_plans_history', JSON.stringify(history));
  }, [plan]);

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

  // Automatically add logged-in user to companions of the current active plan
  useEffect(() => {
    if (user && plan) {
      const currentComps = plan.companions || [];
      const hasUser = currentComps.some(c => c.id === user.uid);
      if (!hasUser) {
        const creatorCompanion = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
          email: user.email || '',
          isLocal: false,
          photoURL: user.photoURL || undefined
        };
        setPlan((prev) => {
          if (!prev) return prev;
          if ((prev.companions || []).some(c => c.id === user.uid)) return prev;
          return { ...prev, companions: [...(prev.companions || []), creatorCompanion] };
        });
      }
    }
  }, [user, plan?.id, sharedPlanId]);

  const handleUpdatePlan = (updater: TravelPlan | ((prev: TravelPlan) => TravelPlan)) => {
    setPlan((prev) => {
      if (!prev) return prev;
      return typeof updater === 'function' ? updater(prev) : updater;
    });
  };

  // Sync plan changes to Firestore/LocalStorage
  useEffect(() => {
    if (!plan) return;

    if (sharedPlanId) {
      if (lastRemotePlanRef.current && isDeepEqual(lastRemotePlanRef.current, plan, ['updatedAt'])) {
        return;
      }
      const timer = setTimeout(() => {
        updateSharedPlan(sharedPlanId, plan).catch((err) => {
          console.error("Failed to sync shared plan to Firestore:", err);
        });
      }, 1000); // 1-second debounce to protect quota
      return () => clearTimeout(timer);
    } else {
      localStorage.setItem('trippo_plan', JSON.stringify(plan));
    }
  }, [plan, sharedPlanId]);

  const handleStartSharedMode = async (silent?: boolean) => {
    if (!plan) return;
    try {
      const creatorCompanion = user ? {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
        email: user.email || '',
        isLocal: false
      } : null;

      const currentComps = plan.companions || [];
      const isCreatorAlreadyIn = user && currentComps.some(c => c.id === user.uid);
      const newComps = isCreatorAlreadyIn || !creatorCompanion ? currentComps : [...currentComps, creatorCompanion];

      const planWithCreator = {
        ...plan,
        creatorId: user?.uid || undefined,
        companions: newComps
      };
      const docId = await createSharedPlan(planWithCreator);
      setSharedPlanId(docId);
      setPlan(planWithCreator);
      
      const url = new URL(window.location.href);
      url.searchParams.set('sharedPlanId', docId);
      window.history.pushState({}, '', url.toString());

      const shareUrl = `${url.origin}${url.pathname}?sharedPlanId=${docId}`;
      
      if (!silent) {
        let copied = false;
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          try {
            await navigator.clipboard.writeText(shareUrl);
            copied = true;
          } catch (clipErr) {
            console.warn('Failed to write to clipboard:', clipErr);
          }
        }

        const alertMsg = copied
          ? (language === 'ko'
            ? '실시간 공동 편집 세션이 시작되었습니다! 초대 링크가 클립보드에 자동 복사되었습니다. 친구에게 보내보세요! 🤝🚀'
            : 'Real-time collaborative session started! The invite link has been automatically copied to your clipboard. Send it to friends! 🤝🚀')
          : (language === 'ko'
            ? `실시간 공동 편집 세션이 시작되었습니다!\n\n아래의 초대 링크를 복사하여 친구들에게 공유해 보세요:\n${shareUrl}`
            : `Real-time collaborative session started!\n\nPlease copy and share this invite link with your friends:\n${shareUrl}`);
        alert(alertMsg);
      }
      return docId;
    } catch (error) {
      console.error('Failed to initialize collaborative mode:', error);
      alert(language === 'ko'
        ? '실시간 공동 편집 세션을 시작하지 못했습니다. 네트워크 상황을 확인해 주세요.'
        : 'Failed to start real-time collaborative session. Please check your connection.');
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
    localStorage.setItem('trippo_plans_history', JSON.stringify([INITIAL_PLAN]));
  };

  // Callback when a recommended destination is clicked or custom analysis is applied
  const handleSelectDestinationWithDates = (
    destName: string,
    startDate?: string,
    endDate?: string,
    context?: { placeId?: string; countryCode?: string; countryName?: string; timezoneId?: string; city?: string }
  ) => {
    if (!plan || isPlanningTransitionActive) return;

    // 1. Immediately create JourneyPassData and trigger the signature printing transition
    const passData = createJourneyPassData({
      destinationId: context?.placeId || `dest-${Date.now()}`,
      rawDestinationName: destName,
      countryCode: context?.countryCode,
      countryName: context?.countryName,
      startDate: startDate || '2026-07-22',
      endDate: endDate || '2026-07-29',
      timezoneId: context?.timezoneId,
      language
    });

    setActiveJourneyPassData(passData);
    setIsPlanningTransitionActive(true);
    setIsPlanReady(false);
    setIsPlanError(false);

    // 2. Concurrently initialize the Travel Plan in parallel with the transition animation
    try {
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
        const { nights, days } = calculateDateDuration(startDate, endDate);
        durationText = language === 'ko' ? `${nights}박 ${days}일` : `${nights}N ${days}D`;
      }

      // Generate days array based on date range
      let daysArray = plan.days;
      if (startDate && endDate) {
        const sParts = startDate.split('-').map(Number);
        const sDate = sParts.length === 3 ? new Date(sParts[0], sParts[1] - 1, sParts[2]) : new Date(startDate);
        const { days: diffDays } = calculateDateDuration(startDate, endDate);
        
        const weekdays = language === 'ko' 
          ? ['일', '월', '화', '수', '목', '금', '토']
          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        daysArray = [];
        for (let i = 0; i < Math.min(diffDays, 14); i++) { // Support up to 14 days
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
                title: language === 'ko' ? `${passData.destinationName} 여행 시작` : `Start of ${passData.destinationName} Trip`,
                time: '10:00 AM',
                content: language === 'ko' ? '새로운 도시에서의 설레는 여정이 시작됩니다!' : 'Exciting journey begins in a new city!'
              }
            ];
          } else if (i === diffDays - 1) {
            items = [
              {
                id: `item-${Date.now()}-2`,
                title: language === 'ko' ? '체크아웃 및 귀국 준비' : 'Checkout & Return Prep',
                time: '11:00 AM',
                content: language === 'ko' ? '소중한 기억을 안고 일상으로 복귀합니다.' : 'Returning to daily life with wonderful memories.'
              }
            ];
          } else {
            items = [
              {
                id: `item-${Date.now()}-${i}-1`,
                title: language === 'ko' ? `${passData.destinationName} 자유 일정` : `${passData.destinationName} Free Itinerary`,
                time: '10:30 AM',
                content: language === 'ko' ? '자유롭게 현지 맛집과 명소를 탐방해보세요.' : 'Explore local restaurants and attractions freely.'
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
            title: item.title.replace('도쿄', passData.destinationName).replace('나리타', passData.destinationName)
          }))
        }));
      }

      const creatorCompanion = user ? {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
        email: user.email || '',
        isLocal: false,
        photoURL: user.photoURL || undefined
      } : null;

      const currentComps = plan.companions || [];
      const isCreatorAlreadyIn = user && currentComps.some(c => c.id === user.uid);
      const newComps = isCreatorAlreadyIn || !creatorCompanion ? currentComps : [...currentComps, creatorCompanion];

      const updatedPlan: TravelPlan = {
        ...plan,
        id: `plan-${Date.now()}`,
        title: language === 'ko' ? `${passData.destinationName} 여행 계획` : `${passData.destinationName} Itinerary`,
        startDate: formattedStart,
        endDate: formattedEnd,
        durationText,
        days: daysArray,
        companions: newComps
      };

      setPlan(updatedPlan);
      localStorage.setItem('trippo_plan', JSON.stringify(updatedPlan));
      
      // Parallel initialization complete
      setIsPlanReady(true);
    } catch (planErr) {
      console.error('[PLAN_CREATION_ERROR]', planErr);
      setIsPlanError(true);
    }
  };

  const handleCompleteJourneyPassTransition = () => {
    setIsPlanningTransitionActive(false);
    setActiveJourneyPassData(null);
    handleSetActiveTab('plan');
  };

  if (user === undefined) {
    return (
      <div className={`w-full h-screen flex flex-col items-center justify-center ${isDarkMode ? 'dark bg-app-bg' : 'bg-gray-50'}`}>
        <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user === null) {
    return <LoginScreen onLogin={() => {}} language={language} />;
  }

  return (
    <div className={`w-full h-screen overflow-hidden flex flex-col relative transition-colors duration-300 ${isDarkMode ? 'dark bg-app-bg text-text-primary' : 'bg-gray-50 text-gray-800'}`}>
      {/* App Topbar */}
      <Header
        title="Trippo"
        language={language}
        isDarkMode={isDarkMode}
      />

      {/* Main Workspace content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-6 pb-28 overflow-y-auto scrollbar-none">
          {activeTab === 'explore' && (
            <div className="w-full h-full transition-none transform-none animate-none">
              <ExploreTab 
                onSelectDestination={(dest, start, end, ctx) => handleSelectDestinationWithDates(dest, start, end, ctx)}
                language={language}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {activeTab === 'plan' && plan && (
            <div className="w-full h-full transition-none transform-none animate-none">
              {isSharedPlanLoading ? (
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
                  currentUserUid={user?.uid}
                  onExitSharedMode={handleExitSharedMode}
                  onStartSharedMode={handleStartSharedMode}
                />
              )}
            </div>
          )}

          {activeTab === 'record' && (
            <div className="w-full h-full transition-none transform-none animate-none">
              <RecordTab
                logs={logs}
                onAddLog={handleAddLog}
                onDeleteLog={handleDeleteLog}
                onUpdateLog={handleUpdateLog}
                onNavigateToPlan={() => handleSetActiveTab('plan')}
                plan={plan}
                language={language}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="w-full h-full transition-none transform-none animate-none">
              <SettingsTab 
                onResetData={handleResetAllData} 
                logsCount={logs.length}
                language={language}
                setLanguage={handleSetLanguage}
                isDarkMode={isDarkMode}
                setIsDarkMode={handleSetIsDarkMode}
              />
            </div>
          )}
        </main>

        {/* Invite Modal */}
        {invitePlanContext && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white dark:bg-surface-primary w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-fade-in border border-gray-100 dark:border-subtle-border">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="font-sans font-extrabold text-lg text-gray-800 dark:text-text-primary mb-2">
                {language === 'ko' ? '초대받은 일정' : 'Invited Plan'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-text-secondary mb-6 leading-relaxed">
                {language === 'ko' ? (
                  <>
                    <strong className="text-blue-600 dark:text-blue-400">'{invitePlanContext.title}'</strong> 일정에 참여하시겠습니까?
                  </>
                ) : (
                  <>
                    Are you going to participate in <strong className="text-blue-600 dark:text-blue-400">'{invitePlanContext.title}'</strong>?
                  </>
                )}
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setInvitePlanContext(null);
                    setSharedPlanId(null);
                    setPlan(null); // Clear the invited plan
                    setActiveTab('explore'); // Go back to home
                    // Optionally strip sharedPlanId from URL
                    const url = new URL(window.location.href);
                    url.searchParams.delete('sharedPlanId');
                    window.history.pushState({}, '', url.toString());
                  }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-stone-800 hover:bg-gray-200 dark:hover:bg-stone-700 text-gray-700 dark:text-stone-300 font-sans font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  {language === 'ko' ? '거절' : 'Decline'}
                </button>
                <button
                  onClick={() => {
                    if (!user || !invitePlanContext) return;
                    const comps = invitePlanContext.companions || [];
                    const newCompanion = {
                      id: user.uid,
                      name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
                      email: user.email || '',
                      isLocal: false
                    };
                    const updatedPlan = {
                      ...invitePlanContext,
                      companions: [...comps, newCompanion]
                    };
                    handleUpdatePlan(updatedPlan);
                    setInvitePlanContext(null);
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {language === 'ko' ? '수락' : 'Accept'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Bottom Control Area */}
        <div className="flex-none flex flex-col">
          <BottomNavBar 
            activeTab={activeTab} 
            setActiveTab={handleSetActiveTab} 
            language={language}
            isDarkMode={isDarkMode}
          />
        </div>

      {/* Signature Journey Pass Printing Transition Overlay */}
      {isPlanningTransitionActive && activeJourneyPassData && (
        <JourneyPassTransition
          data={activeJourneyPassData}
          planReady={isPlanReady}
          onTransitionComplete={handleCompleteJourneyPassTransition}
          language={language}
          isDarkMode={isDarkMode}
          isPlanError={isPlanError}
          onRetryPlan={() => {
            if (activeJourneyPassData) {
              handleSelectDestinationWithDates(
                activeJourneyPassData.destinationName,
                activeJourneyPassData.startDate,
                activeJourneyPassData.endDate
              );
            }
          }}
        />
      )}
    </div>
  );
}
