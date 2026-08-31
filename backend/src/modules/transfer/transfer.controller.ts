import { NextFunction, Request, Response } from "express";
import { TransferService } from "./transfer.service.js";
import { CreateTransferInput, UpdateTransferStatusInput } from "./transfer.schema.js";
import { sendSuccess } from "../../utils/api-response.js";
import { transferDto } from "./transfer.dto.js";
import hashId from "../../utils/hashId.js";
import { validationError } from "../../utils/errors.js";

export class TransferController {
  constructor(private transferService: TransferService) {}

  /**
   * Request Appointment Transfer
   * POST /api/transfers
   */
  async requestTransfer(
    req: Request<any, any, CreateTransferInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const transfer = await this.transferService.requestTransfer(
      requestingUserId,
      requestingUserRole,
      req.body
    );

    return sendSuccess(
      res,
      { transfer: transferDto(transfer) },
      "Transfer requested successfully",
      201
    );
  }

  /**
   * Get Transfers (Doctor sees incoming/outgoing; Admin sees all)
   * GET /api/transfers
   */
  async getTransfers(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;
    const { fromDoctorId, toDoctorId, status, page, limit } = req.query;

    let decodedFromId: number | undefined;
    if (fromDoctorId) {
      decodedFromId = hashId.decodeId(String(fromDoctorId)) ?? Number(fromDoctorId);
    }

    let decodedToId: number | undefined;
    if (toDoctorId) {
      decodedToId = hashId.decodeId(String(toDoctorId)) ?? Number(toDoctorId);
    }

    const result = await this.transferService.getTransfers(
      requestingUserId,
      requestingUserRole,
      {
        fromDoctorId: decodedFromId,
        toDoctorId: decodedToId,
        status: status as string | undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      }
    );

    return sendSuccess(
      res,
      {
        transfers: result.transfers.map(transferDto),
        meta: {
          totalCount: result.totalCount,
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
        },
      },
      "Transfers retrieved successfully"
    );
  }

  /**
   * Respond to Transfer (Accept / Reject / Cancel)
   * PATCH /api/transfers/:id/status
   */
  async respondToTransfer(
    req: Request<any, any, UpdateTransferStatusInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const rawId = req.params.id;
    const idString = Array.isArray(rawId) ? rawId[0] : rawId;
    const decodedId = hashId.decodeId(idString) ?? Number(idString);

    if (!decodedId || isNaN(decodedId)) {
      throw validationError("Invalid transfer ID");
    }

    const updatedTransfer = await this.transferService.respondToTransfer(
      requestingUserId,
      requestingUserRole,
      decodedId,
      req.body.status
    );

    return sendSuccess(
      res,
      { transfer: transferDto(updatedTransfer) },
      `Transfer ${req.body.status.toLowerCase()} successfully`
    );
  }
}
