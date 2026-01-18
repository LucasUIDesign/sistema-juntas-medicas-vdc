import dotenv from 'dotenv';
import { db } from '../src/lib/prisma';

// Load environment variables
dotenv.config();

async function addHoraColumn() {
  try {
    console.log('Adding hora column to JuntaMedica table...');
    console.log('Database URL:', process.env.TURSO_DATABASE_URL ? 'Configured' : 'Missing');
    
    await db.execute({
      sql: 'ALTER TABLE JuntaMedica ADD COLUMN hora TEXT',
      args: [],
    });
    
    console.log('✅ Column added successfully!');
  } catch (error: any) {
    if (error.message && error.message.includes('duplicate column name')) {
      console.log('⚠️  Column already exists, skipping...');
    } else {
      console.error('❌ Error adding column:', error);
      throw error;
    }
  }
}

addHoraColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
