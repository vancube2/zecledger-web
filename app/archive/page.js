import Link from "next/link";
import { getAllEntries } from "../../lib/archive";

export const metadata = {
  title: "Archive — ZecLedger",
  description:
    "A record of the Zcash ecosystem as it changes: node transitions, network upgrades, and the moments worth remembering.",
};

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ArchivePage() {
  const entries = getAllEntries();

  return (
    <>
      <header>
        <div className="masthead">
          <div className="brand">
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
              ZecLedger
            </Link>
            <small>The archive</small>
          </div>
          <div className="live">
            <Link
              href="/"
              style={{ color: "var(--dim)", textDecoration: "none", letterSpacing: ".12em" }}
            >
              ← back to dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="hero">
          <div className="kicker">The archive</div>
          <h1>
            The Zcash record, <span className="it">kept.</span>
          </h1>
          <p className="sub">
            Networks change and old software is retired, but the reasons behind a
            change are worth keeping. This is a plain, sourced record of how Zcash
            moved from one era to the next, written as it happened.
          </p>
        </div>

        <div className="panelwrap">
          {entries.length === 0 ? (
            <div className="loading">No entries yet.</div>
          ) : (
            <div className="arc-list">
              {entries.map((e) => (
                <Link key={e.slug} href={`/archive/${e.slug}`} className="arc-item">
                  <div className="arc-date">{fmtDate(e.date)}</div>
                  <div className="arc-body">
                    <h3 className="arc-title">{e.title}</h3>
                    {e.summary ? <p className="arc-summary">{e.summary}</p> : null}
                    {e.tags.length > 0 ? (
                      <div className="arc-tags">
                        {e.tags.map((t) => (
                          <span key={t} className="arc-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
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
          </span>
          <span>The archive is written in the open and sourced inline.</span>
        </div>
      </footer>
    </>
  );
}
