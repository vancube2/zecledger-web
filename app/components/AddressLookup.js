"use client";
import { useState } from "react";

function fmt(n, d = 2) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: d });
}

export default function AddressLookup() {
  const [addr, setAddr] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function lookup() {
    if (!addr.trim()) return;
    setLoading(true);
    setErr(null);
    setData(null);
    try {
      const r = await fetch(`/api/address?addr=${encodeURIComponent(addr.trim())}`);
      const d = await r.json();
      if (d.error) setErr(d.error);
      else setData(d);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="searchrow">
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
          placeholder="Enter a transparent Zcash address (starts with t)…"
          spellCheck={false}
        />
        <button onClick={lookup} disabled={loading}>
          {loading ? "Looking…" : "Look up"}
        </button>
      </div>

      {err && <div className="err">Error: {err}</div>}

      {data?.shielded && (
        <div className="privacy-note">
          <b>This is a shielded address.</b> {data.message}
        </div>
      )}

      {data && data.found === false && (
        <div className="card">
          <h3>No data found</h3>
          <div className="src">source: Blockchair</div>
          <p style={{ color: "var(--dim)", fontSize: ".92rem" }}>
            This address has no public transaction history, or it is not a valid
            transparent Zcash address.
          </p>
        </div>
      )}

      {data && data.found && (
        <div>
          <div className="grid c4" style={{ marginBottom: 20 }}>
            <div className="stat"><div className="v gold">{fmt(data.balanceZec, 4)}</div><div className="k">balance (ZEC)</div></div>
            <div className="stat"><div className="v">${fmt(data.balanceUsd)}</div><div className="k">balance (USD)</div></div>
            <div className="stat"><div className="v green">{fmt(data.received, 2)}</div><div className="k">total received</div></div>
            <div className="stat"><div className="v red">{fmt(data.spent, 2)}</div><div className="k">total spent</div></div>
          </div>
          <div className="card">
            <h3>Address activity</h3>
            <div className="src">source: {data.source} · transparent data is public by design</div>
            <div className="grid c3">
              <div className="stat"><div className="v blue">{fmt(data.txCount, 0)}</div><div className="k">transactions</div></div>
              <div className="stat"><div className="v" style={{ fontSize: "1rem" }}>{data.firstSeen || "—"}</div><div className="k">first seen</div></div>
              <div className="stat"><div className="v" style={{ fontSize: "1rem" }}>{data.lastSeen || "—"}</div><div className="k">last seen</div></div>
            </div>
            <div className="note">
              This is a transparent address, so everything here is public, exactly
              like Bitcoin. A shielded (z) address would show none of this.
            </div>
          </div>
        </div>
      )}

      {!data && !err && !loading && (
        <div className="privacy-note">
          Look up any <b>transparent</b> Zcash address to see its public balance and
          history. Shielded (z) addresses are private by design and cannot be looked
          up here. That is the whole point of Zcash.
        </div>
      )}
    </div>
  );
}
