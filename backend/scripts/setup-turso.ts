import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function setup() {
  console.log('Conectando a Turso...');
  console.log('URL:', process.env.TURSO_DATABASE_URL);

  // Crear tabla User
  console.log('\nCreando tabla User...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre TEXT,
      apellido TEXT,
      dni TEXT,
      telefono TEXT,
      fotoUrl TEXT,
      role TEXT DEFAULT 'ADMIN',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Tabla User creada');

  // Crear tabla Paciente
  console.log('\nCreando tabla Paciente...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS Paciente (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      numeroDocumento TEXT UNIQUE NOT NULL,
      correo TEXT,
      telefono TEXT,
      domicilio TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Tabla Paciente creada');

  // Crear usuario admin
  console.log('\nCreando usuario admin...');
  const hashedPassword = await bcrypt.hash('Admin2025!', 10);
  const id = crypto.randomUUID();

  try {
    await client.execute({
      sql: `INSERT INTO User (id, email, password, nombre, apellido, role) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, 'admin@vdc.com', hashedPassword, 'Administrador', 'Sistema', 'ADMIN'],
    });
    console.log('Usuario admin creado:');
    console.log('  Email: admin@vdc.com');
    console.log('  Password: Admin2025!');
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      console.log('Usuario admin ya existe');
    } else {
      throw error;
    }
  }

  // Verificar tablas
  console.log('\nVerificando tablas...');
  const tables = await client.execute(`SELECT name FROM sqlite_master WHERE type='table'`);
  console.log('Tablas en la base de datos:', tables.rows.map((r: any) => r.name));

  const users = await client.execute(`SELECT id, email, nombre, role FROM User`);
  console.log('Usuarios:', users.rows);

  console.log('\n¡Setup completado!');
}

setup()
  .catch(console.error)
  .finally(() => process.exit());
