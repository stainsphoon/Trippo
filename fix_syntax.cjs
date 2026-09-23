const fs = require('fs');
let code = fs.readFileSync('src/services/reportEngine.ts', 'utf8');

code = code.replace(
  '    } finally {\n      isResolved = true;\n    }\n    }',
  '    } finally {\n      isResolved = true;\n    }'
);

fs.writeFileSync('src/services/reportEngine.ts', code);
