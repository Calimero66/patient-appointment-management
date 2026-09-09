import { NextFunction, Request, Response } from "express";
import { UserService } from "./user.service.js";
import {
  CreateUserInput,
  ForgetPasswordInput,
  ResetPasswordInput,
  UpdateUserInput,
  UpdateUserPasswordInput,
} from "./user.schema.js";
import { sendSuccess } from "../../utils/api-response.js";
import { validationError } from "../../utils/errors.js";
import { userDto } from "./user.dto.js";
import hashId from "../../utils/hashId.js";
import prisma from "../../prisma/client.js";

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Super Admin & Establishment Admin: Get / Search users by name or email with optional role / establishment filter.
   */
  async getUsers(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const { search, role, establishmentId, page, limit } = req.query;

    let decodedEstablishmentId = establishmentId
      ? (hashId.decodeId(String(establishmentId)) ?? Number(establishmentId))
      : undefined;

    if (!decodedEstablishmentId && req.user!.role === "ESTABLISHMENT_ADMIN") {
      const adminEst = await prisma.establishmentUser.findFirst({
        where: { userId: req.user!.id, role: "ADMIN" },
      });
      if (adminEst) {
        decodedEstablishmentId = adminEst.establishmentId;
      }
    }

    const result = await this.userService.searchUsers({
      search: search as string | undefined,
      role: role as any,
      establishmentId: decodedEstablishmentId && !isNaN(decodedEstablishmentId) ? decodedEstablishmentId : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    return sendSuccess(
      res,
      {
        users: result.users.map(userDto),
        meta: {
          totalCount: result.totalCount,
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
        },
      },
      "Users retrieved successfully"
    );
  }

  /**
   * Public / Patient / All Users: Search Doctors by name, email, specialty or establishment.
   */
  async getDoctors(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const { search, specialty, specialtyId, establishmentId, page, limit } = req.query;

    const decodedEstablishmentId = establishmentId
      ? (hashId.decodeId(String(establishmentId)) ?? Number(establishmentId))
      : undefined;

    const decodedSpecialtyId = specialtyId
      ? (hashId.decodeId(String(specialtyId)) ?? Number(specialtyId))
      : undefined;

    const result = await this.userService.getDoctors({
      search: search as string | undefined,
      specialty: specialty as string | undefined,
      specialtyId: decodedSpecialtyId && !isNaN(decodedSpecialtyId) ? decodedSpecialtyId : undefined,
      establishmentId: decodedEstablishmentId && !isNaN(decodedEstablishmentId) ? decodedEstablishmentId : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    return sendSuccess(
      res,
      {
        doctors: result.doctors.map(userDto),
        meta: {
          totalCount: result.totalCount,
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
        },
      },
      "Doctors retrieved successfully"
    );
  }

  /**
   * Doctor: Get / Search patients who have appointments with this Doctor.
   */
  async getMyPatients(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const doctorId = req.user!.id;
    const { search, page, limit } = req.query;

    const result = await this.userService.getDoctorPatients(doctorId, {
      search: search as string | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    return sendSuccess(
      res,
      {
        patients: result.patients.map(userDto),
        meta: {
          totalCount: result.totalCount,
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
        },
      },
      "Doctor patients retrieved successfully"
    );
  }

  async createUser(
    req: Request<any, any, CreateUserInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const creatorId = req.user!.id;
    const creatorRole = req.user!.role;
    const data = req.body;

    const newUser = await this.userService.createUser(creatorId, creatorRole, data);

    return sendSuccess(
      res,
      { user: userDto(newUser) },
      "User created successfully",
      201
    );
  }

  /**
   * Edit User Details (By Hash ID in URL: PUT /api/users/:id or PATCH /api/users/:id)
   */
  async updateUser(
    req: Request<any, any, UpdateUserInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const rawId = req.params.id;
    const decodedId = hashId.decodeId(rawId) ?? Number(rawId);

    if (!decodedId || isNaN(decodedId)) {
      throw validationError("Invalid user ID");
    }

    const updatedUser = await this.userService.updateUser(
      requestingUserId,
      requestingUserRole,
      decodedId,
      req.body
    );

    return sendSuccess(
      res,
      { user: userDto(updatedUser) },
      "User details updated successfully"
    );
  }

  /**
   * Edit Logged-In User Profile Details (PUT /api/users/profile or PATCH /api/users/profile)
   */
  async updateProfile(
    req: Request<any, any, UpdateUserInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    const updatedUser = await this.userService.updateUser(
      requestingUserId,
      requestingUserRole,
      requestingUserId,
      req.body
    );

    return sendSuccess(
      res,
      { user: userDto(updatedUser) },
      "Profile updated successfully"
    );
  }

  async updateUserPassword(
    req: Request<any, any, UpdateUserPasswordInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const userId = req.user!.id;
    const data = req.body;

    await this.userService.updatePassword(userId, data);

    return sendSuccess(res, null, "Password updated successfully");
  }

  async updateProfileImage(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const userId = req.user!.id;

    if (!req.file) {
      throw validationError("Profile image is required");
    }

    await this.userService.updateProfileImage(userId, req.file.filename);

    return sendSuccess(res, null, "Profile image updated successfully");
  }

  async forgetPassword(
    req: Request<any, any, ForgetPasswordInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const { email } = req.body;
    await this.userService.forgetPassword(email);

    return sendSuccess(
      res,
      null,
      "If the email is registered, you will receive a password reset link shortly"
    );
  }

  async resetPassword(
    req: Request<any, any, ResetPasswordInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const { token, password } = req.body;

    const updatedUser = await this.userService.resetPassword(token, password);

    return sendSuccess(
      res,
      { user: userDto(updatedUser) },
      "Password reset successfully"
    );
  }

  async validateForgetPasswordToken(
    req: Request<any, any, { token: string }>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const { token } = req.body;

    const user = await this.userService.validateForgetPasswordToken(token);

    return sendSuccess(
      res,
      { user: userDto(user) },
      "Forget password token validated successfully"
    );
  }
}
