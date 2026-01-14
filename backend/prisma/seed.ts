import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Crear usuario admin por defecto
  const hashedPassword = await bcrypt.hash('Admin2025!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vdc.com' },
    update: {},
    create: {
      email: 'admin@vdc.com',
      password: hashedPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      role: 'ADMIN',
    },
  });

  console.log('Usuario admin creado:', admin.email);
  console.log('Password: Admin2025!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
