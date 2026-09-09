import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Stethoscope,
  Calendar,
  Clock,
  UserPlus,
  Users,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Plus,
  X,
  Eye
} from 'lucide-react';
import {
  getMyEstablishmentsApi,
  getEstablishmentByIdApi,
  getEstablishmentUsersApi,
  getAppointmentsApi,
  createUserApi,
  type Establishment,
  type EstablishmentUser,
  type Appointment,
  type User
} from '../../services/api';

interface EstablishmentAdminDashboardOverviewProps {
  user?: User | null;
  onNavigateTab?: (tab: any) => void;
}

export function EstablishmentAdminDashboardOverview({ user, onNavigateTab }: EstablishmentAdminDashboardOverviewProps) {
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [doctors, setDoctors] = useState<EstablishmentUser[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);

  // New Doctor Form State
  const [newDoctorForm, setNewDoctorForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
    bio: '',
  });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Get managed establishment
      const myEstRes = await getMyEstablishmentsApi();
      const adminLinks = myEstRes?.data?.establishments || [];
      const primaryLink = adminLinks.find((e) => e.role === 'ADMIN') || adminLinks[0];

      let targetEstId = primaryLink?.establishment?.id || (primaryLink as any)?.establishmentId;

      // Fallback to user.establishments prop if primaryLink not yet available
      if (!targetEstId && user?.establishments && user.establishments.length > 0) {
        targetEstId = user.establishments[0].id;
      }

      if (targetEstId) {
        let estObj = primaryLink?.establishment;

        // If establishment address or phone is missing, fetch full details
        if (!estObj || !estObj.address) {
          try {
            const fullEstRes = await getEstablishmentByIdApi(targetEstId);
            if (fullEstRes?.data && 'establishment' in fullEstRes.data) {
              estObj = (fullEstRes.data as any).establishment;
            }
          } catch {
            // Ignore fallback error
          }
        }

        if (estObj) {
          setEstablishment(estObj);
        }

        // 2. Fetch doctors in this establishment
        const usersRes = await getEstablishmentUsersApi(targetEstId);
        if (usersRes?.data?.users) {
          const docUsers = usersRes.data.users.filter((u) => u.role === 'DOCTOR');
          setDoctors(docUsers);
        }

        // 3. Fetch appointments in this establishment
        const appRes = await getAppointmentsApi({ establishmentId: targetEstId, limit: 20 });
        const appList = Array.isArray(appRes?.data)
          ? appRes.data
          : (appRes?.data as any)?.appointments || [];
        setAppointments(appList);
      }
    } catch {
      toast.error('Failed to load establishment dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleOpenAddDoctorModal = () => {
    setNewDoctorForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      licenseNumber: '',
      bio: '',
    });
    setIsAddDoctorModalOpen(true);
  };

  const handleCreateNewDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!establishment) return;
    if (!newDoctorForm.firstName || !newDoctorForm.lastName || !newDoctorForm.email || !newDoctorForm.password) {
      toast.error('First Name, Last Name, Email and Password are required');
      return;
    }

    setIsSubmittingDoctor(true);
    try {
      await createUserApi({
        firstName: newDoctorForm.firstName.trim(),
        lastName: newDoctorForm.lastName.trim(),
        email: newDoctorForm.email.trim(),
        password: newDoctorForm.password,
        phone: newDoctorForm.phone.trim() || undefined,
        licenseNumber: newDoctorForm.licenseNumber.trim() || undefined,
        bio: newDoctorForm.bio.trim() || undefined,
        role: 'DOCTOR',
        establishmentId: establishment.id,
      });

      toast.success(`Dr. ${newDoctorForm.firstName} ${newDoctorForm.lastName} created and linked to ${establishment.name}!`);
      setIsAddDoctorModalOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setIsSubmittingDoctor(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => {
    const aDate = a.appointmentDate || a.date || '';
    return aDate.startsWith(todayStr);
  });
  const pendingAppointments = appointments.filter((a) => a.status === 'PENDING');
  const confirmedAppointments = appointments.filter((a) => a.status === 'CONFIRMED');

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 flex items-center justify-center gap-2">
        <RefreshCw className="animate-spin text-blue-600" size={18} />
        <span>Loading establishment dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
              Establishment Administration
            </span>
            {establishment?.type && (
              <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                {establishment.type}
              </span>
            )}
            {establishment && (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Assigned Clinic
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">
            {establishment?.name || (user?.establishments?.[0]?.name) || 'My Establishment'}
          </h1>
          <p className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
            <MapPin size={13} className="text-blue-400 shrink-0" />
            <span>
              {establishment?.address
                ? `${establishment.address}${establishment.city ? `, ${establishment.city}` : ''}`
                : 'Facility location address'}
            </span>
            {establishment?.phone && (
              <>
                <span>•</span>
                <Phone size={13} className="text-blue-400 shrink-0" />
                <span>{establishment.phone}</span>
              </>
            )}
            {establishment?.email && (
              <>
                <span>•</span>
                <Mail size={13} className="text-blue-400 shrink-0" />
                <span>{establishment.email}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenAddDoctorModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <UserPlus size={16} />
            <span>+ Add Doctor to Clinic</span>
          </button>
        </div>
      </div>

      {/* No Clinic Assigned Alert */}
      {!establishment && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-amber-900">No Clinic Currently Assigned</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              Your account is an Establishment Administrator, but no facility has been linked to your profile yet.
              Please ask your Super Administrator to assign your clinic via the <strong>User Management</strong> or <strong>Establishments</strong> panel.
            </p>
          </div>
        </div>
      )}

      {/* Dedicated Assigned Clinic Details Card */}
      {establishment && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0 border border-blue-100 shadow-xs">
              <Building2 size={24} />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                  Assigned Facility
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900 truncate">
                  {establishment.name}
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  <span>{establishment.address || 'Address not set'}{establishment.city ? `, ${establishment.city}` : ''}</span>
                </span>
                {establishment.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400 shrink-0" />
                    <span>{establishment.phone}</span>
                  </span>
                )}
                {establishment.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span>{establishment.email}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateTab && (
              <>
                <button
                  onClick={() => onNavigateTab('establishment')}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Building2 size={13} />
                  <span>Clinic Profile</span>
                </button>
                <button
                  onClick={() => onNavigateTab('doctors')}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Stethoscope size={13} />
                  <span>Manage Doctors</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Doctors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Clinic Doctors</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Stethoscope size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{doctors.length}</span>
            <span className="text-[11px] font-bold text-slate-400">active specialists</span>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Calendar size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{appointments.length}</span>
            <span className="text-[11px] font-bold text-slate-400">appointments</span>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Today's Visits</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{todayAppointments.length}</span>
            <span className="text-[11px] font-bold text-emerald-600 font-semibold">scheduled today</span>
          </div>
        </div>

        {/* Pending Confirmations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pending Requests</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{pendingAppointments.length}</span>
            <span className="text-[11px] font-bold text-amber-600 font-semibold">awaiting approval</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Doctors in Establishment (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Stethoscope size={16} className="text-blue-600" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Assigned Doctors ({doctors.length})</h2>
            </div>
            <button
              onClick={handleOpenAddDoctorModal}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>

          {doctors.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Users size={32} className="mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No doctors assigned yet</p>
              <p className="text-slate-400">Click "+ Add Doctor to Clinic" to register or assign specialists.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {doctors.map((docUser) => {
                const doc = docUser.user;
                return (
                  <div
                    key={docUser.id}
                    className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                        <Stethoscope size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">
                          Dr. {doc?.firstName} {doc?.lastName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {doc?.email}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                      Doctor
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Recent Appointments (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Clinic Appointments ({appointments.length})</h2>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('appointments')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View All →
              </button>
            )}
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No appointments booked at this establishment yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {appointments.slice(0, 8).map((app) => (
                <div
                  key={app.id}
                  className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">
                        {app.patient ? `${app.patient.firstName} ${app.patient.lastName}` : (app.patientName || 'Patient')}
                      </span>
                      <span className="text-[10px] text-slate-400">with</span>
                      <span className="font-semibold text-xs text-blue-700">
                        Dr. {app.doctor?.lastName || app.doctorName || 'Doctor'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock size={12} className="text-slate-400" />
                      <span>{app.appointmentDate || app.date} at {app.startTime}</span>
                      {app.reason && <span>• {app.reason}</span>}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
                      app.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : app.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : app.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD DOCTOR TO ESTABLISHMENT */}
      {isAddDoctorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add Doctor to {establishment?.name || 'Clinic'}</h2>
                  <p className="text-xs text-slate-500">Create a new doctor account directly affiliated with this establishment</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddDoctorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewDoctor} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    placeholder="E.g., Sophie"
                    value={newDoctorForm.firstName}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    placeholder="E.g., Martin"
                    value={newDoctorForm.lastName}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  placeholder="doctor@clinic.com"
                  value={newDoctorForm.email}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Initial Password *</label>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newDoctorForm.password}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Phone</label>
                  <input
                    type="text"
                    placeholder="+33 6 12 34 56 78"
                    value={newDoctorForm.phone}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">License Number</label>
                  <input
                    type="text"
                    placeholder="E.g., MED-9921"
                    value={newDoctorForm.licenseNumber}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Specialty / Bio</label>
                  <input
                    type="text"
                    placeholder="E.g., General Practice"
                    value={newDoctorForm.bio}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, bio: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDoctorModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoctor}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDoctor ? 'Creating...' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
