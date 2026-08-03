"use client";
import { useEffect, useRef, useState } from "react";

// Renders a fully-designed HTML document in an isolated iframe. The iframe keeps
// the essay's own CSS from touching the rest of the site (and vice versa), so a
// light, serif research paper can sit inside a dark terminal site without either
// one bleeding into the other. The frame auto-sizes to the document's height so
// there is no inner scrollbar.

export default function ArchiveFrame({ html, title }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    // Resize to fit the content, and again after fonts/images settle.
    const resize = () => {
      try {
        const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
        if (h) setHeight(h + 8);
      } catch {}
    };
    resize();
    const t1 = setTimeout(resize, 200);
    const t2 = setTimeout(resize, 800);
    // also resize on window resize (reflow at new width)
    const onWin = () => resize();
    window.addEventListener("resize", onWin);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onWin);
    };
  }, [html]);

  return (
    <div className="arc-frame-wrap">
      <iframe
        ref={ref}
        title={title || "Archived essay"}
        className="arc-frame"
        style={{ height }}
        sandbox="allow-same-origin allow-popups"
      />
    </div>
  );
}
