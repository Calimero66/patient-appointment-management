import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getDoctorsApi, requestTransferApi, type Appointment, type User as UserType } from '../../services/api';
import { X, ArrowRightLeft, User, Search, RefreshCw, AlertCircle } from 'lucide-react';

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
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  const fetchDoctors = async (search?: string) => {
    setIsLoadingDoctors(true);
    try {
      const res = await getDoctorsApi({ search: search?.trim() || undefined });
      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.doctors || res.data.users || [];
        // Filter out the current doctor
        const filtered = list.filter((doc) => doc.id !== currentDoctorId && doc.id !== appointment?.doctorId);
        setDoctors(filtered);
      }
    } catch {
      setDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    const timer = setTimeout(() => {
      fetchDoctors(val);
    }, 300);
    return () => clearTimeout(timer);
  };

  if (!isOpen || !appointment) return null;

  const patientName = appointment.patientName || (appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Patient');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Transfer Appointment</h3>
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
        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs space-y-1">
          <p className="text-purple-900 font-semibold flex items-center justify-between">
            <span>Appointment #{appointment.id.slice(0, 8)}</span>
            <span className="font-mono text-purple-700">{appointment.appointmentDate || appointment.date} ({appointment.startTime || '10:00'})</span>
          </p>
          <p className="text-slate-600 text-[11px] truncate">Reason: {appointment.reason || 'General Consultation'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Target Doctor Search & Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Select Colleague Doctor *
            </label>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search colleague by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-medium"
              />
              {isLoadingDoctors && (
                <RefreshCw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 animate-spin" />
              )}
            </div>

            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-semibold"
              required
            >
              <option value="">-- Choose a Doctor --</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.firstName} {doc.lastName} ({doc.email}){doc.licenseNumber ? ` - ${doc.licenseNumber}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reason for transfer */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Reason for Transfer *
            </label>
            <textarea
              rows={3}
              placeholder="E.g., Requires cardiology specialization, doctor unavailable on this date, patient preference..."
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-70 shadow-xs"
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
