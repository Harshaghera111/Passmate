import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, QrCode, History, Users, AlertTriangle,
  ScanLine, BarChart3, Settings, ScrollText, ShieldAlert, ChevronLeft,
  ChevronRight, LogOut, Plus
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface NavItem { label: string; path: string; icon: React.ReactNode; }

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  student: [
    { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'New Request', path: '/student/request/new', icon: <Plus size={18} /> },
    { label: 'My Passes', path: '/student/history', icon: <History size={18} /> },
  ],
  warden: [
    { label: 'Dashboard', path: '/warden/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Requests', path: '/warden/requests', icon: <FileText size={18} /> },
    { label: 'Students', path: '/warden/students', icon: <Users size={18} /> },
    { label: 'Emergency', path: '/warden/emergency', icon: <AlertTriangle size={18} /> },
  ],
  guard: [
    { label: 'Scan QR', path: '/guard/scan', icon: <ScanLine size={18} /> },
  ],
  admin: [
    { label: 'Analytics', path: '/admin/dashboard', icon: <BarChart3 size={18} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={18} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
    { label: 'Logs', path: '/admin/logs', icon: <ScrollText size={18} /> },
    { label: 'Violations', path: '/admin/violations', icon: <ShieldAlert size={18} /> },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  student: 'bg-blue-50 text-blue-700',
  warden: 'bg-purple-50 text-purple-700',
  guard: 'bg-amber-50 text-amber-700',
  admin: 'bg-red-50 text-red-700',
};

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user?.role || 'student'] || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={[
      'fixed left-0 top-0 h-full bg-white border-r border-border flex flex-col z-40 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60',
    ].join(' ')}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-border flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center flex-shrink-0">
          <QrCode size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg font-sora text-text-primary tracking-tight">PassMate</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => [
              'flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 group',
              isActive
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-secondary hover:bg-bg-muted hover:text-text-primary',
              collapsed ? 'justify-center' : '',
            ].join(' ')}
            title={collapsed ? item.label : ''}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: role badge + user + collapse */}
      <div className="border-t border-border px-2 py-3 space-y-2 flex-shrink-0">
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-btn bg-bg-muted">
            <p className="text-xs font-semibold text-text-primary truncate">{user.name}</p>
            <div className="mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-badge font-semibold uppercase tracking-wide ${ROLE_COLORS[user.role]}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-btn text-sm text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title="Logout"
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-btn text-sm text-text-muted hover:bg-bg-muted transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
