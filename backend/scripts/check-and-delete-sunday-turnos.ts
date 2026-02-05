import { db } from '../src/lib/prisma';

async function checkAndDeleteSundayTurnos() {
  try {
    console.log('🔍 Verificando turnos del domingo 8 de febrero de 2026...');

    // Buscar turnos del domingo 8 de febrero de 2026
    const result = await db.execute({
      sql: `SELECT * FROM Turno WHERE DATE(fecha) = '2026-02-08'`,
      args: [],
    });

    console.log(`📋 Turnos encontrados: ${result.rows.length}`);

    if (result.rows.length > 0) {
      console.log('Turnos del domingo 8 de febrero:');
      result.rows.forEach((turno: any) => {
        console.log(`  - ID: ${turno.id}, Fecha: ${turno.fecha}, Hora: ${turno.hora}, Paciente: ${turno.pacienteNombre}`);
      });

      // Eliminar turnos del domingo 8
      const deleteResult = await db.execute({
        sql: `DELETE FROM Turno WHERE DATE(fecha) = '2026-02-08'`,
        args: [],
      });

      console.log(`✅ ${result.rows.length} turno(s) eliminado(s) del domingo 8 de febrero`);
    } else {
      console.log('✅ No hay turnos en el domingo 8 de febrero');
    }

    // Verificar todos los turnos en fines de semana
    console.log('\n🔍 Verificando todos los turnos en fines de semana...');
    const weekendResult = await db.execute({
      sql: `SELECT * FROM Turno WHERE CAST(strftime('%w', fecha) AS INTEGER) IN (0, 6)`,
      args: [],
    });

    console.log(`📋 Turnos en fines de semana encontrados: ${weekendResult.rows.length}`);

    if (weekendResult.rows.length > 0) {
      console.log('Turnos en fines de semana:');
      weekendResult.rows.forEach((turno: any) => {
        const fecha = new Date(turno.fecha);
        const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fecha.getDay()];
        console.log(`  - ${dayName} ${fecha.toLocaleDateString('es-ES')}, Hora: ${turno.hora}, Paciente: ${turno.pacienteNombre}`);
      });

      // Eliminar todos los turnos de fines de semana
      await db.execute({
        sql: `DELETE FROM Turno WHERE CAST(strftime('%w', fecha) AS INTEGER) IN (0, 6)`,
        args: [],
      });

      console.log(`✅ ${weekendResult.rows.length} turno(s) de fines de semana eliminado(s)`);
    } else {
      console.log('✅ No hay turnos en fines de semana');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndDeleteSundayTurnos();
