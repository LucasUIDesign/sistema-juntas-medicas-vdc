import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function addDetallesDirectorColumn() {
  try {
    console.log('🔧 Agregando columna detallesDirector a JuntaMedica...\n');

    console.log('📝 Agregando columna "detallesDirector"...');
    try {
      await db.execute({
        sql: `ALTER TABLE JuntaMedica ADD COLUMN detallesDirector TEXT`,
        args: []
      });
      console.log('✅ Columna "detallesDirector" agregada exitosamente\n');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  Columna "detallesDirector" ya existe\n');
      } else {
        throw error;
      }
    }

    // Verificar el schema actualizado
    console.log('🔍 Verificando schema actualizado...\n');
    const result = await db.execute({
      sql: `PRAGMA table_info(JuntaMedica)`,
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

addDetallesDirectorColumn();
