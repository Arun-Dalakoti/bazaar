# @bazaar/api

Bazaar's HTTP API: **Express 5 + TypeScript**, run as part of the Turborepo monorepo.

## Run it

```bash
# from the repo root, with Postgres, MongoDB, Redis and Meilisearch running
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @bazaar/api dev     # tsx watch, reloads on save
curl localhost:3001/health
```

`.env` is loaded with Node's built-in `--env-file-if-exists`, so no `dotenv` package is needed. All variables are validated at startup by the Zod schema in `src/config/env.ts`; the process exits with a readable error if one is missing.

## Scripts

| Script | What it does |
|---|---|
| `dev` | Watch mode with `tsx` |
| `build` | `tsc` → `dist/` |
| `start` | Run the compiled server (`dist/server.js`) |
| `lint` | `oxlint` |
| `test` | Unit + HTTP tests (Vitest + supertest, no databases needed) |

## Layout

```
src/
  server.ts                  starts the HTTP server, graceful shutdown on SIGTERM/SIGINT
  app.ts                     createApp(deps): middleware, routes, 404 + error handler
  config/env.ts              Zod env schema, parsed once
  lib/logger.ts              pino logger + pino-http request logging (x-request-id, redaction)
  middleware/error-handler.ts
  health/health.router.ts    GET /health → 200 when every store is up, 503 otherwise
  health/store-health.service.ts
test/app.spec.ts
```

`createApp()` takes its dependencies (logger, health checker) as arguments, so tests build the app with fakes and never need real databases.
