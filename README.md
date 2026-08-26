# Pinlon LPMS — Department Formula Test Harness

Internal QA harness for the Pinlon LPMS loyalty backend, in a claymorphism UI.

It is a dashboard: a left sidebar holding the navigation, with staff/customer session status and
**Sign out** pinned to its bottom. Below 1024px the sidebar becomes a drawer, opened by the
floating button in the top-left corner. Three routes, unchanged in behaviour from the original
single-file version:

| Route | Page | What it does |
|---|---|---|
| `#/` | **Staff Login** | Staff (admin) login. Redirects to the formulas page on success. |
| `#/formulas` | **Formulas & Preview** | A compact list of departments (name, formula, variable count) plus the preview scratchpad. Load and **Save formulas** live here. At `xl` the preview sticks beside the list. |
| `#/formulas/:id` | **One department** | That department's name, formula and variables, with a live result for its own formula. Done / Cancel return to the list. |
| `#/earn` | **Earn Test** | Customer OTP session (master OTP, local/uat/testing only) plus an invoice earn. |

Because `PUT /api/v1/staff/settings` rewrites the **whole** `department_formulas` array, the
per-department page is only an editing view over one entry — **Save formulas** on the list sends
every department at once, and an "unsaved changes" note appears while edits are pending. Department
ids are per-session, so a `#/formulas/:id` link stops resolving after a reload; the page says so
rather than failing.

Only the formulas page requires a staff token — without one it shows a gate card. **The Earn Test
deliberately is not gated**: it authenticates a *customer* via OTP and never needed staff login.
The preview scratchpad is local-only and works signed out.

`src/lib/formulaEvaluator.ts` is a faithful port of the server's `app/Support/FormulaEvaluator.php`,
and `src/features/FormulaPreview/evaluatePreview.ts` applies the same checks in the same order as
`UpdateSettingsRequest`. **Both must be kept in step with the PHP when it changes.**

### Routing

`HashRouter`, not `BrowserRouter` — hence the `#` in URLs. This app is served ad hoc (opened
locally, or from a plain static server) with no SPA rewrite rule, where `BrowserRouter` deep links
would 404. If it ever lands somewhere with rewrites, swap the import in `src/App.tsx`.

### Sessions

Staff and customer tokens are kept in `sessionStorage` (`pinlon-harness:*`) so a refresh or a
deep link does not log you out. **This means a production staff bearer token sits in browser
storage, readable by any script on the origin.** It is cleared when the tab closes and by the
**Sign out** button in the topbar. Every storage access is wrapped in try/catch, so the app still
works (just without persistence) in private windows or with site data blocked.

## Running

Requires **Node 26+** (pinned in `.nvmrc` and `engines.node`). With nvm or fnm:

```bash
nvm use
npm install
npm run dev
```

`/api` is proxied to `https://pinlon-lpms.bimats.com` by `vite.config.ts`, so local development
has no CORS problem and needs no backend change.

## Building & deploying

```bash
VITE_API_BASE=https://pinlon-lpms.bimats.com npm run build
```

Output is static (`dist/`). Because the build talks to the API cross-origin, **the deployed origin
must be in the API's CORS allowlist** — the same constraint the original page had.

Leave `VITE_API_BASE` empty to keep using a same-origin `/api` path (e.g. if the app is ever
served from behind the same reverse proxy as the API).

## Stack

Vite · React 19 · TypeScript · Tailwind v4 (CSS-first `@theme`, no config file) · Motion.

The clay look is three utilities in `src/index.css` — `clay-surface` (raised), `clay-pressable`
(squashes on `:active`), `clay-inset` (fields pressed into the clay) — plus the pastel token set.
3D art in `public/clay/` is Microsoft Fluent Emoji (MIT), vendored so the page pulls no CDN assets
apart from Google Fonts.
