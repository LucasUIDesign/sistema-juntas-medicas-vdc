import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

const router = Router();

// GET /api/pacientes - Listar pacientes con búsqueda inteligente
router.get(
  '/',
  authMiddleware,
  [query('search').optional().isString()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search } = req.query;

      let pacientes;

      if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = search.trim().toLowerCase();

        // Búsqueda inteligente: busca en nombre, apellido y documento
        pacientes = await prisma.paciente.findMany({
          where: {
            OR: [
              { nombre: { contains: searchTerm } },
              { apellido: { contains: searchTerm } },
              { numeroDocumento: { contains: searchTerm } },
              { correo: { contains: searchTerm } },
            ],
          },
          orderBy: [
            { apellido: 'asc' },
            { nombre: 'asc' },
          ],
          take: 20, // Limitar resultados para autocompletado
        });
      } else {
        pacientes = await prisma.paciente.findMany({
          orderBy: [
            { apellido: 'asc' },
            { nombre: 'asc' },
          ],
        });
      }

      // Formatear respuesta para compatibilidad
      const formattedPacientes = pacientes.map(p => ({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        nombreCompleto: `${p.apellido}, ${p.nombre}`,
        numeroDocumento: p.numeroDocumento,
        correo: p.correo,
        telefono: p.telefono,
        domicilio: p.domicilio,
      }));

      res.json(formattedPacientes);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/pacientes/:id - Obtener paciente por ID
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const paciente = await prisma.paciente.findUnique({
        where: { id },
      });

      if (!paciente) {
        throw new NotFoundError('Paciente no encontrado');
      }

      res.json({
        id: paciente.id,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        nombreCompleto: `${paciente.apellido}, ${paciente.nombre}`,
        numeroDocumento: paciente.numeroDocumento,
        correo: paciente.correo,
        telefono: paciente.telefono,
        domicilio: paciente.domicilio,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/pacientes - Crear nuevo paciente
router.post(
  '/',
  authMiddleware,
  [
    body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
    body('apellido').trim().notEmpty().withMessage('Apellido es requerido'),
    body('numeroDocumento').trim().notEmpty().withMessage('Número de documento es requerido'),
    body('correo').optional().isEmail().withMessage('Correo inválido'),
    body('telefono').optional().trim(),
    body('domicilio').optional().trim(),
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

      const { nombre, apellido, numeroDocumento, correo, telefono, domicilio } = req.body;

      // Verificar si ya existe un paciente con el mismo documento
      const existingPaciente = await prisma.paciente.findUnique({
        where: { numeroDocumento },
      });

      if (existingPaciente) {
        throw new ValidationError({ numeroDocumento: 'Ya existe un paciente con este número de documento' });
      }

      const paciente = await prisma.paciente.create({
        data: {
          nombre,
          apellido,
          numeroDocumento,
          correo: correo || null,
          telefono: telefono || null,
          domicilio: domicilio || null,
        },
      });

      res.status(201).json({
        message: 'Paciente creado correctamente',
        paciente: {
          id: paciente.id,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          nombreCompleto: `${paciente.apellido}, ${paciente.nombre}`,
          numeroDocumento: paciente.numeroDocumento,
          correo: paciente.correo,
          telefono: paciente.telefono,
          domicilio: paciente.domicilio,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/pacientes/:id - Actualizar paciente
router.put(
  '/:id',
  authMiddleware,
  [
    body('nombre').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    body('apellido').optional().trim().notEmpty().withMessage('Apellido no puede estar vacío'),
    body('numeroDocumento').optional().trim().notEmpty().withMessage('Documento no puede estar vacío'),
    body('correo').optional().isEmail().withMessage('Correo inválido'),
    body('telefono').optional().trim(),
    body('domicilio').optional().trim(),
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

      const { id } = req.params;
      const { nombre, apellido, numeroDocumento, correo, telefono, domicilio } = req.body;

      // Verificar que el paciente existe
      const existingPaciente = await prisma.paciente.findUnique({
        where: { id },
      });

      if (!existingPaciente) {
        throw new NotFoundError('Paciente no encontrado');
      }

      // Si se cambia el documento, verificar que no exista otro paciente con el mismo
      if (numeroDocumento && numeroDocumento !== existingPaciente.numeroDocumento) {
        const duplicatePaciente = await prisma.paciente.findUnique({
          where: { numeroDocumento },
        });

        if (duplicatePaciente) {
          throw new ValidationError({ numeroDocumento: 'Ya existe un paciente con este número de documento' });
        }
      }

      const paciente = await prisma.paciente.update({
        where: { id },
        data: {
          nombre,
          apellido,
          numeroDocumento,
          correo,
          telefono,
          domicilio,
        },
      });

      res.json({
        message: 'Paciente actualizado correctamente',
        paciente: {
          id: paciente.id,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          nombreCompleto: `${paciente.apellido}, ${paciente.nombre}`,
          numeroDocumento: paciente.numeroDocumento,
          correo: paciente.correo,
          telefono: paciente.telefono,
          domicilio: paciente.domicilio,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/pacientes/:id - Eliminar paciente
router.delete(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const paciente = await prisma.paciente.findUnique({
        where: { id },
      });

      if (!paciente) {
        throw new NotFoundError('Paciente no encontrado');
      }

      await prisma.paciente.delete({
        where: { id },
      });

      res.json({ message: 'Paciente eliminado correctamente' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
