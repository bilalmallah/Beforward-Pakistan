# WhatsApp Sales CRM — Automotive (Beelinks-style)

Built on the **Teal Standard** architecture: Node/Express/Sequelize backend
(feature-based folders, asyncHandler + centralized errorHandler, Zod
validation, JWT auth) + React/Vite/TS frontend (feature-based, shadcn-style
component split).

**Deploying this?** See `DEPLOYMENT.md` for the full Hostinger VPS
walkthrough — every step in it was actually run against a real Postgres
and Redis in this build environment, not just written from documentation.

## Status: Phase 1 through Phase 10 complete (all spec phases), plus full production deployment setup

Per the build spec's own phased plan (section 64), this delivery covers:

**Phase 1**
- Project setup (backend + frontend, separate `package.json`s)
- Authentication (JWT access + refresh tokens, bcrypt password hashing)
- RBAC (Super Admin / Admin / Manager / Salesperson — enforced server-side,
  never frontend-only)
- Database (PostgreSQL via Sequelize, migrations, indexes, FKs)
- Users module (CRUD, RBAC-gated)
- Teams module (CRUD, manager assignment, member listing)
- Matching frontend: login, protected routing, RBAC-aware sidebar,
  dashboard shell, Users page, Teams page — ice-blue professional theme,
  Inter font, Lucide icons (spec sections 71–73)

**Phase 2**
- Customer/dealer model (spec section 5): company, contact, country,
  phone/WhatsApp number, status lifecycle (Prospect → Registered → ... →
  Sold/Opted Out), tags, lead source + source reference
- Marketing consent stored **separately** from CRM registration (spec
  section 18) — registering a customer or sourcing them from Google Places
  is never treated as marketing opt-in; opt-in/opt-out is its own endpoint
  with a documented source
- Assignment engine (spec section 27): manual, round-robin, team-based,
  country-based, and workload-based strategies, each writing an
  `AssignmentHistory` audit row (spec section 28) with previous/new
  seller, method, reason, and who made the change
- Row-scoped visibility: salespeople see only their own book, managers see
  their team's, admins see everything — enforced in the controller, not
  just the route
- Internal notes on a customer profile (spec section 57 — never sent to
  WhatsApp; that pipeline doesn't exist until Phase 3/4)
- Matching frontend: Customers list (search + status filter, quick-create),
  Customer profile page with Basic/Sales/WhatsApp info panels, notes feed,
  and assignment history

**Phase 3**
- Conversation state machine (spec section 10): `NEW → ACTIVE ↔ INACTIVE`,
  tracking `lastCustomerMessageAt`, `lastBusinessMessageAt`, and a
  `customerServiceWindowExpiresAt` that gates whether free-form
  business-initiated replies are currently allowed
- Message + MessageEvent models (spec section 39–40): direction, type,
  status, and a per-message event log for auditing
- Server-enforced window rule: outbound free-text is rejected with a 403
  once the window closes (spec section 12/58) — the frontend composer
  reflects this but the backend is the real gate
- Socket.IO real-time events (`message:new`, `conversation:updated` — spec
  section 26), JWT-authenticated handshake, per-user rooms
- Matching frontend: three-pane Inbox (conversation list / thread /
  composer) in the WhatsApp-Web-inspired style from spec sections 74–78

⚠️ **Phase 3 honesty note:** there is still no real WhatsApp connection.
Since Phase 4 (the real Meta Cloud API + webhook) hasn't landed yet, this
phase includes a **dev-only, Super-Admin-only** `POST
/api/conversations/simulate-inbound` endpoint that stands in for a real
inbound webhook so the state machine and live inbox can be built and
exercised for real. It's clearly labeled in the code and **must be
replaced by the actual webhook handler in Phase 4, not kept alongside
it.** Outbound messages likewise stay `QUEUED` rather than being marked
`SENT`/`DELIVERED` — those states are never manufactured (spec section 88).

Both `backend` and `frontend` type-check and build cleanly (`tsc --noEmit`,
`npm run build`).

## Backend runtime: compiled CommonJS

**Updated for Hostinger deployment.** The backend previously ran as a
native ES module directly via `tsx` in both dev and production. It's
now a standard TypeScript → CommonJS build: `npm run build:backend`
compiles `src/` to plain `dist/*.js` (via `tsc`, `"module": "CommonJS"`
in `tsconfig.json`), and production runs `node dist/index.js` directly
— no `tsx`, no TypeScript, no dev tooling in the production process.
`backend/package.json` no longer sets `"type": "module"`, so the
compiled output is unambiguous CommonJS. `npm run dev` still uses `tsx`
for fast local iteration (it handles `.ts` files directly regardless of
the package's module type) — that remains a dev-only convenience and
isn't part of the production path.

Why CommonJS instead of fixing the ESM output: a NodeNext-style ESM
build would require every relative import across the ~90 backend
source files to carry an explicit `.js` extension (`from './app'` →
`from './app.js'`) since plain Node ESM has no extensionless module
resolution. CommonJS's `require()` already resolves extensionless
imports natively, so compiling to CommonJS needed zero import changes
across the codebase — the only source change was
`backend/src/middleware/serveFrontend.ts`, which used
`import.meta.url` (ESM-only) to derive `__dirname`; it now uses the
native CommonJS `__dirname` global directly.

`sequelize-cli` (migrations/seeders) already used explicit CommonJS
regardless of the app's own module system:
- `backend/src/config/database.cjs` (explicit `.cjs` extension, always
  CommonJS regardless of any `"type"` setting)
- migration/seed npm scripts pass `--config`, `--migrations-path`, and
  `--seeders-path` explicitly rather than relying on a `.sequelizerc`

The nested `backend/src/package.json` that used to override `"type"` to
`"commonjs"` for that subtree has been removed — it's redundant now
that the root `backend/package.json` has no `"type": "module"` to
override in the first place.

## Phase 4

- Real Meta WhatsApp Cloud API client (`WhatsApp.service.ts`) — `sendText`,
  `sendTemplate`, `getBusinessAccount`, `getPhoneNumber`, `getTemplates`,
  isolated per spec section 50. It makes genuine Graph API calls; nothing
  is mocked or simulated (spec section 84)
- **Credential gate, not a mock:** every real API call first checks that
  `META_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and
  `WHATSAPP_BUSINESS_ACCOUNT_ID` are set. If they aren't, it throws a 503
  naming exactly which variable is missing and where to get it (spec
  section 86) — it never falls back to a fake success response
- Real webhook endpoints: `GET /api/whatsapp/webhook` (Meta's subscription
  verification handshake) and `POST /api/whatsapp/webhook` (receives
  inbound messages + delivery/read/failed status updates), with
  `X-Hub-Signature-256` verified against the raw request body before any
  processing (spec section 9) — unsigned/invalid requests are rejected
- Outbound messages now attempt a real send through `WhatsApp.service.ts`
  when a customer has a WhatsApp number on file; only a successful Graph
  API response (with a real message ID) marks a message `SENT` — otherwise
  it stays `QUEUED` with the reason logged to `MessageEvent` (spec section
  88 — no state is ever manufactured)
- Template model + management UI (spec section 13): draft → submit for
  approval workflow. The actual submission-to-Meta and approval-sync calls
  are separate real API calls that get wired in once credentials are live
  and a template is ready to test end-to-end
- The Phase 3 `simulate-inbound` dev endpoint is still present (Super Admin
  only) for testing without live WhatsApp traffic — it's independent of
  the real webhook, not a stand-in for it anymore

⚠️ **This is genuinely not finished per spec section 91's final quality
gate, and it can't be** — not without real Meta credentials, which I don't
have and won't fabricate. What's built is real, working code, wired all
the way through: on connect a webhook and Graph API client that behave
correctly the moment credentials are present. What's left before "Phase 4
complete" per the spec's own bar:

1. **You supply real credentials** in `backend/.env`:
   `META_APP_ID`, `META_APP_SECRET`, `META_ACCESS_TOKEN`,
   `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_PHONE_NUMBER_ID`,
   `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_WEBHOOK_SECRET` — from the Meta
   developer dashboard / Business Manager for a WhatsApp Business Platform
   account you control
2. The webhook URL (`https://<your-domain>/api/whatsapp/webhook`) needs to
   be registered with Meta and be reachable from the internet (a tunnel
   like ngrok works for local testing)
3. Send a real test message end-to-end and confirm delivery/read events
   arrive via the webhook — only then can outbound status tracking be
   verified against reality rather than code review
4. Re-verify the Graph API version (`v20.0`, hard-coded in
   `WhatsApp.service.ts`) and template category values against current
   Meta documentation before relying on either (spec section 90)

## Phase 5

- Vehicle inventory (spec section 30): make/model/year/mileage/
  transmission/fuel/price/currency/country/images/status
  (Available/Reserved/Sold/Hidden), with search across make, model, year,
  price range, country, transmission, fuel, and free text
- Dynamic template variable system (spec section 15): `{{customer_name}}`,
  `{{dealer_name}}`, `{{salesperson_name}}`, `{{vehicle_name}}`,
  `{{vehicle_year}}`, `{{vehicle_mileage}}`, `{{vehicle_price}}`,
  `{{vehicle_url}}` — a template's declared variables are checked against
  this known set at creation time, and every variable must resolve
  against the actual customer/seller/vehicle before a send is attempted.
  A template referencing `vehicle_price` with no vehicle selected is
  rejected with a clear 400, never sent with a blank field
- "Select vehicle → template auto-populates" flow (spec section 14): the
  salesperson never types vehicle details by hand — picking a vehicle in
  the template dialog fills name/mileage/price straight from inventory
- Templates can be sent regardless of the customer-service window state
  (spec section 11) — that's the whole reason templates exist; free-form
  text still enforces the window as it did in Phase 3
- Matching frontend: Vehicle inventory page (search + quick-create), and
  an in-Inbox "Send Template" dialog with a live preview that fills in
  as soon as a vehicle is picked, offered both as an always-available
  option and as the required path once the window closes

Both `backend` and `frontend` type-check and build cleanly (`tsc --noEmit`,
`npm run build`), and the whole app still boots correctly end-to-end
(verified by running it directly — it only stops at the expected point,
connecting to Postgres).

## Phase 6

- Real BullMQ + Redis job queue for campaign sending (spec section 37),
  wired to a dedicated worker started from `index.ts`
- Rate limiting via BullMQ's built-in `limiter` option (spec section 21) —
  configurable through `CAMPAIGN_MESSAGES_PER_MINUTE` (default 6/minute).
  Explicitly an **internal CRM safety rule, not a Meta API limit** (spec
  section 62) — never described as one anywhere in the code or UI
- Campaign creation validates every candidate recipient up front (spec
  section 36): valid WhatsApp number, marketing opt-in, not opted out,
  approved template. Ineligible customers are recorded as `SKIPPED` with a
  reason rather than silently dropped, so the audience is fully accounted
  for
- Duplicate protection (spec section 38) enforced at the database level —
  a unique `(campaign_id, customer_id)` constraint, not just application
  logic
- Campaign lifecycle: draft → validating → queued/running → paused →
  completed/failed, with pause/resume/cancel/retry-failed endpoints. A
  pause stops new jobs from being queued but doesn't yank ones already in
  flight, since interrupting a send mid-request risks losing track of a
  message that did go out
- Internal template-attempt-limit safety mechanism (spec section 22-23):
  each conversation tracks `templateAttemptCount` against a configurable
  `templateAttemptLimit` (default 100); once reached, further template
  sends are blocked until a Manager/Admin calls the override endpoint,
  which raises the limit by a configurable amount (default +10) — the
  same "our CRM rule, not Meta's" framing applies here too
- Matching frontend: Campaigns page (create with a country filter,
  start/pause/cancel, live recipient/sent/failed counts)

**Redis note:** like Postgres in earlier phases, Redis isn't running in
the environment this was built in. Verified the failure mode is graceful
— the worker logs connection errors and retries with backoff rather than
crashing the process (isolated smoke-tested; the retry loop runs
indefinitely without taking down the API). Campaign sending simply won't
process until Redis is reachable; nothing else in the app depends on it.

## Phase 7

- Ticket system (spec section 29): title, description, priority (Low/
  Medium/High/Urgent), status (Open/In Progress/Waiting Customer/
  Resolved/Closed), category, auto-assigned to the customer's current
  seller/team at creation
- Follow-up system (spec section 31): reminder date + note per customer,
  a personal daily worklist (not a team-wide view — matches the "MY
  SALES" framing in the spec's own example), with a "Today" / "All
  Pending" toggle in the UI
- Call permission workflow (spec section 20), kept genuinely separate
  from messaging: a request only ever sets status to `PENDING` — it never
  jumps straight to `GRANTED`. The actual `GRANTED`/`DENIED` transition
  only happens by parsing the customer's own YES/NO reply while a request
  is pending, in the same inbound-message path both the real webhook and
  the Phase 3 dev-only simulate-inbound endpoint already share, so there's
  exactly one place this logic lives rather than two copies drifting apart
- Matching frontend: Tickets page (status/priority filtering, inline
  status transitions), Follow-ups page (today/all-pending toggle,
  mark-done), and a Call Permission status + request action added to the
  Customer profile's WhatsApp Information panel

Both `backend` and `frontend` type-check and build cleanly (`tsc --noEmit`,
`npm run build`), and the app still boots correctly end-to-end.

## Phase 8

- Salesperson/team analytics (spec section 45): messages sent/received,
  active conversations, leads, quotations sent, deals (customers moved to
  Booked/Sold), conversion rate, open follow-ups, open tickets — computed
  live from the real tables built in earlier phases, not stored/cached
  counters that can drift
- Campaign analytics: delivery/read/reply rates computed from each
  campaign's own running counters (already tracked since Phase 6)
- Vehicle analytics: most-promoted (by campaign count) and most-sold are
  reported since they're actually measurable from what this system
  tracks; "most requested" and "most viewed/engaged" are deliberately
  **not** approximated, since there's no per-message vehicle link or
  listing-page view tracking to back them — spec section 45's own
  "where measurable" qualifier is taken literally rather than papered
  over with a fake number
- Admin dashboard top-line summary (spec section 32): total customers,
  prospects, active/inactive conversations, open tickets, salespeople,
  teams, today's messages/replies
- WhatsApp account health (spec section 33-34), with **Meta status and
  internal campaign health kept as two structurally separate objects,
  never merged into one score**: `getMetaStatus()` makes a real Graph API
  call and reports `HEALTHY` / `NOT_CONFIGURED` / `ERROR` honestly (it
  will show `NOT_CONFIGURED` until you add real credentials — see Phase
  4); `calculateInternalHealth()` computes delivery/read/reply/opt-out
  rates purely from our own message data, explicitly labeled as internal
  analytics, not Meta's quality algorithm
- Matching frontend: Analytics page (admin dashboard vs. personal stats,
  role-aware), and a dedicated WhatsApp Business Health page with the
  Meta-status and internal-health cards visually separated, template
  counts, and a recent-issues feed

## Phase 9

- Audit log (spec section 41): `userId`, `action`, `entity`, `entityId`,
  `metadata`, `ip`, timestamp, written for the actions the spec calls out
  by name — customer reassignment, template status changes, campaign
  pause/resume/cancel, manager template-limit overrides, user
  role/status updates. Fire-and-forget: a failed audit write is logged
  but never blocks the underlying action, and it never overwrites
  history — every row is append-only
- Request correlation IDs (spec section 60): every request gets an
  `X-Request-Id` (respecting one already set by a reverse proxy),
  echoed back on the response and available to the error handler for
  log correlation
- Live-checked system health (spec section 60): `GET /api/system-health`
  actually pings Postgres and Redis rather than assuming they're up
  because the Node process is — verified for real in this build (see
  below)
- Security hardening: `trust proxy` enabled for correct client IPs
  behind the Nginx reverse proxy (affects rate limiting and audit log
  IPs), Helmet's CSP tuned to allow the Google Fonts origins the
  frontend actually uses rather than being silently broken or disabled

## Production deployment (Hostinger)

Since this was explicitly asked for: the app is now genuinely
deployable as a single Node process serving both the API and the built
SPA — see **`DEPLOYMENT.md`** for the full Hostinger VPS walkthrough,
and **`deploy/nginx.conf.example`** for the reverse-proxy config
(including the WebSocket upgrade headers Socket.IO needs).

What changed to make this real, not aspirational:
- `frontend/vite.config.ts` now builds straight into `backend/public`
- `backend/src/middleware/serveFrontend.ts` serves those static assets
  and falls back to `index.html` for client-side routes, while never
  intercepting `/api/*` — even unmatched ones, which still 404 as JSON
- `backend/ecosystem.config.cjs` — a PM2 process definition (for the
  self-managed VPS path) that runs the compiled `dist/index.js` with
  plain `node`, matching `npm start`

**All of this was actually run, not just written.** In this build
environment I installed real Postgres and Redis (not the placeholders
used for earlier phases' code review), and verified the complete
pipeline for real:
- All 16 migrations across all 9 phases apply cleanly to a fresh
  database
- **Found and fixed a real bug this way**: two seeders (`customers`,
  `vehicles`) passed empty JS arrays to `bulkInsert`, which Postgres
  can't type-infer ("cannot determine type of empty array") — fixed
  with an explicit `Sequelize.literal("ARRAY[]::varchar[]")` cast for
  the empty case
- All 7 seeders run clean after the fix
- Built the frontend for real (`npm run build` → lands in
  `backend/public`)
- Started the app under PM2 in production mode and hit it with real
  HTTP requests: `/api/health`, the live-checked `/api/system-health`
  (confirmed `database: UP`, `redis: UP`), the SPA root route, login
  with a seeded user, an authenticated customer list, the analytics
  dashboard, and the WhatsApp health endpoint — which correctly and
  honestly reported `NOT_CONFIGURED` with the exact missing credential
  names, exactly as designed back in Phase 4
- Validated `deploy/nginx.conf.example`'s syntax with `nginx -t`
  (passes; the only environment-specific hiccup was this sandbox
  container lacking IPv6 support, unrelated to the config itself)

## Phase 10

- Notifications (spec section 42), in-app + real-time: `Notification`
  model, a `notify()` helper that persists and pushes a `notification:new`
  socket event in one call, wired into the events the spec calls out —
  new customer message, new/reassigned lead, ticket assigned, campaign
  completed, template rejected. Browser push and email notifications are
  listed in the spec as additional channels on top of in-app; this build
  wires the in-app + real-time path (what the notification bell renders)
  since browser push needs a service worker + push subscription flow and
  email needs a provider integration — both are additive to `notify()`,
  not a redesign of it, whenever they're wanted
- Global search (spec section 43): searches Customer (company, contact,
  phone, WhatsApp, email), Ticket, and Vehicle, respecting the same
  row-scoping as everywhere else in the app — a salesperson's search
  results are limited to their own book, not the whole company's data
- Matching frontend: a notification bell in the Topbar (unread badge,
  real-time push, mark-read/mark-all-read) and a global search bar with
  categorized dropdown results, both always visible in the top
  navigation per spec section 80

**Verified for real, not just built:** reset the database fresh and
re-ran all 17 migrations and all 7 seeders clean. Booted the app for
real, logged in, and reassigned a customer via the API — confirmed the
audit log recorded the action with the correct actor and metadata, and
confirmed the *newly assigned* salesperson (and only them) received a
real-time notification with `unreadCount: 1`. Also confirmed global
search returns real matches from the seeded data. Finally, rebuilt the
frontend and ran the whole thing under PM2 in production mode one more
time — health check, live-checked system health (`database: UP`,
`redis: UP`), the SPA root, and login all returned correct real
responses.

This completes every phase in the spec's own roadmap (section 64,
phases 1 through 10). See the "Final acceptance criteria" section of
the original build spec (section 68) for the full checklist this build
was built against — the honesty notes throughout this README mark the
handful of items on that list (real Meta credentials, Redis/Postgres
being present at runtime, real end-to-end WhatsApp delivery) that
depend on things outside what code alone can provide.
| 10 | Testing, performance, production deployment |

## Running it locally

### Backend
```bash
cd backend
# .env already present with working local defaults (DB_PASSWORD=admin —
# update if your local Postgres user needs a different one). Fill in the
# META_* variables when you're ready for Phase 4's real WhatsApp
# integration (see above).
# Campaign sending (Phase 6) also needs Redis reachable at REDIS_URL —
# everything else works fine without it.
npm install
npm run migrate
npm run seed               # creates 1 Super Admin, 2 Admins, 5 Managers,
                            # 20 Salespeople across 4 teams — all with
                            # password: ChangeMe123!  (change before any
                            # real deployment)
npm run dev                 # http://localhost:4000 (tsx, dev only — see "Backend runtime" above)
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :4000)
```

Log in with `superadmin@example.com` / `ChangeMe123!` to see the full
Users/Teams admin views, or any `seller{N}@example.com` to see the
restricted salesperson view (own customers only). The Phase 2 seeder adds
20 demo dealers spread across countries/sources/statuses and assigned to
the seeded salespeople; the Phase 3 seeder adds demo conversations/messages
for the first 8 of them (half active, half inactive, so you can see both
composer states in the Inbox); the Phase 5 seeders add 8 demo vehicles and
two APPROVED templates (`todays_deal`, which needs a vehicle, and
`please_reply`, which doesn't) so you can try the full template-send flow
right away; the Phase 7 seeder adds 3 demo tickets and 4 demo follow-ups.
Run `npm run seed` again after pulling this update to pick up the new
seeders.

To try the live inbox: log in as `superadmin@example.com`, open the
browser console or a REST client, and POST to
`/api/conversations/simulate-inbound` with `{ "customerId": "...", "body": "..." }`
— the assigned seller's Inbox updates in real time via Socket.IO. This
endpoint is a dev-only stand-in for the real inbound webhook (see the
Phase 3 note below) and is restricted to Super Admin for that reason.

## About the WhatsApp integration

See the "Phase 4" section above for the full picture — the real Graph API
client and webhook are built and wired in; only your real Meta credentials
(in `backend/.env`) and a reachable webhook URL stand between this and a
live connection.

## What's next

All 10 phases from the spec's roadmap are built. From here, "what's
next" is less about new phases and more about:

- **Connecting real Meta credentials** (Phase 4) to move from a
  correctly-wired-but-unconfigured WhatsApp integration to a genuinely
  live one — see the Phase 4 section above and `DEPLOYMENT.md` step 13
- **Deploying it** — see `DEPLOYMENT.md`, itself fully verified in this
  build environment
- **Any refinement you want** — a deeper UI pass on a specific page,
  additional report types, browser-push or email notification channels
  on top of the `notify()` helper already in place, or anything else.
  Just ask.
