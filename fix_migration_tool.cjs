const fs = require('fs');
let code = fs.readFileSync('src/scripts/migrationTool.ts', 'utf-8');
code = code.replace(
  'const db = getFirestore();',
  'const db = getFirestore(undefined, "ai-studio-trippo-ff4554d0-30e6-46ce-9ce9-47e9504b809c");'
);
fs.writeFileSync('src/scripts/migrationTool.ts', code, 'utf-8');
