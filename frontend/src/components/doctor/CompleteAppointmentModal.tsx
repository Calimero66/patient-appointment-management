import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { updateAppointmentStatusApi, type Appointment } from '../../services/api';
import { X, CheckCircle2, FileText, Stethoscope } from 'lucide-react';

interface CompleteAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

export function CompleteAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: CompleteAppointmentModalProps) {
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const patientName = appointment.patientName || (appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Patient');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateAppointmentStatusApi(appointment.id, 'COMPLETED', notes.trim() || undefined);
      toast.success(`Appointment #${appointment.id.slice(0, 8)} marked as Completed!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to complete appointment.'
        : 'Failed to connect to server.';
      toast.error(msg);
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
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Complete Consultation</h3>
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

        {/* Patient visit reminder */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
          <p className="text-slate-500 font-semibold flex items-center gap-1.5">
            <Stethoscope size={13} className="text-blue-500" />
            <span>Reason for Visit:</span>
          </p>
          <p className="text-slate-800 font-medium pl-5">{appointment.reason || 'General checkup'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Doctor Consultation Notes & Prescriptions (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="Enter diagnosis, clinical notes, treatment plan, or follow-up recommendations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium transition-all"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-70 shadow-xs"
            >
              <CheckCircle2 size={14} />
              <span>{isSubmitting ? 'Saving...' : 'Mark as Completed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
