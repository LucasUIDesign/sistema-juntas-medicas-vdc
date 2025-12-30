import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Mock médicos data
const MOCK_MEDICOS = [
  { id: 'user-001', nombre: 'Dr. Carlos Mendoza', especialidad: 'Medicina Ocupacional' },
  { id: 'user-002', nombre: 'Dra. María González', especialidad: 'Medicina Ocupacional' },
];

// GET /api/medicos - List médicos for autocomplete/filters
router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    res.json(MOCK_MEDICOS);
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
