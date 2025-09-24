/** Returns appropriate HTTP status code based on health check result */
export function getHealthStatus(healthy: boolean) {
  return healthy ? 200 : 503;
}

/** Type representing possible HTTP status codes returned by health checks */
export type KnownStatuses = ReturnType<typeof getHealthStatus>;
