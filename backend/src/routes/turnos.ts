import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { db } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import crypto from 'crypto';

const router = Router();

// GET /api/turnos - Listar turnos
router.get(
  '/',
  authMiddleware,
  [
    query('medicoId').optional().isString(),
    query('pacienteId').optional().isString(),
    query('fecha').optional().isString(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { medicoId, pacienteId, fecha } = req.query;
      const user = (req as any).user; // Usuario autenticado

      let sql = `
        SELECT 
          t.*,
          p.nombre as pacienteNombre,
          p.apellido as pacienteApellido,
          p.numeroDocumento as pacienteDni,
          u.nombre as medicoNombre,
          u.apellido as medicoApellido
        FROM Turno t
        LEFT JOIN Paciente p ON t.pacienteId = p.id
        LEFT JOIN User u ON t.medicoId = u.id
        WHERE 1=1
      `;
      const args: any[] = [];

      // Si el usuario es médico evaluador y no se especifica medicoId, filtrar por su ID
      // Si el usuario es admin, mostrar todos los turnos
      if (user.role === 'MEDICO_EVALUADOR' && !medicoId) {
        sql += ' AND t.medicoId = ?';
        args.push(user.sub);
      } else if (medicoId) {
        sql += ' AND t.medicoId = ?';
        args.push(medicoId);
      }
      // Si es admin u otro rol, no filtrar por médico (mostrar todos)

      if (pacienteId) {
        sql += ' AND t.pacienteId = ?';
        args.push(pacienteId);
      }

      if (fecha) {
        sql += ' AND DATE(t.fecha) = DATE(?)';
        args.push(fecha);
      }

      sql += ' ORDER BY t.fecha ASC, t.hora ASC';

      const result = await db.execute({ sql, args });

      const turnos = result.rows.map((row: any) => ({
        id: row.id,
        pacienteId: row.pacienteId,
        medicoId: row.medicoId,
        fecha: row.fecha,
        hora: row.hora,
        lugar: row.lugar,
        observaciones: row.observaciones,
        estado: row.estado,
        pacienteNombre: `${row.pacienteApellido}, ${row.pacienteNombre}`,
        pacienteDni: row.pacienteDni,
        medicoNombre: row.medicoNombre && row.medicoApellido 
          ? `${row.medicoNombre} ${row.medicoApellido}` 
          : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      res.json(turnos);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/turnos/:id - Obtener turno por ID
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const result = await db.execute({
        sql: `
          SELECT 
            t.*,
            p.nombre as pacienteNombre,
            p.apellido as pacienteApellido,
            p.numeroDocumento as pacienteDni,
            u.nombre as medicoNombre,
            u.apellido as medicoApellido
          FROM Turno t
          LEFT JOIN Paciente p ON t.pacienteId = p.id
          LEFT JOIN User u ON t.medicoId = u.id
          WHERE t.id = ?
        `,
        args: [id],
      });

      if (result.rows.length === 0) {
        throw new NotFoundError('Turno no encontrado');
      }

      const row: any = result.rows[0];
      const turno = {
        id: row.id,
        pacienteId: row.pacienteId,
        medicoId: row.medicoId,
        fecha: row.fecha,
        hora: row.hora,
        lugar: row.lugar,
        observaciones: row.observaciones,
        estado: row.estado,
        pacienteNombre: `${row.pacienteApellido}, ${row.pacienteNombre}`,
        pacienteDni: row.pacienteDni,
        medicoNombre: row.medicoNombre && row.medicoApellido 
          ? `${row.medicoNombre} ${row.medicoApellido}` 
          : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };

      res.json(turno);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/turnos - Crear nuevo turno
router.post(
  '/',
  authMiddleware,
  [
    body('pacienteId').notEmpty().withMessage('ID del paciente es requerido'),
    body('medicoId').notEmpty().withMessage('ID del médico es requerido'),
    body('fecha').notEmpty().withMessage('Fecha es requerida'),
    body('hora').notEmpty().withMessage('Hora es requerida'),
    body('lugar').optional().trim(),
    body('observaciones').optional().trim(),
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

      const { pacienteId, medicoId, fecha, hora, lugar, observaciones } = req.body;

      // Verificar que el paciente existe
      const pacienteResult = await db.execute({
        sql: 'SELECT id FROM Paciente WHERE id = ?',
        args: [pacienteId],
      });

      if (pacienteResult.rows.length === 0) {
        throw new NotFoundError('Paciente no encontrado');
      }

      // Verificar que el médico existe
      const medicoResult = await db.execute({
        sql: 'SELECT id FROM User WHERE id = ?',
        args: [medicoId],
      });

      if (medicoResult.rows.length === 0) {
        throw new NotFoundError('Médico no encontrado');
      }

      // Crear turno
      const id = crypto.randomUUID();
      await db.execute({
        sql: `
          INSERT INTO Turno (id, pacienteId, medicoId, fecha, hora, lugar, observaciones, estado, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', datetime('now'), datetime('now'))
        `,
        args: [id, pacienteId, medicoId, fecha, hora, lugar || null, observaciones || null],
      });

      // Obtener el turno creado con datos completos
      const result = await db.execute({
        sql: `
          SELECT 
            t.*,
            p.nombre as pacienteNombre,
            p.apellido as pacienteApellido,
            p.numeroDocumento as pacienteDni,
            u.nombre as medicoNombre,
            u.apellido as medicoApellido
          FROM Turno t
          LEFT JOIN Paciente p ON t.pacienteId = p.id
          LEFT JOIN User u ON t.medicoId = u.id
          WHERE t.id = ?
        `,
        args: [id],
      });

      const row: any = result.rows[0];
      const turno = {
        id: row.id,
        pacienteId: row.pacienteId,
        medicoId: row.medicoId,
        fecha: row.fecha,
        hora: row.hora,
        lugar: row.lugar,
        observaciones: row.observaciones,
        estado: row.estado,
        pacienteNombre: `${row.pacienteApellido}, ${row.pacienteNombre}`,
        pacienteDni: row.pacienteDni,
        medicoNombre: row.medicoNombre && row.medicoApellido 
          ? `${row.medicoNombre} ${row.medicoApellido}` 
          : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };

      res.status(201).json({
        message: 'Turno creado correctamente',
        turno,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/turnos/:id - Actualizar turno
router.put(
  '/:id',
  authMiddleware,
  [
    body('fecha').optional().notEmpty(),
    body('hora').optional().notEmpty(),
    body('lugar').optional().trim(),
    body('observaciones').optional().trim(),
    body('estado').optional().isIn(['PENDIENTE', 'COMPLETADO', 'CANCELADO']),
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
      const { fecha, hora, lugar, observaciones, estado } = req.body;

      // Verificar que el turno existe
      const turnoResult = await db.execute({
        sql: 'SELECT id FROM Turno WHERE id = ?',
        args: [id],
      });

      if (turnoResult.rows.length === 0) {
        throw new NotFoundError('Turno no encontrado');
      }

      // Build update query
      const updates: string[] = [];
      const args: any[] = [];

      if (fecha !== undefined) {
        updates.push('fecha = ?');
        args.push(fecha);
      }
      if (hora !== undefined) {
        updates.push('hora = ?');
        args.push(hora);
      }
      if (lugar !== undefined) {
        updates.push('lugar = ?');
        args.push(lugar);
      }
      if (observaciones !== undefined) {
        updates.push('observaciones = ?');
        args.push(observaciones);
      }
      if (estado !== undefined) {
        updates.push('estado = ?');
        args.push(estado);
      }

      if (updates.length === 0) {
        throw new ValidationError({ general: 'No hay campos para actualizar' });
      }

      updates.push("updatedAt = datetime('now')");
      args.push(id);

      await db.execute({
        sql: `UPDATE Turno SET ${updates.join(', ')} WHERE id = ?`,
        args,
      });

      // Obtener el turno actualizado
      const result = await db.execute({
        sql: `
          SELECT 
            t.*,
            p.nombre as pacienteNombre,
            p.apellido as pacienteApellido,
            p.numeroDocumento as pacienteDni,
            u.nombre as medicoNombre,
            u.apellido as medicoApellido
          FROM Turno t
          LEFT JOIN Paciente p ON t.pacienteId = p.id
          LEFT JOIN User u ON t.medicoId = u.id
          WHERE t.id = ?
        `,
        args: [id],
      });

      const row: any = result.rows[0];
      const turno = {
        id: row.id,
        pacienteId: row.pacienteId,
        medicoId: row.medicoId,
        fecha: row.fecha,
        hora: row.hora,
        lugar: row.lugar,
        observaciones: row.observaciones,
        estado: row.estado,
        pacienteNombre: `${row.pacienteApellido}, ${row.pacienteNombre}`,
        pacienteDni: row.pacienteDni,
        medicoNombre: row.medicoNombre && row.medicoApellido 
          ? `${row.medicoNombre} ${row.medicoApellido}` 
          : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };

      res.json({
        message: 'Turno actualizado correctamente',
        turno,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/turnos/:id - Eliminar turno
router.delete(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const turnoResult = await db.execute({
        sql: 'SELECT id FROM Turno WHERE id = ?',
        args: [id],
      });

      if (turnoResult.rows.length === 0) {
        throw new NotFoundError('Turno no encontrado');
      }

      await db.execute({
        sql: 'DELETE FROM Turno WHERE id = ?',
        args: [id],
      });

      res.json({ message: 'Turno eliminado correctamente' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
