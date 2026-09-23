const fs = require('fs');
let code = fs.readFileSync('src/services/reportEngine.ts', 'utf8');
code = code.replace(
  '    const response: any = await aiClient.models.generateContent({',
  '    const response = await aiClient.models.generateContent({'
);
fs.writeFileSync('src/services/reportEngine.ts', code);
console.log("PATCHED src/services/reportEngine.ts");
