import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import type { FollowUpItem, FollowUpStatus } from './followUpsApi';
import { listFollowUps, updateFollowUpStatus } from './followUpsApi';

const STATUS_TONE: Record<FollowUpStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  MISSED: 'danger',
  CANCELLED: 'neutral',
};

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [todayOnly, setTodayOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  function reload() {
    setIsLoading(true);
    listFollowUps({ today: todayOnly || undefined, status: todayOnly ? undefined : 'PENDING' })
      .then((res) => setFollowUps(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(reload, [todayOnly]);

  async function handleComplete(id: string) {
    await updateFollowUpStatus(id, 'COMPLETED');
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Follow-ups</h1>
        <div className="flex gap-2">
          <Button variant={todayOnly ? 'primary' : 'secondary'} onClick={() => setTodayOnly(true)}>
            Today
          </Button>
          <Button variant={!todayOnly ? 'primary' : 'secondary'} onClick={() => setTodayOnly(false)}>
            All Pending
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-ink-500">Loading…</p>}
      {!isLoading && followUps.length === 0 && (
        <Card className="p-6 text-center text-sm text-ink-500">
          {todayOnly ? 'No follow-ups scheduled for today.' : 'No pending follow-ups.'}
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {followUps.map((f) => (
          <Card key={f.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-ink-500" />
              <div>
                <Link to={`/customers/${f.customer.id}`} className="font-medium text-brand-700 hover:underline">
                  {f.customer.companyName}
                </Link>
                <div className="text-xs text-ink-500">
                  {new Date(f.reminderDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                {f.note && <div className="mt-1 text-sm text-ink-700">{f.note}</div>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={STATUS_TONE[f.status]}>{f.status}</Badge>
              {f.status === 'PENDING' && (
                <Button variant="secondary" onClick={() => handleComplete(f.id)}>
                  <CheckCircle2 size={14} />
                  Mark done
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
