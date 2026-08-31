import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Save,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit2
} from 'lucide-react';
import {
  getMyEstablishmentsApi,
  updateEstablishmentApi,
  type Establishment,
  type User
} from '../../services/api';

interface EstablishmentProfileViewProps {
  currentUser?: User | null;
}

export function EstablishmentProfileView({ currentUser }: EstablishmentProfileViewProps) {
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Clinic',
    address: '',
    city: '',
    phone: '',
    email: '',
    isActive: true,
  });

  const fetchEstablishment = async () => {
    setIsLoading(true);
    try {
      const myEstRes = await getMyEstablishmentsApi();
      const adminLinks = myEstRes?.data?.establishments || [];
      const primaryLink = adminLinks.find((e) => e.role === 'ADMIN') || adminLinks[0];

      if (primaryLink?.establishment) {
        const est = primaryLink.establishment;
        setEstablishment(est);
        setFormData({
          name: est.name || '',
          type: est.type || 'Clinic',
          address: est.address || '',
          city: est.city || '',
          phone: est.phone || '',
          email: est.email || '',
          isActive: est.isActive !== false,
        });
      }
    } catch {
      toast.error('Failed to load clinic details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstablishment();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!establishment) return;
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Establishment Name and Address are required');
      return;
    }

    setIsSaving(true);
    try {
      await updateEstablishmentApi(establishment.id, {
        name: formData.name.trim(),
        type: formData.type.trim() || undefined,
        address: formData.address.trim(),
        city: formData.city.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        isActive: formData.isActive,
      });

      toast.success('Clinic profile updated successfully!');
      fetchEstablishment();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update clinic');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 flex items-center justify-center gap-2">
        <RefreshCw className="animate-spin text-blue-600" size={18} />
        <span>Loading clinic profile...</span>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
        <Building2 size={36} className="mx-auto text-slate-300" />
        <p className="font-bold text-slate-700">No establishment linked</p>
        <p className="text-slate-400">Your account is not currently assigned as an administrator to any establishment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="text-blue-600" size={24} />
          <span>Establishment Profile</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure establishment contact information, branch location, and patient visibility.
        </p>
      </div>

      {/* Profile Form Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">{establishment.name}</h3>
              <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
                {establishment.type || 'Clinic'}
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full ${
              establishment.isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            {establishment.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            <span>{establishment.isActive ? 'Active Clinic' : 'Inactive'}</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Establishment Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Full Physical Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Public Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isEstablishmentActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="isEstablishmentActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              Establishment is Active and accepting patient appointments
            </label>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
