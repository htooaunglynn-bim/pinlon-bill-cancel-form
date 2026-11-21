# Pinlon POS Admin

An admin dashboard for the **bim-lpms POS API**: it generates onboarding and invoice QR codes, runs every POS terminal call, and keeps a local activity history.

It covers only what the other Pinlon UIs don't:

| Already elsewhere | Where |
|---|---|
| Bill-cancel **report** | `dashboard/` → Transaction → Billing Cancellation |
| Branch (location) CRUD, QR scan log, POS integration guide | `loyalty-central-dashboard/` |

> [!WARNING]
> **Secrets are compiled into the bundle.** Vite inlines every `VITE_*` value, including the admin password and the shared POS token, into the public JavaScript, so anyone who can load the site can read them.
> - Deploy only behind hosting-level access control, such as Netlify password protection or an IP allowlist.
> - Prefer UAT credentials.
> - Rotate `POS_POINT_PAYMENT_TOKEN` if the site is ever exposed.

## Features

- **Sign-in**: username and password from env, with a session that expires after `VITE_SESSION_HOURS` and a cooldown after 5 failed attempts.
- **Hospital switcher**: the tenants come from `VITE_POS_TENANTS`, and each one gets a live `/health` check every minute.
- **Onboarding QR**: `PID,Name,FatherName,DOB,Phone,Gender,Baby` for new members, or the 6–7 field family-link variant.
  - The validation mirrors `CreateOnboardingQrStringRequest` and `CreateLinkQrStringRequest`.
  - Single or batch mode (CSV), with PNG/SVG download and an A4 label sheet.
- **Invoice QR**: `PID,BID,Department,Amount,Date`, where a blank department becomes `Null` and the date is formatted `DD MON YYYY`.
  - Warns about the minimum amount and when the bill isn't dated today.
  - Prints an 80mm receipt, and supports batch labels.
- **Customer app (Mobile)**: acts as the customer's Pinlon app, for producing a POS scan QR.
  - Sign in with a mobile number (`09…` is sent as `+959…`) and a 6-digit OTP: `POST /api/v1/customer/otp/request` and `/otp/verify`.
  - Generate the 5-minute, single-use POS QR (`POST /api/v1/customer/pos-scan`) with a live countdown, and hand it to Lookup / Earn / Redeem in one click.
  - This signs in as a **real customer**, so use test accounts on UAT. Hospitals in test OTP mode accept `000000`.
  - The customer token is kept per hospital in `sessionStorage` and cleared on dashboard sign-out. OTP codes and tokens are never written to history.
- **POS terminal**:
  - **Customer lookup** (`GET /customers/lookup`): camera, upload or USB scanner input, plus a points preview.
  - **Earn / Redeem** (`POST /points/process`): uses a reference as the idempotency key.
  - **Bill cancel** (`POST /bill/cancel`): shows the refund and recharge legs separately.
  - **Redemptions** (`GET /point-payments/claim`, `GET /reward-discounts/apply`): approve or decline.
  - Every call that changes data asks for confirmation first, and every error code comes with a plain-language hint.
- **Activity history**: the last 1,000 calls and generated QRs, kept in `localStorage`.
  - Filters, a detail drawer, re-printing QRs, a "cancel this bill" shortcut, and CSV/JSON export.
- **Settings**: local copies of the hospital rules (minimum invoice amount, age limit, default location ID, receipt header/footer), plus an env overview and API reference.

## Setup

```bash
nvm use            # Node 26
npm ci
cp .env.example .env.local   # then fill it in
npm run dev
```

| Variable | Required | Notes |
|---|---|---|
| `VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD` | yes | Dashboard sign-in |
| `VITE_POS_TOKEN` | yes | Same value as `POS_POINT_PAYMENT_TOKEN` in bim-lpms |
| `VITE_POS_TENANTS` | yes | JSON array, e.g. `[{"key":"pinlon","name":"Pinlon","host":"https://pinlon-lpms.bimats.com"}]` |
| `VITE_DEFAULT_TENANT` | no | Tenant key; defaults to the first one |
| `VITE_SESSION_HOURS` | no | Default 8 |

If a required value is missing, the app shows a "Configuration missing" screen listing what's wrong.

The POS API allows any origin (`bim-lpms/config/cors.php`), so the browser calls each tenant host directly. No proxy is needed.

## Scripts

- `npm run dev`: dev server on port 5173
- `npm run build`: typecheck, then a production build into `dist/`
- `npm run preview`: serve the build

## Stack

React 19, TypeScript, Vite 8, Tailwind v4 (with the Clay design tokens in `src/index.css`), `motion`, react-router 7 (HashRouter), `qrcode` and `qr-scanner`.

## Layout

```
src/
  config/env.ts          env parsing + validation
  context/               AuthContext (sign-in), TenantContext (hospital + health)
  lib/api.ts             posApi(): bearer auth, never throws, writes history
  lib/errors.ts          error_code → hint table
  lib/history.ts         local activity log (useSyncExternalStore)
  lib/prefs.ts           local hospital-rule preferences
  lib/qr/                onboarding / invoice builders + validators, scan parsers, renderer
  components/            Clay UI primitives, QrPreview, QrScanner, ConfirmDialog, …
  pages/                 one file per route
```

When the backend changes, keep `lib/qr/*.ts` in sync with the bim-lpms FormRequests named in each file's header.
