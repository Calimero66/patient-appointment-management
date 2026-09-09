import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  X,
  Stethoscope,
  Shield,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import {
  getEstablishmentsApi,
  createEstablishmentApi,
  updateEstablishmentApi,
  deleteEstablishmentApi,
  getEstablishmentUsersApi,
  addEstablishmentUserApi,
  removeEstablishmentUserApi,
  getUsersApi,
  type Establishment,
  type EstablishmentUser,
  type User
} from '../services/api';
import { ConfirmationModal } from './ui/confirmation-modal';

interface EstablishmentsViewProps {
  currentUser?: User | null;
}

export function EstablishmentsView({ currentUser }: EstablishmentsViewProps) {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active / Selected Establishment
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);

  // Form Data for Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    type: 'Clinic',
    address: '',
    city: '',
    phone: '',
    email: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staff Modal States
  const [staffList, setStaffList] = useState<EstablishmentUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [allDoctorsAndAdmins, setAllDoctorsAndAdmins] = useState<User[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<'ADMIN' | 'DOCTOR'>('DOCTOR');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // 1. Fetch Establishments
  const fetchEstablishments = async () => {
    setIsLoading(true);
    try {
      const res = await getEstablishmentsApi({
        search: search.trim() || undefined,
        page,
        limit: pageSize,
      });
      if (res?.data) {
        setEstablishments(res.data.establishments || []);
        setTotalCount(res.data.meta?.totalCount || 0);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load establishments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstablishments();
  }, [search, page]);

  // 2. Fetch all doctors and establishment admins for the "Add Staff" dropdown (Super Admin and Patients cannot be assigned)
  const fetchPotentialStaff = async () => {
    try {
      const res = await getUsersApi({ limit: 100 });
      if (res?.data?.users) {
        const eligible = res.data.users.filter(
          (u) => u.role === 'DOCTOR' || u.role === 'ESTABLISHMENT_ADMIN'
        );
        setAllDoctorsAndAdmins(eligible);
        
        // Prefer selecting an available user first
        const available = eligible.find((u) => !u.establishments || u.establishments.length === 0);
        if (available) {
          setSelectedUserIdToAdd(available.id);
          setSelectedRoleToAdd(available.role === 'ESTABLISHMENT_ADMIN' ? 'ADMIN' : 'DOCTOR');
        } else if (eligible.length > 0) {
          setSelectedUserIdToAdd(eligible[0].id);
          setSelectedRoleToAdd(eligible[0].role === 'ESTABLISHMENT_ADMIN' ? 'ADMIN' : 'DOCTOR');
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchPotentialStaff();
  }, []);

  // 3. Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      type: 'Clinic',
      address: '',
      city: '',
      phone: '',
      email: '',
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  // 4. Open Edit Modal
  const handleOpenEdit = (est: Establishment) => {
    setSelectedEstablishment(est);
    setFormData({
      name: est.name || '',
      type: est.type || 'Clinic',
      address: est.address || '',
      city: est.city || '',
      phone: est.phone || '',
      email: est.email || '',
      isActive: est.isActive !== false,
    });
    setIsEditModalOpen(true);
  };

  // 5. Open Staff Modal
  const handleOpenStaff = async (est: Establishment) => {
    setSelectedEstablishment(est);
    setIsStaffModalOpen(true);
    setStaffSearchQuery('');
    fetchPotentialStaff();
    setIsLoadingStaff(true);
    try {
      const res = await getEstablishmentUsersApi(est.id);
      if (res?.data?.users) {
        setStaffList(res.data.users);
      }
    } catch (err: any) {
      toast.error('Failed to load establishment staff');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // 6. Handle Create Establishment Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Name and Address are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createEstablishmentApi({
        name: formData.name.trim(),
        type: formData.type.trim() || undefined,
        address: formData.address.trim(),
        city: formData.city.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
      });
      toast.success('Establishment created successfully!');
      setIsCreateModalOpen(false);
      fetchEstablishments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create establishment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Handle Edit Establishment Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstablishment) return;
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Name and Address are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateEstablishmentApi(selectedEstablishment.id, {
        name: formData.name.trim(),
        type: formData.type.trim() || undefined,
        address: formData.address.trim(),
        city: formData.city.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        isActive: formData.isActive,
      });
      toast.success('Establishment updated successfully!');
      setIsEditModalOpen(false);
      fetchEstablishments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update establishment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 8. Handle Delete Establishment
  const handleDeleteConfirm = async () => {
    if (!selectedEstablishment) return;
    try {
      await deleteEstablishmentApi(selectedEstablishment.id);
      toast.success('Establishment deleted successfully!');
      setIsDeleteModalOpen(false);
      fetchEstablishments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete establishment');
    }
  };

  // 9. Handle Add Staff Member to Establishment
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstablishment || !selectedUserIdToAdd) {
      toast.error('Please select a staff member');
      return;
    }

    const selectedUser = allDoctorsAndAdmins.find((u) => u.id === selectedUserIdToAdd);
    if (selectedUser?.establishments && selectedUser.establishments.length > 0) {
      toast.error(`This user is already assigned to "${selectedUser.establishments[0].name}". Please remove them from their current establishment first.`);
      return;
    }

    setIsAddingStaff(true);
    try {
      await addEstablishmentUserApi(selectedEstablishment.id, {
        userId: selectedUserIdToAdd,
        role: selectedRoleToAdd,
      });
      toast.success('Staff member assigned to establishment!');
      
      // Refresh staff list & potential staff list
      const res = await getEstablishmentUsersApi(selectedEstablishment.id);
      if (res?.data?.users) {
        setStaffList(res.data.users);
      }
      fetchPotentialStaff();
      fetchEstablishments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add staff member');
    } finally {
      setIsAddingStaff(false);
    }
  };

  // 10. Handle Remove Staff Member
  const handleRemoveStaff = async (userId: string) => {
    if (!selectedEstablishment) return;
    try {
      await removeEstablishmentUserApi(selectedEstablishment.id, userId);
      toast.success('Staff member removed from establishment');
      setStaffList((prev) => prev.filter((s) => s.userId !== userId && s.user?.id !== userId));
      fetchPotentialStaff();
      fetchEstablishments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove staff member');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="text-blue-600" size={24} />
            <span>Establishment Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage hospitals, clinics, medical centers, contact information, and assigned medical staff.
          </p>
        </div>

        {currentUser?.role === 'SUPER_ADMIN' && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Add Establishment</span>
          </button>
        )}
      </div>

      {/* Search Bar & Stats */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span>Total: <strong className="text-slate-900">{totalCount}</strong> establishments</span>
        </div>
      </div>

      {/* Establishments List / Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 flex items-center justify-center gap-2">
          <RefreshCw className="animate-spin text-blue-600" size={18} />
          <span>Loading establishments...</span>
        </div>
      ) : establishments.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Building2 size={36} className="mx-auto text-slate-300" />
          <p className="font-bold text-slate-700">No establishments found</p>
          <p className="text-slate-400">Click "Add Establishment" to register your first clinic or hospital branch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {establishments.map((est) => (
            <div
              key={est.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Top Badge & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{est.name}</h3>
                      <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
                        {est.type || 'Medical Center'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      est.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {est.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                    <span>{est.isActive ? 'Active' : 'Inactive'}</span>
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{est.address}{est.city ? `, ${est.city}` : ''}</span>
                  </div>
                  {est.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{est.phone}</span>
                    </div>
                  )}
                  {est.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{est.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenStaff(est)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                  title="Manage Doctors and Staff"
                >
                  <Users size={14} />
                  <span>Doctors & Staff</span>
                </button>

                <div className="flex items-center gap-1">
                  {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ESTABLISHMENT_ADMIN') && (
                    <button
                      onClick={() => handleOpenEdit(est)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Details"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <button
                      onClick={() => {
                        setSelectedEstablishment(est);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Establishment"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ESTABLISHMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add New Establishment</h2>
                  <p className="text-xs text-slate-500">Register a new clinic or hospital branch</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Establishment Name *</label>
                <input
                  type="text"
                  placeholder="E.g., Central City Hospital, Clinic Pasteur"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  >
                    <option value="Hospital">Hospital</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Medical Center">Medical Center</option>
                    <option value="Cabinet">Private Cabinet</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">City</label>
                  <input
                    type="text"
                    placeholder="E.g., Paris, Lyon, Casablanca"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Full Address *</label>
                <input
                  type="text"
                  placeholder="123 Avenue des Champs, Bâtiment B"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Phone</label>
                  <input
                    type="text"
                    placeholder="+33 1 23 45 67 89"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    placeholder="contact@clinic.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Save Establishment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ESTABLISHMENT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Edit Establishment</h2>
                  <p className="text-xs text-slate-500">Update clinic details and active status</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Establishment Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  >
                    <option value="Hospital">Hospital</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Medical Center">Medical Center</option>
                    <option value="Cabinet">Private Cabinet</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Full Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isActiveEdit" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Active (accepting patients & appointments)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Update Establishment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE STAFF & DOCTORS MODAL */}
      {isStaffModalOpen && selectedEstablishment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Staff & Doctors — {selectedEstablishment.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Assign doctors and administrators to this establishment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Scrollable Content */}
            <div className="space-y-5 overflow-y-auto pr-1 flex-1">
              {/* Form to Assign New Doctor / Staff */}
              {(() => {
                // 1. Only show doctors and establishment admins who are FREE (not assigned to any clinic)
                const availableStaff = allDoctorsAndAdmins.filter(
                  (u) => !u.establishments || u.establishments.length === 0
                );

                // 2. Filter by search query (first name, last name, email)
                const filteredAvailable = availableStaff.filter((u) => {
                  if (!staffSearchQuery.trim()) return true;
                  const term = staffSearchQuery.toLowerCase().trim();
                  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                  const email = (u.email || '').toLowerCase();
                  return fullName.includes(term) || email.includes(term);
                });

                // Auto-sync selection if current selected is not in filtered list
                const isCurrentInFiltered = filteredAvailable.some((u) => u.id === selectedUserIdToAdd);
                const activeSelectedId = isCurrentInFiltered
                  ? selectedUserIdToAdd
                  : (filteredAvailable[0]?.id || '');

                return (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!activeSelectedId) {
                        toast.error('Please select an available doctor or administrator');
                        return;
                      }
                      // Submit with the activeSelectedId
                      setSelectedUserIdToAdd(activeSelectedId);
                      handleAddStaffSubmit(e);
                    }}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <UserPlus size={14} className="text-blue-600" />
                        <span>Assign Doctor or Administrator</span>
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        Available to assign: <strong className="text-blue-600">{availableStaff.length}</strong>
                      </span>
                    </div>

                    {availableStaff.length === 0 ? (
                      <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                        <span className="font-bold text-amber-900 shrink-0">ℹ️ Notice:</span>
                        <span>No doctors or administrators are currently available. All registered doctors and admins are already assigned to an establishment.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Search Doctor by Name Input */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                          <input
                            type="text"
                            placeholder="Search available doctor by name or email..."
                            value={staffSearchQuery}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStaffSearchQuery(val);
                              const term = val.toLowerCase().trim();
                              const newFiltered = availableStaff.filter((u) => {
                                if (!term) return true;
                                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                                const email = (u.email || '').toLowerCase();
                                return fullName.includes(term) || email.includes(term);
                              });
                              if (newFiltered.length > 0) {
                                setSelectedUserIdToAdd(newFiltered[0].id);
                                setSelectedRoleToAdd(newFiltered[0].role === 'ESTABLISHMENT_ADMIN' ? 'ADMIN' : 'DOCTOR');
                              }
                            }}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 font-medium"
                          />
                        </div>

                        {filteredAvailable.length === 0 ? (
                          <div className="p-3 bg-white rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
                            No available doctor or administrator matches "<strong>{staffSearchQuery}</strong>".
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-6 space-y-1">
                              <label className="block text-[11px] font-bold text-slate-600">Select Available Doctor / Admin</label>
                              <select
                                value={activeSelectedId}
                                onChange={(e) => {
                                  const newId = e.target.value;
                                  setSelectedUserIdToAdd(newId);
                                  const found = filteredAvailable.find((u) => u.id === newId);
                                  if (found) {
                                    setSelectedRoleToAdd(found.role === 'ESTABLISHMENT_ADMIN' ? 'ADMIN' : 'DOCTOR');
                                  }
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium"
                                required
                              >
                                {filteredAvailable.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.role === 'DOCTOR' ? 'Dr. ' : ''}{u.firstName} {u.lastName} ({u.role}) — {u.email}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-3 space-y-1">
                              <label className="block text-[11px] font-bold text-slate-600">Role in Clinic</label>
                              <select
                                value={selectedRoleToAdd}
                                onChange={(e) => setSelectedRoleToAdd(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium"
                              >
                                <option value="DOCTOR">Doctor</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <button
                                type="submit"
                                disabled={isAddingStaff || !activeSelectedId}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                              >
                                {isAddingStaff ? 'Adding...' : '+ Assign'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </form>
                );
              })()}

              {/* Current Assigned Staff List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">
                    Currently Assigned Members ({staffList.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Doctors linked to this establishment will be available for patient bookings
                  </span>
                </div>

                {isLoadingStaff ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading staff members...</div>
                ) : staffList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No doctors or administrators assigned to this establishment yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {staffList.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              member.role === 'DOCTOR'
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'bg-purple-50 text-purple-600 border border-purple-100'
                            }`}
                          >
                            {member.role === 'DOCTOR' ? <Stethoscope size={16} /> : <Shield size={16} />}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-900 truncate">
                              {member.role === 'DOCTOR' ? 'Dr. ' : ''}
                              {member.user?.firstName} {member.user?.lastName}
                            </h5>
                            <p className="text-[11px] text-slate-500 truncate">
                              {member.user?.email} • <span className="font-semibold text-blue-600">{member.role}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStaff(member.userId || member.user?.id || member.id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-rose-200 shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Establishment"
        message={`Are you sure you want to delete "${selectedEstablishment?.name}"? Associated appointments and doctor schedules will be affected.`}
        confirmText="Delete Establishment"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
