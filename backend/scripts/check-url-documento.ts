import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const DOC_ID = 'f5e72ace-759e-46f5-a6d3-2919598b9465';

async function checkUrlDocumento() {
  try {
    console.log('🔍 Verificando URL del documento...\n');

    const result = await db.execute({
      sql: `SELECT id, juntaId, nombre, url FROM DocumentoAdjunto WHERE id = ?`,
      args: [DOC_ID]
    });

    if (result.rows.length === 0) {
      console.log('❌ Documento no encontrado');
      return;
    }

    const doc = result.rows[0] as any;
    console.log('📄 Documento encontrado:');
    console.log(`   ID: ${doc.id}`);
    console.log(`   Junta ID: ${doc.juntaId}`);
    console.log(`   Nombre: ${doc.nombre}`);
    console.log(`   URL: ${doc.url}`);
    console.log();
    console.log('🔗 URL completa esperada:');
    console.log(`   /api/juntas/${doc.juntaId}/documentos/${doc.id}/download`);
    console.log();
    console.log('✅ URL coincide:', doc.url === `/api/juntas/${doc.juntaId}/documentos/${doc.id}/download`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkUrlDocumento();
