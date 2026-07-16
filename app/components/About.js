"use client";

export default function About() {
  return (
    <div>
      <div className="card">
        <h3>What ZecLedger is</h3>
        <div className="src">open source · built privacy-first</div>
        <p style={{ color: "#c4c8c0", fontSize: "1.02rem", maxWidth: 720, marginBottom: 14 }}>
          ZecLedger is a free, open-source tool for understanding and keeping
          accounts on Zcash. It answers two kinds of questions: how the Zcash
          network is doing as a whole, and what is happening with a specific set
          of addresses. It is built so that the private things stay private.
        </p>
        <p style={{ color: "#c4c8c0", fontSize: "1.02rem", maxWidth: 720 }}>
          It comes in two pieces, on purpose. One is public and safe to use from
          a browser. The other runs on your own machine, for anything that
          touches your private keys.
        </p>
      </div>

      <div className="grid c2" style={{ marginBottom: 20 }}>
        <div className="stat" style={{ padding: "26px 24px" }}>
          <div className="k" style={{ color: "var(--green)", marginTop: 0, marginBottom: 10 }}>
            This dashboard · public, no keys
          </div>
          <p style={{ color: "#c4c8c0", fontSize: ".95rem" }}>
            What you are looking at now. It reads only public Zcash data: the
            live shield rate, network and fee health, and the history of any
            transparent address. It never asks for a key or a login, and it
            cannot see inside the shielded pool. Open the link, get answers.
          </p>
        </div>
        <div className="stat" style={{ padding: "26px 24px" }}>
          <div className="k" style={{ color: "var(--gold)", marginTop: 0, marginBottom: 10 }}>
            The local tool · private, keys stay with you
          </div>
          <p style={{ color: "#c4c8c0", fontSize: ".95rem" }}>
            A separate tool you run on your own computer. It handles your own
            shielded balances, private accounting and payments. Your viewing key
            never leaves your machine and is never sent to any server, including
            ours. Privacy you do not have to take on trust.
          </p>
        </div>
      </div>

      <div className="card">
        <h3>What you can do with it</h3>
        <div className="src">today and coming soon</div>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr", maxWidth: 760 }}>
          <Use label="Research the network" live>
            Track the real shield rate, watch how much value is entering or
            leaving the shielded pool, and follow fees and network health over
            time. The same data behind our public research reports.
          </Use>
          <Use label="Account for transparent addresses" live>
            Look up the balance and full history of any transparent (t) address,
            yours or anyone&apos;s, since that data is public by design.
          </Use>
          <Use label="Private accounting on your own ZEC" >
            See your own shielded balances and history, computed locally from
            your viewing key, with nothing leaving your machine. In the local
            tool.
          </Use>
          <Use label="Payments and bookkeeping">
            Track payments, fees and simple books for individuals and small
            projects that use ZEC. In the local tool.
          </Use>
        </div>
      </div>

      <div className="privacy-note" style={{ marginBottom: 20 }}>
        <b>How it keeps you safe.</b> The public dashboard only ever touches
        public data, so there is nothing sensitive to leak. Your browser makes no
        requests to any third party while you are here, not even for fonts, so
        the fact that you read this page is not shared with anyone. Anything
        involving your keys runs locally in the tool you control, never on a
        server. The code is open source, so you do not have to trust a claim, you
        can read it.
      </div>

      <div className="card">
        <h3>Who it is for</h3>
        <div className="src">and why it exists</div>
        <p style={{ color: "#c4c8c0", fontSize: ".98rem", maxWidth: 720 }}>
          For Zcash users who want clear, honest answers about their own
          activity and the network, for researchers who want reproducible
          privacy metrics instead of marketing numbers, and for builders who
          want a base to work from. ZecLedger started as a research project and
          is growing into a full accounting tool, in step with where Zcash
          itself is heading.
        </p>
        <div className="note">
          Open source at{" "}
          <a href="https://github.com/vancube2/zecledger" target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>
            github.com/vancube2/zecledger
          </a>
          . Public data shown here comes from Blockchair. Shield-rate figures are
          floors, not totals, because fully private transactions cannot be seen
          from outside the pool.
        </div>
      </div>
    </div>
  );
}

function Use({ label, live, children }) {
  return (
    <div style={{ borderLeft: "2px solid var(--line)", paddingLeft: 16 }}>
      <div style={{ fontFamily: "var(--font-mono),monospace", fontSize: ".72rem", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--paper)", marginBottom: 5, display: "flex", alignItems: "center", gap: 10 }}>
        {label}
        <span style={{ fontSize: ".58rem", padding: "2px 8px", borderRadius: 3, background: live ? "rgba(63,185,132,.15)" : "rgba(233,185,73,.15)", color: live ? "var(--green)" : "var(--gold)", letterSpacing: ".08em" }}>
          {live ? "LIVE" : "COMING"}
        </span>
      </div>
      <p style={{ color: "var(--dim)", fontSize: ".92rem", margin: 0 }}>{children}</p>
    </div>
  );
}
