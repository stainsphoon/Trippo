import { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { Language } from '../utils/translations';

interface LoginScreenProps {
  onLogin: () => void;
  language: Language;
}

export default function LoginScreen({ onLogin, language }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg(null);
      setIsLoading('google');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (error) {
      console.error('Google login failed', error);
      setErrorMsg(language === 'ko' ? '구글 로그인에 실패했습니다.' : 'Google login failed.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setErrorMsg(null);
      setIsLoading('apple');
      const provider = new OAuthProvider('apple.com');
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (error) {
      console.error('Apple login failed', error);
      setErrorMsg(language === 'ko' ? 'Apple 로그인에 실패했습니다. (Apple Developer 설정 필요)' : 'Apple login failed. (Apple Developer setup required)');
    } finally {
      setIsLoading(null);
    }
  };

  const handleNaverLogin = async () => {
    // Naver login usually requires a custom OAuth setup or a backend proxy in Firebase.
    setErrorMsg(language === 'ko' ? '네이버 로그인 API 연동이 필요합니다. (커스텀 Provider 설정 필요)' : 'Naver login requires API integration (Custom Provider setup needed).');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-app-bg flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* App Logo / Title */}
        <h1 className="font-logo font-semibold text-[56px] text-blue-500 dark:text-brand-primary tracking-wide mb-4 mt-4 text-center">
          Trippo
        </h1>
        <p className="text-[15px] font-sans text-gray-500 dark:text-text-secondary mb-14 text-center leading-relaxed">
          {language === 'ko' ? (
            <>
              <span className="text-blue-500 dark:text-brand-primary font-semibold">Trippo</span>와 함께 여행을 계획하고 우리들만의 기억을 간직해요.
            </>
          ) : (
            <>
              Plan your trips and keep our memories together with <span className="text-blue-500 dark:text-brand-primary font-semibold">Trippo</span>.
            </>
          )}
        </p>

        <div className="w-full space-y-3.5 px-2">
          {/* Google Login */}
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading !== null}
            className="relative w-full h-[52px] bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-xl font-sans font-medium text-[15px] flex items-center justify-center transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="absolute left-5 flex items-center justify-center">
              {isLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
            </div>
            <span>{language === 'ko' ? 'Google로 시작하기' : 'Continue with Google'}</span>
          </button>

          {/* Naver Login */}
          <button 
            onClick={handleNaverLogin}
            disabled={isLoading !== null}
            className="relative w-full h-[52px] bg-[#03C75A] hover:bg-[#02b350] text-white rounded-xl font-sans font-medium text-[15px] flex items-center justify-center transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="absolute left-5 flex items-center justify-center">
              {isLoading === 'naver' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.273 12.845L7.376 0H0V24H7.726V11.156L16.624 24H24V0H16.273V12.845Z"/>
                </svg>
              )}
            </div>
            <span>{language === 'ko' ? '네이버로 시작하기' : 'Continue with Naver'}</span>
          </button>

          {/* Apple Login */}
          <button 
            onClick={handleAppleLogin}
            disabled={isLoading !== null}
            className="relative w-full h-[52px] bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 rounded-xl font-sans font-medium text-[15px] flex items-center justify-center transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="absolute left-5 flex items-center justify-center">
              {isLoading === 'apple' ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-white dark:border-t-black rounded-full animate-spin"></div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
              )}
            </div>
            <span>{language === 'ko' ? 'Apple로 시작하기' : 'Continue with Apple'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-6 text-sm text-red-500 font-sans text-center bg-red-50 dark:bg-red-950/30 py-2.5 px-4 rounded-xl border border-red-100 dark:border-red-900/50 w-full max-w-sm">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
