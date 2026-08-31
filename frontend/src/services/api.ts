import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends httpOnly cookies
});

// Interceptor to add Authorization header if token exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type UserRole = 'SUPER_ADMIN' | 'ESTABLISHMENT_ADMIN' | 'DOCTOR' | 'PATIENT';
export type EstablishmentUserRole = 'ADMIN' | 'DOCTOR';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'TRANSFERRED';

export interface Establishment {
  id: string;
  name: string;
  type?: string | null;
  address: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EstablishmentUser {
  id: string;
  establishmentId: string;
  userId: string;
  role: EstablishmentUserRole;
  createdAt?: string;
  user?: User;
  establishment?: Establishment;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  specialtyId?: string | number | null;
  licenseNumber?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  establishments?: Array<{ id: string; name: string; role: string }>;
}

export interface Appointment {
  id: string;
  patientId?: string;
  doctorId?: string;
  establishmentId?: string;
  patientName?: string;
  doctorName?: string;
  patient?: { id: string; firstName: string; lastName: string; email: string; phone?: string; dateOfBirth?: string | null; gender?: string | null; address?: string | null } | null;
  doctor?: { id: string; firstName: string; lastName: string; email: string; specialtyId?: string; licenseNumber?: string | null; bio?: string | null } | null;
  establishment?: Establishment | null;
  appointmentType?: { id: string; name: string; durationMinutes?: number; price?: number | string | null } | null;
  appointmentDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  notes?: string | null;
  status: AppointmentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type TransferStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface Transfer {
  id: string;
  appointmentId: string;
  patientId: string;
  fromEstablishmentId?: string;
  toEstablishmentId?: string;
  fromDoctorId: string;
  toDoctorId: string;
  reason: string;
  status: TransferStatus;
  requestedBy: string;
  approvedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  appointment?: Appointment | null;
  patient?: User | null;
  fromDoctor?: User | null;
  toDoctor?: User | null;
  fromEstablishment?: Establishment | null;
  toEstablishment?: Establishment | null;
}

export type ScheduleExceptionType = 'ABSENCE' | 'VACATION' | 'HOLIDAY' | 'UNAVAILABLE';

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  establishmentId?: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isActive: boolean;
  createdAt?: string;
}

export interface DoctorScheduleException {
  id: string;
  doctorId: string;
  establishmentId?: string;
  exceptionDate: string; // YYYY-MM-DD
  type: ScheduleExceptionType;
  reason?: string | null;
  createdAt?: string;
}

export interface AuditLog {
  id: string | number;
  action: string;
  details?: string | null;
  user?: string | { firstName?: string; lastName?: string; email?: string } | null;
  userName?: string;
  userEmail?: string;
  createdAt?: string;
  timestamp?: string;
  status?: string;
  ipAddress?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

export interface MetaData {
  totalCount: number;
  page: number;
  limit: number;
}

export interface LoginResponseData {
  user: User;
  token: string;
}

export interface GetUsersResponseData {
  users: User[];
  meta: MetaData;
}

export interface GetDoctorsResponseData {
  doctors?: User[];
  users?: User[];
  meta?: MetaData;
}

export interface GetMyPatientsResponseData {
  patients: User[];
  meta: MetaData;
}

export interface GetAuditLogsResponseData {
  auditLogs?: AuditLog[];
  logs?: AuditLog[];
  meta?: MetaData;
}

export interface GetAppointmentsResponseData {
  appointments?: Appointment[];
  meta?: MetaData;
}

export interface GetEstablishmentsResponseData {
  establishments: Establishment[];
  meta: MetaData;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  licenseNumber?: string;
  bio?: string;
  establishmentId?: string;
}

export interface CreateAppointmentData {
  doctorId?: string;
  doctorEmail?: string;
  establishmentId?: string;
  patientId?: string;
  patientEmail?: string;
  appointmentTypeId?: string;
  typeId?: string;
  appointmentDate?: string;
  date?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  reason: string;
}

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

// ─── AUTH METHODS ───────────────────────────────────────────────────────────
export async function loginApi(login: string, password: string) {
  const response = await api.post<ApiResponse<LoginResponseData>>('/api/auth/login', {
    login,
    password,
  });
  return response.data;
}

export async function registerApi(registerData: RegisterUserData) {
  const response = await api.post<ApiResponse<{ user: User }>>('/api/auth/register', registerData);
  return response.data;
}

export async function getMeApi() {
  const response = await api.get<ApiResponse<{ user: User }>>('/api/auth/me');
  return response.data;
}

export async function logoutApi() {
  const response = await api.post<ApiResponse<null>>('/api/auth/logout');
  return response.data;
}

// ─── USER METHODS ───────────────────────────────────────────────────────────
export async function getUsersApi(params?: { search?: string; role?: UserRole; establishmentId?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<GetUsersResponseData>>('/api/users', { params });
  return response.data;
}

export async function getDoctorsApi(params?: { search?: string; establishmentId?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<GetDoctorsResponseData | User[]>>('/api/users/doctors', { params });
  return response.data;
}

export async function getMyPatientsApi(params?: { search?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<GetMyPatientsResponseData>>('/api/users/my-patients', { params });
  return response.data;
}

export async function getAuditLogsApi(params?: { search?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<GetAuditLogsResponseData | AuditLog[]>>('/api/audit-logs', { params });
  return response.data;
}

export async function createUserApi(userData: CreateUserData) {
  const response = await api.post<ApiResponse<{ user: User }>>('/api/users/create', userData);
  return response.data;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  licenseNumber?: string;
  bio?: string;
  isActive?: boolean;
}

export async function updateUserApi(id: string, data: UpdateUserData) {
  try {
    const response = await api.patch<ApiResponse<{ user: User }>>(`/api/users/${id}`, data);
    return response.data;
  } catch {
    const fallbackResponse = await api.put<ApiResponse<{ user: User }>>(`/api/users/${id}`, data);
    return fallbackResponse.data;
  }
}

export async function toggleUserStatusApi(id: string, isActive: boolean) {
  return updateUserApi(id, { isActive });
}

// USER ACCOUNT & PASSWORD ACTIONS
export async function updatePasswordApi(data: { currentPassword?: string; oldPassword?: string; newPassword: string }) {
  const response = await api.patch<ApiResponse<{ message: string }>>('/api/users/update-password', data);
  return response.data;
}

export async function updateProfileImageApi(formData: FormData) {
  const response = await api.patch<ApiResponse<{ profileImage: string }>>('/api/users/update-profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}

export async function forgetPasswordApi(email: string) {
  const response = await api.post<ApiResponse<{ message: string; resetToken?: string }>>('/api/users/forget-password', { email });
  return response.data;
}

export async function validateForgetPasswordTokenApi(token: string) {
  const response = await api.post<ApiResponse<{ valid: boolean }>>('/api/users/validate-forget-password-token', { token });
  return response.data;
}

export async function resetPasswordApi(data: { token: string; newPassword: string }) {
  const response = await api.post<ApiResponse<{ message: string }>>('/api/users/reset-password', data);
  return response.data;
}

// ─── ESTABLISHMENT API METHODS ──────────────────────────────────────────────
export async function getEstablishmentsApi(params?: { search?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<GetEstablishmentsResponseData>>('/api/establishments', { params });
  return response.data;
}

export async function getEstablishmentByIdApi(id: string) {
  const response = await api.get<ApiResponse<{ establishment: Establishment }>>(`/api/establishments/${id}`);
  return response.data;
}

export interface CreateEstablishmentData {
  name: string;
  type?: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
}

export async function createEstablishmentApi(data: CreateEstablishmentData) {
  const response = await api.post<ApiResponse<{ establishment: Establishment }>>('/api/establishments', data);
  return response.data;
}

export async function updateEstablishmentApi(id: string, data: Partial<Establishment>) {
  try {
    const response = await api.patch<ApiResponse<{ establishment: Establishment }>>(`/api/establishments/${id}`, data);
    return response.data;
  } catch {
    const fallbackResponse = await api.put<ApiResponse<{ establishment: Establishment }>>(`/api/establishments/${id}`, data);
    return fallbackResponse.data;
  }
}

export async function deleteEstablishmentApi(id: string) {
  const response = await api.delete<ApiResponse<{ establishment: Establishment }>>(`/api/establishments/${id}`);
  return response.data;
}

export async function getEstablishmentUsersApi(establishmentId: string) {
  const response = await api.get<ApiResponse<{ users: EstablishmentUser[] }>>(`/api/establishments/${establishmentId}/users`);
  return response.data;
}

export async function addEstablishmentUserApi(establishmentId: string, data: { userId: string | number; role: EstablishmentUserRole }) {
  const response = await api.post<ApiResponse<{ establishmentUser: EstablishmentUser }>>(`/api/establishments/${establishmentId}/users`, data);
  return response.data;
}

export async function removeEstablishmentUserApi(establishmentId: string, userId: string | number) {
  const response = await api.delete<ApiResponse<{ establishmentUser: EstablishmentUser }>>(`/api/establishments/${establishmentId}/users/${userId}`);
  return response.data;
}

export async function getMyEstablishmentsApi() {
  const response = await api.get<ApiResponse<{ establishments: EstablishmentUser[] }>>('/api/establishments/mine');
  return response.data;
}

// ─── APPOINTMENTS API METHODS ───────────────────────────────────────────────
export async function getAppointmentsApi(params?: { establishmentId?: string; doctorId?: string; patientId?: string; status?: string; search?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<GetAppointmentsResponseData | Appointment[]>>('/api/appointments', { params });
  return response.data;
}

export async function getAppointmentByIdApi(id: string) {
  const response = await api.get<ApiResponse<{ appointment: Appointment } | Appointment>>(`/api/appointments/${id}`);
  return response.data;
}

export async function createAppointmentApi(data: CreateAppointmentData) {
  const payload: Record<string, unknown> = {};

  if (data.doctorId) payload.doctorId = data.doctorId;
  if (data.doctorEmail) payload.doctorEmail = data.doctorEmail;
  if (data.establishmentId) payload.establishmentId = data.establishmentId;
  if (data.patientId) payload.patientId = data.patientId;
  if (data.patientEmail) payload.patientEmail = data.patientEmail;

  if (data.appointmentTypeId || data.typeId) {
    const typeVal = data.appointmentTypeId || data.typeId;
    payload.appointmentTypeId = typeVal;
    payload.typeId = typeVal;
  }

  // Date format YYYY-MM-DD
  let rawDate = data.appointmentDate || data.date || '';
  if (rawDate.includes('T')) {
    rawDate = rawDate.split('T')[0];
  }
  if (rawDate) {
    payload.appointmentDate = rawDate;
    payload.date = rawDate;
  }

  // Start Time HH:mm
  let rawStartTime = data.startTime || data.start_time || '14:30';
  if (rawStartTime.length > 5) {
    rawStartTime = rawStartTime.slice(0, 5);
  }
  payload.startTime = rawStartTime;
  payload.start_time = rawStartTime;

  // End Time HH:mm (default to +30 minutes if not specified)
  let rawEndTime = data.endTime || data.end_time || '';
  if (!rawEndTime && rawStartTime) {
    const [h, m] = rawStartTime.split(':').map(Number);
    const totalMins = h * 60 + m + 30;
    const endH = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
    const endM = String(totalMins % 60).padStart(2, '0');
    rawEndTime = `${endH}:${endM}`;
  } else if (rawEndTime.length > 5) {
    rawEndTime = rawEndTime.slice(0, 5);
  }
  payload.endTime = rawEndTime;
  payload.end_time = rawEndTime;

  // Full ISO datetime strings for servers expecting ISO datetimes
  if (rawDate) {
    const timePart = rawStartTime.length === 5 ? `${rawStartTime}:00` : rawStartTime;
    const isoString = `${rawDate}T${timePart}.000Z`;
    payload.dateTime = isoString;
    payload.appointmentDateTime = isoString;
  }

  if (data.reason) payload.reason = data.reason;

  const response = await api.post<ApiResponse<{ appointment: Appointment }>>('/api/appointments', payload);
  return response.data;
}

export const bookAppointmentApi = createAppointmentApi;

export async function updateAppointmentStatusApi(id: string, status: AppointmentStatus, notes?: string) {
  const response = await api.patch<ApiResponse<{ appointment: Appointment }>>(`/api/appointments/${id}/status`, { status, notes });
  return response.data;
}

export async function updateAppointmentApi(id: string, data: { reason?: string; notes?: string }) {
  const response = await api.put<ApiResponse<{ appointment: Appointment }>>(`/api/appointments/${id}`, data);
  return response.data;
}

export async function cancelAppointmentApi(id: string) {
  const response = await api.delete<ApiResponse<{ appointment: Appointment }>>(`/api/appointments/${id}`);
  return response.data;
}

// ─── TRANSFERS API METHODS ───────────────────────────────────────────────────
export interface GetTransfersResponseData {
  transfers: Transfer[];
  meta: MetaData;
}

export async function getTransfersApi(params?: { fromDoctorId?: string; toDoctorId?: string; establishmentId?: string; status?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<GetTransfersResponseData>>('/api/transfers', { params });
  return response.data;
}

export async function requestTransferApi(data: { appointmentId: string; toDoctorId: string; toEstablishmentId?: string; reason: string }) {
  const response = await api.post<ApiResponse<{ transfer: Transfer }>>('/api/transfers', data);
  return response.data;
}

export async function updateTransferStatusApi(id: string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED') {
  const response = await api.patch<ApiResponse<{ transfer: Transfer }>>(`/api/transfers/${id}/status`, { status });
  return response.data;
}

// ─── SCHEDULE & AVAILABILITY API METHODS ────────────────────────────────────
export interface GetScheduleResponseData {
  schedules: DoctorSchedule[];
  exceptions: DoctorScheduleException[];
}

export async function getMyScheduleApi(establishmentId?: string) {
  const response = await api.get<ApiResponse<GetScheduleResponseData>>('/api/schedules/my-schedule', {
    params: establishmentId ? { establishmentId } : undefined
  });
  return response.data;
}

export async function updateMyScheduleApi(schedules: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>, establishmentId?: string) {
  const response = await api.put<ApiResponse<{ schedules: DoctorSchedule[] }>>('/api/schedules/my-schedule', { schedules }, {
    params: establishmentId ? { establishmentId } : undefined
  });
  return response.data;
}

export interface CreateScheduleExceptionData {
  exceptionDate?: string;
  startDate?: string;
  endDate?: string;
  type: ScheduleExceptionType | string;
  reason?: string;
  force?: boolean;
}

export interface CreateScheduleExceptionResponseData {
  exception?: DoctorScheduleException;
  exceptions?: DoctorScheduleException[];
  totalDays?: number;
  conflictingAppointmentsCount?: number;
  conflictingAppointments?: Array<{
    id: string;
    patientName: string;
    patientEmail?: string;
    patientPhone?: string;
    appointmentDate: string;
    startTime: string;
    status: string;
    reason?: string;
  }>;
}

export async function createScheduleExceptionApi(data: CreateScheduleExceptionData, establishmentId?: string) {
  const response = await api.post<ApiResponse<CreateScheduleExceptionResponseData>>('/api/schedules/exceptions', data, {
    params: establishmentId ? { establishmentId } : undefined
  });
  return response.data;
}

export async function deleteScheduleExceptionApi(id: string) {
  const response = await api.delete<ApiResponse<{ exception: DoctorScheduleException }>>(`/api/schedules/exceptions/${id}`);
  return response.data;
}

export async function getDoctorScheduleApi(doctorId: string, establishmentId?: string) {
  const response = await api.get<ApiResponse<GetScheduleResponseData>>(`/api/schedules/doctor/${doctorId}`, {
    params: establishmentId ? { establishmentId } : undefined
  });
  return response.data;
}

export async function checkHealthApi() {
  const response = await api.get<{ status: string; timestamp: string }>('/health');
  return response.data;
}

// ─── NOTIFICATIONS API METHODS ──────────────────────────────────────────────
export interface NotificationItem {
  id: string;
  rawId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsResponseData {
  notifications: NotificationItem[];
  unreadCount: number;
  meta: {
    totalCount: number;
    page: number;
    limit: number;
  };
}

export async function getNotificationsApi(params?: { isRead?: boolean; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<GetNotificationsResponseData>>('/api/notifications', { params });
  return response.data;
}

export async function getUnreadNotificationsCountApi() {
  const response = await api.get<ApiResponse<{ unreadCount: number }>>('/api/notifications/unread-count');
  return response.data;
}

export async function markNotificationReadApi(id: string) {
  const response = await api.patch<ApiResponse<{ notification: NotificationItem }>>(`/api/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsReadApi() {
  const response = await api.patch<ApiResponse<{ updatedCount: number }>>('/api/notifications/read-all');
  return response.data;
}
