const fs = require('fs');
let code = fs.readFileSync('src/components/GooglePlaceInput.tsx', 'utf-8');

const replacement = `
          {/* Results State */}
          {(searchState === 'results' || searchState === 'internal_results') && (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-800/60">
              <div className="divide-y divide-gray-100 dark:divide-zinc-800/60 overflow-y-auto max-h-64 custom-scrollbar">
                {items.filter(i => i.matchCategory !== 'contextual').map((item, index) => (
                  <button
                    key={'strong-' + (item.destinationId || item.externalId || index)}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={\`w-full text-left p-3 transition-all flex items-start gap-3 cursor-pointer group \${
                      index === activeIndex ? 'bg-indigo-50/60 dark:bg-indigo-500/10' : 'hover:bg-gray-50/80 dark:hover:bg-zinc-800/40'
                    }\`}
                  >
                    <div className={\`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 \${
                      item.type === 'country' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      item.type === 'province' || item.type === 'state' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                    }\`}>
                      <MapPin size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[28px]">
                      <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
                        {item.displayName}
                        {item.source === 'external' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400 font-medium">New</span>
                        )}
                        {item.source === 'internal' && item.type === 'country' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 font-medium">Country</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {item.secondaryText}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {items.filter(i => i.matchCategory === 'contextual').length > 0 && (
                <div className="pt-2 pb-1 bg-gray-50/50 dark:bg-zinc-900/50">
                  <div className="px-3 pb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    <span>{isKo ? '관련 지역' : 'Related Places'}</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                    {items.filter(i => i.matchCategory === 'contextual').slice(0, 3).map((item, index) => (
                      <button
                        key={'ctx-' + (item.destinationId || item.externalId || index)}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className="w-full text-left p-3 hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 flex items-start gap-3 cursor-pointer group"
                      >
                        <div className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400">
                          <MapPin size={14} className="stroke-[2.5]" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[28px]">
                          <div className="text-[13px] font-medium text-gray-700 dark:text-gray-300 truncate">
                            {item.displayName}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {item.secondaryText}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
`;

const original = `
          {/* Results State */}
          {(searchState === 'results' || searchState === 'internal_results') && (
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-800/60">
              <div className="divide-y divide-gray-100 dark:divide-zinc-800/60 overflow-y-auto max-h-64 custom-scrollbar">
                {items.map((item, index) => (
                  <button
                    key={\`\${item.destinationId || item.externalId || index}\`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={\`w-full text-left p-3 transition-all flex items-start gap-3 cursor-pointer group \${
                      index === activeIndex ? 'bg-indigo-50/60 dark:bg-indigo-500/10' : 'hover:bg-gray-50/80 dark:hover:bg-zinc-800/40'
                    }\`}
                  >
                    <div className={\`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 \${
                      item.type === 'country' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      item.type === 'province' || item.type === 'state' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                    }\`}>
                      <MapPin size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[28px]">
                      <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
                        {item.displayName}
                        {item.source === 'external' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400 font-medium">New</span>
                        )}
                        {item.source === 'internal' && item.type === 'country' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 font-medium">Country</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {item.secondaryText}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
`;

code = code.replace(original.trim(), replacement.trim());
fs.writeFileSync('src/components/GooglePlaceInput.tsx', code, 'utf-8');
