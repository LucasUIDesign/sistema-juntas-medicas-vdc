import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { findUserByUsername, findUserById } from '../lib/prisma';
import { ValidationError, AuthenticationError } from '../middleware/errorHandler';

const router = Router();

const generateToken = (user: any): string => {
  const secret = process.env.JWT_SECRET || 'default-secret';

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      nombre: user.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : user.email,
    },
    secret,
    { expiresIn: '24h' as const }
  );
};

// POST /api/auth/login
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Nombre de usuario requerido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMap: Record<string, string> = {};
        errors.array().forEach((err: any) => {
          errorMap[err.path] = err.msg;
        });
        throw new ValidationError(errorMap);
      }

      const { username, password } = req.body;
      const normalizedUsername = username.toLowerCase().trim();

      // Buscar usuario en la base de datos por username
      const user = await findUserByUsername(normalizedUsername) as any;

      if (!user) {
        throw new AuthenticationError('Credenciales inválidas');
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new AuthenticationError('Credenciales inválidas');
      }

      const token = generateToken(user);
      const refreshToken = generateToken(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          nombre: user.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : user.email,
          role: user.role,
        },
        token,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token requerido');
    }

    const secret = process.env.JWT_SECRET || 'default-secret';

    try {
      const decoded = jwt.verify(refreshToken, secret) as any;
      const userId = decoded.sub;

      const user = await findUserById(userId) as any;

      if (!user) {
        throw new AuthenticationError('Usuario no encontrado');
      }

      const newToken = generateToken(user);
      const newRefreshToken = generateToken(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : user.email,
          role: user.role,
        },
        token: newToken,
        refreshToken: newRefreshToken,
      });
    } catch (jwtError) {
      throw new AuthenticationError('Refresh token inválido');
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Email inválido')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMap: Record<string, string> = {};
        errors.array().forEach((err: any) => {
          errorMap[err.path] = err.msg;
        });
        throw new ValidationError(errorMap);
      }

      // Don't reveal if email exists
      res.json({ message: 'Si el email existe, recibirás instrucciones de recuperación.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
