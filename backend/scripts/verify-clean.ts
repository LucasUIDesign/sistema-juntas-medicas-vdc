import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function verifyClean() {
  console.log('🔍 Verificando estado de la base de datos...\n');

  try {
    // Contar usuarios
    const usersResult = await db.execute('SELECT COUNT(*) as count FROM User');
    const usersCount = (usersResult.rows[0] as any).count;
    console.log(`👥 Usuarios: ${usersCount}`);

    // Listar usuarios
    const usersList = await db.execute('SELECT email, nombre, apellido, role FROM User');
    usersList.rows.forEach((user: any) => {
      console.log(`   • ${user.email} - ${user.nombre} ${user.apellido} (${user.role})`);
    });

    // Contar pacientes
    const pacientesResult = await db.execute('SELECT COUNT(*) as count FROM Paciente');
    const pacientesCount = (pacientesResult.rows[0] as any).count;
    console.log(`\n👤 Pacientes: ${pacientesCount}`);

    // Contar juntas
    const juntasResult = await db.execute('SELECT COUNT(*) as count FROM JuntaMedica');
    const juntasCount = (juntasResult.rows[0] as any).count;
    console.log(`🏥 Juntas Médicas: ${juntasCount}`);

    // Contar dictámenes
    const dictamenesResult = await db.execute('SELECT COUNT(*) as count FROM Dictamen');
    const dictamenesCount = (dictamenesResult.rows[0] as any).count;
    console.log(`📋 Dictámenes: ${dictamenesCount}`);

    // Contar documentos
    const docsResult = await db.execute('SELECT COUNT(*) as count FROM DocumentoAdjunto');
    const docsCount = (docsResult.rows[0] as any).count;
    console.log(`📄 Documentos: ${docsCount}`);

    console.log('\n━'.repeat(60));
    if (usersCount === 1 && pacientesCount === 0 && juntasCount === 0 && dictamenesCount === 0 && docsCount === 0) {
      console.log('✅ Base de datos limpia correctamente');
      console.log('✅ Solo existe el usuario administrador');
    } else {
      console.log('⚠️  Advertencia: La base de datos no está completamente limpia');
    }
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

verifyClean()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
