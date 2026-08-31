import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { ApiError } from "../utils/errors.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("error", err);

  if (err instanceof ApiError && err.name === "ValidationError") {
    const errors = err.details;
    res.status(400).json({ message: "Validation Error", errors });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((e: any) => ({
      path: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({ message: "Validation Error", errors });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ message: "Invalid JSON format" });
    return;
  }

  if (err.name === "UnauthorizedError") {
    res.status(401).json({ message: "Unauthorized", error: err.message });
    return;
  }

  if (err.name === "NotFoundError") {
    res.status(404).json({ message: "Not Found", error: err.message });
    return;
  }

  if (err.name === "ForbiddenError") {
    res.status(403).json({ message: "Forbidden", error: err.message });
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({ message: "File Upload Error", error: err.message });
    return;
  }

  // Handle Prisma unique constraint violations (P2002)
  if ((err as any).code === "P2002") {
    res.status(409).json({ message: "Conflict: A record with this value already exists" });
    return;
  }

  // Handle Prisma record not found (P2025)
  if ((err as any).code === "P2025") {
    res.status(404).json({ message: "Not Found", error: "Record not found" });
    return;
  }

  if (err.name === "BadRequestError") {
    res.status(400).json({ message: "Bad Request", error: err.message });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: "Internal Server Error" });
};
