const fs = require('fs');
let code = fs.readFileSync('src/services/destinationSearchService.ts', 'utf-8');

code = code.replace(
  `    status: 'provisional',
    lifecycleStatus: 'provisional',
    enrichment: {`,
  `    status: 'provisional',
    // lifecycleStatus is already defined earlier via variable shorthand, but we overwrite it
    enrichment: {`
);

fs.writeFileSync('src/services/destinationSearchService.ts', code, 'utf-8');
