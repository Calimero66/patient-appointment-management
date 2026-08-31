import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { getDoctorsApi, requestTransferApi, type Appointment, type User as UserType } from '../../services/api';

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
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !appointment) return;
    async function loadDoctors() {
      setIsLoadingDoctors(true);
      try {
        const res = await getDoctorsApi();
        const docs = Array.isArray(res?.data)
          ? res.data
          : (res?.data as any)?.doctors || [];
        const currentDocId = appointment ? (appointment.doctorId || appointment.doctor?.id) : undefined;
        const available = docs.filter((d: UserType) => d.id !== currentDocId);
        setDoctors(available);
        if (available.length > 0) {
          setTargetDoctorId(available[0].id);
        }
      } catch {
        toast.error('Failed to load available doctors');
      } finally {
        setIsLoadingDoctors(false);
      }
    }
    loadDoctors();
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  const currentDoctorName =
    appointment.doctorName ||
    (appointment.doctor ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}` : 'Current Doctor');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5 text-xs text-blue-900">
            <div className="flex items-center justify-between font-semibold">
              <span>Appointment Date:</span>
              <span className="font-bold">{appointment.appointmentDate || appointment.date} at {appointment.startTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Current Doctor:</span>
              <span className="font-bold text-blue-800">{currentDoctorName}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Select New Doctor *</label>
            {isLoadingDoctors ? (
              <div className="p-2.5 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">Loading doctors...</div>
            ) : doctors.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle size={15} />
                <span>No other available doctors found.</span>
              </div>
            ) : (
              <select
                value={targetDoctorId}
                onChange={(e) => setTargetDoctorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
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

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || doctors.length === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-600/20"
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
