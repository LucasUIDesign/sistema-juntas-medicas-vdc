import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const JUNTA_ID = 'dffe38f6-9bed-4053-8ad1-6820380e7757';
const DOC_ID_FROM_URL = 'd7fb7459-02bc-49a6-843c-8e0c784c4169';

async function checkDocIdMismatch() {
  try {
    console.log('🔍 Verificando IDs de documentos...\n');

    // Buscar por el ID de la URL
    console.log(`1. Buscando documento con ID: ${DOC_ID_FROM_URL}`);
    const byId = await db.execute({
      sql: `SELECT * FROM DocumentoAdjunto WHERE id = ?`,
      args: [DOC_ID_FROM_URL]
    });
    console.log(`   Encontrado: ${byId.rows.length > 0 ? 'SÍ' : 'NO'}`);
    if (byId.rows.length > 0) {
      const doc = byId.rows[0] as any;
      console.log(`   Nombre: ${doc.nombre}`);
      console.log(`   URL: ${doc.url}`);
    }
    console.log();

    // Buscar todos los documentos de esa junta
    console.log(`2. Buscando todos los documentos de junta: ${JUNTA_ID}`);
    const byJunta = await db.execute({
      sql: `SELECT id, nombre, url FROM DocumentoAdjunto WHERE juntaId = ?`,
      args: [JUNTA_ID]
    });
    console.log(`   Encontrados: ${byJunta.rows.length} documentos\n`);
    
    byJunta.rows.forEach((doc: any, index: number) => {
      console.log(`   ${index + 1}. ID: ${doc.id}`);
      console.log(`      Nombre: ${doc.nombre}`);
      console.log(`      URL: ${doc.url}`);
      console.log();
    });

    // Extraer el docId de la URL
    console.log('3. Analizando URLs...');
    byJunta.rows.forEach((doc: any) => {
      const urlParts = doc.url.split('/');
      const docIdFromUrl = urlParts[urlParts.length - 2]; // El ID está antes de /download
      console.log(`   Documento: ${doc.nombre}`);
      console.log(`   ID real: ${doc.id}`);
      console.log(`   ID en URL: ${docIdFromUrl}`);
      console.log(`   Coinciden: ${doc.id === docIdFromUrl ? '✅' : '❌'}`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkDocIdMismatch();
