import re

with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

# Make the buttons min-w-0 to allow truncating
content = content.replace(
    'className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-stone-900/40 hover:bg-slate-100 dark:hover:bg-stone-800/50 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-stone-800"',
    'className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-stone-900/40 hover:bg-slate-100 dark:hover:bg-stone-800/50 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-stone-800 min-w-0"'
)
content = content.replace(
    'className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-red-950/20 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-stone-800"',
    'className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-red-950/20 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-stone-800 min-w-0"'
)

# Apply truncate to the spans
content = content.replace(
    '<span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary">',
    '<span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary truncate w-full text-center">'
)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
