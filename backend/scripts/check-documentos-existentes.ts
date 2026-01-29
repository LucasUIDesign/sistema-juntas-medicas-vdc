import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkDocumentosExistentes() {
  try {
    console.log('🔍 Verificando documentos existentes...\n');

    const result = await db.execute({
      sql: `SELECT id, juntaId, nombre, url, 
            CASE WHEN contenido IS NULL THEN 'NO' ELSE 'SI' END as tieneContenido,
            LENGTH(contenido) as contenidoSize
            FROM DocumentoAdjunto 
            ORDER BY createdAt DESC 
            LIMIT 10`,
      args: []
    });

    console.log(`📋 Últimos ${result.rows.length} documentos:\n`);
    
    result.rows.forEach((doc: any, index: number) => {
      console.log(`${index + 1}. ${doc.nombre}`);
      console.log(`   URL: ${doc.url}`);
      console.log(`   Tiene contenido: ${doc.tieneContenido}`);
      if (doc.tieneContenido === 'SI') {
        console.log(`   Tamaño contenido: ${(doc.contenidoSize / 1024).toFixed(2)} KB`);
      }
      console.log();
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkDocumentosExistentes();
