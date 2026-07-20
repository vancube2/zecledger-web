import { checkAll } from "../../../lib/ironwood";

// gRPC needs the Node runtime, not edge.
export const runtime = "nodejs";
// Always answer from a live check rather than a snapshot frozen at build time.
// A readiness page that serves a stale verdict is worse than no page.
export const dynamic = "force-dynamic";

// Probing several servers costs a few seconds, so hold the result briefly.
// This is an explicit cache with a visible timestamp, not build-time caching.
const TTL_MS = 120_000;
let cache = { at: 0, data: null };

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.at < TTL_MS) {
    return Response.json({ ...cache.data, cached: true });
  }
  try {
    const data = await checkAll();
    cache = { at: now, data };
    return Response.json({ ...data, cached: false });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
