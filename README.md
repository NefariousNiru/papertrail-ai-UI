# 💻 Frontend – README.md

## PaperTrail AI — React + Vite Frontend

### What problem does this solve?

Writers and reviewers need to **trust** that claims in a paper are properly supported by cited sources. PaperTrail AI provides a **live, visual, easy-to-understand** interface that surfaces claims, classifies them, and verifies support with evidence—so people can focus on ideas, not manual cross-checking.

### Goals

* Beautiful, modern **dark UI** with readable typography.
* **No auth**: the user pastes an API key (stored locally only).
* **Upload → stream**: show claims live as they’re extracted.
* For each claim: **Upload source → Verify** → show **verdict**, **confidence**, and **evidence**.
* **Export** results (Markdown/JSON) so nothing needs to be stored server-side.

---

## Tech stack

* React + Vite + TypeScript (strict)
* TailwindCSS (custom dark theme variables)
* Zustand (API key storage; optionally “remember on device” via `localStorage`)
* NDJSON streaming via `fetch` + `ReadableStream`
* Redis-backed persistence on the backend (2h TTL) for replay after refresh

---

## What’s implemented (MVP core)

* ✅ **Marketing page → Get Started → API key modal**

  * Key is masked and can be “remembered on device” (localStorage).
  * Validated via backend `/api/v1/validate-api-key`.

* ✅ **Dashboard**

  * Upload a paper → `/upload-paper` → receive `jobId` → start stream.
  * Claims stream in **live** from `/stream-claim`.
  * **Progress bar** uses backend events (will be page-based next).
  * **Claim list** with status chips; verdict badges appear once verified.

* ✅ **Claim Detail Modal (large)**

  * Actions: “Upload cited PDF & Verify” and “Skip”.
  * Shows **verdict**, **confidence**, **reasoning**, and roomy **evidence** cards.
  * On **Verify**, the modal updates immediately, and because the backend persists results, **refresh** brings them right back.

* ✅ **Export**

  * Export **JSON** or **Markdown** (includes status, verdict, confidence, and evidence).

* ✅ **Resume after refresh**

  * If `jobId` is in localStorage and within the backend’s 2h TTL, the app reconnects, replays claims, and merges any saved verification.

---

## Project structure (key parts)

```
src/
  features/
    api-key/             # API key modal, Zustand store (local-only)
    stream/              # NDJSON streaming hook (start/stop, dedupe, errors)
    upload/              # Upload card (gets jobId, saves in localStorage)
  components/
    claims/
      ClaimList.tsx
      ClaimRow.tsx
      ClaimDetailModal.tsx  # large modal with evidence cards & actions
    layout/
      AppShell.tsx        # header, theme switcher, reset API key
  lib/
    apiClient.ts          # validate, upload, stream, verify (multipart + NDJSON)
    config.ts             # API_BASE_URL + API_VERSION (e.g., '/api/v1')
    export.ts             # export JSON/Markdown
    types.ts              # Claim, Evidence, StreamEvent, etc.
  pages/
    Home.tsx
    Dashboard.tsx
```

---

## Running locally

**Prereqs**

* Node 18+
* pnpm

**Install & run**

```bash
pnpm install
pnpm dev
```

**Backend proxy (dev)**

* The app expects the backend at `/api/v1`. Configure Vite to proxy `/api` → `http://127.0.0.1:8000`.
* Alternatively set `VITE_API_BASE_URL="http://127.0.0.1:8000"` in `.env` and keep `API_VERSION="/api/v1"`.

**Environment**

* `VITE_API_BASE_URL` (optional; empty + proxy is fine)
* `API_VERSION` is defined in code as `"/api/v1"` (via `config.ts`).

---

## How the streaming UI works

* After upload, we save `jobId` to `localStorage`.
* We open a `fetch` POST to `/api/v1/stream-claim` with `{ jobId, apiKey }`.
* We parse the NDJSON stream line-by-line:

  * `{"type":"claim", "payload":{...}}` → add/update in list
  * `{"type":"progress", "payload":{"processed":n,"total":m}}` → update bar
  * `{"type":"error", ...}` → show error banner
  * `{"type":"done"}` → close

**On refresh**
If `jobId` still exists and Redis hasn’t expired (2h), the backend:

1. **Replays** buffered claims immediately.
2. **Merges** any persisted verification (verdict, confidence, reasoning, evidence).
3. Continues the live stream (skipping claims you already received), so you don’t see duplicates.

---

## UX notes

* “Skip” is **UI-only** by design; it does not persist to backend (and will reset on refresh). It is included in **exports** if you skip before exporting.

---

## Known limitations (MVP)

* Verification is a **demo stub**; real verification path (embedding + FAISS + Claude) is next.
* Progress bar uses generic totals in the demo; backend will switch to **page-based** progress events.
* Rate limiting and hard file size/page limits are not yet enforced.

---

## What’s next (frontend)

**P1 (immediate)**

1. **Evidence P1 (done)** — evidence now shows immediately after verify and on refresh.
2. **Integrate page-based progress** (consume new backend `phase:"parse"` events with `processed/total` pages).
3. **Uncited suggestions UI** — show top 3 Semantic Scholar links in each **uncited** claim row.

**P2 (soon after)**

4. **Filters** — quick filters by status (cited/uncited/weakly cited) and verdict (supported/unsupported/partially/skipped).
5. **List performance** — windowed list for 200+ claims.
6. **Accessibility** — focus trap in modal, keyboard nav, WCAG AA contrast pass.

---

## Developer tips

* Keep API calls **only** in `lib/apiClient.ts` (multipart + NDJSON parsing centralized).
* Use the `joinUrl` helper (already included) to avoid double slashes/versions.
* Don’t expand the state surface: claims are the source of truth for the UI; verification updates should always patch the claim in place.
* When adding new stream event types, extend `StreamEvent` in `lib/types.ts` first, then adapt `useClaimsStream`.

---

## Demo flow (for handoff)

1. Start Redis + Backend; run Frontend (proxy `/api`).
2. Open the app → **Get Started** → paste **API key** (modal validates via backend).
3. **Upload** a paper → watch **live streamed claims** and **progress**.
4. Click a claim → **Upload cited PDF & Verify** → see **verdict, confidence, reasoning, and evidence**.
5. **Refresh** the page → previously streamed claims replay; verified states persist (2h).
6. **Export** Markdown/JSON to save results locally.

---

### One-line next task (so the next chat picks up cleanly)

> **Next up (Backend+Frontend):** Implement **page-based progress** end-to-end. Backend should emit `{"type":"progress","payload":{"phase":"parse","processed":<page>,"total":<total_pages>}}` during parsing, then finalize with extraction totals. Frontend should render the determinate bar from these events (no indeterminate states), show a short label like “Parsing page X/Y”, and replay the latest snapshot on refresh. After that, add Redis-backed **rate limiting** and enforce **file size/page limits** on upload.
