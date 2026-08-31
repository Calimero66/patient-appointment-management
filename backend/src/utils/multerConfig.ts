import multer, { FileFilterCallback } from "multer";
import path from "path";
import { NextFunction, Request, RequestHandler, Response } from "express";
import fs from "fs";

type File = Express.Multer.File;

const uploadDir = path.join(process.cwd(), "uploads", "brands");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    file: File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const ext = path.extname(file.originalname);

    const nameWithoutExt = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const uniqueName = `${nameWithoutExt}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  req: Request,
  file: File,
  cb: FileFilterCallback
): void => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp", ".pdf"];
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/svg+xml",
    "image/webp",
    "application/pdf",
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  const isExtAllowed = allowedExtensions.includes(ext);
  const isMimeAllowed = allowedMimeTypes.includes(mimeType);

  if (isExtAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type. Allowed formats: ${allowedExtensions.join(", ")}`
    ) as any;
    error.name = "ValidationError";
    cb(error);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5,
  },
});

const singleFileFilter = (
  req: Request,
  file: File,
  cb: FileFilterCallback
): void => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  const allowedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".webp",
    ".csv",
    ".pdf",
  ];

  const allowedMimetypes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/svg+xml",
    "image/webp",
    "text/csv",
    "application/pdf",
  ];

  const valid =
    allowedExtensions.includes(ext) && allowedMimetypes.includes(mimeType);

  if (!valid) {
    const error = new Error("Invalid file type") as any;
    error.name = "ValidationError";
    return cb(error);
  }

  cb(null, true);
};

export const uploadSingleDynamic: RequestHandler = multer({
  storage,
  fileFilter: singleFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).any();
