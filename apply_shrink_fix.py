with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

# Fix the main wrapper for Main Companions & Friends View
content = content.replace(
    '/* Main Companions & Friends View */\n                  <div className="space-y-5">',
    '/* Main Companions & Friends View */\n                  <div className="space-y-5 flex flex-col">'
)

content = content.replace(
    '{/* 1. Real-Time Invite Section */}\n                    <div className="space-y-3 p-4 bg-white dark:bg-[#15141f] border border-gray-200 dark:border-subtle-border rounded-2xl shadow-sm">',
    '{/* 1. Real-Time Invite Section */}\n                    <div className="shrink-0 space-y-3 p-4 bg-white dark:bg-[#15141f] border border-gray-200 dark:border-subtle-border rounded-2xl shadow-sm">'
)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
