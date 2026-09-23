const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// The route I added is the FIRST one (lines around 10 to 178).
// The OLD route is at line 180.
// Let's find exactly the second app.post('/app-api/destinations/resolve' and delete it until 'app.get('/app-api/destinations/seed''
const idx1 = code.indexOf("app.post('/app-api/destinations/resolve'");
const idx2 = code.indexOf("app.post('/app-api/destinations/resolve'", idx1 + 1);

if (idx2 !== -1) {
  const endIdx = code.indexOf("app.get('/app-api/destinations/seed'", idx2);
  if (endIdx !== -1) {
    code = code.substring(0, idx2) + code.substring(endIdx);
  }
}

// I should also ensure that the FIRST route has the `import` statements at the top, not inside it? Wait, I added import crypto from "crypto";
// Wait, I replaced `import crypto from "crypto";` globally, which might be at the top of the file!
fs.writeFileSync('server.ts', code, 'utf-8');
