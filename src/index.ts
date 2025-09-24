import { Elysia } from 'elysia';
import { HealthCheckResultSchema, type HealthcheckPluginOptions } from './types';
import { defaults, type Defaults } from './defaults';
import { getHealthStatus, type KnownStatuses } from './status';
import { performChecks } from './performer';

/** Response schema mapping for health check endpoints */
const response: Record<KnownStatuses, typeof HealthCheckResultSchema> = {
  200: HealthCheckResultSchema,
  503: HealthCheckResultSchema,
};

/**
 * Healthcheck plugin for Elysia.js
 *
 * Adds health check endpoints to your Elysia application with configurable paths and custom checks.
 *
 * @example
 * ```ts
 * import { Elysia } from 'elysia';
 * import { healthcheckPlugin } from 'elysia-healthcheck';
 *
 * const app = new Elysia()
 *   .use(healthcheckPlugin({
 *     checks: {
 *       liveness: [
 *         () => ({ name: 'database', healthy: true })
 *       ]
 *     }
 *   }))
 *   .listen(3000);
 * ```
 */
export function healthcheckPlugin<
  Prefix extends string = Defaults['prefix'],
  Liveness extends string = Defaults['liveness'],
  Readiness extends string = Defaults['readiness'],
>(options: HealthcheckPluginOptions<Prefix, Liveness, Readiness> = {}) {
  const prefix = (options.prefix ?? defaults.prefix) as Prefix;
  const livenessPath = (options.paths?.liveness ?? defaults.liveness) as Liveness;
  const readinessPath = (options.paths?.readiness ?? defaults.readiness) as Readiness;
  const livenessEndpoint = `${prefix}${livenessPath}` as const;
  const readinessEndpoint = `${prefix}${readinessPath}` as const;
  const timeoutMs = options.timeoutMs ?? defaults.timeoutMs;

  return (app: Elysia) =>
    app
      /** Liveness check */
      .get(
        livenessEndpoint,
        async ({ status }) => {
          const result = await performChecks(options.checks?.liveness ?? [], timeoutMs);
          return status(getHealthStatus(result.healthy), result);
        },
        { response },
      )

      /** Readiness check */
      .get(
        readinessEndpoint,
        async ({ status }) => {
          const result = await performChecks(options.checks?.readiness ?? [], timeoutMs);
          return status(getHealthStatus(result.healthy), result);
        },
        { response },
      )

      /** Overall health path */
      .get(
        prefix,
        () => {
          return {
            healthy: true,
            uptime: process.uptime(),
          };
        },
        { response },
      );
}
