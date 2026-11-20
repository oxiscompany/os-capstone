import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MetricDataPoint } from '../../api/types';

interface LiveLineChartProps {
  data: MetricDataPoint[];
  metricKey: keyof MetricDataPoint;
  color: string;
  name: string;
  unit?: string;
  domain?: [number, number];
}

export const LiveLineChart: React.FC<LiveLineChartProps> = ({
  data,
  metricKey,
  color,
  name,
  unit = '%',
  domain = [0, 100],
}) => {
  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={10} domain={domain} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(val: any) => [`${val}${unit}`, name]}
          />
          <Line
            type="monotone"
            dataKey={metricKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
