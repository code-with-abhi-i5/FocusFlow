import React from 'react';
import { motion } from 'framer-motion';

interface HeatmapDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  weekIndex: number; // 0 to 3 (4 weeks total)
  productiveHours: number;
}

interface WeeklyHeatmapProps {
  data: HeatmapDay[];
}

export const WeeklyHeatmap: React.FC<WeeklyHeatmapProps> = ({ data }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Arrange data into a matrix [dayOfWeek][weekIndex]
  const matrix: (HeatmapDay | null)[][] = Array(7).fill(null).map(() => Array(4).fill(null));
  
  data.forEach((day) => {
    if (day.dayOfWeek >= 0 && day.dayOfWeek < 7 && day.weekIndex >= 0 && day.weekIndex < 4) {
      matrix[day.dayOfWeek][day.weekIndex] = day;
    }
  });

  // Determine square color based on productive hours
  const getCellColor = (hours: number) => {
    if (hours === 0) return 'bg-zinc-200/5 dark:bg-zinc-900/40 border border-zinc-200/5 dark:border-zinc-800/10';
    if (hours < 1.5) return 'bg-violet-900/25 border border-violet-500/10 text-violet-300';
    if (hours < 3) return 'bg-violet-800/40 border border-violet-500/20 text-violet-200';
    if (hours < 5) return 'bg-violet-600/70 border border-violet-400/35 text-white';
    return 'bg-violet-500 border border-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.25)] text-white';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Last 4 Weeks Activity
        </span>
        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
          <span>Less</span>
          <span className="h-2.5 w-2.5 rounded-sm bg-zinc-950/40 border border-zinc-800" />
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-900/25 border border-violet-800/20" />
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-600/70 border border-violet-500/20" />
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-500 border border-violet-400" />
          <span>More</span>
        </div>
      </div>

      <div className="flex justify-center py-4">
        <div className="grid grid-flow-col gap-3">
          {/* Day indicators */}
          <div className="flex flex-col justify-between pr-2 text-[10px] font-bold text-zinc-600 dark:text-zinc-500 h-[172px]">
            {daysOfWeek.map((day, idx) => (
              <span key={day} className={idx % 2 === 0 ? 'opacity-40' : ''}>
                {day}
              </span>
            ))}
          </div>

          {/* Grid weeks (4 columns) */}
          <div className="flex gap-2.5">
            {Array.from({ length: 4 }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-2.5">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const dayData = matrix[dayIdx][weekIdx];
                  const hours = dayData ? dayData.productiveHours : 0;
                  const dateString = dayData ? dayData.date : 'No Entry';
                  
                  return (
                    <div key={dayIdx} className="group relative">
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        className={`h-5 w-5 rounded-[5px] cursor-pointer transition-colors duration-200 ${getCellColor(hours)}`}
                      />
                      {/* Tooltip on Hover */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-32 -translate-x-1/2 scale-0 rounded-lg border border-zinc-200/10 bg-zinc-950/90 p-2 text-center text-xxs font-semibold text-white shadow-xl backdrop-blur-md transition-all duration-150 group-hover:scale-100 dark:border-zinc-800/60">
                        <p className="text-[9px] text-zinc-400">{dateString}</p>
                        <p className="mt-0.5 text-violet-400">{hours.toFixed(1)} hrs focused</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
