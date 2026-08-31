import { NotificationRepository, NotificationRecord } from "./notification.repository.js";
import { notFound } from "../../utils/errors.js";

export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  async getNotifications(
    userId: number,
    query: { isRead?: boolean; page?: number; limit?: number }
  ): Promise<{ notifications: NotificationRecord[]; totalCount: number; unreadCount: number }> {
    const { notifications, totalCount } = await this.notificationRepository.findMany({
      userId,
      isRead: query.isRead,
      page: query.page,
      limit: query.limit,
    });
    const unreadCount = await this.notificationRepository.getUnreadCount(userId);

    return { notifications, totalCount, unreadCount };
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.getUnreadCount(userId);
  }

  async markAsRead(id: number, userId: number): Promise<NotificationRecord> {
    const updated = await this.notificationRepository.markAsRead(id, userId);
    if (!updated) {
      throw notFound("Notification not found");
    }
    return updated;
  }

  async markAllAsRead(userId: number): Promise<{ updatedCount: number }> {
    const updatedCount = await this.notificationRepository.markAllAsRead(userId);
    return { updatedCount };
  }

  async createNotification(
    userId: number,
    title: string,
    message: string,
    type: string = "INFO"
  ): Promise<NotificationRecord> {
    return await this.notificationRepository.create({
      userId,
      title,
      message,
      type,
    });
  }
}
