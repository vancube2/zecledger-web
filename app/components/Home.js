"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import About from "./About";
import Ironwood from "./Ironwood";
import ShieldRate from "./ShieldRate";
import NetStats from "./NetStats";
import AddressLookup from "./AddressLookup";

// Ironwood mainnet activation. The real trigger is a block height, 3,428,143;
// the time is approximate ("around 8am Eastern, 28 July 2026"), so the countdown
// is labelled as an estimate rather than presented as exact.
const ACTIVATION_ISO = "2026-07-28T12:00:00Z";
const ACTIVATION_BLOCK = "3,428,143";

// Tools live as tabs below the composed story. Address lookup in particular is a
// tool you operate, not a section you scroll past, so it belongs here.
const TOOLS = [
  { id: "network", label: "Network & fees", el: <NetStats /> },
  { id: "shield", label: "Shield rate", el: <ShieldRate /> },
  { id: "address", label: "Address lookup", el: <AddressLookup /> },
  { id: "about", label: "About", el: <About /> },
];

function useCountdown(targetIso) {
  // `mounted` stays false through the server render and the first client render,
  // so both agree and there is no hydration mismatch. The live clock only starts
  // ticking after mount, purely on the client.
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return { ready: false };

  const target = new Date(targetIso).getTime();
  const diff = target - now;
  if (diff <= 0) return { ready: true, passed: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { ready: true, passed: false, days, hours, mins, secs };
}

function Countdown() {
  const c = useCountdown(ACTIVATION_ISO);

  const cell = (v, k) => (
    <div className="cd-cell">
      <span className="cd-num">{v}</span>
      <span className="cd-unit">{k}</span>
    </div>
  );

  // Before mount, render a stable placeholder that matches on server and client.
  // The two dots stand in for the clock until it starts ticking in the browser.
  if (!c.ready) {
    return (
      <div className="cd-band">
        <div className="cd-kicker">
          Ironwood · NU6.3 activates at block {ACTIVATION_BLOCK}
        </div>
        <div className="cd-clock" suppressHydrationWarning>
          {cell("··", "days")}
          <span className="cd-sep">:</span>
          {cell("··", "hrs")}
          <span className="cd-sep">:</span>
          {cell("··", "min")}
          <span className="cd-sep">:</span>
          {cell("··", "sec")}
        </div>
        <div className="cd-note">
          Estimated. The upgrade triggers on a block height, not a clock, so the
          exact moment drifts with block times. When it lands, the Orchard pool
          freezes and a fresh shielded pool opens.
        </div>
      </div>
    );
  }

  if (c.passed) {
    return (
      <div className="cd-band">
        <div className="cd-kicker">Ironwood · NU6.3</div>
        <div className="cd-live">Activated</div>
        <div className="cd-note">
          Ironwood activated at block {ACTIVATION_BLOCK} on 28 July 2026. The
          readiness board below now reads the network after the upgrade.
        </div>
      </div>
    );
  }

  const pad = (v) => String(v).padStart(2, "0");

  return (
    <div className="cd-band">
      <div className="cd-kicker">Ironwood · NU6.3 activates at block {ACTIVATION_BLOCK}</div>
      <div className="cd-clock">
        {cell(pad(c.days), "days")}
        <span className="cd-sep">:</span>
        {cell(pad(c.hours), "hrs")}
        <span className="cd-sep">:</span>
        {cell(pad(c.mins), "min")}
        <span className="cd-sep">:</span>
        {cell(pad(c.secs), "sec")}
      </div>
      <div className="cd-note">
        Estimated. The upgrade triggers on a block height, not a clock, so the
        exact moment drifts with block times. When it lands, the Orchard pool
        freezes and a fresh shielded pool opens.
      </div>
    </div>
  );
}

function ArchiveTeaser({ latest }) {
  if (!latest) return null;
  const date = latest.date
    ? new Date(latest.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  return (
    <section className="home-section">
      <div className="section-head">
        <span className="section-eyebrow">The archive</span>
        <Link href="/archive" className="section-link">
          All entries →
        </Link>
      </div>
      <Link href={`/archive/${latest.slug}`} className="teaser">
        {date ? <div className="teaser-date">{date}</div> : null}
        <h3 className="teaser-title">{latest.title}</h3>
        {latest.summary ? <p className="teaser-summary">{latest.summary}</p> : null}
        <span className="teaser-cta">Read the entry →</span>
      </Link>
    </section>
  );
}

function LocalTool() {
  return (
    <section className="home-section">
      <div className="section-head">
        <span className="section-eyebrow">The local tool</span>
        <a
          className="section-link"
          href="https://github.com/vancube2/zecledger"
          target="_blank"
          rel="noreferrer"
        >
          On GitHub →
        </a>
      </div>
      <p className="section-lede">
        This dashboard only ever touches public data. Anything involving your own
        shielded funds runs in the ZecLedger command-line tool on your own
        machine, where your viewing key never leaves the computer and is never
        sent to any server, including ours.
      </p>
      <div className="cli-grid">
        <div className="cli-item">
          <div className="cli-k">Private accounting</div>
          <p>
            Balances, history and cost basis for your own shielded ZEC, computed
            locally from your viewing key. FIFO, LIFO or average cost.
          </p>
        </div>
        <div className="cli-item">
          <div className="cli-k">Reports you can file</div>
          <p>
            Monthly summaries and a full ledger, written as CSV, JSON or Markdown,
            with a plain record of where each file lands.
          </p>
        </div>
        <div className="cli-item">
          <div className="cli-k">Privacy check</div>
          <p>
            An honest read of your own pool usage and amounts, with the plain
            caveat that a clean report is not a guarantee.
          </p>
        </div>
        <div className="cli-item">
          <div className="cli-k">Read-only by design</div>
          <p>
            It takes a viewing key, never a spending key, so it can read your
            history and produce books but cannot move a coin.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Home({ latest }) {
  const [tab, setTab] = useState("network");

  return (
    <>
      <header>
        <div className="masthead">
          <div className="brand">
            ZecLedger
            <small>Zcash privacy dashboard</small>
          </div>
          <nav className="topnav">
            <Link href="/archive" className="topnav-link">
              Archive
            </Link>
            <span className="live">
              <span className="dot" />
              LIVE · PUBLIC DATA · NO KEYS
            </span>
          </nav>
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

        <Countdown />

        <section className="home-section">
          <div className="section-head">
            <span className="section-eyebrow">Ironwood readiness</span>
          </div>
          <Ironwood />
        </section>

        <ArchiveTeaser latest={latest} />

        <LocalTool />

        <section className="home-section">
          <div className="section-head">
            <span className="section-eyebrow">Public tools</span>
          </div>
          <div className="tabs">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                className={`tab${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="panelwrap">{TOOLS.find((t) => t.id === tab).el}</div>
        </section>
      </div>

      <footer>
        <div className="foot">
          <span>
            ZecLedger · open source ·{" "}
            <a
              href="https://github.com/vancube2/zecledger"
              target="_blank"
              rel="noreferrer"
            >
              github.com/vancube2/zecledger
            </a>
            {" · "}
            <Link href="/archive">archive</Link>
          </span>
          <span>
            Public data via Blockchair · shield-rate figures are floors, not totals
          </span>
        </div>
      </footer>
    </>
  );
}
