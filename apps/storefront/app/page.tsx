import { Suspense } from "react";
import { ApiHealth } from "./api-health";

export default function Home() {
  return (
    <main>
      <h1>Bazaar</h1>

      <Suspense fallback={<p>Checking API status…</p>}>
        <ApiHealth />
      </Suspense>
    </main>
  );
}
