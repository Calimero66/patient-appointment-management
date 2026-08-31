import { useState, useEffect } from 'react';
import { getMyPatientsApi, type User as UserType } from '../../services/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';
import {
  User as UserIcon,
  Search,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { PatientDetailsModal } from './PatientDetailsModal';

export function DoctorPatientsView() {
  const [patients, setPatients] = useState<UserType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<UserType | null>(null);

  const fetchPatients = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const res = await getMyPatientsApi({
        search: searchTerm.trim() || undefined,
      });

      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.patients || [];
        setPatients(list);
        setTotalCount(res.data && !Array.isArray(res.data) ? res.data.meta?.totalCount || list.length : list.length);
      } else {
        setPatients([]);
        setTotalCount(0);
      }
    } catch (err: unknown) {
      setPatients([]);
      setTotalCount(0);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setApiError(axiosErr.response?.data?.message || 'Failed to fetch patients.');
      } else {
        setApiError('Unable to connect to backend server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Patients Directory {totalCount > 0 && <span className="text-xs font-normal text-slate-500">({totalCount} total)</span>}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Directory of patients who have consulted with you or have upcoming visits.
          </p>
        </div>

        <button
          onClick={fetchPatients}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900">{patients.length}</strong> patients
        </div>
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* PATIENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold">
                    <RefreshCw size={16} className="animate-spin text-blue-600" />
                    <span>Loading patient records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : patients.length > 0 ? (
              patients.map((p) => {
                const name = `${p.firstName} ${p.lastName}`.trim();
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {p.firstName ? p.firstName.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <span className="font-bold text-slate-900 text-xs">{name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {p.email}
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {p.phone || 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs capitalize">
                      {p.gender || 'Not specified'}
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString([], { dateStyle: 'medium' }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
                        title="View Medical Profile"
                      >
                        <Eye size={13} />
                        <span>View Profile</span>
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                  No patient records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Patient Profile Modal */}
      <PatientDetailsModal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        patient={selectedPatient}
      />
    </div>
  );
}
