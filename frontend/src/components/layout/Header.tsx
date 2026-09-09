import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Bell,
  CheckCheck,
  CheckCircle2,
  Calendar,
  ArrowRightLeft,
  XCircle,
  X,
  RefreshCw
} from 'lucide-react';
import {
  getNotificationsApi,
  getUnreadNotificationsCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  type NotificationItem
} from '../../services/api';

interface HeaderProps {
  isOnline: boolean;
}

export function Header({ isOnline }: HeaderProps) {
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterRead, setFilterRead] = useState<'ALL' | 'UNREAD'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Fetch unread count periodically
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await getUnreadNotificationsCountApi();
      if (res?.data?.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Ignore
    }
  };

  // 2. Fetch notifications list
  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const isRead = filterRead === 'UNREAD' ? false : undefined;
      const res = await getNotificationsApi({ isRead, limit: 50 });
      if (res?.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isDropdownOpen) {
      fetchNotifications();
    }
  }, [isDropdownOpen, filterRead]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle Mark Single Notification Read
  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  // Handle Mark All Read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      toast.success('All notifications marked as read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotifIcon = (type: string) => {
    const upperType = type?.toUpperCase() || '';
    if (upperType.includes('CONFIRM') || upperType.includes('COMPLET')) {
      return <CheckCircle2 size={15} className="text-emerald-600" />;
    }
    if (upperType.includes('CANCEL') || upperType.includes('REJECT')) {
      return <XCircle size={15} className="text-rose-600" />;
    }
    if (upperType.includes('TRANSFER')) {
      return <ArrowRightLeft size={15} className="text-amber-600" />;
    }
    if (upperType.includes('APPOINTMENT')) {
      return <Calendar size={15} className="text-blue-600" />;
    }
    return <Bell size={15} className="text-blue-600" />;
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-8">
      <div className="relative w-80">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search users, clinics, appointments..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#003580] focus:ring-4 focus:ring-[#003580]/10 focus:bg-white transition-all font-medium"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`relative p-2 rounded-full transition-colors cursor-pointer ${
              isDropdownOpen
                ? 'bg-blue-50 text-[#003580]'
                : 'text-slate-500 hover:text-[#003580] hover:bg-slate-100'
            }`}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-xs animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION POPOVER DROPDOWN */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-11 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Dropdown Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#001f4d] to-[#003580] text-white">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-[#1a6e3c] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-blue-200 hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck size={13} />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-1 text-white/70 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setFilterRead('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterRead === 'ALL'
                      ? 'bg-[#003580] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterRead('UNREAD')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterRead === 'UNREAD'
                      ? 'bg-[#003580] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        filterRead === 'UNREAD'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {isLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-blue-600" />
                    <span>Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Bell size={18} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">No notifications found</p>
                    <p className="text-[11px] text-slate-400">
                      {filterRead === 'UNREAD' ? 'You have no unread notifications.' : "You're all caught up! ✨"}
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      className={`p-3.5 flex items-start justify-between gap-3 transition-colors cursor-pointer text-left ${
                        n.isRead
                          ? 'bg-white hover:bg-slate-50/80'
                          : 'bg-blue-50/40 hover:bg-blue-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4
                              className={`text-xs truncate ${
                                n.isRead ? 'font-semibold text-slate-800' : 'font-extrabold text-blue-950'
                              }`}
                            >
                              {n.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                            {n.message}
                          </p>
                          <span className="inline-block text-[10px] text-slate-400 font-medium">
                            {formatTimestamp(n.createdAt)}
                          </span>
                        </div>
                      </div>

                      {!n.isRead && (
                        <div
                          className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5"
                          title="Unread"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200"></div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          <span>{isOnline ? 'System Online' : 'System Standby'}</span>
        </div>
      </div>
    </header>
  );
}
