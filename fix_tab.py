import re

with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

# 1. Import MoreHorizontal
content = content.replace("  MoreVertical,\n", "  MoreVertical,\n  MoreHorizontal,\n")

# 2. Delete the description paragraph
description_pattern = r"                        <div className=\"space-y-3\">\n                          <p className=\"text-\[11px\] text-gray-500 dark:text-text-secondary leading-relaxed\">\n                            \{language === 'ko'\n                              \? '이 링크로 들어온 친구는 일정에 자동 참여되고, 자동으로 여러분의 친구 목록에 추가됩니다! 🎁'\n                              : 'Friends joining via this link will automatically join the schedule and be added to your Friend List! 🎁'\}\n                          </p>\n                          \n                          \{/\* Readonly invite URL input with Copy button \*/\}"
replacement = """                        <div className="space-y-3">
                          
                          {/* Readonly invite URL input with Copy button */}"""
content = re.sub(description_pattern, replacement, content, flags=re.DOTALL)

# 3. Change MoreVertical to MoreHorizontal in Native Share block
# We can just look for the Native share block text
native_share_block = """                                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                  <MoreVertical size={16} />
                                </div>
                                <span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary">
                                  {language === 'ko' ? '더보기' : 'More'}
                                </span>"""
native_share_replacement = """                                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                  <MoreHorizontal size={16} />
                                </div>
                                <span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary">
                                  {language === 'ko' ? '더보기' : 'More'}
                                </span>"""
content = content.replace(native_share_block, native_share_replacement)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)

print("Edits complete.")
