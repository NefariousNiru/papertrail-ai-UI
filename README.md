# 💻 PaperTrail AI — React + Vite Frontend

A fast, privacy-first interface for extracting and verifying factual claims from academic papers. Upload a PDF, watch claims stream in live, and verify support against cited sources with clear verdicts, confidence, and evidence.

* **Real-time UX** via NDJSON streaming
* **No auth** — user supplies an API key, stored locally (optional)
* **Ephemeral backend state** — runtime-configured TTL, no permanent storage
* **Export** results (JSON/Markdown) to keep control client-side

---

## 🧭 Overview

```
User (Browser)
   │
   ├─ Uploads PDF → starts stream
   │
   ▼
React + Vite (TypeScript)
   ├─ features/api-key        # local-only key handling
   ├─ features/upload         # upload & job bootstrap
   ├─ features/stream         # NDJSON streaming (claims + progress)
   ├─ components/claims       # list, row, detail modal (verify)
   ├─ lib/apiClient           # fetch/multipart/NDJSON parsing
   └─ lib/export              # JSON/Markdown export (client-side)
   │
   ▼
FastAPI Backend (ephemeral Redis state, runtime TTL)
   ├─ /validate-api-key
   ├─ /upload-paper
   ├─ /stream-claim (NDJSON)
   └─ /verify-claim (multipart)
```

The UI is **stateless** beyond the browser: a `jobId` is kept in `localStorage` (optional) so reloads **replay** streamed claims and merge saved verifications from the backend’s runtime window.

---

## 🛠 Tech Stack

* **React 19 + TypeScript** (strict)
* **Vite 7** (fast dev & optimized builds)
* **Tailwind CSS 4** (dark-first design, accessible defaults)
* **Zustand 5** (small state surface, local storage opt-in)
* **@tanstack/react-query 5** (request/cache primitives where helpful)
* **NDJSON streaming** with `fetch` + `ReadableStream`
* **Router** via `react-router-dom`

---

## 📦 Project Structure

```
src/
  app/
    providers.tsx            # app providers (theme, query client, etc.)
    routes.tsx               # route definitions
  components/
    claims/
      ClaimList.tsx
      ClaimRow.tsx
      ClaimDetailModal.tsx   # verify flow (upload cited PDF)
    common/
      ConfirmDialog.tsx
      ParseProgressBar.tsx
    layout/
      AppShell.tsx           # header, theme switcher, layout
  features/
    api-key/
      ApiKeyModal.tsx
      ResetApiKeyButton.tsx
      useApiKey.ts           # zustand store; localStorage opt-in
    stream/
      useClaimsStreams.ts    # NDJSON stream hook (resume/reconnect)
    theme/
      ThemeMount.tsx
      ThemeSwitcher.tsx
      useTheme.ts
    upload/
      PaperUploadCard.tsx
  lib/
    apiClient.ts             # validate/upload/stream/verify (fetch+NDJSON)
    config.ts                # API base + version
    export.ts                # export JSON/Markdown
    types.ts                 # Claim, Evidence, StreamEvent, etc.
  pages/
    Home.tsx
    Dashboard.tsx
  App.tsx
  main.tsx
```

---

## 🔌 Backend Contract (Summary)

Base: **`/api/v1`**

* `POST /validate-api-key` → `{ apiKey }` → 200 on success
* `POST /upload-paper` (multipart) → `file, apiKey` → `{ jobId }`
* `POST /stream-claim` (NDJSON) → `{ jobId, apiKey }`
  emits lines of:

  * `{"type":"progress","payload":{"phase":"parse|extract","processed":n,"total":m}}`
  * `{"type":"claim","payload":{ id,text,status,verdict?,confidence?,reasoningMd?,evidence?[] }}`
  * `{"type":"error","payload":{ message }}`
  * `{"type":"done"}`
* `POST /verify-claim` (multipart) → `jobId, claimId, file, apiKey` → persisted verdict/evidence

> The backend’s Redis TTL is **runtime-configurable**. When reconnecting within that window, claims and verifications **replay** automatically.

---

## 🧪 UX Flow

1. **Enter API key**
   Modal validates via `/validate-api-key`. You may “remember on this device” (local-only).
2. **Upload PDF**
   `/upload-paper` returns `jobId`. UI starts `/stream-claim`.
3. **Live stream**
   Claims + progress update in real-time. Reconnects resume cleanly without duplicates.
4. **Verify a claim**
   In the detail modal, upload the cited PDF → backend returns verdict + confidence + evidence. The claim updates in place.
5. **Export**
   JSON/Markdown export of the current session (no server storage required).

---

## 🏁 Getting Started

### Prerequisites

* **Node 18+**
* **pnpm** (recommended)

### Install & Run (Dev)

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:5173`.

### Backend Proxy (Dev)

The UI expects the backend at `/api/v1`. Use either:

**Vite proxy** (recommended dev approach)

* Configure Vite to proxy `/api` → `http://127.0.0.1:8000`.
* Keep `VITE_API_BASE_URL` empty and set `API_VERSION="/api/v1"` in code.

**Direct URL**

* Set `VITE_API_BASE_URL="http://127.0.0.1:8000"` in `.env`.
* Keep `API_VERSION="/api/v1"`.

Example `.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## ⚙️ Configuration

`src/lib/config.ts` centralizes endpoints:

* `API_VERSION = "/api/v1"`
* `API_BASE_URL` from `VITE_API_BASE_URL` (optional)
* `joinUrl()` helper to avoid duplicate slashes/versioning mistakes

Local state:

* `useApiKey` stores the key in memory; user may opt-in to persist in `localStorage`.
* `jobId` is cached in `localStorage` for reconnect/replay.

---

## 📡 Streaming Details

* `useClaimsStreams` opens a `fetch` POST to `/stream-claim` and reads the **NDJSON** with a `ReadableStream`.
* Each full JSON line is parsed and dispatched:

  * `claim` → insert/update in the list
  * `progress` → update the determinate bar (phase + counts)
  * `error` → non-blocking banner; stream may continue
  * `done` → clean shutdown
* Reconnect logic:

  * If `jobId` exists and the backend still holds state (TTL window), the UI requests the stream and receives a **snapshot** event first, then buffered claims, then live extraction (skipping duplicates).

---

## 🧰 Export

`lib/export.ts` provides client-side export to:

* **JSON** — full session (claims + verification where available)
* **Markdown** — human-readable report (status, verdict, confidence, evidence excerpts)

No server involvement; downloads are purely client-side.

---

## 🎨 Design & Accessibility

* **Dark-first theme** with adequate contrast
* Scalable typography and spacing
* Keyboard focus and ARIA roles for modals/dialogs
* Reduced motion respect where possible
* Responsive layout (desktop-first; graceful on medium screens)

---

## 🧱 Build & Deploy

### Production build

```bash
pnpm build
pnpm preview
```

* Outputs to `/dist` with hashed assets
* Works behind any static host or CDN
* Configure backend URL via environment at deploy time (if not using proxy)

### Docker (example)

```dockerfile
# Frontend Dockerfile example
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: add nginx.conf for SPA history routing if using client-side routing
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

> Serve the built assets behind your reverse proxy. Point the UI to the backend via `VITE_API_BASE_URL` (or proxy `/api`).

---

## 🔐 Privacy & Security

* No auth, no accounts, no permanent storage on the frontend.
* API key is **never** sent anywhere except directly to the backend API you configure.
* Key can remain in memory only, or optionally persisted to `localStorage` (user choice).
* No analytics or third-party trackers.

---

## 🧩 Coding Standards

* **TypeScript strict** (no implicit `any`)
* Functional, composable components (hooks first; minimal context)
* Thin state surface: claims as the single source of truth; verifications patch the corresponding claim
* No payload/content logging in production
* Linting:

  * ESLint + `@typescript-eslint`
  * Prettier/Tailwind class ordering (via Tailwind v4)

---

## 🧰 Troubleshooting

* **Stream never starts** → check CORS/Origin and that the backend `/stream-claim` is reachable.
* **Reconnect shows nothing** → `jobId` may have expired server-side (backend TTL is runtime-configured).
* **Verify upload fails** → ensure the cited source PDF is valid and not larger than any enforced backend size/page limits.
* **CORS errors** → set `ALLOWED_ORIGIN` on the backend to your frontend origin.

---

## 📄 License

MIT © 2025 NefariousNiru