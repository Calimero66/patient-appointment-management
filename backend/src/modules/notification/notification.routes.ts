import { Router } from "express";
import { NotificationController } from "./notification.controller.js";
import { authMiddleware } from "../../middleware/auth.js";
import { catchAsync } from "../../utils/catchAsync.js";

export function notificationRoutes(controller: NotificationController): Router {
  const router = Router();

  router.use(authMiddleware);

  // GET /api/notifications
  router.get("/", catchAsync(controller.getNotifications.bind(controller)));

  // GET /api/notifications/unread-count
  router.get("/unread-count", catchAsync(controller.getUnreadCount.bind(controller)));

  // PATCH /api/notifications/read-all
  router.patch("/read-all", catchAsync(controller.markAllAsRead.bind(controller)));

  // PATCH /api/notifications/:id/read
  router.patch("/:id/read", catchAsync(controller.markAsRead.bind(controller)));

  return router;
}
