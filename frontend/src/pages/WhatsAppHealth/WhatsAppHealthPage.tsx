import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { WhatsAppHealthResponse } from './whatsAppHealthApi';
import { getWhatsAppHealth } from './whatsAppHealthApi';

const META_TONE = {
  HEALTHY: 'success',
  NOT_CONFIGURED: 'neutral',
  ERROR: 'danger',
} as const;

const INTERNAL_TONE = {
  GOOD: 'success',
  WARNING: 'warning',
  PAUSED: 'danger',
} as const;

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-lg font-semibold text-ink-900">{value}</div>
    </div>
  );
}

export default function WhatsAppHealthPage() {
  const [health, setHealth] = useState<WhatsAppHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getWhatsAppHealth()
      .then(setHealth)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p className="text-sm text-ink-500">Loading…</p>;
  if (!health) return <p className="text-sm text-ink-500">Could not load WhatsApp health.</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">WhatsApp Business Health</h1>

      {/* Meta status and internal health are two separate cards, on purpose
          (spec section 33) — never merged into a single "quality score". */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Meta Status</div>
          <Badge tone={META_TONE[health.metaStatus.status]}>{health.metaStatus.status.replace('_', ' ')}</Badge>
          <p className="mt-2 text-sm text-ink-700">{health.metaStatus.detail}</p>
        </Card>

        <Card className="p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Internal Campaign Health
          </div>
          <Badge tone={INTERNAL_TONE[health.internalHealth.level]}>{health.internalHealth.level}</Badge>
          <p className="mt-2 text-sm text-ink-700">
            Based on our own message data — not Meta's official quality algorithm.
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Campaign Health (last {health.internalHealth.windowDays} days)
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Sent" value={health.internalHealth.sent} />
          <Stat label="Delivered" value={health.internalHealth.delivered} />
          <Stat label="Read" value={health.internalHealth.read} />
          <Stat label="Replies" value={health.internalHealth.replies} />
          <Stat label="Delivery Rate" value={`${health.internalHealth.deliveryRate}%`} />
          <Stat label="Read Rate" value={`${health.internalHealth.readRate}%`} />
          <Stat label="Reply Rate" value={`${health.internalHealth.replyRate}%`} />
          <Stat label="Opt-out Rate" value={`${health.internalHealth.optOutRate}%`} />
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-500">Templates</div>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Approved" value={health.templates.approved} />
          <Stat label="Pending" value={health.templates.pending} />
          <Stat label="Rejected" value={health.templates.rejected} />
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-500">Recent Issues</div>
        {health.recentErrors.length === 0 ? (
          <p className="text-sm text-ink-500">No recent issues.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {health.recentErrors.map((e) => (
              <div key={e.messageId} className="text-sm text-ink-700">
                {e.reason} <span className="text-xs text-ink-500">· {new Date(e.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
