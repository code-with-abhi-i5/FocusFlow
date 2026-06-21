import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { StatCard } from '../components/ui/StatCard';
import { ProductivityPieChart } from '../components/charts/ProductivityPieChart';
import { DailyTrendChart } from '../components/charts/DailyTrendChart';
import { TopWebsitesChart } from '../components/charts/TopWebsitesChart';
import { WeeklyHeatmap } from '../components/charts/WeeklyHeatmap';
import { StatCardSkeleton, ChartSkeleton } from '../components/ui/LoadingSkeleton';
import { TrendingUp, Clock, Target, AlertTriangle } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [daysRange, setDaysRange] = useState<7 | 30>(7);
  const { 
    loading, 
    pieData, 
    trendData, 
    topDomains, 
    heatmapData, 
    summaryStats 
  } = useAnalytics(daysRange);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse-slow">
        <div className="flex justify-between items-center">
          <div className="h-6 w-36 bg-zinc-800 rounded" />
          <div className="h-10 w-32 bg-zinc-800 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
            Deep Analytics
          </h2>
          <p className="text-sm text-zinc-500">
            Analyze your focus patterns, trend shifts, and domain rankings.
          </p>
        </div>

        {/* Range select buttons */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900/50 p-1 border border-zinc-200/10 self-start">
          <button
            onClick={() => setDaysRange(7)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              daysRange === 7
                ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDaysRange(30)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              daysRange === 30
                ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Summary statistics row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Average Focus Score"
          value={`${summaryStats.avgScore}%`}
          description={`Avg score over last ${daysRange}d`}
          icon={TrendingUp}
          iconColorClass="text-emerald-500 dark:text-emerald-400"
          iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/10"
        />
        <StatCard
          title="Total Screen Time"
          value={`${summaryStats.totalTrackedHours.toFixed(1)} hrs`}
          description="Total active tracking logged"
          icon={Clock}
          iconColorClass="text-violet-500 dark:text-violet-400"
          iconBgClass="bg-violet-500/10 dark:bg-violet-500/10"
        />
        <StatCard
          title="Productive Focus"
          value={`${summaryStats.productiveHours.toFixed(1)} hrs`}
          description="Logged in productive categories"
          icon={Target}
          iconColorClass="text-indigo-500 dark:text-indigo-400"
          iconBgClass="bg-indigo-500/10 dark:bg-indigo-500/10"
        />
        <StatCard
          title="Total Distractions"
          value={`${summaryStats.unproductiveHours.toFixed(1)} hrs`}
          description="Logged on entertainment/socials"
          icon={AlertTriangle}
          iconColorClass="text-rose-500 dark:text-rose-400"
          iconBgClass="bg-rose-500/10 dark:bg-rose-500/10"
        />
      </div>

      {/* Dual Row Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Productivity ratio pie chart */}
        <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-6">
            Productive Hours Share
          </h3>
          <ProductivityPieChart data={pieData} />
        </div>

        {/* Heatmap graph */}
        <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-6">
            Focus Intensity Heatmap
          </h3>
          <WeeklyHeatmap data={heatmapData} />
        </div>
      </div>

      {/* Full width daily trends chart */}
      <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-6">
          Daily Trends (Focus vs Distraction)
        </h3>
        <DailyTrendChart data={trendData} />
      </div>

      {/* Bottom Row website rankings */}
      <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-6">
          Top Domain Breakdown
        </h3>
        <TopWebsitesChart data={topDomains} />
      </div>
    </div>
  );
};

export default AnalyticsPage;
