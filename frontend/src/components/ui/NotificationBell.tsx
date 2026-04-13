import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, Clock } from 'lucide-react';
import { mockNotifications } from '../../data/mockData';

const ICON_MAP: Record<string, React.ReactNode> = {
  pending: <Clock size={14} className="text-amber-500" />,
  alert: <AlertCircle size={14} className="text-red-500" />,
  info: <Info size={14} className="text-blue-500" />,
  success: <CheckCircle2 size={14} className="text-emerald-500" />,
  warning: <AlertCircle size={14} className="text-amber-500" />,
};

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-bg-muted transition-colors duration-200"
      >
        <Bell size={20} className="text-text-secondary" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-accent-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-card shadow-xl border border-border z-50 panel-enter overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm text-text-primary font-sora">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-accent-primary hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${n.read ? 'bg-white' : 'bg-blue-50'} hover:bg-bg-muted`}
              >
                <div className="mt-0.5 flex-shrink-0">{ICON_MAP[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${n.read ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">{n.time}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-accent-primary flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-border">
            <button className="text-xs text-accent-primary font-medium hover:underline w-full text-center">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
