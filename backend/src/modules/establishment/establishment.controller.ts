import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { validationError } from '../../utils/errors.js';
import hashId from '../../utils/hashId.js';
import { EstablishmentService } from './establishment.service.js';
import { establishmentDto, establishmentUserDto } from './establishment.dto.js';

export class EstablishmentController {
  constructor(private establishmentService: EstablishmentService) {}

  async create(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    const creatorId = req.user!.id;
    const data = req.body;
    
    const establishment = await this.establishmentService.create(creatorId, data);
    
    return sendSuccess(res, { establishment: establishmentDto(establishment) }, 'Establishment created successfully', 201);
  }

  async getAll(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    const { search, page, limit } = req.query;
    
    const query = {
      search: typeof search === 'string' ? search : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    const { establishments, totalCount } = await this.establishmentService.search(query);
    
    return sendSuccess(res, { 
      establishments: establishments.map(establishmentDto), 
      meta: { totalCount, page: query.page, limit: query.limit } 
    }, 'Establishments retrieved successfully');
  }

  async getById(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    const decodedId = hashId.decodeId(rawId) ?? Number(rawId);
    if (!decodedId || isNaN(decodedId)) throw validationError('Invalid establishment ID');

    const establishment = await this.establishmentService.findById(decodedId);
    
    return sendSuccess(res, { establishment: establishmentDto(establishment) }, 'Establishment retrieved successfully');
  }

  async update(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    const requestingUserId = req.user!.id;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    const decodedId = hashId.decodeId(rawId) ?? Number(rawId);
    if (!decodedId || isNaN(decodedId)) throw validationError('Invalid establishment ID');

    const updated = await this.establishmentService.update(requestingUserId, decodedId, req.body);
    
    return sendSuccess(res, { establishment: establishmentDto(updated) }, 'Establishment updated successfully');
  }

  async delete(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    const requestingUserId = req.user!.id;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    const decodedId = hashId.decodeId(rawId) ?? Number(rawId);
    if (!decodedId || isNaN(decodedId)) throw validationError('Invalid establishment ID');

    const deleted = await this.establishmentService.delete(requestingUserId, decodedId);
    
    return sendSuccess(res, { establishment: establishmentDto(deleted) }, 'Establishment deleted successfully');
  }

  async addUser(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    const requestingUserId = req.user!.id;
    
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    const establishmentId = hashId.decodeId(rawId) ?? Number(rawId);
    if (!establishmentId || isNaN(establishmentId)) throw validationError('Invalid establishment ID');

    // Decode userId if it was passed as hash, fallback to Number if it's already a number
    const rawUserId = req.body.userId;
    const decodedUserId = typeof rawUserId === 'string' ? (hashId.decodeId(rawUserId) ?? Number(rawUserId)) : Number(rawUserId);
    if (!decodedUserId || isNaN(decodedUserId)) throw validationError('Invalid user ID');

    const added = await this.establishmentService.addUser(requestingUserId, establishmentId, {
      userId: decodedUserId,
      role: req.body.role,
    });
    
    return sendSuccess(res, { establishmentUser: establishmentUserDto(added) }, 'User added to establishment successfully', 201);
  }

  async removeUser(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    const requestingUserId = req.user!.id;
    
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    const establishmentId = hashId.decodeId(rawId) ?? Number(rawId);
    if (!establishmentId || isNaN(establishmentId)) throw validationError('Invalid establishment ID');

    const rawUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : String(req.params.userId || '');
    const userId = hashId.decodeId(rawUserId) ?? Number(rawUserId);
    if (!userId || isNaN(userId)) throw validationError('Invalid user ID');

    const removed = await this.establishmentService.removeUser(requestingUserId, establishmentId, userId);
    
    return sendSuccess(res, { establishmentUser: establishmentUserDto(removed) }, 'User removed from establishment successfully');
  }

  async getUsers(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    const establishmentId = hashId.decodeId(rawId) ?? Number(rawId);
    if (!establishmentId || isNaN(establishmentId)) throw validationError('Invalid establishment ID');

    const users = await this.establishmentService.getUsers(establishmentId);
    
    return sendSuccess(res, { users: users.map(establishmentUserDto) }, 'Users retrieved successfully');
  }

  async getMyEstablishments(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    const userId = req.user!.id;
    const establishments = await this.establishmentService.getUserEstablishments(userId);
    
    return sendSuccess(res, { establishments: establishments.map(establishmentUserDto) }, 'My establishments retrieved successfully');
  }
}
