import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // Only Phase 1 vars are enforced as required at boot.
    // WhatsApp/Meta vars are validated lazily when Phase 4 features load.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  db: Object.freeze({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'crm_whatsapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
  }),

  redis: Object.freeze({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  }),

  jwt: Object.freeze({
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  }),

  rateLimit: Object.freeze({
    generalPerMinute: Number(process.env.GENERAL_RATE_LIMIT_PER_MINUTE) || 120,
    authPerMinute: Number(process.env.AUTH_RATE_LIMIT_PER_MINUTE) || 10,
  }),

  // Customer-service window duration. Meta's own policy governs how long
  // free-form business-initiated replies are permitted after a customer's
  // last message — this default (24h) is a common industry figure but has
  // NOT been verified against current Meta documentation and must be
  // confirmed (and this value updated if needed) before Phase 4 connects
  // the real WhatsApp Cloud API. See spec section 10/90.
  conversation: Object.freeze({
    serviceWindowHours: Number(process.env.CUSTOMER_SERVICE_WINDOW_HOURS) || 24,
    // Internal CRM safety rule (spec section 22), NOT a Meta-enforced
    // limit — how many template attempts an inactive contact may receive
    // before sending is blocked pending manager review (spec section 23).
    templateAttemptLimit: Number(process.env.INACTIVE_TEMPLATE_ATTEMPT_LIMIT) || 100,
    managerOverrideAttempts: Number(process.env.MANAGER_OVERRIDE_ATTEMPTS) || 10,
  }),

  // Internal CRM safety rule (spec section 21), NOT a universal Meta API
  // limit — throttles outbound campaign sends via the BullMQ queue's
  // built-in rate limiter.
  campaign: Object.freeze({
    messagesPerMinute: Number(process.env.CAMPAIGN_MESSAGES_PER_MINUTE) || 6,
  }),

  // Populated for later phases (WhatsApp Cloud API). Intentionally not
  // required at Phase 1 boot time — see WhatsAppService (Phase 4) for
  // where these get validated before use.
  meta: Object.freeze({
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || 'YOUR_META_APP_SECRET',
    accessToken: process.env.META_ACCESS_TOKEN || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'my-whatsapp-secret-123',
    webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || '',
  }),
});

export default config;
