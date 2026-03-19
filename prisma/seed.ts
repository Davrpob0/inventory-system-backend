import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({
    connectionString,
  });

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
  });

  const adminPasswordHash = await bcrypt.hash('Admin123*', 10);
  const operator1PasswordHash = await bcrypt.hash('Operator123*', 10);
  const operator2PasswordHash = await bcrypt.hash('Operator456*', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
      fullName: 'Admin Test',
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'admin@test.com',
      fullName: 'Admin Test',
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash: adminPasswordHash,
    },
  });

  const operator1 = await prisma.user.upsert({
    where: { email: 'operator1@test.com' },
    update: {
      fullName: 'Operator One',
      role: UserRole.OPERATOR,
      isActive: true,
      passwordHash: operator1PasswordHash,
    },
    create: {
      email: 'operator1@test.com',
      fullName: 'Operator One',
      role: UserRole.OPERATOR,
      isActive: true,
      passwordHash: operator1PasswordHash,
    },
  });

  const operator2 = await prisma.user.upsert({
    where: { email: 'operator2@test.com' },
    update: {
      fullName: 'Operator Two',
      role: UserRole.OPERATOR,
      isActive: true,
      passwordHash: operator2PasswordHash,
    },
    create: {
      email: 'operator2@test.com',
      fullName: 'Operator Two',
      role: UserRole.OPERATOR,
      isActive: true,
      passwordHash: operator2PasswordHash,
    },
  });

  const warehouse1 = await prisma.warehouse.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {
      name: 'Bodega Central',
      location: 'Medellín, Antioquia',
      maxCapacityUnits: 5000,
      isActive: true,
    },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Bodega Central',
      location: 'Medellín, Antioquia',
      maxCapacityUnits: 5000,
      isActive: true,
    },
  });

  const warehouse2 = await prisma.warehouse.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {
      name: 'Bodega Norte',
      location: 'Bello, Antioquia',
      maxCapacityUnits: 2500,
      isActive: true,
    },
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Bodega Norte',
      location: 'Bello, Antioquia',
      maxCapacityUnits: 2500,
      isActive: true,
    },
  });

  await prisma.warehouseOperator.upsert({
    where: { userId: operator1.id },
    update: {
      warehouseId: warehouse1.id,
    },
    create: {
      userId: operator1.id,
      warehouseId: warehouse1.id,
    },
  });

  await prisma.warehouseOperator.upsert({
    where: { userId: operator2.id },
    update: {
      warehouseId: warehouse2.id,
    },
    create: {
      userId: operator2.id,
      warehouseId: warehouse2.id,
    },
  });

  const products = [
    {
      sku: 'SKU1001',
      name: 'Teclado Mecánico',
      description: 'Teclado mecánico RGB',
      unitOfMeasure: 'unit',
      minStockAlert: 10,
    },
    {
      sku: 'SKU1002',
      name: 'Mouse Inalámbrico',
      description: 'Mouse ergonómico',
      unitOfMeasure: 'unit',
      minStockAlert: 15,
    },
    {
      sku: 'SKU1003',
      name: 'Monitor 24',
      description: 'Monitor LED 24 pulgadas',
      unitOfMeasure: 'unit',
      minStockAlert: 5,
    },
    {
      sku: 'SKU1004',
      name: 'Base Refrigerante',
      description: 'Base para portátil',
      unitOfMeasure: 'unit',
      minStockAlert: 8,
    },
    {
      sku: 'SKU1005',
      name: 'Diadema USB',
      description: 'Diadema con micrófono',
      unitOfMeasure: 'unit',
      minStockAlert: 12,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        description: product.description,
        unitOfMeasure: product.unitOfMeasure,
        minStockAlert: product.minStockAlert,
        isActive: true,
      },
      create: {
        sku: product.sku,
        name: product.name,
        description: product.description,
        unitOfMeasure: product.unitOfMeasure,
        minStockAlert: product.minStockAlert,
        isActive: true,
      },
    });
  }

  console.log('Seed completed successfully');
  console.log({
    admin: admin.email,
    operators: [operator1.email, operator2.email],
    warehouses: [warehouse1.name, warehouse2.name],
    productsSeeded: products.length,
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
