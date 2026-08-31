import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getMyScheduleApi,
  updateMyScheduleApi,
  createScheduleExceptionApi,
  deleteScheduleExceptionApi,
  type DoctorSchedule,
  type DoctorScheduleException,
  type ScheduleExceptionType,
} from '../../services/api';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sun,
  Umbrella,
  Plane,
  CalendarOff,
  Save,
  Check
} from 'lucide-react';

const DAYS_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function DoctorScheduleView() {
  const [weeklySchedules, setWeeklySchedules] = useState<
    Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>
  >([]);
  const [exceptions, setExceptions] = useState<DoctorScheduleException[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Add Exception Form State
  const [rangeMode, setRangeMode] = useState<'single' | 'range'>('single');
  const [exceptionDate, setExceptionDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exceptionType, setExceptionType] = useState<ScheduleExceptionType>('VACATION');
  const [exceptionReason, setExceptionReason] = useState('');
  const [isAddingException, setIsAddingException] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<{
    count: number;
    appointments: Array<{
      id: string;
      patientName: string;
      appointmentDate: string;
      startTime: string;
      status: string;
    }>;
  } | null>(null);

  const fetchScheduleData = async () => {
    setIsLoading(true);
    try {
      const res = await getMyScheduleApi();
      if (res?.data) {
        const rawSchedules = res.data.schedules || [];
        // Ensure 7 days array
        const sevenDays = Array.from({ length: 7 }, (_, dayIndex) => {
          const found = rawSchedules.find((s) => s.dayOfWeek === dayIndex);
          if (found) {
            return {
              dayOfWeek: dayIndex,
              startTime: found.startTime || '09:00',
              endTime: found.endTime || '17:00',
              isActive: found.isActive ?? (dayIndex >= 1 && dayIndex <= 5),
            };
          }
          return {
            dayOfWeek: dayIndex,
            startTime: '09:00',
            endTime: '17:00',
            isActive: dayIndex >= 1 && dayIndex <= 5,
          };
        });

        setWeeklySchedules(sevenDays);
        setExceptions(res.data.exceptions || []);
      }
    } catch {
      toast.error('Failed to load doctor schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const handleDayToggle = (dayOfWeek: number) => {
    setWeeklySchedules((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, isActive: !item.isActive } : item
      )
    );
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setWeeklySchedules((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveWeeklySchedule = async () => {
    setIsSavingSchedule(true);
    try {
      await updateMyScheduleApi(weeklySchedules);
      toast.success('Weekly availability schedule updated successfully!');
      fetchScheduleData();
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save schedule.'
        : 'Failed to connect to server.';
      toast.error(msg);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);

    if (rangeMode === 'single' && !exceptionDate) {
      toast.error('Please select a date.');
      return;
    }
    if (rangeMode === 'range' && (!startDate || !endDate)) {
      toast.error('Please select both start date and end date.');
      return;
    }
    if (rangeMode === 'range' && startDate > endDate) {
      toast.error('Start date must be before or equal to end date.');
      return;
    }

    setIsAddingException(true);
    try {
      const payload = rangeMode === 'single'
        ? {
            exceptionDate,
            type: exceptionType,
            reason: exceptionReason.trim() || undefined,
          }
        : {
            startDate,
            endDate,
            type: exceptionType,
            reason: exceptionReason.trim() || undefined,
          };

      const res = await createScheduleExceptionApi(payload);

      const count = res?.data?.totalDays || 1;
      toast.success(count > 1 ? `Time-off registered for ${count} days!` : 'Time-off registered successfully!');

      if (res?.data?.conflictingAppointmentsCount && res.data.conflictingAppointmentsCount > 0) {
        setConflictWarning({
          count: res.data.conflictingAppointmentsCount,
          appointments: res.data.conflictingAppointments || [],
        });
      }

      setExceptionDate('');
      setStartDate('');
      setEndDate('');
      setExceptionReason('');
      fetchScheduleData();
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to add time-off.'
        : 'Failed to connect to server.';
      toast.error(msg);
    } finally {
      setIsAddingException(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      await deleteScheduleExceptionApi(id);
      toast.success('Time-off removed.');
      fetchScheduleData();
    } catch {
      toast.error('Failed to remove time-off.');
    }
  };

  const getExceptionIcon = (type: string) => {
    switch (type) {
      case 'VACATION':
        return <Plane size={15} className="text-blue-500" />;
      case 'SICK_LEAVE':
        return <CalendarOff size={15} className="text-rose-500" />;
      case 'CONFERENCE':
      case 'TRAINING':
        return <Sun size={15} className="text-amber-500" />;
      case 'HOLIDAY':
        return <Sun size={15} className="text-emerald-500" />;
      case 'ABSENCE':
      case 'PERSONAL':
        return <CalendarOff size={15} className="text-orange-500" />;
      case 'UNAVAILABLE':
      default:
        return <Umbrella size={15} className="text-purple-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Schedule & Availability Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure your standard consultation hours and register planned leaves or vacations.
          </p>
        </div>

        <button
          onClick={fetchScheduleData}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* WEEKLY AVAILABILITY HOURS (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Weekly Working Hours</h3>
                <p className="text-xs text-slate-500">Set regular consultation shifts per day of week</p>
              </div>
            </div>
            <button
              onClick={handleSaveWeeklySchedule}
              disabled={isSavingSchedule}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-70 shadow-xs"
            >
              <Save size={15} />
              <span>{isSavingSchedule ? 'Saving...' : 'Save Availability'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {weeklySchedules.map((day) => {
              const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
              return (
                <div
                  key={day.dayOfWeek}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    day.isActive
                      ? 'bg-white border-slate-200/90 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-100 opacity-70'
                  }`}
                >
                  {/* Day Checkbox & Name */}
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      id={`day-${day.dayOfWeek}`}
                      checked={day.isActive}
                      onChange={() => handleDayToggle(day.dayOfWeek)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${day.dayOfWeek}`}
                      className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{DAYS_NAMES[day.dayOfWeek]}</span>
                      {isWeekend && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-normal">
                          Weekend
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Time Inputs */}
                  {day.isActive ? (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">From:</span>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) =>
                            handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)
                          }
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>

                      <span className="text-slate-300 font-bold">—</span>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">To:</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) =>
                            handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)
                          }
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-medium italic">
                      Off Duty / Not Available
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TIME-OFF & EXCEPTIONS MANAGER (1 Column) */}
        <div className="space-y-6">
          {/* Add Exception Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Time-Off</h3>
                <p className="text-xs text-slate-500">Block specific vacation or absence days</p>
              </div>
            </div>

            {/* Mode Selector Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setRangeMode('single')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rangeMode === 'single'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Single Day
              </button>
              <button
                type="button"
                onClick={() => setRangeMode('range')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rangeMode === 'range'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Date Range (Multiple Days)
              </button>
            </div>

            <form onSubmit={handleAddException} className="space-y-3.5">
              {rangeMode === 'single' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Date *</label>
                  <input
                    type="date"
                    value={exceptionDate}
                    onChange={(e) => setExceptionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-medium"
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Start Date *</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">End Date *</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-medium"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Time-Off Type *</label>
                <select
                  value={exceptionType}
                  onChange={(e) => setExceptionType(e.target.value as ScheduleExceptionType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-semibold"
                >
                  <option value="VACATION">🏖️ Vacation / Annual Leave</option>
                  <option value="SICK_LEAVE">🩺 Medical / Sick Leave</option>
                  <option value="CONFERENCE">🎓 Medical Conference / Training</option>
                  <option value="ABSENCE">👤 Personal Absence</option>
                  <option value="HOLIDAY">🎉 Public Holiday</option>
                  <option value="UNAVAILABLE">⛔ Unavailable / Off-duty</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Reason / Note (Optional)</label>
                <input
                  type="text"
                  placeholder="E.g., Medical symposium, family vacation..."
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isAddingException}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 shadow-xs"
              >
                <Plus size={15} />
                <span>{isAddingException ? 'Registering...' : 'Register Time-Off'}</span>
              </button>
            </form>

            {/* Conflict Warning Banner if appointments already exist on selected dates */}
            {conflictWarning && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span>
                    Warning: {conflictWarning.count} existing appointment(s) found during this time-off period!
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  The following scheduled appointments may need to be transferred or rescheduled:
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto pt-1">
                  {conflictWarning.appointments.map((app) => (
                    <div key={app.id} className="p-1.5 bg-white/80 rounded border border-amber-200/80 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800">{app.patientName}</span>
                      <span className="text-slate-500">{app.appointmentDate} at {app.startTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Exceptions List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Scheduled Time-Off</h3>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {exceptions.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {exceptions.length > 0 ? (
                exceptions.map((exc) => (
                  <div
                    key={exc.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        {getExceptionIcon(exc.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{exc.exceptionDate}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {exc.type} {exc.reason ? `— ${exc.reason}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteException(exc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Delete time-off"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">
                  No upcoming time-off registered.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
