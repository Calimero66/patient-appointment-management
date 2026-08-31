import prisma from "../../prisma/client.js";

export interface NotificationRecord {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export class NotificationRepository {
  async findMany(options: {
    userId: number;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ notifications: NotificationRecord[]; totalCount: number }> {
    const { userId, isRead, page = 1, limit = 20 } = options;
    const where: any = { userId };

    if (typeof isRead === "boolean") {
      where.isRead = isRead;
    }

    const totalCount = await prisma.notification.count({ where });
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { notifications: notifications as NotificationRecord[], totalCount };
  }

  async findById(id: number): Promise<NotificationRecord | null> {
    return (await prisma.notification.findUnique({
      where: { id },
    })) as NotificationRecord | null;
  }

  async create(data: {
    userId: number;
    title: string;
    message: string;
    type?: string;
  }): Promise<NotificationRecord> {
    return (await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        isRead: false,
      },
    })) as NotificationRecord;
  }

  async markAsRead(id: number, userId: number): Promise<NotificationRecord | null> {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) return null;

    return (await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })) as NotificationRecord;
  }

  async markAllAsRead(userId: number): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
