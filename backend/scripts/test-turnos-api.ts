import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function testTurnosAPI() {
  console.log('🔍 Verificando turnos en la base de datos...\n');

  try {
    // Verificar si la tabla Turno existe
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Turno'");
    
    if (tables.rows.length === 0) {
      console.log('❌ La tabla Turno no existe');
      return;
    }
    
    console.log('✅ La tabla Turno existe\n');

    // Obtener todos los turnos
    const turnos = await db.execute('SELECT * FROM Turno');
    
    console.log(`📋 Total de turnos: ${turnos.rows.length}\n`);
    
    if (turnos.rows.length > 0) {
      console.log('Turnos encontrados:');
      console.log('━'.repeat(80));
      turnos.rows.forEach((turno: any) => {
        console.log(`ID: ${turno.id}`);
        console.log(`Paciente ID: ${turno.pacienteId}`);
        console.log(`Médico ID: ${turno.medicoId}`);
        console.log(`Fecha: ${turno.fecha}`);
        console.log(`Hora: ${turno.hora}`);
        console.log(`Estado: ${turno.estado}`);
        console.log(`Lugar: ${turno.lugar || 'N/A'}`);
        console.log('─'.repeat(80));
      });
    } else {
      console.log('No hay turnos registrados');
    }

    // Verificar usuarios médicos
    console.log('\n👨‍⚕️ Usuarios con rol MEDICO_EVALUADOR:');
    console.log('━'.repeat(80));
    const medicos = await db.execute("SELECT id, username, nombre, apellido, role FROM User WHERE role = 'MEDICO_EVALUADOR'");
    
    if (medicos.rows.length > 0) {
      medicos.rows.forEach((medico: any) => {
        console.log(`ID: ${medico.id}`);
        console.log(`Username: ${medico.username}`);
        console.log(`Nombre: ${medico.nombre} ${medico.apellido}`);
        console.log('─'.repeat(80));
      });
    } else {
      console.log('No hay médicos evaluadores registrados');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Ejecutar test
testTurnosAPI()
  .then(() => {
    console.log('\n✅ Test completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
