// lib/ledger.js
//
// The ledger's entries: a dated, verifiable record of the Zcash chain. Each
// entry has a slug and a detail. Some entries carry their full story inline;
// others point at an archive markdown file (reusing the existing archive lib) so
// long-form pieces live as version-controlled Markdown, not hardcoded strings.
//
// This is deliberately a single source of truth for both the terminal boot and
// the /ledger table, so the two never drift.

export const LEDGER = [
  {
    slug: "ironwood-activated",
    date: "2026-07-28",
    entry: "Ironwood (NU6.3) activated on mainnet",
    tag: "live",
    summary:
      "At block 3,428,143 the Orchard pool froze for new deposits and a fresh Ironwood shielded pool opened. New shielded value now settles in Ironwood.",
    body: [
      "Ironwood, the NU6.3 network upgrade, activated on Zcash mainnet at block height 3,428,143 on 28 July 2026. At activation, the legacy Orchard pool stopped accepting new deposits and a new Ironwood shielded pool opened alongside it, together with a new v6 transaction format.",
      "The design intent is a clean pool. Rather than patching Orchard after its soundness episode earlier in the year, the upgrade opens a fresh pool with no history of uncertainty behind it, and routes new shielded activity there.",
      "The migration is visible live: value leaving Orchard and settling in Ironwood, tracked on the migration page. On the first day the per-pool inflow figures are still filling in, since they need a full day of history, so the honest reading is Orchard's outflow plus Ironwood's rising balance.",
    ],
    sources: [
      { label: "ZIP 258 (NU6.3 consensus parameters)", url: "https://zips.z.cash/zip-0258" },
    ],
    link: "/preview/migration",
    linkLabel: "Watch the migration",
  },
  {
    slug: "zcashd-end-of-life",
    date: "2026-07-18",
    entry: "zcashd reached end of life",
    tag: "verified",
    summary:
      "Every unmodified zcashd node halted automatically at block 3,417,100 and will not restart. The halt was set deliberately to fall before Ironwood.",
    archive: "zcashd-end-of-life-and-ironwood",
    archiveNote:
      "The full record of the zcashd sunset, the road to Ironwood, and where Zakura fits.",
  },
  {
    slug: "zakura-released",
    date: "2026-07-15",
    entry: "Zakura 1.0.0 released",
    tag: "verified",
    summary:
      "An independent full node, forked from Zebra, supporting Ironwood from its first release. Its sync-speed claims are the project's own, not independently reproduced.",
    body: [
      "Zakura, a Zcash full node forked from the Zcash Foundation's Zebra codebase and maintained independently, was released at version 1.0.0 on 15 July 2026. It supports the Ironwood upgrade from its first release and keeps a compatibility mode for existing zcashd-style integrations.",
      "Its headline is speed. By the project's own published benchmarks a full synchronisation completed in about 4 hours 20 minutes against roughly 20 hours 46 minutes for Zebra in the same comparison. Those are the developers' figures; as of this writing no independent organisation has reproduced them under separate conditions.",
      "The point of recording that carefully is that a benchmark and a verified result are different things, and a network built on private money is better served by keeping the difference visible.",
    ],
    sources: [
      { label: "zcash/zcash repository (names Zakura as a successor node)", url: "https://github.com/zcash/zcash" },
    ],
  },
  {
    slug: "orchard-soundness-patched",
    date: "2026-06-02",
    entry: "Orchard soundness flaw patched (NU6.2)",
    tag: "verified",
    summary:
      "A soundness flaw in the Orchard shielded pool, disclosed on 29 May, was contained by an emergency hard fork. Its privacy meant no one could prove it was never exploited.",
    body: [
      "On 29 May 2026 a researcher auditing for Shielded Labs disclosed a soundness flaw in the Orchard shielded pool: an under-constrained check in its zero-knowledge circuit that could in principle allow counterfeit ZEC to be created inside the pool.",
      "What makes that serious in Zcash is the very thing Zcash provides. Orchard hides sender, receiver, and amount, so a fault inside it leaves no visible trace. The flaw was contained with an emergency soft fork followed by the NU6.2 hard fork in early June, before any known exploitation.",
      "But privacy cuts both ways: the same design that hid a hypothetical attacker also made it impossible to prove, after the fact, that no attacker ever acted. That gap between no evidence and proof is the thread that runs to Ironwood, which replaces the pool rather than patching it further.",
    ],
    sources: [
      { label: "Zcash Shielded News, ZecHub", url: "https://zechub.substack.com" },
    ],
  },
];

export function getLedger() {
  return LEDGER;
}

export function getLedgerEntry(slug) {
  return LEDGER.find((e) => e.slug === slug) || null;
}
