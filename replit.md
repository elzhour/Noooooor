# Noor App (نور)

A cross-platform Islamic companion app built with React, Vite, and Express, supporting web and Android (via Capacitor).

## Features (v2.2+)
- **القرآن الكريم** — Quran reader with tafsir, word-by-word audio, bookmarks, and Moshaf PDF downloader (8 types)
  - **بحث في القرآن** — Full-text search across all 6236 ayahs using local JSON (quran-search.json, quran-simple edition), Arabic normalization for user input, tap result to navigate
  - **سبب النزول (تفسير ميسر)** — Tafsir Muyassar per ayah from local JSON (tafsir-muyassar.json, alquran.cloud data), fallback to API
- **الأحاديث الشريفة** — Paginated reader across 6 hadith books with cross-book search using a public Arabic hadith dataset with in-memory caching, Arabic normalization, and search results that navigate to exact page+highlight
- **التاريخ الإسلامي** — 4975 Islamic history events across 5 eras (Seerah → Ottoman), lazy-loaded per era with pagination
- **الاختبارات الإسلامية** — 5820 MCQ questions across 6 Islamic science categories, 3 levels each
- **سنن النبي ﷺ** — Prophetic Sunnah browser across 5 categories with hadith sources
- **الأذكار** — Morning/evening and daily adhkar with progress tracking
- **التسبيح** — Digital tasbih counter
- **الأذان** — Prayer times with notifications
- **القبلة** — Smart Qibla compass
- **الصحبة** — Community leaderboard and global dhikr tracker
- **الإذاعات الإسلامية** — Live Islamic radio (Quran + Sunnah channels)
- **القنوات الإسلامية** — Live Islamic TV channels (HLS streams) with hls.js support

## Static Data Strategy
All large content is in `public/data/` and lazy-fetched on page visit:
- `public/data/history-*.json` — Islamic history events (seerah/rashidun/umayyad/abbasid/ottoman), lazy-loaded per era
- `public/data/quizzes.json` — 4.4MB, full quiz data
- `public/data/sunnah.json` — 40KB, prophetic sunnah
- `public/data/moshaf.json` — 3.3KB, moshaf PDF links
- `public/data/quran-search.json` — 1.4MB, 6236 ayahs in quran-simple (for text search, no tashkeel)
- `public/data/tafsir-muyassar.json` — 2.5MB, Tafsir Muyassar keyed by "surah:ayah"
**Data generation**: Run `node scripts/fetch-quran-json.mjs` to regenerate/update the quran JSON files.

## Project Structure

This is a pnpm monorepo workspace.

### Root (`/`)
- **React + Vite frontend** — the main web application
- Capacitor config for Android builds
- Entry: `src/main.tsx`, `index.html`

### `artifacts/api-server/`
- **Express backend** — handles `/api/*` routes
- Uses Drizzle ORM with PostgreSQL
- Registered as Replit artifact at path `/`
- Built to `artifacts/api-server/dist/index.cjs` for production

### `artifacts/mockup-sandbox/`
- Isolated Vite dev environment for UI component prototyping
- Registered at path `/__mockup`

### `artifacts/noor-mobile/`
- **Expo / React Native** mobile companion app (runs via Expo Go)
- Brand: gold `#C19A6B`, beige `#FDFBF0`, Tajawal + Amiri fonts, RTL Arabic
- Tabs: Home (prayer times + next-prayer countdown), Azkar, Tasbih, Qibla, Settings
- Prayer times computed locally with `adhan` library; Adhan notifications via `expo-notifications`
- Workflow: `artifacts/noor-mobile: Mobile App` (port 8000, console output, prints QR code for Expo Go)
- Progress tracker at `/NOOR_MOBILE_STEPS.md` (in Arabic)

### `lib/`
- `lib/db` — Drizzle ORM schema and database client
- `lib/api-spec` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react` — Generated React Query hooks from OpenAPI spec
- `lib/api-zod` — Generated Zod schemas from OpenAPI spec

### `scripts/`
- `dev-artifact.sh` — Artifact dev script: starts Vite on PORT + API server on API_SERVER_PORT (3001) using pnpm workspace executables
- `dev.sh` — Primary workflow script: starts Vite on Replit's web port + API server on 3001 using pnpm workspace executables
- `replit-dev.sh` — Launches the Replit artifact router which manages all services
- `proxy.js` — HTTP reverse proxy (forwards PROXY_PORT → TARGET_PORT)

## Development on Replit

### How It Works
The app runs through Replit's artifact system:

1. The **"artifacts/api-server: API Server"** workflow runs `dev-artifact.sh` with `PORT=19382`
2. This starts Vite on port 19382 (the artifact's registered port) and the API server on port 3001
3. Replit routes external traffic: port 80 → port 19382 → Vite dev server
4. The Vite dev server proxies `/api/*` requests to `localhost:3001`

### Port Architecture
- External port 80 → `localhost:19382` → Vite dev server (via Replit artifact routing)
- `localhost:19382` — Vite dev server (React frontend with HMR)
- `localhost:3001` — Express API server (tsx live-reload for backend development)

### Running in Development
The primary workflow is **"artifacts/api-server: API Server"** — this is what keeps the app running. The "Start application" workflow uses `npm run dev` (Vite on port 5000) as a standalone alternative.

### Migration Notes
- The Replit migration preserves the existing React/Vite frontend, Express API server, pnpm workspace structure, and database schema.
- Startup scripts now invoke Vite and tsx through pnpm instead of hard-coded `node_modules/.bin` paths, which is more reliable in Replit's workspace layout.
- Vite dev proxies now read `API_SERVER_PORT`, allowing standalone artifact workflows to use separate backend ports safely.
- Database initialization now completes before the global counter loads, preventing first-run errors when tables do not exist yet.
- Hadith reading/search no longer depends on the invalid hadithapi.com key; it uses the public Arabic hadith dataset for the six books and keeps the old local Sunnah search as a final fallback.
- The duplicated root and artifact Hadith pages are kept in sync so the preview cannot show an older version without the working search tab.

## Firebase

Single Firebase project: **noooooor-app** (projectId: `noooooor-app`)
- Config stored in `.replit` as `VITE_FIREBASE_*` environment variables
- Used for: Firebase Auth (Google sign-in), Firestore (global counter, leaderboard, sessions)
- Email signup now collects email and password first, then asks for an Egyptian governorate only. Country and non-Egypt city selection were removed from the primary signup flow.

### Firestore Collections
- `globalCounter/main` — total tasbeeh count
- `activeSessions/{sessionId}` — tracks users actively pressing tasbeeh (TTL: 3 min)
- `sohbaLeaderboard/{userId}` — per-user leaderboard entries

## Key Configuration

- **Vite proxy**: `/api` → `http://localhost:${API_SERVER_PORT:-3001}`
- **Vite host**: `true` (binds to all interfaces including IPv6)
- **Firebase**: Configured via `VITE_FIREBASE_*` environment variables in Replit secrets

## Database

- PostgreSQL via Replit's built-in database (`DATABASE_URL` secret)
- Schema managed with Drizzle ORM in `lib/db/src/schema/`
- Tables auto-created on server startup via `artifacts/api-server/src/db-init.ts`
  - `global_counter` — global tasbeeh count
  - `sohba_leaderboard` — community leaderboard

## Production Build

```bash
bash build.sh
```

Builds the web artifact, bundles api-server to `artifacts/api-server/dist/index.cjs`, and copies the web build to `dist/public` for production static serving.

## UI Design System

- **Primary color**: `#C19A6B` / `hsl(var(--primary))` — gold/amber
- **Fonts**: `"Tajawal"` for UI text, `"Amiri"/"Scheherazade New"` for Arabic calligraphy
- **NoorIcons**: Custom 3D-style SVG icon library at `src/components/NoorIcons.tsx` using `currentColor` for theming

## Artifact Configuration

The app uses Replit's artifact system with:
- `artifacts/api-server/.replit-artifact/artifact.toml` — registers the API server at path `/`, localPort 19382
- `artifacts/mockup-sandbox/.replit-artifact/artifact.toml` — registers the mockup sandbox at path `/__mockup`, localPort 8081
- Development service: `bash scripts/dev-artifact.sh` (Vite + API in one process)
- Production service: `node artifacts/api-server/dist/index.cjs`
