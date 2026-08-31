import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getTransfersApi,
  updateTransferStatusApi,
  type Transfer,
  type TransferStatus,
  type User,
} from '../../services/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  User as UserIcon,
  Stethoscope,
  Inbox,
  Send,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface DoctorTransfersViewProps {
  currentUser: User | null;
}

export function DoctorTransfersView({ currentUser }: DoctorTransfersViewProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [activeTab, setActiveTab] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchTransfers = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const res = await getTransfersApi();
      if (res?.data?.transfers) {
        setTransfers(res.data.transfers);
      } else if (Array.isArray(res.data)) {
        setTransfers(res.data);
      } else {
        setTransfers([]);
      }
    } catch (err: unknown) {
      setTransfers([]);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setApiError(axiosErr.response?.data?.message || 'Failed to fetch transfers.');
      } else {
        setApiError('Unable to connect to backend server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const currentDoctorId = currentUser?.id;

  // Filter incoming vs outgoing
  const incomingTransfers = transfers.filter(
    (t) => t.toDoctorId === currentDoctorId || (t.toDoctor && t.toDoctor.id === currentDoctorId)
  );

  const outgoingTransfers = transfers.filter(
    (t) => t.fromDoctorId === currentDoctorId || (t.fromDoctor && t.fromDoctor.id === currentDoctorId)
  );

  const displayedTransfers = activeTab === 'INCOMING' ? incomingTransfers : outgoingTransfers;

  const handleRespondTransfer = async (
    transferId: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED'
  ) => {
    setProcessingId(transferId);
    try {
      await updateTransferStatusApi(transferId, status);
      toast.success(
        status === 'APPROVED'
          ? 'Transfer accepted! The appointment has been added to your schedule.'
          : status === 'REJECTED'
          ? 'Transfer request rejected.'
          : 'Transfer request cancelled.'
      );
      fetchTransfers();
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update transfer.'
        : 'Failed to connect to server.';
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} />
            APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} />
            REJECTED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle size={12} />
            CANCELLED
          </span>
        );
      case 'REQUESTED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            PENDING ACTION
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Appointment Transfers Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Accept incoming patient transfer requests from colleagues and track requests you've sent.
          </p>
        </div>

        <button
          onClick={fetchTransfers}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('INCOMING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'INCOMING'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Inbox size={15} />
          <span>Incoming Requests</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'INCOMING' ? 'bg-purple-800 text-purple-200' : 'bg-slate-100 text-slate-700'}`}>
            {incomingTransfers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('OUTGOING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'OUTGOING'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send size={15} />
          <span>Outgoing Requests</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'OUTGOING' ? 'bg-purple-800 text-purple-200' : 'bg-slate-100 text-slate-700'}`}>
            {outgoingTransfers.length}
          </span>
        </button>
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* TRANSFERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transfer ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>{activeTab === 'INCOMING' ? 'From Colleague' : 'To Colleague'}</TableHead>
              <TableHead>Appointment Date/Time</TableHead>
              <TableHead>Reason for Transfer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold">
                    <RefreshCw size={16} className="animate-spin text-purple-600" />
                    <span>Loading transfers...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedTransfers.length > 0 ? (
              displayedTransfers.map((tr) => {
                const patientName = tr.patient
                  ? `${tr.patient.firstName} ${tr.patient.lastName}`
                  : tr.appointment?.patientName || 'Patient';

                const colleague = activeTab === 'INCOMING' ? tr.fromDoctor : tr.toDoctor;
                const colleagueName = colleague
                  ? `Dr. ${colleague.firstName} ${colleague.lastName}`
                  : 'Doctor Colleague';

                const appDate = tr.appointment?.appointmentDate || tr.appointment?.date || 'N/A';
                const isPending = tr.status === 'REQUESTED';

                return (
                  <TableRow key={tr.id}>
                    <TableCell className="font-mono text-slate-500 font-semibold text-xs">
                      #{tr.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {patientName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{patientName}</p>
                          <p className="text-[11px] text-slate-400">{tr.patient?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Stethoscope size={14} className="text-purple-500 shrink-0" />
                        <span className="font-semibold text-slate-800 text-xs">{colleagueName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium whitespace-nowrap">
                      {appDate.includes('T') ? appDate.split('T')[0] : appDate} ({tr.appointment?.startTime || '10:00'})
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs max-w-xs truncate" title={tr.reason}>
                      {tr.reason}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(tr.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {activeTab === 'INCOMING' ? (
                        isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Accept Button */}
                            <button
                              onClick={() => handleRespondTransfer(tr.id, 'APPROVED')}
                              disabled={processingId === tr.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                              title="Accept & Add to my schedule"
                            >
                              <Check size={13} />
                              <span>Accept</span>
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => handleRespondTransfer(tr.id, 'REJECTED')}
                              disabled={processingId === tr.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                              title="Reject Transfer"
                            >
                              <X size={13} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Completed</span>
                        )
                      ) : (
                        isPending ? (
                          <button
                            onClick={() => handleRespondTransfer(tr.id, 'CANCELLED')}
                            disabled={processingId === tr.id}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Cancel Request
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No actions</span>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  {activeTab === 'INCOMING'
                    ? 'No incoming transfer requests from colleagues.'
                    : 'No outgoing transfer requests sent.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
