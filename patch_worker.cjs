const fs = require('fs');
let code = fs.readFileSync('src/services/destinationLifecycleWorker.ts', 'utf-8');
code = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/services/destinationLifecycleWorker.ts', code, 'utf-8');
