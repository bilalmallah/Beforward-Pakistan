import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import type { TemplateItem } from '../Templates/templatesApi';
import { listTemplates } from '../Templates/templatesApi';
import type { VehicleItem } from '../Vehicles/vehiclesApi';
import { listVehicles } from '../Vehicles/vehiclesApi';
import { sendTemplateMessage } from './inboxApi';

interface Props {
  conversationId: string;
  onClose: () => void;
  onSent: () => void;
}

function needsVehicle(template: TemplateItem | undefined): boolean {
  return !!template?.variables.some((v) => v.startsWith('vehicle_'));
}

function previewBody(template: TemplateItem, vehicle: VehicleItem | null): string {
  return template.body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, name: string) => {
    if (name === 'vehicle_name') return vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year}` : '{{vehicle_name}}';
    if (name === 'vehicle_mileage') return vehicle ? `${vehicle.mileage.toLocaleString()} KM` : '{{vehicle_mileage}}';
    if (name === 'vehicle_price') return vehicle ? `${vehicle.currency} ${Number(vehicle.price).toLocaleString()}` : '{{vehicle_price}}';
    if (name === 'customer_name') return '{{customer_name}}';
    if (name === 'salesperson_name') return '{{salesperson_name}}';
    return `{{${name}}}`;
  });
}

export default function TemplateSendDialog({ conversationId, onClose, onSent }: Props) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTemplates('APPROVED').then(setTemplates);
    listVehicles({ status: 'AVAILABLE' }).then((res) => setVehicles(res.data));
  }, []);

  const selected = templates.find((t) => t.id === templateId);
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
  const requiresVehicle = needsVehicle(selected);

  async function handleSend() {
    if (!selected) {
      setError('Select a template.');
      return;
    }
    if (requiresVehicle && !vehicleId) {
      setError('This template references vehicle details — select a vehicle.');
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await sendTemplateMessage(conversationId, selected.id, vehicleId || undefined);
      onSent();
      onClose();
    } catch {
      setError('Could not send template. Check that all required variables can be resolved.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink-900/40 p-4">
      <Card className="w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">Send Template</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select a template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <p className="text-xs text-ink-500">
                No approved templates yet — create and approve one under Templates.
              </p>
            )}
          </div>

          {requiresVehicle && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-700">Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select a vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} {v.year} — {v.currency} {Number(v.price).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selected && (
            <div className="rounded-lg border border-ink-300/60 bg-ink-100/40 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Preview</p>
              <p className="text-sm text-ink-900 whitespace-pre-wrap">{previewBody(selected, selectedVehicle)}</p>
              {selected.footer && <p className="mt-2 text-xs text-ink-500">{selected.footer}</p>}
            </div>
          )}

          {error && <p className="text-sm text-danger-500">{error}</p>}

          <Button onClick={handleSend} isLoading={isSending} className="mt-2">
            <Send size={16} />
            Send Template
          </Button>
        </div>
      </Card>
    </div>
  );
}
