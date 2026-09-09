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
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  }

  return (
    <>
      <aside
        className="w-64 flex flex-col h-screen fixed top-0 left-0 z-40 p-5 justify-between border-r border-white/10 text-slate-100 shadow-xl"
        style={{
          background: 'linear-gradient(180deg, #001f4d 0%, #002b66 50%, #001838 100%)',
        }}
      >
        <div className="space-y-5">
          {/* Official Ministry Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-11 h-11 rounded-2xl bg-white p-1.5 shadow-lg shadow-black/20 flex items-center justify-center shrink-0 border border-white/20">
              <img
                src="/Ministere_de_la_Sante.png"
                alt="Ministère de la Santé"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-blue-200/70 tracking-widest uppercase truncate">
                Royaume du Maroc
              </p>
              <h2 className="text-xs font-black text-white leading-tight truncate">
                Ministère de la Santé
              </h2>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-block text-[9px] font-bold bg-[#1a6e3c]/40 text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-500/30 uppercase tracking-wider">
                  {user?.role || 'SUPER_ADMIN'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none focus:outline-none focus-visible:outline-none focus:ring-0 transition-colors duration-150 cursor-pointer text-left select-none active:scale-[0.98] ${
                    isActive
                      ? 'bg-blue-600/90 text-white shadow-sm shadow-black/20 border border-white/15 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.08] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={17}
                      className={isActive ? 'text-white' : 'text-blue-200/60'}
                    />
                    <span className="tracking-wide">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003580] to-[#1a6e3c] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md border border-white/20">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-blue-200/60 truncate font-medium">{user?.email}</p>
            </div>
          </div>

          <button
            className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-rose-400 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-white/10"
            onClick={() => setIsLogoutModalOpen(true)}
            title="Sign Out"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
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
