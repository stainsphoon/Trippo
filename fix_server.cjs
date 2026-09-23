const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

// 1. Change minExternalLength = isCjk ? 2 : 3; to isCjk ? 1 : 3;
content = content.replace(
  'const minExternalLength = isCjk ? 2 : 3;',
  'const minExternalLength = isCjk ? 1 : 3;'
);

// 2. Remove the 1 char explicitly block
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('// 1 char: Internal DB only, max 5, NO external API calls'));
let endIdx = -1;
if (startIdx !== -1) {
    for (let i = startIdx; i < lines.length; i++) {
        if (lines[i].includes('// 2+ chars: Search internal DB first')) {
            endIdx = i;
            break;
        }
    }
    
    if (endIdx !== -1) {
        lines.splice(startIdx, endIdx - startIdx);
    }
}
fs.writeFileSync('server.ts', lines.join('\n'), 'utf-8');
console.log('Fixed server.ts');
