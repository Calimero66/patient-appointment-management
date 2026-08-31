import { type Appointment, type User as UserType } from '../../services/api';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: UserType | { id: string; firstName: string; lastName: string; email: string; phone?: string; dateOfBirth?: string | null; gender?: string | null; address?: string | null } | null;
  appointment?: Appointment | null;
}

export function PatientDetailsModal({
  isOpen,
  onClose,
  patient,
  appointment,
}: PatientDetailsModalProps) {
  if (!isOpen) return null;

  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : appointment?.patientName || 'Patient Details';

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not provided';
    try {
      return new Date(dateStr).toLocaleDateString([], { dateStyle: 'long' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{patientName}</h3>
              <p className="text-xs text-slate-500">Patient Medical Profile</p>
            </div>
          </div>
          <button
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Patient Profile Content */}
        <div className="space-y-4 text-xs">
          {/* Identity banner */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
              {patient?.firstName ? patient.firstName.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-slate-900 truncate">{patientName}</h4>
              <p className="text-slate-500 font-mono text-[11px] truncate">ID: #{patient?.id ? String(patient.id).slice(0, 10) : 'N/A'}</p>
            </div>
            {patient?.gender && (
              <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] capitalize">
                {patient.gender}
              </span>
            )}
          </div>

          {/* Contact & Personal Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                <Mail size={12} />
                <span>Email Address</span>
              </div>
              <p className="font-medium text-slate-800 break-all">{patient?.email || 'N/A'}</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                <Phone size={12} />
                <span>Phone Number</span>
              </div>
              <p className="font-medium text-slate-800">{patient?.phone || 'Not provided'}</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                <Calendar size={12} />
                <span>Date of Birth</span>
              </div>
              <p className="font-medium text-slate-800">{formatDate(patient?.dateOfBirth)}</p>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                <MapPin size={12} />
                <span>Address</span>
              </div>
              <p className="font-medium text-slate-800 truncate">{patient?.address || 'Not provided'}</p>
            </div>
          </div>

          {/* Current Consultation Details (if opened from an appointment) */}
          {appointment && (
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-blue-100/80">
                <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-600" />
                  Appointment Details
                </span>
                <span className="font-mono text-blue-700 text-[11px] font-semibold">
                  #{appointment.id.slice(0, 8)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Scheduled Date:</span>
                  <p className="font-semibold text-slate-800">{formatDate(appointment.appointmentDate || appointment.date)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Scheduled Time:</span>
                  <p className="font-semibold text-slate-800">{appointment.startTime || '10:00'} - {appointment.endTime || '10:30'}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Reason for Visit:</span>
                <p className="p-2.5 bg-white rounded-lg border border-blue-100 text-slate-800 font-medium leading-relaxed">
                  {appointment.reason || 'No description provided.'}
                </p>
              </div>

              {appointment.notes && (
                <div>
                  <span className="text-slate-500 block text-[11px] mb-0.5">Doctor Consultation Notes:</span>
                  <p className="p-2.5 bg-white rounded-lg border border-blue-100 text-slate-800 font-medium leading-relaxed">
                    {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
