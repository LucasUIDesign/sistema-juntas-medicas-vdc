import { Router, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authMiddleware, AuthenticatedRequest, roleMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

const router = Router();

// Mock data for development
interface JuntaMedica {
  id: string;
  fecha: string;
  pacienteId: string;
  pacienteNombre: string;
  medicoId: string;
  medicoNombre: string;
  detalles: string;
  aprobacion: boolean;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  adjuntos: Array<{ id: string; nombre: string; tipo: string; url: string; size: number }>;
  createdAt: string;
  updatedAt: string;
}

const MOCK_PACIENTES = [
  { id: 'pac-001', nombre: 'Juan Pérez García', documento: '8-123-456', empresa: 'Constructora ABC' },
  { id: 'pac-002', nombre: 'María López Rodríguez', documento: '8-234-567', empresa: 'Minera del Norte' },
  { id: 'pac-003', nombre: 'Carlos Martínez Silva', documento: '8-345-678', empresa: 'Petrolera Nacional' },
  { id: 'pac-004', nombre: 'Ana Fernández Torres', documento: '8-456-789', empresa: 'Constructora ABC' },
  { id: 'pac-005', nombre: 'Roberto Sánchez Díaz', documento: '8-567-890', empresa: 'Industrias del Sur' },
];

const MOCK_MEDICOS = [
  { id: 'user-001', nombre: 'Dr. Carlos Mendoza', especialidad: 'Medicina Ocupacional' },
  { id: 'user-002', nombre: 'Dra. María González', especialidad: 'Medicina Ocupacional' },
];

// Generate initial mock juntas
const generateMockJuntas = (): JuntaMedica[] => {
  const estados: JuntaMedica['estado'][] = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];
  const juntas: JuntaMedica[] = [];
  
  for (let i = 1; i <= 10; i++) {
    const paciente = MOCK_PACIENTES[Math.floor(Math.random() * MOCK_PACIENTES.length)];
    const medico = MOCK_MEDICOS[Math.floor(Math.random() * MOCK_MEDICOS.length)];
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));
    
    juntas.push({
      id: `junta-${String(i).padStart(3, '0')}`,
      fecha: fecha.toISOString(),
      pacienteId: paciente.id,
      pacienteNombre: paciente.nombre,
      medicoId: medico.id,
      medicoNombre: medico.nombre,
      detalles: `Evaluación médica ocupacional del trabajador. Se realizaron exámenes de rutina incluyendo audiometría, espirometría y evaluación cardiovascular. Paciente presenta condiciones normales para continuar labores.`,
      aprobacion: Math.random() > 0.3,
      estado: estados[Math.floor(Math.random() * estados.length)],
      adjuntos: [],
      createdAt: fecha.toISOString(),
      updatedAt: fecha.toISOString(),
    });
  }
  
  return juntas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
};

let mockJuntas = generateMockJuntas();


// Validation middleware
const validateRequest = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Datos inválidos', errors.array().reduce((acc, err) => {
      if ('path' in err) {
        acc[err.path] = err.msg;
      }
      return acc;
    }, {} as Record<string, string>));
  }
  next();
};

// GET /api/juntas - List all juntas with filters
router.get(
  '/',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('medicoId').optional().isString(),
    query('fechaInicio').optional().isISO8601(),
    query('fechaFin').optional().isISO8601(),
    query('estado').optional().isIn(['PENDIENTE', 'APROBADA', 'RECHAZADA']),
    query('sortBy').optional().isIn(['fecha', 'pacienteNombre', 'medicoNombre', 'estado']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = 1,
      pageSize = 10,
      medicoId,
      fechaInicio,
      fechaFin,
      estado,
      sortBy = 'fecha',
      sortOrder = 'desc',
    } = req.query;

    let filtered = [...mockJuntas];

    // Filter by medicoId (for médicos, only show their own juntas)
    if (req.user?.role === 'MEDICO_EVALUADOR' || req.user?.role === 'DIRECTOR_MEDICO') {
      if (!medicoId) {
        filtered = filtered.filter(j => j.medicoId === req.user?.id);
      }
    }
    
    if (medicoId) {
      filtered = filtered.filter(j => j.medicoId === medicoId);
    }

    if (fechaInicio) {
      const inicio = new Date(fechaInicio as string);
      filtered = filtered.filter(j => new Date(j.fecha) >= inicio);
    }

    if (fechaFin) {
      const fin = new Date(fechaFin as string);
      filtered = filtered.filter(j => new Date(j.fecha) <= fin);
    }

    if (estado) {
      filtered = filtered.filter(j => j.estado === estado);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof JuntaMedica];
      const bVal = b[sortBy as keyof JuntaMedica];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'desc' 
          ? bVal.localeCompare(aVal) 
          : aVal.localeCompare(bVal);
      }
      return 0;
    });

    // Paginate
    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);
    const start = (pageNum - 1) * pageSizeNum;
    const end = start + pageSizeNum;
    const paginatedData = filtered.slice(start, end);

    res.json({
      data: paginatedData,
      total: filtered.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(filtered.length / pageSizeNum),
    });
  }
);


// GET /api/juntas/:id - Get single junta
router.get(
  '/:id',
  authMiddleware,
  [param('id').isString().notEmpty()],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const junta = mockJuntas.find(j => j.id === id);

    if (!junta) {
      throw new NotFoundError('Junta no encontrada');
    }

    // Check access for médicos
    if (req.user?.role === 'MEDICO_EVALUADOR' || req.user?.role === 'DIRECTOR_MEDICO') {
      if (junta.medicoId !== req.user.id) {
        throw new NotFoundError('Junta no encontrada');
      }
    }

    res.json(junta);
  }
);

// POST /api/juntas - Create new junta
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['MEDICO_EVALUADOR', 'DIRECTOR_MEDICO']),
  [
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    body('pacienteId').isString().notEmpty().withMessage('Paciente requerido'),
    body('detalles').isString().isLength({ min: 1, max: 500 }).withMessage('Detalles requeridos (máx 500 caracteres)'),
    body('aprobacion').optional().isBoolean(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    const { fecha, pacienteId, detalles, aprobacion } = req.body;

    const paciente = MOCK_PACIENTES.find(p => p.id === pacienteId);
    if (!paciente) {
      throw new ValidationError('Paciente no encontrado', { pacienteId: 'Paciente no válido' });
    }

    // Only DIRECTOR_MEDICO can set aprobacion
    const canApprove = req.user?.role === 'DIRECTOR_MEDICO';

    const newJunta: JuntaMedica = {
      id: `junta-${String(mockJuntas.length + 1).padStart(3, '0')}-${Date.now()}`,
      fecha,
      pacienteId,
      pacienteNombre: paciente.nombre,
      medicoId: req.user!.id,
      medicoNombre: req.user!.nombre,
      detalles,
      aprobacion: canApprove ? (aprobacion || false) : false,
      estado: 'PENDIENTE',
      adjuntos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockJuntas = [newJunta, ...mockJuntas];

    res.status(201).json(newJunta);
  }
);

// PUT /api/juntas/:id - Update junta
router.put(
  '/:id',
  authMiddleware,
  [
    param('id').isString().notEmpty(),
    body('fecha').optional().isISO8601(),
    body('detalles').optional().isString().isLength({ max: 500 }),
    body('aprobacion').optional().isBoolean(),
    body('estado').optional().isIn(['PENDIENTE', 'APROBADA', 'RECHAZADA']),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = mockJuntas.findIndex(j => j.id === id);

    if (index === -1) {
      throw new NotFoundError('Junta no encontrada');
    }

    const junta = mockJuntas[index];

    // Check permissions
    if (req.user?.role === 'MEDICO_EVALUADOR') {
      if (junta.medicoId !== req.user.id) {
        throw new NotFoundError('Junta no encontrada');
      }
    }

    // Update allowed fields
    const { fecha, detalles, aprobacion, estado } = req.body;

    if (fecha) junta.fecha = fecha;
    if (detalles) junta.detalles = detalles;
    
    // Only DIRECTOR_MEDICO or RRHH can update aprobacion/estado
    if (req.user?.role === 'DIRECTOR_MEDICO' || req.user?.role === 'RRHH') {
      if (aprobacion !== undefined) junta.aprobacion = aprobacion;
      if (estado) junta.estado = estado;
    }

    junta.updatedAt = new Date().toISOString();
    mockJuntas[index] = junta;

    res.json(junta);
  }
);

// DELETE /api/juntas/:id - Delete junta (RRHH only)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['RRHH']),
  [param('id').isString().notEmpty()],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = mockJuntas.findIndex(j => j.id === id);

    if (index === -1) {
      throw new NotFoundError('Junta no encontrada');
    }

    mockJuntas.splice(index, 1);
    res.status(204).send();
  }
);

export default router;
