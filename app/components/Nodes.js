"use client";

// The Zcash node-client landscape after the zcashd sunset, with where it is
// heading. Curated and sourced, not a live probe: node clients speak a private
// RPC interface and there is no open pool of node endpoints to query the way
// there is for lightwalletd servers.
//
// Two changes from the earlier version: the speculative "our node" slot is gone,
// and a sourced roadmap layer (Tachyon) is added, because the three clients are
// not just three implementations, they sit on a trajectory.
//
// Sources:
//   Zebra 6.0.0 release, Zcash Foundation
//   Zakura 1.0.0 announcement (Valar Group / Project Tachyon)
//   End of Life, The zcashd Book
//   Project Tachyon overview and roadmap (tachyon.z.cash)
//   Sean Bowe, "Tachyon: Scaling Zcash with Oblivious Synchronization"

const NODES = [
  {
    name: "Zebra",
    by: "Zcash Foundation",
    version: "6.0.0",
    status: "active",
    ironwood: "yes",
    lang: "Rust, from scratch",
    note: "The official successor to zcashd and the reference full validator through Ironwood. Signed binaries, build-provenance attestation. The safe default for a node you depend on.",
    tone: "green",
  },
  {
    name: "Zakura",
    by: "Valar Group / Project Tachyon",
    version: "1.0.0",
    status: "active",
    ironwood: "yes",
    lang: "Fork of Zebra's codebase",
    note: "New as of 15 July 2026, maintained independently, funded by private ZEC donations. Built for fast sync and small footprint through pruning and snapshots. Its collaboration with Project Tachyon makes it an early taste of where node design is heading.",
    tone: "gold",
  },
  {
    name: "zcashd",
    by: "Electric Coin Co. (legacy)",
    version: "6.20.0",
    status: "retired",
    ironwood: "no",
    lang: "C++, forked from Bitcoin Core",
    note: "The original node that ran Zcash for nearly a decade. Retired by a coded end-of-support halt at block 3,417,100 on 18 July 2026, deliberately set before Ironwood so the network would be Zebra-only at activation.",
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
        hands. This is a sourced comparison of the node clients that follow the
        chain now, drawn from each project&apos;s own release notes and the
        official Zcash sources. It is a summary rather than a live probe: node
        clients answer over a private RPC interface, so unlike the lightwalletd
        servers on the migration side, there is no open pool of node endpoints to
        check in real time.
      </p>

      <div className="nd-grid nd-grid-3">
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
                <span className="nd-v"><Verdict v={n.ironwood} /></span>
              </div>
              <div className="nd-row">
                <span className="nd-k">Built in</span>
                <span className="nd-v">{n.lang}</span>
              </div>
            </div>
            <p className="nd-note">{n.note}</p>
          </div>
        ))}
      </div>

      {/* Where this is heading: the sourced roadmap layer */}
      <div className="nd-roadmap">
        <div className="nd-roadmap-head">
          <span className="nd-roadmap-eyebrow">Where this is heading</span>
          <span className="nd-roadmap-sub">Project Tachyon</span>
        </div>
        <p>
          The three clients are not just three implementations; they sit on a
          trajectory. Project Tachyon, the scaling effort led by cryptographer
          Sean Bowe (also behind Zakura), is redesigning how nodes and wallets
          talk. Its core idea is <strong>oblivious synchronization</strong>: a
          remote service builds a proof that your funds are unspent without ever
          learning what it is looking at, so wallets stop scanning and
          trial-decrypting the whole chain to find their own notes.
        </p>
        <p>
          Underneath it uses <strong>proof-carrying data</strong> to let block
          producers aggregate shielded transactions and to let nodes prune state
          they would otherwise store forever. In plain terms, the cost of privacy
          moves off the user and the node operator: wallets carry proofs, nodes
          keep less history. Zakura&apos;s pruning and snapshots are an early,
          shippable taste of that direction.
        </p>
        <p className="nd-roadmap-caveat">
          Stated plainly, because it is the honest part: Tachyon is on testnet,
          not shipped, and Zcash&apos;s own engineers are the first to say the
          network is not there yet. This is a roadmap with real primitives, not a
          finished result. It is recorded here as direction, not as a claim of
          arrival.
        </p>
      </div>

      <p className="nd-foot">
        Sourced from the Zebra 6.0.0 release, the Zakura 1.0.0 announcement, the
        End of Life page in the zcashd Book, and Project Tachyon&apos;s own
        overview and roadmap. Zakura&apos;s published sync figures are the
        project&apos;s own and have not been independently reproduced. More than
        one implementation following identical consensus rules reduces the risk of
        a single point of failure.
      </p>
    </div>
  );
}
