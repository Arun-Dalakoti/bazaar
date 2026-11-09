FROM node:24.15.0-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
  && corepack prepare pnpm@10.32.1 --activate

WORKDIR /repo

FROM base AS pruner

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm exec turbo prune @bazaar/api --docker

FROM base AS builder

COPY --from=pruner /repo/out/json/ ./
RUN pnpm install --frozen-lockfile

COPY --from=pruner /repo/out/full/ ./
RUN pnpm --filter @bazaar/api build

FROM base AS runner

ENV NODE_ENV=production

WORKDIR /repo

COPY --from=builder /repo ./

CMD ["node", "apps/api/dist/main.js"]