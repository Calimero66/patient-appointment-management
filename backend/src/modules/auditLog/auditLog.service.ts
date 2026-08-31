import { AuditLogRepository } from "./auditLog.repository.js";
import { AuditLog } from "../../../prisma/interfaces.js";
import { notFound } from "../../utils/errors.js";

export class AuditLogService {
  constructor(private auditLogRepository: AuditLogRepository) {}

  async log(data: {
    userId: number;
    action: string;
    entity: string;
    entityId: number;
    oldValue?: any;
    newValue?: any;
  }): Promise<AuditLog> {
    return await this.auditLogRepository.createLog({
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
      newValue: data.newValue ? JSON.stringify(data.newValue) : null,
    });
  }

  async getLogs(query: {
    entity?: string;
    action?: string;
    userId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; totalCount: number }> {
    return await this.auditLogRepository.findLogs(query);
  }

  async getLogById(id: number): Promise<AuditLog> {
    const log = await this.auditLogRepository.findById(id);
    if (!log) throw notFound("Audit Log");
    return log;
  }
}
