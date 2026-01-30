import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkJuntaMedicaSchema() {
  try {
    console.log('🔍 Verificando schema de JuntaMedica...\n');

    const result = await db.execute({
      sql: `PRAGMA table_info(JuntaMedica)`,
      args: []
    });

    console.log('📋 Columnas de la tabla JuntaMedica:');
    console.log('=====================================\n');
    
    result.rows.forEach((row: any) => {
      console.log(`Columna: ${row.name}`);
      console.log(`  Tipo: ${row.type}`);
      console.log(`  Not Null: ${row.notnull === 1 ? 'Sí' : 'No'}`);
      console.log(`  Default: ${row.dflt_value || 'NULL'}`);
      console.log();
    });

    console.log('=====================================');
    console.log(`Total de columnas: ${result.rows.length}`);

    // Verificar si existe detallesDirector
    const hasDetallesDirector = result.rows.some((row: any) => row.name === 'detallesDirector');
    console.log(`\n¿Tiene columna detallesDirector? ${hasDetallesDirector ? '✅ SÍ' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkJuntaMedicaSchema();
