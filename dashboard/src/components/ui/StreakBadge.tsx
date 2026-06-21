import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak }) => {
  // Determine badge level/title based on streak days
  const getBadgeTier = (days: number) => {
    if (days >= 21) return { name: 'Elite Focus Master', color: 'from-amber-400 to-rose-500 shadow-rose-500/20 text-amber-100' };
    if (days >= 7) return { name: 'Productivity Ninja', color: 'from-violet-500 to-indigo-600 shadow-violet-500/20 text-violet-100' };
    if (days >= 3) return { name: 'Focus Warrior', color: 'from-emerald-400 to-teal-500 shadow-emerald-500/20 text-emerald-100' };
    return { name: 'Focus Recruit', color: 'from-zinc-500 to-zinc-700 shadow-zinc-500/10 text-zinc-300' };
  };

  const tier = getBadgeTier(streak);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative overflow-hidden rounded-2xl border border-zinc-200/10 bg-gradient-to-br ${tier.color} p-5 shadow-xl backdrop-blur-md`}
    >
      {/* Decorative inner glow */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />

      <div className="flex items-center gap-4">
        {/* Flame widget */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-inner">
          <Flame className={`h-6 w-6 text-white ${streak > 0 ? 'animate-bounce' : 'opacity-70'}`} />
        </div>

        <div className="space-y-0.5">
          <span className="text-xxs uppercase tracking-widest text-white/70 font-semibold">
            Productive Streak
          </span>
          <div className="flex items-baseline gap-1.5">
            <h4 className="font-display text-2xl font-black text-white">
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </h4>
            <span className="text-xxs font-medium rounded bg-white/20 px-1.5 py-0.5 text-white">
              {tier.name}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
