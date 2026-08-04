import re
with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

header_target = """              {/* Header */}
              <div className="px-4 pb-3 border-b border-gray-100 dark:border-subtle-border flex justify-between items-center">
                <h3 className="font-sans font-bold text-base text-gray-800 dark:text-text-primary">
                  {language === 'ko' ? '일행 추가' : 'Add Companions'}
                </h3>
                
                {/* 일행 생성 Button in top right */}
                <button
                  onClick={() => setIsCreatingLocalCompanion(!isCreatingLocalCompanion)}
                  className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-sans text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                >
                  {isCreatingLocalCompanion 
                    ? (language === 'ko' ? '검색으로 돌아가기' : 'Back to Search')
                    : (language === 'ko' ? '일행 생성' : 'Create Companion')}
                </button>
              </div>"""

header_replacement = """              {/* Header */}
              <div className="px-4 pb-3 border-b border-gray-100 dark:border-subtle-border flex justify-between items-center">
                <h3 className="font-sans font-bold text-base text-gray-800 dark:text-text-primary">
                  {isCreatingLocalCompanion 
                    ? (language === 'ko' ? '일행 생성' : 'Create Companion')
                    : (language === 'ko' ? '일행 추가' : 'Add Companions')}
                </h3>
                
                {/* 일행 생성 Button in top right */}
                {!isCreatingLocalCompanion && (
                  <button
                    onClick={() => setIsCreatingLocalCompanion(true)}
                    className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-sans text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                  >
                    {language === 'ko' ? '일행 생성' : 'Create Companion'}
                  </button>
                )}
              </div>"""

if header_target in content:
    content = content.replace(header_target, header_replacement)
    with open('src/components/PlanTab.tsx', 'w') as f:
        f.write(content)
    print("Fixed header")
else:
    print("Could not find header")

