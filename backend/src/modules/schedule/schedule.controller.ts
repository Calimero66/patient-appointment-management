import { NextFunction, Request, Response } from "express";
import { ScheduleService } from "./schedule.service.js";
import { CreateScheduleExceptionInput, UpdateWeeklyScheduleInput } from "./schedule.schema.js";
import { sendSuccess } from "../../utils/api-response.js";
import { doctorScheduleDto, scheduleExceptionDto } from "./schedule.dto.js";
import hashId from "../../utils/hashId.js";
import { validationError } from "../../utils/errors.js";
import prisma from "../../prisma/client.js";

export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  /**
   * Helper to extract and decode establishmentId from query params,
   * or auto-resolve from the doctor's establishment assignments.
   */
  private async getEstablishmentId(req: Request, targetDoctorId?: number): Promise<number> {
    const rawEstId = req.query.establishmentId as string;
    if (rawEstId) {
      const estId = hashId.decodeId(rawEstId) ?? Number(rawEstId);
      if (estId && !isNaN(estId)) return estId;
    }

    const docId = targetDoctorId || req.user?.id;
    if (docId) {
      const link = await prisma.establishmentUser.findFirst({
        where: { userId: docId },
        orderBy: { id: "asc" },
      });
      if (link) return link.establishmentId;
    }

    const defaultEst = await prisma.establishment.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
    if (defaultEst) return defaultEst.id;

    return 1;
  }

  /**
   * Get Logged-In Doctor's Schedule
   * GET /api/schedules/my-schedule?establishmentId=xxx
   */
  async getMySchedule(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const doctorId = req.user!.id;
    const establishmentId = await this.getEstablishmentId(req, doctorId);

    const result = await this.scheduleService.getDoctorSchedule(doctorId, establishmentId);

    return sendSuccess(
      res,
      {
        schedules: result.schedules.map(doctorScheduleDto),
        exceptions: result.exceptions.map(scheduleExceptionDto),
      },
      "Schedule retrieved successfully"
    );
  }

  /**
   * Get Schedule for specific doctor (Public / Patient view)
   * GET /api/schedules/doctor/:doctorId?establishmentId=xxx
   */
  async getDoctorScheduleById(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const rawId = req.params.doctorId;
    const decodedId = hashId.decodeId(String(rawId)) ?? Number(rawId);

    if (!decodedId || isNaN(decodedId)) {
      throw validationError("Invalid doctor ID");
    }

    const establishmentId = await this.getEstablishmentId(req, decodedId);

    const result = await this.scheduleService.getDoctorSchedule(decodedId, establishmentId);

    return sendSuccess(
      res,
      {
        schedules: result.schedules.map(doctorScheduleDto),
        exceptions: result.exceptions.map(scheduleExceptionDto),
      },
      "Doctor schedule retrieved successfully"
    );
  }

  /**
   * Update Weekly Schedule
   * PUT /api/schedules/my-schedule?establishmentId=xxx
   */
  async updateWeeklySchedule(
    req: Request<any, any, UpdateWeeklyScheduleInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const doctorId = req.user!.id;
    const establishmentId = await this.getEstablishmentId(req, doctorId);

    const schedules = await this.scheduleService.updateWeeklySchedule(
      doctorId,
      establishmentId,
      req.body
    );

    return sendSuccess(
      res,
      { schedules: schedules.map(doctorScheduleDto) },
      "Weekly schedule updated successfully"
    );
  }

  /**
   * Add Schedule Exception (Vacation / Leave / Date Range)
   * POST /api/schedules/exceptions?establishmentId=xxx
   */
  async createException(
    req: Request<any, any, CreateScheduleExceptionInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const doctorId = req.user!.id;
    const establishmentId = await this.getEstablishmentId(req, doctorId);

    const result = await this.scheduleService.createException(
      doctorId,
      establishmentId,
      req.body
    );

    const formattedExceptions = result.exceptions.map(scheduleExceptionDto);
    const formattedConflicts = result.conflictingAppointments.map((app: any) => ({
      id: hashId.encodeId(app.id) || String(app.id),
      patientName: `${app.patient?.firstName || ""} ${app.patient?.lastName || ""}`.trim(),
      patientEmail: app.patient?.email,
      patientPhone: app.patient?.phone,
      appointmentDate: app.appointmentDate
        ? new Date(app.appointmentDate).toISOString().split("T")[0]
        : "",
      startTime: app.startTime
        ? new Date(app.startTime).toISOString().slice(11, 16)
        : "09:00",
      status: app.status,
      reason: app.reason,
    }));

    const message =
      result.totalDays > 1
        ? `Time-off registered successfully for ${result.totalDays} days.`
        : "Schedule exception added successfully.";

    return sendSuccess(
      res,
      {
        exception: formattedExceptions[0] || null,
        exceptions: formattedExceptions,
        totalDays: result.totalDays,
        conflictingAppointmentsCount: formattedConflicts.length,
        conflictingAppointments: formattedConflicts,
      },
      message,
      201
    );
  }

  /**
   * Delete Schedule Exception
   * DELETE /api/schedules/exceptions/:id
   */
  async deleteException(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const rawId = req.params.id;
    const idString = Array.isArray(rawId) ? rawId[0] : rawId;
    const decodedId = hashId.decodeId(idString) ?? Number(idString);

    if (!decodedId || isNaN(decodedId)) {
      throw validationError("Invalid exception ID");
    }

    const deleted = await this.scheduleService.deleteException(
      requestingUserId,
      requestingUserRole,
      decodedId
    );

    return sendSuccess(
      res,
      { exception: scheduleExceptionDto(deleted) },
      "Schedule exception removed successfully"
    );
  }
}
