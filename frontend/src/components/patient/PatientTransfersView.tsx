import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { getTransfersApi, type Transfer, type User } from '../../services/api';

interface PatientTransfersViewProps {
  currentUser?: User | null;
  onNavigateTab?: (tab: any) => void;
}

export function PatientTransfersView({ currentUser, onNavigateTab }: PatientTransfersViewProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await getTransfersApi({ limit: 50 });
      const list = res?.data?.transfers || [];
      setTransfers(list);
    } catch {
      toast.error('Failed to load transfers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={13} /> Approved</span>;
      case 'REQUESTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock size={13} /> Requested</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><XCircle size={13} /> Rejected</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700"><XCircle size={13} /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">My Transfer Requests</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track the status of consultation reassignment requests to other medical specialists or clinics.
          </p>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('appointments')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <ArrowRightLeft size={14} />
            <span>Transfer an Appointment</span>
          </button>
        )}
      </div>

      {/* Helpful Info Tip */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
        <span className="shrink-0 text-base">💡</span>
        <span>
          <strong>How Transfers Work:</strong> A transfer requires an active booked consultation. To request a transfer to a different doctor or clinic, go to <strong>My Appointments</strong> and click the <strong>"Request Transfer"</strong> button on your scheduled booking.
        </span>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
            Loading transfer requests...
          </div>
        ) : transfers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Transfer Requests Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                You haven't requested any appointment transfers yet. If you have an upcoming booking, you can transfer it to another doctor or clinic directly from your appointments list.
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('appointments')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                <span>View My Appointments</span>
              </button>
            )}
          </div>
        ) : (
          transfers.map((tr) => (
            <div
              key={tr.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    <ArrowRightLeft size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Transfer to Dr. {tr.toDoctor?.firstName} {tr.toDoctor?.lastName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      From Dr. {tr.fromDoctor?.firstName} {tr.fromDoctor?.lastName}
                    </p>
                  </div>
                </div>

                <div>{getStatusBadge(tr.status)}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Appointment</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {tr.appointment?.appointmentDate || 'Scheduled date'} at {tr.appointment?.startTime || 'Scheduled time'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Reason</span>
                  <span className="font-medium text-slate-600 block mt-0.5">
                    {tr.reason}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
