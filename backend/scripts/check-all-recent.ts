import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkRecentJuntas() {
  try {
    console.log('🔍 Verificando juntas recientes con documentos...\n');

    // Obtener las 5 juntas más recientes
    const juntasResult = await db.execute({
      sql: `SELECT j.*, p.nombre, p.apellido 
            FROM JuntaMedica j 
            LEFT JOIN Paciente p ON j.pacienteId = p.id 
            ORDER BY j.createdAt DESC 
            LIMIT 5`,
      args: []
    });

    if (juntasResult.rows.length === 0) {
      console.log('❌ No hay juntas en el sistema\n');
      return;
    }

    console.log(`📋 Últimas ${juntasResult.rows.length} juntas:\n`);

    for (const junta of juntasResult.rows) {
      const j = junta as any;
      
      console.log(`${'='.repeat(70)}`);
      console.log(`📋 Paciente: ${j.nombre} ${j.apellido}`);
      console.log(`   Junta ID: ${j.id}`);
      console.log(`   Estado: ${j.estado}`);
      console.log(`   Creada: ${j.createdAt}`);

      // Buscar documentos
      const docsResult = await db.execute({
        sql: `SELECT * FROM DocumentoAdjunto WHERE juntaId = ? ORDER BY createdAt DESC`,
        args: [j.id]
      });

      if (docsResult.rows.length === 0) {
        console.log(`   📎 Documentos: ❌ NINGUNO\n`);
      } else {
        console.log(`   📎 Documentos: ✅ ${docsResult.rows.length}\n`);
        docsResult.rows.forEach((doc: any, index: number) => {
          console.log(`      ${index + 1}. ${doc.nombre}`);
          console.log(`         📁 ${doc.categoria}`);
          console.log(`         📏 ${(doc.size / 1024).toFixed(2)} KB`);
          console.log(`         📅 ${doc.createdAt}\n`);
        });
      }
    }

    console.log(`${'='.repeat(70)}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkRecentJuntas();
