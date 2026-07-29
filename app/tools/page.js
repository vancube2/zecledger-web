"use client";
import { useState } from "react";
import Shell from "../components/Shell";
import AddressLookup from "../components/AddressLookup";
import ShieldRate from "../components/ShieldRate";
import NetStats from "../components/NetStats";
import Nodes from "../components/Nodes";

// Tools: the CLI leads (the real private engine), then the public web tools.
// The split is the identity: the CLI runs on your machine and touches your keys;
// the web tools read only public data.

const WEB_TOOLS = [
  { id: "address", label: "Address lookup", el: <AddressLookup /> },
  { id: "shield", label: "Shield rate", el: <ShieldRate /> },
  { id: "network", label: "Network & fees", el: <NetStats /> },
  { id: "nodes", label: "Node clients", el: <Nodes /> },
];

function ToolsInner() {
  const [tab, setTab] = useState("address");
  return (
    <>
      {/* CLI, the lead */}
      <section className="tl-cli">
        <div className="tl-cli-head">
          <span className="tl-cli-eyebrow">The command-line tool</span>
          <a
            className="tl-cli-git"
            href="https://github.com/vancube2/zecledger"
            target="_blank"
            rel="noreferrer"
          >
            github.com/vancube2/zecledger
          </a>
        </div>

        <p className="tl-cli-lede">
          The real work happens here. The ZecLedger command-line tool runs on your
          own machine and does the private accounting: it reads your shielded
          balances, history, and cost basis from your viewing key, locally. The
          key never leaves your computer and is never sent to any server,
          including ours.
        </p>

        <div className="tl-console">
          <div className="tl-console-line"><span className="tl-p">$</span> cargo install zecledger</div>
          <div className="tl-console-line"><span className="tl-p">$</span> zecledger balance</div>
          <div className="tl-console-out">  Sapling      0.00000000 ZEC</div>
          <div className="tl-console-out">  Orchard      2.13990000 ZEC</div>
          <div className="tl-console-out tl-gold">  Ironwood     0.00000000 ZEC</div>
          <div className="tl-console-out">  Transparent  0.00000000 ZEC</div>
        </div>

        <div className="tl-cli-grid">
          <div className="tl-cli-item">
            <div className="tl-cli-k">Private accounting</div>
            <p>Balances across every pool including Ironwood, history, and cost basis. FIFO, LIFO, or average cost.</p>
          </div>
          <div className="tl-cli-item">
            <div className="tl-cli-k">Reports you can file</div>
            <p>Monthly summaries and a full ledger, written as CSV, JSON, or Markdown, with a clear record of where each file lands.</p>
          </div>
          <div className="tl-cli-item">
            <div className="tl-cli-k">Privacy check</div>
            <p>An honest read of your own pool usage and amounts, with the plain caveat that a clean report is not a guarantee.</p>
          </div>
          <div className="tl-cli-item">
            <div className="tl-cli-k">Read-only by design</div>
            <p>It takes a viewing key, never a spending key, so it can read your history and produce books but cannot move a coin.</p>
          </div>
        </div>
      </section>

      {/* Public web tools */}
      <section style={{ marginTop: 20 }}>
        <div className="lx-head" style={{ marginBottom: 24 }}>
          <div className="lx-kicker">Public web tools</div>
          <p className="lx-prose" style={{ marginTop: 8 }}>
            These read only public data, right here in the browser. No keys, no
            wallet, nothing to leak.
          </p>
        </div>

        <div className="tabs">
          {WEB_TOOLS.map((t) => (
            <button
              key={t.id}
              className={`tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="panelwrap">{WEB_TOOLS.find((t) => t.id === tab).el}</div>
      </section>
    </>
  );
}

export default function ToolsPage() {
  return (
    <Shell wide kicker="Everything you can use" title="Tools." dateline="The command-line tool leads. Public web tools follow.">
      <ToolsInner />
    </Shell>
  );
}
