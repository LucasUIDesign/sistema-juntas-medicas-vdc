import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import dns from 'dns';
import { promisify } from 'util';
import { findUserById, updateUser, db } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

const router = Router();

// Promisify DNS lookups for email validation
const resolveMx = promisify(dns.resolveMx);

// Lista de dominios de email temporales/desechables conocidos
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
  'yopmail.com', '10minutemail.com', 'trashmail.com', 'fakeinbox.com',
  'getnada.com', 'temp-mail.org', 'emailondeck.com', 'dispostable.com'
];

// Función para validar que el email tiene un dominio real con registros MX
async function validateEmailDomain(email: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const domain = email.split('@')[1];

    if (!domain) {
      return { valid: false, error: 'Email inválido' };
    }

    // Verificar si es un dominio de email desechable
    if (DISPOSABLE_EMAIL_DOMAINS.includes(domain.toLowerCase())) {
      return { valid: false, error: 'No se permiten correos temporales o desechables' };
    }

    // Verificar que el dominio tenga registros MX
    const mxRecords = await resolveMx(domain);

    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, error: 'El dominio del correo no puede recibir emails' };
    }

    return { valid: true };
  } catch (error) {
    // Si falla la resolución DNS, el dominio probablemente no existe
    return { valid: false, error: 'El dominio del correo electrónico no existe' };
  }
}

// GET /api/users - Obtener lista de usuarios (admin only)
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;

    // Only admins and gerencial can view all users
    if (userRole !== 'ADMIN' && userRole !== 'GERENCIAL') {
      return res.status(403).json({ error: 'No tienes permiso para ver usuarios' });
    }

    const result = await db.execute('SELECT id, nombre, apellido, email, username, role, createdAt FROM User ORDER BY createdAt DESC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Crear nuevo usuario (admin only)
router.post(
  '/',
  authMiddleware,
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
    body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
    body('username').trim().notEmpty().withMessage('Nombre de usuario requerido').isLength({ min: 4 }).withMessage('Nombre de usuario debe tener mínimo 4 caracteres'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('role').notEmpty().withMessage('Rol requerido'),
    body('password').notEmpty().withMessage('Contraseña requerida').isLength({ min: 8 }).withMessage('Contraseña debe tener mínimo 8 caracteres'),
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

      const userRole = (req as any).user.role;

      // Only admins can create users
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'No tienes permiso para crear usuarios' });
      }

      const { nombre, apellido, username, email, role, password } = req.body;
      const id = randomUUID();

      // Validar que el email tenga un dominio real
      const emailValidation = await validateEmailDomain(email);
      if (!emailValidation.valid) {
        throw new ValidationError({ email: emailValidation.error || 'Email inválido' });
      }

      // Check if username already exists
      const existingUser = await db.execute({
        sql: 'SELECT id FROM User WHERE username = ?',
        args: [username],
      });

      if (existingUser.rows.length > 0) {
        throw new ValidationError({ username: 'Este nombre de usuario ya existe' });
      }

      // Check if email already exists
      const existingEmail = await db.execute({
        sql: 'SELECT id FROM User WHERE email = ?',
        args: [email],
      });

      if (existingEmail.rows.length > 0) {
        throw new ValidationError({ email: 'Este correo electrónico ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await db.execute({
        sql: `INSERT INTO User (id, nombre, apellido, username, email, password, role, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        args: [id, nombre, apellido, username, email, hashedPassword, role],
      });

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user: {
          id,
          nombre,
          apellido,
          username,
          email,
          role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users/profile - Obtener perfil del usuario actual
router.get('/profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.sub;

    const user = await findUserById(userId) as any;

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    res.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      telefono: user.telefono,
      fotoUrl: user.fotoUrl,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/profile - Actualizar perfil del usuario
router.put(
  '/profile',
  authMiddleware,
  [
    body('nombre').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    body('apellido').optional().trim().notEmpty().withMessage('Apellido no puede estar vacío'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('dni').optional().trim(),
    body('telefono').optional().trim(),
    body('fotoUrl').optional().trim(),
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

      const userId = (req as any).user.sub;
      const { nombre, apellido, email, dni, telefono, fotoUrl } = req.body;

      // Check if email already exists and validate domain (if email is being updated)
      if (email !== undefined) {
        // Validar que el email tenga un dominio real
        const emailValidation = await validateEmailDomain(email);
        if (!emailValidation.valid) {
          throw new ValidationError({ email: emailValidation.error || 'Email inválido' });
        }

        const existingUser = await db.execute({
          sql: 'SELECT id FROM User WHERE email = ? AND id != ?',
          args: [email, userId],
        });

        if (existingUser.rows.length > 0) {
          throw new ValidationError({ email: 'Este correo ya está en uso' });
        }
      }

      // Build update data
      const updateData: Record<string, any> = {};
      if (nombre !== undefined) updateData.nombre = nombre;
      if (apellido !== undefined) updateData.apellido = apellido;
      if (email !== undefined) updateData.email = email;
      if (dni !== undefined) updateData.dni = dni;
      if (telefono !== undefined) updateData.telefono = telefono;
      if (fotoUrl !== undefined) updateData.fotoUrl = fotoUrl;

      const user = await updateUser(userId, updateData) as any;

      res.json({
        message: 'Perfil actualizado correctamente',
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          dni: user.dni,
          telefono: user.telefono,
          fotoUrl: user.fotoUrl,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/users/change-password - Cambiar contraseña
router.put(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La contraseña debe contener mayúsculas, minúsculas y números'),
    body('confirmPassword').notEmpty().withMessage('Confirmación de contraseña requerida'),
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

      const userId = (req as any).user.sub;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (newPassword !== confirmPassword) {
        throw new ValidationError({ confirmPassword: 'Las contraseñas no coinciden' });
      }

      const user = await findUserById(userId) as any;

      if (!user) {
        throw new NotFoundError('Usuario no encontrado');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new ValidationError({ currentPassword: 'Contraseña actual incorrecta' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.execute({
        sql: 'UPDATE User SET password = ?, updatedAt = datetime(\'now\') WHERE id = ?',
        args: [hashedPassword, userId],
      });

      res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
