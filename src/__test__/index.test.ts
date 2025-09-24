import { treaty } from '@elysiajs/eden';
import { describe, test, expect } from 'bun:test';
import { Elysia } from 'elysia';
import { healthcheckPlugin } from '..';
import { type CheckFunction } from '../types';
import { defaults } from '../defaults';

type NormalizedPath<T extends string> = T extends `${infer _}${infer Rest}` ? Rest : T;
function normalizePath<T extends string>(path: T) {
  return path.slice(1) as NormalizedPath<T>;
}

describe('default endpoints', async () => {
  const app = new Elysia().use(healthcheckPlugin());
  const client = treaty(app);

  test('main endpoint', async () => {
    const result = await client[normalizePath(defaults.prefix)].get();
    expect(result.status).toBe(200);
  });

  test.each([normalizePath(defaults.liveness), normalizePath(defaults.readiness)] as const)(
    '%s endpoint',
    async (path) => {
      const result = await client[normalizePath(defaults.prefix)][path].get();
      expect(result.status).toBe(200);
    },
  );
});

describe('custom endpoints', async () => {
  const prefix = '/healthcheck' as const;
  const liveness = '/liveness' as const;
  const readiness = '/readiness' as const;

  const app = new Elysia().use(
    healthcheckPlugin({
      prefix,
      paths: {
        liveness,
        readiness,
      },
    }),
  );
  const client = treaty(app);

  test('main endpoint', async () => {
    const result = await client[normalizePath(prefix)].get();
    expect(result.status).toBe(200);
  });

  test.each([normalizePath(liveness), normalizePath(readiness)] as const)('%s endpoint', async (path) => {
    const result = await client[normalizePath(prefix)][path].get();
    expect(result.status).toBe(200);
  });
});

describe('checks', async () => {
  const liveness = '/liveness' as const;
  const readiness = '/readiness' as const;

  describe.each([normalizePath(liveness), normalizePath(readiness)] as const)('%s endpoint', async (path) => {
    test('successfull check', async () => {
      const checkResult = { name: 'some-check', healthy: true, details: { some: true } } as const;
      const checkFn: CheckFunction = () => {
        return checkResult;
      };

      const app = new Elysia().use(
        healthcheckPlugin({
          paths: {
            liveness,
            readiness,
          },
          checks: {
            [path]: [checkFn],
          },
        }),
      );

      const client = treaty(app);
      const result = await client[normalizePath(defaults.prefix)][path].get();
      expect(result.status).toBe(200);
      expect(result.data?.healthy).toBe(true);
      expect(result.data?.checks).toMatchObject({
        [checkResult.name]: {
          healthy: checkResult.healthy,
          details: checkResult.details,
        },
      });
    });

    test('unsuccessfull check', async () => {
      const checkResult = { name: 'some-check', healthy: false, details: { some: true } } as const;
      const checkFn: CheckFunction = () => {
        return checkResult;
      };

      const app = new Elysia().use(
        healthcheckPlugin({
          paths: {
            liveness,
            readiness,
          },
          checks: {
            [path]: [checkFn],
          },
        }),
      );

      const client = treaty(app);
      const result = await client[normalizePath(defaults.prefix)][path].get();
      if (result.error?.status !== 503) {
        throw new Error('Something went wrong');
      }

      expect(result.status).toBe(503);
      expect(result.error.value?.healthy).toBe(false);
      expect(result.error.value?.checks).toMatchObject({
        [checkResult.name]: {
          healthy: checkResult.healthy,
          details: checkResult.details,
        },
      });
    });
  });
});
