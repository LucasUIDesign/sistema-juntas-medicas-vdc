import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const JUNTA_ID = '291f5347-e609-44b0-8baa-6de9d1ebbd91'; // prueba4

async function checkPrueba4() {
  try {
    console.log('🔍 Verificando junta de prueba4...\n');

    const juntaResult = await db.execute({
      sql: `SELECT j.*, p.nombre, p.apellido 
            FROM JuntaMedica j 
            LEFT JOIN Paciente p ON j.pacienteId = p.id 
            WHERE j.id = ?`,
      args: [JUNTA_ID]
    });

    if (juntaResult.rows.length === 0) {
      console.log('❌ Junta no encontrada\n');
      return;
    }

    const junta = juntaResult.rows[0] as any;
    console.log('📋 Junta encontrada:');
    console.log(`   Paciente: ${junta.nombre} ${junta.apellido}`);
    console.log(`   Estado: ${junta.estado}`);
    console.log(`   Creada: ${junta.createdAt}\n`);

    // Buscar documentos
    const docsResult = await db.execute({
      sql: `SELECT * FROM DocumentoAdjunto WHERE juntaId = ? ORDER BY createdAt DESC`,
      args: [JUNTA_ID]
    });

    if (docsResult.rows.length === 0) {
      console.log('❌ SIN DOCUMENTOS\n');
    } else {
      console.log(`✅✅✅ ${docsResult.rows.length} DOCUMENTO(S) GUARDADO(S)! ✅✅✅\n`);
      docsResult.rows.forEach((doc: any, index: number) => {
        console.log(`   ${index + 1}. 📄 ${doc.nombre}`);
        console.log(`      📁 Categoría: ${doc.categoria}`);
        console.log(`      📏 Tamaño: ${(doc.size / 1024).toFixed(2)} KB`);
        console.log(`      🔗 URL: ${doc.url}`);
        console.log(`      📅 Subido: ${doc.createdAt}`);
        console.log(`      🆔 ID: ${doc.id}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkPrueba4();
