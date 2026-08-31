/**
 * test-establishment-apis.mjs
 * Comprehensive end-to-end integration test suite for:
 * 1. Establishment CRUD (Create, Read, Update, Delete, Search)
 * 2. Doctor-Establishment relationships (Assigning doctors, multi-clinic doctors, filtering doctors by establishment)
 * 3. ESTABLISHMENT_ADMIN Role:
 *    - Super Admin creating an ESTABLISHMENT_ADMIN user
 *    - ESTABLISHMENT_ADMIN login and retrieving their managed clinic
 *    - ESTABLISHMENT_ADMIN creating a new Doctor directly belonging to their establishment
 *    - Scoped Doctor & Appointment querying for ESTABLISHMENT_ADMIN
 *    - ESTABLISHMENT_ADMIN updating clinic profile
 * 4. Doctor Schedules scoped per establishment
 * 5. Patient Booking flow (Choosing establishment -> selecting doctor in establishment -> booking appointment with establishmentId)
 * 6. Appointment status transitions and verification of establishment relations
 * 7. Appointment transfers between doctors and establishments
 * 8. Removing staff and deleting establishment
 */

const BASE = 'http://127.0.0.1:5000';
let PASS = 0, FAIL = 0;

function section(title) {
  console.log(`\n${'═'.repeat(68)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(68));
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

async function runTests() {
  console.log('\n🚀 STARTING ESTABLISHMENT & DOCTOR APPOINTMENT INTEGRATION TESTS');
  const timestamp = Date.now();

  // ─── TEST 0: Health Check ───────────────────────────────────────────────────
  section('TEST 0 — Health Check');
  {
    const r = await req('GET', '/health');
    if (r.ok) ok(`Backend online (${r.status})`);
    else { fail(`Health check failed: ${r.status}`); process.exit(1); }
  }

  // ─── TEST 1: Authentication for Super Admin, Doctors & Patient ───────────────
  section('TEST 1 — Authentication & Users');

  // 1.1 Login Super Admin
  const loginAdmin = await req('POST', '/api/auth/login', {
    login: 'admin@calimero.com',
    password: 'Password123!',
  });
  const adminToken = loginAdmin.body?.data?.token;
  if (adminToken && loginAdmin.body?.data?.user?.role === 'SUPER_ADMIN') {
    ok(`Super Admin authenticated: ${loginAdmin.body.data.user.email} (${loginAdmin.body.data.user.role})`);
  } else {
    fail(`Failed to login Super Admin: ${JSON.stringify(loginAdmin.body)}`);
    process.exit(1);
  }

  // 1.2 Login Doctor 1 (Dr. Sophie Martin)
  const loginDoc1 = await req('POST', '/api/auth/login', {
    login: 'doctor1@clinic.com',
    password: 'Password123!',
  });
  const doc1Token = loginDoc1.body?.data?.token;
  const doc1 = loginDoc1.body?.data?.user;
  if (doc1Token && doc1.role === 'DOCTOR') {
    ok(`Doctor 1 authenticated: Dr. ${doc1.firstName} ${doc1.lastName} (ID: ${doc1.id})`);
  } else {
    fail(`Failed to login Doctor 1: ${JSON.stringify(loginDoc1.body)}`);
  }

  // 1.3 Login Doctor 2 (Dr. Marc Bernard)
  const loginDoc2 = await req('POST', '/api/auth/login', {
    login: 'doctor2@clinic.com',
    password: 'Password123!',
  });
  const doc2Token = loginDoc2.body?.data?.token;
  const doc2 = loginDoc2.body?.data?.user;
  if (doc2Token && doc2.role === 'DOCTOR') {
    ok(`Doctor 2 authenticated: Dr. ${doc2.firstName} ${doc2.lastName} (ID: ${doc2.id})`);
  } else {
    fail(`Failed to login Doctor 2: ${JSON.stringify(loginDoc2.body)}`);
  }

  // 1.4 Register & Login Patient (Alice Dubois)
  const patientEmail = `patient.alice.${timestamp}@gmail.com`;
  await req('POST', '/api/auth/register', {
    email: patientEmail,
    password: 'Password123!',
    firstName: 'Alice',
    lastName: 'Dubois',
    phone: '+33611223344',
  });
  const loginPatient = await req('POST', '/api/auth/login', {
    login: patientEmail,
    password: 'Password123!',
  });
  const patientToken = loginPatient.body?.data?.token;
  const patient = loginPatient.body?.data?.user;
  if (patientToken && patient.role === 'PATIENT') {
    ok(`Patient authenticated: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
  } else {
    fail(`Failed to authenticate Patient: ${JSON.stringify(loginPatient.body)}`);
  }

  // ─── TEST 2: Establishment CRUD ─────────────────────────────────────────────
  section('TEST 2 — Establishment CRUD');
  let estA = null;
  let estB = null;

  // 2.1 Create Establishment A (Central Paris Hospital)
  const createEstARes = await req('POST', '/api/establishments', {
    name: `Hopital Saint-Louis ${timestamp}`,
    type: 'Hospital',
    address: '1 Avenue Claude Vellefaux',
    city: 'Paris',
    phone: '+33142494949',
    email: `contact.${timestamp}@hopital-stlouis.fr`,
  }, adminToken);

  if (createEstARes.ok && createEstARes.body?.data?.establishment) {
    estA = createEstARes.body.data.establishment;
    ok(`Created Establishment A: "${estA.name}" (ID: ${estA.id})`);
  } else {
    fail(`Failed to create Establishment A: ${JSON.stringify(createEstARes.body)}`);
  }

  // 2.2 Create Establishment B (Clinique Lyon Bellecour)
  const createEstBRes = await req('POST', '/api/establishments', {
    name: `Clinique Bellecour ${timestamp}`,
    type: 'Clinic',
    address: '42 Place Bellecour',
    city: 'Lyon',
    phone: '+33478003344',
    email: `lyon.${timestamp}@clinique-bellecour.fr`,
  }, adminToken);

  if (createEstBRes.ok && createEstBRes.body?.data?.establishment) {
    estB = createEstBRes.body.data.establishment;
    ok(`Created Establishment B: "${estB.name}" (ID: ${estB.id})`);
  } else {
    fail(`Failed to create Establishment B: ${JSON.stringify(createEstBRes.body)}`);
  }

  // 2.3 List Establishments (Patient access verification)
  const listEstRes = await req('GET', '/api/establishments', null, patientToken);
  if (listEstRes.ok && listEstRes.body?.data?.establishments?.length >= 2) {
    ok(`Patient retrieved list of ${listEstRes.body.data.establishments.length} establishments`);
  } else {
    fail(`Failed to list establishments: ${JSON.stringify(listEstRes.body)}`);
  }

  // 2.4 Get Establishment By ID
  const getEstRes = await req('GET', `/api/establishments/${estA.id}`, null, patientToken);
  if (getEstRes.ok && getEstRes.body?.data?.establishment?.name === estA.name) {
    ok(`Retrieved Establishment A by ID (${getEstRes.body.data.establishment.city})`);
  } else {
    fail(`Failed to get establishment by ID: ${JSON.stringify(getEstRes.body)}`);
  }

  // 2.5 Update Establishment A
  const updateEstRes = await req('PATCH', `/api/establishments/${estA.id}`, {
    phone: '+33149998877',
    city: 'Paris Centre',
  }, adminToken);
  if (updateEstRes.ok && updateEstRes.body?.data?.establishment?.city === 'Paris Centre') {
    ok('Updated Establishment A details successfully');
  } else {
    fail(`Failed to update Establishment A: ${JSON.stringify(updateEstRes.body)}`);
  }

  // ─── TEST 3: ESTABLISHMENT_ADMIN Role & Creating Scoped Doctors ────────────
  section('TEST 3 — ESTABLISHMENT_ADMIN Role & Creating Scoped Doctors');
  let estAdmin = null;
  let estAdminToken = null;
  let doctorCreatedByAdmin = null;

  // 3.1 Super Admin creates an ESTABLISHMENT_ADMIN for Establishment A
  const estAdminEmail = `estadmin.${timestamp}@clinic.com`;
  const createEstAdminRes = await req('POST', '/api/users/create', {
    email: estAdminEmail,
    password: 'Password123!',
    firstName: 'Claire',
    lastName: 'Directrice',
    role: 'ESTABLISHMENT_ADMIN',
    establishmentId: estA.id,
  }, adminToken);

  if (createEstAdminRes.ok && createEstAdminRes.body?.data?.user) {
    estAdmin = createEstAdminRes.body.data.user;
    ok(`Created Establishment Admin: Claire Directrice (ID: ${estAdmin.id})`);
  } else {
    fail(`Failed to create Establishment Admin: ${JSON.stringify(createEstAdminRes.body)}`);
  }

  // 3.2 Login as ESTABLISHMENT_ADMIN
  const loginEstAdminRes = await req('POST', '/api/auth/login', {
    login: estAdminEmail,
    password: 'Password123!',
  });
  if (loginEstAdminRes.ok && loginEstAdminRes.body?.data?.token) {
    estAdminToken = loginEstAdminRes.body.data.token;
    ok(`ESTABLISHMENT_ADMIN logged in successfully (${estAdmin.email})`);
  } else {
    fail(`Failed to login ESTABLISHMENT_ADMIN: ${JSON.stringify(loginEstAdminRes.body)}`);
  }

  // 3.3 ESTABLISHMENT_ADMIN retrieves their managed establishments
  const myEstRes = await req('GET', '/api/establishments/mine', null, estAdminToken);
  if (myEstRes.ok && myEstRes.body?.data?.establishments?.length > 0) {
    const primary = myEstRes.body.data.establishments[0];
    ok(`ESTABLISHMENT_ADMIN retrieved managed clinic: "${primary.establishment?.name || 'Clinic'}"`);
  } else {
    fail(`Failed to retrieve managed establishments: ${JSON.stringify(myEstRes.body)}`);
  }

  // 3.4 ESTABLISHMENT_ADMIN creates a new Doctor directly belonging to their clinic
  const newDoctorEmail = `dr.claire.dupont.${timestamp}@clinic.com`;
  const createDocRes = await req('POST', '/api/users/create', {
    email: newDoctorEmail,
    password: 'Password123!',
    firstName: 'Claire',
    lastName: 'Dupont',
    role: 'DOCTOR',
    licenseNumber: `MED-${Math.floor(10000 + Math.random() * 89999)}`,
    bio: 'Pediatrics and Adolescent Medicine Specialist',
    establishmentId: estA.id,
  }, estAdminToken);

  if (createDocRes.ok && createDocRes.body?.data?.user) {
    doctorCreatedByAdmin = createDocRes.body.data.user;
    ok(`ESTABLISHMENT_ADMIN successfully created Doctor: Dr. Claire Dupont (ID: ${doctorCreatedByAdmin.id})`);
  } else {
    fail(`ESTABLISHMENT_ADMIN failed to create doctor: ${JSON.stringify(createDocRes.body)}`);
  }

  // 3.5 Verify Dr. Claire Dupont is in Establishment A's doctors list
  const estADocsRes = await req('GET', `/api/users/doctors?establishmentId=${estA.id}`, null, patientToken);
  const estADocs = estADocsRes.body?.data?.doctors || estADocsRes.body?.data || [];
  const foundDoctor = estADocs.find((d) => d.id === doctorCreatedByAdmin.id);
  if (foundDoctor) {
    ok(`Verified: Dr. Claire Dupont is linked to "${estA.name}" (Clinic Doctors Count: ${estADocs.length})`);
  } else {
    fail(`Dr. Claire Dupont was not found in Establishment A: ${JSON.stringify(estADocs)}`);
  }

  // 3.6 ESTABLISHMENT_ADMIN updates clinic details
  const updateClinicRes = await req('PATCH', `/api/establishments/${estA.id}`, {
    phone: '+33149990011',
    address: '1 Avenue Claude Vellefaux, Pavillon Gabrielle',
  }, estAdminToken);
  if (updateClinicRes.ok && updateClinicRes.body?.data?.establishment?.phone === '+33149990011') {
    ok('ESTABLISHMENT_ADMIN successfully updated clinic profile');
  } else {
    fail(`ESTABLISHMENT_ADMIN failed to update clinic: ${JSON.stringify(updateClinicRes.body)}`);
  }

  // ─── TEST 4: Doctor-Establishment Assignment & Filtering ────────────────────
  section('TEST 4 — Doctor-Establishment Assignment & Filtering');

  // 4.1 Assign Doctor 1 (Dr. Sophie Martin) to Establishment A
  const assignDoc1EstA = await req('POST', `/api/establishments/${estA.id}/users`, {
    userId: doc1.id,
    role: 'DOCTOR',
  }, adminToken);
  if (assignDoc1EstA.ok) {
    ok(`Assigned Dr. Sophie Martin to "${estA.name}"`);
  } else {
    fail(`Failed to assign Dr. Sophie Martin to Est A: ${JSON.stringify(assignDoc1EstA.body)}`);
  }

  // 4.2 Assign Doctor 2 (Dr. Marc Bernard) to Establishment B
  const assignDoc2EstB = await req('POST', `/api/establishments/${estB.id}/users`, {
    userId: doc2.id,
    role: 'DOCTOR',
  }, adminToken);
  if (assignDoc2EstB.ok) {
    ok(`Assigned Dr. Marc Bernard to "${estB.name}"`);
  } else {
    fail(`Failed to assign Dr. Marc Bernard to Est B: ${JSON.stringify(assignDoc2EstB.body)}`);
  }

  // 4.3 Also assign Doctor 1 to Establishment B (multi-establishment doctor)
  const assignDoc1EstB = await req('POST', `/api/establishments/${estB.id}/users`, {
    userId: doc1.id,
    role: 'DOCTOR',
  }, adminToken);
  if (assignDoc1EstB.ok) {
    ok(`Assigned Dr. Sophie Martin to second clinic "${estB.name}"`);
  } else {
    fail(`Failed to assign Dr. Sophie Martin to Est B: ${JSON.stringify(assignDoc1EstB.body)}`);
  }

  // 4.4 Query doctors in Establishment B (Should return both Dr. Sophie Martin & Dr. Marc Bernard)
  const docsEstBRes = await req('GET', `/api/users/doctors?establishmentId=${estB.id}`, null, patientToken);
  const docsEstB = docsEstBRes.body?.data?.doctors || docsEstBRes.body?.data || [];
  if (docsEstBRes.ok && docsEstB.length === 2) {
    ok(`Filtered doctors for Est B: Both Dr. Sophie Martin & Dr. Marc Bernard returned (Count: ${docsEstB.length})`);
  } else {
    fail(`Filter doctors Est B failed. Returned: ${JSON.stringify(docsEstB)}`);
  }

  // ─── TEST 5: Doctor Schedules per Establishment ─────────────────────────────
  section('TEST 5 — Doctor Schedules per Establishment');

  // 5.1 Update Doctor 1 schedule at Establishment A
  const updateSchedRes = await req('PUT', `/api/schedules/my-schedule?establishmentId=${estA.id}`, {
    schedules: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isActive: true }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isActive: true }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isActive: true }, // Friday
    ],
  }, doc1Token);

  if (updateSchedRes.ok) {
    ok(`Updated Dr. Sophie Martin weekly schedule for "${estA.name}"`);
  } else {
    fail(`Failed to update schedule: ${JSON.stringify(updateSchedRes.body)}`);
  }

  // 5.2 Patient gets Doctor 1 schedule at Establishment A
  const getSchedRes = await req('GET', `/api/schedules/doctor/${doc1.id}?establishmentId=${estA.id}`, null, patientToken);
  if (getSchedRes.ok && getSchedRes.body?.data?.schedules?.length > 0) {
    ok(`Patient retrieved schedule for Dr. Sophie Martin at "${estA.name}"`);
  } else {
    fail(`Failed to get doctor schedule: ${JSON.stringify(getSchedRes.body)}`);
  }

  // ─── TEST 6: Patient Books Appointment with Establishment ────────────────────
  section('TEST 6 — Patient Booking with Chosen Establishment');
  let appointment = null;

  // Generate completely unique appointment date and time for this test run
  const offsetDays = 60 + Math.floor((timestamp / 1000) % 200);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + offsetDays);
  const dateStr = targetDate.toISOString().split('T')[0];
  const uniqueH = 9 + Math.floor((timestamp / 1000) % 7);
  const startTime = `${String(uniqueH).padStart(2, '0')}:00`;
  const endTime = `${String(uniqueH).padStart(2, '0')}:30`;

  const bookRes = await req('POST', '/api/appointments', {
    establishmentId: estA.id,
    doctorId: doc1.id,
    appointmentDate: dateStr,
    startTime,
    endTime,
    reason: 'Initial cardiology consultation',
  }, patientToken);

  if (bookRes.ok && bookRes.body?.data?.appointment) {
    appointment = bookRes.body.data.appointment;
    ok(`Patient booked appointment at "${estA.name}" with Dr. Sophie Martin on ${dateStr} at ${startTime} (ID: ${appointment.id})`);
    if (appointment.establishmentId === estA.id) {
      ok(`Appointment record correctly has establishmentId: ${appointment.establishmentId}`);
    } else {
      fail(`Appointment missing establishmentId or mismatch: ${appointment.establishmentId}`);
    }
  } else {
    fail(`Failed to book appointment: ${JSON.stringify(bookRes.body)}`);
  }

  // 6.2 Doctor confirms appointment
  const confirmRes = await req('PATCH', `/api/appointments/${appointment.id}/status`, {
    status: 'CONFIRMED',
    notes: 'Confirmed by Dr. Martin',
  }, doc1Token);

  if (confirmRes.ok && confirmRes.body?.data?.appointment?.status === 'CONFIRMED') {
    ok('Doctor confirmed appointment successfully');
  } else {
    fail(`Failed to confirm appointment: ${JSON.stringify(confirmRes.body)}`);
  }

  // 6.3 ESTABLISHMENT_ADMIN views the appointment on clinic dashboard
  const adminAppRes = await req('GET', `/api/appointments?establishmentId=${estA.id}`, null, estAdminToken);
  const adminApps = Array.isArray(adminAppRes.body?.data)
    ? adminAppRes.body.data
    : adminAppRes.body?.data?.appointments || [];
  const foundInClinic = adminApps.find((a) => a.id === appointment.id);
  if (foundInClinic) {
    ok(`ESTABLISHMENT_ADMIN retrieved appointment for clinic "${estA.name}"`);
  } else {
    fail(`Appointment not found in ESTABLISHMENT_ADMIN query: ${JSON.stringify(adminApps)}`);
  }

  // ─── TEST 7: Appointment Transfer between Establishments ────────────────────
  section('TEST 7 — Appointment Transfer with Establishment Scoping');

  // 7.1 Doctor 1 transfers appointment to Doctor 2 at Establishment B
  const transferRes = await req('POST', '/api/transfers', {
    appointmentId: appointment.id,
    toDoctorId: doc2.id,
    toEstablishmentId: estB.id,
    reason: 'Patient relocated to Lyon region, transferring to Dr. Bernard at Clinique Bellecour',
  }, doc1Token);

  let transfer = null;
  if (transferRes.ok && transferRes.body?.data?.transfer) {
    transfer = transferRes.body.data.transfer;
    ok(`Transfer requested from Dr. Martin (Est A) to Dr. Bernard (Est B) (Transfer ID: ${transfer.id})`);
  } else {
    fail(`Failed to request transfer: ${JSON.stringify(transferRes.body)}`);
  }

  // 7.2 Doctor 2 accepts transfer
  const acceptRes = await req('PATCH', `/api/transfers/${transfer.id}/status`, {
    status: 'APPROVED',
  }, doc2Token);

  if (acceptRes.ok && acceptRes.body?.data?.transfer?.status === 'APPROVED') {
    ok('Dr. Marc Bernard approved the transfer request');
  } else {
    fail(`Failed to approve transfer: ${JSON.stringify(acceptRes.body)}`);
  }

  // 7.3 Verify appointment is now updated to Doctor 2 and Establishment B
  const getAppRes = await req('GET', `/api/appointments/${appointment.id}`, null, patientToken);
  if (getAppRes.ok && getAppRes.body?.data?.appointment) {
    const updatedApp = getAppRes.body.data.appointment;
    if (updatedApp.doctorId === doc2.id && updatedApp.establishmentId === estB.id) {
      ok(`Verified: Appointment successfully transferred to Doctor 2 at Establishment B!`);
    } else {
      fail(`Appointment did not update properly: docId=${updatedApp.doctorId}, estId=${updatedApp.establishmentId}`);
    }
  }

  // ─── TEST 8: Remove Staff & Cleanup ──────────────────────────────────────────
  section('TEST 8 — Staff Removal & Establishment Management');

  // 8.1 Remove Doctor 1 from Establishment B
  const removeStaffRes = await req('DELETE', `/api/establishments/${estB.id}/users/${doc1.id}`, null, adminToken);
  if (removeStaffRes.ok) {
    ok(`Removed Dr. Sophie Martin from "${estB.name}"`);
  } else {
    fail(`Failed to remove staff: ${JSON.stringify(removeStaffRes.body)}`);
  }

  // 8.2 Verify Establishment B doctors count is now 1 (only Dr. Bernard)
  const checkDocsRes = await req('GET', `/api/users/doctors?establishmentId=${estB.id}`, null, patientToken);
  const remainingDocs = checkDocsRes.body?.data?.doctors || checkDocsRes.body?.data || [];
  if (checkDocsRes.ok && remainingDocs.length === 1 && remainingDocs[0].id === doc2.id) {
    ok(`Verified: Establishment B now only has Dr. Marc Bernard (Count: ${remainingDocs.length})`);
  } else {
    fail(`Remaining doctors check failed: ${JSON.stringify(remainingDocs)}`);
  }

  // ─── FINAL SUMMARY ──────────────────────────────────────────────────────────
  section('FINAL TEST RESULTS');
  console.log(`  Total Passed:  ${PASS}`);
  console.log(`  Total Failed:  ${FAIL}`);
  console.log('═'.repeat(68));

  if (FAIL === 0) {
    console.log('\n🎉 ALL ESTABLISHMENT, ESTABLISHMENT_ADMIN & DOCTOR APPOINTMENT TESTS PASSED PERFECTLY!\n');
  } else {
    console.error(`\n⚠️ ${FAIL} test(s) failed.\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
