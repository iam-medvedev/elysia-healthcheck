import { test, expect } from 'bun:test';
import { getHealthStatus } from '../status';

test('returns 200 for healthy status', () => {
  expect(getHealthStatus(true)).toBe(200);
});

test('returns 503 for unhealthy status', () => {
  expect(getHealthStatus(false)).toBe(503);
});