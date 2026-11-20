import React from 'react';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'critical' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toLowerCase();
  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  let dot = 'bg-slate-400';

  if (s === 'online' || s === 'operational' || s === 'confirmed' || s === 'recovered' || s === 'approved') {
    bg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    dot = 'bg-emerald-500 animate-pulse';
  } else if (s === 'warning' || s === 'degraded' || s === 'pending') {
    bg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    dot = 'bg-amber-500 animate-pulse';
  } else if (s === 'critical' || s === 'failed' || s === 'unauthorized' || s === 'cancelled') {
    bg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    dot = 'bg-rose-500 animate-pulse';
  } else if (s === 'offline') {
    bg = 'bg-slate-800 text-slate-400 border-slate-700';
    dot = 'bg-slate-500';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${padding} ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};
