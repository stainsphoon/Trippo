const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  `import crypto from "crypto";`,
  `import crypto from "crypto";\nimport { enqueueDestinationEnrichment } from "./src/services/destinationLifecycleWorker.js";`
);

code = code.replace(
  `console.log(\`[RESOLVE_TRANSACTION_SUCCESS] Atomic merge & mapping completed for: \${finalizedDestination.id}\`);`,
  `console.log(\`[RESOLVE_TRANSACTION_SUCCESS] Atomic merge & mapping completed for: \${finalizedDestination.id}\`);
        enqueueDestinationEnrichment(webDb, finalizedDestination.id);`
);

// We should also replace the old fallback logic since there were 2 `upsertRuntimeDestination(finalizedDestination)`
code = code.replace(
  `upsertRuntimeDestination(finalizedDestination);
          console.log(\`[RESOLVE_TRANSACTION_SUCCESS] Atomic merge completed for: \${finalizedDestination.id}\`);
        }`,
  `// old fallback replaced
        }`
);

fs.writeFileSync('server.ts', code, 'utf-8');
