import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: 'inbox' | 'alert';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Collected Yet',
  description = 'Install and log in to the Chrome Extension to start automatically tracking your active web session duration.',
  actionText,
  onAction,
  icon = 'inbox',
}) => {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass-card flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-zinc-900/30"
    >
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/50">
        <div className="absolute inset-0 h-full w-full rounded-2xl bg-violet-500/10 blur-xl animate-pulse-slow" />
        {icon === 'alert' ? (
          <ShieldAlert className="h-8 w-8 text-amber-400" />
        ) : (
          <Inbox className="h-8 w-8 text-violet-400" />
        )}
      </div>

      <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="max-w-md text-sm text-zinc-500 leading-relaxed mb-6">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer transition-all hover:scale-102"
        >
          {actionText}
        </button>
      )}
    </motion.div>
  );
};
