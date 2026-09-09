import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Stethoscope,
  UserPlus,
  Search,
  RefreshCw,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Building2,
  Users
} from 'lucide-react';
import {
  getMyEstablishmentsApi,
  getEstablishmentUsersApi,
  createUserApi,
  removeEstablishmentUserApi,
  toggleUserStatusApi,
  type Establishment,
  type EstablishmentUser,
  type User
} from '../../services/api';
import { ConfirmationModal } from '../ui/confirmation-modal';

interface EstablishmentAdminDoctorsViewProps {
  currentUser?: User | null;
}

export function EstablishmentAdminDoctorsView({ currentUser }: EstablishmentAdminDoctorsViewProps) {
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [doctors, setDoctors] = useState<EstablishmentUser[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remove confirmation modal
  const [selectedDoctorToRemove, setSelectedDoctorToRemove] = useState<EstablishmentUser | null>(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  // Create Doctor Form
  const [newDoctorForm, setNewDoctorForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
    bio: '',
  });

  const fetchEstablishmentDoctors = async () => {
    setIsLoading(true);
    try {
      const myEstRes = await getMyEstablishmentsApi();
      const adminLinks = myEstRes?.data?.establishments || [];
      const primaryLink = adminLinks.find((e) => e.role === 'ADMIN') || adminLinks[0];

      if (primaryLink?.establishment) {
        setEstablishment(primaryLink.establishment);
        const usersRes = await getEstablishmentUsersApi(primaryLink.establishment.id);
        if (usersRes?.data?.users) {
          const docUsers = usersRes.data.users.filter((u) => u.role === 'DOCTOR');
          setDoctors(docUsers);
        }
      }
    } catch {
      toast.error('Failed to load clinic doctors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstablishmentDoctors();
  }, []);

  const handleOpenAddModal = () => {
    setNewDoctorForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      licenseNumber: '',
      bio: '',
    });
    setIsAddModalOpen(true);
  };

  const handleCreateNewDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!establishment) return;
    if (!newDoctorForm.firstName || !newDoctorForm.lastName || !newDoctorForm.email || !newDoctorForm.password) {
      toast.error('First Name, Last Name, Email and Password are required');
      return;
    }

    setIsSubmitting(true);
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

      toast.success(`Dr. ${newDoctorForm.firstName} ${newDoctorForm.lastName} created and added to ${establishment.name}!`);
      setIsAddModalOpen(false);
      fetchEstablishmentDoctors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRemoveDoctor = async () => {
    if (!establishment || !selectedDoctorToRemove) return;
    const targetUserId = selectedDoctorToRemove.userId || selectedDoctorToRemove.user?.id;
    if (!targetUserId) return;

    try {
      await removeEstablishmentUserApi(establishment.id, targetUserId);
      toast.success('Doctor removed from this establishment');
      setIsRemoveModalOpen(false);
      fetchEstablishmentDoctors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove doctor');
    }
  };

  const filteredDoctors = doctors.filter((item) => {
    const doc = item.user;
    if (!doc) return false;
    const q = search.toLowerCase();
    const name = `${doc.firstName} ${doc.lastName}`.toLowerCase();
    const email = doc.email.toLowerCase();
    const license = (doc.licenseNumber || '').toLowerCase();
    return name.includes(q) || email.includes(q) || license.includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="text-blue-600" size={24} />
            <span>Clinic Doctors Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage doctors and medical staff belonging to {establishment?.name || 'your establishment'}.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus size={16} />
          <span>+ Add Doctor to Clinic</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search doctor by name, email or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
          />
        </div>

        <div className="text-xs font-bold text-slate-500">
          <span>Total: <strong className="text-slate-900">{doctors.length}</strong> doctors in this clinic</span>
        </div>
      </div>

      {/* Doctors Grid / List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 flex items-center justify-center gap-2">
          <RefreshCw className="animate-spin text-blue-600" size={18} />
          <span>Loading clinic doctors...</span>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Users size={36} className="mx-auto text-slate-300" />
          <p className="font-bold text-slate-700">No doctors found</p>
          <p className="text-slate-400">Click "+ Add Doctor to Clinic" to register doctors for this establishment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((item) => {
            const doc = item.user;
            if (!doc) return null;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                          Dr. {doc.firstName} {doc.lastName}
                        </h3>
                        <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-0.5">
                          {doc.licenseNumber ? `License: ${doc.licenseNumber}` : 'Medical Specialist'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        doc.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {doc.isActive !== false ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      <span>{doc.isActive !== false ? 'Active' : 'Inactive'}</span>
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{doc.email}</span>
                    </div>
                    {doc.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        <span>{doc.phone}</span>
                      </div>
                    )}
                    {doc.bio && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 pt-1 border-t border-slate-100">
                        {doc.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Role: <strong className="text-slate-700">{item.role}</strong>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedDoctorToRemove(item);
                      setIsRemoveModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove Doctor from Establishment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD DOCTOR TO ESTABLISHMENT */}
      {isAddModalOpen && (
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
                onClick={() => setIsAddModalOpen(false)}
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM REMOVE MODAL */}
      <ConfirmationModal
        isOpen={isRemoveModalOpen}
        title="Remove Doctor from Establishment"
        message={`Are you sure you want to remove Dr. ${selectedDoctorToRemove?.user?.firstName} ${selectedDoctorToRemove?.user?.lastName} from this establishment? They will no longer receive bookings for this clinic.`}
        confirmText="Remove Doctor"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmRemoveDoctor}
        onClose={() => setIsRemoveModalOpen(false)}
      />
    </div>
  );
}
