export const measureLatency = async <T,>(metricName: string, targetP50: number, targetP95: number, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    console.log(`[TELEMETRY] ${metricName} | Latency: ${(end - start).toFixed(2)}ms | Target p50: ${targetP50}ms, p95: ${targetP95}ms`);
    return result;
  } catch (err) {
    const end = performance.now();
    console.log(`[TELEMETRY] ${metricName} | FAILED | Latency: ${(end - start).toFixed(2)}ms`);
    throw err;
  }
};
