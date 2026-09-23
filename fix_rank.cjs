const fs = require('fs');

// 1. Update normalization
let norm = fs.readFileSync('src/utils/destinationSearchNormalization.ts', 'utf-8');
norm = norm.replace(
  'export function calculateDestinationSearchRank(',
  'export function calculateDestinationSearchRankDetails('
);
norm = norm.replace(
  'return Math.round(score * 10) / 10;',
  `const rank = Math.round(score * 10) / 10;
  const matchCategory = ['primary_exact', 'exact', 'primary_prefix', 'alias_prefix'].includes(matchType) ? 'strong' : (matchType === 'hierarchy_match' ? 'contextual' : 'strong'); // Wait, substring? Let's say substring is strong for now? The requirements say:
  // Strong Match: primary_exact, exact, primary_prefix, alias_prefix, (and substring?)
  // Contextual Match: hierarchy_match
  return { rank, matchCategory: matchType === 'hierarchy_match' ? 'contextual' : 'strong', matchType };`
);
norm = norm.replace(
  'return 0;',
  'return { rank: 0, matchCategory: "none", matchType: "none" };'
);
norm += `\nexport function calculateDestinationSearchRank(dest: any, query: string, lang: 'ko' | 'en' = 'ko'): number { return calculateDestinationSearchRankDetails(dest, query, lang).rank; }\n`;
fs.writeFileSync('src/utils/destinationSearchNormalization.ts', norm, 'utf-8');
