const fs = require('fs');
let code = fs.readFileSync('src/services/destinationSearchService.ts', 'utf-8');

code = code.replace(
  `    lifecycleStatus: 'provisional',`,
  `    lifecycleStatus: 'provisional',
    enrichment: {
      status: 'pending',
      attempts: 0,
      lastAttemptAt: null,
      nextRetryAt: null,
      completedAt: null,
      errors: []
    },`
);

fs.writeFileSync('src/services/destinationSearchService.ts', code, 'utf-8');
