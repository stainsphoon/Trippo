import re
with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

target = """              onDragEnd={(_, info) => {
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
              {/* Drag Handle Area */}
              <div 
                className="w-full flex justify-center pt-4 pb-2 cursor-pointer active:opacity-70"
                onClick={() => setViewingImages([])}"""

replacement = """              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  setViewingImages([]);
                }
              }}
            >
              {/* Drag Handle Area */}
              <div 
                className="w-full flex justify-center pt-4 pb-2 cursor-pointer active:opacity-70"
                onClick={() => setViewingImages([])}"""

content = content.replace(target, replacement)
with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
