import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { findAllPacientes, findPacienteById, findPacienteByDocumento, createPaciente, updatePaciente, deletePaciente } from '../lib/prisma';
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
      const searchTerm = search && typeof search === 'string' ? search.trim() : undefined;

      const pacientes = await findAllPacientes(searchTerm);

      // Formatear respuesta para compatibilidad
      const formattedPacientes = pacientes.map((p: any) => ({
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

      const paciente = await findPacienteById(id) as any;

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
      const existingPaciente = await findPacienteByDocumento(numeroDocumento);

      if (existingPaciente) {
        throw new ValidationError({ numeroDocumento: 'Ya existe un paciente con este número de documento' });
      }

      const paciente = await createPaciente({
        nombre,
        apellido,
        numeroDocumento,
        correo: correo || undefined,
        telefono: telefono || undefined,
        domicilio: domicilio || undefined,
      }) as any;

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
      const existingPaciente = await findPacienteById(id) as any;

      if (!existingPaciente) {
        throw new NotFoundError('Paciente no encontrado');
      }

      // Si se cambia el documento, verificar que no exista otro paciente con el mismo
      if (numeroDocumento && numeroDocumento !== existingPaciente.numeroDocumento) {
        const duplicatePaciente = await findPacienteByDocumento(numeroDocumento);

        if (duplicatePaciente) {
          throw new ValidationError({ numeroDocumento: 'Ya existe un paciente con este número de documento' });
        }
      }

      // Build update data
      const updateData: Record<string, any> = {};
      if (nombre !== undefined) updateData.nombre = nombre;
      if (apellido !== undefined) updateData.apellido = apellido;
      if (numeroDocumento !== undefined) updateData.numeroDocumento = numeroDocumento;
      if (correo !== undefined) updateData.correo = correo;
      if (telefono !== undefined) updateData.telefono = telefono;
      if (domicilio !== undefined) updateData.domicilio = domicilio;

      const paciente = await updatePaciente(id, updateData) as any;

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

      const paciente = await findPacienteById(id);

      if (!paciente) {
        throw new NotFoundError('Paciente no encontrado');
      }

      await deletePaciente(id);

      res.json({ message: 'Paciente eliminado correctamente' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
