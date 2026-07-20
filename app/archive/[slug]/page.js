import Link from "next/link";
import { notFound } from "next/navigation";
import { getEntry, getAllSlugs } from "../../../lib/archive";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const entry = getEntry(params.slug);
  if (!entry) return { title: "Not found — ZecLedger archive" };
  return {
    title: `${entry.title} — ZecLedger archive`,
    description: entry.summary || undefined,
  };
}

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

export default function ArchiveEntry({ params }) {
  const entry = getEntry(params.slug);
  if (!entry) notFound();

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
              href="/archive"
              style={{ color: "var(--dim)", textDecoration: "none", letterSpacing: ".12em" }}
            >
              ← all entries
            </Link>
          </div>
        </div>
      </header>

      <div className="wrap">
        <article className="arc-article">
          <div className="arc-meta">
            {entry.date ? <span>{fmtDate(entry.date)}</span> : null}
            {entry.tags.map((t) => (
              <span key={t} className="arc-tag">
                {t}
              </span>
            ))}
          </div>
          <h1 className="arc-h1">{entry.title}</h1>
          {entry.summary ? <p className="arc-lede">{entry.summary}</p> : null}

          <div
            className="arc-prose"
            dangerouslySetInnerHTML={{ __html: entry.html }}
          />

          {entry.sources.length > 0 ? (
            <div className="arc-sources">
              <h4>Sources</h4>
              <ol>
                {entry.sources.map((s, i) => (
                  <li key={i}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.label || s.url}
                      </a>
                    ) : (
                      s.label || s
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </article>
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
          <span>Written in the open. Corrections welcome via GitHub.</span>
        </div>
      </footer>
    </>
  );
}
