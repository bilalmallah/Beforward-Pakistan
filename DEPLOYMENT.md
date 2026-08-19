# Deployment Guide — Hostinger

## Read this first: which Hostinger plan you need

This app needs to run a persistent Node.js process (the API server, plus
a background worker for campaign sending) and connect to PostgreSQL and
Redis. That rules out Hostinger's shared/cPanel hosting for the full
app — shared hosting's Node.js support (Passenger) doesn't give you a
real Postgres server or Redis, and campaign sending needs both.

What actually works:

- Hostinger VPS (KVM plans) — a real Ubuntu server with root access.
  This is what the rest of this guide assumes. You install Postgres,
  Redis, Node, Nginx, and PM2 yourself, like any other VPS.
- Hostinger shared hosting plus external managed services — if you'd
  rather not run your own Postgres/Redis, point this app's .env at a
  managed Postgres (Neon, Supabase, Railway) and managed Redis
  (Upstash), and run the Node process on Hostinger's Node.js hosting
  (if your plan includes it) or a small VPS. The app doesn't care where
  Postgres/Redis physically live — only the connection strings in .env
  change.

Either way, the steps below assume shell access. If using external
managed DB/Redis, skip the install-Postgres and install-Redis steps and
just set DB_HOST / REDIS_URL in .env to the managed service's details.

## Architecture

One Node process serves everything:

Browser -> Nginx (:80/:443, TLS) -> Node backend (:4000)
  - /api/*        -> Express routers
  - /socket.io/*  -> Socket.IO (WebSocket)
  - everything else -> React SPA (backend/public)

The frontend is built once (npm run build in frontend/) and its output
lands directly in backend/public — see frontend/vite.config.ts. The
backend then serves those static files itself
(backend/src/middleware/serveFrontend.ts), so there's only one app to
deploy and one port to reverse-proxy. No separate static host, no CORS
juggling between a frontend domain and an API domain.

A second background process (the campaign send worker, started inside
the same index.ts — see startCampaignWorker()) shares the same Node
process; you don't need to run it separately.

## 1. Provision the VPS

1. Order a Hostinger VPS (KVM 2 or higher is plenty to start). Choose an
   Ubuntu 24.04 template.
2. Point your domain's DNS A record at the VPS's IP address.
3. SSH in as root (Hostinger gives you the IP + root password in hPanel).

## 2. Install system dependencies

```bash
apt update && apt upgrade -y

# Node.js 20+ (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PostgreSQL
apt install -y postgresql

# Redis
apt install -y redis-server
systemctl enable redis-server --now

# Nginx
apt install -y nginx

# PM2 process manager
npm install -g pm2

# Certbot for free SSL
apt install -y certbot python3-certbot-nginx
```

## 3. Set up PostgreSQL

```bash
su - postgres
psql -c "ALTER USER postgres PASSWORD 'CHOOSE_A_STRONG_PASSWORD';"
psql -c "CREATE DATABASE crm_whatsapp;"
exit
```

Skip this section entirely if using a managed Postgres instead — just
note its host/port/user/password/database name for step 6.

## 4. Get the code onto the server

```bash
cd /var/www
git clone <your-repo-url> crm-whatsapp
cd crm-whatsapp
```

(Or upload the zip and unzip it into /var/www/crm-whatsapp.)

## 5. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 6. Configure environment variables

```bash
cd ../backend
cp .env.example .env
nano .env
```

Set at minimum, for production:

```
NODE_ENV=production
PORT=4000
CLIENT_URL=https://yourdomain.com

DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_whatsapp
DB_USER=postgres
DB_PASSWORD=CHOOSE_A_STRONG_PASSWORD
DB_SSL=false

REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=<generate with: openssl rand -base64 48>
JWT_REFRESH_SECRET=<generate a DIFFERENT one the same way>
```

Fill in the META_* values once you're ready to connect the real
WhatsApp Cloud API (see the main README's Phase 4 section for exactly
where to get each one) — the app runs fine without them; WhatsApp
sending just stays gated behind a clear "not configured" error until
then.

Never commit .env to a public repo.

## 7. Build the frontend

```bash
cd ../frontend
npm run build
```

This outputs straight into backend/public — confirm with
`ls ../backend/public` (you should see index.html and an assets/
folder).

## 8. Run migrations and (optionally) seed data

```bash
cd ../backend
npm run migrate
# Only for a fresh demo/staging environment, NOT a real production
# launch, since it creates demo users with a known default password:
# npm run seed
```

If you do seed, immediately change the seeded users' passwords (or
delete them and create real accounts) before exposing the app publicly.

## 9. Start the app with PM2

```bash
cd /var/www/crm-whatsapp/backend
mkdir -p logs
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

Follow the printed instructions from `pm2 startup` to enable boot-time
start. Verify: `curl http://localhost:4000/api/health` should return
`{"status":"ok","env":"production"}`.

## 10. Configure Nginx

```bash
cp /var/www/crm-whatsapp/deploy/nginx.conf.example /etc/nginx/sites-available/crm.conf
nano /etc/nginx/sites-available/crm.conf
ln -s /etc/nginx/sites-available/crm.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Replace yourdomain.com in the config with your real domain before
enabling. At this point http://yourdomain.com should load the app.

## 11. Enable SSL (HTTPS)

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot edits the Nginx config to add the HTTPS server block and
redirect HTTP to HTTPS automatically. Follow its prompts.

After this, update CLIENT_URL in backend/.env to https://yourdomain.com
if it wasn't already, and restart:

```bash
pm2 restart crm-backend
```

## 12. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Do not expose port 4000, 5432, or 6379 to the internet — the app,
Postgres, and Redis should only be reachable through Nginx or from
localhost. If Postgres/Redis are on the same VPS (the default here),
their default configs already only listen on localhost.

## 13. Connect the real WhatsApp webhook (when ready)

In the Meta developer dashboard, set your webhook URL to:

```
https://yourdomain.com/api/whatsapp/webhook
```

and the verify token to whatever you set as WHATSAPP_VERIFY_TOKEN in
.env. Meta will hit the GET endpoint once to verify, then start sending
real events to the POST endpoint.

## Updating the deployed app

```bash
cd /var/www/crm-whatsapp
git pull
cd backend && npm install
npm run migrate
cd ../frontend && npm install
npm run build
pm2 restart crm-backend
```

## Monitoring

```bash
pm2 status
pm2 logs crm-backend
```

The app also exposes GET /api/system-health (Admin/Super Admin only)
which live-checks Postgres and Redis connectivity, not just whether the
Node process itself is running (spec section 60).

## Troubleshooting

- 502 Bad Gateway from Nginx: the Node process isn't running or isn't
  listening on port 4000. Check `pm2 status` and `pm2 logs`.
- App loads but shows a blank page: the frontend wasn't built, or wasn't
  built into backend/public. Re-run step 7 and check that
  backend/public/index.html exists.
- WebSocket features (live inbox updates) not working: usually a
  missing or misconfigured /socket.io/ block in Nginx — compare against
  deploy/nginx.conf.example.
- Campaigns stuck in QUEUED, never sending: Redis isn't reachable. Check
  `redis-cli ping` returns PONG, and that REDIS_URL in .env is correct.
- "WhatsApp Cloud API is not configured yet": expected until you fill in
  the real META_* values (see step 6 and the main README).
