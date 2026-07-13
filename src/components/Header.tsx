import { Menu, Search } from 'lucide-react';
import { translateText, Language } from '../utils/translations';

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  title?: string;
  language: Language;
  isDarkMode: boolean;
}

export default function Header({ onMenuClick, onSearchClick, title = 'Trippo', language, isDarkMode }: HeaderProps) {
  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      alert(translateText('side_menu_alert', language));
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-gray-50 dark:border-stone-800 px-5 py-4 flex justify-between items-center md:max-w-md md:mx-auto md:border-x md:border-gray-100 dark:md:border-stone-800 transition-colors duration-300">
      <button
        onClick={handleMenuClick}
        id="header-menu-btn"
        className="text-gray-500 hover:text-gray-800 dark:text-stone-400 dark:hover:text-stone-200 p-2 rounded-full hover:bg-gray-50 dark:hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center"
      >
        <Menu size={20} />
      </button>
      <h1 className="font-logo font-semibold text-2xl text-blue-500 dark:text-blue-400 tracking-wide absolute left-1/2 -translate-x-1/2 cursor-default select-none">
        {title}
      </h1>
      <button
        onClick={onSearchClick}
        id="header-search-btn"
        className="text-gray-500 hover:text-gray-800 dark:text-stone-400 dark:hover:text-stone-200 p-2 rounded-full hover:bg-gray-50 dark:hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center"
      >
        <Search size={20} />
      </button>
    </header>
  );
}
