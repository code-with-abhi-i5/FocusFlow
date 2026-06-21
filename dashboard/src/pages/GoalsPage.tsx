import React, { useState, useEffect } from 'react';
import { useGoals } from '../hooks/useGoals';
import { useStreaks } from '../hooks/useStreaks';
import { StreakBadge } from '../components/ui/StreakBadge';
import { Target, Clock, ShieldAlert, Award, Star, Flame, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const GoalsPage: React.FC = () => {
  const { loading: goalsLoading, goals, updateUserGoals } = useGoals();
  const { loading: streakLoading, streak } = useStreaks();

  // Local state for sliders
  const [prodHours, setProdHours] = useState(4);
  const [socialLimit, setSocialLimit] = useState(120);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Sync state with goals once fetched
  useEffect(() => {
    if (goals) {
      setProdHours(goals.dailyProductiveHours);
      setSocialLimit(goals.socialMediaLimit);
    }
  }, [goals]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateUserGoals(prodHours, socialLimit);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to update goals', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStreak = streak?.currentStreak || 0;

  // Gamified milestones
  const achievements = [
    { id: '1d', name: 'First Sparks', days: 1, desc: 'Logged 1 productive day', icon: Flame },
    { id: '3d', name: 'Focus Warrior', days: 3, desc: 'Logged 3 consecutive productive days', icon: Star },
    { id: '7d', name: 'Productivity Ninja', days: 7, desc: 'Logged 7 consecutive productive days', icon: Award },
    { id: '21d', name: 'Elite Focus Master', days: 21, desc: 'Logged 21 consecutive productive days', icon: Target },
  ];

  const loading = goalsLoading || streakLoading;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-zinc-500 animate-pulse-slow">
        Loading focus goals and achievements...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-500/10"
          >
            <Check className="h-4 w-4" />
            Goals updated successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title block */}
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
          Goals & Achievements
        </h2>
        <p className="text-sm text-zinc-500">
          Personalize your goals and unlock focus tier badges.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Goal Form Sliders & Streak Badge */}
        <div className="space-y-6 lg:col-span-7">
          {/* Streak Badge Display */}
          <StreakBadge streak={currentStreak} />

          {/* Goal adjustment form */}
          <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Target className="h-4 w-4 text-violet-400" />
              Adjust Daily Targets
            </h3>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Productive hours target slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-500" />
                    Daily Focus Hours
                  </label>
                  <span className="font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded text-xs">
                    {prodHours} hours
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={prodHours}
                  onChange={(e) => setProdHours(parseFloat(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 dark:bg-zinc-800 accent-violet-500"
                />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  The daily target of focused work you aim to log on productive categories (e.g. GitHub, Notion).
                </p>
              </div>

              {/* Social media usage ceiling slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-zinc-500" />
                    Distraction Limit
                  </label>
                  <span className="font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded text-xs">
                    {socialLimit} mins
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={socialLimit}
                  onChange={(e) => setSocialLimit(parseInt(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 dark:bg-zinc-800 accent-violet-500"
                />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Maximum daily ceiling allowed for unproductive categories (e.g. YouTube, social media) before triggers fire.
                </p>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer transition-all disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Save Focus Guidelines'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Milestones / Gamified badges */}
        <div className="lg:col-span-5">
          <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30 space-y-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-violet-400" />
              Focus Achievements
            </h3>

            <div className="flex flex-col gap-4">
              {achievements.map((ach) => {
                const isUnlocked = currentStreak >= ach.days;
                const Icon = ach.icon;

                return (
                  <div
                    key={ach.id}
                    className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 flex items-center gap-4 ${
                      isUnlocked
                        ? 'border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-indigo-600/5 shadow-[0_0_12px_rgba(139,92,246,0.03)]'
                        : 'border-zinc-200/5 bg-zinc-950/20 opacity-40'
                    }`}
                  >
                    {/* Glow effect for unlocked */}
                    {isUnlocked && (
                      <div className="absolute top-0 right-0 -mr-4 -mt-4 h-12 w-12 rounded-full bg-violet-500/10 blur-md" />
                    )}

                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md' 
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-zinc-400'}`}>
                          {ach.name}
                        </h4>
                        {isUnlocked && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">{ach.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
