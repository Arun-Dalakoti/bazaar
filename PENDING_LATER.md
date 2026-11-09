# Pending Later

Track work intentionally deferred or awaiting an external dependency. Each item has a completion check.

## Step 1.1 — Monorepo and local environment

- [ ] Start and verify the four local services with Docker: Postgres, MongoDB, Redis, and Meilisearch.
  - **Current state:** `infra/docker-compose.yml` parses successfully. Container status could not be inspected in this review because access to the Docker socket was denied. Earlier, Docker reported that its daemon socket was missing.
  - **Why deferred:** Docker Desktop/daemon access is needed to create and inspect containers.
  - **Done when:** `docker compose -f infra/docker-compose.yml up -d` succeeds and `docker compose -f infra/docker-compose.yml ps` shows all four services healthy.
- [ ] Verify the full local app flow after the Docker services are healthy.
  - **Done when:** `pnpm dev` starts both apps, `GET http://localhost:3001/health` returns HTTP 200 with all four checks up, and the storefront displays the healthy API status.
- [ ] Remove the leftover npm lockfile and review the repository restructure.
  - **Current state:** `apps/storefront/package-lock.json` remains alongside the root `pnpm-lock.yaml`; Git status shows the monorepo restructure as uncommitted additions/deletions.
  - **Done when:** pnpm installation is confirmed, the nested npm lockfile is removed, and the root Git changes have been reviewed.

## Step 1.2 — CI/CD and preview deploys

- [ ] Add GitHub Actions CI for API and storefront lint, typecheck, and tests.
- [ ] Add an API Dockerfile and build the image in CI.
- [ ] Deploy the API to a staging provider with staging-managed services.
- [ ] Connect Vercel previews to pull requests for `apps/storefront`.
- [ ] Add a non-blocking Lighthouse CI job.
