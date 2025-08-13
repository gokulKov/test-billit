require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting migration: BILLIT -> SERVICE');

  const subRes = await prisma.subscription.updateMany({
    where: { product: 'BILLIT' },
    data: { product: 'SERVICE' },
  });
  console.log(`✅ Subscriptions updated: ${subRes.count}`);

  const accessRes = await prisma.productAccess.updateMany({
    where: { product: 'BILLIT' },
    data: { product: 'SERVICE' },
  });
  console.log(`✅ ProductAccess updated: ${accessRes.count}`);

  console.log('🎉 Migration complete.');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
