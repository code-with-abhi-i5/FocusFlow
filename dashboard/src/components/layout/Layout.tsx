import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100">
      
      {/* Animated Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-violet-600/10 blur-[120px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute top-[40%] -right-[10%] h-[40%] w-[40%] rounded-full bg-emerald-500/10 blur-[100px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[20%] left-[20%] h-[40%] w-[40%] rounded-full bg-indigo-500/10 blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Toolbar */}
        <Header onMenuOpen={() => setSidebarOpen(true)} />

        {/* Scrollable Page Outlet */}
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
