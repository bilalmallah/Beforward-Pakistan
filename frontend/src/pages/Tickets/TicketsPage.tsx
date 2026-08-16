import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { TicketItem, TicketStatus, TicketPriority } from './ticketsApi';
import { listTickets, updateTicketStatus } from './ticketsApi';

const PRIORITY_TONE: Record<TicketPriority, 'neutral' | 'brand' | 'warning' | 'danger'> = {
  LOW: 'neutral',
  MEDIUM: 'brand',
  HIGH: 'warning',
  URGENT: 'danger',
};

const STATUS_TONE: Record<TicketStatus, 'neutral' | 'brand' | 'warning' | 'success'> = {
  OPEN: 'brand',
  IN_PROGRESS: 'warning',
  WAITING_CUSTOMER: 'neutral',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const STATUS_OPTIONS: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  function reload() {
    setIsLoading(true);
    listTickets({ status: statusFilter || undefined })
      .then((res) => setTickets(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(reload, [statusFilter]);

  async function handleStatusChange(id: string, status: TicketStatus) {
    await updateTicketStatus(id, status);
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Tickets</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
          className="rounded-md border border-ink-300 px-3 py-2 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-300/60 bg-ink-100/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-500">Loading…</td>
              </tr>
            )}
            {!isLoading && tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-500">No tickets.</td>
              </tr>
            )}
            {!isLoading &&
              tickets.map((t) => (
                <tr key={t.id} className="border-b border-ink-300/40 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">{t.title}</td>
                  <td className="px-4 py-3 text-ink-700">{t.customer.companyName}</td>
                  <td className="px-4 py-3 text-ink-700">{t.category.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value as TicketStatus)}
                        className="rounded-md border border-ink-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <Badge tone={STATUS_TONE[t.status]}>{t.status.replace('_', ' ')}</Badge>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
