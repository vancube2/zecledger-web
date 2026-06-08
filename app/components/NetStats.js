"use client";
import { useEffect, useState } from "react";

function fmt(n, d = 0) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: d });
}

export default function NetStats() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch("/api/netstats")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="err">Could not load network stats: {err}</div>;
  if (!data) return <div className="loading">Fetching network snapshot…</div>;

  return (
    <div>
      <div className="grid c4" style={{ marginBottom: 20 }}>
        <div className="stat"><div className="v gold">{fmt(data.block)}</div><div className="k">latest block</div></div>
        <div className="stat"><div className="v">${fmt(data.priceUsd, 2)}</div><div className="k">ZEC price</div></div>
        <div className="stat"><div className="v blue">{fmt(data.tx24h)}</div><div className="k">transactions 24h</div></div>
        <div className="stat"><div className="v green">${fmt(data.medianFeeUsd, 4)}</div><div className="k">median fee</div></div>
      </div>
      <div className="grid c4">
        <div className="stat"><div className="v">${fmt(data.marketCap / 1e9, 2)}B</div><div className="k">market cap</div></div>
        <div className="stat"><div className="v">{fmt(data.nodes)}</div><div className="k">active nodes</div></div>
        <div className="stat"><div className="v">{fmt(data.totalTx)}</div><div className="k">total tx all-time</div></div>
        <div className="stat"><div className="v">{data.chainSizeGb ? fmt(data.chainSizeGb, 0) + " GB" : "—"}</div><div className="k">chain size</div></div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <h3>Fee snapshot</h3>
        <div className="src">source: {data.source} · updates roughly every minute</div>
        <div className="grid c3" style={{ marginTop: 4 }}>
          <div className="stat"><div className="v green">${fmt(data.medianFeeUsd, 4)}</div><div className="k">median fee (24h)</div></div>
          <div className="stat"><div className="v gold">${fmt(data.avgFeeUsd, 2)}</div><div className="k">average fee (24h)</div></div>
          <div className="stat"><div className="v blue">{data.largestTxUsd ? "$" + fmt(data.largestTxUsd) : "—"}</div><div className="k">largest tx (24h)</div></div>
        </div>
        <div className="note">
          The gap between median (${fmt(data.medianFeeUsd, 4)}) and average
          (${fmt(data.avgFeeUsd, 2)}) fees is normal: a few very large transfers
          pull the average up while the typical fee stays tiny.
        </div>
      </div>
    </div>
  );
}
