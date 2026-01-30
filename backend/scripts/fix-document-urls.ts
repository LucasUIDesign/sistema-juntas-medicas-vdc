import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function fixDocumentUrls() {
  try {
    console.log('🔧 Corrigiendo URLs de documentos...\n');

    // Obtener todos los documentos con URL que empiece con /api
    const result = await db.execute({
      sql: `SELECT id, url FROM DocumentoAdjunto WHERE url LIKE '/api/%'`,
      args: []
    });

    console.log(`📋 Encontrados ${result.rows.length} documentos con URL incorrecta\n`);

    for (const doc of result.rows) {
      const oldUrl = (doc as any).url;
      const newUrl = oldUrl.replace('/api/', '/');
      
      console.log(`Actualizando documento ${(doc as any).id}:`);
      console.log(`  Antes: ${oldUrl}`);
      console.log(`  Después: ${newUrl}`);

      await db.execute({
        sql: `UPDATE DocumentoAdjunto SET url = ? WHERE id = ?`,
        args: [newUrl, (doc as any).id]
      });
      
      console.log(`  ✅ Actualizado\n`);
    }

    console.log('✅✅✅ TODAS LAS URLs CORREGIDAS! ✅✅✅');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

fixDocumentUrls();
