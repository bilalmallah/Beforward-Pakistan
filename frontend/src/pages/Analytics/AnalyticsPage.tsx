import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import useAuth from '../../hooks/useAuth';
import { CAN_MANAGE_USERS } from '../../constants/roles';
import type { DashboardSummary, SellerAnalytics } from './analyticsApi';
import { getDashboardSummary, getMyAnalytics } from './analyticsApi';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink-900">{value}</div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isAdmin = !!user && CAN_MANAGE_USERS.includes(user.role);

  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [mine, setMine] = useState<SellerAnalytics | null>(null);

  useEffect(() => {
    if (isAdmin) {
      getDashboardSummary().then(setDashboard);
    } else {
      getMyAnalytics().then(setMine);
    }
  }, [isAdmin]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">Analytics</h1>

      {isAdmin && dashboard && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total Customers" value={dashboard.totalCustomers} />
          <StatCard label="Prospects" value={dashboard.totalProspects} />
          <StatCard label="Active Conversations" value={dashboard.activeConversations} />
          <StatCard label="Inactive Conversations" value={dashboard.inactiveConversations} />
          <StatCard label="Open Tickets" value={dashboard.openTickets} />
          <StatCard label="Salespeople" value={dashboard.salespeople} />
          <StatCard label="Teams" value={dashboard.teams} />
          <StatCard label="Today's Messages" value={dashboard.todaysMessages} />
          <StatCard label="Today's Replies" value={dashboard.todaysReplies} />
        </div>
      )}

      {!isAdmin && mine && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Messages Sent" value={mine.messagesSent} />
          <StatCard label="Messages Received" value={mine.messagesReceived} />
          <StatCard label="Active Conversations" value={mine.activeConversations} />
          <StatCard label="My Leads" value={mine.leads} />
          <StatCard label="Quotations Sent" value={mine.quotationsSent} />
          <StatCard label="Deals" value={mine.deals} />
          <StatCard label="Conversion Rate" value={`${mine.conversionRate}%`} />
          <StatCard label="Open Follow-ups" value={mine.openFollowUps} />
          <StatCard label="Open Tickets" value={mine.openTickets} />
        </div>
      )}

      {!dashboard && !mine && <p className="text-sm text-ink-500">Loading…</p>}
    </div>
  );
}
