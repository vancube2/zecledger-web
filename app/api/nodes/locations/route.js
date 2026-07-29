export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_MS = 120_000;
let cache = { at: 0, data: null };

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.at < TTL_MS) {
    return Response.json({ locations: cache.data, cached: true });
  }
  try {
    const res = await fetch("https://api.mainnet.cipherscan.app/api/network/nodes", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`nodes ${res.status}`);
    const raw = await res.json();
    const locations = Array.isArray(raw.locations) ? raw.locations : [];
    cache = { at: now, data: locations };
    return Response.json({ locations, cached: false });
  } catch (e) {
    return Response.json({ error: String(e.message || e), locations: [] }, { status: 502 });
  }
}
