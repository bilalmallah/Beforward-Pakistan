import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from './config/config.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import requestId from './middleware/requestId.js';
import serveFrontend from './middleware/serveFrontend.js';

import authRouter from './features/Auth/Auth.router.js';
import userRouter from './features/User/User.router.js';
import teamRouter from './features/Team/Team.router.js';
import customerRouter from './features/Customer/Customer.router.js';
import conversationRouter from './features/Conversation/Conversation.router.js';
import whatsappRouter from './features/WhatsApp/WhatsApp.router.js';
import templateRouter from './features/WhatsApp/Template.router.js';
import vehicleRouter from './features/Vehicle/Vehicle.router.js';
import campaignRouter from './features/Campaign/Campaign.router.js';
import ticketRouter from './features/Ticket/Ticket.router.js';
import followUpRouter from './features/FollowUp/FollowUp.router.js';
import analyticsRouter from './features/Analytics/Analytics.router.js';
import auditLogRouter from './features/AuditLog/AuditLog.router.js';
import notificationRouter from './features/Notification/Notification.router.js';
import searchRouter from './features/Search/Search.router.js';
import { getSystemHealth } from './features/SystemHealth/SystemHealth.service.js';

const app: Application = express();

// Behind a reverse proxy (Nginx on the deployment target — see
// DEPLOYMENT.md) so Express reads the real client IP/protocol from
// X-Forwarded-* headers instead of the proxy's own. Needed for correct
// rate limiting, audit log IPs, and secure-cookie detection.
app.set('trust proxy', 1);

app.use(requestId);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // The frontend's Inter font is loaded from Google Fonts (see
        // frontend/src/index.css) — allow just those two origins rather
        // than disabling CSP or self-hosting the font file.
        'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        'font-src': ["'self'", 'fonts.gstatic.com'],
      },
    },
  })
);
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Captures the raw request body alongside the parsed JSON so the WhatsApp
// webhook handler can verify Meta's X-Hub-Signature-256 header against the
// exact bytes Meta sent (spec section 9) — signature checks fail silently
// if you verify against a re-serialized JSON body instead.
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use(generalLimiter);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', env: config.env });
});

// Live-checked infrastructure status (spec section 60) — distinct from
// the plain liveness check above.
app.get('/api/system-health', async (_req, res) => {
  const report = await getSystemHealth();
  res.status(200).json(report);
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/teams', teamRouter);
app.use('/api/customers', customerRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/whatsapp/templates', templateRouter);
app.use('/api/vehicles', vehicleRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/followups', followUpRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit-logs', auditLogRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRouter);

app.use('/api', notFoundHandler);

// Serves the built SPA (backend/public, produced by `npm run build` in
// frontend/) for every non-API route, with a client-side-routing
// fallback to index.html. No-ops harmlessly if the frontend hasn't been
// built yet (e.g. local dev, where Vite's own dev server serves it
// instead — see DEPLOYMENT.md).
serveFrontend(app);

app.use(errorHandler);

export default app;
