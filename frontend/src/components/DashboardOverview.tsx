import { type User } from '../services/api';
import { type AuditLog } from '../services/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table';
import {
  Users,
  Calendar,
  Activity,
  UserPlus,
  TrendingUp,
  CheckCircle2,
  Clock,
  RefreshCw,
  Shield
} from 'lucide-react';
import { type DashboardTab } from './layout/Sidebar';

interface DashboardOverviewProps {
  user: User | null;
  isOnline: boolean;
  recentAuditLogs: AuditLog[];
  isLoadingLogs: boolean;
  totalUsersCount?: number | null;
  totalAppointmentsCount?: number | null;
  onNavigateTab: (tab: DashboardTab) => void;
}

export function DashboardOverview({
  user,
  isOnline,
  recentAuditLogs,
  isLoadingLogs,
  totalUsersCount,
  totalAppointmentsCount,
  onNavigateTab
}: DashboardOverviewProps) {
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Administrator';

  const stats = [
    {
      title: 'Total System Users',
      value: totalUsersCount !== undefined && totalUsersCount !== null ? String(totalUsersCount) : '...',
      change: 'Registered user accounts',
      isPositive: true,
      icon: Users,
      colorClass: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Active Appointments',
      value: totalAppointmentsCount !== undefined && totalAppointmentsCount !== null ? String(totalAppointmentsCount) : '...',
      change: 'Scheduled consultations',
      isPositive: true,
      icon: Calendar,
      colorClass: 'bg-emerald-50 text-emerald-600'
    },
    {
      title: 'System Health',
      value: isOnline ? 'Online' : 'Offline',
      change: isOnline ? 'All services operational' : 'Server unavailable',
      isPositive: isOnline,
      icon: Activity,
      colorClass: isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
    }
  ];

  const getLogUserDisplay = (log: AuditLog) => {
    if (log.userName) return log.userName;
    if (log.userEmail) return log.userEmail;
    if (typeof log.user === 'string') return log.user;
    if (log.user && typeof log.user === 'object') {
      const name = `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim();
      return name || log.user.email || 'System User';
    }
    return 'System User';
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <strong className="text-slate-800">{displayName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            onClick={() => onNavigateTab('users')}
          >
            <UserPlus size={16} />
            <span>Go to User Management</span>
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            onClick={() => alert('Generating system report...')}
          >
            <TrendingUp size={16} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.colorClass}`}>
                  <IconComponent size={18} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-0.5">{stat.value}</h2>
                <span className={`text-xs font-medium ${stat.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity & Quick Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT ACTIVITY SHADCN TABLE */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900">Recent System Activity</h3>
            </div>
            <button onClick={() => onNavigateTab('audit')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
              View All Logs
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User / Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLogs ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold">
                      <RefreshCw size={16} className="animate-spin text-blue-600" />
                      <span>Loading recent activity...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : recentAuditLogs.length > 0 ? (
                recentAuditLogs.slice(0, 5).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-semibold text-slate-900">{getLogUserDisplay(log)}</TableCell>
                    <TableCell className="text-slate-600">{log.action}</TableCell>
                    <TableCell className="text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span>{formatTimestamp(log.createdAt || log.timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        {log.status || 'Completed'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                    No recent activity recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Quick Actions Widget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Quick Actions</h3>
          </div>

          <div className="space-y-3">
            <div
              className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-slate-50 cursor-pointer transition-colors group"
              onClick={() => onNavigateTab('appointments')}
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Appointments Page</h4>
                <p className="text-[11px] text-slate-500">Book, confirm & manage appointments</p>
              </div>
            </div>

            <div
              className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-slate-50 cursor-pointer transition-colors group"
              onClick={() => onNavigateTab('users')}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">User Management</h4>
                <p className="text-[11px] text-slate-500">View users & create new accounts</p>
              </div>
            </div>

            <div
              className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-slate-50 cursor-pointer transition-colors group"
              onClick={() => onNavigateTab('settings')}
            >
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">System Settings</h4>
                <p className="text-[11px] text-slate-500">Configure system parameters</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
