const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  `import { isDuplicateDestination, calculateDestinationSearchRank, normalizeSearchText } from "./src/utils/destinationSearchNormalization";`,
  `import { isDuplicateDestination, calculateDestinationSearchRank, normalizeSearchText } from "./src/utils/destinationSearchNormalization";
import { groupAndDeduplicateDestinations } from "./src/utils/destinationGrouping.js";`
);

code = code.replace(
  `const combined = [...internalItems, ...externalItems].slice(0, limit);`,
  `let combined = [...internalItems, ...externalItems];
      combined = groupAndDeduplicateDestinations(combined, q).slice(0, limit);`
);

fs.writeFileSync('server.ts', code, 'utf-8');
