// ─── HTTP Status Codes ─────────────────────────────────────────────────────────

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

// ─── Base Error ────────────────────────────────────────────────────────────────

/**
 * Base class for all API errors.
 * `details` carries field-level validation messages.
 */
export class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly details?: unknown;

  constructor(name: string, message: string, statusCode: HttpStatusCode, details?: unknown) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── 400 Bad Request ──────────────────────────────────────────────────────────

export class BadRequestError extends ApiError {
  constructor(message = 'Bad request') {
    super('BadRequestError', message, HttpStatus.BAD_REQUEST);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: unknown) {
    super('ValidationError', message, HttpStatus.BAD_REQUEST, details);
  }
}

// ─── 401 Unauthorized ─────────────────────────────────────────────────────────

export class UnauthorizedError extends ApiError {
  constructor(message = 'You must be logged in to access this resource') {
    super('UnauthorizedError', message, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidCredentialsError extends ApiError {
  constructor(message = 'Incorrect email or password') {
    super('UnauthorizedError', message, HttpStatus.UNAUTHORIZED);
  }
}

// ─── 403 Forbidden ────────────────────────────────────────────────────────────

export class ForbiddenError extends ApiError {
  constructor(message = 'You do not have permission to perform this action') {
    super('ForbiddenError', message, HttpStatus.FORBIDDEN);
  }
}

// ─── 404 Not Found ────────────────────────────────────────────────────────────

export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super('NotFoundError', `${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

// ─── 409 Conflict ─────────────────────────────────────────────────────────────

export class ConflictError extends ApiError {
  constructor(field = 'Resource') {
    super('ConflictError', `${field} already in use`, HttpStatus.CONFLICT);
  }
}

// ─── 429 Too Many Requests ────────────────────────────────────────────────────

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Too many requests, please try again later') {
    super('TooManyRequestsError', message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

// ─── 500 Internal Server Error ────────────────────────────────────────────────

export class InternalServerError extends ApiError {
  constructor(message = 'An unexpected error occurred. Please try again later.') {
    super('InternalServerError', message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// ─── Factory Helper Functions ──────────────────────────────────────────────────
// Used throughout the codebase as shorthand for throwing common errors.

export const badRequest = (message?: string) => new BadRequestError(message);
export const validationError = (message?: string, details?: unknown) => new ValidationError(message, details);
export const unauthorized = (message?: string) => new UnauthorizedError(message);
export const forbidden = (message?: string) => new ForbiddenError(message);
export const notFound = (resource?: string) => new NotFoundError(resource);
export const conflict = (field?: string) => new ConflictError(field);
export const internal = (message?: string) => new InternalServerError(message);

// ─── API Response Helpers ─────────────────────────────────────────────────────

import type { Response } from 'express';

export const ApiResponse = {
  ok<T>(res: Response, data: T, message = 'Success') {
    return res.status(HttpStatus.OK).json({ success: true, statusCode: HttpStatus.OK, message, data });
  },

  created<T>(res: Response, data: T, message = 'Created successfully') {
    return res.status(HttpStatus.CREATED).json({ success: true, statusCode: HttpStatus.CREATED, message, data });
  },

  noContent(res: Response) {
    return res.status(HttpStatus.NO_CONTENT).send();
  },

  paginated<T>(
    res: Response,
    data: T[],
    pagination: { total: number; page: number; limit: number },
    message = 'Fetched successfully',
  ) {
    return res.status(HttpStatus.OK).json({
      success: true,
      statusCode: HttpStatus.OK,
      message,
      data,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    });
  },
};
