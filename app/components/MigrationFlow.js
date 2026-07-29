"use client";
import { useEffect, useRef, useState } from "react";

// Orchard -> Ironwood migration, v2.
//
// Refinements over v1, all in service of "calm but alive":
//   - pool clouds sized to the real balances (big Orchard, small Ironwood),
//     so the picture itself tells the truth
//   - a soft arrival glow as particles land in Ironwood
//   - a faint connecting current under the stream
//   - the migrated percentage counts up on load
// Nothing flashing or loud; restraint is the point.

const IRONWOOD_COLOR = "#E9B949";
const ORCHARD_COLOR = "#9B7FE0";

function fmt(n) {
  if (n == null || !Number.isFinite(n)) return "\u2014";
  return Math.round(n).toLocaleString("en-US");
}

export default function MigrationFlow() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const dataRef = useRef(null);

  const [pools, setPools] = useState(null);
  const [err, setErr] = useState(null);
  const [reduced, setReduced] = useState(false);
  const [displayPct, setDisplayPct] = useState(0); // for count-up

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/pools")
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          if (d.error) return setErr(d.error);
          const p = d.overview?.pools || {};
          const supply = d.supply || [];
          const orchard =
            p.orchard?.zec ?? supply.find((x) => x.id === "orchard")?.zec ?? 0;
          const ironwood =
            p.ironwood?.zec ?? supply.find((x) => x.id === "ironwood")?.zec ?? 0;
          const total = orchard + ironwood;
          const migratedPct = total > 0 ? (ironwood / total) * 100 : 0;
          const shaped = { orchard, ironwood, migratedPct };
          dataRef.current = shaped;
          setPools(shaped);
          setErr(null);
        })
        .catch((e) => alive && setErr(String(e)));
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Count-up toward the real percentage.
  useEffect(() => {
    if (!pools) return;
    const target = pools.migratedPct;
    let raf;
    const start = performance.now();
    const from = displayPct;
    const dur = 900;
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayPct(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pools?.migratedPct]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const anchors = () => ({
      orchard: { x: w * 0.19, y: h * 0.52, r: Math.min(w, h) * 0.17 },
      ironwood: { x: w * 0.81, y: h * 0.52, r: Math.min(w, h) * 0.075 },
    });

    // Cloud particle counts reflect the real proportion (roughly): Orchard dense,
    // Ironwood sparse. Recomputed when data arrives.
    let orchardCloud = [];
    let ironwoodCloud = [];
    function reseed() {
      const A = anchors();
      const d = dataRef.current;
      // Base counts, nudged by the real balances if present.
      let oN = 320;
      let iN = 60;
      if (d && d.orchard + d.ironwood > 0) {
        const share = d.ironwood / (d.orchard + d.ironwood);
        iN = Math.max(30, Math.round(380 * share) + 40);
        oN = Math.max(120, Math.round(380 * (1 - share)));
      }
      const seed = (c, n, color) => {
        const out = [];
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const rr = Math.sqrt(Math.random()) * c.r;
          out.push({
            x: c.x + Math.cos(a) * rr,
            y: c.y + Math.sin(a) * rr * 0.5,
            color,
            size: 0.7 + Math.random() * 1.4,
            drift: Math.random() * Math.PI * 2,
          });
        }
        return out;
      };
      orchardCloud = seed(A.orchard, oN, ORCHARD_COLOR);
      ironwoodCloud = seed(A.ironwood, iN, IRONWOOD_COLOR);
    }
    reseed();
    let reseedAcc = 0;

    const travellers = [];
    const arrivals = []; // glow bursts at Ironwood
    let spawnAcc = 0;

    let last = performance.now();
    let paused = document.hidden;
    const onVis = () => (paused = document.hidden);
    document.addEventListener("visibilitychange", onVis);

    function spawnTraveller() {
      const A = anchors();
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * A.orchard.r * 0.75;
      travellers.push({
        sx: A.orchard.x + Math.cos(a) * rr,
        sy: A.orchard.y + Math.sin(a) * rr * 0.5,
        t: 0,
        speed: 0.14 + Math.random() * 0.1,
        lift: h * (0.16 + Math.random() * 0.12),
        size: 1 + Math.random() * 1.5,
      });
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (paused) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      // occasional reseed so proportions track fresh data
      reseedAcc += dt;
      if (reseedAcc > 8) {
        reseedAcc = 0;
        reseed();
      }

      ctx.clearRect(0, 0, w, h);
      const A = anchors();

      // Faint connecting current under everything.
      const grad = ctx.createLinearGradient(A.orchard.x, 0, A.ironwood.x, 0);
      grad.addColorStop(0, "rgba(155,127,224,0.10)");
      grad.addColorStop(1, "rgba(233,185,73,0.12)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      const midY = A.orchard.y - h * 0.16;
      ctx.moveTo(A.orchard.x, A.orchard.y);
      ctx.quadraticCurveTo((A.orchard.x + A.ironwood.x) / 2, midY, A.ironwood.x, A.ironwood.y);
      ctx.stroke();

      // Pool clouds shimmer.
      for (const cloud of [orchardCloud, ironwoodCloud]) {
        for (const p of cloud) {
          p.drift += dt * 0.5;
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(p.drift) * 0.4, p.y + Math.sin(p.drift * 1.3) * 0.3, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Pool rings.
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = ORCHARD_COLOR;
      ctx.beginPath();
      ctx.ellipse(A.orchard.x, A.orchard.y, A.orchard.r * 1.12, A.orchard.r * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = IRONWOOD_COLOR;
      ctx.beginPath();
      ctx.ellipse(A.ironwood.x, A.ironwood.y, A.ironwood.r * 1.2, A.ironwood.r * 0.66, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Spawn travellers.
      spawnAcc += dt;
      while (spawnAcc > 0.09) {
        spawnAcc -= 0.09;
        if (travellers.length < 130) spawnTraveller();
      }

      // Move travellers.
      for (let i = travellers.length - 1; i >= 0; i--) {
        const tv = travellers[i];
        tv.t += tv.speed * dt;
        if (tv.t >= 1) {
          arrivals.push({ x: A.ironwood.x, y: A.ironwood.y, life: 0 });
          travellers.splice(i, 1);
          continue;
        }
        const ex = A.ironwood.x;
        const ey = A.ironwood.y;
        const mx = (tv.sx + ex) / 2;
        const my = (tv.sy + ey) / 2 - tv.lift;
        const u = 1 - tv.t;
        const x = u * u * tv.sx + 2 * u * tv.t * mx + tv.t * tv.t * ex;
        const y = u * u * tv.sy + 2 * u * tv.t * my + tv.t * tv.t * ey;
        const alpha = tv.t < 0.15 ? tv.t / 0.15 : tv.t > 0.85 ? (1 - tv.t) / 0.15 : 1;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.9;
        ctx.fillStyle = tv.t < 0.5 ? ORCHARD_COLOR : IRONWOOD_COLOR;
        ctx.beginPath();
        ctx.arc(x, y, tv.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Arrival glows.
      for (let i = arrivals.length - 1; i >= 0; i--) {
        const g = arrivals[i];
        g.life += dt * 2.2;
        if (g.life >= 1) {
          arrivals.splice(i, 1);
          continue;
        }
        const rad = 4 + g.life * 22;
        const a = (1 - g.life) * 0.5;
        const rg = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, rad);
        rg.addColorStop(0, `rgba(233,185,73,${a})`);
        rg.addColorStop(1, "rgba(233,185,73,0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(g.x, g.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduced]);

  return (
    <div className="flow">
      <div className="flow-top">
        <div className="flow-status">
          <span className="flow-dot" />
          Ironwood live
        </div>
        <div className="flow-pct">
          <span className="flow-pct-num">{displayPct.toFixed(1)}%</span> migrated
        </div>
      </div>

      <div className="flow-stage">
        {reduced ? (
          <div className="flow-static">
            <div className="flow-static-pool orchard">
              <span className="flow-static-dot" />
              Orchard
            </div>
            <div className="flow-static-arrow">&rarr;</div>
            <div className="flow-static-pool ironwood">
              <span className="flow-static-dot" />
              Ironwood
            </div>
          </div>
        ) : (
          <canvas ref={canvasRef} className="flow-canvas" />
        )}

        <div className="flow-label flow-label-left">
          <div className="flow-label-k">Remaining in Orchard</div>
          <div className="flow-label-v orchard">
            {pools ? fmt(pools.orchard) : "\u2014"} <span>ZEC</span>
          </div>
        </div>
        <div className="flow-label flow-label-right">
          <div className="flow-label-k">Migrated to Ironwood</div>
          <div className="flow-label-v ironwood">
            {pools ? fmt(pools.ironwood) : "\u2014"} <span>ZEC</span>
          </div>
        </div>
      </div>

      {err ? (
        <div className="flow-err">
          Live balances briefly unavailable. The flow shows the shape of the
          migration; numbers refresh when the source returns.
        </div>
      ) : (
        <div className="flow-foot">
          Orchard stopped accepting deposits at the Ironwood upgrade. New shielded
          value now settles in Ironwood, so the pools trade places over time.
          Balances from CipherScan, refreshed each minute.
        </div>
      )}
    </div>
  );
}
