"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// A live observatory of the Zcash node network. A spinning globe plots every
// node location CipherScan observes; charts below break down clients, countries,
// and versions. Everything is live from /api/nodes and refreshes each minute.
//
// The globe is browser-only (needs WebGL); it loads with a calm fallback, and if
// it fails on a device the charts and stats still carry the whole story.

const Globe = dynamic(
  () => import("react-globe.gl").then((m) => {
    const Comp = m.default;
    const Wrapped = (props) => <Comp {...props} ref={props.globeRef} />;
    Wrapped.displayName = "GlobeWrapped";
    return Wrapped;
  }),
  { ssr: false }
);

const CLIENT_COLOR = { Zebra: "#3FB984", Zakura: "#E9B949", zcashd: "#E5564B", Unknown: "#8A938A" };
const fmt = (n) => (n == null ? "\u2014" : Number(n).toLocaleString("en-US"));

export default function Nodes() {
  const [data, setData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [err, setErr] = useState(null);
  const [globeReady, setGlobeReady] = useState(false);
  const globeRef = useRef(null);
  const wrapRef = useRef(null);
  const [size, setSize] = useState(420);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/nodes").then((r) => r.json()).then((d) => {
        if (!alive) return;
        if (d.error) setErr(d.error); else { setData(d); setErr(null); }
      }).catch((e) => alive && setErr(String(e)));
    load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/nodes/locations").then((r) => r.json()).then((d) => {
      if (alive && Array.isArray(d.locations)) setLocations(d.locations);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize(Math.min(el.clientWidth, 560)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!globeReady) return;
    const g = globeRef.current;
    if (!g) return;
    // Disable zoom; set a starting view.
    try {
      if (g.controls && g.controls()) g.controls().enableZoom = false;
      g.pointOfView({ lat: 22, lng: 10, altitude: 2.2 });
    } catch {}
    // Spin manually by advancing longitude each tick. Reliable across versions,
    // and a user drag simply moves it; spinning continues from wherever it lands.
    let lng = 10;
    const iv = setInterval(() => {
      lng = (lng + 0.3) % 360;
      try {
        const pov = g.pointOfView();
        g.pointOfView({ lat: pov.lat, lng, altitude: pov.altitude }, 0);
      } catch {}
    }, 50);
    return () => clearInterval(iv);
  }, [globeReady]);

  const points = locations.map((l) => ({ lat: l.lat, lng: l.lon, count: l.nodeCount || 1, country: l.country, ping: l.avgPingMs }));
  const maxCount = points.reduce((m, p) => Math.max(m, p.count), 1);

  return (
    <div className="obs">
      <div className="obs-stats">
        <Stat k="Active nodes" v={data ? fmt(data.activeNodes) : "\u2014"} live />
        <Stat k="Countries" v={data ? fmt(data.countries) : "\u2014"} />
        <Stat k="Coverage" v={data && data.coveragePercentage != null ? `${data.coveragePercentage}%` : "\u2014"} />
        <Stat k="Over Tor" v={data ? fmt(data.torNodes) : "\u2014"} />
      </div>

      <div className="obs-globe" ref={wrapRef}>
        {!globeReady && <div className="obs-globe-load">Plotting the network\u2026</div>}
        <Globe
          globeRef={globeRef}
          width={size}
          height={size}
          onGlobeReady={() => setGlobeReady(true)}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          atmosphereColor="#E9B949"
          atmosphereAltitude={0.16}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => "#E9B949"}
          pointAltitude={(d) => 0.02 + (d.count / maxCount) * 0.28}
          pointRadius={(d) => 0.24 + (d.count / maxCount) * 0.5}
          pointLabel={(d) => `<div style="font-family:monospace;font-size:11px;background:#0b0e0c;border:1px solid #252d26;padding:6px 9px;border-radius:6px;color:#eceae0"><b>${d.country}</b><br/>${d.count} nodes${d.ping ? ` \u00b7 ${Math.round(d.ping)}ms` : ""}</div>`}
        />
      </div>
      <p className="obs-globe-cap">Every point is a place where Zcash nodes were observed. Height and size track how many sit there. Drag to spin.</p>

      {err ? <div className="obs-err">Live node data briefly unavailable; retrying.</div> : null}

      <div className="obs-charts">
        <div className="obs-card">
          <div className="obs-card-h">Clients running the network</div>
          {data && data.distribution ? (
            <div className="obs-bars">
              {data.distribution.map((d) => {
                const max = Math.max(...data.distribution.map((x) => x.count), 1);
                return (
                  <div className="obs-bar" key={d.client}>
                    <span className="obs-bar-name" style={{ color: CLIENT_COLOR[d.client] || "#8A938A" }}>{d.client}</span>
                    <span className="obs-bar-track"><span className="obs-bar-fill" style={{ width: `${(d.count / max) * 100}%`, background: CLIENT_COLOR[d.client] || "#8A938A" }} /></span>
                    <span className="obs-bar-val">{fmt(d.count)}</span>
                  </div>
                );
              })}
            </div>
          ) : <div className="obs-skel" />}
        </div>

        <div className="obs-card">
          <div className="obs-card-h">Where the nodes are</div>
          {data && data.topCountries ? (
            <div className="obs-bars">
              {data.topCountries.slice(0, 7).map((c) => {
                const max = Math.max(...data.topCountries.map((x) => x.nodeCount), 1);
                return (
                  <div className="obs-bar" key={c.countryCode}>
                    <span className="obs-bar-name obs-country">{c.country}</span>
                    <span className="obs-bar-track"><span className="obs-bar-fill" style={{ width: `${(c.nodeCount / max) * 100}%`, background: "#5AA9E6" }} /></span>
                    <span className="obs-bar-val">{fmt(c.nodeCount)}</span>
                  </div>
                );
              })}
            </div>
          ) : <div className="obs-skel" />}
        </div>
      </div>

      <div className="obs-card">
        <div className="obs-card-h">Versions in the wild</div>
        {data && data.versions ? (
          <div className="obs-hist">
            {data.versions.slice(0, 12).map((v, i) => {
              const max = Math.max(...data.versions.map((x) => x.count), 1);
              return (
                <div className="obs-hist-col" key={i} title={`${v.client} ${v.version}: ${v.count}`}>
                  <div className="obs-hist-bar" style={{ height: `${(v.count / max) * 100}%`, background: CLIENT_COLOR[v.client] || "#8A938A" }} />
                  <div className="obs-hist-lbl">{v.version}</div>
                  <div className="obs-hist-cnt">{v.count}</div>
                </div>
              );
            })}
          </div>
        ) : <div className="obs-skel" />}
      </div>

      <p className="obs-foot">Live, observed by CipherScan&apos;s network crawler{data && data.coveragePercentage ? ` with ${data.coveragePercentage}% client coverage` : ""}. Node populations shift over hours and coverage is high but not total, so read this as a live sample of the network, not a perfect census.</p>
    </div>
  );
}

function Stat({ k, v, live }) {
  return (
    <div className="obs-stat">
      <div className="obs-stat-k">{live ? <span className="obs-dot" /> : null}{k}</div>
      <div className="obs-stat-v">{v}</div>
    </div>
  );
}
