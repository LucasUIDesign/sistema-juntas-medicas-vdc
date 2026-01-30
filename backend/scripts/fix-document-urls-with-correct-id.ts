import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function fixDocumentUrlsWithCorrectId() {
  try {
    console.log('🔧 Corrigiendo URLs de documentos con IDs correctos...\n');

    // Obtener todos los documentos que tienen contenido (los que se pueden descargar)
    const result = await db.execute({
      sql: `SELECT id, juntaId, nombre, url, 
            CASE WHEN contenido IS NULL THEN 'NO' ELSE 'SI' END as tieneContenido
            FROM DocumentoAdjunto 
            WHERE contenido IS NOT NULL`,
      args: []
    });

    console.log(`📋 Encontrados ${result.rows.length} documentos con contenido\n`);

    for (const doc of result.rows) {
      const docData = doc as any;
      const correctUrl = `/juntas/${docData.juntaId}/documentos/${docData.id}/download`;
      
      console.log(`Actualizando documento: ${docData.nombre}`);
      console.log(`  ID: ${docData.id}`);
      console.log(`  URL actual: ${docData.url}`);
      console.log(`  URL correcta: ${correctUrl}`);

      if (docData.url !== correctUrl) {
        await db.execute({
          sql: `UPDATE DocumentoAdjunto SET url = ? WHERE id = ?`,
          args: [correctUrl, docData.id]
        });
        console.log(`  ✅ Actualizado\n`);
      } else {
        console.log(`  ℹ️  Ya está correcto\n`);
      }
    }

    console.log('✅✅✅ TODAS LAS URLs CORREGIDAS CON IDS CORRECTOS! ✅✅✅');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

fixDocumentUrlsWithCorrectId();
