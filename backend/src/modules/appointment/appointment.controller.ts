import { NextFunction, Request, Response } from "express";
import { AppointmentService } from "./appointment.service.js";
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
} from "./appointment.schema.js";
import { sendSuccess } from "../../utils/api-response.js";
import { appointmentDto } from "./appointment.dto.js";
import hashId from "../../utils/hashId.js";
import { validationError } from "../../utils/errors.js";

export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  /**
   * Create new appointment
   */
  async createAppointment(
    req: Request<any, any, CreateAppointmentInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const creatorId = req.user!.id;
    const creatorRole = req.user!.role;
    const data = req.body;

    const appointment = await this.appointmentService.createAppointment(
      creatorId,
      creatorRole,
      data
    );

    return sendSuccess(
      res,
      { appointment: appointmentDto(appointment) },
      "Appointment created successfully",
      201
    );
  }

  /**
   * Get / Filter appointments
   */
  async getAppointments(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const { patientId, doctorId, establishmentId, status, date, page, limit } = req.query;

    let decodedPatientId: number | undefined = undefined;
    if (patientId) {
      if (typeof patientId === "string") {
        decodedPatientId = hashId.decodeId(patientId) ?? Number(patientId);
      } else {
        decodedPatientId = Number(patientId);
      }
    }

    let decodedDoctorId: number | undefined = undefined;
    if (doctorId) {
      if (typeof doctorId === "string") {
        decodedDoctorId = hashId.decodeId(doctorId) ?? Number(doctorId);
      } else {
        decodedDoctorId = Number(doctorId);
      }
    }

    let decodedEstablishmentId: number | undefined = undefined;
    if (establishmentId) {
      if (typeof establishmentId === "string") {
        decodedEstablishmentId = hashId.decodeId(establishmentId) ?? Number(establishmentId);
      } else {
        decodedEstablishmentId = Number(establishmentId);
      }
    }

    const result = await this.appointmentService.getAppointments(
      requestingUserId,
      requestingUserRole,
      {
        patientId: decodedPatientId,
        doctorId: decodedDoctorId,
        establishmentId: decodedEstablishmentId,
        status: status as any,
        date: date as string | undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      }
    );

    return sendSuccess(
      res,
      {
        appointments: result.appointments.map(appointmentDto),
        meta: {
          totalCount: result.totalCount,
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
        },
      },
      "Appointments retrieved successfully"
    );
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const rawId = req.params.id;
    const idString = Array.isArray(rawId) ? rawId[0] : rawId;
    const decodedId = hashId.decodeId(idString);

    if (!decodedId) {
      throw validationError("Invalid appointment ID");
    }

    const appointment = await this.appointmentService.getAppointmentById(
      requestingUserId,
      requestingUserRole,
      decodedId
    );

    return sendSuccess(
      res,
      { appointment: appointmentDto(appointment) },
      "Appointment retrieved successfully"
    );
  }

  /**
   * Update appointment details
   */
  async updateAppointment(
    req: Request<any, any, UpdateAppointmentInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const rawId = req.params.id;
    const idString = Array.isArray(rawId) ? rawId[0] : rawId;
    const decodedId = hashId.decodeId(idString);

    if (!decodedId) {
      throw validationError("Invalid appointment ID");
    }

    const data = req.body;

    const appointment = await this.appointmentService.updateAppointment(
      requestingUserId,
      requestingUserRole,
      decodedId,
      data
    );

    return sendSuccess(
      res,
      { appointment: appointmentDto(appointment) },
      "Appointment updated successfully"
    );
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    req: Request<any, any, UpdateAppointmentStatusInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const rawId = req.params.id;
    const idString = Array.isArray(rawId) ? rawId[0] : rawId;
    const decodedId = hashId.decodeId(idString);

    if (!decodedId) {
      throw validationError("Invalid appointment ID");
    }

    const { status, notes } = req.body;

    const appointment = await this.appointmentService.updateStatus(
      requestingUserId,
      requestingUserRole,
      decodedId,
      status,
      notes
    );

    return sendSuccess(
      res,
      { appointment: appointmentDto(appointment) },
      "Appointment status updated successfully"
    );
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const rawId = req.params.id;
    const idString = Array.isArray(rawId) ? rawId[0] : rawId;
    const decodedId = hashId.decodeId(idString);

    if (!decodedId) {
      throw validationError("Invalid appointment ID");
    }

    const appointment = await this.appointmentService.cancelAppointment(
      requestingUserId,
      requestingUserRole,
      decodedId
    );

    return sendSuccess(
      res,
      { appointment: appointmentDto(appointment) },
      "Appointment cancelled successfully"
    );
  }
}
