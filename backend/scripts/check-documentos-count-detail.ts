import { db } from '../src/lib/prisma';

async function checkDocumentosCountDetail() {
  console.log('🔍 Verificando conteo detallado de documentos...\n');

  try {
    // Obtener las últimas 5 juntas con estado COMPLETADA
    const result = await db.execute({
      sql: `
        SELECT
          j.id,
          j.estado,
          j.fecha,
          p.nombre || ' ' || p.apellido as pacienteNombre,
          (SELECT COUNT(DISTINCT categoria) FROM DocumentoAdjunto WHERE juntaId = j.id) as documentosCount
        FROM JuntaMedica j
        LEFT JOIN Paciente p ON j.pacienteId = p.id
        WHERE j.estado = 'COMPLETADA'
        ORDER BY j.createdAt DESC
        LIMIT 5
      `,
      args: [],
    });

    console.log(`📊 Encontradas ${result.rows.length} juntas COMPLETADAS:\n`);

    for (const row of result.rows) {
      const junta = row as any;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`ID: ${junta.id}`);
      console.log(`Paciente: ${junta.pacienteNombre}`);
      console.log(`Fecha: ${junta.fecha}`);
      console.log(`Estado: ${junta.estado}`);
      console.log(`Documentos totales: ${junta.documentosCount}`);
      
      // Obtener detalle de documentos
      const docs = await db.execute({
        sql: 'SELECT id, nombre, categoria, createdAt FROM DocumentoAdjunto WHERE juntaId = ? ORDER BY createdAt DESC',
        args: [junta.id],
      });

      console.log(`\nDocumentos adjuntos (${docs.rows.length}):`);
      for (const doc of docs.rows) {
        const d = doc as any;
        console.log(`  - ${d.categoria}: ${d.nombre}`);
      }

      // Verificar categorías únicas
      const categorias = new Set(docs.rows.map((d: any) => d.categoria));
      console.log(`\nCategorías únicas: ${categorias.size}`);
      console.log(`Categorías: ${Array.from(categorias).join(', ')}`);
      
      // Verificar si está completa
      const todosDocumentosCargados = junta.documentosCount === 10;
      const estadoReal = junta.estado === 'COMPLETADA' && !todosDocumentosCargados 
        ? 'INCOMPLETA' 
        : junta.estado;
      
      console.log(`\n✅ Estado a mostrar: ${estadoReal}`);
      console.log(`   Razón: ${todosDocumentosCargados ? 'Todos los documentos cargados (10/10)' : `Faltan documentos (${junta.documentosCount}/10)`}`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDocumentosCountDetail();
