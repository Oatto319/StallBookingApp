import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create zones/stalls
  const stalls = [
    { code: 'A01', zone: 'Fashion', price: 500 },
    { code: 'A02', zone: 'Fashion', price: 500 },
    { code: 'A03', zone: 'Fashion', price: 500 },
    { code: 'B01', zone: 'Food', price: 800 },
    { code: 'B02', zone: 'Food', price: 800 },
    { code: 'B03', zone: 'Food', price: 800 },
    { code: 'C01', zone: 'Electronics', price: 1000 },
    { code: 'C02', zone: 'Electronics', price: 1000 },
  ];

  for (const stall of stalls) {
    const existing = await prisma.stall.findUnique({
      where: { code: stall.code },
    });

    if (!existing) {
      await prisma.stall.create({
        data: {
          code: stall.code,
          zone: stall.zone,
          price: stall.price,
          status: 'ACTIVE',
        },
      });
      console.log(`✅ Created stall: ${stall.code}`);
    }
  }

  console.log('✨ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
