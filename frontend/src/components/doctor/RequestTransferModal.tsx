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

interface RequestTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  currentDoctorId?: string;
  onSuccess: () => void;
}

export function RequestTransferModal({
  isOpen,
  onClose,
  appointment,
  currentDoctorId,
  onSuccess,
}: RequestTransferModalProps) {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState('');
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
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
        // Filter out the current doctor so you can't transfer to yourself
        const filtered = list.filter((doc: UserType) => doc.id !== currentDoctorId && doc.id !== appointment?.doctorId);
        setDoctors(filtered);
        if (filtered.length > 0) {
          setSelectedDoctorId(filtered[0].id);
        } else {
          setSelectedDoctorId('');
        }
      }
    } catch {
      setDoctors([]);
      setSelectedDoctorId('');
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

  const patientName =
    appointment.patientName ||
    (appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Patient');

  const currentEstName = appointment.establishment?.name || 'Current Clinic';

  const selectedEstablishment = establishments.find((e) => String(e.id) === String(selectedEstablishmentId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstablishmentId) {
      toast.error('Please select an establishment.');
      return;
    }
    if (!selectedDoctorId) {
      toast.error('Please select a target doctor for the transfer.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason for the transfer.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestTransferApi({
        appointmentId: appointment.id,
        toDoctorId: selectedDoctorId,
        toEstablishmentId: selectedEstablishmentId,
        reason: reason.trim(),
      });
      toast.success('Transfer request sent successfully!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      let errorMsg = 'Failed to request transfer.';
      if (err && typeof err === 'object' && 'response' in err) {
        const resData = (err as { response?: { data?: any } }).response?.data;
        if (typeof resData === 'string') {
          errorMsg = resData;
        } else if (resData?.message) {
          errorMsg = Array.isArray(resData.message) ? resData.message.join(', ') : resData.message;
        }
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Request Doctor Transfer</h3>
              <p className="text-xs text-slate-500">Patient: <strong className="text-slate-700">{patientName}</strong></p>
            </div>
          </div>
          <button
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Appointment summary */}
        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs space-y-1 shrink-0">
          <div className="flex items-center justify-between text-purple-900 font-semibold">
            <span>Appointment #{appointment.id.slice(0, 8)}</span>
            <span className="font-mono text-purple-700">{appointment.appointmentDate || appointment.date} ({appointment.startTime || '10:00'})</span>
          </div>
          <p className="text-slate-600 text-[11px] truncate">
            Current Establishment: <strong className="text-slate-800">{currentEstName}</strong>
          </p>
          <p className="text-slate-600 text-[11px] truncate">Reason: {appointment.reason || 'General Consultation'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* 1. SELECT ESTABLISHMENT */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 size={14} className="text-purple-600" />
              <span>Select Target Establishment *</span>
            </label>

            {isLoadingEstablishments ? (
              <div className="p-2.5 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin text-purple-600" />
                <span>Loading establishments...</span>
              </div>
            ) : (
              <select
                value={selectedEstablishmentId}
                onChange={(e) => setSelectedEstablishmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-semibold"
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
                <Stethoscope size={14} className="text-purple-600" />
                <span>Select Colleague Doctor *</span>
              </span>
              {selectedEstablishment && (
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
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
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-medium disabled:opacity-50"
              />
              {isLoadingDoctors && (
                <RefreshCw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 animate-spin" />
              )}
            </div>

            {isLoadingDoctors ? (
              <div className="p-3 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-purple-600" />
                <span>Loading doctors in {selectedEstablishment?.name || 'establishment'}...</span>
              </div>
            ) : doctors.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>
                  No other doctors are currently assigned to <strong>"{selectedEstablishment?.name || 'this establishment'}"</strong>. Please select another establishment above.
                </span>
              </div>
            ) : (
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-semibold"
                required
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.firstName} {doc.lastName} ({doc.email}){doc.licenseNumber ? ` — ${doc.licenseNumber}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. REASON FOR TRANSFER */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Reason for Transfer *
            </label>
            <textarea
              rows={3}
              placeholder="E.g., Requires cardiology specialization, doctor unavailable on this date, patient preference, closer clinic..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-medium transition-all"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || doctors.length === 0 || !selectedDoctorId}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-purple-600/20"
            >
              <ArrowRightLeft size={14} />
              <span>{isSubmitting ? 'Sending Request...' : 'Send Transfer Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
