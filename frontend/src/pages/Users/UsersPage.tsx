import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import type { UserRecord } from './usersApi';
import { listUsers } from './usersApi';
import { ROLE_LABELS } from '../../constants/roles';

const STATUS_TONE: Record<UserRecord['status'], 'success' | 'neutral' | 'danger'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'danger',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(true);
      listUsers({ search: search || undefined })
        .then((res) => setUsers(res.data))
        .finally(() => setIsLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Users</h1>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-300/60 bg-ink-100/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-500">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-500">
                  No users found.
                </td>
              </tr>
            )}
            {!isLoading &&
              users.map((u) => (
                <tr key={u.id} className="border-b border-ink-300/40 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">{u.fullName}</td>
                  <td className="px-4 py-3 text-ink-700">{u.email}</td>
                  <td className="px-4 py-3 text-ink-700">{ROLE_LABELS[u.role]}</td>
                  <td className="px-4 py-3 text-ink-700">{u.team?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[u.status]}>{u.status}</Badge>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
