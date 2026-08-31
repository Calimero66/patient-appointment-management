import { AuditLog } from "../../../prisma/interfaces.js";
import hashId from "../../utils/hashId.js";
import { userDto } from "../user/user.dto.js";

export const auditLogDto = (log: AuditLog) => {
  return {
    id: hashId.encodeId(log.id),
    userId: hashId.encodeId(log.userId),
    action: log.action,
    entity: log.entity,
    entityId: hashId.encodeId(log.entityId),
    oldValue: log.oldValue ? tryParseJson(log.oldValue) : null,
    newValue: log.newValue ? tryParseJson(log.newValue) : null,
    createdAt: log.createdAt,
    user: (log as any).user ? userDto((log as any).user) : null,
  };
};

function tryParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
