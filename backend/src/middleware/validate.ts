import { ZodError, z } from "zod";
import type { infer as zInfer } from "zod";
import { NextFunction, Request, RequestHandler, Response } from "express";

export const validateMiddleware = <Schema extends z.ZodTypeAny>(
  schema: Schema
): RequestHandler => {
  return async (
    req: Request<any, any, zInfer<Schema>>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await schema.parseAsync(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(error);
      }
      next(error);
    }
  };
};

export interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?:
    | {
        [fieldname: string]: Express.Multer.File[];
      }
    | Express.Multer.File[];
}

export const validateFileMiddleware = <Schema extends z.ZodTypeAny>(
  schema: Schema
): RequestHandler => {
  return async (req: MulterRequest, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = {
        ...req.body,
        ...(req.file ? { file: req.file } : {}),
        ...(req.files ? { files: req.files } : {}),
      };

      const result = await schema.parseAsync(dataToValidate);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        error.name = "ValidationError";
        return next(error);
      }
      next(error);
    }
  };
};
