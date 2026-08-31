import { NextFunction, Request, Response } from "express";
import { AuditLogService } from "./auditLog.service.js";
import { sendSuccess } from "../../utils/api-response.js";
import { auditLogDto } from "./auditLog.dto.js";
import hashId from "../../utils/hashId.js";
import { validationError } from "../../utils/errors.js";

export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  /**
   * Super Admin: Get / Search audit logs with pagination and filters.
   */
  async getAuditLogs(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const { entity, action, userId, page, limit } = req.query;

    let decodedUserId: number | undefined = undefined;
    if (userId) {
      if (typeof userId === "string") {
        const decoded = hashId.decodeId(userId);
        decodedUserId = decoded ?? Number(userId);
      } else {
        decodedUserId = Number(userId);
      }
    }

    const result = await this.auditLogService.getLogs({
      entity: entity as string | undefined,
      action: action as string | undefined,
      userId: decodedUserId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    return sendSuccess(
      res,
      {
        logs: result.logs.map(auditLogDto),
        meta: {
          totalCount: result.totalCount,
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
        },
      },
      "Audit logs retrieved successfully"
    );
  }

  /**
   * Super Admin: Get single audit log entry by ID.
   */
  async getAuditLogById(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const rawId = req.params.id;
    const idString = Array.isArray(rawId) ? rawId[0] : rawId;
    const decodedId = hashId.decodeId(idString);

    if (!decodedId) {
      throw validationError("Invalid audit log ID");
    }

    const log = await this.auditLogService.getLogById(decodedId);

    return sendSuccess(
      res,
      { log: auditLogDto(log) },
      "Audit log retrieved successfully"
    );
  }
}
