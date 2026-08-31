import { NextFunction, Request, Response } from "express";

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ message: "API key is missing" });
  }

  const validApiKey = process.env.API_KEY;

  if (apiKey !== validApiKey) {
    return res.status(403).json({ message: "Forbidden: Invalid API key" });
  }

  next();
};
