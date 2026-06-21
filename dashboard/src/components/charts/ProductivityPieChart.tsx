import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface PieDataPoint {
  name: string;
  value: number; // minutes or hours
  color: string;
}

interface ProductivityPieChartProps {
  data: PieDataPoint[];
}

export const ProductivityPieChart: React.FC<ProductivityPieChartProps> = ({ data }) => {
  // Format tooltip minutes into readable hours + minutes
  const formatTooltipValue = (value: number) => {
    const hours = Math.floor(value / 60);
    const mins = Math.round(value % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  // Custom glassmorphic tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const percent = total > 0 ? ((dataPoint.value / total) * 100).toFixed(0) : 0;
      return (
        <div className="rounded-xl border border-zinc-200/10 bg-zinc-950/80 p-3 shadow-xl backdrop-blur-md dark:border-zinc-800/40">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{dataPoint.name}</p>
          <p className="text-sm font-bold text-white mt-1">
            {formatTooltipValue(dataPoint.value)} <span className="text-xs font-medium text-zinc-500">({percent}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative flex h-60 w-full flex-col justify-center">
      {total === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-zinc-500">
          No time data recorded for this period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Simple custom legend */}
          <div className="flex items-center justify-center gap-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
