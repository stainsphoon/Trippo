const fs = require('fs');
let code = fs.readFileSync('src/services/reportEngine.ts', 'utf8');

const replacement = `      response = await Promise.race([geminiPromise, timeoutPromise]);
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        // Handled by timeoutPromise
      } else if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort')) {
        isAborted = true;
        if (telemetry?.onAbort) telemetry.onAbort();
      } else if (err.message?.toLowerCase().includes('timeout') || err.name === 'TimeoutError') {
        if (!isTimeout) {
          isTimeout = true;
          if (telemetry?.onTimeout) telemetry.onTimeout();
        }
      } else {
        console.warn('[Report Engine] AI SDK error:', err.message);
      }
      return fallbackReport;
    } finally {
      isResolved = true;
    }`;

code = code.replace(
  /      response = await Promise.race\(\[geminiPromise, timeoutPromise\]\);[\s\S]*?isResolved = true;\n    \}/,
  replacement
);

fs.writeFileSync('src/services/reportEngine.ts', code);
