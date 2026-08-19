import { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import clsx from 'clsx';
import useSocket from '../../hooks/useSocket';
import type { NotificationItem } from './notificationsApi';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from './notificationsApi';

export default function NotificationBell() {
  const socket = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function reload() {
    listNotifications().then((res) => {
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    });
  }

  useEffect(reload, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = () => reload();
    socket.on('notification:new', onNew);
    return () => {
      socket.off('notification:new', onNew);
    };
  }, [socket]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    reload();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    reload();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-700 hover:bg-ink-100"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-ink-300/60 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-ink-300/60 px-4 py-2.5">
            <span className="text-sm font-semibold text-ink-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-brand-700 hover:underline"
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-center text-sm text-ink-500">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={clsx(
                  'flex w-full flex-col gap-0.5 border-b border-ink-300/40 px-4 py-3 text-left last:border-0 hover:bg-ink-100/50',
                  !n.isRead && 'bg-brand-50/60'
                )}
              >
                <div className="flex items-center gap-2">
                  {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />}
                  <span className="text-sm font-medium text-ink-900">{n.title}</span>
                </div>
                {n.body && <p className="text-xs text-ink-500">{n.body}</p>}
                <span className="text-[11px] text-ink-500">{new Date(n.createdAt).toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
