import { Response } from "express";

export interface SuccessResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};
