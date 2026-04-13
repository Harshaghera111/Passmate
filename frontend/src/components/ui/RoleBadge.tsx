import React from 'react';

type Role = 'student' | 'warden' | 'guard' | 'admin' | 'parent';

const CONFIG: Record<Role, { label: string; bg: string; text: string }> = {
  student: { label: 'Student', bg: 'bg-blue-50', text: 'text-blue-700' },
  warden: { label: 'Warden', bg: 'bg-purple-50', text: 'text-purple-700' },
  guard: { label: 'Guard', bg: 'bg-amber-50', text: 'text-amber-700' },
  admin: { label: 'Admin', bg: 'bg-red-50', text: 'text-red-700' },
  parent: { label: 'Parent', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

interface RoleBadgeProps { role: Role; }

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const c = CONFIG[role];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-badge text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

export default RoleBadge;
