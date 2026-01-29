import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function addContenidoColumn() {
  try {
    console.log('🔧 Agregando columna "contenido" a DocumentoAdjunto...\n');

    // Agregar columna contenido para almacenar archivos en Base64
    console.log('📝 Agregando columna "contenido"...');
    try {
      await db.execute({
        sql: `ALTER TABLE DocumentoAdjunto ADD COLUMN contenido TEXT`,
        args: []
      });
      console.log('✅ Columna "contenido" agregada exitosamente\n');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  Columna "contenido" ya existe\n');
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

addContenidoColumn();
