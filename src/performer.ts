import type { HealthCheckResult, CheckFunction, CheckFunctionResult } from './types';

/** Helper to run a single check function with timeout protection */
async function runCheck(fn: CheckFunction, timeoutMs: number) {
  return Promise.race([
    fn(),
    new Promise<CheckFunctionResult>((resolve) =>
      setTimeout(() => resolve({ name: 'unknown', healthy: false, details: { reason: 'timeout' } }), timeoutMs),
    ),
  ]);
}

/** Executes all check functions and returns aggregated health status */
export async function performChecks(checks: CheckFunction[] = [], timeoutMs: number): Promise<HealthCheckResult> {
  const results = await Promise.all(checks.map((fn) => runCheck(fn, timeoutMs)));
  const healthy = results.length ? results.every((r) => r.healthy) : true;

  return {
    healthy,
    uptime: process.uptime(),
    checks: Object.fromEntries(results.map((r) => [r.name, { healthy: r.healthy, details: r.details }])),
  };
}
