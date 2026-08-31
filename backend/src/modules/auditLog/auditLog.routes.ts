import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AuditLogController } from "./auditLog.controller.js";
import { authMiddleware, roleCheckMiddleware } from "../../middleware/auth.js";
import { UserRole } from "../../../prisma/interfaces.js";

export function auditLogRoutes(auditLogController: AuditLogController): Router {
  const router = Router();

  // GET /api/audit-logs - Restricted to Super Admin ONLY
  router.get(
    "/",
    authMiddleware,
    roleCheckMiddleware(UserRole.SUPER_ADMIN),
    catchAsync(auditLogController.getAuditLogs.bind(auditLogController))
  );

  // GET /api/audit-logs/:id - Restricted to Super Admin ONLY
  router.get(
    "/:id",
    authMiddleware,
    roleCheckMiddleware(UserRole.SUPER_ADMIN),
    catchAsync(auditLogController.getAuditLogById.bind(auditLogController))
  );

  return router;
}
