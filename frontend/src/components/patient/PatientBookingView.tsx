import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  Clock,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Info,
  Building2
} from 'lucide-react';
import {
  getEstablishmentsApi,
  getDoctorsApi,
  getDoctorScheduleApi,
  bookAppointmentApi,
  type Establishment,
  type User,
  type DoctorSchedule,
  type DoctorScheduleException
} from '../../services/api';

interface PatientBookingViewProps {
  currentUser?: User | null;
  onBookingSuccess?: () => void;
}

export function PatientBookingView({ onBookingSuccess }: PatientBookingViewProps) {
  // 1. Establishments State
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [searchEstablishment, setSearchEstablishment] = useState('');
  const [isLoadingEstablishments, setIsLoadingEstablishments] = useState(true);

  // 2. Doctors State
  const [doctors, setDoctors] = useState<User[]>([]);
  const [searchDoctor, setSearchDoctor] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  // 3. Doctor Schedule & Slots
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorSchedule[]>([]);
  const [doctorExceptions, setDoctorExceptions] = useState<DoctorScheduleException[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [reason, setReason] = useState('');

  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // 1. Load active establishments on mount
  useEffect(() => {
    async function loadEstablishments() {
      setIsLoadingEstablishments(true);
      try {
        const res = await getEstablishmentsApi({ limit: 100 });
        const list = res?.data?.establishments || [];
        const activeList = list.filter((e) => e.isActive !== false);
        setEstablishments(activeList);
        if (activeList.length > 0) {
          setSelectedEstablishment(activeList[0]);
        }
      } catch {
        toast.error('Failed to load clinic / establishment list');
      } finally {
        setIsLoadingEstablishments(false);
      }
    }
    loadEstablishments();

    // Default to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // 2. Fetch doctors belonging to the selected establishment
  useEffect(() => {
    if (!selectedEstablishment) {
      setDoctors([]);
      setSelectedDoctor(null);
      return;
    }

    const currentEstId = selectedEstablishment.id;

    async function loadDoctorsForEstablishment() {
      setIsLoadingDoctors(true);
      try {
        const res = await getDoctorsApi({
          establishmentId: currentEstId,
          limit: 100,
        });
        const docs = Array.isArray(res?.data)
          ? res.data
          : (res?.data as any)?.doctors || [];
        setDoctors(docs);
        if (docs.length > 0) {
          setSelectedDoctor(docs[0]);
        } else {
          setSelectedDoctor(null);
        }
      } catch {
        toast.error('Failed to load doctors for this establishment');
      } finally {
        setIsLoadingDoctors(false);
      }
    }
    loadDoctorsForEstablishment();
  }, [selectedEstablishment]);

  // 3. Fetch doctor schedule when selectedDoctor or selectedEstablishment changes
  useEffect(() => {
    if (!selectedDoctor || !selectedEstablishment) {
      setDoctorSchedules([]);
      setDoctorExceptions([]);
      return;
    }

    const currentDocId = selectedDoctor.id;
    const currentEstId = selectedEstablishment.id;

    async function loadDoctorAvailability() {
      setIsLoadingSlots(true);
      try {
        const res = await getDoctorScheduleApi(currentDocId, currentEstId);
        if (res?.data) {
          setDoctorSchedules(res.data.schedules || []);
          setDoctorExceptions(res.data.exceptions || []);
        }
      } catch {
        // Fallback default schedule
        setDoctorSchedules([]);
        setDoctorExceptions([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    loadDoctorAvailability();
  }, [selectedDoctor, selectedEstablishment]);

  // 4. Compute available 30-min slots for selectedDate
  useEffect(() => {
    if (!selectedDate || !selectedDoctor) {
      setAvailableSlots([]);
      return;
    }

    // Check if selectedDate falls on an exception (Vacation, Absence)
    const isException = doctorExceptions.some((e) => e.exceptionDate === selectedDate);
    if (isException) {
      setAvailableSlots([]);
      return;
    }

    // Get day of week (0=Sun, 1=Mon, ..., 6=Sat)
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();

    // Find doctor shift for this day of week
    const shift = doctorSchedules.find((s) => s.dayOfWeek === dayOfWeek && s.isActive);

    let startHour = 9;
    let endHour = 17;

    if (shift) {
      const [sh] = shift.startTime.split(':').map(Number);
      const [eh] = shift.endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(eh) && eh > sh) {
        startHour = sh;
        endHour = eh;
      }
    }

    const slots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }

    setAvailableSlots(slots);
    if (slots.length > 0) {
      setSelectedSlot(slots[0]);
    } else {
      setSelectedSlot('');
    }
  }, [selectedDate, doctorSchedules, doctorExceptions, selectedDoctor]);

  const filteredEstablishments = establishments.filter((est) => {
    const q = searchEstablishment.toLowerCase();
    const name = est.name.toLowerCase();
    const city = (est.city || '').toLowerCase();
    const addr = est.address.toLowerCase();
    return name.includes(q) || city.includes(q) || addr.includes(q);
  });

  const filteredDoctors = doctors.filter((doc) => {
    const q = searchDoctor.toLowerCase();
    const fullName = `${doc.firstName} ${doc.lastName}`.toLowerCase();
    const bio = (doc.bio || '').toLowerCase();
    const license = (doc.licenseNumber || '').toLowerCase();
    return fullName.includes(q) || bio.includes(q) || license.includes(q);
  });

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstablishment) {
      toast.error('Please select a clinic / establishment');
      return;
    }
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    if (!selectedDate) {
      toast.error('Please select an appointment date');
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select a consultation time slot');
      return;
    }

    // Calculate 30 min end time
    const [h, min] = selectedSlot.split(':').map(Number);
    const endMinutes = min + 30;
    const endH = endMinutes >= 60 ? h + 1 : h;
    const endM = endMinutes >= 60 ? 0 : 30;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    setIsBooking(true);
    try {
      await bookAppointmentApi({
        establishmentId: selectedEstablishment.id,
        doctorId: selectedDoctor.id,
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        endTime,
        reason: reason.trim() || 'General Medical Consultation',
      });

      toast.success(
        `Appointment booked with Dr. ${selectedDoctor.lastName} at ${selectedEstablishment.name}!`
      );
      setReason('');
      if (onBookingSuccess) onBookingSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Find a Clinic & Book Appointment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Step 1: Choose a medical establishment • Step 2: Select an available doctor • Step 3: Pick a date and time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* STEP 1 & 2: LEFT COLUMN (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* STEP 1: CHOOSE ESTABLISHMENT */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" />
                <span>1. Select Establishment / Clinic</span>
              </h2>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {filteredEstablishments.length} Available
              </span>
            </div>

            {/* Search Establishment Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search clinic by name or city..."
                value={searchEstablishment}
                onChange={(e) => setSearchEstablishment(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
              />
            </div>

            {/* Establishments List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {isLoadingEstablishments ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading clinics...</div>
              ) : filteredEstablishments.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No establishments found.
                </div>
              ) : (
                filteredEstablishments.map((est) => {
                  const isSelected = selectedEstablishment?.id === est.id;
                  return (
                    <div
                      key={est.id}
                      onClick={() => setSelectedEstablishment(est)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          <Building2 size={15} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{est.name}</h4>
                          <p className="text-[10px] text-slate-500 truncate">
                            {est.city ? `${est.city} • ` : ''}{est.address}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* STEP 2: CHOOSE DOCTOR BELONGING TO SELECTED ESTABLISHMENT */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope size={16} className="text-blue-600" />
                <span>2. Select Doctor at {selectedEstablishment?.name || 'Clinic'}</span>
              </h2>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {filteredDoctors.length} Doctors
              </span>
            </div>

            {/* Search Doctor Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search doctor by name or specialty..."
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
              />
            </div>

            {/* Doctor List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {isLoadingDoctors ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading doctors for this establishment...</div>
              ) : filteredDoctors.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                  <p className="font-bold text-slate-600">No doctors registered at this establishment</p>
                  <p className="text-[11px] text-slate-400">Please choose another clinic above.</p>
                </div>
              ) : (
                filteredDoctors.map((doc) => {
                  const isSelected = selectedDoctor?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          <Stethoscope size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">
                            Dr. {doc.firstName} {doc.lastName}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {doc.licenseNumber ? `License: ${doc.licenseNumber}` : 'Certified Specialist'}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* STEP 3 & 4: RIGHT COLUMN - DATE, SLOT PICKER & BOOKING FORM (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">3. Choose Date & Time Slot</h2>
            <p className="text-xs text-slate-500">
              {selectedDoctor && selectedEstablishment
                ? `Booking with Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName} at ${selectedEstablishment.name}`
                : 'Select clinic and doctor to view available schedule slots'}
            </p>
          </div>

          <form onSubmit={handleBook} className="space-y-4">
            {/* Date Picker Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Consultation Date *</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                required
              />
            </div>

            {/* Time Slot Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Available Consultation Slots *</label>
                <span className="text-[11px] text-slate-400">30 min slots</span>
              </div>

              {isLoadingSlots ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Checking schedule...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>
                    No available slots on this date (Doctor off-duty or on leave at this clinic). Please select another date.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => {
                    const isSlotSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSlotSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Clock size={12} />
                        <span>{slot}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Consultation Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Reason for Consultation (Optional)</label>
              <textarea
                rows={2}
                placeholder="E.g., General checkup, prescription renewal, symptoms follow-up..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium resize-none"
              />
            </div>

            {/* Booking Summary Box */}
            {selectedEstablishment && selectedDoctor && selectedDate && selectedSlot && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Info size={14} className="text-blue-600" />
                  <span>Appointment Summary</span>
                </p>
                <div className="text-[11px] text-blue-800 space-y-0.5">
                  <p><strong>Establishment:</strong> {selectedEstablishment.name} ({selectedEstablishment.city || selectedEstablishment.address})</p>
                  <p><strong>Doctor:</strong> Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
                  <p><strong>Schedule:</strong> {selectedDate} at {selectedSlot}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isBooking || !selectedEstablishment || !selectedDoctor || !selectedDate || !selectedSlot}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
            >
              <CheckCircle2 size={16} />
              <span>{isBooking ? 'Processing Booking...' : 'Confirm & Book Appointment'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
