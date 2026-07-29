"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ZecLedger as the portfolio of Zcash, booted like a terminal.
//
// On first load the page "runs a command" and types the network's ledger out
// line by line, cursor blinking, as if zecledger were printing to a console.
// A skip control jumps to the finished state. After the first visit in a
// session it renders instantly, because a typing animation is charming once and
// tiresome on every navigation.
//
// The typed content is real: pool values and the migration percentage come from
// /api/pools; the dated events are sourced. The terminal is the vessel, not a
// costume over fake data.

const SESSION_KEY = "zl_booted_v1";

function fmt(n) {
  if (n == null || !Number.isFinite(n)) return "\u2014";
  return Math.round(n).toLocaleString("en-US");
}

// A "line" in the boot sequence. Types render char by char; the rest appear
// whole after a short beat. Some lines are links (clickable once typed).
export default function Terminal() {
  const [data, setData] = useState(null);
  const [done, setDone] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const skipRef = useRef(false);
  const bootedBefore = useRef(false);

  // Pull live network figures first so the typed numbers are real.
  useEffect(() => {
    fetch("/api/pools")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return setData({ error: true });
        const p = d.overview?.pools || {};
        const supply = d.supply || [];
        const get = (id) =>
          p[id]?.zec ?? supply.find((x) => x.id === id)?.zec ?? 0;
        const orchard = get("orchard");
        const ironwood = get("ironwood");
        const migrated =
          orchard + ironwood > 0
            ? (ironwood / (orchard + ironwood)) * 100
            : 0;
        setData({
          orchard,
          ironwood,
          migrated,
          sapling: get("sapling"),
          transparent: get("transparent"),
          shieldedPct: (() => {
            const sh = p.shielded?.zec ?? 0;
            const tot = (p.transparent?.zec ?? 0) + sh;
            return tot > 0 ? (sh / tot) * 100 : null;
          })(),
        });
      })
      .catch(() => setData({ error: true }));
  }, []);

  // Build the script once data is in.
  const lines = data ? buildLines(data) : null;

  // Detect prior boot this session.
  useEffect(() => {
    try {
      bootedBefore.current = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      bootedBefore.current = false;
    }
  }, []);

  // The typing engine.
  useEffect(() => {
    if (!lines) return;

    if (bootedBefore.current) {
      setVisibleLines(lines.length);
      setDone(true);
      return;
    }

    let cancelled = false;
    let li = 0;
    let ci = 0;

    const step = () => {
      if (cancelled) return;
      if (skipRef.current) {
        setVisibleLines(lines.length);
        setDone(true);
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {}
        return;
      }
      if (li >= lines.length) {
        setDone(true);
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {}
        return;
      }
      const line = lines[li];
      if (line.type === "type") {
        if (ci < line.text.length) {
          ci++;
          setTypedChars(ci);
          setTimeout(step, 12 + Math.random() * 22);
          return;
        }
        li++;
        ci = 0;
        setVisibleLines(li);
        setTypedChars(0);
        setTimeout(step, 90);
        return;
      }
      // instant line
      li++;
      setVisibleLines(li);
      setTimeout(step, line.pause ?? 120);
    };

    const t = setTimeout(step, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  const skip = () => {
    skipRef.current = true;
  };

  if (!lines) {
    return (
      <div className="tm">
        <div className="tm-line tm-dim">
          <span className="tm-prompt">$</span> connecting to the network
          <span className="tm-cursor" />
        </div>
      </div>
    );
  }

  return (
    <div className="tm">
      {!done && (
        <button className="tm-skip" onClick={skip}>
          Click to skip
        </button>
      )}
      <div className="tm-screen">
        {lines.slice(0, visibleLines).map((ln, i) => (
          <LineView key={i} line={ln} full />
        ))}
        {!done && visibleLines < lines.length && lines[visibleLines] && (
          <LineView
            line={lines[visibleLines]}
            partial={
              lines[visibleLines].type === "type"
                ? lines[visibleLines].text.slice(0, typedChars)
                : undefined
            }
            cursor
          />
        )}
        {done && (
          <div className="tm-line tm-prompt-line">
            <span className="tm-prompt">$</span>
            <span className="tm-cursor" />
          </div>
        )}
      </div>
    </div>
  );
}

function LineView({ line, full, partial, cursor }) {
  const text = partial != null ? partial : line.text;

  if (line.type === "cmd") {
    return (
      <div className="tm-line tm-cmd">
        <span className="tm-prompt">$</span> {text}
        {cursor && <span className="tm-cursor" />}
      </div>
    );
  }
  if (line.type === "type") {
    return (
      <div className="tm-line">
        {text}
        {cursor && <span className="tm-cursor" />}
      </div>
    );
  }
  if (line.type === "head") {
    return <div className="tm-line tm-head">{text}</div>;
  }
  if (line.type === "row") {
    const inner = (
      <>
        <span className="tm-row-date">{line.date}</span>
        <span className="tm-row-entry">{line.text}</span>
        <span className={`tm-row-tag ${line.tagCls || ""}`}>{line.tag}</span>
      </>
    );
    return line.href ? (
      <Link href={line.href} className="tm-line tm-row is-link">
        {inner}
      </Link>
    ) : (
      <div className="tm-line tm-row">{inner}</div>
    );
  }
  if (line.type === "hold") {
    return (
      <div className="tm-line tm-hold">
        <span className="tm-hold-k">{line.k}</span>
        <span className="tm-hold-dots" />
        <span className={`tm-hold-v ${line.vCls || ""}`}>{line.text}</span>
      </div>
    );
  }
  if (line.type === "blank") return <div className="tm-line tm-blank">&nbsp;</div>;
  return <div className="tm-line tm-dim">{text}</div>;
}

// The boot script: a command, then the network printed as a portfolio.
function buildLines(d) {
  if (d.error) {
    return [
      { type: "cmd", text: "zecledger network --live" },
      { type: "dim", text: "live data briefly unavailable; showing the record." },
      { type: "blank" },
    ];
  }
  return [
    { type: "cmd", text: "zecledger portfolio --network zcash --live" },
    { type: "blank" },
    { type: "type", text: "The portfolio of Zcash. A public, verifiable record." },
    { type: "blank" },

    { type: "head", text: "HOLDINGS BY POOL" },
    { type: "hold", k: "Transparent", text: `${fmt(d.transparent)} ZEC` },
    { type: "hold", k: "Sapling", text: `${fmt(d.sapling)} ZEC` },
    { type: "hold", k: "Orchard", text: `${fmt(d.orchard)} ZEC`, vCls: "orchard" },
    { type: "hold", k: "Ironwood", text: `${fmt(d.ironwood)} ZEC`, vCls: "ironwood" },
    {
      type: "hold",
      k: "Shielded share",
      text: d.shieldedPct != null ? `${d.shieldedPct.toFixed(1)}%` : "\u2014",
    },
    { type: "blank" },

    { type: "head", text: "FLAGSHIP POSITION \u00b7 ORCHARD \u2192 IRONWOOD" },
    {
      type: "type",
      text: `Migration underway. ${d.migrated.toFixed(1)}% of the Orchard pool has moved to Ironwood.`,
    },
    { type: "row", date: "open", text: "View the live migration", tag: "live", tagCls: "live", href: "/migration" },
    { type: "blank" },

    { type: "head", text: "TRACK RECORD" },
    { type: "row", date: "2026-07-28", text: "Ironwood (NU6.3) activated", tag: "live", tagCls: "live", href: "/ledger" },
    { type: "row", date: "2026-07-18", text: "zcashd reached end of life", tag: "verified", tagCls: "verified", href: "/ledger" },
    { type: "row", date: "2026-07-15", text: "Zakura 1.0.0 released", tag: "verified", tagCls: "verified", href: "/ledger" },
    { type: "row", date: "2026-06-02", text: "Orchard soundness flaw patched (NU6.2)", tag: "verified", tagCls: "verified", href: "/ledger" },
    { type: "blank" },
    { type: "dim", text: "Click any entry for the detail. Public data only; no keys touch this site." },
  ];
}
