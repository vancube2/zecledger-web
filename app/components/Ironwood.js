"use client";
import { useEffect, useState } from "react";

function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-US");
}

function human(seconds) {
  if (seconds == null) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `about ${d} day${d === 1 ? "" : "s"}, ${h} hour${h === 1 ? "" : "s"}`;
  if (h > 0) return `about ${h} hour${h === 1 ? "" : "s"}`;
  return "less than an hour";
}

function daysUntil(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

function Verdict({ ok, children }) {
  return (
    <span className={ok ? "iw-yes" : "iw-no"}>
      {ok ? "yes" : "no"}
      {children ? <span className="iw-detail">{children}</span> : null}
    </span>
  );
}

export default function Ironwood() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch("/api/ironwood")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="err">Could not load Ironwood status: {err}</div>;
  if (!data) return <div className="loading">Asking each server about Ironwood…</div>;

  const ready = data.servers.filter((s) => s.ready).length;
  const reachable = data.servers.filter((s) => s.reachable).length;

  return (
    <div>
      <p className="lede">
        Ironwood (NU6.3) adds a new shielded pool and a v6 transaction format, and
        the Orchard pool stops accepting new activity. Wallets and servers that are
        not ready will stop working. Nothing on this page is taken on trust: every
        figure below comes from asking a lightwalletd server directly, and each one
        is named.
      </p>

      <div className="grid c4" style={{ marginBottom: 20 }}>
        <div className="stat">
          <div className="v gold">
            {data.activated ? "LIVE" : fmt(data.blocksRemaining)}
          </div>
          <div className="k">
            {data.activated ? "ironwood is active" : "blocks until activation"}
          </div>
        </div>
        <div className="stat">
          <div className="v">{human(data.estimatedSecondsRemaining)}</div>
          <div className="k">estimated time left</div>
        </div>
        <div className="stat">
          <div className="v blue">{fmt(data.currentHeight)}</div>
          <div className="k">current mainnet height</div>
        </div>
        <div className="stat">
          <div className={ready > 0 ? "v green" : "v"}>
            {ready} / {reachable}
          </div>
          <div className="k">servers accepting ironwood</div>
        </div>
      </div>

      <div className="iw-table">
        <div className="iw-row iw-head">
          <span>Server</span>
          <span>Chain</span>
          <span>Height</span>
          <span>Protocol</span>
          <span>What it says</span>
          <span>What it does</span>
        </div>
        {data.servers.map((s) => (
          <div className="iw-row" key={s.label}>
            <span className="iw-name">{s.label}</span>
            {s.reachable ? (
              <>
                <span>{s.chainName || "—"}</span>
                <span>{fmt(s.blockHeight)}</span>
                <span>{s.protocolVersion || "—"}</span>
                <span>
                  {s.upgradeName
                    ? `${s.upgradeName} @ ${fmt(s.upgradeHeight)}`
                    : s.onIronwoodBranch
                      ? "on ironwood branch"
                      : "no upgrade pending"}
                </span>
                <span>
                  <Verdict ok={s.acceptsIronwood}>{s.probeDetail}</Verdict>
                </span>
              </>
            ) : (
              <span className="iw-unreachable" style={{ gridColumn: "2 / -1" }}>
                unreachable: {s.error}
              </span>
            )}
          </div>
        ))}
      </div>

      <NodeOperators data={data} />

      <p className="iw-foot">
        Each server is checked two ways. <b>What it says</b> is its own report
        through GetLightdInfo: the light wallet protocol version it serves and the
        next upgrade it knows about. <b>What it does</b> is the result of actually
        asking it for Ironwood subtree roots. A server can claim one and fail the
        other, so both are shown rather than folded into a single badge.
      </p>
      <p className="iw-foot">
        Mainnet activates at height {fmt(data.activationHeight)}, expected around
        13:00 UTC on 28 July 2026. Testnet activated at{" "}
        {fmt(data.testnetActivationHeight)} and is live now. Consensus branch id{" "}
        {data.upgrade.branchId}. Chain height from{" "}
        <b>{data.source || "no reachable mainnet server"}</b>. Time left assumes{" "}
        {data.targetBlockSeconds} second blocks, so it is an estimate. Checked{" "}
        {new Date(data.checkedAt).toUTCString()}
        {data.cached ? ", cached" : ""}.
      </p>
    </div>
  );
}

function NodeOperators({ data }) {
  const { nodes, snapshot } = data;
  if (!nodes) return null;

  const eolDays = daysUntil(nodes.zcashdEolUtc);
  const eolPassed = eolDays <= 0;

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3>If you run a node</h3>
      <p>
        zcashd will not implement NU6.3 at all. From activation, Zebra is the only
        full validator that can follow the Zcash chain. zcashd also reaches end of
        life on 18 July 2026,{" "}
        {eolPassed ? (
          <b className="iw-no">which has now passed.</b>
        ) : (
          <b className="iw-warn">
            which is {eolDays === 1 ? "tomorrow" : `in ${eolDays} days`}.
          </b>
        )}{" "}
        If you are still on zcashd, you need Zebra {nodes.zebraMinVersion} or later
        before {new Date(data.upgrade.mainnetActivationUtc).toUTCString()}.
      </p>

      {snapshot && snapshot.available ? (
        <>
          <div className="iw-snap">
            <div>
              <span className="iw-k">latest published snapshot</span>
              <span className="iw-v">height {fmt(snapshot.height)}</span>
            </div>
            <div>
              <span className="iw-k">state db format</span>
              <span className="iw-v">
                {snapshot.dbFormat}{" "}
                <Verdict ok={snapshot.ironwoodFormat}>
                  {snapshot.ironwoodFormat
                    ? "already the Ironwood format"
                    : "predates Ironwood, would need upgrading"}
                </Verdict>
              </span>
            </div>
            <div>
              <span className="iw-k">size</span>
              <span className="iw-v">{snapshot.size || "—"}</span>
            </div>
            <div>
              <span className="iw-k">published</span>
              <span className="iw-v">
                {snapshot.date ? new Date(snapshot.date).toUTCString() : "—"}
              </span>
            </div>
          </div>
          <p className="iw-foot" style={{ marginTop: 12 }}>
            Syncing Zebra from genesis takes days. ValarGroup publishes a daily
            chain-state snapshot at{" "}
            <a href={nodes.snapshotsSite} target="_blank" rel="noopener noreferrer">
              zebra.valargroup.dev
            </a>
            , which is the fast path onto Zebra before the deadline. We report what
            they publish and check one thing ourselves: whether the state format is
            the Ironwood one. Zebra {nodes.zebraMinVersion} uses format{" "}
            {nodes.ironwoodDbMajor}.0.0, so a snapshot at that major version is
            already in the right format.
          </p>
          <p className="iw-foot">
            <b>Read this before you use it.</b> This is a third party, not the Zcash
            Foundation. Their SHA256SUMS proves a download matches what they
            published. It does not prove the chain state inside is honest. Restoring
            a snapshot means trusting their state instead of validating the chain
            yourself. That may well be a fine trade for your situation, but it is
            your call to make, and it should be made knowingly.
          </p>
        </>
      ) : (
        <p className="iw-foot" style={{ marginTop: 12 }}>
          Could not read the published Zebra snapshot list
          {snapshot && snapshot.error ? `: ${snapshot.error}` : "."}
        </p>
      )}
    </div>
  );
}
