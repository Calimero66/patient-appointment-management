import hashId from "../../utils/hashId.js";

export function doctorScheduleDto(schedule: any) {
  if (!schedule) return null;

  const formatTime = (d: Date | string) => {
    if (!d) return "09:00";
    if (typeof d === "string" && d.length <= 8 && d.includes(":")) return d.slice(0, 5);
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "09:00";
    const hh = String(dateObj.getUTCHours()).padStart(2, "0");
    const mm = String(dateObj.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  return {
    id: hashId.encodeId(schedule.id) || String(schedule.id),
    doctorId: hashId.encodeId(schedule.doctorId) || String(schedule.doctorId),
    establishmentId: hashId.encodeId(schedule.establishmentId) || String(schedule.establishmentId),
    dayOfWeek: schedule.dayOfWeek,
    startTime: formatTime(schedule.startTime),
    endTime: formatTime(schedule.endTime),
    isActive: schedule.isActive,
    createdAt: schedule.createdAt,
  };
}

export function scheduleExceptionDto(exception: any) {
  if (!exception) return null;

  const formatDate = (d: Date | string) => {
    if (!d) return "";
    const dateObj = new Date(d);
    return dateObj.toISOString().split("T")[0];
  };

  return {
    id: hashId.encodeId(exception.id) || String(exception.id),
    doctorId: hashId.encodeId(exception.doctorId) || String(exception.doctorId),
    establishmentId: hashId.encodeId(exception.establishmentId) || String(exception.establishmentId),
    exceptionDate: formatDate(exception.exceptionDate),
    type: exception.type,
    reason: exception.reason,
    createdAt: exception.createdAt,
  };
}
