// lib/nodes.js
//
// Live node data for the network section. CipherScan runs a crawler that
// observes the Zcash peer network and reports how many nodes are running each
// client (Zebra, Zakura, zcashd), with version detail and geography. We fetch
// it server-side and shape it for display.
//
// This is a live census with stated coverage, not a claim of the whole network:
// CipherScan reports a coverage percentage, and we surface it rather than hide
// it, so the numbers are honest about what they do and do not see.
//
// Source: https://api.mainnet.cipherscan.app/api/network/nodes/stats

const BASE = "https://api.mainnet.cipherscan.app/api";

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CipherScan ${path} returned ${res.status}`);
  return res.json();
}

export async function getNodeData() {
  const raw = await getJson("/network/nodes/stats");
  const stats = raw.stats || {};
  const clients = raw.clients || {};
  const trends = raw.trends || {};

  // Client distribution: keep known clients in a stable order, fold the rest.
  const dist = Array.isArray(clients.distribution) ? clients.distribution : [];
  const total = dist.reduce((s, d) => s + (d.count || 0), 0) || 1;
  const order = ["Zebra", "Zakura", "zcashd"];
  const distribution = dist
    .map((d) => ({
      client: d.client,
      count: d.count || 0,
      pct: ((d.count || 0) / total) * 100,
    }))
    .sort((a, b) => {
      const ai = order.indexOf(a.client);
      const bi = order.indexOf(b.client);
      if (ai === -1 && bi === -1) return b.count - a.count;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

  // Version spread, most common first (already sorted by CipherScan, but be safe).
  const versions = (Array.isArray(clients.versions) ? clients.versions : [])
    .map((v) => ({ client: v.client, version: v.version, count: v.count || 0 }))
    .sort((a, b) => b.count - a.count);

  const topCountries = Array.isArray(raw.topCountries) ? raw.topCountries : [];

  return {
    activeNodes: stats.activeNodes ?? null,
    totalNodes: stats.totalNodes ?? null,
    countries: stats.countries ?? null,
    torNodes: stats.torNodes ?? null,
    topCountries,
    coveragePercentage: clients.coveragePercentage ?? null,
    observedNodes: clients.observedNodes ?? null,
    distribution,
    versions,
    trend30d: trends.change30d ?? null,
    lastUpdated: stats.lastUpdated ?? null,
    fetchedAt: new Date().toISOString(),
  };
}
