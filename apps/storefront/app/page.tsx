import type { ApiHealthResponse } from "@bazaar/types";

async function getHealthStatus(): Promise<ApiHealthResponse | null> {
  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";

  try {
    const response = await fetch(`${apiBaseUrl}/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ApiHealthResponse;
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getHealthStatus();

  if (!health) {
    return (
      <main>
        <h1>API status: unavailable</h1>
      </main>
    );
  }

  return (
    <main>
      <h1>API status: {health.status}</h1>
      <p>Checked at: {health.timestamp}</p>
    </main>
  );
}
