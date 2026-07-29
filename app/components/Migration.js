"use client";
import { useEffect, useState } from "react";

// The pool-migration panel. Reads the shaped data from /api/pools (which fetches
// CipherScan server-side) and tells the migration story in three layers:
//
//   1. Movement    - Orchard draining, Ironwood filling, on and after activation.
//   2. Turnstile   - where deshielded ZEC goes once it leaves a pool.
//   3. Pool totals - the verified balances everything sits on.
//
// It is deliberately honest about day-one gaps: Ironwood's flow deltas are null
// until 24h of post-activation history exists, so we show its live level and
// Orchard's outflow rather than inventing an inflow number.

function fmtZec(n, dp = 0) {
  if (n == null || !Number.isFinite(n)) return "\u2014";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

function fmtSigned(n, dp = 0) {
  if (n == null || !Number.isFinite(n)) return null;
  const s = n > 0 ? "+" : n < 0 ? "\u2212" : "";
  return `${s}${fmtZec(Math.abs(n), dp)}`;
}

// Human labels for the turnstile destination keys.
const DEST_LABEL = {
  held: "Still held",
  transferred: "Transferred",
  bridge: "Sent to a bridge",
  exchange: "Sent to an exchange",
  reshielded: "Reshielded",
};
const DEST_COLOR = {
  held: "var(--green)",
  transferred: "var(--gold)",
  bridge: "var(--blue)",
  exchange: "var(--red)",
  reshielded: "var(--dim)",
};

// Order pools for the totals list: shielded pools first (the interesting ones),
// transparent last. Sprout/lockbox included for completeness.
const POOL_ORDER = ["ironwood", "orchard", "sapling", "sprout", "lockbox", "transparent"];
const POOL_LABEL = {
  ironwood: "Ironwood",
  orchard: "Orchard",
  sapling: "Sapling",
  sprout: "Sprout",
  lockbox: "Lockbox",
  transparent: "Transparent",
};

export default function Migration() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/pools")
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          if (d.error) setErr(d.error);
          else setData(d);
        })
        .catch((e) => alive && setErr(String(e)));
    };
    load();
    // Refresh every 60s to match the server cache; the migration moves slowly
    // but this keeps Ironwood's level and the deltas current without hammering.
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (err) {
    return (
      <div className="err">
        Could not load migration data: {err}. The source is a third-party
        explorer and may be briefly unavailable.
      </div>
    );
  }
  if (!data) {
    return <div className="loading">Reading the shielded pools\u2026</div>;
  }

  const pools = data.overview?.pools || {};
  const supply = data.supply || [];
  const turnstile = data.turnstile;

  // Movement figures.
  const orchardOut24h = pools.orchard?.delta24h; // negative = leaving Orchard
  const ironwoodLevel =
    pools.ironwood?.zec ??
    supply.find((p) => p.id === "ironwood")?.zec ??
    null;
  const ironwoodFlow24h = pools.ironwood?.delta24h; // null on day one

  // Supply lookup by id, for the totals grid and monitored flags.
  const supplyById = {};
  for (const p of supply) supplyById[p.id] = p;

  const totalShielded = pools.shielded?.zec ?? null;
  const chainTotal =
    (pools.transparent?.zec ?? 0) + (pools.shielded?.zec ?? 0) || null;
  const shieldedPct =
    totalShielded && chainTotal ? (totalShielded / chainTotal) * 100 : null;

  return (
    <div className="mig">
      {/* Layer 1: the movement */}
      <div className="mig-hero">
        <div className="mig-flow">
          <div className="mig-side mig-out">
            <div className="mig-side-k">Leaving Orchard, 24h</div>
            <div className="mig-side-v red">
              {orchardOut24h != null ? fmtSigned(orchardOut24h) : "\u2014"}
              <span className="mig-unit">ZEC</span>
            </div>
            <div className="mig-side-total">
              pool now {fmtZec(pools.orchard?.zec)} ZEC
            </div>
          </div>

          <div className="mig-arrow" aria-hidden="true">
            <span className="mig-arrow-line" />
            <span className="mig-arrow-head">&rarr;</span>
          </div>

          <div className="mig-side mig-in">
            <div className="mig-side-k">Ironwood pool</div>
            <div className="mig-side-v gold">
              {fmtZec(ironwoodLevel)}
              <span className="mig-unit">ZEC</span>
            </div>
            <div className="mig-side-total">
              {ironwoodFlow24h != null
                ? `${fmtSigned(ironwoodFlow24h)} ZEC in 24h`
                : "24h flow not available yet"}
            </div>
          </div>
        </div>

        <p className="mig-note">
          Ironwood activated on 28 July 2026. New shielded activity now routes
          into the Ironwood pool while the Orchard pool stops accepting deposits,
          so value moves from one to the other over time. On the first day, the
          per-pool 24h inflow figure for Ironwood is not yet available, since it
          needs a full day of history; the Orchard outflow and the live Ironwood
          balance are shown instead.
        </p>
      </div>

      {/* Layer 2: the turnstile */}
      {turnstile && turnstile.destinations ? (
        <div className="mig-section">
          <div className="mig-h">
            <span className="mig-eyebrow">The turnstile</span>
            <span className="mig-sub">
              where {fmtZec(turnstile.totalDeshielded)} ZEC went after leaving a
              shielded pool, since {turnstile.since}
            </span>
          </div>

          <div className="mig-bars">
            {turnstile.destinations.map((d) => (
              <div className="mig-bar" key={d.key}>
                <span className="mig-bar-lbl">
                  {DEST_LABEL[d.key] || d.key}
                </span>
                <span className="mig-bar-track">
                  <span
                    className="mig-bar-fill"
                    style={{
                      width: `${Math.max(d.pct, 0.5)}%`,
                      background: DEST_COLOR[d.key] || "var(--dim)",
                    }}
                  />
                </span>
                <span className="mig-bar-pct">{d.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>

          <p className="mig-note">
            When ZEC leaves a shielded pool it becomes visible again, and this is
            where it goes next. A large share simply sits unspent, which is often
            read as holders shielding for privacy rather than to sell. This is the
            mechanism that keeps the migration accountable: value passing through
            the turnstile is checked against the ledger. Updated daily.
          </p>
        </div>
      ) : null}

      {/* Layer 3: the verified totals */}
      <div className="mig-section">
        <div className="mig-h">
          <span className="mig-eyebrow">Pool balances</span>
          <span className="mig-sub">
            {shieldedPct != null
              ? `${shieldedPct.toFixed(1)}% of supply is shielded`
              : "verified pool totals"}
          </span>
        </div>

        <div className="mig-pools">
          {POOL_ORDER.filter((id) => supplyById[id] || pools[id]).map((id) => {
            const zec = pools[id]?.zec ?? supplyById[id]?.zec ?? null;
            const monitored = supplyById[id]?.monitored;
            const d24 = pools[id]?.delta24h;
            return (
              <div className="mig-pool" key={id}>
                <div className="mig-pool-top">
                  <span className="mig-pool-name">{POOL_LABEL[id] || id}</span>
                  {monitored ? (
                    <span className="mig-verified" title="Value verified against chain state">
                      verified
                    </span>
                  ) : (
                    <span className="mig-unverified" title="Value not currently verified">
                      unverified
                    </span>
                  )}
                </div>
                <div className="mig-pool-v">{fmtZec(zec)} ZEC</div>
                {d24 != null && d24 !== 0 ? (
                  <div className={`mig-pool-d ${d24 < 0 ? "red" : "green"}`}>
                    {fmtSigned(d24)} 24h
                  </div>
                ) : (
                  <div className="mig-pool-d dim">&nbsp;</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mig-src">
        Data from CipherScan, an open-source Zcash explorer powered by a Zebra
        node. Values shown as verified come from chain state rather than estimate.
        {data.fetchedAt
          ? ` Fetched ${new Date(data.fetchedAt).toUTCString()}.`
          : ""}
        {data.cached ? " Served from a short cache." : ""}
      </p>
    </div>
  );
}
