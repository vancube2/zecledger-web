"use client";
import { useEffect, useState } from "react";

const ROWS = [
  { key: "transparent_t2t", label: "Transparent t→t", color: "var(--red)" },
  { key: "coinbase", label: "Coinbase (mining)", color: "var(--gold-deep)" },
  { key: "deshielding_z2t", label: "Deshielding z→t", color: "var(--blue)" },
  { key: "private_z2z", label: "Fully private z→z", color: "var(--green)" },
  { key: "shielding_t2z", label: "Shielding t→z", color: "var(--gold)" },
];

export default function ShieldRate() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch("/api/shieldrate?limit=100")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="err">Could not load shield rate: {err}</div>;
  if (!data) return <div className="loading">Sampling recent transactions…</div>;

  const max = Math.max(...ROWS.map((r) => data.pct[r.key] || 0), 1);

  return (
    <div>
      <div className="grid c4" style={{ marginBottom: 22 }}>
        <div className="stat">
          <div className="v gold">{data.anyShieldedPct}%</div>
          <div className="k">any shielded activity</div>
        </div>
        <div className="stat">
          <div className="v red">
            {data.drainRatio != null ? `${data.drainRatio}:1` : "—"}
          </div>
          <div className="k">deshield vs shield</div>
        </div>
        <div className="stat">
          <div className="v blue">{data.pct.coinbase}%</div>
          <div className="k">mining rewards</div>
        </div>
        <div className="stat">
          <div className="v green">{data.pct.private_z2z}%</div>
          <div className="k">fully private z→z</div>
        </div>
      </div>

      <div className="card">
        <h3>Daily transaction mix</h3>
        <div className="src">
          Live sample of {data.sampleSize} recent transactions · corrected
          classification · source: {data.source}
        </div>
        {ROWS.map((r) => {
          const pct = data.pct[r.key] || 0;
          return (
            <div className="bar" key={r.key}>
              <span className="lbl">{r.label}</span>
              <span className="track">
                <span
                  className="fill"
                  style={{ width: `${(pct / max) * 100}%`, background: r.color }}
                />
              </span>
              <span className="pct">{pct}%</span>
            </div>
          );
        })}
        <div className="note">{data.note}</div>
      </div>
    </div>
  );
}
