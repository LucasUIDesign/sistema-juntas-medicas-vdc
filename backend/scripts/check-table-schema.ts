import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkTableSchema() {
  try {
    console.log('🔍 Verificando schema de DocumentoAdjunto...\n');

    // Obtener información de la tabla
    const result = await db.execute({
      sql: `PRAGMA table_info(DocumentoAdjunto)`,
      args: []
    });

    console.log('📋 Columnas de la tabla DocumentoAdjunto:');
    console.log('=====================================\n');
    
    result.rows.forEach((row: any) => {
      console.log(`Columna: ${row.name}`);
      console.log(`  Tipo: ${row.type}`);
      console.log(`  Not Null: ${row.notnull === 1 ? 'Sí' : 'No'}`);
      console.log(`  Default: ${row.dflt_value || 'NULL'}`);
      console.log(`  Primary Key: ${row.pk === 1 ? 'Sí' : 'No'}`);
      console.log();
    });

    console.log('=====================================');
    console.log(`Total de columnas: ${result.rows.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkTableSchema();
