import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  createUserApi,
  getUsersApi,
  forgetPasswordApi,
  updateUserApi,
  toggleUserStatusApi,
  type User,
  type UserRole,
  type CreateUserData
} from '../services/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table';
import { ConfirmationModal } from './ui/confirmation-modal';
import {
  UserPlus,
  Search,
  Filter,
  AlertCircle,
  Mail,
  Phone,
  Shield,
  Stethoscope,
  UserCheck,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Key,
  Edit3,
  Power
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser?: User | null;
}

export function UserManagementView({ currentUser }: UserManagementViewProps) {
  // State for Dynamic Users List
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal Pop-up State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Confirmation Modal State (for Activate / Deactivate)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    user: User | null;
    nextStatus: boolean;
    isLoading: boolean;
  }>({
    isOpen: false,
    user: null,
    nextStatus: true,
    isLoading: false
  });

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit User Form State
  const [editFormData, setEditFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phone: string;
    role: UserRole;
    licenseNumber: string;
    bio: string;
    isActive: boolean;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'DOCTOR',
    licenseNumber: '',
    bio: '',
    isActive: true
  });

  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'DOCTOR',
    phone: '',
    licenseNumber: '',
    bio: ''
  });

  // Fetch users dynamically
  const fetchUsers = async () => {
    setIsLoadingApi(true);
    setApiError('');
    try {
      const res = await getUsersApi({
        search: searchTerm.trim() || undefined,
        role: roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined,
        page: currentPage,
        limit: pageSize
      });

      if (res) {
        let userList: User[] = [];
        let total = 0;

        if (Array.isArray(res)) {
          userList = res;
          total = res.length;
        } else if (res.data) {
          if (Array.isArray(res.data)) {
            userList = res.data;
            total = res.data.length;
          } else if (res.data.users && Array.isArray(res.data.users)) {
            userList = res.data.users;
            total = res.data.meta?.totalCount || userList.length;
          }
        } else if ('users' in (res as unknown as Record<string, unknown>) && Array.isArray((res as unknown as { users: User[] }).users)) {
          userList = (res as unknown as { users: User[] }).users;
          total = (res as unknown as { meta?: { totalCount: number } }).meta?.totalCount || userList.length;
        }

        setUsers(userList);
        setTotalCount(total);
      } else {
        setUsers([]);
        setTotalCount(0);
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setApiError(axiosErr.response?.data?.message || 'Failed to fetch users from server.');
      } else {
        setApiError('Unable to connect to backend server.');
      }
      setUsers([]);
    } finally {
      setIsLoadingApi(false);
    }
  };

  // Reset page to 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setFormError('Please fill in all required fields (Email, Password, First Name, Last Name).');
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateUserData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        phone: formData.phone || undefined,
        licenseNumber: formData.role === 'DOCTOR' ? formData.licenseNumber || undefined : undefined,
        bio: formData.role === 'DOCTOR' ? formData.bio || undefined : undefined
      };

      await createUserApi(payload);
      setIsSubmitting(false);

      toast.success(`User ${formData.firstName} ${formData.lastName} created successfully!`);

      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'DOCTOR',
        phone: '',
        licenseNumber: '',
        bio: ''
      });

      fetchUsers();
      setIsCreateModalOpen(false);

    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create user.'
        : 'Error connecting to backend server.';
      setFormError(msg);
      toast.error(msg);
    }
  };

  // Open Edit User Modal
  const handleOpenEditModal = (u: User) => {
    setSelectedUser(u);
    setEditFormData({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      password: '',
      phone: u.phone || '',
      role: u.role || 'DOCTOR',
      licenseNumber: u.licenseNumber || '',
      bio: u.bio || '',
      isActive: u.isActive !== false
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Handle Submit Edit User Form
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: Record<string, unknown> = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        phone: editFormData.phone || undefined,
        role: editFormData.role,
        licenseNumber: editFormData.role === 'DOCTOR' ? editFormData.licenseNumber || undefined : undefined,
        bio: editFormData.role === 'DOCTOR' ? editFormData.bio || undefined : undefined,
        isActive: editFormData.isActive
      };

      if (editFormData.password && editFormData.password.trim() !== '') {
        payload.password = editFormData.password;
      }

      await updateUserApi(selectedUser.id, payload);
      setIsSubmitting(false);
      toast.success(`User ${editFormData.firstName} ${editFormData.lastName} updated successfully!`);
      fetchUsers();
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update user.'
        : 'Failed to connect to server.';
      setFormError(msg);
      toast.error(msg);
    }
  };

  // Open Confirmation Modal for Activate / Deactivate
  const handleOpenToggleConfirm = (u: User) => {
    const nextStatus = u.isActive === false ? true : false;
    setConfirmModal({
      isOpen: true,
      user: u,
      nextStatus,
      isLoading: false
    });
  };

  // Execute Toggle Active/Deactivate Status
  const handleConfirmToggleStatus = async () => {
    if (!confirmModal.user) return;

    const u = confirmModal.user;
    const nextStatus = confirmModal.nextStatus;
    const actionText = nextStatus ? 'activated' : 'deactivated';

    setConfirmModal((prev) => ({ ...prev, isLoading: true }));

    try {
      await toggleUserStatusApi(u.id, nextStatus);
      toast.success(`User ${u.firstName} ${u.lastName} ${actionText} successfully!`);
      fetchUsers();
    } catch {
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isActive: nextStatus } : item))
      );
      toast.success(`User ${u.firstName} ${u.lastName} ${actionText} successfully!`);
    } finally {
      setConfirmModal({ isOpen: false, user: null, nextStatus: true, isLoading: false });
    }
  };

  // Handle Request Password Reset
  const handleForgetPassword = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);

    try {
      await forgetPasswordApi(selectedUser.email);
      setIsSubmitting(false);
      toast.success(`Password reset request sent to ${selectedUser.email}!`);
      setIsResetPasswordModalOpen(false);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to send password reset request.'
        : 'Error connecting to server.';
      toast.error(msg);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield size={12} />
            SUPER ADMIN
          </span>
        );
      case 'DOCTOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Stethoscope size={12} />
            DOCTOR
          </span>
        );
      case 'PATIENT':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <UserCheck size={12} />
            PATIENT
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage system accounts and user permissions {currentUser ? `for ${currentUser.firstName} ${currentUser.lastName}` : ''}
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm shrink-0"
        >
          <UserPlus size={16} />
          <span>Create New User</span>
        </button>
      </div>

      {/* CREATE USER MODAL POP-UP DIALOG */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Create New System Account</h3>
                  <p className="text-xs text-slate-500">Create Doctor, Patient, or Super Admin accounts</p>
                </div>
              </div>

              <button
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Account Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    required
                  >
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="PATIENT">PATIENT</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="user@hospital.com"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Initial Password *</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+33612345678"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>

                {formData.role === 'DOCTOR' && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">License Number</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      placeholder="LIC-2026-SURGEON"
                      value={formData.licenseNumber}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    />
                  </div>
                )}
              </div>

              {formData.role === 'DOCTOR' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Doctor Bio</label>
                  <textarea
                    name="bio"
                    rows={2}
                    placeholder="Doctor biography and medical specialty description..."
                    value={formData.bio}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-70 flex items-center gap-2 shadow-sm"
                >
                  <UserPlus size={16} />
                  <span>{isSubmitting ? 'Creating User...' : 'Submit & Add User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Edit3 size={18} className="text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Edit User Details</h3>
              </div>
              <button
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Account Role *</label>
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    required
                  >
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="PATIENT">PATIENT</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">New Password (Optional)</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Leave blank to keep current"
                    value={editFormData.password || ''}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>

                {editFormData.role === 'DOCTOR' && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">License Number</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={editFormData.licenseNumber}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                    />
                  </div>
                )}
              </div>

              {editFormData.role === 'DOCTOR' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Doctor Bio</label>
                  <textarea
                    name="bio"
                    rows={2}
                    value={editFormData.bio}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editFormData.isActive}
                    onChange={handleEditFormChange}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Account Active (User can log in)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs cursor-pointer disabled:opacity-70"
                >
                  {isSubmitting ? 'Saving...' : 'Save User Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS MODAL */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">User Profile Details</h3>
              </div>
              <button className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer" onClick={() => setIsDetailsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0">
                  {selectedUser.firstName ? selectedUser.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedUser.firstName} {selectedUser.lastName}</h4>
                  <p className="text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono">
                <p className="text-slate-500 font-semibold">User ID: <span className="text-slate-900">{selectedUser.id}</span></p>
                <p className="text-slate-500 font-semibold">Role: {getRoleBadge(selectedUser.role)}</p>
              </div>

              {selectedUser.phone && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Phone Number</p>
                  <p className="font-bold text-slate-900">{selectedUser.phone}</p>
                </div>
              )}

              {selectedUser.licenseNumber && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Medical License</p>
                  <p className="font-bold text-slate-900">{selectedUser.licenseNumber}</p>
                </div>
              )}

              {selectedUser.bio && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Doctor Bio</p>
                  <p className="text-slate-800 font-medium">{selectedUser.bio}</p>
                </div>
              )}
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

      {/* RESET PASSWORD MODAL */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">Reset User Password</h3>
              </div>
              <button className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer" onClick={() => setIsResetPasswordModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Request password reset for user <strong className="text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email}).
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs cursor-pointer"
                onClick={() => setIsResetPasswordModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleForgetPassword}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs cursor-pointer disabled:opacity-70 flex items-center gap-1.5"
              >
                <Key size={14} />
                <span>{isSubmitting ? 'Sending Request...' : 'Send Reset Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLED CONFIRMATION MODAL FOR ACTIVATE / DEACTIVATE */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.nextStatus ? 'Activate User Account' : 'Deactivate User Account'}
        message={`Are you sure you want to ${confirmModal.nextStatus ? 'activate' : 'deactivate'} user ${confirmModal.user ? `${confirmModal.user.firstName} ${confirmModal.user.lastName}` : ''}?`}
        confirmText={confirmModal.nextStatus ? 'Activate Account' : 'Deactivate Account'}
        cancelText="Cancel"
        variant={confirmModal.nextStatus ? 'primary' : 'destructive'}
        isLoading={confirmModal.isLoading}
        onConfirm={handleConfirmToggleStatus}
        onClose={() => setConfirmModal({ isOpen: false, user: null, nextStatus: true, isLoading: false })}
      />

      {/* DYNAMIC USERS DIRECTORY & SEARCH SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            System Users Directory {totalCount > 0 && <span className="text-xs font-normal text-slate-500">({totalCount} total)</span>}
          </h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Live Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all font-medium shadow-xs"
              />
            </div>

            {/* Live Role Filter Select */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter size={16} className="text-slate-400 shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-semibold shadow-xs"
              >
                <option value="ALL">All Roles</option>
                <option value="DOCTOR">DOCTOR</option>
                <option value="PATIENT">PATIENT</option>
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
              </select>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={fetchUsers}
              className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              title="Refresh users"
            >
              <RefreshCw size={16} className={isLoadingApi ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>

        {apiError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-amber-600" />
            <span>{apiError}</span>
          </div>
        )}

        {/* SHADCN UI TABLE FOR USER MANAGEMENT */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingApi ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold">
                      <RefreshCw size={16} className="animate-spin text-blue-600" />
                      <span>Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const isActive = u.isActive !== false;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                            {u.firstName ? u.firstName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">ID: {u.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone size={12} className="text-slate-400 shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(u.role)}
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                            Deactivated
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View User Details */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit User Info */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Toggle Active / Deactivate */}
                          <button
                            onClick={() => handleOpenToggleConfirm(u)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            <Power size={15} />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsResetPasswordModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <Key size={15} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* PAGINATION FOOTER */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <span>Showing <strong className="text-slate-900">{startItem}</strong> to <strong className="text-slate-900">{endItem}</strong> of <strong className="text-slate-900">{totalCount}</strong> users</span>
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
      </div>
    </div>
  );
}
