// Script para verificar turnos del domingo 8 de febrero usando la API
const API_URL = 'http://localhost:3001/api';

async function checkSundayTurnos() {
  try {
    console.log('🔍 Verificando turnos del domingo 8 de febrero de 2026...\n');

    // Obtener token de admin (necesitas estar logueado)
    const token = process.env.ADMIN_TOKEN || '';
    
    if (!token) {
      console.log('⚠️  No se proporcionó token de admin');
      console.log('Por favor, ejecuta este comando con el token:');
      console.log('ADMIN_TOKEN=tu_token_aqui npx ts-node scripts/check-sunday-turnos-api.ts');
      return;
    }

    const response = await fetch(`${API_URL}/turnos`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log('❌ Error al obtener turnos:', response.status);
      return;
    }

    const turnos = await response.json();
    console.log(`📋 Total de turnos: ${turnos.length}\n`);

    // Filtrar turnos del domingo 8 de febrero de 2026
    const sundayTurnos = turnos.filter((turno: any) => {
      const fecha = new Date(turno.fecha);
      return fecha.getDate() === 8 && 
             fecha.getMonth() === 1 && // Febrero es mes 1 (0-indexed)
             fecha.getFullYear() === 2026 &&
             fecha.getDay() === 0; // Domingo
    });

    console.log(`🔴 Turnos del domingo 8 de febrero: ${sundayTurnos.length}`);
    
    if (sundayTurnos.length > 0) {
      console.log('\nDetalles:');
      sundayTurnos.forEach((turno: any) => {
        console.log(`  - ID: ${turno.id}`);
        console.log(`    Fecha: ${new Date(turno.fecha).toLocaleDateString('es-ES')}`);
        console.log(`    Hora: ${turno.hora}`);
        console.log(`    Paciente: ${turno.pacienteNombre}`);
        console.log(`    Médico: ${turno.medicoNombre || 'No asignado'}`);
        console.log('');
      });

      console.log('\n⚠️  Para eliminar estos turnos, usa el endpoint DELETE /api/turnos/:id');
      console.log('O ejecuta este comando para cada ID:');
      sundayTurnos.forEach((turno: any) => {
        console.log(`curl -X DELETE ${API_URL}/turnos/${turno.id} -H "Authorization: Bearer ${token}"`);
      });
    } else {
      console.log('✅ No hay turnos en el domingo 8 de febrero');
    }

    // Verificar todos los fines de semana
    console.log('\n\n🔍 Verificando todos los turnos en fines de semana...\n');
    const weekendTurnos = turnos.filter((turno: any) => {
      const fecha = new Date(turno.fecha);
      const day = fecha.getDay();
      return day === 0 || day === 6; // Domingo o Sábado
    });

    console.log(`🔴 Total de turnos en fines de semana: ${weekendTurnos.length}`);
    
    if (weekendTurnos.length > 0) {
      console.log('\nDetalles:');
      weekendTurnos.forEach((turno: any) => {
        const fecha = new Date(turno.fecha);
        const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fecha.getDay()];
        console.log(`  - ${dayName} ${fecha.toLocaleDateString('es-ES')}, ${turno.hora}, ${turno.pacienteNombre}`);
      });
    } else {
      console.log('✅ No hay turnos en fines de semana');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSundayTurnos();
