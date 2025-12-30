import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'MEDICO_INFERIOR' | 'MEDICO_SUPERIOR' | 'RRHH';
    nombre: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default-secret';

    try {
      const decoded = jwt.verify(token, secret) as {
        sub: string;
        email: string;
        role: 'MEDICO_INFERIOR' | 'MEDICO_SUPERIOR' | 'RRHH';
        nombre: string;
      };

      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        nombre: decoded.nombre,
      };

      next();
    } catch (jwtError) {
      throw new AuthenticationError('Token inválido o expirado');
    }
  } catch (error) {
    next(error);
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Usuario no autenticado'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthenticationError('No tiene permisos para esta acción'));
    }

    next();
  };
};
