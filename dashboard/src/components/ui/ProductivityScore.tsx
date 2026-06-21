import React from 'react';
import { motion } from 'framer-motion';

interface ProductivityScoreProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
}

export const ProductivityScore: React.FC<ProductivityScoreProps> = ({
  score,
  size = 140,
  strokeWidth = 10,
}) => {
  // SVG circular properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  // Determine colors based on rating
  const getColorClass = (val: number) => {
    if (val >= 70) return 'stroke-emerald-500 text-emerald-400';
    if (val >= 45) return 'stroke-violet-500 text-violet-400';
    return 'stroke-rose-500 text-rose-400';
  };

  const colorClass = getColorClass(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        {/* Track circle */}
        <circle
          className="stroke-zinc-200/10 fill-none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Fill circle */}
        <motion.circle
          className={`fill-none transition-all duration-1000 ease-out ${colorClass.split(' ')[0]}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          strokeLinecap="round"
        />
      </svg>

      {/* Label overlays */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <motion.span 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`font-display text-3xl font-extrabold tracking-tight ${colorClass.split(' ')[1]}`}
        >
          {score}%
        </motion.span>
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 mt-0.5">
          Productive
        </span>
      </div>
    </div>
  );
};
