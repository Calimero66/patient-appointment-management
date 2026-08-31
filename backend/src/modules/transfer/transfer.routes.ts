import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { createTransferSchema, updateTransferStatusSchema } from "./transfer.schema.js";
import { TransferController } from "./transfer.controller.js";
import { authMiddleware, roleCheckMiddleware } from "../../middleware/auth.js";
import { UserRole } from "../../../prisma/interfaces.js";

export function transferRoutes(transferController: TransferController): Router {
  const router = Router();

  // All transfer routes require authentication
  router.use(authMiddleware);

  // POST /api/transfers - Request Appointment Transfer (Patient, Doctor, Super Admin)
  router.post(
    "/",
    roleCheckMiddleware(UserRole.PATIENT, UserRole.DOCTOR, UserRole.SUPER_ADMIN),
    validateMiddleware(createTransferSchema),
    catchAsync(transferController.requestTransfer.bind(transferController))
  );

  // GET /api/transfers - List transfers (Patient, Doctor, Super Admin)
  router.get(
    "/",
    roleCheckMiddleware(UserRole.PATIENT, UserRole.DOCTOR, UserRole.SUPER_ADMIN),
    catchAsync(transferController.getTransfers.bind(transferController))
  );

  // PATCH /api/transfers/:id/status - Accept / Reject / Cancel transfer (Doctor, Super Admin)
  router.patch(
    "/:id/status",
    roleCheckMiddleware(UserRole.DOCTOR, UserRole.SUPER_ADMIN),
    validateMiddleware(updateTransferStatusSchema),
    catchAsync(transferController.respondToTransfer.bind(transferController))
  );

  return router;
}
