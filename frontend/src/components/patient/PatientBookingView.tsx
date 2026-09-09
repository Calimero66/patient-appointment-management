import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  Clock,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Info,
  Building2,
  ChevronRight,
  Tag
} from 'lucide-react';
import {
  getEstablishmentsApi,
  getDoctorsApi,
  getSpecialtiesApi,
  getDoctorScheduleApi,
  bookAppointmentApi,
  type Establishment,
  type User,
  type Specialty,
  type DoctorSchedule,
  type DoctorScheduleException
} from '../../services/api';

interface PatientBookingViewProps {
  currentUser?: User | null;
  onBookingSuccess?: () => void;
}

export function PatientBookingView({ onBookingSuccess }: PatientBookingViewProps) {
  // 0. Specialties State
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(true);

  // 1. Establishments State
  const [allEstablishments, setAllEstablishments] = useState<Establishment[]>([]);
  const [filteredEstablishments, setFilteredEstablishments] = useState<Establishment[]>([]);
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

  // 0. Load specialties on mount
  useEffect(() => {
    async function loadSpecialties() {
      setIsLoadingSpecialties(true);
      try {
        const res = await getSpecialtiesApi();
        const list = res?.data?.specialties || [];
        setSpecialties(list);
      } catch {
        toast.error('Failed to load specialties');
      } finally {
        setIsLoadingSpecialties(false);
      }
    }
    loadSpecialties();

    // Default to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // 1. Load ALL establishments on mount
  useEffect(() => {
    async function loadEstablishments() {
      setIsLoadingEstablishments(true);
      try {
        const res = await getEstablishmentsApi({ limit: 100 });
        const list = res?.data?.establishments || [];
        const activeList = list.filter((e) => e.isActive !== false);
        setAllEstablishments(activeList);
      } catch {
        toast.error('Failed to load clinic / establishment list');
      } finally {
        setIsLoadingEstablishments(false);
      }
    }
    loadEstablishments();
  }, []);

  // 2. When specialty changes: fetch doctors with that specialty → figure out which establishments have them
  useEffect(() => {
    setSelectedEstablishment(null);
    setSelectedDoctor(null);
    setDoctors([]);
    setFilteredEstablishments([]);

    if (!selectedSpecialty) {
      setFilteredEstablishments(allEstablishments);
      return;
    }

    async function loadDoctorsBySpecialty() {
      if (!selectedSpecialty) return;
      setIsLoadingDoctors(true);
      try {
        const res = await getDoctorsApi({ specialtyId: selectedSpecialty.id, limit: 200 });
        const docs: User[] = Array.isArray(res?.data)
          ? res.data as User[]
          : ((res?.data as any)?.doctors || []);
        setDoctors(docs);

        // Derive the set of establishment IDs that have a doctor with this specialty
        const estIds = new Set<string>();
        docs.forEach((doc) => {
          (doc.establishments || []).forEach((e) => estIds.add(e.id));
        });

        const matchingEsts = allEstablishments.filter((e) => estIds.has(e.id));
        setFilteredEstablishments(matchingEsts);

        // Auto-select first establishment if only one
        if (matchingEsts.length === 1) {
          setSelectedEstablishment(matchingEsts[0]);
        }
      } catch {
        toast.error('Failed to load doctors for this specialty');
      } finally {
        setIsLoadingDoctors(false);
      }
    }
    loadDoctorsBySpecialty();
  }, [selectedSpecialty, allEstablishments]);

  // 3. When establishment changes: filter doctors to those working in this establishment (already loaded by specialty)
  useEffect(() => {
    setSelectedDoctor(null);

    if (!selectedEstablishment) return;

    // Filter from already-loaded doctors by specialty
    const estDocs = doctors.filter((doc) =>
      (doc.establishments || []).some((e) => e.id === selectedEstablishment.id)
    );

    // If specialty not chosen: fetch by establishment
    if (!selectedSpecialty) {
      async function loadDoctorsForEstablishment() {
        if (!selectedEstablishment) return;
        setIsLoadingDoctors(true);
        try {
          const res = await getDoctorsApi({ establishmentId: selectedEstablishment.id, limit: 100 });
          const docs: User[] = Array.isArray(res?.data)
            ? res.data as User[]
            : ((res?.data as any)?.doctors || []);
          setDoctors(docs);
          if (docs.length > 0) setSelectedDoctor(docs[0]);
        } catch {
          toast.error('Failed to load doctors for this establishment');
        } finally {
          setIsLoadingDoctors(false);
        }
      }
      loadDoctorsForEstablishment();
    } else {
      if (estDocs.length > 0) setSelectedDoctor(estDocs[0]);
    }
  }, [selectedEstablishment]);

  // 4. Fetch doctor schedule when selectedDoctor or selectedEstablishment changes
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
        setDoctorSchedules([]);
        setDoctorExceptions([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    loadDoctorAvailability();
  }, [selectedDoctor, selectedEstablishment]);

  // 5. Compute available 30-min slots for selectedDate
  useEffect(() => {
    if (!selectedDate || !selectedDoctor) {
      setAvailableSlots([]);
      return;
    }

    const isException = doctorExceptions.some((e) => e.exceptionDate === selectedDate);
    if (isException) {
      setAvailableSlots([]);
      return;
    }

    const [y, m, d] = selectedDate.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
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
    if (slots.length > 0) setSelectedSlot(slots[0]);
    else setSelectedSlot('');
  }, [selectedDate, doctorSchedules, doctorExceptions, selectedDoctor]);

  // Filtered establishments list by search query
  const displayedEstablishments = (selectedSpecialty ? filteredEstablishments : allEstablishments).filter((est) => {
    const q = searchEstablishment.toLowerCase();
    const name = est.name.toLowerCase();
    const city = (est.city || '').toLowerCase();
    const addr = est.address.toLowerCase();
    return name.includes(q) || city.includes(q) || addr.includes(q);
  });

  // Filtered doctors for selected establishment
  const displayedDoctors = (() => {
    let base = selectedSpecialty && selectedEstablishment
      ? doctors.filter((doc) => (doc.establishments || []).some((e) => e.id === selectedEstablishment?.id))
      : doctors;
    const q = searchDoctor.toLowerCase();
    if (!q) return base;
    return base.filter((doc) => {
      const fullName = `${doc.firstName} ${doc.lastName}`.toLowerCase();
      const specialty = (doc.specialty?.name || doc.bio || '').toLowerCase();
      return fullName.includes(q) || specialty.includes(q) || (doc.licenseNumber || '').toLowerCase().includes(q);
    });
  })();

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstablishment) { toast.error('Please select a clinic'); return; }
    if (!selectedDoctor) { toast.error('Please select a doctor'); return; }
    if (!selectedDate) { toast.error('Please select an appointment date'); return; }
    if (!selectedSlot) { toast.error('Please select a time slot'); return; }

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
          Find a Doctor &amp; Book Appointment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Step 1: Choose a specialty • Step 2: Select a clinic • Step 3: Pick a doctor • Step 4: Choose date &amp; time.
        </p>
      </div>

      {/* STEP 0: SPECIALTY SELECTOR */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag size={16} className="text-indigo-600" />
            <span>1. Select Specialty</span>
          </h2>
          {selectedSpecialty && (
            <button
              onClick={() => { setSelectedSpecialty(null); setSelectedEstablishment(null); setSelectedDoctor(null); }}
              className="text-[11px] text-slate-500 hover:text-red-500 underline transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {isLoadingSpecialties ? (
          <div className="p-3 text-center text-xs text-slate-400">Loading specialties...</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {specialties.map((sp) => {
              const isSelected = selectedSpecialty?.id === sp.id;
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setSelectedSpecialty(isSelected ? null : sp)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <Stethoscope size={11} />
                  {sp.name}
                  {isSelected && <CheckCircle2 size={11} />}
                </button>
              );
            })}
          </div>
        )}

        {selectedSpecialty && (
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 rounded-lg px-3 py-1.5 border border-indigo-100">
            <Info size={12} />
            <span>Showing {filteredEstablishments.length} clinic(s) with a <strong>{selectedSpecialty.name}</strong></span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: STEP 2 (CLINIC) + STEP 3 (DOCTOR) */}
        <div className="lg:col-span-5 space-y-6">
          {/* STEP 2: CHOOSE ESTABLISHMENT */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" />
                <span>2. Select Clinic</span>
                {selectedSpecialty && <span className="text-[10px] text-indigo-600 font-normal">({selectedSpecialty.name})</span>}
              </h2>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {displayedEstablishments.length} Available
              </span>
            </div>

            {/* Search */}
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

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {isLoadingEstablishments ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading clinics...</div>
              ) : displayedEstablishments.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  {selectedSpecialty
                    ? `No clinics have a ${selectedSpecialty.name} yet.`
                    : 'No establishments found.'}
                </div>
              ) : (
                displayedEstablishments.map((est) => {
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
                      {isSelected ? (
                        <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-300 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* STEP 3: CHOOSE DOCTOR */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope size={16} className="text-blue-600" />
                <span>3. Select Doctor</span>
                {selectedEstablishment && (
                  <span className="text-[10px] text-slate-500 font-normal truncate max-w-[100px]">
                    @ {selectedEstablishment.name}
                  </span>
                )}
              </h2>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {displayedDoctors.length} Doctors
              </span>
            </div>

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

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {isLoadingDoctors ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading doctors...</div>
              ) : !selectedEstablishment ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Select a clinic above to see available doctors.
                </div>
              ) : displayedDoctors.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                  <p className="font-bold text-slate-600">No doctors available</p>
                  <p className="text-[11px] text-slate-400">
                    {selectedSpecialty
                      ? `No ${selectedSpecialty.name} at this clinic.`
                      : 'Please choose another clinic.'}
                  </p>
                </div>
              ) : (
                displayedDoctors.map((doc) => {
                  const isSelected = selectedDoctor?.id === doc.id;
                  const specialtyName = doc.specialty?.name || doc.bio || 'Specialist';
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
                          <p className="text-[11px] text-indigo-600 font-semibold truncate">
                            {specialtyName}
                          </p>
                          {doc.licenseNumber && (
                            <p className="text-[10px] text-slate-400">#{doc.licenseNumber}</p>
                          )}
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-300 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STEP 4 - DATE, SLOT & BOOKING */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">4. Choose Date &amp; Time Slot</h2>
            <p className="text-xs text-slate-500">
              {selectedDoctor && selectedEstablishment
                ? `Booking with Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName} — ${selectedDoctor.specialty?.name || selectedDoctor.bio || 'Specialist'} at ${selectedEstablishment.name}`
                : 'Select specialty, clinic and doctor to view available schedule slots'}
            </p>
          </div>

          <form onSubmit={handleBook} className="space-y-4">
            {/* Date Picker */}
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
                <label className="block text-xs font-bold text-slate-700">Available Slots *</label>
                <span className="text-[11px] text-slate-400">30 min slots</span>
              </div>

              {isLoadingSlots ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Checking schedule...
                </div>
              ) : !selectedDoctor ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Select a doctor to see available slots.
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>No available slots on this date. Please select another date.</span>
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

            {/* Reason */}
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

            {/* Booking Summary */}
            {selectedEstablishment && selectedDoctor && selectedDate && selectedSlot && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Info size={14} className="text-blue-600" />
                  <span>Appointment Summary</span>
                </p>
                <div className="text-[11px] text-blue-800 space-y-0.5">
                  {selectedDoctor.specialty && (
                    <p><strong>Specialty:</strong> {selectedDoctor.specialty.name}</p>
                  )}
                  <p><strong>Clinic:</strong> {selectedEstablishment.name} ({selectedEstablishment.city || selectedEstablishment.address})</p>
                  <p><strong>Doctor:</strong> Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
                  <p><strong>Schedule:</strong> {selectedDate} at {selectedSlot}</p>
                </div>
              </div>
            )}

            {/* Submit */}
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
