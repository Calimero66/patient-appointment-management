import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getAppointmentsApi,
  updateAppointmentStatusApi,
  cancelAppointmentApi,
  type Appointment,
  type AppointmentStatus,
  type User,
} from '../../services/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';
import { ConfirmationModal } from '../ui/confirmation-modal';
import {
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  User as UserIcon,
  Stethoscope,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { PatientDetailsModal } from './PatientDetailsModal';
import { CompleteAppointmentModal } from './CompleteAppointmentModal';
import { RequestTransferModal } from './RequestTransferModal';

type FilterTab = 'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

interface DoctorAppointmentsViewProps {
  currentUser: User | null;
  defaultTab?: FilterTab;
}

export function DoctorAppointmentsView({ currentUser, defaultTab = 'ALL' }: DoctorAppointmentsViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<FilterTab>(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedPatientModal, setSelectedPatientModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });

  const [completeModal, setCompleteModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });

  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });

  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
    isLoading: boolean;
  }>({ isOpen: false, appointment: null, isLoading: false });

  const fetchAppointments = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      let statusQuery: string | undefined = undefined;

      if (activeTab === 'COMPLETED') {
        statusQuery = 'COMPLETED';
      } else if (activeTab === 'CANCELLED') {
        statusQuery = 'CANCELLED';
      }

      // Fetch appointments
      const res = await getAppointmentsApi({
        status: statusQuery,
        limit: 200,
      });

      if (res?.data) {
        let list: Appointment[] = Array.isArray(res.data) ? res.data : res.data.appointments || [];

        // Apply tab specific filters
        if (activeTab === 'TODAY') {
          list = list.filter((app) => {
            const appDate = (app.appointmentDate || app.date || '').split('T')[0];
            return appDate === todayStr;
          });
        } else if (activeTab === 'UPCOMING') {
          list = list.filter((app) => {
            const appDate = (app.appointmentDate || app.date || '').split('T')[0];
            return appDate >= todayStr && (app.status === 'PENDING' || app.status === 'CONFIRMED');
          });
        } else if (activeTab === 'COMPLETED') {
          list = list.filter((app) => app.status === 'COMPLETED');
        } else if (activeTab === 'CANCELLED') {
          list = list.filter((app) => app.status === 'CANCELLED');
        }

        // Apply search query filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          list = list.filter((app) => {
            const patientName = `${app.patient?.firstName || ''} ${app.patient?.lastName || ''}`.toLowerCase();
            const reason = (app.reason || '').toLowerCase();
            const id = (app.id || '').toLowerCase();
            return patientName.includes(q) || reason.includes(q) || id.includes(q);
          });
        }

        setAppointments(list);
        setTotalCount(list.length);
      } else {
        setAppointments([]);
        setTotalCount(0);
      }
    } catch (err: unknown) {
      setAppointments([]);
      setTotalCount(0);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setApiError(axiosErr.response?.data?.message || 'Failed to fetch doctor appointments.');
      } else {
        setApiError('Unable to connect to backend server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, searchTerm, currentPage, pageSize]);

  const handleConfirm = async (appointment: Appointment) => {
    try {
      await updateAppointmentStatusApi(appointment.id, 'CONFIRMED');
      toast.success(`Appointment #${appointment.id.slice(0, 8)} confirmed!`);
      fetchAppointments();
    } catch {
      toast.error('Failed to confirm appointment.');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.appointment) return;
    setCancelModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await cancelAppointmentApi(cancelModal.appointment.id);
      toast.success(`Appointment #${cancelModal.appointment.id.slice(0, 8)} cancelled.`);
      fetchAppointments();
    } catch {
      toast.error('Failed to cancel appointment.');
    } finally {
      setCancelModal({ isOpen: false, appointment: null, isLoading: false });
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} />
            CONFIRMED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 size={12} />
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} />
            CANCELLED
          </span>
        );
      case 'TRANSFERRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ArrowRightLeft size={12} />
            TRANSFERRED
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            PENDING
          </span>
        );
    }
  };

  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      const datePart = d.toLocaleDateString([], { dateStyle: 'medium' });
      return `${datePart} at ${timeStr || '10:00'}`;
    } catch {
      return dateStr;
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'TODAY':
        return {
          title: "Today's Appointments",
          desc: 'Consultations and patient visits scheduled for today.',
        };
      case 'UPCOMING':
        return {
          title: 'Upcoming Appointments',
          desc: 'Future scheduled patient visits and upcoming consultations.',
        };
      case 'COMPLETED':
        return {
          title: 'Completed Appointments',
          desc: 'Past treated consultations, prescriptions, and clinical notes.',
        };
      case 'CANCELLED':
        return {
          title: 'Cancelled Appointments',
          desc: 'Log of cancelled patient consultations.',
        };
      case 'ALL':
      default:
        return {
          title: 'All Appointments',
          desc: 'Review your patient consults, confirm schedules, record notes, and manage transfers.',
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const paginatedAppointments = appointments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {headerInfo.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {headerInfo.desc}
          </p>
        </div>

        <button
          onClick={fetchAppointments}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* CATEGORY FILTER TABS ROW */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'ALL' as FilterTab, label: 'All Consultations' },
          { id: 'TODAY' as FilterTab, label: "Today's Appointments" },
          { id: 'UPCOMING' as FilterTab, label: 'Upcoming' },
          { id: 'COMPLETED' as FilterTab, label: 'Completed' },
          { id: 'CANCELLED' as FilterTab, label: 'Cancelled' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, reason, or appointment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900">{appointments.length}</strong> matching appointments
        </div>
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* APPOINTMENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hash ID</TableHead>
              <TableHead>Patient Details</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Reason for Visit</TableHead>
              <TableHead>Doctor Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold">
                    <RefreshCw size={16} className="animate-spin text-blue-600" />
                    <span>Loading your appointments...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedAppointments.length > 0 ? (
              paginatedAppointments.map((app) => {
                const patientName = app.patientName || (app.patient ? `${app.patient.firstName} ${app.patient.lastName}` : 'Patient');
                const dateStr = app.appointmentDate || app.date;

                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-slate-500 font-semibold text-xs">
                      #{app.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {patientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{patientName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{app.patient?.email || app.patient?.phone || 'No contact'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium text-xs whitespace-nowrap">
                      {formatDateTime(dateStr, app.startTime)}
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs max-w-xs truncate" title={app.reason}>
                      {app.reason || 'General Consultation'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs max-w-xs truncate" title={app.notes || ''}>
                      {app.notes ? (
                        <span className="text-slate-800 font-medium">{app.notes}</span>
                      ) : (
                        <span className="italic text-slate-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(app.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Patient Details */}
                        <button
                          onClick={() => setSelectedPatientModal({ isOpen: true, appointment: app })}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Patient Info"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Confirm (if PENDING) */}
                        {app.status === 'PENDING' && (
                          <button
                            onClick={() => handleConfirm(app)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Confirm Appointment"
                          >
                            <Check size={15} />
                          </button>
                        )}

                        {/* Complete Consultation (if CONFIRMED or PENDING) */}
                        {(app.status === 'CONFIRMED' || app.status === 'PENDING') && (
                          <button
                            onClick={() => setCompleteModal({ isOpen: true, appointment: app })}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Complete Consultation (Add Notes)"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}

                        {/* Request Transfer to colleague */}
                        {(app.status === 'PENDING' || app.status === 'CONFIRMED') && (
                          <button
                            onClick={() => setTransferModal({ isOpen: true, appointment: app })}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Transfer Appointment to Colleague"
                          >
                            <ArrowRightLeft size={15} />
                          </button>
                        )}

                        {/* Cancel */}
                        {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                          <button
                            onClick={() => setCancelModal({ isOpen: true, appointment: app, isLoading: false })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Cancel Appointment"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  No appointments found for the selected tab.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* PAGINATION FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-slate-900">{startItem}</strong> to <strong className="text-slate-900">{endItem}</strong> of <strong className="text-slate-900">{totalCount}</strong> consultations</span>
            <span className="text-slate-300">|</span>
            <label className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold cursor-pointer transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, currentPage - 3),
                Math.min(totalPages, currentPage + 2)
              ).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        isOpen={selectedPatientModal.isOpen}
        onClose={() => setSelectedPatientModal({ isOpen: false, appointment: null })}
        appointment={selectedPatientModal.appointment}
        patient={selectedPatientModal.appointment?.patient}
      />

      {/* Complete Appointment Modal */}
      <CompleteAppointmentModal
        isOpen={completeModal.isOpen}
        onClose={() => setCompleteModal({ isOpen: false, appointment: null })}
        appointment={completeModal.appointment}
        onSuccess={fetchAppointments}
      />

      {/* Request Transfer Modal */}
      <RequestTransferModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal({ isOpen: false, appointment: null })}
        appointment={transferModal.appointment}
        currentDoctorId={currentUser?.id}
        onSuccess={fetchAppointments}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={cancelModal.isOpen}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel appointment #${cancelModal.appointment?.id.slice(0, 8)}?`}
        confirmText="Cancel Appointment"
        cancelText="Keep Appointment"
        variant="destructive"
        isLoading={cancelModal.isLoading}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelModal({ isOpen: false, appointment: null, isLoading: false })}
      />
    </div>
  );
}
