import re

with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

# I want to find the exact point where it broke:
# <label className="font-sans font-extrabold text-xs text-gray-400 dark:text-stone-500 uppercase tracking-wider block">
#   {language === 'ko' ? '일행 이름' : 'Companion Name'}
# </label>
# <input
#   type="text"
# {!sharedPlanId ? (

target = """                      <label className="font-sans font-extrabold text-xs text-gray-400 dark:text-stone-500 uppercase tracking-wider block">
                        {language === 'ko' ? '일행 이름' : 'Companion Name'}
                      </label>
                      <input
                        type="text"
                      {!sharedPlanId ? ("""

replacement = """                      <label className="font-sans font-extrabold text-xs text-gray-400 dark:text-stone-500 uppercase tracking-wider block">
                        {language === 'ko' ? '일행 이름' : 'Companion Name'}
                      </label>
                      <input
                        type="text"
                        value={localCompanionName}
                        onChange={(e) => setLocalCompanionName(e.target.value)}
                        placeholder={language === 'ko' ? '예: 길동이, 엄빠' : 'e.g. Mom, Buddy'}
                        className="w-full bg-white dark:bg-[#15141f] border border-gray-200 dark:border-subtle-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-text-primary"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddLocalCompanion();
                        }}
                      />
                    </div>

                    <button
                      onClick={handleAddLocalCompanion}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm py-3.5 rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      {language === 'ko' ? '일행 추가하기' : 'Create and Add'}
                    </button>
                  </div>
                ) : (
                  /* Main Companions & Friends View */
                  <div className="space-y-5">
                    
                    {/* 1. Real-Time Invite Section */}
                    <div className="space-y-3 p-4 bg-white dark:bg-[#15141f] border border-gray-200 dark:border-subtle-border rounded-2xl shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <Share2 size={16} className="text-blue-500" />
                        <span className="font-sans font-extrabold text-xs text-gray-800 dark:text-text-primary uppercase tracking-wider block">
                          {language === 'ko' ? '일행 초대 링크' : 'Invite Link'}
                        </span>
                      </div>

                      {!sharedPlanId ? ("""

if target in content:
    content = content.replace(target, replacement)
    print("Fixed target!")
else:
    print("Target not found!")
    
with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
