# MediSetu — Medicine finder for India

A full-stack Next.js web app that helps people find medicines across Indian pharmacies, compare live prices, see stock on a map, and keep a pharmacy's inventory in sync with a natural-language AI assistant. The interface supports English plus all 22 scheduled Indian languages.

![Stack](https://img.shields.io/badge/Next.js-14.2.35-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Deploy](https://img.shields.io/badge/Vercel-ready-000000)

## What's included

| Area | Features |
| --- | --- |
| **Accounts & roles** | Customers get medicine search, a saved shortlist and the pharmacy map. Pharmacy owners get a dashboard with the AI assistant, stock ledger, audit trail and insights. Sign in with Google; pick your account type on the sign-in screen. |
| **Real pharmacy coverage** | The map merges the curated Indian directory with live pharmacies from **Google Places** (when a Places key is set) or **OpenStreetMap Overpass** as a free fallback. Toggle it with the `Google`/`OSM` chip above the list. |
| **Medicine search** | Search by brand, salt, strength, manufacturer or native-script alias; price range; prescription badge; same-salt alternatives; matching pharmacies. |
| **Live price comparison** | Server-side relays to Apollo 24\|7 (private JSON search endpoint), PharmEasy (`__NEXT_DATA__`), Tata 1mg and Netmeds (HTML/JSON-LD extraction), with 12-hour caching and a visible per-source health panel. Unparseable/blocked sources never break the UI — curated data is always shown. |
| **Map finder** | Google Maps with custom dark styling and pharmacy pins when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set; automatic OpenStreetMap/Leaflet fallback otherwise. Filters for city, geolocation, in-stock and delivery, plus directions/call links. |
| **23 languages** | English + Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Nepali, Sindhi, Kashmiri, Konkani, Maithili, Sanskrit, Santali, Bodo, Dogri, Manipuri. Core UI strings are translated; untranslated strings gracefully fall back to English. RTL layout for Urdu/Sindhi. Voice search uses the selected language. |
| **AI inventory** | Type or dictate commands like “sold 3 strips of Dolo 650”, “50 Crocin stock me add karo” or “5 डोलो 650 बेचे”. The parser detects the transaction type, medicine, quantity and pharmacy, applies the stock change, records an audit entry and warns on low stock. Optional OpenAI upgrade handles ambiguous phrasing; the offline parser always works without a key. |
| **Inventory workspace** | Live stock ledger with reorder thresholds, quick ± controls, low-stock/out-of-stock counters, transaction feed, 7-day movement chart and fast-mover ranking. |
| **Visuals** | Dark glassmorphism theme, animated gradient orbs, staggered entrances, hover lifts, live status pulses, animated bars, toasts, skeletons and responsive layouts. |

## Run locally

```bash
cd medifinder
npm install
cp .env.example .env.local   # optional — the app works with no keys
npm run dev
```

Open http://localhost:3000. On the first visit, pick **Customer** or **Pharmacy owner**, then tap **Continue with Google**. The role is saved before the OAuth redirect and restored when Google sends the user back.

- **Customer view** — medicine search, saved list, live price comparison and the pharmacy map. No inventory controls.
- **Owner view** — AI stock assistant, stock ledger, transaction history and sales insights, with a remembered store selection.
- **Role switching** — use the account menu in the header. **Sign out** clears the Google session.
- **No keys yet?** The sign-in screen shows a setup notice; “Continue without signing in” opens the customer view so you can preview the app. It disappears as a concept once Google OAuth is configured.

The role and saved list live in localStorage. For production authorisation, add a database-backed role check alongside Auth.js before exposing real store data.

Useful commands:

```bash
npm run typecheck
npm run build
npm run start
```

## Deploy to Vercel

1. Push this folder to GitHub/GitLab/Bitbucket.
2. In Vercel → **Add New → Project**, import the repo. Framework preset: **Next.js**. No build overrides needed.
3. Add the environment variables you want (all optional):

   | Variable | Purpose |
   | --- | --- |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Enables Google Maps. Enable **Maps JavaScript API** in Google Cloud. Without it the app uses OpenStreetMap. |
   | `GOOGLE_PLACES_API_KEY` | Server key with Places API enabled; loads real pharmacies near the map centre. |
   | `NEXTAUTH_SECRET` + `NEXTAUTH_URL` | Required for Google sign-in sessions in production. |
   | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Enables the single Google sign-in button. |
   | `OPENAI_API_KEY` | Upgrades the stock parser to an LLM. Without it the built-in offline parser is used. |
   | `OPENAI_MODEL` | Defaults to `gpt-4o-mini`. |
   | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Durable state across serverless invocations. |
   | `DATABASE_URL` | Neon/Postgres connection string (alternative to Upstash); the app creates a `medisetu_kv` table automatically. |
   | `ENABLE_LIVE_SCRAPING` | Set to `false` to disable outbound pharmacy relays. |

4. Deploy. All `/api/*` routes are serverless functions; the frontend is statically optimised.

> Without a cloud store, inventory changes live in server memory. That is fine for a demo, but serverless cold starts reset it. Add Upstash or Neon for persistence.

## Google sign-in setup

1. Set `NEXTAUTH_SECRET` to a long random string (`openssl rand -base64 32`) and `NEXTAUTH_URL` to your site URL (`http://localhost:3000` locally, `https://your-project.vercel.app` on Vercel).
2. In Google Cloud → **APIs & Services → Credentials**, create an **OAuth client ID** of type *Web application*.
   - Authorised JavaScript origins: `http://localhost:3000` and `https://your-domain`
   - Authorised redirect URI: `https://your-domain/api/auth/callback/google` (and `http://localhost:3000/api/auth/callback/google` for local testing)
3. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local` and to Vercel (all environments), then restart / redeploy.
4. The sign-in screen now shows a single **Continue with Google** button. Choose the account type first — customer or pharmacy owner — and that role is carried into the session.

If the keys are absent, the button is replaced by a short setup notice; no disabled or placeholder buttons are shown.

## Real pharmacy coverage: what is actually possible

There is no free public register of *every* medical shop in India (there are hundreds of thousands, including unorganised local chemists). The app therefore layers three sources:

1. **Curated directory** — ~25 pharmacies across 17 Indian cities with stock data. Always available, even offline.
2. **Google Places** — set `GOOGLE_PLACES_API_KEY` (a server key with Places API enabled, restricted by IP, not by HTTP referrer) and the map loads real pharmacies around the selected city or your GPS location via Nearby Search (up to 120 per area, ~7 km radius). This is the closest practical way to show nearly all mapped pharmacies.
3. **OpenStreetMap Overpass** — free fallback: community-mapped `amenity=pharmacy` nodes/ways around the area. Coverage varies by region and public mirrors throttle requests, so results can be empty.

The `Google`/`OSM` chip above the pharmacy list toggles the live layer. Live shops show a source badge, distance, rating and directions link. Stock levels only exist for curated/owner-managed pharmacies — public directories don't expose inventory. For a true national database you would need a licensed dataset or direct pharmacy partnerships.

Use a **separate Places key from the Maps JavaScript key**: the browser key is referrer-restricted and will reject server-side Places calls.

## Enabling Google Maps (step by step)

The app automatically uses OpenStreetMap until you supply a Google key. To switch to Google Maps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. **APIs & Services → Library** → search for **Maps JavaScript API** → click **Enable**.
3. Google requires a billing account on the project, even for the free monthly usage tier. Add one under **Billing** if prompted.
4. **APIs & Services → Credentials → Create credentials → API key**. Copy the key.
5. **Important — restrict the key:** open it and under **Application restrictions** choose *HTTP referrers (web sites)* and add your domains:
   - `localhost:3000/*` for local development
   - `your-project.vercel.app/*` and your custom domain (if any) for production
   
   Under **API restrictions**, allow only **Maps JavaScript API**.
6. Local: add the key to `.env.local` and restart the dev server:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```
7. Vercel: **Project → Settings → Environment Variables**, add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with the same value for **Production**, **Preview** and **Development**, then **Redeploy**.

   `NEXT_PUBLIC_*` values are compiled into the browser bundle at build time, so the variable must exist **before** the deploy — adding it afterwards without a redeploy will not work.

8. The map badge at the bottom-left of the map will read **Google Maps**. If the key is invalid or restricted to the wrong domain, the map will show an error; check the browser console and your referrer list.

No code changes are needed: `MapPanel` picks Google Maps when the key is present and falls back to Leaflet otherwise.

## API reference

| Endpoint | Description |
| --- | --- |
| `GET /api/medicines?q=&city=&live=0` | Ranked medicine hits, live listings and source health. `live=0` skips scraping. |
| `GET /api/medicines/[id]` | Medicine detail, all pharmacy stock rows, same-salt alternatives. |
| `GET /api/pharmacies?city=&medicineId=&lat=&lng=&inStockOnly=` | Pharmacies with distance, stock and price. |
| `GET /api/inventory?pharmacyId=` | Stock rows with medicine and pharmacy data. |
| `POST /api/inventory` | `{ pharmacyId, medicineId, delta }` — negative delta = sale, positive = purchase. |
| `POST /api/ai/interpret` | `{ text, pharmacyId, language, apply }` — parses and optionally applies a stock movement. |
| `GET /api/transactions?pharmacyId=&limit=` | Audit log. |
| `GET /api/analytics?pharmacyId=` | KPIs, 7-day trend, fast movers. |
| `POST /api/sync` | Force-refresh the four live price sources. |
| `GET /api/status` | Runtime configuration and source status. |

## How the AI stock update works

1. `POST /api/ai/interpret` sends the sentence to OpenAI when a key exists. The model returns strict JSON constrained to known medicine/pharmacy IDs.
2. If there is no key (or the call fails), `lib/ai.ts` runs a deterministic multilingual parser: sale/purchase verbs, medicine aliases in Latin and Indian scripts, pack-size-aware quantities and pharmacy/city resolution.
3. `lib/store.ts` applies the delta, clamps sales at zero, writes a transaction and returns the before/after values and low-stock warnings.

## Live data caveats

There is no public API for Indian pharmacy prices. The relays read public search pages and are **best effort**: sites can change markup, return bot challenges or rate-limit requests. Apollo and PharmEasy currently parse; Tata 1mg and Netmeds often block automated requests. Every failure is reported in the UI and the curated catalogue keeps the app usable. Check each site's Terms of Service and robots.txt before using scraped data commercially, and add `ENABLE_LIVE_SCRAPING=false` to opt out. This project is not affiliated with any pharmacy chain.

## Project structure

```
app/                     Next.js App Router pages + API routes
components/              UI (search, map, inventory, analytics, language header)
lib/ai.ts                LLM + offline multilingual command parser
lib/scrapers.ts          Pharmacy relays, extraction and caching
lib/store.ts             State, stock mutations, analytics, Upstash/Neon persistence
lib/seed.ts              Curated Indian medicines, pharmacies and stock
lib/i18n.ts              23 languages and translation table
```

## Disclaimer

Prices and availability are indicative only. This app does not give medical advice and does not sell medicines. Consult a registered pharmacist or doctor before taking any medicine.
