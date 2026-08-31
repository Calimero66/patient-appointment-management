import { Request, Response } from "express";
import { NotificationService } from "./notification.service.js";
import hashId from "../../utils/hashId.js";

function formatNotification(n: any) {
  return {
    id: hashId.encodeId(n.id),
    rawId: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt,
  };
}

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async getNotifications(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const isReadParam = req.query.isRead;
    const isRead =
      isReadParam === "true" ? true : isReadParam === "false" ? false : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await this.notificationService.getNotifications(userId, {
      isRead,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: {
        notifications: result.notifications.map(formatNotification),
        unreadCount: result.unreadCount,
        meta: {
          totalCount: result.totalCount,
          page,
          limit,
        },
      },
    });
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const count = await this.notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const decoded = hashId.decodeId(paramId);
    const id = decoded !== null ? decoded : parseInt(paramId, 10);
    const notification = await this.notificationService.markAsRead(id, userId);

    res.status(200).json({
      success: true,
      data: { notification: formatNotification(notification) },
    });
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const result = await this.notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}
