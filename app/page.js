"use client";
import { useState } from "react";
import About from "./components/About";
import Ironwood from "./components/Ironwood";
import ShieldRate from "./components/ShieldRate";
import NetStats from "./components/NetStats";
import AddressLookup from "./components/AddressLookup";

const TABS = [
  { id: "about", label: "About", el: <About /> },
  { id: "ironwood", label: "Ironwood ·  NU6.3", el: <Ironwood /> },
  { id: "shield", label: "Shield rate", el: <ShieldRate /> },
  { id: "network", label: "Network & fees", el: <NetStats /> },
  { id: "address", label: "Address lookup", el: <AddressLookup /> },
];

export default function Page() {
  const [tab, setTab] = useState("about");

  return (
    <>
      <header>
        <div className="masthead">
          <div className="brand">
            ZecLedger
            <small>Zcash privacy dashboard</small>
          </div>
          <div className="live">
            <span className="dot" />
            LIVE · PUBLIC DATA · NO KEYS
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="hero">
          <div className="kicker">Open-source Zcash research and accounting</div>
          <h1>
            How private is Zcash, <span className="it">right now?</span>
          </h1>
          <p className="sub">
            A live look at the shield rate, network health, and any transparent
            address. This dashboard only ever touches public data. For private
            accounting on your own shielded addresses, use the local ZecLedger
            tool, where your keys never leave your machine.
          </p>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="panelwrap">{TABS.find((t) => t.id === tab).el}</div>
      </div>

      <footer>
        <div className="foot">
          <span>
            ZecLedger · open source ·{" "}
            <a href="https://github.com/vancube2/zecledger" target="_blank" rel="noreferrer">
              github.com/vancube2/zecledger
            </a>
          </span>
          <span>
            Public data via Blockchair · shield-rate figures are floors, not totals
          </span>
        </div>
      </footer>
    </>
  );
}
