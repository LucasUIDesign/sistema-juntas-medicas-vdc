import { db } from '../src/lib/prisma';

async function addHoraColumn() {
  try {
    console.log('Adding hora column to JuntaMedica table...');
    
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
