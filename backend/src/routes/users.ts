import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { findUserById, updateUser, db } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

const router = Router();

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
      const { nombre, apellido, dni, telefono, fotoUrl } = req.body;

      // Build update data
      const updateData: Record<string, any> = {};
      if (nombre !== undefined) updateData.nombre = nombre;
      if (apellido !== undefined) updateData.apellido = apellido;
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
