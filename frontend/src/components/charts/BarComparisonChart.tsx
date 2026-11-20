import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Computer } from '../../api/types';

interface BarComparisonProps {
  computers: Computer[];
}

export const BarComparisonChart: React.FC<BarComparisonProps> = ({ computers }) => {
  const data = computers.map((c) => ({
    name: c.computer_id,
    CPU: c.cpu_percent,
    RAM: c.ram_percent,
    Disk: c.disk_percent,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="CPU" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="RAM" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Disk" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
