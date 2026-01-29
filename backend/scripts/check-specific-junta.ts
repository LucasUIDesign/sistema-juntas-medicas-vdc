import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const JUNTA_ID = '9c37587c-8f9e-4072-ba98-f3c0f5e6a483'; // ID de la junta "prueba pdf"

async function checkJunta() {
  try {
    console.log('🔍 Verificando junta médica...\n');

    // Obtener junta
    const juntaResult = await db.execute({
      sql: `SELECT j.*, p.nombre, p.apellido 
            FROM JuntaMedica j 
            LEFT JOIN Paciente p ON j.pacienteId = p.id 
            WHERE j.id = ?`,
      args: [JUNTA_ID]
    });

    if (juntaResult.rows.length === 0) {
      console.log('❌ Junta no encontrada');
      return;
    }

    const junta = juntaResult.rows[0] as any;
    console.log('📋 Junta Médica:');
    console.log(`   Paciente: ${junta.nombre} ${junta.apellido}`);
    console.log(`   Estado: ${junta.estado}`);
    console.log(`   Fecha: ${junta.fecha}\n`);

    // Obtener documentos
    const docsResult = await db.execute({
      sql: 'SELECT * FROM DocumentoAdjunto WHERE juntaId = ? ORDER BY createdAt DESC',
      args: [JUNTA_ID]
    });

    if (docsResult.rows.length === 0) {
      console.log('📎 Documentos Adjuntos: ❌ NINGUNO\n');
      console.log('💡 Para subir un documento:');
      console.log('   1. Abre el frontend en http://localhost:5173');
      console.log('   2. Ve a "Mis Juntas"');
      console.log('   3. Haz clic en la junta "prueba pdf"');
      console.log('   4. En "Documentación Adjunta", haz clic en "Subir"');
      console.log('   5. Selecciona un archivo');
      console.log('   6. Ejecuta este script nuevamente para verificar\n');
    } else {
      console.log(`📎 Documentos Adjuntos: ✅ ${docsResult.rows.length} documento(s)\n`);
      
      docsResult.rows.forEach((doc: any, index: number) => {
        console.log(`   ${index + 1}. ${doc.nombre}`);
        console.log(`      📁 Categoría: ${doc.categoria}`);
        console.log(`      📄 Tipo: ${doc.tipo}`);
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

checkJunta();
