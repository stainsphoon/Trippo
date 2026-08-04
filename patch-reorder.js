const fs = require('fs');
const file = 'src/components/PlanTab.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `  const handleReorderItems = (reorderedItems: PlanItem[]) => {`;
const replaceStr = `  const handleReorderItems = (reorderedItems: PlanItem[]) => {
    // Prevent Framer Motion bogus onReorder from reverting external additions/deletions
    if (!isEditMode) return;
    if (reorderedItems.length !== displayItems.length) return;
`;

if (code.includes(targetStr) && !code.includes('bogus onReorder')) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync(file, code);
  console.log("Patched PlanTab.tsx");
} else {
  console.log("Could not patch or already patched");
}
