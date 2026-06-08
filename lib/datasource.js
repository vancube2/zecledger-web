// lib/datasource.js
//
// Single place where ZecLedger Web talks to the outside world.
// Today it uses Blockchair. A public Zaino / lightwalletd source can be
// added here later as a second provider without changing any UI code.

const BLOCKCHAIR = "https://api.blockchair.com/zcash";
const UA = { "User-Agent": "ZecLedger-Web/1.0" };

// ---- helpers ---------------------------------------------------------------

async function bcFetch(path) {
  const res = await fetch(`${BLOCKCHAIR}${path}`, {
    headers: UA,
    // cache at the edge for 60s so we do not hammer the API
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Blockchair ${res.status}`);
  return res.json();
}

// Classify one Blockchair transaction row using the CORRECTED method.
// (shielded_value_delta + shielded_output_raw, not input_count alone.)
export function classifyTx(t) {
  const cb = t.is_coinbase;
  const inp = t.input_count || 0;
  const delta = t.shielded_value_delta || 0;
  const sOut = (t.shielded_output_raw || []).length;
  if (cb) return "coinbase";
  if (inp === 0 && sOut > 0) return "private_z2z";
  if (inp > 0 && delta > 0) return "shielding_t2z";
  if (inp === 0 && sOut === 0) return "deshielding_z2t";
  return "transparent_t2t";
}

// ---- public API ------------------------------------------------------------

// Network + fee snapshot
export async function getNetworkStats() {
  const d = (await bcFetch("/stats")).data;
  return {
    block: d.best_block_height,
    totalTx: d.transactions,
    tx24h: d.transactions_24h,
    priceUsd: d.market_price_usd,
    marketCap: d.market_cap_usd,
    nodes: d.nodes,
    medianFeeUsd: d.median_transaction_fee_usd_24h,
    avgFeeUsd: d.average_transaction_fee_usd_24h,
    largestTxUsd: d.largest_transaction_24h?.value_usd ?? null,
    mempoolTx: d.mempool_transactions,
    chainSizeGb: d.blockchain_size ? d.blockchain_size / 1e9 : null,
    hashrate: d.hashrate_24h,
    source: "Blockchair",
    fetchedAt: new Date().toISOString(),
  };
}

// Shield-rate sample: last `limit` transactions, classified.
export async function getShieldRate(limit = 100) {
  const d = await bcFetch(`/transactions?limit=${limit}&s=block_id(desc)`);
  const txs = d.data || [];
  const counts = {
    coinbase: 0,
    transparent_t2t: 0,
    deshielding_z2t: 0,
    shielding_t2z: 0,
    private_z2z: 0,
  };
  for (const t of txs) counts[classifyTx(t)]++;
  const n = txs.length || 1;
  const anyShielded = counts.shielding_t2z + counts.private_z2z;
  return {
    sampleSize: txs.length,
    counts,
    pct: Object.fromEntries(
      Object.entries(counts).map(([k, v]) => [k, +(100 * v / n).toFixed(1)])
    ),
    anyShieldedPct: +(100 * anyShielded / n).toFixed(1),
    drainRatio:
      anyShielded > 0
        ? +(counts.deshielding_z2t / anyShielded).toFixed(1)
        : null,
    note: "Sample of recent transactions. Explorer cannot see z→z internals, so this is a floor.",
    source: "Blockchair",
    fetchedAt: new Date().toISOString(),
  };
}

// Transparent address lookup. Shielded addresses cannot be looked up by design.
export async function getAddress(addr) {
  const clean = (addr || "").trim();
  if (!clean) throw new Error("empty address");
  // Reject obvious shielded addresses with a friendly, on-message message.
  if (/^z/i.test(clean) || /^u/i.test(clean)) {
    return {
      address: clean,
      shielded: true,
      message:
        "This looks like a shielded (z) or unified (u) address. By design, shielded balances and history are private and cannot be looked up from a public explorer. That privacy is the point.",
    };
  }
  const d = await bcFetch(`/dashboards/address/${encodeURIComponent(clean)}`);
  const rec = d.data?.[clean];
  if (!rec || !rec.address) {
    return { address: clean, found: false };
  }
  const a = rec.address;
  return {
    address: clean,
    shielded: false,
    found: true,
    balanceZec: a.balance != null ? a.balance / 1e8 : null,
    balanceUsd: a.balance_usd ?? null,
    received: a.received != null ? a.received / 1e8 : null,
    spent: a.spent != null ? a.spent / 1e8 : null,
    txCount: a.transaction_count ?? null,
    firstSeen: a.first_seen_receiving ?? null,
    lastSeen: a.last_seen_spending ?? a.last_seen_receiving ?? null,
    recentTx: (rec.transactions || []).slice(0, 10),
    source: "Blockchair",
    fetchedAt: new Date().toISOString(),
  };
}
