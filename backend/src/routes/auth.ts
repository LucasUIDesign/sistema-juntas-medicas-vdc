import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { ValidationError, AuthenticationError } from '../middleware/errorHandler';

const router = Router();

// Mock users for development
const MOCK_USERS: Record<string, { password: string; user: any }> = {
  'medico.junior@vdc-demo.com': {
    password: 'Demo2025!',
    user: {
      id: 'user-001',
      email: 'medico.junior@vdc-demo.com',
      nombre: 'Dr. Carlos Mendoza',
      role: 'MEDICO_INFERIOR',
    },
  },
  'medico.senior@vdc-demo.com': {
    password: 'Demo2025!',
    user: {
      id: 'user-002',
      email: 'medico.senior@vdc-demo.com',
      nombre: 'Dra. María González',
      role: 'MEDICO_SUPERIOR',
    },
  },
  'rrhh@vdc-demo.com': {
    password: 'Demo2025!',
    user: {
      id: 'user-003',
      email: 'rrhh@vdc-demo.com',
      nombre: 'Ana Rodríguez',
      role: 'RRHH',
    },
  },
};

const generateToken = (user: any): string => {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      nombre: user.nombre,
    },
    secret,
    { expiresIn }
  );
};

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
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

      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const mockUser = MOCK_USERS[normalizedEmail];
      if (!mockUser || mockUser.password !== password) {
        throw new AuthenticationError('Credenciales inválidas');
      }

      const token = generateToken(mockUser.user);
      const refreshToken = generateToken(mockUser.user);

      res.json({
        user: mockUser.user,
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
      const email = decoded.email;
      const mockUser = Object.values(MOCK_USERS).find((u) => u.user.email === email);

      if (!mockUser) {
        throw new AuthenticationError('Usuario no encontrado');
      }

      const newToken = generateToken(mockUser.user);
      const newRefreshToken = generateToken(mockUser.user);

      res.json({
        user: mockUser.user,
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
