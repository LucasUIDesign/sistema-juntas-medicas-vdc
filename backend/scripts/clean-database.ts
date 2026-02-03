import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza de base de datos...\n');

  try {
    // 1. Eliminar todos los documentos adjuntos
    console.log('📄 Eliminando documentos adjuntos...');
    const docsResult = await db.execute('DELETE FROM DocumentoAdjunto');
    console.log(`   ✅ ${docsResult.rowsAffected} documentos eliminados\n`);

    // 2. Eliminar todos los dictámenes
    console.log('📋 Eliminando dictámenes...');
    const dictamenesResult = await db.execute('DELETE FROM Dictamen');
    console.log(`   ✅ ${dictamenesResult.rowsAffected} dictámenes eliminados\n`);

    // 3. Eliminar todas las juntas médicas
    console.log('🏥 Eliminando juntas médicas...');
    const juntasResult = await db.execute('DELETE FROM JuntaMedica');
    console.log(`   ✅ ${juntasResult.rowsAffected} juntas eliminadas\n`);

    // 4. Eliminar todos los pacientes
    console.log('👤 Eliminando pacientes...');
    const pacientesResult = await db.execute('DELETE FROM Paciente');
    console.log(`   ✅ ${pacientesResult.rowsAffected} pacientes eliminados\n`);

    // 5. Eliminar todos los usuarios
    console.log('👥 Eliminando usuarios...');
    const usersResult = await db.execute('DELETE FROM User');
    console.log(`   ✅ ${usersResult.rowsAffected} usuarios eliminados\n`);

    // 6. Crear usuario admin
    console.log('👨‍💼 Creando usuario administrador...');
    const hashedPassword = await bcrypt.hash('Admin2025!', 10);
    const adminId = crypto.randomUUID();

    await db.execute({
      sql: `INSERT INTO User (id, username, email, password, nombre, apellido, role, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [adminId, 'admin', 'admin@vdc.com', hashedPassword, 'Administrador', 'Sistema', 'ADMIN'],
    });

    console.log('   ✅ Usuario admin creado\n');

    // Resumen final
    console.log('━'.repeat(60));
    console.log('✅ LIMPIEZA COMPLETADA\n');
    console.log('📊 Resumen:');
    console.log(`   • Documentos eliminados: ${docsResult.rowsAffected}`);
    console.log(`   • Dictámenes eliminados: ${dictamenesResult.rowsAffected}`);
    console.log(`   • Juntas eliminadas: ${juntasResult.rowsAffected}`);
    console.log(`   • Pacientes eliminados: ${pacientesResult.rowsAffected}`);
    console.log(`   • Usuarios eliminados: ${usersResult.rowsAffected}`);
    console.log(`   • Usuario admin creado: 1\n`);
    console.log('🔑 Credenciales del administrador:');
    console.log('   Username: admin');
    console.log('   Password: Admin2025!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  }
}

// Ejecutar limpieza
cleanDatabase()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
