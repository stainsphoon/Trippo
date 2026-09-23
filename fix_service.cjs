const fs = require('fs');
let code = fs.readFileSync('src/services/destinationSearchService.ts', 'utf-8');

code = code.replace(
  'calculateDestinationSearchRank,',
  'calculateDestinationSearchRankDetails,\n  calculateDestinationSearchRank,'
);

code = code.replace(
  'const results: { dest: Destination; rank: number }[] = [];',
  'const results: { dest: Destination; rank: number; matchCategory?: "strong" | "contextual" }[] = [];'
);

code = code.replace(
  'const rank = calculateDestinationSearchRank(dest, query, language);',
  'const { rank, matchCategory } = calculateDestinationSearchRankDetails(dest, query, language);'
);

code = code.replace(
  'results.push({ dest, rank });',
  'results.push({ dest, rank, matchCategory });'
);

code = code.replace(
  'return topItems.map(({ dest }) => mapDestinationToSearchItem(dest, language));',
  'return topItems.map(({ dest, matchCategory }) => {\n    const item = mapDestinationToSearchItem(dest, language);\n    item.matchCategory = matchCategory;\n    return item;\n  });'
);

fs.writeFileSync('src/services/destinationSearchService.ts', code, 'utf-8');
