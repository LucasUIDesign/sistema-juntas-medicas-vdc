import { Router, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Mock pacientes data
const MOCK_PACIENTES = [
  { id: 'pac-001', nombre: 'Juan Pérez García', documento: '8-123-456', empresa: 'Constructora ABC' },
  { id: 'pac-002', nombre: 'María López Rodríguez', documento: '8-234-567', empresa: 'Minera del Norte' },
  { id: 'pac-003', nombre: 'Carlos Martínez Silva', documento: '8-345-678', empresa: 'Petrolera Nacional' },
  { id: 'pac-004', nombre: 'Ana Fernández Torres', documento: '8-456-789', empresa: 'Constructora ABC' },
  { id: 'pac-005', nombre: 'Roberto Sánchez Díaz', documento: '8-567-890', empresa: 'Industrias del Sur' },
];

// GET /api/pacientes - List pacientes for autocomplete
router.get(
  '/',
  authMiddleware,
  [query('search').optional().isString()],
  async (req: AuthenticatedRequest, res: Response) => {
    const { search } = req.query;

    let pacientes = [...MOCK_PACIENTES];

    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      pacientes = pacientes.filter(p =>
        p.nombre.toLowerCase().includes(searchLower) ||
        p.documento.includes(search)
      );
    }

    res.json(pacientes);
  }
);

// GET /api/pacientes/:id - Get single paciente
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const paciente = MOCK_PACIENTES.find(p => p.id === id);

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json(paciente);
  }
);

export default router;
