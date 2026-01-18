import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../index';

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
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const medico = MOCK_MEDICOS.find(m => m.id === id);

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    res.json(medico);
  }
);

export default router;
