// Load environment variables FIRST - before any imports that need them
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import juntasRoutes from './routes/juntas';
import pacientesRoutes from './routes/pacientes';
import medicosRoutes from './routes/medicos';
import uploadRoutes from './routes/upload';
import usersRoutes from './routes/users';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint (temporal) - para verificar variables de entorno
app.get('/debug-env', (req, res) => {
  const tursoUrl = process.env.TURSO_DATABASE_URL || 'NOT SET';
  const tursoToken = process.env.TURSO_AUTH_TOKEN || 'NOT SET';
  res.json({
    TURSO_DATABASE_URL: tursoUrl,
    TURSO_AUTH_TOKEN_length: tursoToken.length,
    TURSO_AUTH_TOKEN_start: tursoToken.substring(0, 20),
    TURSO_AUTH_TOKEN_end: tursoToken.substring(tursoToken.length - 10),
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'NOT SET',
  });
});

// Debug endpoint para probar conexión a Turso
app.get('/debug-db', async (req, res) => {
  try {
    const tursoUrl = process.env.TURSO_DATABASE_URL?.replace('libsql://', 'https://') || '';
    const tursoToken = process.env.TURSO_AUTH_TOKEN || '';

    const response = await fetch(`${tursoUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tursoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql: 'SELECT 1 as test' } },
          { type: 'close' },
        ],
      }),
    });

    const data = await response.json();
    res.json({
      status: response.ok ? 'connected' : 'error',
      httpStatus: response.status,
      tursoUrl,
      response: data,
    });
  } catch (error: any) {
    res.json({
      status: 'error',
      error: error.message,
    });
  }
});

// Endpoint para inicializar la base de datos
app.get('/setup-db', async (req, res) => {
  try {
    const tursoUrl = process.env.TURSO_DATABASE_URL?.replace('libsql://', 'https://') || '';
    const tursoToken = process.env.TURSO_AUTH_TOKEN || '';
    const bcrypt = require('bcryptjs');

    const hashedPassword = await bcrypt.hash('Admin2025!', 10);

    const response = await fetch(`${tursoUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tursoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            type: 'execute',
            stmt: {
              sql: `CREATE TABLE IF NOT EXISTS User (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nombre TEXT,
                apellido TEXT,
                dni TEXT,
                telefono TEXT,
                fotoUrl TEXT,
                role TEXT DEFAULT 'ADMIN',
                createdAt TEXT DEFAULT (datetime('now')),
                updatedAt TEXT DEFAULT (datetime('now'))
              )`,
            },
          },
          {
            type: 'execute',
            stmt: {
              sql: `CREATE TABLE IF NOT EXISTS Paciente (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                apellido TEXT NOT NULL,
                numeroDocumento TEXT UNIQUE NOT NULL,
                correo TEXT,
                telefono TEXT,
                domicilio TEXT,
                createdAt TEXT DEFAULT (datetime('now')),
                updatedAt TEXT DEFAULT (datetime('now'))
              )`,
            },
          },
          {
            type: 'execute',
            stmt: {
              sql: `INSERT OR REPLACE INTO User (id, email, password, nombre, apellido, role)
                    VALUES ('admin-001', 'admin@vdc.com', '${hashedPassword}', 'Administrador', 'Sistema', 'ADMIN')`,
            },
          },
          { type: 'close' },
        ],
      }),
    });

    const data = await response.json();
    res.json({
      status: response.ok ? 'success' : 'error',
      message: 'Base de datos inicializada',
      response: data,
    });
  } catch (error: any) {
    res.json({
      status: 'error',
      error: error.message,
    });
  }
});

// Debug: verificar usuarios en la base de datos
app.get('/debug-users', async (req, res) => {
  try {
    const tursoUrl = process.env.TURSO_DATABASE_URL?.replace('libsql://', 'https://') || '';
    const tursoToken = process.env.TURSO_AUTH_TOKEN || '';

    const response = await fetch(`${tursoUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tursoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql: 'SELECT id, email, password, nombre, apellido, role FROM User' } },
          { type: 'close' },
        ],
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

// Debug: probar login directamente
app.get('/debug-login', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { findUserByEmail } = require('./lib/prisma');

    const user = await findUserByEmail('admin@vdc.com');

    if (!user) {
      return res.json({ error: 'Usuario no encontrado', user: null });
    }

    const testPassword = 'Admin2025!';
    const isValid = await bcrypt.compare(testPassword, user.password);

    res.json({
      userFound: true,
      email: user.email,
      passwordHash: user.password ? user.password.substring(0, 20) + '...' : 'NULL',
      passwordValid: isValid,
    });
  } catch (error: any) {
    res.json({ error: error.message, stack: error.stack });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/juntas', juntasRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 VDC Juntas Médicas API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
