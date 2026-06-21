import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Target, 
  Settings, 
  LogOut, 
  Flame,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { profile, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-zinc-200/20 bg-zinc-950/70 p-6 text-zinc-400 backdrop-blur-xl transition-transform duration-300 ease-in-out dark:border-zinc-800/40 dark:bg-zinc-950/80 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-8">
          {/* Logo / Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
                <Flame className="h-5 w-5 text-white animate-pulse-slow" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Focus<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Flow</span>
              </span>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={onClose} 
              className="rounded-lg p-1.5 hover:bg-zinc-800/50 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => onClose()}
                  className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-violet-600/10 to-indigo-600/10 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.05)]'
                      : 'hover:bg-zinc-900/40 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                    active ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold tracking-wider text-violet-400 uppercase mb-0.5">Your Sync Key</span>
                <span className="truncate text-xs font-mono text-zinc-300" title={profile?.uid}>{profile?.uid || 'Not signed in'}</span>
              </div>
              <button 
                onClick={() => {
                  if (profile?.uid) navigator.clipboard.writeText(profile.uid);
                  alert('Sync Key copied to clipboard!');
                }}
                className="ml-2 rounded-lg bg-violet-600/20 p-1.5 text-violet-400 hover:bg-violet-600/40 hover:text-white transition-colors"
                title="Copy Sync Key"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>

            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
      </aside>
    </>
  );
};
