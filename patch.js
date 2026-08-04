const fs = require('fs');
const file = 'src/components/PlanTab.tsx';
let code = fs.readFileSync(file, 'utf8');

// Undo the messed up handleCopySelected patch and redo it correctly
const faultyStr = `      let updatedDays = currentPlan.days.map((day) =>  const handleCopySelected = () => {`;

if (code.includes(faultyStr)) {
  console.log("Found faulty string, reverting...");
  // I need to be careful with the exact patch, I will just checkout the file and re-apply all my edits or carefully fix it with a script.
}
