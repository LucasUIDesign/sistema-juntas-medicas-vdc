import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function addMissingColumns() {
  try {
    console.log('🔧 Agregando columnas faltantes a DocumentoAdjunto...\n');

    // Agregar columna categoria
    console.log('📝 Agregando columna "categoria"...');
    try {
      await db.execute({
        sql: `ALTER TABLE DocumentoAdjunto ADD COLUMN categoria TEXT`,
        args: []
      });
      console.log('✅ Columna "categoria" agregada exitosamente\n');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  Columna "categoria" ya existe\n');
      } else {
        throw error;
      }
    }

    // Agregar columna updatedAt
    console.log('📝 Agregando columna "updatedAt"...');
    try {
      await db.execute({
        sql: `ALTER TABLE DocumentoAdjunto ADD COLUMN updatedAt TEXT DEFAULT (datetime('now'))`,
        args: []
      });
      console.log('✅ Columna "updatedAt" agregada exitosamente\n');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  Columna "updatedAt" ya existe\n');
      } else {
        throw error;
      }
    }

    // Verificar el schema actualizado
    console.log('🔍 Verificando schema actualizado...\n');
    const result = await db.execute({
      sql: `PRAGMA table_info(DocumentoAdjunto)`,
      args: []
    });

    console.log('📋 Columnas actuales:');
    result.rows.forEach((row: any) => {
      console.log(`   - ${row.name} (${row.type})`);
    });

    console.log('\n✅✅✅ MIGRACIÓN COMPLETADA! ✅✅✅');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

addMissingColumns();
