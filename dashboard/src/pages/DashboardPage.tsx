import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Flame, 
  Target, 
  Sparkles, 
  ShieldAlert, 
  Info,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useTimeData } from '../hooks/useTimeData';
import { useGoals } from '../hooks/useGoals';
import { useStreaks } from '../hooks/useStreaks';
import { StatCard } from '../components/ui/StatCard';
import { ProductivityScore } from '../components/ui/ProductivityScore';
import { GoalCard } from '../components/ui/GoalCard';
import { HeatmapSection } from '../components/ui/HeatmapSection';
import { generateInsights } from '../services/aiCoach';
import { StatCardSkeleton, TableSkeleton } from '../components/ui/LoadingSkeleton';

export const DashboardPage: React.FC = () => {
  const { 
    loading: timeLoading, 
    score, 
    totalTimeMs, 
    productiveTimeMs, 
    unproductiveTimeMs, 
    topDomains 
  } = useTimeData();

  const { loading: goalsLoading, goals } = useGoals();
  const { loading: streakLoading, streak } = useStreaks();

  const loading = timeLoading || goalsLoading || streakLoading;

  // Format milliseconds into hours + minutes
  const formatTime = (ms: number) => {
    const totalSecs = ms / 1000;
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Convert stats to minutes for AI Coach
  const totalMins = totalTimeMs / (1000 * 60);
  const prodMins = productiveTimeMs / (1000 * 60);
  const unprodMins = unproductiveTimeMs / (1000 * 60);

  // Memoize AI coach insights
  const coachInsights = useMemo(() => {
    if (loading) return [];
    return generateInsights(score, totalMins, prodMins, unprodMins, topDomains);
  }, [loading, score, totalMins, prodMins, unprodMins, topDomains]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse-slow">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <TableSkeleton />
          </div>
          <div className="lg:col-span-8">
            <TableSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Calculate actual productive hours vs target
  const currentProdHours = productiveTimeMs / (1000 * 60 * 60);
  const targetProdHours = goals?.dailyProductiveHours || 4;

  const currentUnprodMinutes = unproductiveTimeMs / (1000 * 60);
  const targetUnprodLimit = goals?.socialMediaLimit || 120;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
            Focus Dashboard
          </h2>
          <p className="text-sm text-zinc-500">
            Here's a breakdown of your attention footprint and flow indicators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.open('https://github.com', '_blank')}
            className="group flex items-center gap-2 rounded-xl border border-zinc-200/15 bg-zinc-900/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 backdrop-blur-sm transition-all hover:bg-zinc-800/40 hover:text-white"
          >
            Extension Guide
            <ExternalLink className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>

      {/* Hero Stats Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Productivity Score"
          value={`${score}%`}
          description="Avg focus ratio today"
          icon={TrendingUp}
          iconColorClass="text-emerald-500 dark:text-emerald-400"
          iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/10"
          trend={{ value: 12, isPositive: true, label: 'vs yesterday' }}
        />
        <StatCard
          title="Total Active Tracking"
          value={formatTime(totalTimeMs)}
          description="Screen time monitored"
          icon={Clock}
          iconColorClass="text-violet-500 dark:text-violet-400"
          iconBgClass="bg-violet-500/10 dark:bg-violet-500/10"
        />
        <StatCard
          title="Focus Streak"
          value={`${streak?.currentStreak || 0} days`}
          description={`Personal best: ${streak?.bestStreak || 0}d`}
          icon={Flame}
          iconColorClass={`text-rose-500 dark:text-rose-400 ${streak?.currentStreak && streak.currentStreak > 0 ? 'animate-pulse' : ''}`}
          iconBgClass={`bg-rose-500/10 dark:bg-rose-500/10 ${streak?.currentStreak && streak.currentStreak >= 3 ? 'shadow-[0_0_15px_rgba(244,63,94,0.5)]' : ''}`}
        />
        <StatCard
          title="Productive Focus"
          value={formatTime(productiveTimeMs)}
          description="Time spent on focus apps"
          icon={Target}
          iconColorClass="text-indigo-500 dark:text-indigo-400"
          iconBgClass="bg-indigo-500/10 dark:bg-indigo-500/10"
        />
      </div>

      {/* Year Heatmap */}
      <HeatmapSection />

      {/* Main Grid split */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Score & AI Coach */}
        <div className="space-y-6 lg:col-span-5">
          {/* Productivity Score Ring card */}
          <div className="glass-card flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-zinc-900/30 text-center">
            <h3 className="font-display font-bold text-zinc-900 dark:text-white mb-6 text-sm uppercase tracking-wider self-start">
              Attention Distribution
            </h3>
            <ProductivityScore score={score} size={150} strokeWidth={11} />
            <div className="mt-6 grid grid-cols-3 gap-6 w-full text-center border-t border-zinc-200/10 pt-6 dark:border-zinc-800/40">
              <div>
                <p className="text-xxs uppercase tracking-wider font-semibold text-zinc-500">Productive</p>
                <p className="text-sm font-bold text-emerald-400 mt-1">{formatTime(productiveTimeMs)}</p>
              </div>
              <div>
                <p className="text-xxs uppercase tracking-wider font-semibold text-zinc-500">Neutral</p>
                <p className="text-sm font-bold text-zinc-400 mt-1">{formatTime(totalTimeMs - productiveTimeMs - unproductiveTimeMs)}</p>
              </div>
              <div>
                <p className="text-xxs uppercase tracking-wider font-semibold text-zinc-500">Distractions</p>
                <p className="text-sm font-bold text-rose-400 mt-1">{formatTime(unproductiveTimeMs)}</p>
              </div>
            </div>
          </div>

          {/* AI Coach Insights */}
          <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
                AI Coach Insights
              </h3>
              <span className="text-[10px] font-bold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20">
                Live
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {coachInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`flex gap-3 rounded-xl p-3.5 border ${
                    insight.type === 'success'
                      ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                      : insight.type === 'warning'
                      ? 'bg-rose-500/5 border-rose-500/15 text-rose-400'
                      : 'bg-zinc-950/20 border-zinc-800/60 text-zinc-300'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {insight.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : insight.type === 'warning' ? (
                      <ShieldAlert className="h-4 w-4 text-rose-500" />
                    ) : (
                      <Info className="h-4 w-4 text-violet-400" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{insight.title}</h4>
                    <p className="text-xxs leading-relaxed text-zinc-500 dark:text-zinc-400">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Top Domains & Goal Tracker */}
        <div className="space-y-6 lg:col-span-7">
          {/* Top Websites List */}
          <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30">
            <h3 className="font-display font-bold text-zinc-900 dark:text-white mb-6 text-sm uppercase tracking-wider">
              Top Websites Visited Today
            </h3>

            {topDomains.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                No active web sessions recorded today. Start browsing with the extension active to view data.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {topDomains.slice(0, 5).map((site, index) => {
                  const maxMinutes = topDomains[0].timeSpent || 1;
                  const ratio = (site.timeSpent / maxMinutes) * 100;
                  
                  // Color codes
                  const barColor = 
                    site.category === 'productive' 
                      ? 'bg-emerald-500 shadow-emerald-500/10' 
                      : site.category === 'unproductive'
                      ? 'bg-rose-500 shadow-rose-500/10'
                      : 'bg-zinc-500 dark:bg-zinc-700';

                  return (
                    <div key={site.domain} className="group flex items-center justify-between gap-4">
                      {/* Domain and Favicon */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xxs font-bold text-zinc-500 w-4">0{index + 1}</span>
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(site.domain)}&sz=32`}
                          alt=""
                          className="h-7 w-7 rounded-lg bg-zinc-800 p-1"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {site.domain}
                            </span>
                            <span className="text-xxs text-zinc-500 font-semibold">
                              {site.timeSpent >= 1 
                                ? `${Math.round(site.timeSpent)}m` 
                                : `${Math.round(site.timeSpent * 60)}s`
                              }
                            </span>
                          </div>
                          {/* Inner bar indicator */}
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/50 dark:bg-zinc-800">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${ratio}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Goal Trackers Row */}
          <div className="grid gap-6 sm:grid-cols-2">
            <GoalCard
              title="Work Focus Goal"
              current={currentProdHours}
              target={targetProdHours}
              unit="h"
              type="productive"
            />
            <GoalCard
              title="Social Media Limit"
              current={currentUnprodMinutes}
              target={targetUnprodLimit}
              unit="m"
              type="limit"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
