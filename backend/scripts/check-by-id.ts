import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const PACIENTE_ID = '3111c90a-86b7-493a-a99a-31f6b1a32165'; // ID de prueba pdf3

async function checkDocuments() {
  try {
    console.log('🔍 Verificando documentos para prueba pdf3...\n');

    // Buscar juntas
    const juntasResult = await db.execute({
      sql: `SELECT * FROM JuntaMedica WHERE pacienteId = ? ORDER BY createdAt DESC`,
      args: [PACIENTE_ID]
    });

    if (juntasResult.rows.length === 0) {
      console.log('❌ No hay juntas para este paciente\n');
      return;
    }

    console.log(`✅ Encontradas ${juntasResult.rows.length} junta(s):\n`);

    for (const junta of juntasResult.rows) {
      const j = junta as any;
      console.log(`📋 Junta: ${j.id}`);
      console.log(`   Estado: ${j.estado}`);
      console.log(`   Creada: ${j.createdAt}\n`);

      // Buscar documentos
      const docsResult = await db.execute({
        sql: `SELECT * FROM DocumentoAdjunto WHERE juntaId = ?`,
        args: [j.id]
      });

      if (docsResult.rows.length === 0) {
        console.log('   ❌ SIN DOCUMENTOS\n');
      } else {
        console.log(`   ✅ ${docsResult.rows.length} DOCUMENTO(S):\n`);
        docsResult.rows.forEach((doc: any) => {
          console.log(`      📄 ${doc.nombre}`);
          console.log(`         Categoría: ${doc.categoria}`);
          console.log(`         Tamaño: ${(doc.size / 1024).toFixed(2)} KB`);
          console.log(`         URL: ${doc.url}\n`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkDocuments();
