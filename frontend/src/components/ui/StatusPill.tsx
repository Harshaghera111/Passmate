import React from 'react';
import { CheckCircle2, XCircle, Clock, Zap, AlertCircle } from 'lucide-react';
import type { PassStatus } from '../../data/mockData';

interface StatusPillProps {
  status: PassStatus | 'parent_pending' | 'parent_approved' | 'parent_rejected';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const CONFIG = {
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  expired: {
    label: 'Expired',
    icon: AlertCircle,
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
  active: {
    label: 'Active',
    icon: Zap,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  returned: {
    label: 'Returned',
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  parent_pending: {
    label: 'Parent Pending',
    icon: Clock,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  parent_approved: {
    label: 'Parent ✓',
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  parent_rejected: {
    label: 'Parent ✗',
    icon: XCircle,
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
};

const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'md', pulse }) => {
  const config = CONFIG[status] || CONFIG.pending;
  const Icon = config.icon;
  const isPending = status === 'pending' || status === 'parent_pending';
  const shouldPulse = pulse ?? isPending;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 border font-medium rounded-badge',
        config.bg, config.text, config.border,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1',
        shouldPulse ? 'status-pending' : '',
      ].join(' ')}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${shouldPulse ? 'animate-pulse' : ''}`} />
      <Icon size={size === 'sm' ? 10 : 12} strokeWidth={2.5} />
      {config.label}
    </span>
  );
};

export default StatusPill;
