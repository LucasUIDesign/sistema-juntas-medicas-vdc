// Turso HTTP API client
// Read env vars lazily to ensure dotenv has loaded them
function getTursoUrl(): string {
  return process.env.TURSO_DATABASE_URL?.replace('libsql://', 'https://') || '';
}

function getTursoToken(): string {
  return process.env.TURSO_AUTH_TOKEN || '';
}

interface TursoResult {
  rows: any[];
}

async function executeSQL(sql: string, args: any[] = []): Promise<TursoResult> {
  const TURSO_URL = getTursoUrl();
  const TURSO_TOKEN = getTursoToken();

  const requestBody = {
    requests: [
      {
        type: 'execute',
        stmt: args.length > 0
          ? { sql, args: args.map(arg => arg === null ? { type: 'null', value: null } : { type: 'text', value: String(arg) }) }
          : { sql },
      },
      { type: 'close' },
    ],
  };

  console.log('Turso request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${TURSO_URL}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURSO_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Turso error response:', error);
    throw new Error(`Turso error: ${error}`);
  }

  const data: any = await response.json();
  console.log('Turso response:', JSON.stringify(data, null, 2));

  if (data.results?.[0]?.response?.result?.rows) {
    const cols = data.results[0].response.result.cols.map((c: any) => c.name);
    const rows = data.results[0].response.result.rows.map((row: any) => {
      const obj: any = {};
      row.forEach((cell: any, i: number) => {
        obj[cols[i]] = cell?.value ?? null;
      });
      return obj;
    });
    return { rows };
  }

  return { rows: [] };
}

export const db = {
  execute: async (query: string | { sql: string; args: any[] }) => {
    if (typeof query === 'string') {
      return executeSQL(query);
    }
    return executeSQL(query.sql, query.args);
  },
};

// Helper functions for common database operations
export async function findUserByEmail(email: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM User WHERE email = ?',
    args: [email],
  });
  return result.rows[0] || null;
}

export async function findUserByUsername(username: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM User WHERE username = ?',
    args: [username],
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
