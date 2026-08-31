import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCircle2,
  Calendar,
  ArrowRightLeft,
  XCircle,
  CheckCheck
} from 'lucide-react';
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  type NotificationItem,
  type User
} from '../../services/api';

interface PatientNotificationsViewProps {
  currentUser?: User | null;
}

export function PatientNotificationsView({ currentUser }: PatientNotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterRead, setFilterRead] = useState<'ALL' | 'UNREAD'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const isRead = filterRead === 'UNREAD' ? false : undefined;
      const res = await getNotificationsApi({ isRead, limit: 100 });
      if (res?.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filterRead]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationReadApi(id);
      loadNotifications();
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      toast.success('All notifications marked as read');
      loadNotifications();
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'CONFIRMATION':
        return <CheckCircle2 size={16} className="text-emerald-600" />;
      case 'APPOINTMENT':
        return <Calendar size={16} className="text-blue-600" />;
      case 'COMPLETION':
        return <CheckCircle2 size={16} className="text-blue-600" />;
      case 'CANCELLATION':
        return <XCircle size={16} className="text-rose-600" />;
      case 'TRANSFER':
        return <ArrowRightLeft size={16} className="text-amber-600" />;
      default:
        return <Bell size={16} className="text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time updates regarding appointment confirmations, cancellations, and doctor transfers.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <CheckCheck size={14} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setFilterRead('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filterRead === 'ALL'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setFilterRead('UNREAD')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterRead === 'UNREAD'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
            <Bell size={28} className="text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No notifications</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are all caught up!
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-white border-slate-200/80 hover:bg-slate-50/50'
                  : 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/70 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getNotifIcon(n.type)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs text-slate-900 truncate ${n.isRead ? 'font-semibold' : 'font-extrabold text-blue-950'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {n.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
