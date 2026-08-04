const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/PlanTab.tsx');
let code = fs.readFileSync(file, 'utf8');

const errorIndex = 104029;
const snippet = code.substring(errorIndex - 200, errorIndex + 100);

// We found earlier:
// Mismatch at index 104029: Expected motion, got AnimatePresence
// Context:
//                        )}
//                        </AnimatePresence>
//                      </div>
// Let's print out around line 2548

const lines = code.split('\n');
console.log(lines.slice(2540, 2555).join('\n'));

