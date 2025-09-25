/** Default configuration values for healthcheck plugin */
export const defaults = {
  /** Default base path for health endpoints */
  prefix: '/healthz',
  /** Default liveness check endpoint path */
  liveness: '/live',
  /** Default readiness check endpoint path */
  readiness: '/ready',
  /** Default timeout for check functions in milliseconds */
  timeoutMs: 5000,
} as const;

/** Type representing the default configuration structure */
export type Defaults = typeof defaults;
