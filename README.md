# Elysia.js Healthcheck Plugin

Healthcheck plugin for [Elysia.js](https://elysiajs.com) that provides configurable health endpoints with custom checks and TypeBox schema validation.

- [Elysia.js Healthcheck Plugin](#elysiajs-healthcheck-plugin)
  - [Installation](#installation)
  - [Concepts](#concepts)
    - [Liveness vs Readiness](#liveness-vs-readiness)
    - [Why `/healthz`?](#why-healthz)
  - [Usage](#usage)
    - [Basic Setup](#basic-setup)
    - [Custom Paths](#custom-paths)
    - [Health Checks](#health-checks)
    - [Type Safety](#type-safety)
    - [Response Format](#response-format)
  - [Configuration](#configuration)
  - [HTTP Status Codes](#http-status-codes)
  - [License](#license)

## Installation

```sh
bun add elysia-healthcheck elysia
# or
npm install elysia-healthcheck elysia
# or
yarn add elysia-healthcheck elysia
```

## Concepts

This plugin follows [Kubernetes health check conventions](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) and [cloud-native best practices](https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-setting-up-health-checks-with-readiness-and-liveness-probes):

### Liveness vs Readiness

- **Liveness** (`/healthz/live`) — Determines if the application is running and should continue running. If this fails, the application should be restarted. Use for checking critical dependencies like database connections.

- **Readiness** (`/healthz/ready`) — Determines if the application is ready to receive traffic. If this fails, traffic should be temporarily stopped but the application shouldn't be restarted. Use for checking if caches are warmed up, migrations completed, etc.

- **Overall** (`/healthz`) — General health endpoint without specific checks, always returns healthy with uptime information.

### Why `/healthz`?

The `/healthz` path follows the [Kubernetes HTTP health check](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#http-probes) convention and is widely adopted across cloud-native applications. The `z` suffix avoids conflicts with application routes while being memorable and standardized.

## Usage

### Basic Setup

```ts
import { Elysia } from 'elysia';
import { healthcheckPlugin } from 'elysia-healthcheck';

const app = new Elysia().use(healthcheckPlugin()).listen(3000);
```

This creates three health endpoints:

- `GET /healthz` — Overall health status
- `GET /healthz/live` — Liveness check
- `GET /healthz/ready` — Readiness check

### Custom Paths

```ts
const app = new Elysia().use(
  healthcheckPlugin({
    prefix: '/health',
    paths: {
      liveness: '/liveness',
      readiness: '/readiness',
    },
  }),
);
```

### Health Checks

Add custom health check functions for liveness and readiness endpoints:

```ts
const app = new Elysia().use(
  healthcheckPlugin({
    checks: {
      liveness: [
        () => ({ name: 'database', healthy: true }),
        async () => {
          const isHealthy = await checkRedisConnection();
          return {
            name: 'redis',
            healthy: isHealthy,
            details: { host: 'localhost:6379' },
          };
        },
      ],
      readiness: [() => ({ name: 'migrations', healthy: true })],
    },
    timeoutMs: 3000,
  }),
);
```

### Type Safety

This plugin is fully typed and works seamlessly with Elysia's [Treaty](https://elysiajs.com/eden/treaty/overview#eden-treaty) client:

```ts
import { treaty } from '@elysiajs/eden';
import { Elysia } from 'elysia';
import { healthcheckPlugin } from 'elysia-healthcheck';

const app = new Elysia().use(healthcheckPlugin());
const client = treaty(app);

// Fully typed health check calls
// Will also handle custom endpoints
const health = await client.healthz.get();
const liveness = await client.healthz.live.get();
const readiness = await client.healthz.ready.get();
```

### Response Format

Health endpoints return structured JSON responses:

```json
{
  "healthy": true,
  "uptime": 42.123,
  "checks": {
    "database": {
      "healthy": true,
      "details": { "host": "localhost:5432" }
    },
    "redis": {
      "healthy": false,
      "details": { "error": "Connection timeout" }
    }
  }
}
```

## Configuration

| Option             | Type              | Default    | Description                                 |
| ------------------ | ----------------- | ---------- | ------------------------------------------- |
| `prefix`           | `string`          | `/healthz` | Base path for all health endpoints          |
| `paths.liveness`   | `string`          | `/live`    | Liveness check endpoint path                |
| `paths.readiness`  | `string`          | `/ready`   | Readiness check endpoint path               |
| `checks.liveness`  | `CheckFunction[]` | `[]`       | Functions for liveness checks               |
| `checks.readiness` | `CheckFunction[]` | `[]`       | Functions for readiness checks              |
| `timeoutMs`        | `number`          | `5000`     | Timeout for check functions in milliseconds |

## HTTP Status Codes

- **200 OK** — All checks passed or no checks configured
- **503 Service Unavailable** — One or more checks failed

## License

MIT
