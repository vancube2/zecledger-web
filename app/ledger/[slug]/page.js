import Shell from "../../components/Shell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLedger, getLedgerEntry } from "../../../lib/ledger";
import { getEntry as getArchiveEntry } from "../../../lib/archive";

export function generateStaticParams() {
  return getLedger().map((e) => ({ slug: e.slug }));
}

export function generateMetadata({ params }) {
  const e = getLedgerEntry(params.slug);
  return { title: e ? `${e.entry}, ZecLedger` : "Not found" };
}

export default function LedgerDetail({ params }) {
  const e = getLedgerEntry(params.slug);
  if (!e) notFound();

  // If the entry points at an archive markdown piece, render that long-form.
  let archiveHtml = null;
  if (e.archive) {
    const a = getArchiveEntry(e.archive);
    if (a) archiveHtml = a.html;
  }

  return (
    <Shell
      kicker={`Ledger entry \u00b7 ${e.date}`}
      title={e.entry}
      dateline={e.summary}
    >
      <div className="lx-back">
        <Link href="/ledger">&larr; all entries</Link>
      </div>

      {e.body ? (
        <div className="lx-prose">
          {e.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : null}

      {archiveHtml ? (
        <>
          {e.archiveNote ? <p className="lx-prose">{e.archiveNote}</p> : null}
          <div className="lx-prose arc-prose" dangerouslySetInnerHTML={{ __html: archiveHtml }} />
        </>
      ) : null}

      {e.link ? (
        <div style={{ marginTop: 30 }}>
          <Link href={e.link} className="lx-cta">{e.linkLabel || "Open"} &rarr;</Link>
        </div>
      ) : null}

      {e.sources && e.sources.length ? (
        <div className="lx-sources">
          <h4>Sources</h4>
          <ol>
            {e.sources.map((s, i) => (
              <li key={i}>
                {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a> : s.label}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </Shell>
  );
}
