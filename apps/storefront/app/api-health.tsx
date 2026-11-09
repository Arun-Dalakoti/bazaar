import type { ApiHealthResponse } from "@bazaar/types";

export async function ApiHealth() {
  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    return <p>API status: unavailable (API_BASE_URL is missing)</p>;
  }

  let statusText: string;

  try {
    const response = await fetch(`${baseUrl}/health`, {
      cache: "no-store",
    });

    if (!response.ok) {
      statusText = `unavailable (HTTP ${response.status})`;
    } else {
      const health = (await response.json()) as ApiHealthResponse;
      statusText = health.status;
    }
  } catch {
    statusText = "unavailable";
  }

  return <p>API status: {statusText}</p>;
}
