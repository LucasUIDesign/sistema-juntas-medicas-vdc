import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../lib/prisma';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

// GET /api/medicos - List médicos for autocomplete/filters
router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await db.execute({
        sql: `SELECT id, nombre, apellido, email FROM User WHERE role IN ('MEDICO_EVALUADOR', 'DIRECTOR_MEDICO')`,
        args: [],
      });

      res.json(result.rows.map((row: any) => ({
        id: row.id,
        nombre: row.nombre || '',
        apellido: row.apellido || '',
        email: row.email,
      })));
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/medicos/:id - Get single médico
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const result = await db.execute({
        sql: `SELECT id, nombre, apellido, email FROM User WHERE id = ? AND role IN ('MEDICO_EVALUADOR', 'DIRECTOR_MEDICO')`,
        args: [id],
      });

      if (result.rows.length === 0) {
        throw new NotFoundError('Médico no encontrado');
      }

      const row: any = result.rows[0];
      res.json({
        id: row.id,
        nombre: row.nombre || '',
        apellido: row.apellido || '',
        email: row.email,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
