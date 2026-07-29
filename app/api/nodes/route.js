import { getNodeData } from "../../../lib/nodes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 60s cache: CipherScan's crawler updates over minutes, and this keeps many
// visitors mapping to at most one upstream call per minute.
const TTL_MS = 60_000;
let cache = { at: 0, data: null };

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.at < TTL_MS) {
    return Response.json({ ...cache.data, cached: true });
  }
  try {
    const data = await getNodeData();
    cache = { at: now, data };
    return Response.json({ ...data, cached: false });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
