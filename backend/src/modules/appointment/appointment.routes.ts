import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { validateMiddleware } from "../../middleware/validate.js";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from "./appointment.schema.js";
import { AppointmentController } from "./appointment.controller.js";
import { authMiddleware } from "../../middleware/auth.js";

export function appointmentRoutes(appointmentController: AppointmentController): Router {
  const router = Router();

  // All appointment routes require authentication
  router.use(authMiddleware);

  // POST /api/appointments - Create Appointment
  router.post(
    "/",
    validateMiddleware(createAppointmentSchema),
    catchAsync(appointmentController.createAppointment.bind(appointmentController))
  );

  // GET /api/appointments - List / Filter Appointments
  router.get(
    "/",
    catchAsync(appointmentController.getAppointments.bind(appointmentController))
  );

  // GET /api/appointments/:id - Get Appointment By ID
  router.get(
    "/:id",
    catchAsync(appointmentController.getAppointmentById.bind(appointmentController))
  );

  // PUT /api/appointments/:id - Update Appointment Details
  router.put(
    "/:id",
    validateMiddleware(updateAppointmentSchema),
    catchAsync(appointmentController.updateAppointment.bind(appointmentController))
  );

  // PATCH /api/appointments/:id/status - Update Appointment Status
  router.patch(
    "/:id/status",
    validateMiddleware(updateAppointmentStatusSchema),
    catchAsync(appointmentController.updateAppointmentStatus.bind(appointmentController))
  );

  // PATCH /api/appointments/:id/cancel - Cancel Appointment Alias
  router.patch(
    "/:id/cancel",
    catchAsync(appointmentController.cancelAppointment.bind(appointmentController))
  );

  // DELETE /api/appointments/:id - Cancel Appointment
  router.delete(
    "/:id",
    catchAsync(appointmentController.cancelAppointment.bind(appointmentController))
  );

  return router;
}
