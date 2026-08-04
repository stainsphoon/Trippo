import re

with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

# 1. Add state for photo
state_target = """  const [isCreatingLocalCompanion, setIsCreatingLocalCompanion] = useState(false);
  const [localCompanionName, setLocalCompanionName] = useState('');"""
state_replacement = """  const [isCreatingLocalCompanion, setIsCreatingLocalCompanion] = useState(false);
  const [localCompanionName, setLocalCompanionName] = useState('');
  const [localCompanionPhoto, setLocalCompanionPhoto] = useState<string | null>(null);"""
content = content.replace(state_target, state_replacement)

# 2. Modify handleAddLocalCompanion
handle_target = """    const newCompanion = {
      id: `local-${Date.now()}`,
      name: localCompanionName.trim(),
      isLocal: true
    };
    const updatedCompanions = [...currentCompanions, newCompanion];
    onUpdatePlan({ ...plan, companions: updatedCompanions });
    setLocalCompanionName('');
    setIsCreatingLocalCompanion(false);
  };"""
handle_replacement = """    const newCompanion = {
      id: `local-${Date.now()}`,
      name: localCompanionName.trim(),
      photoURL: localCompanionPhoto || undefined,
      isLocal: true
    };
    const updatedCompanions = [...currentCompanions, newCompanion];
    onUpdatePlan({ ...plan, companions: updatedCompanions });
    setLocalCompanionName('');
    setLocalCompanionPhoto(null);
    setIsCreatingLocalCompanion(false);
  };"""
content = content.replace(handle_target, handle_replacement)

# 3. Change closing logic for modal 
# "아래로 스와이프나 상단에 스와이프 바를 누르면 다시 일행 추가하는 화면 (전 화면)으로 돌아가게 해주고"
# Look for the sheet wrapper closing logic
sheet_close_target = """            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#15141f] rounded-t-3xl max-h-[90vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  setIsCompanionSheetOpen(false);
                  setIsCreatingLocalCompanion(false);
                }
              }}
            >
              {/* Swipe Handle */}
              <div 
                className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
                onClick={() => {
                  setIsCompanionSheetOpen(false);
                  setIsCreatingLocalCompanion(false);
                }}
              >
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-stone-700 rounded-full" />
              </div>"""

sheet_close_replacement = """            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#15141f] rounded-t-3xl max-h-[90vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  if (isCreatingLocalCompanion) {
                    setIsCreatingLocalCompanion(false);
                  } else {
                    setIsCompanionSheetOpen(false);
                  }
                }
              }}
            >
              {/* Swipe Handle */}
              <div 
                className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
                onClick={() => {
                  if (isCreatingLocalCompanion) {
                    setIsCreatingLocalCompanion(false);
                  } else {
                    setIsCompanionSheetOpen(false);
                  }
                }}
              >
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-stone-700 rounded-full" />
              </div>"""
content = content.replace(sheet_close_target, sheet_close_replacement)

# 4. Update the title and remove the "Back to search" button
header_target = """              {/* Sheet Header */}
              <div className="px-6 pb-2 flex items-center justify-between">
                <h3 className="font-sans font-black text-xl text-gray-800 dark:text-text-primary">
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

header_replacement = """              {/* Sheet Header */}
              <div className="px-6 pb-2 flex items-center justify-between">
                <h3 className="font-sans font-black text-xl text-gray-800 dark:text-text-primary">
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
content = content.replace(header_target, header_replacement)

# 5. Update the "Create Local Companion View" body
view_target = """                {isCreatingLocalCompanion ? (
                  /* Create Local Companion View */
                  <div className="space-y-4">
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4">
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        {language === 'ko' 
                          ? '💡 직접 일행 이름을 생성하여 추가할 수 있습니다. 해당 일행은 가입 회원이 아니며 본인 기기에만 로컬 저장됩니다.' 
                          : '💡 You can create a custom companion name directly. This companion is not a registered user and is saved locally only.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="font-sans font-extrabold text-xs text-gray-400 dark:text-stone-500 uppercase tracking-wider block">
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
                ) : ("""

view_replacement = """                {isCreatingLocalCompanion ? (
                  /* Create Local Companion View */
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="w-full text-center">
                      <p className="text-sm text-gray-500 dark:text-text-secondary">
                        {language === 'ko' 
                          ? '직접 일행을 생성합니다.' 
                          : 'I will create a companion directly.'}
                      </p>
                    </div>

                    {/* Profile Photo Editor */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id="local-companion-photo-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setLocalCompanionPhoto(e.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="local-companion-photo-upload"
                        className="cursor-pointer block relative"
                      >
                        {localCompanionPhoto ? (
                          <img 
                            src={localCompanionPhoto} 
                            alt="Profile" 
                            className="w-24 h-24 rounded-full object-cover shadow-sm border-2 border-white dark:border-stone-800"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border-2 border-dashed border-blue-200 dark:border-blue-900/50">
                            <ImageIcon size={32} className="text-blue-300 dark:text-blue-500/50" />
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white dark:border-surface-primary shadow-sm text-white">
                          <Plus size={16} />
                        </div>
                      </label>
                    </div>

                    <div className="space-y-2 w-full">
                      <label className="font-sans font-extrabold text-xs text-gray-400 dark:text-stone-500 uppercase tracking-wider block">
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
                      {language === 'ko' ? '일행 생성하기' : 'Create Companion'}
                    </button>
                  </div>
                ) : ("""
content = content.replace(view_target, view_replacement)


with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
