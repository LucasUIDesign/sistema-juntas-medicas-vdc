import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { randomUUID } from 'crypto';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const JUNTA_ID = '291f5347-e609-44b0-8baa-6de9d1ebbd91'; // prueba4

async function testInsertDocumento() {
  try {
    console.log('🧪 Probando INSERT de documento...\n');

    // Generar datos de prueba
    const docId = randomUUID();
    const nombre = 'TEST_DOCUMENTO_' + Date.now() + '.pdf';
    const tipo = 'application/pdf';
    const url = 'https://example.com/test.pdf';
    const categoria = 'TEST_CATEGORIA';
    const size = 12345;

    console.log('📝 Datos a insertar:');
    console.log(`   ID: ${docId}`);
    console.log(`   Nombre: ${nombre}`);
    console.log(`   Categoría: ${categoria}`);
    console.log(`   Tamaño: ${size}\n`);

    // Intentar INSERT usando @libsql/client
    console.log('🔄 Ejecutando INSERT con @libsql/client...');
    const insertResult = await db.execute({
      sql: `INSERT INTO DocumentoAdjunto (id, juntaId, nombre, tipo, url, categoria, size, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [docId, JUNTA_ID, nombre, tipo, url, categoria, size],
    });

    console.log('✅ INSERT ejecutado');
    console.log('   Resultado:', insertResult);
    console.log('   Rows affected:', insertResult.rowsAffected);
    console.log();

    // Verificar que se guardó
    console.log('🔍 Verificando documento en BD...');
    const checkResult = await db.execute({
      sql: `SELECT * FROM DocumentoAdjunto WHERE id = ?`,
      args: [docId]
    });

    if (checkResult.rows.length > 0) {
      console.log('✅✅✅ DOCUMENTO ENCONTRADO! ✅✅✅');
      console.log('   Documento:', checkResult.rows[0]);
    } else {
      console.log('❌ DOCUMENTO NO ENCONTRADO');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

testInsertDocumento();
