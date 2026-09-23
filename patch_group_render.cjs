const fs = require('fs');
let code = fs.readFileSync('src/components/GooglePlaceInput.tsx', 'utf-8');

const groupItemComponent = `
const DestinationGroupItem = ({ group, onSelect, isKo, focusedIndex, indexBase }: any) => {
  const [expanded, setExpanded] = useState(false);
  const rec = group.recommendedItem;
  const alts = group.alternatives || [];
  
  return (
    <div className="border-b border-gray-100 dark:border-zinc-800/60 last:border-0 bg-blue-50/20 dark:bg-blue-900/10">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
           <span className="text-[10px] font-bold text-blue-500 uppercase px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">
             {isKo ? 'Trippo 추천' : 'Trippo Recommended'}
           </span>
        </div>
        <button
          type="button"
          onClick={() => onSelect(rec)}
          className="w-full text-left p-3 bg-white dark:bg-zinc-900 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm transition-all flex items-start gap-3 cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-900/30"
        >
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 shrink-0 mt-0.5">
            {renderTypeIcon(rec.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 dark:text-zinc-100 truncate">
                {rec.label}
              </span>
            </div>
            <p className="text-[11px] font-medium text-gray-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
               {rec.type === 'tourism_region' 
                 ? (isKo ? '섬과 주요 시내를 포함해 분석해요' : 'Analyzes the region including islands and downtown.') 
                 : rec.type === 'island' 
                 ? (isKo ? '섬의 위치와 기후를 중심으로 분석해요.' : 'Analyzes the island location and climate.')
                 : (isKo ? '해당 행정구역과 시내를 중심으로 분석해요.' : 'Analyzes the specific administrative area.')
               }
            </p>
          </div>
        </button>
      </div>

      {alts.length > 0 && (
        <div className="px-3 pb-3">
           <div className="flex items-center gap-2 mb-1.5 px-1 mt-1">
             <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">
               {isKo ? '정확한 범위 선택' : 'Specific Scope'}
             </span>
           </div>
           <div className="space-y-1">
             {alts.map((alt: any, aIdx: number) => (
               <button
                  key={aIdx}
                  type="button"
                  onClick={() => onSelect(alt)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/80 dark:hover:bg-zinc-800/80 flex items-center justify-between cursor-pointer transition-colors"
               >
                 <span className="font-medium text-gray-700 dark:text-zinc-300">
                    {alt.label}
                 </span>
                 <span className="text-[10px] text-gray-400">
                    {renderTypeLabel(alt.type, isKo)}
                 </span>
               </button>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
`;

code = code.replace(
  `import React, { useState, useEffect, useRef, useCallback } from 'react';`,
  `import React, { useState, useEffect, useRef, useCallback } from 'react';\n` + groupItemComponent
);

fs.writeFileSync('src/components/GooglePlaceInput.tsx', code, 'utf-8');
