import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface TrendDataPoint {
  dateLabel: string; // "Mon", "Tue", "Jun 14"
  productive: number; // in hours
  unproductive: number; // in hours
  total: number; // in hours
}

interface DailyTrendChartProps {
  data: TrendDataPoint[];
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-zinc-200/10 bg-zinc-950/80 p-3 shadow-xl backdrop-blur-md dark:border-zinc-800/40">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{payload[0].payload.dateLabel}</p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Productive: {payload[0].value.toFixed(1)}h
            </p>
            <p className="text-xs text-rose-400 font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Unproductive: {payload[1].value.toFixed(1)}h
            </p>
            <p className="text-xs text-zinc-300 font-semibold flex items-center gap-2 border-t border-zinc-800 pt-1.5 mt-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              Total Tracked: {payload[0].payload.total.toFixed(1)}h
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-zinc-500">
          No trend records found for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorProductive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUnproductive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis
              dataKey="dateLabel"
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}h`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="productive"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorProductive)"
            />
            <Area
              type="monotone"
              dataKey="unproductive"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUnproductive)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
