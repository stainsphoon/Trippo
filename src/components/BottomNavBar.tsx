import { Compass, Calendar, NotebookPen, Settings } from 'lucide-react';
import { translateText, Language } from '../utils/translations';

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

  return (
    <nav className="absolute bottom-4 left-4 right-4 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/40 dark:border-stone-800/80 rounded-[24px] flex justify-around items-center py-2.5 px-3 transition-colors duration-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            id={`nav-btn-${tab.id}`}
            className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all duration-300 scale-100 active:scale-95 ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-gray-400 hover:text-gray-600 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Icon
              size={20}
              className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110 text-blue-600 dark:text-blue-400' : ''}`}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-[11px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
