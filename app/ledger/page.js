import Shell from "../components/Shell";
import Link from "next/link";
import { getLedger } from "../../lib/ledger";

export const metadata = { title: "Ledger, ZecLedger" };

export default function LedgerIndex() {
  const entries = getLedger();
  return (
    <Shell
      wide
      kicker="The ledger"
      title="A dated record of the Zcash chain."
      dateline="Each entry is sourced. Click one for the detail."
    >
      <div className="lx-ledger-head">
        <span>Date</span><span>Entry</span><span>Status</span>
      </div>
      <div className="lx-ledger">
        {entries.map((e) => (
          <Link key={e.slug} href={`/ledger/${e.slug}`} className="lx-row">
            <span className="lx-row-date">{e.date}</span>
            <span className="lx-row-entry">{e.entry}<small>{e.summary}</small></span>
            <span className={`lx-row-result ${e.tag}`}>{e.tag}</span>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
