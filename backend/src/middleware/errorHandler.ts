import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  errors: Record<string, string>;

  constructor(errorsOrMessage: string | Record<string, string>, errors: Record<string, string> = {}) {
    if (typeof errorsOrMessage === 'string') {
      super(errorsOrMessage, 400);
      this.errors = errors;
    } else {
      super('Datos inválidos', 400);
      this.errors = errorsOrMessage;
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      details: err.errors,
    });
  }

  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      error: 'AUTHENTICATION_ERROR',
      message: err.message,
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: err.message,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: 'APP_ERROR',
      message: err.message,
    });
  }

  // Generic error - don't expose internal details
  return res.status(500).json({
    error: 'SERVER_ERROR',
    message: 'Error interno del servidor',
  });
};
