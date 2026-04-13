import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  onClick?: () => void;
}

const COLOR_MAP = {
  blue: { icon: 'bg-blue-50 text-accent-primary', border: 'border-blue-100', badge: 'text-blue-600' },
  green: { icon: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100', badge: 'text-emerald-600' },
  red: { icon: 'bg-red-50 text-red-500', border: 'border-red-100', badge: 'text-red-500' },
  amber: { icon: 'bg-amber-50 text-amber-600', border: 'border-amber-100', badge: 'text-amber-600' },
  purple: { icon: 'bg-purple-50 text-purple-600', border: 'border-purple-100', badge: 'text-purple-600' },
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, color = 'blue', onClick }) => {
  const c = COLOR_MAP[color];
  const TrendIcon = trend ? (trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus) : null;
  const trendColor = trend ? (trend.value > 0 ? 'text-emerald-500' : trend.value < 0 ? 'text-red-500' : 'text-gray-400') : '';

  return (
    <div
      onClick={onClick}
      className={[
        'bg-white rounded-card p-5 border shadow-sm card-hover',
        c.border,
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">{label}</p>
          <p className="text-3xl font-bold font-sora text-text-primary leading-none">{value}</p>
          {trend && TrendIcon && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
              <TrendIcon size={13} />
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
