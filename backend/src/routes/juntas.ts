import { Router, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authMiddleware, AuthenticatedRequest, roleMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { db } from '../lib/prisma';
import { randomUUID } from 'crypto';
import { emailService } from '../services/emailService';

const router = Router();

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
    query('estado').optional().isIn(['BORRADOR', 'PENDIENTE', 'APROBADA', 'RECHAZADA']),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        page = 1,
        pageSize = 10,
        medicoId,
        estado,
      } = req.query;

      let sql = `
        SELECT
          j.id, j.pacienteId, j.medicoId, j.estado, j.fecha, j.fechaDictamen,
          j.aptitudLaboral, j.diagnosticoPrincipal, j.observaciones, j.hora,
          j.createdAt, j.updatedAt,
          p.nombre as pacienteNombre, p.apellido as pacienteApellido, p.numeroDocumento,
          u.nombre as medicoNombre, u.apellido as medicoApellido,
          d.datosCompletos,
          (SELECT COUNT(DISTINCT categoria) FROM DocumentoAdjunto WHERE juntaId = j.id) as documentosCount
        FROM JuntaMedica j
        LEFT JOIN Paciente p ON j.pacienteId = p.id
        LEFT JOIN User u ON j.medicoId = u.id
        LEFT JOIN Dictamen d ON j.id = d.juntaId
        WHERE 1=1
      `;
      const args: any[] = [];

      // Filter by medicoId for médicos (only show their own juntas)
      if (req.user?.role === 'MEDICO_EVALUADOR') {
        sql += ' AND j.medicoId = ?';
        args.push(req.user.id);
      } else if (medicoId) {
        sql += ' AND j.medicoId = ?';
        args.push(medicoId);
      }

      if (estado) {
        sql += ' AND j.estado = ?';
        args.push(estado);
      }

      sql += ' ORDER BY j.createdAt DESC';

      const result = await db.execute({ sql, args });

      // Paginate
      const pageNum = Number(page);
      const pageSizeNum = Number(pageSize);
      const total = result.rows.length;
      const start = (pageNum - 1) * pageSizeNum;
      const paginatedData = result.rows.slice(start, start + pageSizeNum);

      res.json({
        data: paginatedData.map((row: any) => {
          let dictamenObj = null;
          if (row.datosCompletos) {
            try {
              dictamenObj = JSON.parse(row.datosCompletos);
            } catch (e) {
              console.error('Error parsing dictamen JSON', e);
            }
          }

          return {
            id: row.id,
            fecha: row.fecha,
            hora: row.hora,
            pacienteId: row.pacienteId,
            pacienteNombre: `${row.pacienteNombre || ''} ${row.pacienteApellido || ''}`.trim(),
            pacienteDni: row.numeroDocumento,
            medicoId: row.medicoId,
            medicoNombre: `${row.medicoNombre || ''} ${row.medicoApellido || ''}`.trim(),
            detalles: row.observaciones || '',
            estado: row.estado,
            aptitudLaboral: row.aptitudLaboral,
            diagnosticoPrincipal: row.diagnosticoPrincipal,
            dictamen: dictamenObj,
            documentosCount: row.documentosCount || 0,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          };
        }),
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/juntas/:id - Get single junta with dictamen
router.get(
  '/:id',
  authMiddleware,
  [param('id').isString().notEmpty()],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Get junta with related data
      const juntaResult = await db.execute({
        sql: `
          SELECT
            j.*,
            p.nombre as pacienteNombre, p.apellido as pacienteApellido,
            p.numeroDocumento, p.correo as pacienteCorreo, p.telefono as pacienteTelefono,
            p.domicilio as pacienteDomicilio,
            u.nombre as medicoNombre, u.apellido as medicoApellido
          FROM JuntaMedica j
          LEFT JOIN Paciente p ON j.pacienteId = p.id
          LEFT JOIN User u ON j.medicoId = u.id
          WHERE j.id = ?
        `,
        args: [id],
      });

      if (juntaResult.rows.length === 0) {
        throw new NotFoundError('Junta no encontrada');
      }

      const junta = juntaResult.rows[0] as any;

      // Check access for médicos
      if (req.user?.role === 'MEDICO_EVALUADOR' && junta.medicoId !== req.user.id) {
        throw new NotFoundError('Junta no encontrada');
      }

      // Get dictamen if exists
      const dictamenResult = await db.execute({
        sql: 'SELECT * FROM Dictamen WHERE juntaId = ?',
        args: [id],
      });

      // Get documentos adjuntos
      const documentosResult = await db.execute({
        sql: 'SELECT * FROM DocumentoAdjunto WHERE juntaId = ? ORDER BY createdAt DESC',
        args: [id],
      });

      res.json({
        id: junta.id,
        fecha: junta.fecha,
        pacienteId: junta.pacienteId,
        pacienteNombre: `${junta.pacienteNombre || ''} ${junta.pacienteApellido || ''}`.trim(),
        pacienteDni: junta.numeroDocumento,
        medicoId: junta.medicoId,
        medicoNombre: `${junta.medicoNombre || ''} ${junta.medicoApellido || ''}`.trim(),
        detalles: junta.observaciones || '',
        estado: junta.estado,
        aptitudLaboral: junta.aptitudLaboral,
        diagnosticoPrincipal: junta.diagnosticoPrincipal,
        fechaDictamen: junta.fechaDictamen,
        detallesDirector: junta.detallesDirector,
        dictamen: dictamenResult.rows[0] ? JSON.parse((dictamenResult.rows[0] as any).datosCompletos) : null,
        documentos: documentosResult.rows,
        createdAt: junta.createdAt,
        updatedAt: junta.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/juntas - Create new junta
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['MEDICO_EVALUADOR', 'DIRECTOR_MEDICO', 'ADMIN']),
  [
    body('pacienteId').isString().notEmpty().withMessage('Paciente requerido'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { pacienteId, observaciones, hora, medicoId, fecha, lugar } = req.body;

      // Verify paciente exists
      const pacienteResult = await db.execute({
        sql: 'SELECT * FROM Paciente WHERE id = ?',
        args: [pacienteId],
      });

      if (pacienteResult.rows.length === 0) {
        throw new ValidationError('Paciente no encontrado', { pacienteId: 'Paciente no válido' });
      }

      const paciente = pacienteResult.rows[0] as any;

      const id = randomUUID();
      // Si se proporciona medicoId (admin asignando turno), usar ese; sino usar el usuario actual
      const assignedMedicoId = medicoId || req.user!.id;
      // Si se proporciona fecha, usar esa; sino usar la fecha actual
      const assignedFecha = fecha || new Date().toISOString();
      // Lugar por defecto si no se proporciona
      const assignedLugar = lugar || 'VDC Internacional - Sede Principal';

      await db.execute({
        sql: `INSERT INTO JuntaMedica (id, pacienteId, medicoId, estado, fecha, hora, observaciones, createdAt, updatedAt)
              VALUES (?, ?, ?, 'PENDIENTE', ?, ?, ?, datetime('now'), datetime('now'))`,
        args: [id, pacienteId, assignedMedicoId, assignedFecha, hora || null, observaciones || null],
      });

      const newJunta = await db.execute({
        sql: `SELECT j.*, p.nombre as pacienteNombre, p.apellido as pacienteApellido, p.numeroDocumento, p.correo as pacienteCorreo,
              u.nombre as medicoNombre, u.apellido as medicoApellido, u.email as medicoEmail
              FROM JuntaMedica j
              LEFT JOIN Paciente p ON j.pacienteId = p.id
              LEFT JOIN User u ON j.medicoId = u.id
              WHERE j.id = ?`,
        args: [id],
      });

      const juntaRow = newJunta.rows[0] as any;

      // Enviar notificaciones por email (no bloqueante)
      const medicoNombreCompleto = `${juntaRow.medicoNombre || ''} ${juntaRow.medicoApellido || ''}`.trim();
      const pacienteNombreCompleto = `${juntaRow.pacienteNombre || ''} ${juntaRow.pacienteApellido || ''}`.trim();
      
      // Formatear fecha para el email
      const fechaFormateada = new Date(assignedFecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const emailData = {
        pacienteNombre: pacienteNombreCompleto,
        pacienteEmail: juntaRow.pacienteCorreo || '',
        medicoNombre: medicoNombreCompleto,
        medicoEmail: juntaRow.medicoEmail || '',
        fecha: fechaFormateada,
        hora: hora || 'Por confirmar',
        lugar: assignedLugar,
      };

      // Enviar emails de forma asíncrona (no esperar respuesta)
      if (juntaRow.medicoEmail) {
        emailService.sendJuntaNotificationToMedico(emailData).catch(err => {
          console.error('Error enviando email al médico:', err);
        });
      }

      if (juntaRow.pacienteCorreo) {
        emailService.sendJuntaNotificationToPaciente(emailData).catch(err => {
          console.error('Error enviando email al paciente:', err);
        });
      }

      res.status(201).json({
        id: juntaRow.id,
        fecha: juntaRow.fecha,
        hora: juntaRow.hora,
        pacienteId: juntaRow.pacienteId,
        pacienteNombre: pacienteNombreCompleto,
        pacienteDni: juntaRow.numeroDocumento,
        medicoId: juntaRow.medicoId,
        estado: juntaRow.estado,
        observaciones: juntaRow.observaciones,
        createdAt: juntaRow.createdAt,
        updatedAt: juntaRow.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/juntas/:id - Update junta
router.put(
  '/:id',
  authMiddleware,
  [
    param('id').isString().notEmpty(),
    body('estado').optional().isIn(['BORRADOR', 'PENDIENTE', 'APROBADA', 'RECHAZADA']),
    body('observaciones').optional().isString(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { estado, observaciones, aptitudLaboral, diagnosticoPrincipal, fechaDictamen, detallesDirector } = req.body;

      // Check if junta exists
      const juntaResult = await db.execute({
        sql: 'SELECT * FROM JuntaMedica WHERE id = ?',
        args: [id],
      });

      if (juntaResult.rows.length === 0) {
        throw new NotFoundError('Junta no encontrada');
      }

      const junta = juntaResult.rows[0] as any;

      // Check permissions
      if (req.user?.role === 'MEDICO_EVALUADOR' && junta.medicoId !== req.user.id) {
        throw new NotFoundError('Junta no encontrada');
      }

      // Build update query
      const updates: string[] = [];
      const args: any[] = [];

      if (estado) {
        // Only DIRECTOR_MEDICO, RRHH or ADMIN can change to APROBADA/RECHAZADA
        if (['APROBADA', 'RECHAZADA'].includes(estado)) {
          if (!['DIRECTOR_MEDICO', 'RRHH', 'ADMIN'].includes(req.user?.role || '')) {
            throw new ValidationError('No tiene permisos para aprobar/rechazar', { estado: 'Sin permisos' });
          }
        }
        updates.push('estado = ?');
        args.push(estado);
      }

      if (observaciones !== undefined) {
        updates.push('observaciones = ?');
        args.push(observaciones);
      }

      if (aptitudLaboral) {
        updates.push('aptitudLaboral = ?');
        args.push(aptitudLaboral);
      }

      if (diagnosticoPrincipal) {
        updates.push('diagnosticoPrincipal = ?');
        args.push(diagnosticoPrincipal);
      }

      if (fechaDictamen) {
        updates.push('fechaDictamen = ?');
        args.push(fechaDictamen);
      }

      if (detallesDirector !== undefined) {
        updates.push('detallesDirector = ?');
        args.push(detallesDirector);
      }

      if (updates.length > 0) {
        updates.push("updatedAt = datetime('now')");
        args.push(id);

        await db.execute({
          sql: `UPDATE JuntaMedica SET ${updates.join(', ')} WHERE id = ?`,
          args,
        });
      }

      // Return updated junta
      const updatedResult = await db.execute({
        sql: `SELECT j.*, p.nombre as pacienteNombre, p.apellido as pacienteApellido
              FROM JuntaMedica j
              LEFT JOIN Paciente p ON j.pacienteId = p.id
              WHERE j.id = ?`,
        args: [id],
      });

      res.json(updatedResult.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/juntas/:id/dictamen - Save dictamen for junta
router.post(
  '/:id/dictamen',
  authMiddleware,
  roleMiddleware(['MEDICO_EVALUADOR', 'DIRECTOR_MEDICO', 'ADMIN']),
  [
    param('id').isString().notEmpty(),
    body('dictamen').isObject().withMessage('Dictamen requerido'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { dictamen, finalizar } = req.body;

      // Check if junta exists
      const juntaResult = await db.execute({
        sql: 'SELECT * FROM JuntaMedica WHERE id = ?',
        args: [id],
      });

      if (juntaResult.rows.length === 0) {
        throw new NotFoundError('Junta no encontrada');
      }

      const junta = juntaResult.rows[0] as any;

      // Check permissions
      if (req.user?.role === 'MEDICO_EVALUADOR' && junta.medicoId !== req.user.id) {
        throw new NotFoundError('Junta no encontrada');
      }

      // Check if dictamen already exists
      const existingDictamen = await db.execute({
        sql: 'SELECT * FROM Dictamen WHERE juntaId = ?',
        args: [id],
      });

      const dictamenJson = JSON.stringify(dictamen);
      const dictamenId = randomUUID();

      if (existingDictamen.rows.length > 0) {
        // Update existing
        await db.execute({
          sql: "UPDATE Dictamen SET datosCompletos = ?, updatedAt = datetime('now') WHERE juntaId = ?",
          args: [dictamenJson, id],
        });
      } else {
        // Insert new
        await db.execute({
          sql: "INSERT INTO Dictamen (id, juntaId, datosCompletos, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
          args: [dictamenId, id, dictamenJson],
        });
      }

      // Update junta with key info from dictamen
      const updateJuntaArgs: any[] = [];
      let updateSql = 'UPDATE JuntaMedica SET ';
      const updates: string[] = [];

      if (dictamen.aptitudLaboral) {
        updates.push('aptitudLaboral = ?');
        updateJuntaArgs.push(dictamen.aptitudLaboral);
      }

      if (dictamen.diagnosticoPrincipal) {
        updates.push('diagnosticoPrincipal = ?');
        updateJuntaArgs.push(dictamen.diagnosticoPrincipal);
      }

      if (dictamen.fechaDictamen) {
        updates.push('fechaDictamen = ?');
        updateJuntaArgs.push(dictamen.fechaDictamen);
      }

      // If finalizar is true, change estado to PENDIENTE
      if (finalizar) {
        updates.push('estado = ?');
        updateJuntaArgs.push('PENDIENTE');
      }

      if (updates.length > 0) {
        updates.push("updatedAt = datetime('now')");
        updateJuntaArgs.push(id);
        updateSql += updates.join(', ') + ' WHERE id = ?';
        await db.execute({ sql: updateSql, args: updateJuntaArgs });
      }

      res.json({
        message: finalizar ? 'Dictamen guardado y junta finalizada' : 'Dictamen guardado como borrador',
        juntaId: id,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/juntas/:id/dictamen - Get dictamen for junta
router.get(
  '/:id/dictamen',
  authMiddleware,
  [param('id').isString().notEmpty()],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if junta exists and user has access
      const juntaResult = await db.execute({
        sql: 'SELECT * FROM JuntaMedica WHERE id = ?',
        args: [id],
      });

      if (juntaResult.rows.length === 0) {
        throw new NotFoundError('Junta no encontrada');
      }

      const junta = juntaResult.rows[0] as any;

      // Check permissions - MEDICO_EVALUADOR can only see their own
      if (req.user?.role === 'MEDICO_EVALUADOR' && junta.medicoId !== req.user.id) {
        throw new NotFoundError('Junta no encontrada');
      }

      // Get dictamen
      const dictamenResult = await db.execute({
        sql: 'SELECT * FROM Dictamen WHERE juntaId = ?',
        args: [id],
      });

      if (dictamenResult.rows.length === 0) {
        return res.json({ dictamen: null });
      }

      const dictamenRow = dictamenResult.rows[0] as any;
      res.json({
        dictamen: JSON.parse(dictamenRow.datosCompletos),
        createdAt: dictamenRow.createdAt,
        updatedAt: dictamenRow.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/juntas/:id/documentos - Upload document for junta
router.post(
  '/:id/documentos',
  authMiddleware,
  [
    param('id').isString().notEmpty(),
    body('nombre').isString().notEmpty().withMessage('Nombre del documento requerido'),
    body('tipo').isString().notEmpty().withMessage('Tipo de documento requerido'),
    body('contenido').isString().notEmpty().withMessage('Contenido del documento requerido'),
    body('categoria').isString().notEmpty().withMessage('Categoría requerida'),
    body('size').isInt({ min: 0 }).withMessage('Tamaño del archivo requerido'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { nombre, tipo, contenido, categoria, size } = req.body;

      // Check if junta exists
      const juntaResult = await db.execute({
        sql: 'SELECT * FROM JuntaMedica WHERE id = ?',
        args: [id],
      });

      if (juntaResult.rows.length === 0) {
        throw new NotFoundError('Junta no encontrada');
      }

      const junta = juntaResult.rows[0] as any;

      // Check permissions
      if (req.user?.role === 'MEDICO_EVALUADOR' && junta.medicoId !== req.user.id) {
        throw new NotFoundError('Junta no encontrada');
      }

      // Check if document already exists for this category
      const existingDoc = await db.execute({
        sql: 'SELECT * FROM DocumentoAdjunto WHERE juntaId = ? AND categoria = ?',
        args: [id, categoria],
      });

      const docId = randomUUID();
      // Generate internal URL for the document (sin /api porque se agrega en el frontend)
      const url = `/juntas/${id}/documentos/${docId}/download`;

      if (existingDoc.rows.length > 0) {
        // Update existing document
        const oldDoc = existingDoc.rows[0] as any;
        await db.execute({
          sql: `UPDATE DocumentoAdjunto 
                SET nombre = ?, tipo = ?, contenido = ?, size = ?, url = ?, updatedAt = datetime('now')
                WHERE id = ?`,
          args: [nombre, tipo, contenido, size, url, oldDoc.id],
        });

        res.json({
          message: 'Documento actualizado exitosamente',
          documento: {
            id: oldDoc.id,
            juntaId: id,
            nombre,
            tipo,
            url,
            categoria,
            size,
            createdAt: oldDoc.createdAt,
            updatedAt: new Date().toISOString(),
          },
        });
      } else {
        // Insert new document
        await db.execute({
          sql: `INSERT INTO DocumentoAdjunto (id, juntaId, nombre, tipo, url, contenido, categoria, size, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          args: [docId, id, nombre, tipo, url, contenido, categoria, size],
        });

        res.status(201).json({
          message: 'Documento guardado exitosamente',
          documento: {
            id: docId,
            juntaId: id,
            nombre,
            tipo,
            url,
            categoria,
            size,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/juntas/:id/documentos/:docId/download - Download document
router.get(
  '/:id/documentos/:docId/download',
  authMiddleware,
  [
    param('id').isString().notEmpty(),
    param('docId').isString().notEmpty(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, docId } = req.params;

      console.log(`[DOWNLOAD] Intentando descargar documento ${docId} de junta ${id}`);

      // Check if junta exists
      const juntaResult = await db.execute({
        sql: 'SELECT * FROM JuntaMedica WHERE id = ?',
        args: [id],
      });

      if (juntaResult.rows.length === 0) {
        console.log(`[DOWNLOAD] Junta ${id} no encontrada`);
        throw new NotFoundError('Junta no encontrada');
      }

      const junta = juntaResult.rows[0] as any;

      // Check permissions
      if (req.user?.role === 'MEDICO_EVALUADOR' && junta.medicoId !== req.user.id) {
        console.log(`[DOWNLOAD] Usuario ${req.user.id} no tiene permisos para junta ${id}`);
        throw new NotFoundError('Junta no encontrada');
      }

      // Get document
      const docResult = await db.execute({
        sql: 'SELECT * FROM DocumentoAdjunto WHERE id = ? AND juntaId = ?',
        args: [docId, id],
      });

      if (docResult.rows.length === 0) {
        console.log(`[DOWNLOAD] Documento ${docId} no encontrado`);
        throw new NotFoundError('Documento no encontrado');
      }

      const doc = docResult.rows[0] as any;
      console.log(`[DOWNLOAD] Documento encontrado: ${doc.nombre}, tiene contenido: ${!!doc.contenido}`);

      if (!doc.contenido) {
        console.log(`[DOWNLOAD] Documento ${docId} no tiene contenido`);
        throw new NotFoundError('Contenido del documento no disponible');
      }

      // Convert Base64 to Buffer
      const buffer = Buffer.from(doc.contenido, 'base64');
      console.log(`[DOWNLOAD] Buffer creado, tamaño: ${buffer.length} bytes`);

      // Set headers for file download
      res.setHeader('Content-Type', doc.tipo || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.nombre)}"`);
      res.setHeader('Content-Length', buffer.length);

      console.log(`[DOWNLOAD] Enviando archivo ${doc.nombre}`);
      res.send(buffer);
    } catch (error) {
      console.error('[DOWNLOAD] Error:', error);
      next(error);
    }
  }
);

// DELETE /api/juntas/:id - Delete junta (ADMIN/RRHH only)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['RRHH', 'ADMIN']),
  [param('id').isString().notEmpty()],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Check if junta exists
      const juntaResult = await db.execute({
        sql: 'SELECT * FROM JuntaMedica WHERE id = ?',
        args: [id],
      });

      if (juntaResult.rows.length === 0) {
        throw new NotFoundError('Junta no encontrada');
      }

      // Delete related data first
      await db.execute({ sql: 'DELETE FROM DocumentoAdjunto WHERE juntaId = ?', args: [id] });
      await db.execute({ sql: 'DELETE FROM Dictamen WHERE juntaId = ?', args: [id] });
      await db.execute({ sql: 'DELETE FROM JuntaMedica WHERE id = ?', args: [id] });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
