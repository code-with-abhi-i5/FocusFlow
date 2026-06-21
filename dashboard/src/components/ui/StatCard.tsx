import React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  iconColorClass?: string;
  iconBgClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconColorClass = 'text-violet-500 dark:text-violet-400',
  iconBgClass = 'bg-violet-500/10 dark:bg-violet-500/10',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card flex flex-col justify-between p-6 bg-white/40 dark:bg-zinc-900/30"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {title}
          </span>
          <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-white lg:text-3xl">
            {value}
          </h3>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBgClass} border border-zinc-200/10`}>
          <Icon className={`h-6 w-6 ${iconColorClass}`} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-200/10 pt-4 dark:border-zinc-800/40">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate pr-2">
          {description}
        </span>
        {trend && (
          <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xxs font-bold ${
            trend.isPositive 
              ? 'bg-emerald-500/10 text-emerald-500' 
              : 'bg-rose-500/10 text-rose-500'
          }`}>
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
