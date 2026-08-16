import createError from 'http-errors';
import config from '../../config/config';
import logger from '../../utils/logger';

// Graph API version — verify this against current Meta documentation
// before going live; do not assume it stays current (spec section 90).
const GRAPH_API_VERSION = 'v20.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface MissingCredential {
  variable: string;
  whereToGetIt: string;
}

const REQUIRED_CREDENTIALS: MissingCredential[] = [
  {
    variable: 'META_ACCESS_TOKEN',
    whereToGetIt:
      'Meta developer dashboard → your app → WhatsApp → API Setup (or a System User token for production)',
  },
  {
    variable: 'WHATSAPP_PHONE_NUMBER_ID',
    whereToGetIt: 'Meta developer dashboard → your app → WhatsApp → API Setup → "Phone number ID"',
  },
  {
    variable: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
    whereToGetIt: 'Meta Business Manager → WhatsApp Accounts → your WABA ID',
  },
];

/**
 * Throws a precise, actionable error (per spec section 86: "STOP and
 * report exactly which credential is required, where to obtain it") the
 * first time a real API call is attempted without configured credentials.
 * This is the gate that keeps the integration honest — no fallback to a
 * mocked/simulated response (spec section 84).
 */
function assertConfigured(): void {
  const missing = REQUIRED_CREDENTIALS.filter((c) => !process.env[c.variable]);
  if (missing.length > 0) {
    const details = missing.map((c) => `  - ${c.variable}: get it from ${c.whereToGetIt}`).join('\n');
    throw createError(
      503,
      `WhatsApp Cloud API is not configured yet. Missing environment variable(s):\n${details}\n` +
        `Set these in backend/.env, then retry. Never fabricate credentials or a fake success response.`
    );
  }
}

function authHeaders() {
  return {
    Authorization: `Bearer ${config.meta.accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function graphRequest<T>(path: string, init?: RequestInit): Promise<T> {
  assertConfigured();
  const url = `${GRAPH_BASE_URL}/${path}`;
  const response = await fetch(url, { ...init, headers: { ...authHeaders(), ...(init?.headers || {}) } });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    logger.error('WhatsApp Cloud API error', { url, status: response.status, body: json });
    throw createError(502, `WhatsApp Cloud API request failed (${response.status}). ${JSON.stringify(json)}`);
  }
  return json as T;
}

export interface SendMessageResult {
  whatsappMessageId: string;
  raw: unknown;
}

/** Sends a free-form text message. Only valid while the customer-service window is open. */
export async function sendText(toPhone: string, body: string): Promise<SendMessageResult> {
  const result = await graphRequest<{ messages?: { id: string }[] }>(`${config.meta.phoneNumberId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'text',
      text: { body },
    }),
  });
  const id = result.messages?.[0]?.id;
  if (!id) throw createError(502, 'WhatsApp API did not return a message ID.');
  return { whatsappMessageId: id, raw: result };
}

/** Sends an approved template message with resolved variables. */
export async function sendTemplate(
  toPhone: string,
  templateName: string,
  languageCode: string,
  components: unknown[]
): Promise<SendMessageResult> {
  const result = await graphRequest<{ messages?: { id: string }[] }>(`${config.meta.phoneNumberId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'template',
      template: { name: templateName, language: { code: languageCode }, components },
    }),
  });
  const id = result.messages?.[0]?.id;
  if (!id) throw createError(502, 'WhatsApp API did not return a message ID.');
  return { whatsappMessageId: id, raw: result };
}

export async function getBusinessAccount(): Promise<unknown> {
  return graphRequest(`${config.meta.businessAccountId}`);
}

export async function getPhoneNumber(): Promise<unknown> {
  return graphRequest(`${config.meta.phoneNumberId}`);
}

export async function getTemplates(): Promise<unknown> {
  return graphRequest(`${config.meta.businessAccountId}/message_templates`);
}
