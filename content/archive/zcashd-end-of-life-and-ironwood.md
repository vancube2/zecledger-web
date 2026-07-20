---
title: "The end of zcashd, and the road to Ironwood"
date: "2026-07-20"
summary: "In a few short weeks, Zcash retired the node software that carried it for nearly a decade, gained a fast new client, and prepared to seal the shielded pool at the center of its most serious security episode. This is a plain, sourced record of what happened and why."
tags: ["zcashd", "ironwood", "zakura", "node"]
sources:
  - label: "End of Life, The zcashd Book (official)"
    url: "https://zcash.github.io/zcash/user/end-of-life.html"
  - label: "zcash/zcash, GitHub repository README (official)"
    url: "https://github.com/zcash/zcash"
  - label: "Zcashd Deprecation, z.cash (official)"
    url: "https://z.cash/support/zcashd-deprecation/"
  - label: "Zcash Shielded News, Vol. 27, ZecHub"
    url: "https://zechub.substack.com/p/zcash-shielded-news-vol27"
  - label: "Zcash Quarterly Report, Q2 2026, Pine Analytics"
    url: "https://pineanalytics.substack.com/p/zcash-quarterly-report-q2-2026"
  - label: "ZIP 258, NU6.3 consensus parameters"
    url: "https://zips.z.cash/zip-0258"
---

For most of its life, Zcash ran on one piece of software. `zcashd`, the original
full node, was forked from Bitcoin Core in 2016 and adapted to carry shielded
transactions. On 18 July 2026 it stopped. Not by a plea to upgrade, but by a
mechanism written into the software itself: an End-of-Support halt coded to a
block height. At height 3,417,100 every unmodified `zcashd` 6.20.0 node shut
itself down and now refuses to restart. A client that ran a network for the
better part of a decade did not fade out. It was given a stopping point and
reached it.

This entry keeps a record of three things that happened close together: why
`zcashd` was retired, what the Ironwood upgrade changes and why it exists at all,
and where a new node client called Zakura fits in. Where a figure comes from a
project's own testing rather than an independent measurement, it is marked as
such. Keeping those two kinds of claim apart is the point of writing this down.

![Timeline of the Zcash transition from the Orchard bug in May to Ironwood activation on 28 July 2026](/archive/ironwood-timeline.svg)

## The bug that set the clock

The reason for the hurry began with a discovery. On 29 May 2026, Taylor Hornby, a
researcher auditing for Shielded Labs, found a soundness flaw in the Orchard
shielded pool. The flaw sat in an elliptic-curve component of Orchard's
zero-knowledge circuit: an under-constrained check that could let invalid inputs
pass. In plain terms, it meant that counterfeit ZEC could in theory have been
created inside the pool.

What makes that worse in Zcash than almost anywhere else is the very thing Zcash
exists to provide. Orchard hides sender, receiver, and amount by design, so
counterfeiting inside it would leave no visible trace. The bug was patched before
any known exploitation, with an emergency soft fork followed by the NU6.2 hard
fork in early June. But privacy cuts both ways here: the same design that hid a
hypothetical attacker also made it impossible to prove, after the fact, that no
attacker ever acted. Developers found no evidence of exploitation and could not
produce certainty. That gap between "no evidence" and "proof" is the thread that
runs through everything after.

## Why zcashd was retired

Two pressures met. One was long-planned. The Zcash Foundation's `zebra`, a full
node written from the ground up in Rust, had been maturing for years as the
intended successor, and the ecosystem had been steadily moving operators toward
it. The other pressure was the Orchard episode, which turned a gradual migration
into a deadline.

The official guidance is specific about the sequence. `zcashd` does not support
NU6.3 and never will. Its automatic halt at block 3,417,100 was set deliberately
to fall before Ironwood's activation at block 3,428,143, so that every
un-upgraded `zcashd` node had already shut down and the network was validated by
`zebra` alone before the upgrade took effect. The retirement and the upgrade were
not a coincidence of timing. The halt was placed where it was on purpose.

For operators the practical shape is plain. Those who do not need the old
built-in wallet move to `zebra`. Those who depend on it move to Zallet, a
separate wallet the ZODL developers built as a replacement. `zebra` does not
carry wallet functionality itself, which is why the wallet became its own
project rather than a feature of the node.

## What Ironwood changes, and why it exists

**Ironwood, formally the NU6.3 network upgrade, activates on mainnet at block
height 3,428,143, expected around 8:00 a.m. Eastern on 28 July 2026.** That date
is itself worth recording: it is one week later than the originally planned 21
July. The slip was requested largely by Shielded Labs, which flagged that
exchanges, mining pools, and wallet providers were swapping out `zcashd` for the
new Rust-based stack at the same moment as the upgrade, and that running two large
transitions at once left preparation windows uncomfortably tight. An extra week
was built in for readiness.

Ironwood does not patch Orchard. It replaces it. At activation, the legacy
Orchard pool is frozen for new inputs: new payments to Orchard receivers route
instead into a fresh Ironwood shielded pool, alongside a new v6 transaction
format. Starting clean is the whole idea. A brand-new pool has no history of
uncertainty behind it.

The mechanism that resolves the old uncertainty is not new. It is Zcash's
existing **turnstile**, a supply-accounting checkpoint that tracks the net value
moving into and out of each shielded pool against the transparent ledger. When a
holder migrates funds out of Orchard, those funds pass through the turnstile.
Any counterfeit ZEC that might have entered Orchard during the vulnerability
window now faces a forced choice: attempt to move to Ironwood and surface at the
checkpoint, where the accounting would not balance, or stay locked in the frozen
Orchard pool where it can never be spent. Either outcome tells the network
something the current state of uncertainty does not. The supply either reconciles
or it does not, in the open.

Ironwood also marks a shift in how Zcash tries to trust its own cryptography.
Rather than relying on code audits alone, the effort behind Ironwood uses
**formal verification**, machine-checked proofs built with the Lean theorem
prover, to rule out undetectable counterfeiting bugs in the protocol
specification before the new pool goes live. As Sean Bowe has framed it, the
distinction that matters is between a bug in the protocol's specification and a
bug in its software implementation. Formal verification targets the first kind,
the kind an audit is least likely to catch and a private pool is least able to
reveal.

One further thread belongs here, stated carefully because the ecosystem's own
reporting is not uniform on it. Ironwood is described as including groundwork
toward **quantum recoverability**, part of a longer, layered plan for
post-quantum readiness. The deeper quantum work, along with the scaling
architecture known as Project Tachyon, is associated with the later NU7 upgrade
rather than NU6.3 itself. Read Ironwood as laying foundations here, not as the
upgrade that delivers quantum resistance outright. Where sources blur the two,
this is the more careful reading.

## Where Zakura fits

Retiring `zcashd` left `zebra` as the node able to follow Zcash through Ironwood.
`zebra` is thorough, but a full sync from genesis takes a long time, which raises
the cost of standing up a node right before a hard deadline.

Into that gap, on 15 July 2026, came **Zakura**, released at version 1.0.0. It is
a fork of `zebra`'s open-source codebase, maintained independently of the Zcash
Foundation, built by Sean Bowe and Dev Ojha and funded by private ZEC donations
rather than a company or foundation. Zakura supports Ironwood from its first
release and keeps a compatibility mode for existing `zcashd`-style integrations,
giving operators a migration route. Its standing in the ecosystem is not
informal: the official `zcash/zcash` repository now names Zakura, alongside
`zebra`, as a successor consensus node to `zcashd`.

Its headline is speed. **By the project's own published benchmarks,** a full
synchronisation completed in about 4 hours 20 minutes, against roughly 20 hours
46 minutes for `zebra` in the same head-to-head, with snapshot restores faster
still. Those are the developers' figures. As of this writing no independent
organisation has reproduced them under separate conditions, and the announcement
did not publish complete hardware, bandwidth, or processor details. The speed may
well prove out. The reason to record it carefully is that a benchmark and a
verified result are different things, and a network built on private money is
better served by keeping the difference visible.

A quieter point deserves to sit next to the speed. A faster node is only useful
if it enforces exactly the same rules. Different node software following
identical consensus rules is a sign of a healthy network. Different software
drifting into different rules is how a chain splits in two. Zakura describes
itself as consensus-compatible and is built on `zebra`'s codebase for that
reason. The larger ambition its authors describe, throughput approaching
card-network scale, is a question for a later entry, not this one.

## Why keep this

Ecosystems lose their own memory easily. The software that carried Zcash for
years has been switched off, and within a few upgrade cycles the specifics tend
to compress into a single sentence: "the network upgraded." The specifics are
better than that. A researcher found a four-year-old flaw in a place designed so
that flaws cannot be seen. The fix was not a patch but a fresh pool, with an old
accounting trick repurposed to turn uncertainty into something the whole network
can watch resolve. A halt height was placed ten blocks-worth of days before an
activation height, on purpose, so two transitions would not collide. A new node
appeared a fortnight before the deadline and earned a place in the official
record within days.

Those details are what let someone understand, later, why the choices were made.
This record exists so that the era just before Ironwood does not quietly
disappear along with the pool that defined it.
