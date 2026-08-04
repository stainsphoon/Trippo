import re

with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

# Fix copy button
target_copy = """className="shrink-0 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Copy size={13} />
                              <span>{language === 'ko' ? '링크 복사' : 'Copy Link'}</span>"""
repl_copy = """className="shrink-0 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Copy size={13} />
                              <span>{language === 'ko' ? '링크 복사' : 'Copy Link'}</span>"""
content = content.replace(target_copy, repl_copy)

# Fix span text labels in the 4-col grid
target_span = """<span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary">"""
repl_span = """<span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary truncate w-full text-center">"""
content = content.replace(target_span, repl_span)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
