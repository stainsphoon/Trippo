const fs = require('fs');
let code = fs.readFileSync('src/services/reportEngine.ts', 'utf8');

code = code.replace(
  'export async function generateAIReportWithGemini(bundle: AnalysisEvidenceBundle, aiClient: any): Promise<TravelSuitabilityReport> {',
  `export async function generateAIReportWithGemini(bundle: AnalysisEvidenceBundle, aiClient: any, telemetry?: { onAbort?: () => void; onTimeout?: () => void; onLateResponse?: () => void; }): Promise<TravelSuitabilityReport> {`
);

const newGeminiCall = `    const controller = new AbortController();
    let isTimeout = false;
    let isAborted = false;
    let isResolved = false;

    const timeoutId = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, 2000);

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        abortSignal: controller.signal,
        httpOptions: { timeout: 2000 }
      }
    }).catch((err: any) => {
      isResolved = true;
      clearTimeout(timeoutId);
      if (isTimeout) {
        if (telemetry?.onTimeout) telemetry.onTimeout();
      } else if (err.name === 'AbortError') {
        isAborted = true;
        if (telemetry?.onAbort) telemetry.onAbort();
      } else {
        throw err;
      }
      return null;
    });

    if (!isResolved) {
      isResolved = true;
      clearTimeout(timeoutId);
    }

    if (!response) {
      // Simulate late response tracking if we had a non-blocking promise
      // However, fetch throws on abort.
      return fallbackReport;
    }
`;

code = code.replace(
  /    const controller = new AbortController\(\);[\s\S]*?clearTimeout\(timeoutId\);/,
  newGeminiCall
);

fs.writeFileSync('src/services/reportEngine.ts', code);
