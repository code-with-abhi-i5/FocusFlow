import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Target } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalCardProps {
  title: string;
  current: number; // e.g., current productive hours (2.5) or social limit (90 mins)
  target: number; // e.g., target hours (4) or limit (120 mins)
  unit: string; // "h" or "m"
  type: 'productive' | 'limit';
}

export const GoalCard: React.FC<GoalCardProps> = ({
  title,
  current,
  target,
  unit,
  type,
}) => {
  // Safe progress percentage
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  // Decide completion state
  const isCompleted = type === 'productive' ? percentage >= 100 : percentage < 100;
  const isExceeded = type === 'limit' && percentage >= 100;

  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);

  useEffect(() => {
    if (isCompleted && type === 'productive' && !hasFiredConfetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#8b5cf6', '#a78bfa']
      });
      setHasFiredConfetti(true);
    }
  }, [isCompleted, type, hasFiredConfetti]);

  // Decide colors
  const getProgressColor = () => {
    if (type === 'limit') {
      if (percentage >= 90) return 'bg-rose-500 shadow-rose-500/20';
      if (percentage >= 70) return 'bg-amber-500 shadow-amber-500/20';
      return 'bg-violet-500 shadow-violet-500/20';
    }
    return percentage >= 100 
      ? 'bg-emerald-500 shadow-emerald-500/20' 
      : 'bg-violet-500 shadow-violet-500/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 bg-white/40 dark:bg-zinc-900/30"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h4 className="font-display font-bold text-zinc-900 dark:text-white text-sm md:text-base">
            {title}
          </h4>
          <p className="text-xs text-zinc-500">
            {type === 'productive' ? 'Daily Focus Target' : 'App Usage Ceiling'}
          </p>
        </div>

        {isCompleted && type === 'productive' ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : isExceeded ? (
          <span className="text-[10px] font-bold bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full border border-rose-500/20">
            Limit Exceeded
          </span>
        ) : (
          <Target className="h-5 w-5 text-zinc-500" />
        )}
      </div>

      {/* Progress display */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs font-semibold">
          <span className="text-zinc-700 dark:text-zinc-300">
            {current.toFixed(1)}{unit} <span className="text-zinc-500 font-normal">/ {target.toFixed(0)}{unit}</span>
          </span>
          <span className={type === 'limit' && percentage >= 95 ? 'text-rose-400 font-bold' : 'text-zinc-400'}>
            {Math.round(percentage)}%
          </span>
        </div>

        {/* Progress bar container */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/50 dark:bg-zinc-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] ${getProgressColor()}`}
          />
        </div>
      </div>
    </motion.div>
  );
};
