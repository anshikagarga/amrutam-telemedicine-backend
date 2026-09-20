import { Request, Response, NextFunction } from "express";

type AppError = Error & {
  statusCode?: number;
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode ?? 500;

  return res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal server error",
  });
};