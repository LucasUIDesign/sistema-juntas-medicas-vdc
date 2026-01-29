import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkJuntaDocuments() {
  try {
    console.log('🔍 Buscando junta médica con paciente "prueba pdf"...\n');

    // Buscar paciente
    const pacienteResult = await db.execute({
      sql: `SELECT * FROM Paciente WHERE nombre LIKE ? OR apellido LIKE ?`,
      args: ['%prueba%', '%pdf%']
    });

    if (pacienteResult.rows.length === 0) {
      console.log('❌ No se encontró ningún paciente con nombre "prueba pdf"');
      return;
    }

    console.log('✅ Paciente encontrado:');
    const paciente = pacienteResult.rows[0] as any;
    console.log(`   ID: ${paciente.id}`);
    console.log(`   Nombre: ${paciente.nombre} ${paciente.apellido}`);
    console.log(`   DNI: ${paciente.numeroDocumento}\n`);

    // Buscar juntas de este paciente
    const juntasResult = await db.execute({
      sql: `SELECT * FROM JuntaMedica WHERE pacienteId = ?`,
      args: [paciente.id]
    });

    if (juntasResult.rows.length === 0) {
      console.log('❌ No se encontraron juntas médicas para este paciente');
      return;
    }

    console.log(`✅ Se encontraron ${juntasResult.rows.length} junta(s) médica(s):\n`);

    for (const junta of juntasResult.rows) {
      const j = junta as any;
      console.log(`📋 Junta ID: ${j.id}`);
      console.log(`   Estado: ${j.estado}`);
      console.log(`   Fecha: ${j.fecha}`);
      console.log(`   Diagnóstico: ${j.diagnosticoPrincipal || 'N/A'}`);
      console.log(`   Aptitud: ${j.aptitudLaboral || 'N/A'}\n`);

      // Buscar documentos adjuntos
      const documentosResult = await db.execute({
        sql: `SELECT * FROM DocumentoAdjunto WHERE juntaId = ?`,
        args: [j.id]
      });

      if (documentosResult.rows.length === 0) {
        console.log('   ⚠️  No hay documentos adjuntos guardados\n');
      } else {
        console.log(`   📎 Documentos adjuntos (${documentosResult.rows.length}):`);
        for (const doc of documentosResult.rows) {
          const d = doc as any;
          console.log(`      - ${d.nombre}`);
          console.log(`        Categoría: ${d.categoria}`);
          console.log(`        Tipo: ${d.tipo}`);
          console.log(`        URL: ${d.url}`);
          console.log(`        Tamaño: ${d.size} bytes`);
          console.log(`        Creado: ${d.createdAt}\n`);
        }
      }

      // Buscar dictamen
      const dictamenResult = await db.execute({
        sql: `SELECT * FROM Dictamen WHERE juntaId = ?`,
        args: [j.id]
      });

      if (dictamenResult.rows.length > 0) {
        console.log('   📄 Dictamen: ✅ Guardado\n');
      } else {
        console.log('   📄 Dictamen: ❌ No guardado\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkJuntaDocuments();
