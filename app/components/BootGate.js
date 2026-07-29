"use client";
import { useEffect, useRef, useState } from "react";

// The front door. On first arrival in a session the whole site is gated behind a
// black boot screen that types a short sequence, cursor blinking, then fades away
// to reveal the interface underneath. A skip control jumps straight in. After the
// first boot, or on later navigation, it does not appear again this session, so
// the drama is an entrance, not a toll booth.

const SESSION_KEY = "zl_boot_v2";

// Kept deliberately short: a few punchy lines, then reveal. Each entry is a line
// that types out. Blank strings are pauses.
const SCRIPT = [
  { text: "ZECLEDGER", cls: "boot-brand" },
  { text: "" },
  { text: "> initializing public ledger", cls: "boot-line" },
  { text: "> connecting to the zcash network", cls: "boot-line" },
  { text: "> reading shielded pools ... ok", cls: "boot-line" },
  { text: "> ironwood migration ... live", cls: "boot-line boot-gold" },
  { text: "" },
  { text: "the portfolio of zcash, kept in the open.", cls: "boot-tag" },
];

export default function BootGate({ children }) {
  const [booting, setBooting] = useState(true); // gate visible
  const [ready, setReady] = useState(false); // decided whether to boot at all
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const skipRef = useRef(false);

  // Decide on mount: boot only if not already booted this session.
  useEffect(() => {
    let booted = false;
    try {
      booted = false; // always boot on load (Option 1)
    } catch {}
    if (booted) {
      setBooting(false);
    }
    setReady(true);
  }, []);

  const finish = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    setFading(true);
    setTimeout(() => setBooting(false), 650); // match fade duration
  };

  // Typing engine.
  useEffect(() => {
    if (!ready || !booting) return;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      if (skipRef.current) {
        finish();
        return;
      }
      if (lineIdx >= SCRIPT.length) {
        setTimeout(finish, 550);
        return;
      }
      const line = SCRIPT[lineIdx];
      if (line.text.length === 0) {
        setLineIdx((i) => i + 1);
        setCharIdx(0);
        return;
      }
      if (charIdx < line.text.length) {
        setCharIdx((c) => c + 1);
        return;
      }
      // line complete, pause then next
      setTimeout(() => {
        if (!cancelled) {
          setLineIdx((i) => i + 1);
          setCharIdx(0);
        }
      }, line.cls?.includes("boot-brand") ? 380 : 140);
    };

    // Speed: brand types slower for weight, lines quick.
    const current = SCRIPT[lineIdx];
    const delay = current && current.cls?.includes("boot-brand") ? 90 : 18;
    const t = setTimeout(tick, charIdx === 0 && current?.text ? 60 : delay);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, booting, lineIdx, charIdx]);

  // Allow click / key anywhere to skip.
  useEffect(() => {
    if (!booting) return;
    const skip = () => (skipRef.current = true);
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [booting]);

  // Before we've decided, render nothing to avoid a flash of the site.
  if (!ready) return <div className="boot-screen" aria-hidden />;

  return (
    <>
      {booting && (
        <div
          className={`boot-screen${fading ? " is-fading" : ""}`}
          onClick={() => (skipRef.current = true)}
          role="button"
          aria-label="Skip intro"
        >
          <div className="boot-inner">
            {SCRIPT.slice(0, lineIdx).map((l, i) => (
              <div key={i} className={l.cls || "boot-line"}>
                {l.text || "\u00a0"}
              </div>
            ))}
            {lineIdx < SCRIPT.length && (
              <div className={SCRIPT[lineIdx].cls || "boot-line"}>
                {SCRIPT[lineIdx].text.slice(0, charIdx)}
                <span className="boot-cursor" />
              </div>
            )}
          </div>
          <div className="boot-skip">click anywhere to skip</div>
        </div>
      )}
      <div className={booting ? "boot-hidden" : "boot-revealed"}>{children}</div>
    </>
  );
}
