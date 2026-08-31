import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { authMiddleware } from "../../middleware/auth.js";

export function authRoutes(authController: AuthController): Router {
  const router = Router();

  // POST /api/auth/register
  router.post(
    "/register",
    validateMiddleware(registerSchema),
    catchAsync(authController.register.bind(authController))
  );

  // POST /api/auth/login
  router.post(
    "/login",
    validateMiddleware(loginSchema),
    catchAsync(authController.login.bind(authController))
  );

  // POST /api/auth/logout
  router.post(
    "/logout",
    authMiddleware,
    catchAsync(authController.logout.bind(authController))
  );

  // GET /api/auth/me
  router.get(
    "/me",
    authMiddleware,
    catchAsync(authController.getMe.bind(authController))
  );

  return router;
}
