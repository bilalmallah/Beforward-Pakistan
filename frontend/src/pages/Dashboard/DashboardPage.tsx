import useAuth from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import { ROLE_LABELS } from '../../constants/roles';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">
          Welcome back{user ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Signed in as {user ? ROLE_LABELS[user.role] : ''}
        </p>
      </div>

      <Card className="p-6">
        <p className="text-sm text-ink-700">
          This is the Phase 1 scaffold: authentication, RBAC, database, users, and teams are
          live. Customer management, the WhatsApp inbox, campaigns, tickets, vehicles, and
          analytics widgets are built in the phases that follow.

          Shahzad ne ghlt kia university mai addmission na leke
        </p>
      </Card>
    </div>
  );
}
