import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import type { TemplateItem, TemplateStatus } from './templatesApi';
import { listTemplates, createTemplate, updateTemplateStatus } from './templatesApi';

const STATUS_TONE: Record<TemplateStatus, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'neutral',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  DISABLED: 'neutral',
};

function CreateTemplateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('MARKETING');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !body.trim()) {
      setError('Name and body are required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createTemplate({ name, category, body, footer: footer || undefined });
      onCreated();
      onClose();
    } catch {
      setError('Could not create template.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink-900/40 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">New Template</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="todays_deal" />
          <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Check today's deal on {{vehicle_name}}…"
              className="rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Input label="Footer (optional)" value={footer} onChange={(e) => setFooter(e.target.value)} />
          {error && <p className="text-sm text-danger-500">{error}</p>}
          <Button onClick={handleSubmit} isLoading={isSubmitting} className="mt-2">
            Save as draft
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  function reload() {
    setIsLoading(true);
    listTemplates()
      .then(setTemplates)
      .finally(() => setIsLoading(false));
  }

  useEffect(reload, []);

  async function handleSubmitForApproval(id: string) {
    await updateTemplateStatus(id, 'PENDING');
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Message Templates</h1>
          <p className="mt-1 text-sm text-ink-500">
            Draft templates locally, then submit for Meta approval once the WhatsApp Cloud API is connected.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Template
        </Button>
      </div>

      {isLoading && <p className="text-sm text-ink-500">Loading…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink-900">{t.name}</h2>
              <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-500">{t.category} · {t.language}</p>
            <p className="mt-3 text-sm text-ink-700">{t.body}</p>
            {t.footer && <p className="mt-2 text-xs text-ink-500">{t.footer}</p>}
            {t.status === 'DRAFT' && (
              <Button variant="secondary" className="mt-4 w-full" onClick={() => handleSubmitForApproval(t.id)}>
                Submit for approval
              </Button>
            )}
          </Card>
        ))}
      </div>

      {showCreate && <CreateTemplateDialog onClose={() => setShowCreate(false)} onCreated={reload} />}
    </div>
  );
}
