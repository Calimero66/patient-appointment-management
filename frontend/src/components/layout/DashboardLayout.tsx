import React from 'react';
import { Sidebar, type DashboardTab } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  isOnline: boolean;
  children: React.ReactNode;
}

export function DashboardLayout({
  activeTab,
  onSelectTab,
  isOnline,
  children
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation Component */}
      <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} />

      {/* Main Content Area */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top Navbar Header Component */}
        <Header isOnline={isOnline} />

        {/* Dynamic View Container */}
        <div className="p-8 space-y-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
