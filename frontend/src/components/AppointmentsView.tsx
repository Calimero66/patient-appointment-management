import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getAppointmentsApi,
  getAppointmentByIdApi,
  createAppointmentApi,
  updateAppointmentStatusApi,
  updateAppointmentApi,
  cancelAppointmentApi,
  getDoctorsApi,
  type Appointment,
  type AppointmentStatus,
  type CreateAppointmentData,
  type User as UserType
} from '../services/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table';
import { DatePickerTime } from './ui/date-picker-time';
import { ConfirmationModal } from './ui/confirmation-modal';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
  Edit3,
  Eye,
  RefreshCw,
  User,
  Stethoscope,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function AppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Confirmation Modal state for Cancelling Appointment
  const [cancelConfirmModal, setCancelConfirmModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    appointment: null,
    isLoading: false
  });

  // Doctors selection state
  const [doctorsList, setDoctorsList] = useState<UserType[]>([]);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // DatePickerTime state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('10:30:00');

  // Form states
  const [createForm, setCreateForm] = useState<CreateAppointmentData>({
    doctorId: '',
    appointmentDate: '',
    reason: ''
  });
  const [editReason, setEditReason] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const res = await getAppointmentsApi({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined,
        page: currentPage,
        limit: pageSize
      });

      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.appointments || [];
        setAppointments(list);
        setTotalCount(res.data && !Array.isArray(res.data) ? res.data.meta?.totalCount || list.length : list.length);
      } else {
        setAppointments([]);
        setTotalCount(0);
      }
    } catch (err: unknown) {
      setAppointments([]);
      setTotalCount(0);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setApiError(axiosErr.response?.data?.message || 'Failed to fetch appointments from server.');
      } else {
        setApiError('Unable to connect to backend server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch doctors list
  const fetchDoctors = async (search?: string) => {
    setIsLoadingDoctors(true);
    try {
      const res = await getDoctorsApi({ search: search?.trim() || undefined });
      if (res?.data) {
        const docs = Array.isArray(res.data) ? res.data : res.data.doctors || res.data.users || [];
        setDoctorsList(docs);
      } else {
        setDoctorsList([]);
      }
    } catch {
      setDoctorsList([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  // Sync selectedDate + selectedTime with createForm (appointmentDate: YYYY-MM-DD, startTime: HH:mm, endTime: HH:mm)
  useEffect(() => {
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const dateOnly = `${yyyy}-${mm}-${dd}`;
      const startHhMm = selectedTime.length >= 5 ? selectedTime.slice(0, 5) : '14:30';

      const [h, m] = startHhMm.split(':').map(Number);
      const totalMins = (h || 14) * 60 + (m || 0) + 30;
      const endH = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
      const endM = String(totalMins % 60).padStart(2, '0');
      const endHhMm = `${endH}:${endM}`;

      setCreateForm((prev) => ({
        ...prev,
        appointmentDate: dateOnly,
        date: dateOnly,
        startTime: startHhMm,
        start_time: startHhMm,
        endTime: endHhMm,
        end_time: endHhMm
      }));
    }
  }, [selectedDate, selectedTime]);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, currentPage, pageSize]);

  // Fetch doctors whenever create modal is opened or doctor search changes
  useEffect(() => {
    if (isCreateModalOpen) {
      const timer = setTimeout(() => {
        fetchDoctors(doctorSearchTerm);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCreateModalOpen, doctorSearchTerm]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Handle Create Appointment
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetDoctorId = selectedDoctorId || createForm.doctorId;
    if (!targetDoctorId) {
      toast.error('Please choose a Doctor from the dropdown list.');
      return;
    }

    if (!createForm.reason || !createForm.reason.trim()) {
      toast.error('Please describe the reason for your visit.');
      return;
    }

    const dateToUse = selectedDate || new Date();
    const yyyy = dateToUse.getFullYear();
    const mm = String(dateToUse.getMonth() + 1).padStart(2, '0');
    const dd = String(dateToUse.getDate()).padStart(2, '0');
    const dateOnly = `${yyyy}-${mm}-${dd}`;
    const startHhMm = selectedTime.length >= 5 ? selectedTime.slice(0, 5) : '14:30';

    const [h, m] = startHhMm.split(':').map(Number);
    const totalMins = (h || 14) * 60 + (m || 0) + 30;
    const endH = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
    const endM = String(totalMins % 60).padStart(2, '0');
    const endHhMm = `${endH}:${endM}`;

    setFormSubmitting(true);

    try {
      await createAppointmentApi({
        doctorId: targetDoctorId,
        doctorEmail: createForm.doctorEmail,
        appointmentDate: dateOnly,
        date: dateOnly,
        startTime: startHhMm,
        start_time: startHhMm,
        endTime: endHhMm,
        end_time: endHhMm,
        reason: createForm.reason.trim()
      });
      setFormSubmitting(false);
      toast.success('Appointment booked successfully!');

      setCreateForm({ doctorId: '', appointmentDate: '', reason: '' });
      setSelectedDoctorId('');
      setSelectedDate(undefined);
      fetchAppointments();
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      setFormSubmitting(false);
      let errorMsg = 'Failed to create appointment.';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response?: { data?: any } }).response?.data;
        if (typeof resData === 'string') {
          errorMsg = resData;
        } else if (resData?.message) {
          errorMsg = Array.isArray(resData.message) ? resData.message.join(', ') : resData.message;
        } else if (resData?.error) {
          errorMsg = typeof resData.error === 'string' ? resData.error : JSON.stringify(resData.error);
        }
      }
      toast.error(errorMsg);
    }
  };

  // Handle Doctor Selection Change
  const handleDoctorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = e.target.value;
    setSelectedDoctorId(docId);
    const selectedDoc = doctorsList.find((d) => d.id === docId);

    setCreateForm((prev) => ({
      ...prev,
      doctorId: docId,
      doctorEmail: selectedDoc ? selectedDoc.email : undefined
    }));
  };

  // Handle Doctor Confirmation
  const handleConfirmStatus = async (appointment: Appointment) => {
    try {
      await updateAppointmentStatusApi(appointment.id, 'CONFIRMED');
      toast.success(`Appointment #${appointment.id.slice(0, 8)} confirmed!`);
      fetchAppointments();
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to confirm appointment status.'
        : 'Failed to connect to server.';
      toast.error(msg);
    }
  };

  // Open Confirmation Modal for Cancel Appointment
  const handleOpenCancelConfirm = (appointment: Appointment) => {
    setCancelConfirmModal({
      isOpen: true,
      appointment,
      isLoading: false
    });
  };

  // Execute Cancel Appointment
  const handleConfirmCancelAppointment = async () => {
    if (!cancelConfirmModal.appointment) return;
    const app = cancelConfirmModal.appointment;

    setCancelConfirmModal((prev) => ({ ...prev, isLoading: true }));

    try {
      await cancelAppointmentApi(app.id);
      toast.success(`Appointment #${app.id.slice(0, 8)} cancelled successfully!`);
      fetchAppointments();
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to cancel appointment.'
        : 'Failed to connect to server.';
      toast.error(msg);
    } finally {
      setCancelConfirmModal({ isOpen: false, appointment: null, isLoading: false });
    }
  };

  // Handle Update Reason
  const handleOpenEditReason = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditReason(appointment.reason || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateReasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setFormSubmitting(true);

    try {
      await updateAppointmentApi(selectedAppointment.id, { reason: editReason });
      setFormSubmitting(false);
      toast.success('Appointment reason updated successfully!');
      setIsEditModalOpen(false);
      fetchAppointments();
    } catch (err: unknown) {
      setFormSubmitting(false);
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update appointment reason.'
        : 'Failed to connect to server.';
      toast.error(msg);
    }
  };

  // Handle View Details Modal
  const handleViewDetails = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);

    try {
      const res = await getAppointmentByIdApi(appointment.id);
      if (res?.data) {
        const item = 'appointment' in res.data ? res.data.appointment : res.data;
        setSelectedAppointment(item as Appointment);
      }
    } catch {
      // Use existing item
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

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Appointments Management {totalCount > 0 && <span className="text-xs font-normal text-slate-500">({totalCount} total)</span>}
          </h1>
          <p className="text-sm text-slate-500 mt-1">View, book, confirm, and update patient appointment records</p>
        </div>

        <button
          onClick={() => {
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm shrink-0"
        >
          <Plus size={16} />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient, doctor, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button
            onClick={fetchAppointments}
            className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            title="Refresh appointments"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* SHADCN UI TABLE FOR APPOINTMENTS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hash ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Reason</TableHead>
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
                    <span>Loading appointments...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : appointments.length > 0 ? (
              appointments.map((app) => {
                const patientName = app.patientName || (app.patient ? `${app.patient.firstName} ${app.patient.lastName}` : 'Patient');
                const doctorName = app.doctorName || (app.doctor ? `${app.doctor.firstName} ${app.doctor.lastName}` : 'Doctor');
                const dateStr = app.appointmentDate || app.date;

                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-slate-500 font-semibold">
                      #{app.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-900">{patientName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Stethoscope size={14} className="text-blue-500 shrink-0" />
                        <span className="text-slate-700 font-medium">{doctorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatDateTime(dateStr)}
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-xs truncate" title={app.reason}>
                      {app.reason || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(app.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => handleViewDetails(app)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Doctor Confirm */}
                        {app.status === 'PENDING' && (
                          <button
                            onClick={() => handleConfirmStatus(app)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Confirm Appointment"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}

                        {/* Edit Reason */}
                        <button
                          onClick={() => handleOpenEditReason(app)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Update Reason"
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* Cancel Appointment */}
                        {app.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleOpenCancelConfirm(app)}
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
                  No appointments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* PAGINATION FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-slate-900">{startItem}</strong> to <strong className="text-slate-900">{endItem}</strong> of <strong className="text-slate-900">{totalCount}</strong> appointments</span>
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

      {/* CREATE APPOINTMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Book Appointment</h3>
              </div>
              <button className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer transition-colors" onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Doctor Search & Select Option */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Select Doctor *</label>
                
                {/* Doctor Search Input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search doctor by name (e.g. Gregory, Antoine)..."
                    value={doctorSearchTerm}
                    onChange={(e) => setDoctorSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  />
                  {isLoadingDoctors && (
                    <RefreshCw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 animate-spin" />
                  )}
                </div>

                {/* Doctor Dropdown Select */}
                <select
                  value={selectedDoctorId}
                  onChange={handleDoctorSelect}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-semibold"
                  required
                >
                  <option value="">-- Choose a Doctor --</option>
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.firstName} {doc.lastName} ({doc.email}){doc.licenseNumber ? ` - ${doc.licenseNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE PICKER TIME COMPONENT */}
              <DatePickerTime
                date={selectedDate}
                time={selectedTime}
                onDateChange={setSelectedDate}
                onTimeChange={setSelectedTime}
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Reason for Visit *</label>
                <textarea
                  rows={3}
                  placeholder="Describe symptoms or reason for visit..."
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-70"
                >
                  {formSubmitting ? 'Submitting...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REASON MODAL */}
      {isEditModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">Update Reason</h3>
              </div>
              <button className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateReasonSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Reason / Notes</label>
                <textarea
                  rows={4}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs cursor-pointer"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs cursor-pointer disabled:opacity-70"
                >
                  {formSubmitting ? 'Saving...' : 'Save Reason'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {isDetailsModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Appointment Details</h3>
              </div>
              <button className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer" onClick={() => setIsDetailsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono">
                <p className="text-slate-500 font-semibold">Hash ID: <span className="text-slate-900">{selectedAppointment.id}</span></p>
                <p className="text-slate-500 font-semibold">Status: {getStatusBadge(selectedAppointment.status)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Patient</p>
                  <p className="font-bold text-slate-900">{selectedAppointment.patientName || selectedAppointment.patient?.firstName || 'Patient'}</p>
                  <p className="text-slate-500 text-[11px]">{selectedAppointment.patient?.email}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Doctor</p>
                  <p className="font-bold text-slate-900">{selectedAppointment.doctorName || selectedAppointment.doctor?.firstName || 'Doctor'}</p>
                  <p className="text-slate-500 text-[11px]">{selectedAppointment.doctor?.email}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Scheduled Date & Time</p>
                <p className="font-bold text-slate-900">{formatDateTime(selectedAppointment.appointmentDate || selectedAppointment.date)}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Reason for Visit</p>
                <p className="text-slate-800 font-medium">{selectedAppointment.reason || 'No reason specified'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-xs cursor-pointer"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLED CONFIRMATION MODAL FOR CANCEL APPOINTMENT */}
      <ConfirmationModal
        isOpen={cancelConfirmModal.isOpen}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel appointment #${cancelConfirmModal.appointment?.id.slice(0, 8)}? This action will set the status to CANCELLED.`}
        confirmText="Cancel Appointment"
        cancelText="Keep Appointment"
        variant="destructive"
        isLoading={cancelConfirmModal.isLoading}
        onConfirm={handleConfirmCancelAppointment}
        onClose={() => setCancelConfirmModal({ isOpen: false, appointment: null, isLoading: false })}
      />
    </div>
  );
}
