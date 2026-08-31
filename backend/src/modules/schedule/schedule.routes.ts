import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { createScheduleExceptionSchema, updateWeeklyScheduleSchema } from "./schedule.schema.js";
import { ScheduleController } from "./schedule.controller.js";
import { authMiddleware, roleCheckMiddleware } from "../../middleware/auth.js";
import { UserRole } from "../../../prisma/interfaces.js";

export function scheduleRoutes(scheduleController: ScheduleController): Router {
  const router = Router();

  // Public / Logged-in: Get specific doctor schedule
  router.get(
    "/doctor/:doctorId",
    catchAsync(scheduleController.getDoctorScheduleById.bind(scheduleController))
  );

  // Authenticated doctor routes
  router.use(authMiddleware);

  // GET /api/schedules/my-schedule (DOCTOR ONLY)
  router.get(
    "/my-schedule",
    roleCheckMiddleware(UserRole.DOCTOR),
    catchAsync(scheduleController.getMySchedule.bind(scheduleController))
  );

  // PUT /api/schedules/my-schedule (DOCTOR ONLY)
  router.put(
    "/my-schedule",
    roleCheckMiddleware(UserRole.DOCTOR),
    validateMiddleware(updateWeeklyScheduleSchema),
    catchAsync(scheduleController.updateWeeklySchedule.bind(scheduleController))
  );

  // POST /api/schedules/exceptions (DOCTOR ONLY)
  router.post(
    "/exceptions",
    roleCheckMiddleware(UserRole.DOCTOR),
    validateMiddleware(createScheduleExceptionSchema),
    catchAsync(scheduleController.createException.bind(scheduleController))
  );

  // DELETE /api/schedules/exceptions/:id (DOCTOR or SUPER_ADMIN)
  router.delete(
    "/exceptions/:id",
    roleCheckMiddleware(UserRole.DOCTOR, UserRole.SUPER_ADMIN),
    catchAsync(scheduleController.deleteException.bind(scheduleController))
  );

  return router;
}
