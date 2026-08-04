import { translateText, Language } from '../utils/translations';

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  title?: string;
  language: Language;
  isDarkMode: boolean;
}

export default function Header({ onMenuClick, onSearchClick, title = 'Trippo', language, isDarkMode }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-gray-50 dark:bg-app-bg px-6 py-4 flex justify-center items-center transition-colors duration-300">
      <h1 className="font-logo font-semibold text-2xl text-blue-500 dark:text-brand-primary tracking-wide cursor-default select-none">
        {title}
      </h1>
    </header>
  );
}
