import { db } from '../src/lib/db';

(async () => {
  const plans = await db.plan.findMany({
    select: { id: true, slug: true, name: true, isActive: true, stripePriceId: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(JSON.stringify(plans, null, 2));
  await db.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
