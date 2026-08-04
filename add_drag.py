import re
with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

target = """            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[101] flex flex-col bg-gray-50 dark:bg-app-bg rounded-t-3xl h-[85vh] md:max-w-md md:mx-auto shadow-2xl overscroll-none"
            >
              {/* Drag Handle Area */}"""

replacement = """            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[101] flex flex-col bg-gray-50 dark:bg-app-bg rounded-t-3xl h-[85vh] md:max-w-md md:mx-auto shadow-2xl overscroll-none"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  if (isCreatingLocalCompanion) {
                    setIsCreatingLocalCompanion(false);
                  } else {
                    setIsCompanionSheetOpen(false);
                    setCompanionSearchTerm('');
                    setCompanionSearchResults([]);
                  }
                }
              }}
            >
              {/* Drag Handle Area */}"""

content = content.replace(target, replacement)
with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
print("Done drag addition")
