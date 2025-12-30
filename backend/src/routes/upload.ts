import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, AuthenticatedRequest, roleMiddleware } from '../middleware/auth';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();

// Allowed file types
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Mock S3 storage (in-memory for development)
const mockStorage: Map<string, { contentType: string; uploadedAt: string }> = new Map();

// POST /api/upload/presigned - Get presigned URL for upload
router.post(
  '/presigned',
  authMiddleware,
  roleMiddleware(['MEDICO_SUPERIOR']),
  [
    body('fileName').isString().notEmpty().withMessage('Nombre de archivo requerido'),
    body('contentType').isString().isIn(ALLOWED_TYPES).withMessage('Tipo de archivo no permitido'),
    body('fileSize').isInt({ min: 1, max: MAX_FILE_SIZE }).withMessage('Tamaño de archivo inválido'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Datos inválidos', errors.array().reduce((acc, err) => {
        if ('path' in err) {
          acc[err.path] = err.msg;
        }
        return acc;
      }, {} as Record<string, string>));
    }

    const { fileName, contentType, fileSize } = req.body;

    // Generate mock presigned URL
    const key = `uploads/${req.user!.id}/${Date.now()}-${fileName}`;
    const presignedUrl = `https://mock-s3.vdc-internacional.com/${key}?signature=mock`;

    // Store metadata
    mockStorage.set(key, {
      contentType,
      uploadedAt: new Date().toISOString(),
    });

    res.json({
      uploadUrl: presignedUrl,
      key,
      expiresIn: 3600, // 1 hour
    });
  }
);

// GET /api/upload/:key - Get presigned URL for download
router.get(
  '/:key(*)',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const { key } = req.params;

    const fileInfo = mockStorage.get(key);
    if (!fileInfo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    // Generate mock download URL
    const downloadUrl = `https://mock-s3.vdc-internacional.com/${key}?signature=mock-download`;

    res.json({
      downloadUrl,
      contentType: fileInfo.contentType,
      expiresIn: 3600,
    });
  }
);

// DELETE /api/upload/:key - Delete file
router.delete(
  '/:key(*)',
  authMiddleware,
  roleMiddleware(['MEDICO_SUPERIOR', 'RRHH']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { key } = req.params;

    if (!mockStorage.has(key)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    mockStorage.delete(key);
    res.status(204).send();
  }
);

export default router;
