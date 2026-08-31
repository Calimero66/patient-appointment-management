export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ESTABLISHMENT_ADMIN = 'ESTABLISHMENT_ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

export enum EstablishmentUserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  TRANSFERRED = 'TRANSFERRED',
}

export enum TransferStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ScheduleExceptionType {
  ABSENCE = 'ABSENCE',
  VACATION = 'VACATION',
  HOLIDAY = 'HOLIDAY',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum NotificationType {
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_TRANSFERRED = 'APPOINTMENT_TRANSFERRED',
  TRANSFER_REQUESTED = 'TRANSFER_REQUESTED',
  TRANSFER_APPROVED = 'TRANSFER_APPROVED',
  TRANSFER_REJECTED = 'TRANSFER_REJECTED',
  SYSTEM = 'SYSTEM',
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  role: UserRole | string;
  dateOfBirth?: Date | null;
  gender?: string | null;
  address?: string | null;
  licenseNumber?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  forgotPasswordToken?: string | null;
  forgotPasswordExpires?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Establishment {
  id: number;
  name: string;
  type?: string | null;
  address: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstablishmentUser {
  id: number;
  establishmentId: number;
  userId: number;
  role: EstablishmentUserRole | string;
  createdAt: Date;
}

export interface Specialty {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface AppointmentType {
  id: number;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price?: number | string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  establishmentId: number;
  appointmentTypeId: number;
  appointmentDate: Date;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus | string;
  reason?: string | null;
  notes?: string | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorSchedule {
  id: number;
  doctorId: number;
  establishmentId: number;
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface DoctorScheduleException {
  id: number;
  doctorId: number;
  establishmentId: number;
  exceptionDate: Date;
  type: ScheduleExceptionType | string;
  reason?: string | null;
  createdAt: Date;
}

export interface Transfer {
  id: number;
  appointmentId: number;
  patientId: number;
  fromEstablishmentId: number;
  toEstablishmentId: number;
  fromDoctorId: number;
  toDoctorId: number;
  reason: string;
  status: TransferStatus | string;
  requestedBy: number;
  approvedBy?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType | string;
  isRead: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId: number;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: Date;
}
