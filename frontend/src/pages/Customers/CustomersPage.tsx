import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import type { CustomerListItem } from './customersApi';
import { listCustomers, createCustomer } from './customersApi';
import { STATUS_LABELS, STATUS_TONE, SOURCE_LABELS, LeadSource, CustomerStatus } from '../../constants/customer';

function CreateCustomerDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>(LeadSource.MANUAL_ENTRY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createCustomer({
        companyName,
        contactName: contactName || undefined,
        country: country || undefined,
        phone: phone || undefined,
        source,
      });
      onCreated();
      onClose();
    } catch {
      setError('Could not create customer. Please check the details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink-900/40 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">New Customer / Dealer</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Input label="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <Input label="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input label="Phone / WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">Lead source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
              className="rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {Object.values(LeadSource).map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-danger-500">{error}</p>}

          <Button onClick={handleSubmit} isLoading={isSubmitting} className="mt-2">
            Create customer
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  function reload() {
    setIsLoading(true);
    listCustomers({ search: search || undefined, status: statusFilter || undefined })
      .then((res) => setCustomers(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    const timeout = setTimeout(reload, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Customers</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Customer
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <Input
            placeholder="Search company, contact, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | '')}
          className="rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All statuses</option>
          {Object.values(CustomerStatus).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-300/60 bg-ink-100/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Phone / WhatsApp</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-500">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-500">
                  No customers found.
                </td>
              </tr>
            )}
            {!isLoading &&
              customers.map((c) => (
                <tr key={c.id} className="border-b border-ink-300/40 last:border-0 hover:bg-ink-100/40">
                  <td className="px-4 py-3">
                    <Link to={`/customers/${c.id}`} className="font-medium text-brand-700 hover:underline">
                      {c.companyName}
                    </Link>
                    {c.contactName && <div className="text-xs text-ink-500">{c.contactName}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{c.country ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-700">{c.whatsappNumber ?? c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-700">{c.assignedSeller?.fullName ?? 'Unassigned'}</td>
                  <td className="px-4 py-3 text-ink-700">{SOURCE_LABELS[c.source]}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>

      {showCreate && (
        <CreateCustomerDialog onClose={() => setShowCreate(false)} onCreated={reload} />
      )}
    </div>
  );
}
