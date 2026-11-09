export type StoreStatus = "up" | "down";

export type StoreName = "postgres" | "mongo" | "redis" | "meilisearch";

export type ApiHealthResponse = {
  status: "ok" | "degraded";
  timestamp: string;
  checks: Record<StoreName, { status: StoreStatus }>;
};
