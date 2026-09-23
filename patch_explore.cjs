const fs = require('fs');
let code = fs.readFileSync('src/components/ExploreTab.tsx', 'utf8');
code = code.replace(
  "      if (err.name === 'AbortError' || rawMsg.toLowerCase().includes('abort') || rawMsg.toLowerCase().includes('timeout') || rawMsg.toLowerCase().includes('cancel')) return;",
  "      if (err.name === 'AbortError') return;"
);
fs.writeFileSync('src/components/ExploreTab.tsx', code);
console.log("PATCHED ExploreTab.tsx");
