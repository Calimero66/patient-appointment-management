import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Stethoscope
} from 'lucide-react';
import {
  getAppointmentsApi,
  cancelAppointmentApi,
  type Appointment,
  type User
} from '../../services/api';
import { PatientTransferModal } from './PatientTransferModal';
import { ConfirmationModal } from '../ui/confirmation-modal';

interface PatientAppointmentsViewProps {
  currentUser?: User | null;
  onNavigateTab?: (tab: any) => void;
}

type TabCategory = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export function PatientAppointmentsView({ currentUser, onNavigateTab }: PatientAppointmentsViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeCategory, setActiveCategory] = useState<TabCategory>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedAppointmentForTransfer, setSelectedAppointmentForTransfer] = useState<Appointment | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await getAppointmentsApi({ limit: 100 });
      const list = Array.isArray(res?.data)
        ? res.data
        : (res?.data as any)?.appointments || [];
      setAppointments(list);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    try {
      await cancelAppointmentApi(appointmentToCancel.id);
      toast.success('Appointment cancelled successfully');
      setIsCancelModalOpen(false);
      setAppointmentToCancel(null);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((app) => {
    if (activeCategory === 'UPCOMING') {
      if (app.status !== 'CONFIRMED' && app.status !== 'PENDING') return false;
    } else if (activeCategory === 'COMPLETED') {
      if (app.status !== 'COMPLETED') return false;
    } else if (activeCategory === 'CANCELLED') {
      if (app.status !== 'CANCELLED') return false;
    }

    const q = searchTerm.toLowerCase();
    const docName = (app.doctorName || `${app.doctor?.firstName || ''} ${app.doctor?.lastName || ''}`).toLowerCase();
    const reason = (app.reason || '').toLowerCase();
    const typeName = (app.appointmentType?.name || '').toLowerCase();
    return docName.includes(q) || reason.includes(q) || typeName.includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12} /> Confirmed</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock size={12} /> Pending</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><CheckCircle2 size={12} /> Completed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><XCircle size={12} /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">My Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View upcoming consultations, clinical notes, request doctor transfers, or cancel bookings.
          </p>
        </div>
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('book')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs shrink-0"
          >
            + Book New Appointment
          </button>
        )}
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'ALL', label: 'All Consultations' },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'CANCELLED', label: 'Cancelled' },
            ] as const
          ).map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search by doctor or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* APPOINTMENTS LIST */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
            Loading your appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
            <Calendar size={28} className="text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No appointments found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No appointments matched the selected filter criteria.
            </p>
          </div>
        ) : (
          filteredAppointments.map((app) => {
            const isCancellable = app.status === 'PENDING' || app.status === 'CONFIRMED';
            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      <Stethoscope size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">
                        {app.doctorName || (app.doctor ? `Dr. ${app.doctor.firstName} ${app.doctor.lastName}` : 'Assigned Doctor')}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {app.appointmentType?.name || 'General Consultation'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(app.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Date & Time</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar size={13} className="text-blue-600" />
                      {app.appointmentDate || app.date} at {app.startTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Duration / Price</span>
                    <span className="font-medium text-slate-700 block mt-0.5">
                      {app.appointmentType?.durationMinutes || 30} mins {app.appointmentType?.price ? `• $${app.appointmentType.price}` : ''}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Reason / Notes</span>
                    <span className="font-medium text-slate-600 block mt-0.5 truncate">
                      {app.reason || 'General Consultation'}
                    </span>
                  </div>
                </div>

                {/* Consultation Notes preview if completed */}
                {app.notes && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/80 text-xs text-blue-950">
                    <span className="font-bold text-blue-900 block mb-0.5">Doctor Consultation Summary:</span>
                    <p className="text-blue-800/90 leading-relaxed text-[11px]">{app.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  {isCancellable && (
                    <>
                      <button
                        onClick={() => setSelectedAppointmentForTransfer(app)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowRightLeft size={13} />
                        <span>Request Transfer</span>
                      </button>

                      <button
                        onClick={() => {
                          setAppointmentToCancel(app);
                          setIsCancelModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle size={13} />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODALS */}
      <PatientTransferModal
        isOpen={!!selectedAppointmentForTransfer}
        onClose={() => setSelectedAppointmentForTransfer(null)}
        appointment={selectedAppointmentForTransfer}
        onTransferSuccess={fetchAppointments}
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
