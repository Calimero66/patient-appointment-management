import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  ArrowRightLeft,
  PlusCircle,
  CalendarDays,
  FileText,
  ChevronRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import {
  getAppointmentsApi,
  getNotificationsApi,
  cancelAppointmentApi,
  type Appointment,
  type NotificationItem,
  type User
} from '../../services/api';
import { PatientTransferModal } from './PatientTransferModal';
import { ConfirmationModal } from '../ui/confirmation-modal';

interface PatientDashboardOverviewProps {
  user: User | null;
  onNavigateTab: (tab: any) => void;
}

export function PatientDashboardOverview({ user, onNavigateTab }: PatientDashboardOverviewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedAppointmentForTransfer, setSelectedAppointmentForTransfer] = useState<Appointment | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [appRes, notifRes] = await Promise.all([
        getAppointmentsApi({ limit: 50 }),
        getNotificationsApi({ limit: 10 }),
      ]);

      const appList = Array.isArray(appRes?.data)
        ? appRes.data
        : (appRes?.data as any)?.appointments || [];
      setAppointments(appList);

      const notifData = notifRes?.data;
      if (notifData) {
        setNotifications(notifData.notifications || []);
        setUnreadCount(notifData.unreadCount || 0);
      }
    } catch {
      toast.error('Failed to load patient dashboard information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute metrics
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );
  const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');
  const cancelledAppointments = appointments.filter((a) => a.status === 'CANCELLED');

  // Next Appointment is earliest upcoming appointment
  const nextAppointment = [...upcomingAppointments].sort((a, b) => {
    const dateA = new Date(`${a.appointmentDate || a.date}T${a.startTime || '00:00'}`);
    const dateB = new Date(`${b.appointmentDate || b.date}T${b.startTime || '00:00'}`);
    return dateA.getTime() - dateB.getTime();
  })[0] || null;

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    try {
      await cancelAppointmentApi(appointmentToCancel.id);
      toast.success('Appointment cancelled successfully');
      setIsCancelModalOpen(false);
      setAppointmentToCancel(null);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={13} /> Confirmed</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock size={13} /> Pending</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><CheckCircle2 size={13} /> Completed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><XCircle size={13} /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. HERO WELCOME BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-700/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Verified Patient Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.firstName} {user?.lastName}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Manage your healthcare consultations, discover medical specialists, track appointments, and view clinical notifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('book')}
              className="px-5 py-3 bg-white text-blue-800 hover:bg-blue-50 font-bold rounded-2xl text-xs transition-all shadow-lg hover:shadow-xl cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <PlusCircle size={16} />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="px-4 py-3 bg-blue-600/40 hover:bg-blue-600/60 border border-white/20 text-white font-semibold rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Calendar size={16} />
              <span>My Appointments</span>
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      </div>

      {/* 2. NEXT APPOINTMENT FEATURED CARD */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Next Scheduled Appointment</h2>
              <p className="text-xs text-slate-500">Your upcoming medical consultation</p>
            </div>
          </div>
          {nextAppointment && getStatusBadge(nextAppointment.status)}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading appointment details...</div>
        ) : nextAppointment ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
            <div className="flex items-center gap-4 lg:col-span-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-blue-500/20">
                <Stethoscope size={26} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Assigned Doctor</p>
                <h3 className="text-base font-extrabold text-slate-900 truncate">
                  {nextAppointment.doctorName || (nextAppointment.doctor ? `Dr. ${nextAppointment.doctor.firstName} ${nextAppointment.doctor.lastName}` : 'Assigned Doctor')}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {nextAppointment.appointmentType?.name || 'General Consultation'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:col-span-1 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-200/70 lg:px-6">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Calendar size={14} className="text-blue-600 shrink-0" />
                  <span>{nextAppointment.appointmentDate || nextAppointment.date}</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Time</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Clock size={14} className="text-blue-600 shrink-0" />
                  <span>{nextAppointment.startTime} - {nextAppointment.endTime}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 lg:col-span-1">
              <button
                onClick={() => setSelectedAppointmentForTransfer(nextAppointment)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Request transfer to another doctor"
              >
                <ArrowRightLeft size={14} />
                <span>Request Transfer</span>
              </button>

              <button
                onClick={() => {
                  setAppointmentToCancel(nextAppointment);
                  setIsCancelModalOpen(true);
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Cancel this appointment"
              >
                <XCircle size={14} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Upcoming Appointments</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You do not have any pending or confirmed appointments at this moment. Schedule a consultation anytime.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('book')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              <PlusCircle size={14} />
              <span>Book Appointment</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Upcoming</p>
            <p className="text-2xl font-black text-slate-900">{upcomingAppointments.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Completed</p>
            <p className="text-2xl font-black text-slate-900">{completedAppointments.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Cancelled</p>
            <p className="text-2xl font-black text-slate-900">{cancelledAppointments.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle size={20} />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('notifications')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Notifications</p>
            <p className="text-2xl font-black text-slate-900">{unreadCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Bell size={20} />
          </div>
        </div>
      </div>

      {/* 4. RECENT APPOINTMENTS & NOTIFICATIONS SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Recent Appointments</h3>
            </div>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {appointments.slice(0, 4).map((app) => (
              <div
                key={app.id}
                className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    <Stethoscope size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {app.doctorName || (app.doctor ? `Dr. ${app.doctor.firstName} ${app.doctor.lastName}` : 'Doctor')}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {app.appointmentDate || app.date} at {app.startTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(app.status)}
                </div>
              </div>
            ))}

            {appointments.length === 0 && !isLoading && (
              <p className="text-center text-xs text-slate-400 py-6">No appointments recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Notifications Feed */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bell size={16} />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
            </div>
            <button
              onClick={() => onNavigateTab('notifications')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Inbox</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2.5">
            {notifications.slice(0, 4).map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                  notif.isRead
                    ? 'bg-white border-slate-100 text-slate-600'
                    : 'bg-amber-50/50 border-amber-200/60 text-amber-950 font-medium'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span className="truncate">{notif.title}</span>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] leading-relaxed line-clamp-2 text-slate-500">
                  {notif.message}
                </p>
              </div>
            ))}

            {notifications.length === 0 && !isLoading && (
              <p className="text-center text-xs text-slate-400 py-6">No notifications found.</p>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <PatientTransferModal
        isOpen={!!selectedAppointmentForTransfer}
        onClose={() => setSelectedAppointmentForTransfer(null)}
        appointment={selectedAppointmentForTransfer}
        onTransferSuccess={fetchDashboardData}
      />

      <ConfirmationModal
        isOpen={isCancelModalOpen}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this scheduled appointment? You can rebook at any time."
        confirmText="Yes, Cancel Appointment"
        cancelText="Keep Appointment"
        variant="destructive"
        onConfirm={handleConfirmCancel}
        onClose={() => {
          setIsCancelModalOpen(false);
          setAppointmentToCancel(null);
        }}
      />
    </div>
  );
}
