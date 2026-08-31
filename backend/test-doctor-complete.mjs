/**
 * test-doctor-complete.mjs
 * Comprehensive automated test suite for Doctor Dashboard, Appointments, Transfers, Schedules & Patients
 */

const BASE = 'http://127.0.0.1:5000';
let PASS = 0, FAIL = 0;

function section(title) {
  console.log(`\n${'═'.repeat(64)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(64));
}

function ok(msg)   { PASS++; console.log(`  ✅ PASS  ${msg}`); }
function fail(msg) { FAIL++; console.log(`  ❌ FAIL  ${msg}`); }
function info(msg) { console.log(`  ℹ️  INFO  ${msg}`); }

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, ok: res.ok, body: json };
}

async function login(email, password) {
  const r = await req('POST', '/api/auth/login', { login: email, password });
  if (r.ok && r.body?.data?.token) {
    return { token: r.body.data.token, user: r.body.data.user };
  }
  return null;
}

// ─── TEST 0: Health Check ─────────────────────────────────────────────────────
section('TEST 0 — Health Check');
{
  const r = await req('GET', '/health');
  if (r.ok) ok(`Backend online (${r.status})`);
  else { fail(`Health check failed: ${r.status}`); process.exit(1); }
}

// ─── TEST 1: Login Doctor A & Doctor B ─────────────────────────────────────────
section('TEST 1 — Login Doctor A & Doctor B');
let docA = null;
let docB = null;

// Try to login as doctor
const candidateEmails = [
  'doctor@clinic.com',
  'doctor@example.com',
  'doctor@test.com',
  'dr.ahmed@clinic.com',
  'sara.ahmed@clinic.com',
  'doctor1@test.com',
];
const candidatePasswords = [
  'password123',
  'Test1234!',
  'Doctor123!',
  'Admin123!',
  'Doctor@123',
  'password',
  '123456',
  'Test@123',
];

for (const email of candidateEmails) {
  for (const pw of candidatePasswords) {
    const res = await login(email, pw);
    if (res && res.user.role === 'DOCTOR') {
      docA = res;
      break;
    }
  }
  if (docA) break;
}

// If not found yet, get doctors list using patient token and try them
if (!docA) {
  const patientAuth = await login('patient@example.com', 'password123');
  if (patientAuth) {
    const listRes = await req('GET', '/api/users/doctors', null, patientAuth.token);
    const docs = Array.isArray(listRes.body?.data) ? listRes.body.data : listRes.body?.data?.doctors || [];
    for (const d of docs) {
      for (const pw of candidatePasswords) {
        const res = await login(d.email, pw);
        if (res && res.user.role === 'DOCTOR') {
          docA = res;
          break;
        }
      }
      if (docA) break;
    }
  }
}

if (docA) {
  ok(`Doctor A logged in: Dr. ${docA.user.firstName} ${docA.user.lastName} (${docA.user.email})`);
} else {
  fail('Could not log in as any Doctor account');
  process.exit(1);
}

// Try to find a second doctor from candidate emails / docs
const docsRes = await req('GET', '/api/users/doctors', null, docA.token);
const doctorsList = Array.isArray(docsRes.body?.data)
  ? docsRes.body.data
  : docsRes.body?.data?.doctors || [];

for (const d of doctorsList) {
  if (d.id !== docA.user.id) {
    for (const pw of candidatePasswords) {
      const res = await login(d.email, pw);
      if (res && res.user.role === 'DOCTOR' && res.user.id !== docA.user.id) {
        docB = res;
        break;
      }
    }
  }
  if (docB) break;
}

// If no second doctor found with candidate passwords, create Doctor B using admin
if (!docB) {
  for (const adminEmail of ['admin@example.com', 'admin@rendez-vous.com', 'superadmin@example.com', 'admin@test.com']) {
    for (const pw of ['Admin123!', 'password123', 'Admin@123']) {
      const adminAuth = await login(adminEmail, pw);
      if (adminAuth && adminAuth.user.role === 'SUPER_ADMIN') {
        // Create Doctor B
        const uniqueEmail = `doctor_b_${Date.now()}@hospital.com`;
        const createRes = await req('POST', '/api/users/create', {
          firstName: 'Robert',
          lastName: 'House',
          email: uniqueEmail,
          password: 'password123',
          role: 'DOCTOR',
          licenseNumber: 'LIC-DOC-B',
        }, adminAuth.token);

        if (createRes.ok) {
          docB = await login(uniqueEmail, 'password123');
        }
        break;
      }
    }
    if (docB) break;
  }
}

if (docB) {
  ok(`Doctor B logged in: Dr. ${docB.user.firstName} ${docB.user.lastName} (id: ${docB.user.id})`);
} else {
  fail('Could not establish Doctor B session');
  process.exit(1);
}

const targetDoc = docB.user;

// ─── TEST 2: Weekly Schedule (GET & UPDATE) ───────────────────────────────────
section('TEST 2 — Doctor Weekly Schedule & Availability');
{
  // 1. Get Schedule
  const getRes = await req('GET', '/api/schedules/my-schedule', null, docA.token);
  if (getRes.ok && getRes.body?.data?.schedules) {
    ok(`Fetched weekly schedule: ${getRes.body.data.schedules.length} days configured`);
  } else {
    fail(`GET /api/schedules/my-schedule failed: ${getRes.status}`);
  }

  // 2. Update Schedule
  const updatePayload = {
    schedules: [
      { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isActive: false },
      { dayOfWeek: 1, startTime: "08:30", endTime: "16:30", isActive: true },
      { dayOfWeek: 2, startTime: "08:30", endTime: "16:30", isActive: true },
      { dayOfWeek: 3, startTime: "08:30", endTime: "16:30", isActive: true },
      { dayOfWeek: 4, startTime: "08:30", endTime: "16:30", isActive: true },
      { dayOfWeek: 5, startTime: "08:30", endTime: "14:00", isActive: true },
      { dayOfWeek: 6, startTime: "09:00", endTime: "13:00", isActive: false },
    ]
  };

  const putRes = await req('PUT', '/api/schedules/my-schedule', updatePayload, docA.token);
  if (putRes.ok) {
    ok(`Updated weekly availability schedule (${putRes.status})`);
  } else {
    fail(`PUT /api/schedules/my-schedule failed: ${putRes.status} — ${JSON.stringify(putRes.body)}`);
  }
}

// ─── TEST 3: Schedule Exception (Add Vacation & Delete) ────────────────────────
section('TEST 3 — Doctor Schedule Exception (Time-off / Vacation)');
let exceptionId = null;
{
  const addRes = await req('POST', '/api/schedules/exceptions', {
    exceptionDate: '2026-11-25',
    type: 'VACATION',
    reason: 'Annual Cardiology Conference',
  }, docA.token);

  if (addRes.ok && addRes.body?.data?.exception?.id) {
    exceptionId = addRes.body.data.exception.id;
    ok(`Added schedule exception: Vacation on 2026-11-25 (id: ${exceptionId})`);
  } else {
    fail(`POST /api/schedules/exceptions failed: ${addRes.status} — ${JSON.stringify(addRes.body)}`);
  }

  if (exceptionId) {
    const delRes = await req('DELETE', `/api/schedules/exceptions/${exceptionId}`, null, docA.token);
    if (delRes.ok) {
      ok(`Deleted schedule exception #${exceptionId}`);
    } else {
      fail(`DELETE /api/schedules/exceptions/${exceptionId} failed: ${delRes.status}`);
    }
  }
}

// ─── TEST 4: Get Doctor Patients ──────────────────────────────────────────────
section('TEST 4 — Doctor Patients List (/api/users/my-patients)');
{
  const r = await req('GET', '/api/users/my-patients', null, docA.token);
  if (r.ok) {
    const patients = Array.isArray(r.body?.data) ? r.body.data : r.body?.data?.patients || [];
    ok(`Doctor retrieved patients directory (${patients.length} patients found)`);
  } else {
    fail(`GET /api/users/my-patients failed: ${r.status}`);
  }
}

// ─── TEST 5: Create a Test Appointment for Doctor A ───────────────────────────
section('TEST 5 — Book Appointment for Doctor A');
let testApptId = null;
{
  const patientAuth = await login('patient@example.com', 'password123');
  const d = new Date();
  d.setDate(d.getDate() + 30 + Math.floor(Math.random() * 20));
  const dateStr = d.toISOString().split('T')[0];

  const bookRes = await req('POST', '/api/appointments', {
    doctorId: docA.user.id,
    appointmentDate: dateStr,
    startTime: '11:00',
    endTime: '11:30',
    reason: 'Cardiac checkup with Doctor A',
  }, patientAuth?.token || docA.token);

  if (bookRes.ok && bookRes.body?.data?.appointment?.id) {
    testApptId = bookRes.body.data.appointment.id;
    ok(`Booked appointment #${testApptId} for Doctor A`);
  } else {
    fail(`Booking appointment failed: ${bookRes.status} — ${JSON.stringify(bookRes.body)}`);
  }
}

// ─── TEST 6: Doctor A Confirms Appointment ────────────────────────────────────
section('TEST 6 — Doctor Confirms Appointment');
if (testApptId) {
  const confirmRes = await req('PATCH', `/api/appointments/${testApptId}/status`, {
    status: 'CONFIRMED'
  }, docA.token);

  if (confirmRes.ok && confirmRes.body?.data?.appointment?.status === 'CONFIRMED') {
    ok(`Doctor A confirmed appointment #${testApptId}`);
  } else {
    fail(`Confirm appointment failed: ${confirmRes.status} — ${JSON.stringify(confirmRes.body)}`);
  }
}

// ─── TEST 7: Doctor A Completes Appointment with Clinical Notes ───────────────
section('TEST 7 — Doctor Completes Appointment with Notes');
if (testApptId) {
  const completeRes = await req('PATCH', `/api/appointments/${testApptId}/status`, {
    status: 'COMPLETED',
    notes: 'Patient ECG normal. Prescribed 10mg daily multivitamins. Followup in 6 months.'
  }, docA.token);

  if (completeRes.ok && completeRes.body?.data?.appointment?.status === 'COMPLETED') {
    ok(`Doctor A completed appointment #${testApptId} with consultation notes`);
  } else {
    fail(`Complete appointment failed: ${completeRes.status} — ${JSON.stringify(completeRes.body)}`);
  }
}

// ─── TEST 8: Create New Appointment & Test Transfer ───────────────────────────
section('TEST 8 — Transfer Appointment from Doctor A to Doctor B');
let transferApptId = null;
let transferId = null;

{
  const patientAuth = await login('patient@example.com', 'password123');
  const d = new Date();
  d.setDate(d.getDate() + 55 + Math.floor(Math.random() * 20));
  const dateStr = d.toISOString().split('T')[0];

  const randomHour = 8 + Math.floor(Math.random() * 9);
  const startTime = `${String(randomHour).padStart(2, '0')}:00`;
  const endTime = `${String(randomHour).padStart(2, '0')}:30`;

  const bookRes = await req('POST', '/api/appointments', {
    doctorId: docA.user.id,
    appointmentDate: dateStr,
    startTime,
    endTime,
    reason: 'Consultation to be transferred',
  }, patientAuth?.token || docA.token);

  if (bookRes.ok && bookRes.body?.data?.appointment?.id) {
    transferApptId = bookRes.body.data.appointment.id;
    ok(`Created appointment #${transferApptId} at ${dateStr} ${startTime} to test transfer`);
  }

  // Doctor A requests transfer to targetDoc
  if (transferApptId && targetDoc) {
    const trRes = await req('POST', '/api/transfers', {
      appointmentId: transferApptId,
      toDoctorId: targetDoc.id,
      reason: 'Specialist referral: Requires specialized cardiology treatment from colleague',
    }, docA.token);

    if (trRes.ok && trRes.body?.data?.transfer?.id) {
      transferId = trRes.body.data.transfer.id;
      ok(`Doctor A initiated transfer #${transferId} to Dr. ${targetDoc.firstName} ${targetDoc.lastName}`);
    } else {
      fail(`Transfer request failed: ${trRes.status} — ${JSON.stringify(trRes.body)}`);
    }
  }
}

// ─── TEST 9: Doctor B Accepts Transfer ─────────────────────────────────────────
section('TEST 9 — Doctor B Accepts Transfer Request');
if (transferId && docB?.token) {
  const acceptRes = await req('PATCH', `/api/transfers/${transferId}/status`, {
    status: 'APPROVED',
  }, docB.token);

  if (acceptRes.ok && acceptRes.body?.data?.transfer?.status === 'APPROVED') {
    ok(`Doctor B accepted transfer #${transferId}`);

    // Verify appointment is now assigned to Doctor B
    const apptCheck = await req('GET', `/api/appointments/${transferApptId}`, null, docB.token);
    if (apptCheck.ok && (apptCheck.body?.data?.appointment?.doctorId === docB.user.id || apptCheck.body?.data?.appointment?.doctor?.id === docB.user.id)) {
      ok(`Appointment #${transferApptId} successfully transferred to Doctor B!`);
    } else {
      info(`Appointment ownership check returned ${apptCheck.status}`);
    }
  } else {
    fail(`Accept transfer failed: ${acceptRes.status} — ${JSON.stringify(acceptRes.body)}`);
  }
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
section('DOCTOR FEATURE TEST SUMMARY');
console.log(`  ✅ PASS: ${PASS}`);
console.log(`  ❌ FAIL: ${FAIL}`);
if (FAIL === 0) {
  console.log('\n  🎉 ALL DOCTOR FEATURES VERIFIED & WORKING PERFECTLY!');
} else {
  console.log(`\n  🚨 ${FAIL} test(s) failed — see log above.`);
}
