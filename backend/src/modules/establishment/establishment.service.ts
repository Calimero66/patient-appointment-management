import { notFound, conflict, validationError } from '../../utils/errors.js';
import prisma from '../../prisma/client.js';
import { EstablishmentRepository } from './establishment.repository.js';
import { AuditLogService } from '../auditLog/auditLog.service.js';
import { 
  CreateEstablishmentInput, 
  UpdateEstablishmentInput, 
  AddEstablishmentUserInput, 
  SearchEstablishmentQueryInput 
} from './establishment.schema.js';

export class EstablishmentService {
  constructor(
    private establishmentRepository: EstablishmentRepository,
    private auditLogService?: AuditLogService
  ) {}

  async create(creatorId: number, data: CreateEstablishmentInput) {
    const establishment = await this.establishmentRepository.create(data);
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: creatorId,
        action: 'CREATE_ESTABLISHMENT',
        entity: 'Establishment',
        entityId: establishment.id,
        newValue: establishment,
      });
    }
    return establishment;
  }

  async findById(id: number) {
    const establishment = await this.establishmentRepository.findById(id);
    if (!establishment) throw notFound('Establishment');
    return establishment;
  }

  async findAll() {
    return this.establishmentRepository.findAll();
  }

  async search(query: SearchEstablishmentQueryInput) {
    return this.establishmentRepository.search(query);
  }

  async update(requestingUserId: number, id: number, data: UpdateEstablishmentInput) {
    const establishment = await this.findById(id);
    const updated = await this.establishmentRepository.update(id, data);
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: requestingUserId,
        action: 'UPDATE_ESTABLISHMENT',
        entity: 'Establishment',
        entityId: id,
        oldValue: establishment,
        newValue: updated,
      });
    }
    return updated;
  }

  async delete(requestingUserId: number, id: number) {
    const establishment = await this.findById(id);
    const deleted = await this.establishmentRepository.delete(id);
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: requestingUserId,
        action: 'DELETE_ESTABLISHMENT',
        entity: 'Establishment',
        entityId: id,
        oldValue: establishment,
      });
    }
    return deleted;
  }

  async addUser(requestingUserId: number, establishmentId: number, data: AddEstablishmentUserInput) {
    await this.findById(establishmentId);
    
    // 1. Check user existence and validate role (only DOCTOR and ESTABLISHMENT_ADMIN allowed)
    const targetUser = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (!targetUser) {
      throw notFound('User');
    }

    if (targetUser.role !== 'DOCTOR' && targetUser.role !== 'ESTABLISHMENT_ADMIN') {
      throw validationError('Only Doctors and Establishment Admins can be assigned to an establishment (Super Admins and Patients cannot be assigned).');
    }

    // 2. Check if user is already assigned to ANY establishment
    const existingEstablishments = await this.establishmentRepository.findEstablishmentsByUser(data.userId);
    if (existingEstablishments && existingEstablishments.length > 0) {
      const currentEstName = existingEstablishments[0].establishment?.name || 'another establishment';
      throw conflict(`This user is already assigned to "${currentEstName}". You must remove them from their current establishment before assigning them to a new one.`);
    }

    const added = await this.establishmentRepository.addUser({ establishmentId, userId: data.userId, role: data.role });
    
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: requestingUserId,
        action: 'ADD_ESTABLISHMENT_USER',
        entity: 'EstablishmentUser',
        entityId: added.id,
        newValue: { establishmentId, userId: data.userId, role: data.role },
      });
    }
    return added;
  }

  async removeUser(requestingUserId: number, establishmentId: number, userId: number) {
    const existing = await this.establishmentRepository.findEstablishmentUser(establishmentId, userId);
    if (!existing) {
      throw notFound('EstablishmentUser');
    }

    const removed = await this.establishmentRepository.removeUser(establishmentId, userId);
    
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: requestingUserId,
        action: 'REMOVE_ESTABLISHMENT_USER',
        entity: 'EstablishmentUser',
        entityId: existing.id,
        oldValue: { establishmentId, userId },
      });
    }
    return removed;
  }

  async getUsers(establishmentId: number) {
    return this.establishmentRepository.findUsersByEstablishment(establishmentId);
  }

  async getUserEstablishments(userId: number) {
    return this.establishmentRepository.findEstablishmentsByUser(userId);
  }
}
