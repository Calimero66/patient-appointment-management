import { AuditLog } from "../../../prisma/interfaces.js";
import prisma from "../../prisma/client.js";

export class AuditLogRepository {
  async createLog(data: {
    userId: number;
    action: string;
    entity: string;
    entityId: number;
    oldValue?: string | null;
    newValue?: string | null;
  }): Promise<AuditLog> {
    return (await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue ?? null,
        newValue: data.newValue ?? null,
      },
      include: {
        user: true,
      },
    })) as AuditLog;
  }

  async findLogs(options: {
    entity?: string;
    action?: string;
    userId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; totalCount: number }> {
    const { entity, action, userId, page = 1, limit = 10 } = options;

    const where: any = {};

    if (entity) {
      where.entity = entity;
    }

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    const totalCount = await prisma.auditLog.count({ where });
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { logs: logs as AuditLog[], totalCount };
  }

  async findById(id: number): Promise<AuditLog | null> {
    return (await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })) as AuditLog | null;
  }
}
