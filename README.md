# ZecLedger Web

A public, no-keys Zcash dashboard. Three tabs:

1. **Shield rate** — live sample of recent transactions, classified with the corrected method (shielding, deshielding, fully private, transparent, coinbase).
2. **Network & fees** — block height, price, market cap, nodes, fees, chain size.
3. **Address lookup** — public balance and history for any transparent (t) address. Shielded (z) addresses are private by design and return a friendly explanation instead.

This app only ever touches **public** data through serverless API routes. It never asks for or handles any private key or viewing key. Shielded personal accounting lives in the separate local ZecLedger tool, where keys stay on the user's own machine.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

Option A — from the Vercel dashboard:

1. Push this folder to a GitHub repo (for example `zecledger-web`).
2. Go to vercel.com → **Add New → Project**.
3. Import the repo. Vercel auto-detects Next.js. No environment variables are needed.
4. Click **Deploy**. You get a public link to share.

Option B — from the command line:

```bash
npm i -g vercel
vercel
```

Follow the prompts. `vercel --prod` publishes to your production URL.

## Data sources

All public data currently comes from the Blockchair Zcash API, called server-side
in `lib/datasource.js`. That file is the single place data is fetched, so a public
Zaino / lightwalletd source can be added later as a second provider without
changing any UI code.

## Honesty notes

- Shield-rate figures are **samples** of recent transactions and are **floors, not totals**, because fully private (z→z) transactions cannot be seen from outside the shielded pool.
- Network figures are live from Blockchair and refresh about once a minute.
- No keys, no logins, no tracking. Public data only.
