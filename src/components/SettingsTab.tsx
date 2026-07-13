import { useState } from 'react';
import { Shield, User, RotateCcw, Volume2, Moon, Globe, Award, Sparkles } from 'lucide-react';
import { translateText, Language } from '../utils/translations';

interface SettingsTabProps {
  onResetData: () => void;
  logsCount: number;
  language: Language;
  setLanguage: (lang: Language) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}

export default function SettingsTab({
  onResetData,
  logsCount,
  language,
  setLanguage,
  isDarkMode,
  setIsDarkMode
}: SettingsTabProps) {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('trippo_username') || (language === 'ko' ? '스튜디오 빌더' : 'Studio Builder');
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    return localStorage.getItem('trippo_sound') !== 'false';
  });

  const handleUsernameChange = (newVal: string) => {
    setUsername(newVal);
    localStorage.setItem('trippo_username', newVal);
  };

  const handleSoundToggle = () => {
    const nextVal = !isSoundEnabled;
    setIsSoundEnabled(nextVal);
    localStorage.setItem('trippo_sound', String(nextVal));
  };

  const handleReset = () => {
    if (confirm(translateText('reset_confirm', language))) {
      onResetData();
      alert(translateText('reset_success', language));
    }
  };

  const t = (key: Parameters<typeof translateText>[0]) => translateText(key, language);

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <section className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-gray-100 dark:border-stone-800 shadow-sm flex items-center gap-4 transition-colors duration-300">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 relative overflow-hidden">
          <User size={30} strokeWidth={2} />
          <div className="absolute bottom-0 inset-x-0 bg-blue-600/10 dark:bg-blue-400/20 py-0.5 text-center">
            <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase">PRO</span>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className="font-sans font-bold text-gray-800 dark:text-stone-100 text-base bg-transparent border-b border-transparent focus:border-blue-500 outline-none w-36 py-0.5"
            />
            <Sparkles size={14} className="text-blue-500 dark:text-blue-400 animate-pulse" />
          </div>
          <p className="font-sans text-xs text-gray-400 dark:text-stone-400">
            {t('logs_count')}: {logsCount}
            {language === 'ko' ? '개' : ' logs'}
          </p>
        </div>
      </section>

      {/* General Settings Options */}
      <section className="space-y-3">
        <h3 className="font-sans font-bold text-xs text-gray-400 dark:text-stone-500 uppercase tracking-wider pl-1">
          {t('general_settings')}
        </h3>

        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-gray-100 dark:border-stone-800 shadow-sm divide-y divide-gray-150 dark:divide-stone-800 overflow-hidden transition-colors duration-300">
          {/* Language setting with modern toggle pills */}
          <div className="flex justify-between items-center px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-stone-850 flex items-center justify-center text-gray-500 dark:text-stone-400">
                <Globe size={16} />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-sm text-gray-800 dark:text-stone-200">{t('language_title')}</h4>
                <p className="font-sans text-[11px] text-gray-400 dark:text-stone-400">{t('language_desc')}</p>
              </div>
            </div>
            
            {/* Pill selections */}
            <div className="flex gap-1 bg-gray-100 dark:bg-stone-800 p-1 rounded-2xl">
              <button
                onClick={() => setLanguage('ko')}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all ${
                  language === 'ko'
                    ? 'bg-blue-600 text-white shadow-sm scale-105'
                    : 'text-gray-500 hover:text-gray-800 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-sm scale-105'
                    : 'text-gray-500 hover:text-gray-800 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Sound switch */}
          <div className="flex justify-between items-center px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-stone-850 flex items-center justify-center text-gray-500 dark:text-stone-400">
                <Volume2 size={16} />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-sm text-gray-800 dark:text-stone-200">{t('sound_title')}</h4>
                <p className="font-sans text-[11px] text-gray-400 dark:text-stone-400">{t('sound_desc')}</p>
              </div>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${
                isSoundEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-stone-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Dark Mode switch */}
          <div className="flex justify-between items-center px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-stone-850 flex items-center justify-center text-gray-500 dark:text-stone-400">
                <Moon size={16} />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-sm text-gray-800 dark:text-stone-200">{t('dark_mode_title')}</h4>
                <p className="font-sans text-[11px] text-gray-400 dark:text-stone-400">{t('dark_mode_desc')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${
                isDarkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-stone-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Account & Security Section */}
      <section className="space-y-3">
        <h3 className="font-sans font-bold text-xs text-gray-400 dark:text-stone-500 uppercase tracking-wider pl-1">
          {t('account_backup')}
        </h3>

        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-gray-100 dark:border-stone-800 shadow-sm divide-y divide-gray-150 dark:divide-stone-800 overflow-hidden transition-colors duration-300">
          {/* Pro badge rewards */}
          <div className="flex justify-between items-center px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
                <Award size={16} />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-sm text-gray-800 dark:text-stone-200">{t('membership_tier')}</h4>
                <p className="font-sans text-[11px] text-gray-400 dark:text-stone-400">{t('premium_active')}</p>
              </div>
            </div>
            <span className="font-sans text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg">PRO MEMBER</span>
          </div>

          {/* Reset All Data button */}
          <button
            onClick={handleReset}
            className="w-full text-left flex justify-between items-center px-5 py-4 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500">
                <RotateCcw size={16} />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-sm text-rose-600">{t('reset_data_title')}</h4>
                <p className="font-sans text-[11px] text-gray-400 dark:text-stone-400">{t('reset_data_desc')}</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Copyright footer */}
      <p className="text-center font-sans text-[10px] text-gray-300 dark:text-stone-600 py-4">
        Trippo v1.0.0 • Developed with Google AI Studio Build
      </p>
    </div>
  );
}
