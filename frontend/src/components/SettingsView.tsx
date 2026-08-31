import { type User } from '../services/api';
import { Shield, Database } from 'lucide-react';

interface SettingsViewProps {
  user: User | null;
}

export function SettingsView({ user }: SettingsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage system preferences, user roles, and security configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {user?.role === 'PATIENT' ? 'Patient Profile' : user?.role === 'DOCTOR' ? 'Doctor Profile' : 'Administrator Profile'}
              </h3>
              <p className="text-xs text-slate-500">Current authenticated session details</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Name</span>
              <span className="font-bold text-slate-900">{user ? `${user.firstName} ${user.lastName}` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Email</span>
              <span className="font-mono text-slate-900">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Assigned Role</span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {user?.role || 'SUPER_ADMIN'}
              </span>
            </div>
          </div>
        </div>

        {/* API Configurations Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">System Environment</h3>
              <p className="text-xs text-slate-500">Backend service status and health</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Environment</span>
              <span className="font-mono text-blue-600 font-bold">Development Server</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">System Version</span>
              <span className="font-mono text-slate-900 font-bold">v1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-semibold">Health Status</span>
              <span className="font-semibold text-emerald-600">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
