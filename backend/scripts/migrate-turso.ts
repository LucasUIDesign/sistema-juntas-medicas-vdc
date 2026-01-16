// Script para crear las tablas en Turso
// Ejecutar con: npx ts-node scripts/migrate-turso.ts

import * as dotenv from 'dotenv';
dotenv.config();

const TURSO_URL = process.env.TURSO_DATABASE_URL?.replace('libsql://', 'https://') || '';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

async function executeSQL(sql: string): Promise<any> {
    const requestBody = {
        requests: [
            {
                type: 'execute',
                stmt: { sql },
            },
            { type: 'close' },
        ],
    };

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
        throw new Error(`Turso error: ${error}`);
    }

    return response.json();
}

async function runMigration() {
    console.log('🚀 Iniciando migración de tablas en Turso...\n');
    console.log('📡 URL:', TURSO_URL);

    const statements = [
        // Crear tabla JuntaMedica
        `CREATE TABLE IF NOT EXISTS JuntaMedica (
      id TEXT PRIMARY KEY,
      pacienteId TEXT NOT NULL,
      medicoId TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'BORRADOR',
      fecha TEXT NOT NULL,
      fechaDictamen TEXT,
      aptitudLaboral TEXT,
      diagnosticoPrincipal TEXT,
      observaciones TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

        // Crear tabla Dictamen
        `CREATE TABLE IF NOT EXISTS Dictamen (
      id TEXT PRIMARY KEY,
      juntaId TEXT NOT NULL UNIQUE,
      datosCompletos TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

        // Crear tabla DocumentoAdjunto
        `CREATE TABLE IF NOT EXISTS DocumentoAdjunto (
      id TEXT PRIMARY KEY,
      juntaId TEXT NOT NULL,
      nombre TEXT NOT NULL,
      tipo TEXT,
      url TEXT NOT NULL,
      categoria TEXT,
      size INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

        // Crear índices
        `CREATE INDEX IF NOT EXISTS idx_juntamedica_paciente ON JuntaMedica(pacienteId)`,
        `CREATE INDEX IF NOT EXISTS idx_juntamedica_medico ON JuntaMedica(medicoId)`,
        `CREATE INDEX IF NOT EXISTS idx_juntamedica_estado ON JuntaMedica(estado)`,
        `CREATE INDEX IF NOT EXISTS idx_dictamen_junta ON Dictamen(juntaId)`,
        `CREATE INDEX IF NOT EXISTS idx_documento_junta ON DocumentoAdjunto(juntaId)`,
    ];

    for (const stmt of statements) {
        const shortStmt = stmt.substring(0, 60).replace(/\s+/g, ' ');
        try {
            await executeSQL(stmt);
            console.log(`✅ ${shortStmt}...`);
        } catch (error: any) {
            console.error(`❌ Error: ${shortStmt}...`);
            console.error(`   ${error.message}`);
        }
    }

    console.log('\n✨ Migración completada!');

    // Verificar que las tablas existen
    console.log('\n📋 Verificando tablas creadas...');
    try {
        const result = await executeSQL("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tablas en la base de datos:');
        const tables = result.results?.[0]?.response?.result?.rows || [];
        tables.forEach((row: any) => {
            console.log(`  - ${row[0]?.value}`);
        });
    } catch (error: any) {
        console.error('Error verificando tablas:', error.message);
    }
}

runMigration().catch(console.error);
