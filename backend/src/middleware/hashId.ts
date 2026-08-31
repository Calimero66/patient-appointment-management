import { Request, Response, NextFunction } from "express";
import hashId from "../utils/hashId.js";
import { badRequest } from "../utils/errors.js";

// Extend Request to allow dynamic property assignment
declare module "express" {
  interface Request {
    [key: string]: any;
  }
}

type RequestSource = "params" | "query" | "body";

export function decodeId(
  paramName: string,
  options?: {
    outputName?: string;
    from?: RequestSource;
    required?: boolean;
  }
) {
  const { outputName = "id", from = "params", required = true } = options || {};

  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const hash = req[from][paramName];

      if (!hash) {
        if (required) {
          throw new Error(`${paramName} is required in request ${from}`);
        }
        return next();
      }

      const decodedId = hashId.decodeId(hash);
      if (!decodedId) {
       throw badRequest(
          `Invalid ${paramName} provided in request ${from}`
        );
      }

      req[outputName] = decodedId;
      next();
    } catch (error) {
      next(error);
    }
  };
}
