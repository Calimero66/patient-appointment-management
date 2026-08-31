import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationModal } from '../ui/confirmation-modal';
import { getUnreadNotificationsCountApi } from '../../services/api';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Activity,
  ArrowRightLeft,
  CalendarDays,
  Search,
  Bell,
  Building2,
  Stethoscope
} from 'lucide-react';

export type DashboardTab =
  | 'overview'
  | 'book'
  | 'today'
  | 'upcoming'
  | 'completed'
  | 'cancelled'
  | 'schedule'
  | 'transfers'
  | 'notifications'
  | 'users'
  | 'doctors'
  | 'establishments'
  | 'establishment'
  | 'appointments'
  | 'patients'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
}

export function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  const { user, logout } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const displayName = user
    ? user.role === 'DOCTOR'
      ? `Dr. ${user.firstName} ${user.lastName}`.trim()
      : `${user.firstName} ${user.lastName}`.trim()
    : 'Administrator';
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function fetchUnread() {
      try {
        const res = await getUnreadNotificationsCountApi();
        if (res?.data?.unreadCount !== undefined) {
          setUnreadNotifications(res.data.unreadCount);
        }
      } catch {
        // Silently ignore
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  const handleConfirmLogout = async () => {
    try {
      await logout();
      toast('You have logged out.');
    } catch {
      toast('You have logged out.');
    }
  };

  // Build nav items dynamically based on user role
  let navItems: Array<{ id: DashboardTab; label: string; icon: any; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'establishments', label: 'Establishments', icon: Building2 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (user?.role === 'ESTABLISHMENT_ADMIN') {
    navItems = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'doctors', label: 'Clinic Doctors', icon: Stethoscope },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'establishment', label: 'Clinic Profile', icon: Building2 },
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  } else if (user?.role === 'DOCTOR') {
    navItems = [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'schedule', label: 'Schedule', icon: CalendarDays },
      { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    ];
  } else if (user?.role === 'PATIENT') {
    navItems = [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'book', label: 'Find Doctor & Book', icon: Search },
      { id: 'appointments', label: 'My Appointments', icon: Calendar },
      { id: 'transfers', label: 'My Transfers', icon: ArrowRightLeft },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  }

  return (
    <>
      <aside className="w-64 bg-slate-950 text-slate-100 flex flex-col h-screen fixed top-0 left-0 z-40 p-6 justify-between border-r border-slate-900">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
            <Activity className="text-blue-500 shrink-0" size={26} />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white leading-snug">{displayName}</h2>
              <span className="inline-block text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded font-semibold tracking-wider uppercase">
                {user?.role || 'SUPER_ADMIN'}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="truncate min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role || 'Super Admin'}</p>
            </div>
          </div>

          <button
            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 hover:bg-rose-950 hover:text-rose-400 text-rose-500 rounded-xl font-semibold text-xs transition-colors cursor-pointer border border-slate-800"
            onClick={() => setIsLogoutModalOpen(true)}
            title="Sign Out"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* STYLED CONFIRMATION MODAL FOR LOGOUT */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="Sign Out"
        message="Are you sure you want to log out of your session?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmLogout}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
}
