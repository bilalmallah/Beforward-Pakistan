import { LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../constants/roles';
import GlobalSearchBar from '../../features/search/GlobalSearchBar';
import NotificationBell from '../../features/notifications/NotificationBell';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-300/60 bg-white px-6">
      <GlobalSearchBar />
      {user && (
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="text-right">
            <div className="text-sm font-medium text-ink-900">{user.fullName}</div>
            <div className="text-xs text-ink-500">{ROLE_LABELS[user.role]}</div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-100"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
