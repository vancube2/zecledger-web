"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// The ledger's masthead. A slim, monospace nav that reads like the header row of
// a ledger: the name, a volume/era marker, and the pages. Gold is spent only on
// the active page, nowhere else here.

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/ledger", label: "Ledger" },
  { href: "/archive", label: "Archive" },
  { href: "/migration", label: "Migration" },
  { href: "/tools", label: "Tools" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <header className="lx-nav">
      <div className="lx-nav-inner">
        <Link href="/" className="lx-brand">
          <span className="lx-brand-name">ZecLedger</span>
          <span className="lx-brand-meta">EST. 2026 · PUBLIC LEDGER</span>
        </Link>

        <nav className="lx-links">
          {PAGES.map((p) => {
            const active =
              p.href === "/"
                ? path === "/"
                : path.startsWith(p.href);
            return (
              <Link
                key={p.href}
                href={p.href}
                className={`lx-link${active ? " is-active" : ""}`}
              >
                {p.label}
              </Link>
            );
          })}
        </nav>

        <div className="lx-live">
          <span className="lx-live-dot" />
          LIVE
        </div>
      </div>
    </header>
  );
}
