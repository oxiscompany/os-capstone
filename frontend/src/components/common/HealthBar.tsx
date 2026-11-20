import React from 'react';

interface HealthBarProps {
  value: number; // 0 to 100
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
}

export const HealthBar: React.FC<HealthBarProps> = ({
  value,
  label,
  showValue = true,
  size = 'md',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-400';

  if (clamped < 40) {
    barColor = 'bg-rose-500';
    textColor = 'text-rose-400';
  } else if (clamped < 75) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-400';
  }

  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1 text-xs">
          {label && <span className="text-slate-400 font-medium">{label}</span>}
          {showValue && <span className={`font-semibold ${textColor}`}>{clamped}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
