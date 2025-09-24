import { test, expect } from 'bun:test';
import { performChecks } from '../performer';

test('returns healthy when no checks provided', async () => {
  const result = await performChecks([], 1000);
  expect(result.healthy).toBe(true);
  expect(result.uptime).toBeGreaterThan(0);
});

test('returns healthy when all checks pass', async () => {
  const checks = [() => ({ name: 'test1', healthy: true }), () => ({ name: 'test2', healthy: true })];

  const result = await performChecks(checks, 1000);
  expect(result.healthy).toBe(true);
  expect(result.checks).toEqual({
    test1: { healthy: true },
    test2: { healthy: true },
  });
});

test('returns unhealthy when any check fails', async () => {
  const checks = [() => ({ name: 'test1', healthy: true }), () => ({ name: 'test2', healthy: false })];

  const result = await performChecks(checks, 1000);
  expect(result.healthy).toBe(false);
});

test('times out slow checks', async () => {
  const checks = [
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { name: 'slow-check', healthy: true };
    },
  ];

  const result = await performChecks(checks, 100);
  expect(result.healthy).toBe(false);
});
