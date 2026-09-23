const fs = require('fs');
let code = fs.readFileSync('src/services/reportEngine.ts', 'utf8');

code = code.replace(
  'const controller = new AbortController();',
  'const GEMINI_TIMEOUT_MS = 2000;\n    const controller = new AbortController();'
);

code = code.replace(/timeout: 2000/g, 'timeout: GEMINI_TIMEOUT_MS');

fs.writeFileSync('src/services/reportEngine.ts', code);
