import { t, type Static } from 'elysia';
import type { Defaults } from './defaults';

/** Schema for health check response structure */
export const HealthCheckResultSchema = t.Object({
  healthy: t.Boolean(),
  uptime: t.Optional(t.Number()),
  checks: t.Optional(
    t.Record(
      t.String(),
      t.Object({
        healthy: t.Boolean(),
        details: t.Optional(t.Record(t.String(), t.Any())),
      }),
    ),
  ),
});

/** Health check response structure */
export type HealthCheckResult = Static<typeof HealthCheckResultSchema>;

/** Result returned by individual check functions */
export type CheckFunctionResult = { name: string; healthy: boolean; details?: any };

/** Function that performs a health check */
export type CheckFunction = () => CheckFunctionResult | Promise<CheckFunctionResult>;

/** Configuration options for the healthcheck plugin */
export type HealthcheckPluginOptions<
  Prefix extends string = Defaults['prefix'],
  Liveness extends string = Defaults['liveness'],
  Readiness extends string = Defaults['readiness'],
> = {
  /** Base path prefix for health endpoints */
  prefix?: Prefix;
  /** Custom endpoint paths */
  paths?: {
    /** Liveness check endpoint path */
    liveness?: Liveness;
    /** Readiness check endpoint path */
    readiness?: Readiness;
  };
  /** Health check functions */
  checks?: {
    /** Functions to run for liveness checks */
    liveness?: CheckFunction[];
    /** Functions to run for readiness checks */
    readiness?: CheckFunction[];
  };
  /** Timeout in milliseconds for check functions */
  timeoutMs?: number;
};
