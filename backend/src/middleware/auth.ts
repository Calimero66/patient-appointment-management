import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { verifyToken } from "../utils/jwt.js";
import { forbidden, unauthorized } from "../utils/errors.js";
import { requestContext } from "../utils/requestContext.js";
import { UserRole } from "../../prisma/interfaces.js";

export interface DecodedToken extends JwtPayload {
  id: number;
  email: string;
  role: UserRole;
  source: string;
}

declare module "express" {
  interface Request {
    user?: DecodedToken;
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token || req.header("Authorization");

    if (!token) {
      return next(unauthorized("No token provided"));
    }

    const decoded = verifyToken(token) as DecodedToken;
    if (!decoded?.id) {
      return next(unauthorized("Invalid or expired token"));
    }

    req.user = decoded;

    const store = requestContext.getStore();
    if (store) {
      store.userId = decoded.id;
    }

    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return next(unauthorized("Invalid or expired token"));
  }
};

export const roleCheckMiddleware = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(unauthorized("Not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        forbidden("You do not have permission to perform this action")
      );
    }

    return next();
  };
};


export const permissionCheckMiddleware = roleCheckMiddleware;
