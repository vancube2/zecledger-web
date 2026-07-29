import Nav from "./Nav";

// The calm shell every preview page sits in. One column, generous margins, a
// quiet ledger footer. Pages pass a title and an optional dateline that render
// as a ledger entry header, so every page opens the same disciplined way.

export default function Shell({ title, kicker, dateline, children, wide }) {
  return (
    <div className="lx">
      <Nav />
      <main className={`lx-main${wide ? " is-wide" : ""}`}>
        {(title || kicker) && (
          <header className="lx-head">
            {kicker ? <div className="lx-kicker">{kicker}</div> : null}
            {title ? <h1 className="lx-title">{title}</h1> : null}
            {dateline ? <div className="lx-dateline">{dateline}</div> : null}
          </header>
        )}
        {children}
      </main>
      <footer className="lx-foot">
        <div className="lx-foot-inner">
          <span>ZecLedger · open source · a verifiable record of Zcash</span>
          <span>Public data only · no keys ever touch this site</span>
        </div>
      </footer>
    </div>
  );
}
