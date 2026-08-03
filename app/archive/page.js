import Shell from "../components/Shell";
import Link from "next/link";
import { getAllEntries } from "../../lib/archive";

export const metadata = { title: "Archive, ZecLedger" };

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
}

export default function ArchiveIndex() {
  const entries = getAllEntries();
  return (
    <Shell
      wide
      title="Archive"
    >
      {entries.length === 0 ? (
        <div className="lx-placeholder">No entries yet.</div>
      ) : (
        <>
          <div className="lx-ledger-head">
            <span>Date</span><span>Entry</span><span>Format</span>
          </div>
          <div className="lx-ledger">
            {entries.map((e) => (
              <Link key={e.slug} href={`/archive/${e.slug}`} className="lx-row">
                <span className="lx-row-date">{fmtDate(e.date)}</span>
                <span className="lx-row-entry">
                  {e.title}
                  {e.summary ? <small>{e.summary}</small> : null}
                </span>
                <span className="lx-row-result">{e.format === "html" ? "essay" : "note"}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
