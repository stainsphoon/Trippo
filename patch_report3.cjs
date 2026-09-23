const fs = require('fs');
let code = fs.readFileSync('src/services/reportEngine.ts', 'utf8');

const replacement = `    const controller = new AbortController();
    let isTimeout = false;
    let isAborted = false;
    let isResolved = false;

    let response: any = null;
    try {
      const geminiPromise = aiClient.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          abortSignal: controller.signal,
          httpOptions: { timeout: 2000 }
        }
      }).then((res: any) => {
        if (isTimeout) {
          if (telemetry?.onLateResponse) telemetry.onLateResponse();
        }
        return res;
      }).catch((err: any) => {
        if (!isTimeout) {
           throw err;
        }
        return null;
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          isTimeout = true;
          if (telemetry?.onTimeout) telemetry.onTimeout();
          // We do NOT abort the controller here if we want to track late responses!
          // Wait, user says "abortSignal은 Trippo client/SDK 측 대기를 취소하는 기능으로 취급합니다. 
          // Google service 내부 generation까지 반드시 종료된다고 가정하지 않습니다.
          // Timeout 이후: Trippo response는 Rule-based fallback으로 즉시 전환, 늦은 Gemini response는 무시"
          reject(new Error('TIMEOUT'));
        }, 2000);
      });

      response = await Promise.race([geminiPromise, timeoutPromise]);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('abort')) {
        isAborted = true;
        if (telemetry?.onAbort) telemetry.onAbort();
      }
      return fallbackReport;
    } finally {
      isResolved = true;
    }`;

code = code.replace(
  /    const controller = new AbortController\(\);[\s\S]*?clearTimeout\(timeoutId\);/,
  replacement
);

fs.writeFileSync('src/services/reportEngine.ts', code);
