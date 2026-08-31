import 'dotenv/config';
// import express from 'express';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { errorHandler } from './middleware/errorHandler.js';
import { requestContext } from './utils/requestContext.js';

import { UserRepository } from './modules/user/user.repository.js';
import { AuditLogRepository } from './modules/auditLog/auditLog.repository.js';
import { AppointmentRepository } from './modules/appointment/appointment.repository.js';
import { TransferRepository } from './modules/transfer/transfer.repository.js';
import { ScheduleRepository } from './modules/schedule/schedule.repository.js';
import { NotificationRepository } from './modules/notification/notification.repository.js';
import { EstablishmentRepository } from './modules/establishment/establishment.repository.js';

// ─── Services ─────────────────────────────────────────────────────────────────
import { UserService } from './modules/user/user.service.js';
import { AuthService } from './modules/auth/auth.service.js';
import { AuditLogService } from './modules/auditLog/auditLog.service.js';
import { AppointmentService } from './modules/appointment/appointment.service.js';
import { TransferService } from './modules/transfer/transfer.service.js';
import { ScheduleService } from './modules/schedule/schedule.service.js';
import { NotificationService } from './modules/notification/notification.service.js';
import { EstablishmentService } from './modules/establishment/establishment.service.js';

// ─── Controllers ──────────────────────────────────────────────────────────────
import { UserController } from './modules/user/user.controller.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { AuditLogController } from './modules/auditLog/auditLog.controller.js';
import { AppointmentController } from './modules/appointment/appointment.controller.js';
import { TransferController } from './modules/transfer/transfer.controller.js';
import { ScheduleController } from './modules/schedule/schedule.controller.js';
import { NotificationController } from './modules/notification/notification.controller.js';
import { EstablishmentController } from './modules/establishment/establishment.controller.js';

// ─── Routes ───────────────────────────────────────────────────────────────────
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/user/user.routes.js';
import { auditLogRoutes } from './modules/auditLog/auditLog.routes.js';
import { appointmentRoutes } from './modules/appointment/appointment.routes.js';
import { transferRoutes } from './modules/transfer/transfer.routes.js';
import { scheduleRoutes } from './modules/schedule/schedule.routes.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';
import { establishmentRoutes } from './modules/establishment/establishment.routes.js';

// ─── DI: Wire up repositories, services, controllers ──────────────────────────
const userRepository = new UserRepository();
const auditLogRepository = new AuditLogRepository();
const appointmentRepository = new AppointmentRepository();
const transferRepository = new TransferRepository();
const scheduleRepository = new ScheduleRepository();
const notificationRepository = new NotificationRepository();
const establishmentRepository = new EstablishmentRepository();

export const auditLogService = new AuditLogService(auditLogRepository);
const notificationService = new NotificationService(notificationRepository);
const userService = new UserService(userRepository, auditLogService);
export const authService = new AuthService();
const appointmentService = new AppointmentService(appointmentRepository, auditLogService, notificationService);
const transferService = new TransferService(transferRepository, appointmentRepository, auditLogService, notificationService);
const scheduleService = new ScheduleService(scheduleRepository, auditLogService);
const establishmentService = new EstablishmentService(establishmentRepository, auditLogService);

const userController = new UserController(userService);
const authController = new AuthController(authService);
const auditLogController = new AuditLogController(auditLogService);
const appointmentController = new AppointmentController(appointmentService);
const transferController = new TransferController(transferService);
const scheduleController = new ScheduleController(scheduleService);
const notificationController = new NotificationController(notificationService);
const establishmentController = new EstablishmentController(establishmentService);

// ─── Express App ──────────────────────────────────────────────────────────────
const app: Express = express();

// Trust reverse proxy
app.set('trust proxy', 1);

// ─── Global Middleware ────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
  'http://localhost:4200',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow any local dev origin (localhost or 127.0.0.1 on any port)
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev mode
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Request Context (AsyncLocalStorage) ─────────────────────────────────────
app.use((req, res, next) => {
  requestContext.run({ ip: req.ip }, next);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes(authController));
app.use('/api/users', userRoutes(userController));
app.use('/api/audit-logs', auditLogRoutes(auditLogController));
app.use('/api/appointments', appointmentRoutes(appointmentController));
app.use('/api/transfers', transferRoutes(transferController));
app.use('/api/schedules', scheduleRoutes(scheduleController));
app.use('/api/notifications', notificationRoutes(notificationController));
app.use('/api/establishments', establishmentRoutes(establishmentController));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
