import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface HealthDonutProps {
  online: number;
  warning: number;
  critical: number;
  offline: number;
}

export const HealthDonutChart: React.FC<HealthDonutProps> = ({
  online,
  warning,
  critical,
  offline,
}) => {
  const data = [
    { name: 'Online', value: online, color: '#10b981' },
    { name: 'Warning', value: warning, color: '#f59e0b' },
    { name: 'Critical', value: critical, color: '#f43f5e' },
    { name: 'Offline', value: offline, color: '#64748b' },
  ].filter((d) => d.value > 0);

  const total = online + warning + critical + offline;
  const healthyPercent = total > 0 ? Math.round((online / total) * 100) : 0;

  return (
    <div className="relative w-full h-56 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-white">{healthyPercent}%</span>
        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Operational</span>
      </div>
    </div>
  );
};
