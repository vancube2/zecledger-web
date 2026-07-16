import "./globals.css";
import { Fraunces, Spline_Sans, Spline_Sans_Mono } from "next/font/google";

// Fonts are fetched at build time and served from this origin. Nothing is
// requested from Google when someone visits, so no visitor's IP or user agent
// is handed to a third party. For a privacy dashboard that matters: the fact
// that you are reading it is itself information worth not leaking.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const splineSans = Spline_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "ZecLedger — Zcash Privacy Dashboard",
  description:
    "Live Zcash shield-rate, network and fee stats, and transparent address lookup. A public, no-keys research dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${splineSans.variable} ${splineSansMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
