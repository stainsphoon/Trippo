const fs = require('fs');
let code = fs.readFileSync('src/services/reportEngine.ts', 'utf8');

code = code.replace(
  'abortSignal: controller.signal',
  'abortSignal: controller.signal,\n          httpOptions: { timeout: 2000 }'
);

fs.writeFileSync('src/services/reportEngine.ts', code);
