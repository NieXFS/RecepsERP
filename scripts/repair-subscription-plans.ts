import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CANONICAL_SLUGS = [
  "somente-atendente-ia",
  "somente-erp",
  "erp-atendente-ia",
] as const;

type CanonicalSlug = (typeof CANONICAL_SLUGS)[number];

const PRICE_TO_CANONICAL_SLUG: Record<string, CanonicalSlug> = {
  "149.99": "somente-atendente-ia",
  "219.99": "somente-erp",
  "299.99": "erp-atendente-ia",
};

function inferCanonicalSlugFromName(name: string): CanonicalSlug | null {
  const normalized = name.trim().toLowerCase();

  if (
    (normalized.includes("erp") && normalized.includes("atendente")) ||
    normalized.includes("combo")
  ) {
    return "erp-atendente-ia";
  }

  if (normalized.includes("atendente") || normalized.includes("ia")) {
    return "somente-atendente-ia";
  }

  if (normalized.includes("erp")) {
    return "somente-erp";
  }

  return null;
}

async function main() {
  console.log("=== Repair de subscriptions com plano não-canônico ===");

  const canonicalPlans = await prisma.plan.findMany({
    where: {
      slug: {
        in: [...CANONICAL_SLUGS],
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      priceMonthly: true,
      isActive: true,
    },
  });

  const canonicalPlanMap = new Map(canonicalPlans.map((plan) => [plan.slug, plan]));

  console.log("\n[Planos canônicos encontrados]");
  console.log(JSON.stringify(canonicalPlans, null, 2));

  const subscriptions = await prisma.subscription.findMany({
    where: {
      plan: {
        slug: {
          notIn: [...CANONICAL_SLUGS],
        },
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      tenantId: true,
      status: true,
      planId: true,
      plan: {
        select: {
          id: true,
          slug: true,
          name: true,
          priceMonthly: true,
          isActive: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  console.log(`\n[Subscriptions candidatas] ${subscriptions.length}`);
  console.log(JSON.stringify(subscriptions, null, 2));

  if (subscriptions.length === 0) {
    console.log("\nNenhuma subscription com plan.slug fora do conjunto canônico.");
    return;
  }

  for (const subscription of subscriptions) {
    const priceKey = Number(subscription.plan.priceMonthly).toFixed(2);
    const canonicalSlugFromPrice = PRICE_TO_CANONICAL_SLUG[priceKey] ?? null;
    const canonicalSlugFromName = inferCanonicalSlugFromName(subscription.plan.name);
    const targetSlug = canonicalSlugFromPrice ?? canonicalSlugFromName;

    console.log("\n[Subscription antes]");
    console.log(
      JSON.stringify(
        {
          subscriptionId: subscription.id,
          tenant: subscription.tenant,
          status: subscription.status,
          currentPlan: subscription.plan,
          inferredByPrice: canonicalSlugFromPrice,
          inferredByName: canonicalSlugFromName,
          targetSlug,
        },
        null,
        2
      )
    );

    if (!targetSlug) {
      console.warn(
        `⚠️  Sem correspondência canônica para subscription ${subscription.id}. Revisão manual necessária.`
      );
      continue;
    }

    const targetPlan = canonicalPlanMap.get(targetSlug);

    if (!targetPlan) {
      console.warn(
        `⚠️  Plano canônico ${targetSlug} não encontrado para subscription ${subscription.id}.`
      );
      continue;
    }

    if (subscription.planId === targetPlan.id) {
      console.log("Já apontando para o planId canônico correto. Nenhuma alteração.");
      continue;
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: targetPlan.id,
      },
    });

    console.log("[Subscription depois]");
    console.log(
      JSON.stringify(
        {
          subscriptionId: subscription.id,
          previousPlanId: subscription.planId,
          previousPlanSlug: subscription.plan.slug,
          nextPlanId: targetPlan.id,
          nextPlanSlug: targetPlan.slug,
          nextPlanName: targetPlan.name,
          nextPlanPriceMonthly: targetPlan.priceMonthly,
        },
        null,
        2
      )
    );
  }
}

main()
  .catch((error) => {
    console.error("Falha ao reparar subscriptions:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
