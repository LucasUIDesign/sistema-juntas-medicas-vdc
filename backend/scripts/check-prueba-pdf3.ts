import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkPruebaPdf3() {
  try {
    console.log('🔍 Buscando paciente "prueba pdf3"...\n');

    // Buscar paciente
    const pacienteResult = await db.execute({
      sql: `SELECT * FROM Paciente WHERE nombre LIKE ? OR apellido LIKE ?`,
      args: ['%prueba%pdf3%', '%prueba%pdf3%']
    });

    if (pacienteResult.rows.length === 0) {
      console.log('❌ No se encontró el paciente "prueba pdf3"');
      console.log('\n💡 Buscando todos los pacientes con "prueba" en el nombre...\n');
      
      const allPruebaResult = await db.execute({
        sql: `SELECT * FROM Paciente WHERE nombre LIKE ? OR apellido LIKE ? ORDER BY createdAt DESC LIMIT 10`,
        args: ['%prueba%', '%prueba%']
      });

      if (allPruebaResult.rows.length > 0) {
        console.log(`✅ Encontrados ${allPruebaResult.rows.length} paciente(s) de prueba:\n`);
        for (const p of allPruebaResult.rows) {
          const paciente = p as any;
          console.log(`   📋 ${paciente.nombre} ${paciente.apellido}`);
          console.log(`      DNI: ${paciente.numeroDocumento}`);
          console.log(`      ID: ${paciente.id}`);
          console.log(`      Creado: ${paciente.createdAt}\n`);
        }
      }
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
      console.log('❌ No se encontraron juntas médicas para este paciente\n');
      return;
    }

    console.log(`✅ Encontradas ${juntasResult.rows.length} junta(s) médica(s):\n`);

    for (const junta of juntasResult.rows) {
      const j = junta as any;
      console.log(`📋 Junta ID: ${j.id}`);
      console.log(`   Estado: ${j.estado}`);
      console.log(`   Fecha: ${j.fecha}`);
      console.log(`   Diagnóstico: ${j.diagnosticoPrincipal || 'N/A'}`);
      console.log(`   Creada: ${j.createdAt}\n`);

      // Buscar documentos adjuntos
      const documentosResult = await db.execute({
        sql: `SELECT * FROM DocumentoAdjunto WHERE juntaId = ? ORDER BY createdAt DESC`,
        args: [j.id]
      });

      if (documentosResult.rows.length === 0) {
        console.log('   📎 Documentos Adjuntos: ❌ NINGUNO\n');
      } else {
        console.log(`   📎 Documentos Adjuntos: ✅ ${documentosResult.rows.length} documento(s)\n`);
        
        for (const doc of documentosResult.rows) {
          const d = doc as any;
          console.log(`      ✅ ${d.nombre}`);
          console.log(`         📁 Categoría: ${d.categoria}`);
          console.log(`         📄 Tipo: ${d.tipo}`);
          console.log(`         📏 Tamaño: ${(d.size / 1024).toFixed(2)} KB`);
          console.log(`         🔗 URL: ${d.url}`);
          console.log(`         📅 Subido: ${d.createdAt}`);
          console.log(`         🆔 ID: ${d.id}\n`);
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
      
      console.log('   ' + '─'.repeat(60) + '\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

checkPruebaPdf3();
