import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCustomCategories, saveCustomCategories } from '../services/firebase/categoryService';
import type { CustomCategories, ProductivityCategory } from '../types';
import { Settings, Plus, Trash2, Shield, Download } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CustomCategories | null>(null);

  // Form input states
  const [newDomain, setNewDomain] = useState('');
  const [newCategory, setNewCategory] = useState<ProductivityCategory>('productive');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync settings states
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [idleTimeout, setIdleTimeout] = useState(60);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToCustomCategories(user.uid, (data) => {
      setCategories(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDomain.trim()) return;

    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    const domain = newDomain.trim().toLowerCase();

    // Use current categories or start fresh
    const productive = [...(categories?.productive ?? [])];
    const unproductive = [...(categories?.unproductive ?? [])];
    const neutral = [...(categories?.neutral ?? [])];

    // Remove domain from all categories first to avoid duplicates
    const filterFn = (d: string) => d !== domain;
    const cleanProductive = productive.filter(filterFn);
    const cleanUnproductive = unproductive.filter(filterFn);
    const cleanNeutral = neutral.filter(filterFn);

    // Add to designated array
    if (newCategory === 'productive') cleanProductive.push(domain);
    else if (newCategory === 'unproductive') cleanUnproductive.push(domain);
    else cleanNeutral.push(domain);

    try {
      await saveCustomCategories(user.uid, {
        productive: cleanProductive,
        unproductive: cleanUnproductive,
        neutral: cleanNeutral
      });
      setNewDomain('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to add custom domain category', err);
      setSaveError(err?.message || 'Failed to save. Check your connection or Firestore rules.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDomain = async (domain: string, category: ProductivityCategory) => {
    if (!user || !categories) return;

    const productive = [...categories.productive];
    const unproductive = [...categories.unproductive];
    const neutral = [...categories.neutral];

    const filterFn = (d: string) => d !== domain;

    try {
      await saveCustomCategories(user.uid, {
        productive: category === 'productive' ? productive.filter(filterFn) : productive,
        unproductive: category === 'unproductive' ? unproductive.filter(filterFn) : unproductive,
        neutral: category === 'neutral' ? neutral.filter(filterFn) : neutral
      });
    } catch (err) {
      console.error('Failed to remove custom domain category', err);
    }
  };

  // Export JSON functionality
  const handleExportData = () => {
    if (!categories) return;
    const exportObj = {
      categories: {
        productive: categories.productive,
        unproductive: categories.unproductive,
        neutral: categories.neutral
      },
      settings: {
        alertsEnabled,
        idleTimeout
      },
      exportedAt: new Date().toISOString()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `focusflow_settings_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-zinc-500 animate-pulse-slow">
        Loading customization configurations...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
          Settings & Rules
        </h2>
        <p className="text-sm text-zinc-500">
          Customize website categories, notification ceilings, and export local data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Domain Custom categories */}
        <div className="space-y-6 lg:col-span-8">
          {/* Add custom domain card */}
          <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-violet-400" />
              Categorize Domain Override
            </h3>
            
            <form onSubmit={handleAddDomain} className="flex flex-col gap-4 sm:flex-row">
              <input
                type="text"
                required
                placeholder="e.g. stackoverflow.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-200/15 bg-zinc-950/20 px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              />
              
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ProductivityCategory)}
                className="rounded-xl border border-zinc-200/15 bg-zinc-900 px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500/25 cursor-pointer"
              >
                <option value="productive">Productive</option>
                <option value="unproductive">Unproductive (Distraction)</option>
                <option value="neutral">Neutral</option>
              </select>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Add Rule'}
              </button>
            </form>
            {saveError && (
              <p className="mt-2 text-xs text-rose-400">⚠ {saveError}</p>
            )}
            {saveSuccess && (
              <p className="mt-2 text-xs text-emerald-400">✓ Domain rule saved successfully!</p>
            )}
          </div>

          {/* Grid listings of domain categories */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Productive list */}
            <div className="glass-card p-5 bg-white/40 dark:bg-zinc-900/30 space-y-4">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Productive Domains ({categories?.productive.length || 0})
              </h4>
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                {categories?.productive.length === 0 ? (
                  <p className="text-xxs text-zinc-500 py-3">No productive overrides configured.</p>
                ) : (
                  categories?.productive.map((dom) => (
                    <div key={dom} className="flex items-center justify-between rounded-lg bg-zinc-950/20 px-3 py-2 border border-zinc-200/5">
                      <span className="text-xxs font-medium text-zinc-300 truncate">{dom}</span>
                      <button
                        onClick={() => handleRemoveDomain(dom, 'productive')}
                        className="rounded p-1 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Unproductive list */}
            <div className="glass-card p-5 bg-white/40 dark:bg-zinc-900/30 space-y-4">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Distraction Domains ({categories?.unproductive.length || 0})
              </h4>
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                {categories?.unproductive.length === 0 ? (
                  <p className="text-xxs text-zinc-500 py-3">No distraction overrides configured.</p>
                ) : (
                  categories?.unproductive.map((dom) => (
                    <div key={dom} className="flex items-center justify-between rounded-lg bg-zinc-950/20 px-3 py-2 border border-zinc-200/5">
                      <span className="text-xxs font-medium text-zinc-300 truncate">{dom}</span>
                      <button
                        onClick={() => handleRemoveDomain(dom, 'unproductive')}
                        className="rounded p-1 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Options settings & backup */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Sync Key display */}
          <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30 space-y-4 border-violet-500/30">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" />
              Your Sync Key
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Paste this key into the FocusFlow Chrome Extension options page to link your browsing data.
            </p>
            <div className="flex items-center justify-between rounded-xl border border-zinc-200/15 bg-zinc-950/40 px-3 py-2">
              <code className="text-xs text-zinc-300 truncate max-w-[200px]">
                {user?.uid || 'Not signed in'}
              </code>
              <button
                onClick={() => {
                  if (user?.uid) navigator.clipboard.writeText(user.uid);
                  alert('Sync Key copied!');
                }}
                className="ml-2 rounded bg-violet-500/20 px-2 py-1 text-[10px] font-bold text-violet-300 hover:bg-violet-500/40 cursor-pointer transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {/* General sync preferences */}
          <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30 space-y-5">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings className="h-4 w-4 text-violet-400" />
              General Preferences
            </h3>

            {/* Notification alert toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Chrome Alert Alarms
                </label>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Fire browser alerts when limits are exceeded.
                </p>
              </div>
              <button
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  alertsEnabled ? 'bg-violet-500' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    alertsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Idle detection slider */}
            <div className="space-y-2 border-t border-zinc-200/10 pt-4 dark:border-zinc-800/40">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Idle Timeout Limit
                </label>
                <span className="font-bold text-violet-400">
                  {idleTimeout}s
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="300"
                step="15"
                value={idleTimeout}
                onChange={(e) => setIdleTimeout(parseInt(e.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 dark:bg-zinc-800 accent-violet-500"
              />
              <p className="text-[10px] text-zinc-500 leading-normal">
                Pause tracking after the specified inactivity duration.
              </p>
            </div>
          </div>

          {/* Backup settings */}
          <div className="glass-card p-6 bg-white/40 dark:bg-zinc-900/30 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              <Download className="h-4 w-4 text-violet-400" />
              Backup & Safety
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Export your category configurations and settings as a backup file.
            </p>
            <button
              onClick={handleExportData}
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200/15 bg-zinc-900/10 px-4 py-3 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-800/40 hover:text-white cursor-pointer"
            >
              Export Local Config JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
