const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Start seeding...')

  // ข้อมูลที่จะยัดลงไป
  const stalls = [
    { code: 'A01', zone: 'Food', price: 150 },
    { code: 'A02', zone: 'Food', price: 150 },
    { code: 'A03', zone: 'Food', price: 150 },
    { code: 'B01', zone: 'Fashion', price: 200 },
    { code: 'B02', zone: 'Fashion', price: 200 },
  ]

  for (const s of stalls) {
    try {
      // ใช้ create แทน upsert เพื่อความง่าย (ถ้าซ้ำมันจะ Error ซึ่งเราข้ามได้)
      const stall = await prisma.stall.create({
        data: {
          code: s.code,
          zone: s.zone,
          price: s.price,
          status: 'ACTIVE'
        },
      })
      console.log(`✅ Created stall: ${stall.code}`)
    } catch (e) {
      console.log(`⚠️ Stall ${s.code} already exists (Skipped)`)
    }
  }
  console.log('🎉 Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })