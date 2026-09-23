const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  `      const relevantInternalResults = internalItems.filter((item) => {
        if (!item.rawDestination) return false;
        return calculateDestinationSearchRank(item.rawDestination, q, language) > 0;
      });`,
  `      const relevantInternalResults = internalItems.filter((item) => {
        if (!item.rawDestination) return false;
        return calculateDestinationSearchRank(item.rawDestination, q, language) > 0;
      });
      const strongInternalResults = internalItems.filter((item) => item.matchCategory === 'strong');`
);

code = code.replace(
  `const externalEligibility = q.length >= minExternalLength && relevantInternalResults.length < threshold;`,
  `const externalEligibility = q.length >= minExternalLength && strongInternalResults.length < threshold;`
);

fs.writeFileSync('server.ts', code, 'utf-8');
