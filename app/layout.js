import "./globals.css";

export const metadata = {
  title: "ZecLedger — Zcash Privacy Dashboard",
  description:
    "Live Zcash shield-rate, network and fee stats, and transparent address lookup. A public, no-keys research dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Spline+Sans+Mono:wght@400;500;600&family=Spline+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
