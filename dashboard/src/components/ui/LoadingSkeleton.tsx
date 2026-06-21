import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`skeleton-shimmer animate-shimmer rounded-xl opacity-40 dark:opacity-20 ${className}`} />
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card flex flex-col justify-between p-6 bg-white/40 dark:bg-zinc-900/30">
      <div className="flex items-start justify-between">
        <div className="w-2/3 space-y-3">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      <div className="mt-5 border-t border-zinc-200/10 pt-4 dark:border-zinc-800/40 flex justify-between items-center">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2 w-1/3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-60 w-full mt-4" />
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800/20 pb-4">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-4 w-12" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800/10 last:border-0">
          <div className="flex items-center gap-3 w-1/2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
};
