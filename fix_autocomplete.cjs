const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  `const minExternalLength = isCjk ? 1 : 3;`,
  `const minExternalLength = isCjk ? 2 : 3;
      const isExplicitSearch = req.query.explicit === 'true';
      const isImeComposing = req.query.isImeComposing === 'true';`
);

code = code.replace(
  `const externalEligibility = q.length >= minExternalLength && strongInternalResults.length < threshold;`,
  `const externalEligibility = (!isImeComposing) && (isExplicitSearch || (q.length >= minExternalLength && strongInternalResults.length < threshold));`
);

fs.writeFileSync('server.ts', code, 'utf-8');
