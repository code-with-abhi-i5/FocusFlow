import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onMenuOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuOpen }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  // Simple page title resolver
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Overview';
      case '/analytics':
        return 'Deep Analytics';
      case '/goals':
        return 'Goals & Milestones';
      case '/settings':
        return 'Settings';
      default:
        return 'FocusFlow';
    }
  };

  // Mock Notifications for design aesthetics
  const notifications = [
    {
      id: 1,
      title: 'Goal Reached! 🚀',
      message: 'You achieved your daily productive goal of 4 hours.',
      time: '10m ago',
      unread: true
    },
    {
      id: 2,
      title: 'Limit Exceeded ⚠️',
      message: 'You have spent 45 minutes on youtube.com today.',
      time: '1h ago',
      unread: true
    },
    {
      id: 3,
      title: 'Productivity Streak 🔥',
      message: 'You are on a 5-day productive streak! Keep it up.',
      time: '1d ago',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-zinc-200/20 bg-zinc-950/20 px-6 backdrop-blur-md dark:border-zinc-800/40 dark:bg-zinc-950/40 lg:px-8">
      {/* Page Title & Menu Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuOpen}
          className="rounded-xl border border-zinc-200/10 p-2 text-zinc-400 hover:bg-zinc-900/50 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100 lg:text-xl">
            {getPageTitle(location.pathname)}
          </h1>
          <p className="hidden text-xs text-zinc-500 md:block">
            Track, reflect, and master your focus.
          </p>
        </div>
      </div>

      {/* Quick Actions (Notifications, Theme Toggle) */}
      <div className="flex items-center gap-3">
        {/* Sparkles / Streak mini widget */}
        <div className="hidden items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 px-3.5 py-1 text-xs font-semibold text-violet-400 md:flex">
          <Sparkles className="h-3.5 w-3.5" />
          Focus Active
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative rounded-xl border border-zinc-200/15 p-2.5 text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-all cursor-pointer"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-violet-400" />
          ) : (
            <Moon className="h-5 w-5 text-zinc-600" />
          )}
        </button>

        {/* Notification system */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative rounded-xl border border-zinc-200/15 p-2.5 text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-all cursor-pointer ${
              showNotifications ? 'bg-zinc-900/50 text-white' : ''
            }`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              {/* Overlay to close notifications */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-3 w-80 md:w-96 origin-top-right rounded-2xl border border-zinc-200/20 bg-zinc-900/90 p-4 text-zinc-300 shadow-2xl backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/95 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="mb-3 flex items-center justify-between border-b border-zinc-800/40 pb-2">
                  <h3 className="font-display font-semibold text-white">Notifications</h3>
                  <span className="text-xs text-violet-400 font-medium hover:underline cursor-pointer">Mark all as read</span>
                </div>
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex flex-col gap-0.5 rounded-xl p-3 transition-colors ${
                        notif.unread
                          ? 'bg-violet-950/10 border border-violet-500/10'
                          : 'hover:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">{notif.title}</span>
                        <span className="text-xxs text-zinc-500">{notif.time}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{notif.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
