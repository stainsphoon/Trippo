const fs = require('fs');
let code = fs.readFileSync('src/components/PlanTab.tsx', 'utf8');

const target1 = `interface RouteCacheEntry {`;
const target2 = `const parseDurationToMinutes =`;

let startIdx = code.indexOf(target1);
let endIdx = code.indexOf(target2);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + code.substring(endIdx);
  fs.writeFileSync('src/components/PlanTab.tsx', code, 'utf8');
  console.log("Success");
} else {
  console.log("Failed to find boundaries");
}
