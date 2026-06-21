import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface DomainDataPoint {
  domain: string;
  timeSpent: number; // minutes
  category: 'productive' | 'unproductive' | 'neutral';
}

interface TopWebsitesChartProps {
  data: DomainDataPoint[];
}

export const TopWebsitesChart: React.FC<TopWebsitesChartProps> = ({ data }) => {
  // Safe sorting and filtering top 7
  const sortedData = [...data]
    .sort((a, b) => b.timeSpent - a.timeSpent)
    .slice(0, 7);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productive': return '#10b981';
      case 'unproductive': return '#ef4444';
      default: return '#8b5cf6'; // Violet/neutral accent
    }
  };

  const formatTooltipValue = (value: number) => {
    const hours = Math.floor(value / 60);
    const mins = Math.round(value % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="rounded-xl border border-zinc-200/10 bg-zinc-950/80 p-3 shadow-xl backdrop-blur-md dark:border-zinc-800/40">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{dataPoint.domain}</p>
          <p className="text-sm font-bold text-white mt-1">
            {formatTooltipValue(dataPoint.timeSpent)}
          </p>
          <span className={`inline-block mt-2 rounded bg-white/10 px-1.5 py-0.5 text-xxs font-semibold uppercase tracking-wider text-zinc-400`} style={{ color: getCategoryColor(dataPoint.category) }}>
            {dataPoint.category}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      {sortedData.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-zinc-500">
          No website records found for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              tickFormatter={(val) => `${Math.round(val)}m`}
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="domain"
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={100}
              tickFormatter={(domain) => domain.length > 15 ? `${domain.substring(0, 13)}...` : domain}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar
              dataKey="timeSpent"
              radius={[0, 8, 8, 0]}
              barSize={16}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
