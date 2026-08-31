import { type AuditLog } from '../services/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLogsViewProps {
  recentAuditLogs: AuditLog[];
  auditTotalCount: number;
  auditPage: number;
  auditPageSize: number;
  setAuditPage: React.Dispatch<React.SetStateAction<number>>;
  setAuditPageSize: React.Dispatch<React.SetStateAction<number>>;
}

export function AuditLogsView({
  recentAuditLogs,
  auditTotalCount,
  auditPage,
  auditPageSize,
  setAuditPage,
  setAuditPageSize
}: AuditLogsViewProps) {
  const auditTotalPages = Math.max(1, Math.ceil(auditTotalCount / auditPageSize));
  const auditStartItem = auditTotalCount === 0 ? 0 : (auditPage - 1) * auditPageSize + 1;
  const auditEndItem = Math.min(auditPage * auditPageSize, auditTotalCount);

  const getLogUserDisplay = (log: AuditLog) => {
    if (log.userName) return log.userName;
    if (log.userEmail) return log.userEmail;
    if (typeof log.user === 'string') return log.user;
    if (log.user && typeof log.user === 'object') {
      const name = `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim();
      return name || log.user.email || 'System User';
    }
    return 'System User';
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time security and operational event log stream</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Log ID</TableHead>
              <TableHead>User / Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentAuditLogs.length > 0 ? (
              recentAuditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-slate-400">#{log.id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{getLogUserDisplay(log)}</TableCell>
                  <TableCell className="text-slate-600">{log.action}</TableCell>
                  <TableCell className="text-slate-400">{formatTimestamp(log.createdAt || log.timestamp)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={12} />
                      {log.status || 'COMPLETED'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                  No audit logs recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* AUDIT LOGS PAGINATION FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-slate-900">{auditStartItem}</strong> to <strong className="text-slate-900">{auditEndItem}</strong> of <strong className="text-slate-900">{auditTotalCount}</strong> audit logs</span>
            <span className="text-slate-300">|</span>
            <label className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={auditPageSize}
                onChange={(e) => {
                  setAuditPageSize(Number(e.target.value));
                  setAuditPage(1);
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
              onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
              disabled={auditPage === 1}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold cursor-pointer transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: auditTotalPages }, (_, i) => i + 1).slice(
                Math.max(0, auditPage - 3),
                Math.min(auditTotalPages, auditPage + 2)
              ).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setAuditPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    auditPage === pageNum
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
              disabled={auditPage >= auditTotalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
