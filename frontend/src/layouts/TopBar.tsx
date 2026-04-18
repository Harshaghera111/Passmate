import React from 'react';
import { Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import NotificationBell from '../components/ui/NotificationBell';

const AVATAR_COLORS: Record<string, string> = {
  student: 'from-blue-400 to-blue-600',
  warden: 'from-purple-400 to-purple-600',
  guard: 'from-amber-400 to-amber-600',
  admin: 'from-red-400 to-red-600',
};

const TopBar: React.FC = () => {
  const { user } = useAuthStore();
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'PM';
  const gradClass = AVATAR_COLORS[user?.role || 'student'];

  return (
    <header className="h-16 bg-white border-b border-border flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search students, passes, USN..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-input bg-bg-muted focus:bg-white focus:border-accent-primary focus:outline-none focus:shadow-[0_0_0_3px_rgba(47,111,237,0.1)] transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <NotificationBell />
        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradClass} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-text-primary leading-tight">{user?.name}</p>
            <p className="text-[11px] text-text-muted leading-tight capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
