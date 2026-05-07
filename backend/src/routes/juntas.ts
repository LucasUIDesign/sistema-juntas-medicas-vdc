import { Router, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authMiddleware, AuthenticatedRequest, roleMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { db } from '../lib/prisma';
import { randomUUID } from 'crypto';
import { emailService } from '../services/emailService';
import { generateConstanciaHTML } from '../services/constanciaPdfService';
import ExcelJS from 'exceljs';

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

      // Obtener documentos para cada junta
      const juntasConDocumentos = await Promise.all(
        paginatedData.map(async (row: any) => {
          let dictamenObj = null;
          if (row.datosCompletos) {
            try {
              dictamenObj = JSON.parse(row.datosCompletos);
            } catch (e) {
              console.error('Error parsing dictamen JSON', e);
            }
          }

          // Obtener documentos de esta junta
          const docsResult = await db.execute({
            sql: 'SELECT id, nombre, tipo, url, size, categoria, createdAt FROM DocumentoAdjunto WHERE juntaId = ?',
            args: [row.id],
          });

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
            documentos: docsResult.rows,
            documentosCount: docsResult.rows.length,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          };
        })
      );

      res.json({
        data: juntasConDocumentos,
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

// GET /api/juntas/export/excel - Export all juntas as Excel (Director Médico, RRHH, ADMIN)
router.get(
  '/export/excel',
  authMiddleware,
  roleMiddleware(['DIRECTOR_MEDICO', 'RRHH', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Get all juntas with patient info and dictamen
      const result = await db.execute({
        sql: `
          SELECT
            j.id, j.fecha, j.estado, j.aptitudLaboral,
            p.nombre as pacienteNombre, p.apellido as pacienteApellido, p.numeroDocumento,
            d.datosCompletos
          FROM JuntaMedica j
          LEFT JOIN Paciente p ON j.pacienteId = p.id
          LEFT JOIN Dictamen d ON j.id = d.juntaId
          ORDER BY j.fecha DESC
        `,
        args: [],
      });

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'VDC Internacional - Sistema de Juntas Médicas';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Juntas Médicas', {
        properties: { defaultRowHeight: 20 },
      });

      // Define columns
      worksheet.columns = [
        { header: 'Nº', key: 'num', width: 6 },
        { header: 'Fecha', key: 'fecha', width: 14 },
        { header: 'Paciente', key: 'paciente', width: 35 },
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'Condición', key: 'condicion', width: 28 },
        { header: 'Estado', key: 'estado', width: 20 },
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E79' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 28;

      // Add data rows
      result.rows.forEach((row: any, index: number) => {
        // Parse aptitud from dictamen if not in junta directly
        let aptitud = row.aptitudLaboral;
        if (!aptitud && row.datosCompletos) {
          try {
            const dictamen = JSON.parse(row.datosCompletos);
            aptitud = dictamen.aptitudLaboral;
          } catch (e) {
            // ignore parse error
          }
        }

        const condicionText = getResultadoText(aptitud);
        const fechaFormatted = row.fecha
          ? new Date(row.fecha).toLocaleDateString('es-AR')
          : '-';

        const estadoLabels: Record<string, string> = {
          BORRADOR: 'Borrador',
          PENDIENTE: 'Pendiente',
          APROBADA: 'Aprobada',
          RECHAZADA: 'Rechazada',
        };

        const dataRow = worksheet.addRow({
          num: index + 1,
          fecha: fechaFormatted,
          paciente: `${row.pacienteApellido || ''}, ${row.pacienteNombre || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, ''),
          dni: row.numeroDocumento || '-',
          condicion: condicionText,
          estado: estadoLabels[row.estado] || row.estado || '-',
        });

        // Alternate row colors
        if (index % 2 === 0) {
          dataRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F7FB' },
          };
        }

        // Color code the condición cell
        const condicionCell = dataRow.getCell('condicion');
        if (aptitud === 'APTO') {
          condicionCell.font = { bold: true, color: { argb: 'FF15803D' } };
        } else if (aptitud === 'NO_APTO' || aptitud === 'NO_APTO_DEFINITIVO') {
          condicionCell.font = { bold: true, color: { argb: 'FFDC2626' } };
        } else if (aptitud === 'APTO_CON_RESTRICCIONES' || aptitud === 'NO_APTO_TEMPORARIO') {
          condicionCell.font = { bold: true, color: { argb: 'FFCA8A04' } };
        }

        dataRow.alignment = { vertical: 'middle' };
      });

      // Add borders to all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD0D5DD' } },
            left: { style: 'thin', color: { argb: 'FFD0D5DD' } },
            bottom: { style: 'thin', color: { argb: 'FFD0D5DD' } },
            right: { style: 'thin', color: { argb: 'FFD0D5DD' } },
          };
        });
      });

      // Set response headers
      const filename = `juntas_medicas_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('[EXCEL EXPORT] Error:', error);
      next(error);
    }
  }
);

// GET /api/juntas/:id/constancia/pdf - Download constancia as PDF (DEBE IR ANTES DE /:id)
router.get(
  '/:id/constancia/pdf',
  authMiddleware,
  [param('id').isString()],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      console.log('[CONSTANCIA PDF] Iniciando generación para junta:', id);

      // Get junta data
      const juntaResult = await db.execute({
        sql: `
          SELECT
            j.id, j.fecha, j.hora, j.aptitudLaboral,
            p.nombre as pacienteNombre, p.apellido as pacienteApellido, p.numeroDocumento,
            p.domicilio as pacienteDomicilio,
            d.datosCompletos
          FROM JuntaMedica j
          LEFT JOIN Paciente p ON j.pacienteId = p.id
          LEFT JOIN Dictamen d ON j.id = d.juntaId
          WHERE j.id = ?
        `,
        args: [id],
      });

      if (juntaResult.rows.length === 0) {
        console.error('[CONSTANCIA PDF] Junta no encontrada:', id);
        throw new NotFoundError('Junta no encontrada');
      }

      const junta = juntaResult.rows[0] as any;
      console.log('[CONSTANCIA PDF] Datos de junta obtenidos');

      // Parse dictamen data for additional info
      let dictamenData: any = {};
      if (junta.datosCompletos) {
        try {
          dictamenData = JSON.parse(junta.datosCompletos);
        } catch (error) {
          console.error('[CONSTANCIA PDF] Error parsing dictamen data:', error);
        }
      }

      // Build motivo de consulta text
      let motivoConsulta = 'SE EVALUA A AGENTE, CERTIFICADO MEDICO EXPEDIDO POR DR/A.';
      if (dictamenData.motivoJunta && Array.isArray(dictamenData.motivoJunta) && dictamenData.motivoJunta.length > 0) {
        motivoConsulta = dictamenData.motivoJunta.join(', ');
      }
      if (Array.isArray(dictamenData.motivoJunta) && dictamenData.motivoJunta.includes('TAREAS PASIVAS') && dictamenData.tareasPassivasDetalle) {
        motivoConsulta = motivoConsulta.replace('TAREAS PASIVAS', `TAREAS PASIVAS: ${dictamenData.tareasPassivasDetalle}`);
      }

      // Prepare constancia data with all new fields
      const constanciaData = {
        provincia: 'Resistencia',
        fecha: new Date(junta.fecha).toLocaleDateString('es-AR'),
        empleado: `${junta.pacienteApellido || ''}, ${junta.pacienteNombre || ''}`.trim(),
        reparticion: dictamenData.establecimiento || '',
        dni: junta.numeroDocumento || '',
        resultado: getResultadoText(junta.aptitudLaboral || dictamenData.aptitudLaboral),
        // Nuevos campos
        domicilio: dictamenData.domicilio || junta.pacienteDomicilio || '',
        fechaNacimiento: dictamenData.fechaNacimiento
          ? new Date(dictamenData.fechaNacimiento).toLocaleDateString('es-AR')
          : '',
        hora: junta.hora || '',
        medicosEvaluadores: dictamenData.medicosEvaluadores || [],
        lugarAtencion: 'RESISTENCIA-CHACO',
        motivoConsulta: motivoConsulta,
        medicoTratante: dictamenData.medicoTratanteNombre || '',
        medicoTratanteMatricula: dictamenData.medicoTratanteMatricula || '',
        justifica: dictamenData.justifica || '',
        justificaDesde: dictamenData.fechaDictamenDesde
          ? new Date(dictamenData.fechaDictamenDesde).toLocaleDateString('es-AR')
          : dictamenData.fechaInicioLicencia
            ? new Date(dictamenData.fechaInicioLicencia).toLocaleDateString('es-AR')
            : '',
        justificaHasta: dictamenData.fechaDictamenHasta
          ? new Date(dictamenData.fechaDictamenHasta).toLocaleDateString('es-AR')
          : '',
        tipoConsulta: dictamenData.tipoConsulta || '',
        fundamentacion: buildFundamentacion(dictamenData, junta.aptitudLaboral),
      };

      console.log('[CONSTANCIA PDF] Generando HTML...');
      const html = generateConstanciaHTML(constanciaData);

      // Set response headers for HTML
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
      
      console.log('[CONSTANCIA PDF] HTML enviado al cliente');
    } catch (error) {
      console.error('[CONSTANCIA PDF] Error:', error);
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

// Helper function to format aptitud laboral
function getResultadoText(aptitud: string | undefined): string {
  if (!aptitud) return 'PENDIENTE';
  
  const map: Record<string, string> = {
    'APTO': 'APTO',
    'NO_APTO': 'NO APTO',
    'APTO_CON_RESTRICCIONES': 'APTO CON RESTRICCIONES',
    'NO_APTO_TEMPORARIO': 'NO APTO TEMPORARIO',
    'NO_APTO_DEFINITIVO': 'NO APTO DEFINITIVO',
  };
  
  return map[aptitud] || aptitud;
}

// Helper function to build fundamentación text from dictamen data
function buildFundamentacion(dictamenData: any, aptitudJunta: string | undefined): string {
  const parts: string[] = [];

  // 1. Conclusión médica (aptitud laboral) — resultado en mayúsculas y negrita
  const aptitud = dictamenData.aptitudLaboral || aptitudJunta;
  if (aptitud) {
    parts.push(`CONCLUSIÓN MÉDICA: <strong>${getResultadoText(aptitud).toUpperCase()}</strong>.`);
  }

  // 2. Diagnóstico principal
  if (dictamenData.diagnosticoPrincipal) {
    parts.push(`DIAGNÓSTICO: ${dictamenData.diagnosticoPrincipal}.`);
  }

  // 3. Restricciones
  if (dictamenData.restricciones) {
    parts.push(`RESTRICCIONES: ${dictamenData.restricciones}.`);
  }

  // 4. Recomendaciones / Indicaciones
  if (dictamenData.recomendaciones) {
    parts.push(`INDICACIONES Y RECOMENDACIONES: ${dictamenData.recomendaciones}.`);
  }

  // 5. Pronóstico (tiempo de recuperación)
  if (dictamenData.tiempoRecuperacion) {
    parts.push(`PRONÓSTICO: ${dictamenData.tiempoRecuperacion}.`);
  }

  return parts.join('<br><br>');
}

export default router;
