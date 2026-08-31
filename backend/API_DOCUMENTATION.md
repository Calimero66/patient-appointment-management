# 📘 Frontend API Integration Guide & Documentation (Single Establishment)

**Base URL**: `http://localhost:5000`  
**API Version**: `v1.0.0`  
**Content-Type**: `application/json` (unless uploading files with `multipart/form-data`)

---

## 🔐 Authentication & Headers

- **JWT Token**: Login returns a JWT `token`.
- **Sending Token**: Pass the token in the `Authorization` HTTP header with `Bearer `:
  ```http
  Authorization: Bearer <YOUR_JWT_TOKEN>
  ```
- **Cookies**: Login also sets a secure `httpOnly` cookie named `token`. When calling from frontend frameworks (React, Next.js, Vue), set `credentials: 'include'` (fetch) or `withCredentials: true` (axios).

---

## ⚡ Automatic Features & Flexible Frontend Payload Mapping

> 💡 **IMPORTANT FOR FRONTEND DEVELOPERS**:
> 1. **Automatic Patient Assignment**: You do **NOT** need to send `patientId`! The server automatically retrieves and assigns the ID of the logged-in user (`req.user.id`).
> 2. **Flexible Time Formats**: You can send time as simple `"14:30"` (HH:mm) OR full ISO strings (`"2026-08-30T14:30:00.000Z"`). The backend automatically combines date + time!
> 3. **Flexible Key Aliases**: The backend accepts `date` or `appointmentDate`, `start_time` or `startTime`, `end_time` or `endTime`, `typeId` or `appointmentTypeId`.
> 4. **Safe Key Stripping**: Any extra frontend fields (like `doctorEmail`, `doctorName`, `time`) are automatically stripped safely without throwing validation errors.

---

## 📋 Endpoints Overview

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/health` | Public | System health check |
| `POST` | `/api/auth/register` | Public | Patient Self-Registration (**Forced `PATIENT` role**, `id` auto-generated) |
| `POST` | `/api/auth/login` | Public | Authenticate user & get JWT token |
| `GET` | `/api/auth/me` | Logged In | Get profile of currently logged-in user |
| `POST` | `/api/auth/logout` | Logged In | Log out & clear cookie |
| `POST` | `/api/appointments` | Logged In | Book a new Appointment (**Flexible Date/Time & Auto Patient Assignment**) |
| `GET` | `/api/appointments` | Logged In | Get / Filter Appointments (RBAC: Patient sees own, Doctor sees assigned) |
| `GET` | `/api/appointments/:id` | Logged In | Get single Appointment by ID |
| `PUT` | `/api/appointments/:id` | Logged In | Update Appointment details (date, time, reason) |
| `PATCH` | `/api/appointments/:id/status` | Doctor / Admin | Update Appointment Status (`CONFIRMED`, `COMPLETED`, `CANCELLED`) |
| `DELETE` | `/api/appointments/:id` | Logged In | Cancel Appointment (sets status to `CANCELLED`) |
| `PUT` / `PATCH` | `/api/users/:id` | Super Admin | Super Admin edits user details or resets password by Hash ID |
| `GET` | `/api/users/doctors` | Logged In (Patients/All) | Search practicing Doctors by name or email |
| `GET` | `/api/users/my-patients` | Doctor Only | Search / List patients belonging to logged-in Doctor |
| `GET` | `/api/users` | Super Admin | Get / Search all users (by name, email, or `role=DOCTOR\|PATIENT`) |
| `POST` | `/api/users/create` | Super Admin | Create Doctor, Patient, or Super Admin accounts |
| `GET` | `/api/audit-logs` | Super Admin | Get / Search system audit logs |
| `GET` | `/api/audit-logs/:id` | Super Admin | Get single audit log entry by ID |

---

## 📖 Book Appointment Endpoint Specs (`POST /api/appointments`)

- **Auth Required**: Yes (`PATIENT`, `DOCTOR`, or `SUPER_ADMIN`)

### Option A: Standard Clean Payload (Recommended)
```json
{
  "doctorId": "WDV2EP7wO7",
  "appointmentTypeId": "dDV2VAw98N",
  "appointmentDate": "2026-08-30",
  "startTime": "14:30",
  "endTime": "15:00",
  "reason": "Routine Consultation"
}
```

### Option B: Frontend Form Alias Payload (Supported)
```json
{
  "doctorId": "WDV2EP7wO7",
  "typeId": "dDV2VAw98N",
  "date": "2026-08-30",
  "start_time": "14:30",
  "end_time": "15:00",
  "reason": "Routine Consultation"
}
```

#### Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "J1zw0a2P8y",
      "patientId": "J0pndmZwOD",      // Automatically assigned to logged-in user
      "doctorId": "WDV2EP7wO7",
      "appointmentTypeId": "dDV2VAw98N",
      "appointmentDate": "2026-08-30T00:00:00.000Z",
      "startTime": "2026-08-30T14:30:00.000Z",
      "endTime": "2026-08-30T15:00:00.000Z",
      "status": "PENDING",
      "reason": "Routine Consultation"
    }
  },
  "message": "Appointment created successfully"
}
```
