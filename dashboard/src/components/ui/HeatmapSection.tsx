import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getTimeEntriesRange } from '../../services/firebase/timeEntryService';

export const HeatmapSection: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataMap, setDataMap] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      const today = new Date();
      const pastYear = new Date();
      pastYear.setDate(today.getDate() - 364); // Last 365 days
      
      const startStr = pastYear.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];
      
      const entries = await getTimeEntriesRange(user.uid, startStr, endStr);
      
      const newMap: Record<string, number> = {};
      entries.forEach(entry => {
        if (entry.category === 'productive') {
          newMap[entry.date] = (newMap[entry.date] || 0) + entry.timeSpent;
        }
      });
      
      setDataMap(newMap);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30 animate-pulse-slow">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-6"></div>
        <div className="h-32 w-full bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg"></div>
      </div>
    );
  }

  // Generate 365 days
  const today = new Date();
  const pastYear = new Date();
  pastYear.setDate(today.getDate() - 364);

  // Align to start of week (Sunday = 0)
  const startDay = pastYear.getDay();
  
  const cells: { date: Date; dateStr: string; prodMs: number; intensity: number }[] = [];
  
  // Fill empty spaces for alignment
  for (let i = 0; i < startDay; i++) {
    cells.push({ date: new Date(0), dateStr: '', prodMs: 0, intensity: -1 });
  }

  let maxProdMs = 1;
  Object.values(dataMap).forEach(v => {
    if (v > maxProdMs) maxProdMs = v;
  });

  // Most people aim for 4 hours (14400000 ms), let's cap max intensity at 4 hours or actual max
  const intensityCap = Math.min(maxProdMs, 4 * 3600 * 1000);

  for (let i = 0; i < 365; i++) {
    const d = new Date(pastYear);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const prodMs = dataMap[dateStr] || 0;
    
    let intensity = 0;
    if (prodMs > 0) {
      intensity = Math.ceil((prodMs / intensityCap) * 4);
      if (intensity > 4) intensity = 4;
    }
    
    cells.push({ date: d, dateStr, prodMs, intensity });
  }

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 3600));
    const mins = Math.floor((ms % (1000 * 3600)) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getIntensityClass = (intensity: number) => {
    switch (intensity) {
      case -1: return 'bg-transparent border-none';
      case 0: return 'bg-zinc-100 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600';
      case 1: return 'bg-emerald-500/20 hover:border-emerald-500/40';
      case 2: return 'bg-emerald-500/40 hover:border-emerald-500/60';
      case 3: return 'bg-emerald-500/70 hover:border-emerald-500/90';
      case 4: return 'bg-emerald-500 hover:border-emerald-400';
      default: return 'bg-zinc-100 dark:bg-zinc-800/50';
    }
  };

  return (
    <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-500" />
          Productivity Heatmap
        </h3>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Last 365 Days
        </span>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[700px] flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2 pt-5 text-[10px] font-semibold text-zinc-400 uppercase">
            <span className="h-3 leading-3">Mon</span>
            <span className="h-3 leading-3 mt-3">Wed</span>
            <span className="h-3 leading-3 mt-3">Fri</span>
          </div>

          {/* Grid columns */}
          <div className="flex flex-col flex-wrap gap-1" style={{ height: 'calc(7 * (0.75rem + 0.25rem))' }}>
            {cells.map((cell, idx) => (
              <div 
                key={idx}
                className={`w-3 h-3 rounded-[2px] transition-all border border-transparent ${getIntensityClass(cell.intensity)}`}
                title={cell.intensity === -1 ? '' : `${cell.date.toDateString()}: ${formatTime(cell.prodMs)} productive`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs font-semibold text-zinc-500">
        <span>Less</span>
        <div className="w-3 h-3 rounded-[2px] bg-zinc-100 dark:bg-zinc-800/50"></div>
        <div className="w-3 h-3 rounded-[2px] bg-emerald-500/20"></div>
        <div className="w-3 h-3 rounded-[2px] bg-emerald-500/40"></div>
        <div className="w-3 h-3 rounded-[2px] bg-emerald-500/70"></div>
        <div className="w-3 h-3 rounded-[2px] bg-emerald-500"></div>
        <span>More</span>
      </div>
    </div>
  );
};
