import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addUsernameColumn() {
  console.log('🔧 Agregando columna username a la tabla User...\n');

  try {
    // 1. Agregar columna username (nullable temporalmente)
    console.log('📝 Agregando columna username...');
    await db.execute('ALTER TABLE User ADD COLUMN username TEXT');
    console.log('   ✅ Columna username agregada\n');

    // 2. Actualizar usuarios existentes con username basado en email
    console.log('📝 Actualizando usuarios existentes...');
    const users = await db.execute('SELECT id, email FROM User');
    
    for (const user of users.rows) {
      const username = (user.email as string).split('@')[0];
      await db.execute({
        sql: 'UPDATE User SET username = ? WHERE id = ?',
        args: [username, user.id],
      });
    }
    console.log(`   ✅ ${users.rows.length} usuarios actualizados\n`);

    // 3. Crear índice único en username
    console.log('📝 Creando índice único en username...');
    await db.execute('CREATE UNIQUE INDEX idx_user_username ON User(username)');
    console.log('   ✅ Índice creado\n');

    console.log('━'.repeat(60));
    console.log('✅ MIGRACIÓN COMPLETADA');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Ejecutar migración
addUsernameColumn()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
