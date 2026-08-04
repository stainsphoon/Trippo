with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

target = 'className="shrink-0 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"'
repl = 'className="shrink-0 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"'
content = content.replace(target, repl)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
