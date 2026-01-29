import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkNewulti() {
  try {
    console.log('🔍 Buscando paciente "prueba newulti"...\n');

    // Buscar paciente
    const pacienteResult = await db.execute({
      sql: `SELECT * FROM Paciente WHERE nombre LIKE ? OR apellido LIKE ?`,
      args: ['%newulti%', '%newulti%']
    });

    if (pacienteResult.rows.length === 0) {
      console.log('❌ No se encontró el paciente "prueba newulti"\n');
      return;
    }

    const paciente = pacienteResult.rows[0] as any;
    console.log('✅ Paciente encontrado:');
    console.log(`   Nombre: ${paciente.nombre} ${paciente.apellido}`);
    console.log(`   DNI: ${paciente.numeroDocumento}`);
    console.log(`   ID: ${paciente.id}\n`);

    // Buscar juntas
    const juntasResult = await db.execute({
      sql: `SELECT * FROM JuntaMedica WHERE pacienteId = ? ORDER BY createdAt DESC`,
      args: [paciente.id]
    });

    if (juntasResult.rows.length === 0) {
      console.log('❌ No hay juntas para este paciente\n');
      return;
    }

    console.log(`✅ Encontradas ${juntasResult.rows.length} junta(s):\n`);

    for (const junta of juntasResult.rows) {
      const j = junta as any;
      console.log(`📋 Junta ID: ${j.id}`);
      console.log(`   Estado: ${j.estado}`);
      console.log(`   Creada: ${j.createdAt}\n`);

      // Buscar documentos
      const docsResult = await db.execute({
        sql: `SELECT * FROM DocumentoAdjunto WHERE juntaId = ? ORDER BY createdAt DESC`,
        args: [j.id]
      });

      if (docsResult.rows.length === 0) {
        console.log('   ❌ SIN DOCUMENTOS\n');
      } else {
        console.log(`   ✅✅✅ ${docsResult.rows.length} DOCUMENTO(S) GUARDADO(S)! ✅✅✅\n`);
        docsResult.rows.forEach((doc: any, index: number) => {
          console.log(`      ${index + 1}. 📄 ${doc.nombre}`);
          console.log(`         📁 Categoría: ${doc.categoria}`);
          console.log(`         📄 Tipo: ${doc.tipo}`);
          console.log(`         📏 Tamaño: ${(doc.size / 1024).toFixed(2)} KB`);
          console.log(`         🔗 URL: ${doc.url}`);
          console.log(`         📅 Subido: ${doc.createdAt}`);
          console.log(`         🆔 ID: ${doc.id}\n`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkNewulti();
