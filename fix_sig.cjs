const fs = require('fs');
let code = fs.readFileSync('src/services/reportEngine.ts', 'utf8');

code = code.replace(
  'export async function generateAIReportWithGemini(\n  bundle: AnalysisEvidenceBundle,\n  aiClient: any\n): Promise<TravelSuitabilityReport> {',
  'export async function generateAIReportWithGemini(\n  bundle: AnalysisEvidenceBundle,\n  aiClient: any,\n  telemetry?: { onAbort?: () => void; onTimeout?: () => void; onLateResponse?: () => void; }\n): Promise<TravelSuitabilityReport> {'
);

fs.writeFileSync('src/services/reportEngine.ts', code);
