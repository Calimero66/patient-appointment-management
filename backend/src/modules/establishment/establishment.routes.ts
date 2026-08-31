import { Router } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { validateMiddleware } from '../../middleware/validate.js';
import { authMiddleware, roleCheckMiddleware } from '../../middleware/auth.js';
import { UserRole } from '../../../prisma/interfaces.js';
import { EstablishmentController } from './establishment.controller.js';
import { createEstablishmentSchema, updateEstablishmentSchema, addEstablishmentUserSchema } from './establishment.schema.js';

export function establishmentRoutes(controller: EstablishmentController): Router {
  const router = Router();

  // GET /api/establishments/mine - Get logged-in user's establishments
  router.get('/mine', authMiddleware, catchAsync(controller.getMyEstablishments.bind(controller)));

  // GET /api/establishments - List/Search all active establishments (Accessible to all authenticated users: Patients, Doctors, Admins)
  router.get('/', authMiddleware, catchAsync(controller.getAll.bind(controller)));

  // GET /api/establishments/:id - Get establishment by ID (Accessible to all authenticated users)
  router.get('/:id', authMiddleware, catchAsync(controller.getById.bind(controller)));

  // POST /api/establishments - Create (SUPER_ADMIN only)
  router.post('/', authMiddleware, roleCheckMiddleware(UserRole.SUPER_ADMIN), validateMiddleware(createEstablishmentSchema), catchAsync(controller.create.bind(controller)));

  // PUT & PATCH /api/establishments/:id - Update (SUPER_ADMIN or ESTABLISHMENT_ADMIN)
  router.put('/:id', authMiddleware, roleCheckMiddleware(UserRole.SUPER_ADMIN, UserRole.ESTABLISHMENT_ADMIN), validateMiddleware(updateEstablishmentSchema), catchAsync(controller.update.bind(controller)));
  router.patch('/:id', authMiddleware, roleCheckMiddleware(UserRole.SUPER_ADMIN, UserRole.ESTABLISHMENT_ADMIN), validateMiddleware(updateEstablishmentSchema), catchAsync(controller.update.bind(controller)));

  // DELETE /api/establishments/:id - Delete (SUPER_ADMIN only)
  router.delete('/:id', authMiddleware, roleCheckMiddleware(UserRole.SUPER_ADMIN), catchAsync(controller.delete.bind(controller)));

  // POST /api/establishments/:id/users - Add user (doctor/admin) to establishment (SUPER_ADMIN, ESTABLISHMENT_ADMIN)
  router.post('/:id/users', authMiddleware, roleCheckMiddleware(UserRole.SUPER_ADMIN, UserRole.ESTABLISHMENT_ADMIN), validateMiddleware(addEstablishmentUserSchema), catchAsync(controller.addUser.bind(controller)));

  // GET /api/establishments/:id/users - List users/doctors in establishment (Accessible to all authenticated users)
  router.get('/:id/users', authMiddleware, catchAsync(controller.getUsers.bind(controller)));

  // DELETE /api/establishments/:id/users/:userId - Remove user from establishment (SUPER_ADMIN, ESTABLISHMENT_ADMIN)
  router.delete('/:id/users/:userId', authMiddleware, roleCheckMiddleware(UserRole.SUPER_ADMIN, UserRole.ESTABLISHMENT_ADMIN), catchAsync(controller.removeUser.bind(controller)));

  return router;
}
