import { useEffect, useState } from 'react';
import { Plus, X, Play, Pause, Ban } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import type { CampaignItem, CampaignStatus } from './campaignsApi';
import { listCampaigns, createCampaign, startCampaign, pauseCampaign, cancelCampaign } from './campaignsApi';
import type { TemplateItem } from '../Templates/templatesApi';
import { listTemplates } from '../Templates/templatesApi';

const STATUS_TONE: Record<CampaignStatus, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'neutral',
  VALIDATING: 'neutral',
  QUEUED: 'brand',
  RUNNING: 'brand',
  PAUSED: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
};

function CreateCampaignDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [country, setCountry] = useState('');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listTemplates('APPROVED').then(setTemplates);
  }, []);

  async function handleSubmit() {
    if (!name.trim() || !templateId) {
      setError('Name and template are required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createCampaign({
        name,
        templateId,
        filters: country ? { country } : undefined,
      });
      onCreated();
      onClose();
    } catch {
      setError('Could not create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink-900/40 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">New Campaign</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <Input label="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select an approved template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Filter: country (optional)"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Pakistan"
          />
          <p className="text-xs text-ink-500">
            Recipients are validated automatically — customers without a WhatsApp number, who
            haven't opted in to marketing, or who've opted out are skipped, not silently omitted.
          </p>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          <Button onClick={handleSubmit} isLoading={isSubmitting} className="mt-2">
            Create campaign
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  function reload() {
    setIsLoading(true);
    listCampaigns()
      .then(setCampaigns)
      .finally(() => setIsLoading(false));
  }

  useEffect(reload, []);

  async function handleAction(id: string, action: 'start' | 'pause' | 'cancel') {
    if (action === 'start') await startCampaign(id);
    if (action === 'pause') await pauseCampaign(id);
    if (action === 'cancel') await cancelCampaign(id);
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Campaigns</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Campaign
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-300/60 bg-ink-100/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Recipients</th>
              <th className="px-4 py-3">Sent</th>
              <th className="px-4 py-3">Failed</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-500">Loading…</td>
              </tr>
            )}
            {!isLoading && campaigns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-500">No campaigns yet.</td>
              </tr>
            )}
            {!isLoading &&
              campaigns.map((c) => (
                <tr key={c.id} className="border-b border-ink-300/40 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{c.totalRecipients}</td>
                  <td className="px-4 py-3 text-ink-700">{c.sent}</td>
                  <td className="px-4 py-3 text-ink-700">{c.failed}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {(c.status === 'DRAFT' || c.status === 'PAUSED') && (
                        <Button variant="secondary" onClick={() => handleAction(c.id, 'start')}>
                          <Play size={14} />
                        </Button>
                      )}
                      {c.status === 'RUNNING' && (
                        <Button variant="secondary" onClick={() => handleAction(c.id, 'pause')}>
                          <Pause size={14} />
                        </Button>
                      )}
                      {c.status !== 'COMPLETED' && c.status !== 'FAILED' && (
                        <Button variant="danger" onClick={() => handleAction(c.id, 'cancel')}>
                          <Ban size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>

      {showCreate && <CreateCampaignDialog onClose={() => setShowCreate(false)} onCreated={reload} />}
    </div>
  );
}
