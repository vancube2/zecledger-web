// lib/pools.js
//
// The migration data layer. Fetches shielded-pool state, pool deltas, and
// turnstile destinations from CipherScan's public Zcash API, normalizes
// everything to ZEC, and shapes it for the migration panel.
//
// Why server-side: CipherScan is a free, community-run API (powered by a Zebra
// node) with a 100 req/min limit and ~60s caching of its own. We fetch it from
// our server and cache briefly, rather than having every visitor's browser hit
// it directly. That respects their limits, avoids exposing visitors to a third
// party, and keeps the source honest and single.
//
// Source: https://api.mainnet.cipherscan.app  (docs at cipherscan.app/docs)

const BASE = "https://api.mainnet.cipherscan.app/api";
const ZAT = 100_000_000; // 1 ZEC = 100,000,000 zatoshis

// zats (number or string) -> ZEC number, or null if not a finite value.
function zecFromZat(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n / ZAT : null;
}

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { accept: "application/json" },
    // Next.js: revalidate at the route level; this keeps fetch from caching
    // indefinitely at the framework layer.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`CipherScan ${path} returned ${res.status}`);
  }
  return res.json();
}

// /api/supply -> array of { id, chainValue (ZEC), chainValueZat, monitored }
// We keep chainValue as-is (already ZEC) and carry the monitored flag through,
// because honestly showing whether a pool's value is verified is the point.
async function getSupply() {
  const raw = await getJson("/supply");
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => ({
    id: p.id,
    zec: Number(p.chainValue),
    monitored: p.monitored === true,
  }));
}

// /api/pools/overview -> current sizes (zats) + deltas (zats) per pool.
// Deltas can be null (e.g. Ironwood on day one, before 24h of history exists);
// we pass null through rather than coercing to zero, so the UI can say "not yet"
// instead of implying no movement.
async function getOverview() {
  const raw = await getJson("/pools/overview");
  const current = raw.current || {};
  const deltas = raw.deltas || {};

  const poolKeys = [
    "transparent",
    "sprout",
    "sapling",
    "orchard",
    "ironwood",
    "shielded",
  ];

  const shaped = {};
  for (const k of poolKeys) {
    const d = deltas[k] || {};
    shaped[k] = {
      zec: zecFromZat(current[k]),
      delta24h: zecFromZat(d["24h"]),
      delta7d: zecFromZat(d["7d"]),
      delta30d: zecFromZat(d["30d"]),
    };
  }
  return { pools: shaped, updatedAt: current.updatedAt || null };
}

// /api/pools/turnstile -> where deshielded ZEC has gone since a start date.
// The summary values are already ZEC. This is the integrity/destination layer:
// it answers "when funds leave a shielded pool, what happens to them next".
async function getTurnstile(since = "2026-07-01") {
  const raw = await getJson(
    `/pools/turnstile?since=${encodeURIComponent(since)}`
  );
  const s = raw.summary || {};
  return {
    since: raw.since || since,
    lastUpdated: raw.lastUpdated || null,
    totalDeshielded: Number(s.totalDeshielded) || 0,
    destinations: [
      { key: "held", zec: Number(s.totalHeld) || 0, pct: Number(s.heldPercent) || 0 },
      { key: "transferred", zec: Number(s.totalTransferred) || 0, pct: Number(s.transferredPercent) || 0 },
      { key: "bridge", zec: Number(s.totalBridge) || 0, pct: Number(s.bridgePercent) || 0 },
      { key: "exchange", zec: Number(s.totalExchange) || 0, pct: Number(s.exchangePercent) || 0 },
      { key: "reshielded", zec: Number(s.totalReshielded) || 0, pct: Number(s.reshieldedPercent) || 0 },
    ],
    txCount: Number(s.txCount) || 0,
  };
}

// The one call the API route makes. Fetches the three sources in parallel and
// assembles the migration picture. If any single source fails, the others still
// return, and the failed one comes back as null so the UI can degrade honestly
// rather than the whole panel breaking.
export async function getMigrationData() {
  const [supply, overview, turnstile] = await Promise.allSettled([
    getSupply(),
    getOverview(),
    getTurnstile(),
  ]);

  return {
    supply: supply.status === "fulfilled" ? supply.value : null,
    overview: overview.status === "fulfilled" ? overview.value : null,
    turnstile: turnstile.status === "fulfilled" ? turnstile.value : null,
    fetchedAt: new Date().toISOString(),
    source: "CipherScan (api.mainnet.cipherscan.app)",
  };
}
