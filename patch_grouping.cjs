const fs = require('fs');
let code = fs.readFileSync('src/utils/destinationGrouping.ts', 'utf-8');
code = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/utils/destinationGrouping.ts', code, 'utf-8');
