import Shell from "../../components/Shell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getEntry } from "../../../lib/archive";
import ArchiveFrame from "../../components/ArchiveFrame";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const e = getEntry(params.slug);
  return { title: e ? `${e.title}, ZecLedger` : "Not found" };
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch { return iso; }
}

export default function ArchiveDetail({ params }) {
  const e = getEntry(params.slug);
  if (!e) notFound();

  // HTML essays render in an isolated frame, preserving their own design.
  if (e.format === "html") {
    return (
      <Shell wide>
        <div className="lx-back" style={{ marginBottom: 20 }}>
          <Link href="/archive">&larr; all entries</Link>
        </div>
        <ArchiveFrame html={e.document} title={e.title} />
        <p className="arc-frame-note">
          {e.title} {e.date ? `\u00b7 ${fmtDate(e.date)}` : ""} \u00b7 an archived
          research piece, shown in its original form.
        </p>
      </Shell>
    );
  }

  // Markdown notes render inline in the site's styling.
  return (
    <Shell kicker={`Archive \u00b7 ${fmtDate(e.date)}`} title={e.title} dateline={e.summary}>
      <div className="lx-back">
        <Link href="/archive">&larr; all entries</Link>
      </div>
      <div className="lx-prose arc-prose" dangerouslySetInnerHTML={{ __html: e.html }} />
      {e.sources && e.sources.length ? (
        <div className="lx-sources">
          <h4>Sources</h4>
          <ol>
            {e.sources.map((s, i) => (
              <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a> : s.label}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </Shell>
  );
}
