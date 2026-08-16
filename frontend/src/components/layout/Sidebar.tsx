import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Contact, MessageCircle, FileText, Car, Megaphone } from 'lucide-react';
import clsx from 'clsx';
import useAuth from '../../hooks/useAuth';
import { CAN_MANAGE_USERS } from '../../constants/roles';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100'
  );

export default function Sidebar() {
  const { user } = useAuth();
  const canManageUsers = user && CAN_MANAGE_USERS.includes(user.role);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-ink-300/60 bg-white px-3 py-4">
      <div className="mb-6 px-2">
        <span className="text-lg font-semibold text-ink-900">Sales CRM</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to="/dashboard" className={navItemClass}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Sales
        </div>
        <NavLink to="/customers" className={navItemClass}>
          <Contact size={18} />
          Customers
        </NavLink>

        <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
          WhatsApp
        </div>
        <NavLink to="/inbox" className={navItemClass}>
          <MessageCircle size={18} />
          Inbox
        </NavLink>
        {canManageUsers && (
          <NavLink to="/templates" className={navItemClass}>
            <FileText size={18} />
            Templates
          </NavLink>
        )}
        {canManageUsers && (
          <NavLink to="/campaigns" className={navItemClass}>
            <Megaphone size={18} />
            Campaigns
          </NavLink>
        )}

        <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Inventory
        </div>
        <NavLink to="/vehicles" className={navItemClass}>
          <Car size={18} />
          Vehicles
        </NavLink>

        {canManageUsers && (
          <>
            <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Administration
            </div>
            <NavLink to="/users" className={navItemClass}>
              <Users size={18} />
              Users
            </NavLink>
            <NavLink to="/teams" className={navItemClass}>
              <Building2 size={18} />
              Teams
            </NavLink>
          </>
        )}
      </nav>

      <div className="rounded-md bg-ink-100 px-3 py-2 text-xs text-ink-500">
        Phase 6 build — requires Redis for campaign sending. Tickets, follow-ups, and analytics
        land in later phases.
      </div>
    </aside>
  );
}
