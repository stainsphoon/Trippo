import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Play, ShieldCheck, RefreshCw } from 'lucide-react';
import { runAllAccommodationTests, TestResult } from '../utils/accommodationTests';
import { Language } from '../utils/translations';

interface AccommodationTestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export default function AccommodationTestRunnerModal({
  isOpen,
  onClose,
  language = 'ko'
}: AccommodationTestRunnerModalProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllAccommodationTests();
      setResults(res);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1c1b26] rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-[#161521]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                {language === 'ko' ? '숙박 일정 기능 통합 검증 테스트 (Test 1~15)' : 'Accommodation Feature Integration Tests (1~15)'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {language === 'ko' ? `총 ${totalCount}개 테스트 중 ${passedCount}개 통과` : `${passedCount} of ${totalCount} tests passed`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Results List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {isRunning ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">{language === 'ko' ? '테스트 실행 중...' : 'Running test suite...'}</span>
            </div>
          ) : (
            results.map((res) => (
              <div
                key={res.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  res.passed
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                    : 'bg-red-50/40 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {res.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                        {language === 'ko' ? res.nameKo : res.nameEn}
                      </h4>
                      <p className="text-[11px] text-gray-600 dark:text-zinc-300 mt-1">
                        {res.message}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    res.passed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                  }`}>
                    {res.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-[#161521]/60 flex items-center justify-between">
          <button
            onClick={executeTests}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {language === 'ko' ? '테스트 다시 실행' : 'Re-run Tests'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl"
          >
            {language === 'ko' ? '닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
