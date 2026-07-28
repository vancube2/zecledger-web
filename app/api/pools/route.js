import { getMigrationData } from "../../../lib/pools";

// Node runtime (fetch to an external API, no edge-specific needs).
export const runtime = "nodejs";
// Always serve fresh-ish data, but cache briefly so we do not hammer CipherScan.
export const dynamic = "force-dynamic";

// Server-side cache. CipherScan caches ~60s on their end and rate-limits to
// 100 req/min; a 60s cache here means many visitors map to at most one upstream
// call per minute. This is the polite way to consume a free community API.
const TTL_MS = 60_000;
let cache = { at: 0, data: null };

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.at < TTL_MS) {
    return Response.json({ ...cache.data, cached: true });
  }
  try {
    const data = await getMigrationData();
    cache = { at: now, data };
    return Response.json({ ...data, cached: false });
  } catch (e) {
    return Response.json(
      { error: String(e.message || e) },
      { status: 502 }
    );
  }
}
