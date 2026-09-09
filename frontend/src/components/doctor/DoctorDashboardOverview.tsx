import { useState, useEffect } from 'react';
import {
  type User,
  type Appointment,
  type Transfer,
  type Establishment,
  getAppointmentsApi,
  getTransfersApi,
  getMyEstablishmentsApi,
  updateAppointmentStatusApi,
  getMyScheduleApi,
  type DoctorSchedule,
} from '../../services/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  User as UserIcon,
  Stethoscope,
  Eye,
  RefreshCw,
  CalendarCheck,
  ChevronRight,
  AlertCircle,
  Check,
  Activity,
  Plus,
  Building2,
  MapPin,
  Phone,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { type DashboardTab } from '../layout/Sidebar';
import toast from 'react-hot-toast';
import { PatientDetailsModal } from './PatientDetailsModal';
import { CompleteAppointmentModal } from './CompleteAppointmentModal';
import { RequestTransferModal } from './RequestTransferModal';

interface DoctorDashboardOverviewProps {
  user: User | null;
  onNavigateTab: (tab: DashboardTab) => void;
}

export function DoctorDashboardOverview({
  user,
  onNavigateTab,
}: DoctorDashboardOverviewProps) {
  const doctorName = user ? `Dr. ${user.firstName} ${user.lastName}`.trim() : 'Doctor';

  // Establishment State
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [isLoadingEst, setIsLoadingEst] = useState(true);

  // Metrics
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [pendingTransfersCount, setPendingTransfersCount] = useState(0);
  const [weeklySchedules, setWeeklySchedules] = useState<DoctorSchedule[]>([]);

  const [isLoading, setIsLoading] = useState(true);

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

  const loadDoctorMetrics = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch appointments for this doctor
      const apptsRes = await getAppointmentsApi({ limit: 100 });
      const allAppts = Array.isArray(apptsRes.data)
        ? apptsRes.data
        : apptsRes.data?.appointments || [];

      // Calculate today's date string in YYYY-MM-DD
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      let todayList: Appointment[] = [];
      let upcoming = 0;
      let completed = 0;
      let cancelled = 0;

      for (const app of allAppts) {
        const appDate = (app.appointmentDate || app.date || '').split('T')[0];

        if (app.status === 'COMPLETED') {
          completed++;
        } else if (app.status === 'CANCELLED') {
          cancelled++;
        }

        if (appDate === todayStr) {
          todayList.push(app);
        } else if (appDate > todayStr && (app.status === 'PENDING' || app.status === 'CONFIRMED')) {
          upcoming++;
        }
      }

      setTodayAppointments(todayList);
      setTodayCount(todayList.length);
      setUpcomingCount(upcoming);
      setCompletedCount(completed);
      setCancelledCount(cancelled);

      // 2. Fetch pending transfers
      try {
        const transfersRes = await getTransfersApi({ status: 'REQUESTED' });
        const list = transfersRes.data?.transfers || [];
        setPendingTransfersCount(list.length);
      } catch {
        setPendingTransfersCount(0);
      }

      // 3. Fetch weekly schedule
      try {
        const scheduleRes = await getMyScheduleApi();
        setWeeklySchedules(scheduleRes.data?.schedules || []);
      } catch {
        setWeeklySchedules([]);
      }
      // 4. Fetch Doctor's Establishment
      try {
        const estRes = await getMyEstablishmentsApi();
        const list = estRes?.data?.establishments || [];
        if (list.length > 0 && list[0].establishment) {
          setEstablishment(list[0].establishment);
        } else if (user?.establishments && user.establishments.length > 0) {
          setEstablishment(user.establishments[0] as any);
        } else {
          setEstablishment(null);
        }
      } catch {
        if (user?.establishments && user.establishments.length > 0) {
          setEstablishment(user.establishments[0] as any);
        } else {
          setEstablishment(null);
        }
      } finally {
        setIsLoadingEst(false);
      }
    } catch (error) {
      console.error('Failed to load doctor dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorMetrics();
  }, []);

  const handleConfirmAppointment = async (appointment: Appointment) => {
    try {
      await updateAppointmentStatusApi(appointment.id, 'CONFIRMED');
      toast.success(`Appointment #${appointment.id.slice(0, 8)} confirmed!`);
      loadDoctorMetrics();
    } catch {
      toast.error('Failed to confirm appointment.');
    }
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#003580]/10 text-[#003580] border border-[#003580]/20 uppercase tracking-wider">
              Doctor Portal
            </span>
            {user?.licenseNumber && (
              <span className="text-xs text-slate-400 font-mono">License: {user.licenseNumber}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Welcome back, <strong className="text-[#003580]">{doctorName}</strong>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your daily consultations, patient records, transfers, and clinic availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('today')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#003580] hover:bg-[#004aad] active:bg-[#002560] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-[#003580]/20"
          >
            <CalendarCheck size={16} />
            <span>Today's Consultations</span>
          </button>
          <button
            onClick={() => onNavigateTab('schedule')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Clock size={16} />
            <span>My Schedule</span>
          </button>
        </div>
      </div>

      {/* ESTABLISHMENT AFFILIATION CARD */}
      {!isLoadingEst && (
        establishment ? (
          <div
            className="text-white rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5"
            style={{
              background: 'linear-gradient(135deg, #001f4d 0%, #002b66 50%, #001838 100%)',
            }}
          >
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
                <Building2 size={24} />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
                    Assigned Medical Facility
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Active Facility
                  </span>
                </div>
                <h2 className="text-lg font-black text-white tracking-tight truncate">
                  {establishment.name}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                  {(establishment.address || establishment.city) && (
                    <span className="flex items-center gap-1 truncate text-slate-300">
                      <MapPin size={13} className="text-blue-400 shrink-0" />
                      <span>
                        {establishment.address}
                        {establishment.address && establishment.city ? ', ' : ''}
                        {establishment.city}
                      </span>
                    </span>
                  )}
                  {establishment.phone && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Phone size={13} className="text-blue-400 shrink-0" />
                      <span>{establishment.phone}</span>
                    </span>
                  )}
                  {establishment.email && (
                    <span className="flex items-center gap-1 text-slate-300 truncate">
                      <Mail size={13} className="text-blue-400 shrink-0" />
                      <span>{establishment.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
              <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-blue-200 border border-white/10">
                {establishment.type || 'Clinic'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4.5 text-amber-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-amber-950">
                    No Establishment Assigned
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 text-amber-900 uppercase tracking-wider">
                    Unassigned
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 leading-relaxed max-w-2xl">
                  You are currently not affiliated with any establishment (hospital/clinic). Please contact a Super Administrator or Clinic Administrator to assign you to a facility so patients can book appointments with you.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-amber-900 border border-amber-300 shadow-2xs">
                <span>Action Required: Contact Admin</span>
              </span>
            </div>
          </div>
        )
      )}

      {/* 5 METRICS CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Today's Appointments */}
        <div
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
          onClick={() => onNavigateTab('today')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isLoading ? '...' : todayCount}</h2>
          <span className="text-[11px] font-semibold text-blue-600">Today's appointments</span>
        </div>

        {/* Upcoming Appointments */}
        <div
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
          onClick={() => onNavigateTab('upcoming')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Upcoming</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isLoading ? '...' : upcomingCount}</h2>
          <span className="text-[11px] font-semibold text-indigo-600">Upcoming appointments</span>
        </div>

        {/* Completed Appointments */}
        <div
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
          onClick={() => onNavigateTab('completed')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isLoading ? '...' : completedCount}</h2>
          <span className="text-[11px] font-semibold text-emerald-600">Completed appointments</span>
        </div>

        {/* Cancelled Appointments */}
        <div
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
          onClick={() => onNavigateTab('cancelled')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cancelled</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <XCircle size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isLoading ? '...' : cancelledCount}</h2>
          <span className="text-[11px] font-semibold text-rose-600">Cancelled appointments</span>
        </div>

        {/* Schedule & Transfers */}
        <div
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all cursor-pointer group col-span-2 md:col-span-1"
          onClick={() => onNavigateTab('transfers')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transfers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowRightLeft size={16} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isLoading ? '...' : pendingTransfersCount}</h2>
          <span className="text-[11px] font-semibold text-purple-600">Transfer requests</span>
        </div>
      </div>

      {/* TODAY'S APPOINTMENTS TABLE & SCHEDULE WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">Today's Appointments</h3>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                {todayAppointments.length}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All Appointments</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2 text-xs font-semibold">
                        <RefreshCw size={16} className="animate-spin text-blue-600" />
                        <span>Loading today's schedule...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : todayAppointments.length > 0 ? (
                  todayAppointments.map((app) => {
                    const patientName = app.patientName || (app.patient ? `${app.patient.firstName} ${app.patient.lastName}` : 'Patient');
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs">
                            <Clock size={13} className="text-slate-400" />
                            <span>{app.startTime || '10:00'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                              {patientName.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 text-xs">{patientName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs max-w-xs truncate" title={app.reason}>
                          {app.reason || 'General Consultation'}
                        </TableCell>
                        <TableCell>
                          {app.status === 'CONFIRMED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} />
                              CONFIRMED
                            </span>
                          )}
                          {app.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={11} />
                              PENDING
                            </span>
                          )}
                          {app.status === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <CheckCircle2 size={11} />
                              COMPLETED
                            </span>
                          )}
                          {app.status === 'CANCELLED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={11} />
                              CANCELLED
                            </span>
                          )}
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
                                onClick={() => handleConfirmAppointment(app)}
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

                            {/* Request Transfer */}
                            {(app.status === 'PENDING' || app.status === 'CONFIRMED') && (
                              <button
                                onClick={() => setTransferModal({ isOpen: true, appointment: app })}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                title="Transfer to Colleague Doctor"
                              >
                                <ArrowRightLeft size={15} />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No appointments scheduled for today.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Doctor Working Hours & Quick Availability Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Weekly Working Hours</h3>
              </div>
              <button
                onClick={() => onNavigateTab('schedule')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {weeklySchedules.length > 0 ? (
                weeklySchedules.map((sch) => (
                  <div
                    key={sch.dayOfWeek}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="font-bold text-slate-700 w-10">{DAYS[sch.dayOfWeek]}</span>
                    {sch.isActive ? (
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {sch.startTime} - {sch.endTime}
                      </span>
                    ) : (
                      <span className="font-medium text-slate-400 italic">Day Off</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 py-4 text-center">
                  <p>Mon - Fri: 09:00 - 17:00</p>
                  <p>Sat - Sun: Off</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => onNavigateTab('schedule')}
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-indigo-200 flex items-center justify-center gap-2"
            >
              <Clock size={15} />
              <span>Configure Schedule & Time-Off</span>
            </button>
            <button
              onClick={() => onNavigateTab('transfers')}
              className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-purple-200 flex items-center justify-center gap-2"
            >
              <ArrowRightLeft size={15} />
              <span>Appointment Transfers Hub</span>
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
        onSuccess={loadDoctorMetrics}
      />

      {/* Request Transfer Modal */}
      <RequestTransferModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal({ isOpen: false, appointment: null })}
        appointment={transferModal.appointment}
        currentDoctorId={user?.id}
        onSuccess={loadDoctorMetrics}
      />
    </div>
  );
}
