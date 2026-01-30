import { db } from '../src/lib/prisma';

async function verifyDocumentosCount() {
  console.log('🔍 Verificando conteo de documentos...\n');

  try {
    // Obtener todas las juntas con el conteo de documentos
    const result = await db.execute({
      sql: `
        SELECT
          j.id,
          j.estado,
          p.nombre || ' ' || p.apellido as pacienteNombre,
          (SELECT COUNT(*) FROM DocumentoAdjunto WHERE juntaId = j.id) as documentosCount
        FROM JuntaMedica j
        LEFT JOIN Paciente p ON j.pacienteId = p.id
        ORDER BY j.createdAt DESC
        LIMIT 10
      `,
      args: [],
    });

    console.log(`📊 Encontradas ${result.rows.length} juntas médicas:\n`);

    for (const row of result.rows) {
      const junta = row as any;
      console.log(`ID: ${junta.id}`);
      console.log(`Paciente: ${junta.pacienteNombre}`);
      console.log(`Estado: ${junta.estado}`);
      console.log(`Documentos cargados: ${junta.documentosCount}/10`);
      
      // Verificar si está completa
      const todosDocumentosCargados = junta.documentosCount === 10;
      const estadoReal = junta.estado === 'COMPLETADA' && !todosDocumentosCargados 
        ? 'INCOMPLETA' 
        : junta.estado;
      
      console.log(`Estado real a mostrar: ${estadoReal}`);
      console.log('---');
    }

    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyDocumentosCount();
