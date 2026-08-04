import { Compass, Calendar, NotebookPen, Settings } from 'lucide-react';
import { translateText, Language } from '../utils/translations';
import { motion } from 'motion/react';

interface BottomNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  isDarkMode: boolean;
}

export default function BottomNavBar({ activeTab, setActiveTab, language, isDarkMode }: BottomNavBarProps) {
  const tabs = [
    { id: 'explore', label: translateText('explore', language), icon: Compass },
    { id: 'plan', label: translateText('plan', language), icon: Calendar },
    { id: 'record', label: translateText('record', language), icon: NotebookPen },
    { id: 'settings', label: translateText('settings', language), icon: Settings },
  ];

  const handleTabClick = (id: string) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(50);
      } catch (e) {
        // ignore
      }
    }
    setActiveTab(id);
  };

  return (
    <nav className="absolute bottom-[calc(env(safe-area-inset-bottom)+10px)] left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md h-[58px] z-40 bg-white/90 dark:bg-bottom-nav-surface backdrop-blur-lg shadow-lg dark:shadow-none border border-white/40 dark:border-subtle-border rounded-[22px] flex justify-around items-center px-2 py-1 transition-colors duration-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            id={`nav-btn-${tab.id}`}
            className="relative flex flex-col items-center justify-center min-w-[40px] min-h-[40px] rounded-xl w-full h-full mx-0.5 transition-colors duration-200"
          >
            {isActive && (
              <motion.div
                layoutId="active-nav-bg"
                className="absolute inset-0.5 bg-blue-50/80 dark:bg-active-nav-surface rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <motion.div
              animate={isActive ? { scale: [0.95, 1.05, 1.0] } : { scale: 1.0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative z-10 flex flex-col items-center justify-center ${isActive ? 'text-blue-600 dark:text-brand-primary' : 'text-gray-400 dark:text-icon-inactive'}`}
            >
              <Icon
                size={18}
                className="mb-0.5"
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] tracking-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
            </motion.div>
          </button>
        );
      })}
    </nav>
  );
}
