import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  checkHealthApi,
  getAuditLogsApi,
  getUsersApi,
  getAppointmentsApi,
  type AuditLog
} from '../services/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { type DashboardTab } from '../components/layout/Sidebar';
import { DashboardOverview } from '../components/DashboardOverview';
import { UserManagementView } from '../components/UserManagementView';
import { EstablishmentsView } from '../components/EstablishmentsView';
import { AppointmentsView } from '../components/AppointmentsView';
import { AuditLogsView } from '../components/AuditLogsView';
import { SettingsView } from '../components/SettingsView';

// Doctor Specific Views
import { DoctorDashboardOverview } from '../components/doctor/DoctorDashboardOverview';
import { DoctorAppointmentsView } from '../components/doctor/DoctorAppointmentsView';
import { DoctorScheduleView } from '../components/doctor/DoctorScheduleView';
import { DoctorTransfersView } from '../components/doctor/DoctorTransfersView';

// Establishment Admin Specific Views
import { EstablishmentAdminDashboardOverview } from '../components/establishmentAdmin/EstablishmentAdminDashboardOverview';
import { EstablishmentAdminDoctorsView } from '../components/establishmentAdmin/EstablishmentAdminDoctorsView';
import { EstablishmentProfileView } from '../components/establishmentAdmin/EstablishmentProfileView';

// Patient Specific Views
import { PatientDashboardOverview } from '../components/patient/PatientDashboardOverview';
import { PatientBookingView } from '../components/patient/PatientBookingView';
import { PatientAppointmentsView } from '../components/patient/PatientAppointmentsView';
import { PatientTransfersView } from '../components/patient/PatientTransfersView';
import { PatientNotificationsView } from '../components/patient/PatientNotificationsView';

export function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [healthStatus, setHealthStatus] = useState<{ isOnline: boolean }>({ isOnline: false });

  // Metric counts
  const [totalUsersCount, setTotalUsersCount] = useState<number | null>(null);
  const [totalAppointmentsCount, setTotalAppointmentsCount] = useState<number | null>(null);

  // Dynamic Audit Logs State & Pagination
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotalCount, setAuditTotalCount] = useState<number>(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Check system health status, metric counts & fetch live audit logs
  useEffect(() => {
    async function checkServerHealth() {
      try {
        const res = await checkHealthApi();
        if (res && res.status === 'ok') {
          setHealthStatus({ isOnline: true });
        } else {
          setHealthStatus({ isOnline: false });
        }
      } catch {
        setHealthStatus({ isOnline: false });
      }
    }

    async function fetchMetrics() {
      try {
        const userRes = await getUsersApi({ limit: 1 });
        if (userRes) {
          if (userRes.data?.meta?.totalCount !== undefined) {
            setTotalUsersCount(userRes.data.meta.totalCount);
          } else if (Array.isArray(userRes.data?.users)) {
            setTotalUsersCount(userRes.data.users.length);
          }
        }

        const appRes = await getAppointmentsApi({ limit: 1 });
        if (appRes) {
          if ((appRes.data as any)?.meta?.totalCount !== undefined) {
            setTotalAppointmentsCount((appRes.data as any).meta.totalCount);
          } else if (Array.isArray((appRes.data as any)?.appointments)) {
            setTotalAppointmentsCount((appRes.data as any).appointments.length);
          }
        }
      } catch {
        // Silently ignore
      }
    }

    async function fetchLogs() {
      setIsLoadingLogs(true);
      try {
        const res = await getAuditLogsApi({ page: auditPage, limit: auditPageSize });
        if (res?.data) {
          if (Array.isArray((res.data as any).logs)) {
            setRecentAuditLogs((res.data as any).logs);
            setAuditTotalCount((res.data as any).meta?.totalCount || (res.data as any).logs.length);
          } else if (Array.isArray((res.data as any).auditLogs)) {
            setRecentAuditLogs((res.data as any).auditLogs);
            setAuditTotalCount((res.data as any).meta?.totalCount || (res.data as any).auditLogs.length);
          } else if (Array.isArray(res.data)) {
            setRecentAuditLogs(res.data as any);
            setAuditTotalCount((res.data as any).length);
          }
        }
      } catch {
        // Fallback
      } finally {
        setIsLoadingLogs(false);
      }
    }

    checkServerHealth();
    if (user?.role === 'SUPER_ADMIN') {
      fetchMetrics();
      fetchLogs();
    } else {
      setIsLoadingLogs(false);
    }

    const interval = setInterval(checkServerHealth, 30000);
    return () => clearInterval(interval);
  }, [user, auditPage, auditPageSize]);

  // Render view based on active selected tab and user role
  const renderActiveView = () => {
    // 1. DOCTOR ROLE VIEWS
    if (user?.role === 'DOCTOR') {
      switch (activeTab) {
        case 'today':
          return <DoctorAppointmentsView currentUser={user} defaultTab="TODAY" />;
        case 'upcoming':
          return <DoctorAppointmentsView currentUser={user} defaultTab="UPCOMING" />;
        case 'completed':
          return <DoctorAppointmentsView currentUser={user} defaultTab="COMPLETED" />;
        case 'cancelled':
          return <DoctorAppointmentsView currentUser={user} defaultTab="CANCELLED" />;
        case 'appointments':
          return <DoctorAppointmentsView currentUser={user} defaultTab="ALL" />;
        case 'schedule':
          return <DoctorScheduleView />;
        case 'transfers':
          return <DoctorTransfersView currentUser={user} />;
        case 'overview':
        default:
          return (
            <DoctorDashboardOverview
              user={user}
              onNavigateTab={setActiveTab}
            />
          );
      }
    }

    // 2. PATIENT ROLE VIEWS
    if (user?.role === 'PATIENT') {
      switch (activeTab) {
        case 'book':
          return <PatientBookingView currentUser={user} onBookingSuccess={() => setActiveTab('appointments')} />;
        case 'appointments':
          return <PatientAppointmentsView currentUser={user} onNavigateTab={setActiveTab} />;
        case 'transfers':
          return <PatientTransfersView currentUser={user} />;
        case 'notifications':
          return <PatientNotificationsView currentUser={user} />;
        case 'settings':
          return <SettingsView user={user} />;
        case 'overview':
        default:
          return <PatientDashboardOverview user={user} onNavigateTab={setActiveTab} />;
      }
    }

    // 3. ESTABLISHMENT_ADMIN ROLE VIEWS
    if (user?.role === 'ESTABLISHMENT_ADMIN') {
      switch (activeTab) {
        case 'doctors':
          return <EstablishmentAdminDoctorsView currentUser={user} />;
        case 'appointments':
          return <AppointmentsView />;
        case 'establishment':
          return <EstablishmentProfileView currentUser={user} />;
        case 'settings':
          return <SettingsView user={user} />;
        case 'overview':
        default:
          return <EstablishmentAdminDashboardOverview user={user} onNavigateTab={setActiveTab} />;
      }
    }

    // 4. SUPER_ADMIN / DEFAULT VIEWS
    switch (activeTab) {
      case 'establishments':
        return <EstablishmentsView currentUser={user} />;
      case 'users':
        return <UserManagementView currentUser={user} />;
      case 'appointments':
        return <AppointmentsView />;
      case 'audit':
        return (
          <AuditLogsView
            recentAuditLogs={recentAuditLogs}
            auditTotalCount={auditTotalCount}
            auditPage={auditPage}
            auditPageSize={auditPageSize}
            setAuditPage={setAuditPage}
            setAuditPageSize={setAuditPageSize}
          />
        );
      case 'settings':
        return <SettingsView user={user} />;
      case 'overview':
      default:
        return (
          <DashboardOverview
            user={user}
            isOnline={healthStatus.isOnline}
            recentAuditLogs={recentAuditLogs}
            isLoadingLogs={isLoadingLogs}
            totalUsersCount={totalUsersCount}
            totalAppointmentsCount={totalAppointmentsCount}
            onNavigateTab={setActiveTab}
          />
        );
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      isOnline={healthStatus.isOnline}
    >
      {renderActiveView()}
    </DashboardLayout>
  );
}
