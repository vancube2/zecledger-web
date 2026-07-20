"use client";

// The Zcash node-client landscape after the zcashd sunset.
//
// This is a curated, sourced comparison, not a live probe. Node clients speak a
// JSON-RPC interface, and there is no open pool of public node RPC endpoints to
// query the way there is for lightwalletd servers, so a live board here would be
// pretending to a capability that does not exist. Every figure below is sourced,
// and any speed number is attributed to whoever measured it. The empty "our node"
// row is where a live panel will go if ZecLedger runs its own node.
//
// Sources:
//   Zebra 6.0.0 release, Zcash Foundation - zfnd.org/zebra-6-0-0-release
//   Zebra 6.0.0-rc.0 release notes - github.com/ZcashFoundation/zebra/releases
//   Zakura 1.0.0 announcement (Valar Group / Project Tachyon), reported by CoinDesk/LCX
//   End of Life, The zcashd Book - zcash.github.io/zcash/user/end-of-life.html

const NODES = [
  {
    name: "Zebra",
    by: "Zcash Foundation",
    version: "6.0.0",
    status: "active",
    ironwood: "yes",
    ironwoodNote: "Sets the mainnet activation height (3,428,143). Exposes the Ironwood pool through getblockchaininfo and the tree RPCs.",
    lang: "Rust, from scratch",
    sync: "Full validation from genesis. Days to sync without a snapshot.",
    note: "The official successor to zcashd. Signed pre-built binaries, build-provenance attestation. The safe default for a node you depend on.",
    tone: "green",
  },
  {
    name: "Zakura",
    by: "Valar Group / Project Tachyon",
    version: "1.0.0",
    status: "active",
    ironwood: "yes",
    ironwoodNote: "Supports Ironwood on mainnet from its first release.",
    lang: "Fork of Zebra's codebase",
    sync: "Claims ~4h 20m full sync vs ~20h 46m for Zebra in its own trace. Pruned snapshots (~11 GB) can bootstrap a node in minutes. Not independently reproduced.",
    note: "New as of 15 July 2026, maintained independently, funded by private ZEC donations. Named in the official zcash/zcash repo as a successor node. Keeps a zcashd RPC compatibility mode.",
    tone: "gold",
  },
  {
    name: "zcashd",
    by: "Electric Coin Co. (legacy)",
    version: "6.20.0",
    status: "retired",
    ironwood: "no",
    ironwoodNote: "Does not and will not support NU6.3.",
    lang: "C++, forked from Bitcoin Core",
    sync: "N/A. Halted at block 3,417,100 on 18 July 2026 and refuses to restart.",
    note: "The original node that ran Zcash for nearly a decade. Retired by a coded End-of-Support halt, deliberately set before Ironwood so the network would be Zebra-only at activation.",
    tone: "red",
  },
];

function Verdict({ v }) {
  if (v === "yes") return <span className="nd-yes">yes</span>;
  if (v === "no") return <span className="nd-no">no</span>;
  return <span className="nd-dim">{v}</span>;
}

export default function Nodes() {
  return (
    <div>
      <p className="lede">
        When zcashd halted on 18 July 2026, the software running Zcash changed
        hands. This is a plain comparison of the node clients that follow the
        chain now, drawn from each project&apos;s own release notes and the
        official Zcash sources. It is a sourced summary rather than a live probe:
        node clients are queried over a private RPC interface, so unlike the
        lightwalletd servers on the Ironwood board, there is no open pool of node
        endpoints to check in real time.
      </p>

      <div className="nd-grid">
        {NODES.map((n) => (
          <div className={`nd-card nd-${n.tone}`} key={n.name}>
            <div className="nd-head">
              <div>
                <span className="nd-name">{n.name}</span>
                <span className="nd-by">{n.by}</span>
              </div>
              <span className={`nd-status nd-status-${n.tone}`}>
                {n.status === "retired" ? "retired" : "active"}
              </span>
            </div>

            <div className="nd-rows">
              <div className="nd-row">
                <span className="nd-k">Version</span>
                <span className="nd-v">{n.version}</span>
              </div>
              <div className="nd-row">
                <span className="nd-k">Ironwood</span>
                <span className="nd-v">
                  <Verdict v={n.ironwood} />
                </span>
              </div>
              <div className="nd-row">
                <span className="nd-k">Built in</span>
                <span className="nd-v">{n.lang}</span>
              </div>
            </div>

            <p className="nd-detail">
              <span className="nd-detail-k">On Ironwood.</span> {n.ironwoodNote}
            </p>
            <p className="nd-detail">
              <span className="nd-detail-k">Sync.</span> {n.sync}
            </p>
            <p className="nd-note">{n.note}</p>
          </div>
        ))}

        {/* The slot A fills. Honest about being empty rather than faking a probe. */}
        <div className="nd-card nd-ours">
          <div className="nd-head">
            <div>
              <span className="nd-name">Our node</span>
              <span className="nd-by">ZecLedger</span>
            </div>
            <span className="nd-status nd-status-soon">planned</span>
          </div>
          <p className="nd-ours-body">
            ZecLedger&apos;s public data currently comes from third-party
            lightwalletd servers. A natural next step is to run our own Zebra or
            Zakura node, so this dashboard&apos;s figures come first-hand rather
            than on trust. When that node exists, this card becomes a live panel:
            its own height, sync state, and Ironwood readiness, read straight from
            the node we run.
          </p>
          <span className="nd-ours-tag">Not live yet. Shown so the gap is visible, not hidden.</span>
        </div>
      </div>

      <p className="nd-foot">
        Sourced from the Zebra 6.0.0 release (Zcash Foundation), the Zebra
        6.0.0-rc.0 release notes, the Zakura 1.0.0 announcement, and the End of
        Life page in the zcashd Book. Zakura&apos;s sync figures are the
        project&apos;s own published benchmarks and have not been independently
        reproduced. Different node software following identical consensus rules is
        healthy for the network; more than one implementation reduces the risk of
        a single point of failure.
      </p>
    </div>
  );
}
