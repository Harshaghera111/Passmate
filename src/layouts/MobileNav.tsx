import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Plus, History, FileText, Users, ScanLine, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NAV_BY_ROLE: Record<string, { label: string; path: string; icon: React.ReactNode }[]> = {
  student: [
    { label: 'Home', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Request', path: '/student/request/new', icon: <Plus size={20} /> },
    { label: 'History', path: '/student/history', icon: <History size={20} /> },
  ],
  warden: [
    { label: 'Home', path: '/warden/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Requests', path: '/warden/requests', icon: <FileText size={20} /> },
    { label: 'Students', path: '/warden/students', icon: <Users size={20} /> },
  ],
  guard: [
    { label: 'Scan', path: '/guard/scan', icon: <ScanLine size={20} /> },
  ],
  admin: [
    { label: 'Analytics', path: '/admin/dashboard', icon: <BarChart3 size={20} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
  ],
};

const MobileNav: React.FC = () => {
  const { user } = useAuthStore();
  const items = NAV_BY_ROLE[user?.role || 'student'] || [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40 mobile-nav md:hidden">
      <div className="flex">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => [
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors duration-200',
              isActive ? 'text-accent-primary' : 'text-text-muted',
            ].join(' ')}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
