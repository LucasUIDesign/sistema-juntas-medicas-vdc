import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkUserSchema() {
  console.log('🔍 Verificando schema de la tabla User...\n');

  try {
    // Obtener información del schema
    const schema = await db.execute("PRAGMA table_info(User)");
    
    console.log('📋 Columnas de la tabla User:');
    console.log('━'.repeat(60));
    schema.rows.forEach((col: any) => {
      console.log(`   ${col.name} (${col.type}) - ${col.notnull ? 'NOT NULL' : 'NULL'} - ${col.dflt_value || 'No default'}`);
    });
    console.log('━'.repeat(60));

    // Obtener usuarios actuales
    const users = await db.execute('SELECT id, username, email, nombre, apellido, role FROM User');
    
    console.log('\n👥 Usuarios en la base de datos:');
    console.log('━'.repeat(60));
    if (users.rows.length === 0) {
      console.log('   No hay usuarios');
    } else {
      users.rows.forEach((user: any) => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username || 'NULL'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nombre: ${user.nombre} ${user.apellido || ''}`);
        console.log(`   Role: ${user.role}`);
        console.log('   ' + '─'.repeat(58));
      });
    }
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Ejecutar verificación
checkUserSchema()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
