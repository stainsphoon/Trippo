const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'const suitabilityReport = await generateAIReportWithGemini(evidenceBundle, ai);',
  `const suitabilityReport = await generateAIReportWithGemini(evidenceBundle, ai, {
        onAbort: () => { firestoreMetrics.geminiClientAbortCount++; },
        onTimeout: () => { firestoreMetrics.geminiTimeoutFallbackCount++; },
        onLateResponse: () => { firestoreMetrics.geminiLateResponseIgnoredCount++; }
      });`
);

fs.writeFileSync('server.ts', code);
