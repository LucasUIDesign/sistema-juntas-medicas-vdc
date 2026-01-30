import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkMedicosEvaluadores() {
  console.log('🔍 Verificando datos de médicos evaluadores...\n');

  try {
    // Obtener las últimas 5 juntas con dictamen
    const result = await db.execute({
      sql: `
        SELECT 
          j.id as juntaId,
          j.estado,
          j.createdAt as juntaCreatedAt,
          d.datosCompletos,
          d.createdAt as dictamenCreatedAt
        FROM JuntaMedica j
        LEFT JOIN Dictamen d ON j.id = d.juntaId
        WHERE d.datosCompletos IS NOT NULL
        ORDER BY j.createdAt DESC
        LIMIT 5
      `,
      args: [],
    });

    if (result.rows.length === 0) {
      console.log('❌ No se encontraron juntas con dictamen');
      return;
    }

    console.log(`✅ Encontradas ${result.rows.length} juntas con dictamen\n`);

    for (const row of result.rows) {
      const juntaId = row.juntaId as string;
      const estado = row.estado as string;
      const datosCompletos = row.datosCompletos as string;

      console.log('━'.repeat(80));
      console.log(`📋 Junta ID: ${juntaId}`);
      console.log(`   Estado: ${estado}`);
      console.log(`   Creada: ${row.juntaCreatedAt}`);
      console.log(`   Dictamen creado: ${row.dictamenCreatedAt}`);

      try {
        const dictamen = JSON.parse(datosCompletos);

        // Verificar medicosEvaluadores
        if (dictamen.medicosEvaluadores) {
          console.log(`\n   ✅ Campo medicosEvaluadores existe`);
          console.log(`   Tipo: ${Array.isArray(dictamen.medicosEvaluadores) ? 'Array' : typeof dictamen.medicosEvaluadores}`);
          console.log(`   Cantidad: ${Array.isArray(dictamen.medicosEvaluadores) ? dictamen.medicosEvaluadores.length : 'N/A'}`);

          if (Array.isArray(dictamen.medicosEvaluadores)) {
            dictamen.medicosEvaluadores.forEach((medico: any, index: number) => {
              console.log(`\n   👨‍⚕️ Médico ${index + 1}:`);
              console.log(`      Nombre: "${medico.nombre || '(vacío)'}"`);
              console.log(`      Matrícula: "${medico.matricula || '(vacío)'}"`);
              console.log(`      Especialidad: "${medico.especialidad || '(vacío)'}"`);
              
              // Verificar si tiene al menos un campo lleno
              const tieneAlgunCampo = 
                (medico.nombre && medico.nombre.trim()) ||
                (medico.matricula && medico.matricula.trim()) ||
                (medico.especialidad && medico.especialidad.trim());
              
              console.log(`      ¿Tiene datos? ${tieneAlgunCampo ? '✅ SÍ' : '❌ NO'}`);
            });
          }
        } else {
          console.log(`\n   ❌ Campo medicosEvaluadores NO existe`);
        }

        // Verificar fechaDictamen
        if (dictamen.fechaDictamen) {
          console.log(`\n   📅 Fecha Dictamen: ${dictamen.fechaDictamen}`);
        } else {
          console.log(`\n   ❌ Fecha Dictamen NO existe`);
        }

        // Verificar formato antiguo
        if (dictamen.medicoEvaluador1 || dictamen.medicoEvaluador2) {
          console.log(`\n   ⚠️  Formato antiguo detectado:`);
          if (dictamen.medicoEvaluador1) {
            console.log(`      Médico 1: ${dictamen.medicoEvaluador1}`);
          }
          if (dictamen.medicoEvaluador2) {
            console.log(`      Médico 2: ${dictamen.medicoEvaluador2}`);
          }
        }

      } catch (error) {
        console.log(`\n   ❌ Error parseando JSON: ${error}`);
      }

      console.log('');
    }

    console.log('━'.repeat(80));
    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMedicosEvaluadores();
