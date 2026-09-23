const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  `import { enqueueDestinationEnrichment } from "./src/services/destinationLifecycleWorker.js";`,
  `import { enqueueDestinationEnrichment, processQueue } from "./src/services/destinationLifecycleWorker.js";`
);

const startServerOld = `  try {
    ensureFirebaseAdmin();
    console.log("Firebase Admin successfully initialized at server startup.");
  } catch (err: any) {
    console.error("Warning: Firebase Admin failed to initialize during server startup:", err.message);
  }`;

const startServerNew = `  try {
    ensureFirebaseAdmin();
    console.log("Firebase Admin successfully initialized at server startup.");
  } catch (err: any) {
    console.error("Warning: Firebase Admin failed to initialize during server startup:", err.message);
  }

  // Periodic lifecycle worker check
  setInterval(() => {
    if (webDb) {
      processQueue(webDb).catch(err => console.error('[WORKER_ERROR]', err));
    }
  }, 60000);
`;

code = code.replace(startServerOld, startServerNew);
fs.writeFileSync('server.ts', code, 'utf-8');
