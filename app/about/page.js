import Shell from "../components/Shell";
import Link from "next/link";

export const metadata = { title: "About, ZecLedger" };

export default function AboutPage() {
  return (
    <Shell kicker="What this is" title="About ZecLedger.">
      <div className="lx-prose">
        <p>
          ZecLedger is a verifiable record of Zcash, and a private accounting
          tool for the people who hold it. It comes in two pieces, on purpose.
        </p>
        <p>
          <strong>This site is public.</strong> It reads only public data: the
          network, the shielded pools, the Ironwood migration, and a dated ledger
          of the events that shaped the chain. There is no wallet here, no keys,
          nothing sensitive to leak. Everything it shows can be checked against
          the sources it names.
        </p>
        <p>
          <strong>The command-line tool is private.</strong> Anything that
          touches your own funds runs there, on your own machine. It reads your
          balances, history, and cost basis from a viewing key that never leaves
          your computer and is never sent to any server, including ours. It takes
          a viewing key, never a spending key, so it can keep your books but
          cannot move a coin.
        </p>
        <p>
          The split is the point. Public things stay public and verifiable;
          private things stay on your machine. You do not have to trust either
          claim, because the whole project is open source. You can read the code.
        </p>
      </div>

      <div className="lx-about-links">
        <a href="https://github.com/vancube2/zecledger" target="_blank" rel="noreferrer" className="lx-cta">
          Read the code &rarr;
        </a>
        <Link href="/tools" className="lx-about-sec">See the tools</Link>
        <Link href="/ledger" className="lx-about-sec">Open the ledger</Link>
      </div>
    </Shell>
  );
}
