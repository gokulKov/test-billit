// Seed MySQL Plan table with entries mapped to Mongo plans/categories
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Plans to upsert
  const plans = [
    // Service
    { name: 'Basic', price: 0, duration: 'MONTHLY', branchLimit: 1, mongoPlanId: 'service-basic', mongoCategoryId: 'Service' },
    { name: 'Gold', price: 399, duration: 'MONTHLY', branchLimit: 1, mongoPlanId: 'service-gold', mongoCategoryId: 'Service' },
    { name: 'Premium', price: 499, duration: 'MONTHLY', branchLimit: 1, mongoPlanId: 'service-premium', mongoCategoryId: 'Service' },
    // Sales (demo)
    { name: 'Sales Basic', price: 0, duration: 'MONTHLY', branchLimit: 1, mongoPlanId: 'sales-basic', mongoCategoryId: 'Sales' },
    { name: 'Sales Gold', price: 299, duration: 'MONTHLY', branchLimit: 1, mongoPlanId: 'sales-gold', mongoCategoryId: 'Sales' },
    { name: 'Sales Premium', price: 399, duration: 'MONTHLY', branchLimit: 1, mongoPlanId: 'sales-premium', mongoCategoryId: 'Sales' },
    // Enterprise (demo)
    { name: 'Enterprise Basic', price: 0, duration: 'MONTHLY', branchLimit: 2, mongoPlanId: 'enterprise-basic', mongoCategoryId: 'Enterprise' },
    { name: 'Enterprise Gold', price: 999, duration: 'MONTHLY', branchLimit: 10, mongoPlanId: 'enterprise-gold', mongoCategoryId: 'Enterprise' },
    { name: 'Enterprise Premium', price: 1499, duration: 'MONTHLY', branchLimit: 99, mongoPlanId: 'enterprise-premium', mongoCategoryId: 'Enterprise' },
  ];

  for (const p of plans) {
    const existing = await prisma.plan.findFirst({ where: { mongoPlanId: p.mongoPlanId } });
    if (!existing) {
      await prisma.plan.create({ data: p });
      console.log(`✅ Created MySQL plan: ${p.name} (${p.mongoPlanId})`);
    } else {
      await prisma.plan.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          price: p.price,
          duration: p.duration,
          branchLimit: p.branchLimit,
          mongoCategoryId: p.mongoCategoryId,
        }
      });
      console.log(`🔄 Updated MySQL plan: ${p.name} (${p.mongoPlanId})`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
