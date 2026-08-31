import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { LoginInput, RegisterInput } from "./auth.schema.js";
import { sendSuccess } from "../../utils/api-response.js";
import { userDto } from "../user/user.dto.js";
import { unauthorized } from "../../utils/errors.js";

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(
    req: Request<any, any, RegisterInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const user = await this.authService.register(req.body);
    return sendSuccess(res, { user: userDto(user) }, "Registered successfully", 201);
  }

  async login(
    req: Request<any, any, LoginInput>,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    const { token, user } = await this.authService.login(req.body);

    // Set token in cookie (httpOnly for security)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendSuccess(res, { user: userDto(user), token }, "Logged in successfully");
  }

  async logout(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    res.clearCookie("token");
    return sendSuccess(res, null, "Logged out successfully");
  }

  async getMe(
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<Response> {
    if (!req.user) {
      throw unauthorized("Not authenticated");
    }

    const user = await this.authService.getMe(req.user.id);
    if (!user) {
      throw unauthorized("User not found");
    }

    return sendSuccess(res, { user: userDto(user) }, "User retrieved successfully");
  }
}
