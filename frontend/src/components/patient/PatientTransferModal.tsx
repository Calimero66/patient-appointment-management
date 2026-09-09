import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getEstablishmentsApi,
  getDoctorsApi,
  requestTransferApi,
  type Appointment,
  type Establishment,
  type User as UserType
} from '../../services/api';
import {
  X,
  ArrowRightLeft,
  Building2,
  Stethoscope,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface PatientTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onTransferSuccess?: () => void;
}

export function PatientTransferModal({
  isOpen,
  onClose,
  appointment,
  onTransferSuccess,
}: PatientTransferModalProps) {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState('');
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingEstablishments, setIsLoadingEstablishments] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Establishments on modal open
  useEffect(() => {
    if (!isOpen || !appointment) return;

    async function loadEstablishments() {
      setIsLoadingEstablishments(true);
      try {
        const res = await getEstablishmentsApi({ limit: 100 });
        const list = res?.data?.establishments || [];
        setEstablishments(list);

        // Pre-select current appointment's establishment or the first one
        const currentEstId = appointment?.establishmentId || appointment?.establishment?.id;
        if (currentEstId) {
          setSelectedEstablishmentId(String(currentEstId));
        } else if (list.length > 0) {
          setSelectedEstablishmentId(String(list[0].id));
        }
      } catch {
        toast.error('Failed to load establishments');
      } finally {
        setIsLoadingEstablishments(false);
      }
    }

    loadEstablishments();
    setSearchTerm('');
    setReason('');
  }, [isOpen, appointment]);

  // 2. Fetch doctors whenever selectedEstablishmentId changes
  useEffect(() => {
    if (!isOpen || !selectedEstablishmentId) return;
    fetchDoctors(selectedEstablishmentId, searchTerm);
  }, [selectedEstablishmentId, isOpen]);

  const fetchDoctors = async (establishmentId: string, search?: string) => {
    setIsLoadingDoctors(true);
    try {
      const res = await getDoctorsApi({
        establishmentId: establishmentId || undefined,
        search: search?.trim() || undefined,
        limit: 100,
      });

      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).doctors || (res.data as any).users || [];
        const currentDocId = appointment?.doctorId || appointment?.doctor?.id;
        const filtered = list.filter((doc: UserType) => doc.id !== currentDocId);
        setDoctors(filtered);
        if (filtered.length > 0) {
          setTargetDoctorId(filtered[0].id);
        } else {
          setTargetDoctorId('');
        }
      }
    } catch {
      setDoctors([]);
      setTargetDoctorId('');
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (selectedEstablishmentId) {
      fetchDoctors(selectedEstablishmentId, val);
    }
  };

  if (!isOpen || !appointment) return null;

  const currentDoctorName =
    appointment.doctorName ||
    (appointment.doctor ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}` : 'Current Doctor');

  const currentEstName = appointment.establishment?.name || 'Current Clinic';

  const selectedEstablishment = establishments.find((e) => String(e.id) === String(selectedEstablishmentId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstablishmentId) {
      toast.error('Please select an establishment.');
      return;
    }
    if (!targetDoctorId) {
      toast.error('Please select a target doctor');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason for the transfer request');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestTransferApi({
        appointmentId: appointment.id,
        toDoctorId: targetDoctorId,
        toEstablishmentId: selectedEstablishmentId,
        reason: reason.trim(),
      });
      toast.success('Transfer request submitted successfully!');
      if (onTransferSuccess) onTransferSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Request Doctor Transfer</h2>
              <p className="text-xs text-slate-500">Reassign consultation to another doctor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto pr-2 flex-1">
          {/* Current appointment details */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5 text-xs text-blue-900 shrink-0">
            <div className="flex items-center justify-between font-semibold">
              <span>Appointment Date:</span>
              <span className="font-bold">{appointment.appointmentDate || appointment.date} at {appointment.startTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Current Establishment:</span>
              <span className="font-bold text-blue-800">{currentEstName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Current Doctor:</span>
              <span className="font-bold text-blue-800">{currentDoctorName}</span>
            </div>
          </div>

          {/* 1. SELECT ESTABLISHMENT */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" />
              <span>Select Target Establishment *</span>
            </label>

            {isLoadingEstablishments ? (
              <div className="p-2.5 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin text-blue-600" />
                <span>Loading establishments...</span>
              </div>
            ) : (
              <select
                value={selectedEstablishmentId}
                onChange={(e) => setSelectedEstablishmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-semibold"
                required
              >
                <option value="">-- Choose an Establishment --</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name} ({est.city || est.type || 'Clinic'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. SELECT DOCTOR FROM SELECTED ESTABLISHMENT */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Stethoscope size={14} className="text-blue-600" />
                <span>Select New Doctor *</span>
              </span>
              {selectedEstablishment && (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {selectedEstablishment.name}
                </span>
              )}
            </label>

            {/* Live Search Within Establishment */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctor by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={!selectedEstablishmentId}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium disabled:opacity-50"
              />
              {isLoadingDoctors && (
                <RefreshCw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 animate-spin" />
              )}
            </div>

            {isLoadingDoctors ? (
              <div className="p-3 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-blue-600" />
                <span>Loading doctors in {selectedEstablishment?.name || 'establishment'}...</span>
              </div>
            ) : doctors.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>
                  No other doctors are currently available in <strong>"{selectedEstablishment?.name || 'this establishment'}"</strong>. Please choose another establishment above.
                </span>
              </div>
            ) : (
              <select
                value={targetDoctorId}
                onChange={(e) => setTargetDoctorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-semibold"
                required
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.firstName} {doc.lastName} {doc.licenseNumber ? `(${doc.licenseNumber})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. REASON FOR TRANSFER */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Reason for Transfer *</label>
            <textarea
              rows={3}
              placeholder="E.g., Specialist second opinion, scheduling preference, closer consultation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || doctors.length === 0 || !targetDoctorId}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-blue-600/20"
            >
              <ArrowRightLeft size={14} />
              <span>{isSubmitting ? 'Submitting Request...' : 'Send Transfer Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
