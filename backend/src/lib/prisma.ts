import { createClient } from '@libsql/client';

// Create libSQL client for Turso
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Helper functions for common database operations
export async function findUserByEmail(email: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM User WHERE email = ?',
    args: [email],
  });
  return result.rows[0] || null;
}

export async function findUserById(id: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM User WHERE id = ?',
    args: [id],
  });
  return result.rows[0] || null;
}

export async function updateUser(id: string, data: Record<string, any>) {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map(f => `${f} = ?`).join(', ');

  await db.execute({
    sql: `UPDATE User SET ${setClause}, updatedAt = datetime('now') WHERE id = ?`,
    args: [...values, id],
  });

  return findUserById(id);
}

// Paciente operations
export async function findAllPacientes(search?: string) {
  if (search) {
    const searchPattern = `%${search}%`;
    const result = await db.execute({
      sql: `SELECT * FROM Paciente WHERE
            nombre LIKE ? OR
            apellido LIKE ? OR
            numeroDocumento LIKE ?
            ORDER BY apellido, nombre`,
      args: [searchPattern, searchPattern, searchPattern],
    });
    return result.rows;
  }

  const result = await db.execute('SELECT * FROM Paciente ORDER BY apellido, nombre');
  return result.rows;
}

export async function findPacienteById(id: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM Paciente WHERE id = ?',
    args: [id],
  });
  return result.rows[0] || null;
}

export async function findPacienteByDocumento(documento: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM Paciente WHERE numeroDocumento = ?',
    args: [documento],
  });
  return result.rows[0] || null;
}

export async function createPaciente(data: {
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  correo?: string;
  telefono?: string;
  domicilio?: string;
}) {
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO Paciente (id, nombre, apellido, numeroDocumento, correo, telefono, domicilio, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [id, data.nombre, data.apellido, data.numeroDocumento, data.correo || null, data.telefono || null, data.domicilio || null],
  });
  return findPacienteById(id);
}

export async function updatePaciente(id: string, data: Record<string, any>) {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map(f => `${f} = ?`).join(', ');

  await db.execute({
    sql: `UPDATE Paciente SET ${setClause}, updatedAt = datetime('now') WHERE id = ?`,
    args: [...values, id],
  });

  return findPacienteById(id);
}

export async function deletePaciente(id: string) {
  await db.execute({
    sql: 'DELETE FROM Paciente WHERE id = ?',
    args: [id],
  });
}
