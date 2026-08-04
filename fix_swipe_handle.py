import re
with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

# Fix Backdrop
backdrop_target = """            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCompanionSheetOpen(false);
                setIsCreatingLocalCompanion(false);
                setCompanionSearchTerm('');
                setCompanionSearchResults([]);
              }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overscroll-none"
            />"""

backdrop_replacement = """            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (isCreatingLocalCompanion) {
                  setIsCreatingLocalCompanion(false);
                } else {
                  setIsCompanionSheetOpen(false);
                  setCompanionSearchTerm('');
                  setCompanionSearchResults([]);
                }
              }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overscroll-none"
            />"""

content = content.replace(backdrop_target, backdrop_replacement)

# Fix Drag Handle
handle_target = """              {/* Drag Handle Area */}
              <div 
                className="w-full flex justify-center pt-4 pb-2 cursor-pointer active:opacity-70"
                onClick={() => {
                  setIsCompanionSheetOpen(false);
                  setIsCreatingLocalCompanion(false);
                  setCompanionSearchTerm('');
                  setCompanionSearchResults([]);
                }}
              >"""

handle_replacement = """              {/* Drag Handle Area */}
              <div 
                className="w-full flex justify-center pt-4 pb-2 cursor-pointer active:opacity-70"
                onClick={() => {
                  if (isCreatingLocalCompanion) {
                    setIsCreatingLocalCompanion(false);
                  } else {
                    setIsCompanionSheetOpen(false);
                    setCompanionSearchTerm('');
                    setCompanionSearchResults([]);
                  }
                }}
              >"""
content = content.replace(handle_target, handle_replacement)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)

print("Fixed handle")
