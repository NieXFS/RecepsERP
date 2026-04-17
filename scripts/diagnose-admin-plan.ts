import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizePlanSlug } from "../src/lib/plans";
import { hasPlanProduct } from "../src/lib/plan-modules";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@admin.com";

  console.log(`=== Diagnose do plano do usuário ${email} ===`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      globalRole: true,
    },
  });

  if (!user) {
    console.log("Usuário não encontrado.");
    return;
  }

  console.log("\n[Usuário]");
  console.log(JSON.stringify(user, null, 2));

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      billingBypassEnabled: true,
      subscription: {
        select: {
          id: true,
          status: true,
          plan: {
            select: {
              id: true,
              slug: true,
              name: true,
              priceMonthly: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  console.log("\n[Tenant + assinatura]");
  console.log(JSON.stringify(tenant, null, 2));

  const planSlug = tenant?.subscription?.plan?.slug ?? null;
  const normalizedPlanSlug = normalizePlanSlug(planSlug);
  const botEnabled = hasPlanProduct(planSlug, "bot");

  console.log("\n[Gate de plano]");
  console.log(
    JSON.stringify(
      {
        rawPlanSlug: planSlug,
        normalizedPlanSlug,
        hasPlanProductBot: botEnabled,
      },
      null,
      2
    )
  );

  const plans = await prisma.plan.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      priceMonthly: true,
      isActive: true,
    },
  });

  console.log("\n[Todos os planos]");
  console.log(JSON.stringify(plans, null, 2));
}

main()
  .catch((error) => {
    console.error("Falha ao diagnosticar plano do admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
