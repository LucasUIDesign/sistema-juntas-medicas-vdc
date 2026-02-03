import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addTurnoTable() {
  console.log('🔧 Creando tabla Turno...\n');

  try {
    // Crear tabla Turno
    console.log('📝 Creando tabla Turno...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Turno (
        id TEXT PRIMARY KEY,
        pacienteId TEXT NOT NULL,
        medicoId TEXT NOT NULL,
        fecha TEXT NOT NULL,
        hora TEXT NOT NULL,
        lugar TEXT,
        observaciones TEXT,
        estado TEXT DEFAULT 'PENDIENTE',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pacienteId) REFERENCES Paciente(id) ON DELETE CASCADE,
        FOREIGN KEY (medicoId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✅ Tabla Turno creada\n');

    // Crear índices
    console.log('📝 Creando índices...');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_turno_paciente ON Turno(pacienteId)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_turno_medico ON Turno(medicoId)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_turno_fecha ON Turno(fecha)');
    console.log('   ✅ Índices creados\n');

    console.log('━'.repeat(60));
    console.log('✅ MIGRACIÓN COMPLETADA');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Ejecutar migración
addTurnoTable()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
