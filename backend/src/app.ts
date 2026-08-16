import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from './config/config';
import { generalLimiter } from './middleware/rateLimiter';
import errorHandler from './middleware/errorHandler';
import notFoundHandler from './middleware/notFoundHandler';
import serveFrontend from './middleware/serveFrontend';


import authRouter from './features/Auth/Auth.router';
import userRouter from './features/User/User.router';
import teamRouter from './features/Team/Team.router';
import customerRouter from './features/Customer/Customer.router';
import conversationRouter from './features/Conversation/Conversation.router';
import whatsappRouter from './features/WhatsApp/WhatsApp.router';
import templateRouter from './features/WhatsApp/Template.router';
import vehicleRouter from './features/Vehicle/Vehicle.router';
import campaignRouter from './features/Campaign/Campaign.router';
import ticketRouter from './features/Ticket/Ticket.router';
import followUpRouter from './features/FollowUp/FollowUp.router';
const app: Application = express();

app.use(helmet());
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

// Phase 8+ routers (analytics, account-health, audit-logs, notifications)
// mount here as they land.

app.use('/api', notFoundHandler);

// ------------------- Frontend SPA -------------------
app.use(serveFrontend());

// TODO (later phase): serveFrontend() for the built SPA + catch-all,
// once the frontend production build is wired into deployment.

app.use(errorHandler);

export default app;
