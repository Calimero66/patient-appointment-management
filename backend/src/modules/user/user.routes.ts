import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { createUserSchema, forgetPasswordSchema, resetPasswordSchema, updateUserSchema, UpdateUserPasswordSchema } from "./user.schema.js";
import { UserController } from "./user.controller.js";
import { authMiddleware, roleCheckMiddleware } from "../../middleware/auth.js";
import { upload } from "../../utils/multerConfig.js";
import { UserRole } from "../../../prisma/interfaces.js";

export function userRoutes(userController: UserController): Router {
  const router = Router();

  // GET /api/users/doctors - Search / List Doctors by name or email (Accessible to all logged-in users / Patients)
  router.get(
    "/doctors",
    authMiddleware,
    catchAsync(userController.getDoctors.bind(userController))
  );

  // GET /api/users/my-patients - Search / List patients belonging to logged-in Doctor (DOCTOR ONLY)
  router.get(
    "/my-patients",
    authMiddleware,
    roleCheckMiddleware(UserRole.DOCTOR),
    catchAsync(userController.getMyPatients.bind(userController))
  );

  // GET /api/users - Get / Search users (SUPER_ADMIN, ESTABLISHMENT_ADMIN)
  router.get(
    "/",
    authMiddleware,
    roleCheckMiddleware(UserRole.SUPER_ADMIN, UserRole.ESTABLISHMENT_ADMIN),
    catchAsync(userController.getUsers.bind(userController))
  );

  // GET /api/users/search - Search users alias (SUPER_ADMIN, ESTABLISHMENT_ADMIN)
  router.get(
    "/search",
    authMiddleware,
    roleCheckMiddleware(UserRole.SUPER_ADMIN, UserRole.ESTABLISHMENT_ADMIN),
    catchAsync(userController.getUsers.bind(userController))
  );

  // POST /api/users/create - Super Admin & Establishment Admin
  router.post(
    "/create",
    authMiddleware,
    roleCheckMiddleware(UserRole.SUPER_ADMIN, UserRole.ESTABLISHMENT_ADMIN),
    validateMiddleware(createUserSchema),
    catchAsync(userController.createUser.bind(userController))
  );

  // PUT & PATCH /api/users/:id - Edit User Details by Hash ID (SUPER_ADMIN, ESTABLISHMENT_ADMIN)
  router.put(
    "/:id",
    authMiddleware,
    roleCheckMiddleware(UserRole.SUPER_ADMIN, UserRole.ESTABLISHMENT_ADMIN),
    validateMiddleware(updateUserSchema),
    catchAsync(userController.updateUser.bind(userController))
  );
  router.patch(
    "/:id",
    authMiddleware,
    roleCheckMiddleware(UserRole.SUPER_ADMIN, UserRole.ESTABLISHMENT_ADMIN),
    validateMiddleware(updateUserSchema),
    catchAsync(userController.updateUser.bind(userController))
  );

  // PATCH /api/users/update-password - User self password change
  router.patch(
    "/update-password",
    authMiddleware,
    validateMiddleware(UpdateUserPasswordSchema),
    catchAsync(userController.updateUserPassword.bind(userController))
  );

  // PATCH /api/users/update-profile-image - User self profile picture upload
  router.patch(
    "/update-profile-image",
    authMiddleware,
    upload.single("image"),
    catchAsync(userController.updateProfileImage.bind(userController))
  );

  // POST /api/users/forget-password
  router.post(
    "/forget-password",
    validateMiddleware(forgetPasswordSchema),
    catchAsync(userController.forgetPassword.bind(userController))
  );

  // POST /api/users/reset-password
  router.post(
    "/reset-password",
    validateMiddleware(resetPasswordSchema),
    catchAsync(userController.resetPassword.bind(userController))
  );

  // POST /api/users/validate-forget-password-token
  router.post(
    "/validate-forget-password-token",
    catchAsync(userController.validateForgetPasswordToken.bind(userController))
  );

  return router;
}
