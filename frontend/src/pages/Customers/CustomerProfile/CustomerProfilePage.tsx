import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import type { CustomerDetail } from '../customersApi';
import { getCustomer, addCustomerNote } from '../customersApi';
import { STATUS_LABELS, STATUS_TONE, SOURCE_LABELS } from '../../../constants/customer';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-sm font-medium text-ink-900">{value || '—'}</div>
    </div>
  );
}

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteBody, setNoteBody] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  function reload() {
    if (!id) return;
    setIsLoading(true);
    getCustomer(id)
      .then(setCustomer)
      .finally(() => setIsLoading(false));
  }

  useEffect(reload, [id]);

  async function handleAddNote() {
    if (!id || !noteBody.trim()) return;
    setIsSavingNote(true);
    try {
      await addCustomerNote(id, noteBody.trim());
      setNoteBody('');
      reload();
    } finally {
      setIsSavingNote(false);
    }
  }

  if (isLoading) return <p className="text-sm text-ink-500">Loading…</p>;
  if (!customer) return <p className="text-sm text-ink-500">Customer not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/customers" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
          <ArrowLeft size={14} />
          Back to customers
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-ink-900">{customer.companyName}</h1>
          <Badge tone={STATUS_TONE[customer.status]}>{STATUS_LABELS[customer.status]}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Basic + Sales + WhatsApp info */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">
              Basic Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact name" value={customer.contactName} />
              <Field label="Country" value={customer.country} />
              <Field label="City" value={customer.city} />
              <Field label="Email" value={customer.email} />
              <Field label="Phone" value={customer.phone} />
              <Field label="Website" value={customer.website} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">
              Sales Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Assigned salesperson" value={customer.assignedSeller?.fullName} />
              <Field label="Assigned team" value={customer.assignedTeam?.name} />
              <Field label="Lead source" value={SOURCE_LABELS[customer.source]} />
              <Field label="Tags" value={customer.tags.length ? customer.tags.join(', ') : null} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">
              WhatsApp Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="WhatsApp number" value={customer.whatsappNumber} />
              <Field label="Marketing consent" value={customer.marketingOptIn ? 'Opted in' : 'Not opted in'} />
              <Field label="Opt-out status" value={customer.optedOut ? 'Opted out' : 'Not opted out'} />
              <Field label="Call permission" value={customer.callPermissionStatus} />
            </div>
            <p className="mt-4 text-xs text-ink-500">
              Conversation status, message history, and the live inbox connect here starting Phase 3.
            </p>
          </Card>
        </div>

        {/* Activity: notes + assignment history */}
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">
              Internal Notes
            </h2>
            <div className="flex flex-col gap-3">
              {customer.notes.length === 0 && (
                <p className="text-sm text-ink-500">No notes yet.</p>
              )}
              {customer.notes.map((note) => (
                <div key={note.id} className="rounded-md bg-ink-100/60 p-3">
                  <p className="text-sm text-ink-900">{note.body}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {note.author.fullName} · {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2">
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Add an internal note (never sent to the customer)…"
                rows={2}
                className="flex-1 rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button onClick={handleAddNote} isLoading={isSavingNote} className="shrink-0">
                <Send size={14} />
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">
              Assignment History
            </h2>
            <div className="flex flex-col gap-3">
              {customer.assignmentHistory.length === 0 && (
                <p className="text-sm text-ink-500">No reassignments yet.</p>
              )}
              {customer.assignmentHistory.map((entry) => (
                <div key={entry.id} className="text-sm">
                  <div className="font-medium text-ink-900">{entry.method.replace('_', ' ')}</div>
                  {entry.reason && <div className="text-ink-500">{entry.reason}</div>}
                  <div className="text-xs text-ink-500">{new Date(entry.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
