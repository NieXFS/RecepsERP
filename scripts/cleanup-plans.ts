import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * Limpa planos legados/duplicados do /assinar.
 *
 * Mantém ativos apenas os 3 planos canônicos (slug):
 *   - somente-atendente-ia  → "Atendente IA"
 *   - somente-erp           → "ERP"
 *   - erp-atendente-ia      → "ERP + Atendente IA"
 *
 * Planos com outro slug são desativados (isActive = false), não apagados,
 * para preservar assinaturas históricas que possam referenciá-los.
 */

const CANONICAL_PLANS = [
  {
    slug: "somente-atendente-ia",
    name: "Atendente IA",
    isFeatured: false,
    sortOrder: 10,
  },
  {
    slug: "somente-erp",
    name: "ERP",
    isFeatured: true,
    sortOrder: 20,
  },
  {
    slug: "erp-atendente-ia",
    name: "ERP + Atendente IA",
    isFeatured: true,
    sortOrder: 30,
  },
] as const;

async function main() {
  console.log("🧹 Limpando planos legados em /assinar...");

  const canonicalSlugs = CANONICAL_PLANS.map((p) => p.slug);

  // 1. Renomeia os canônicos para os nomes finais e garante que fiquem ativos.
  for (const plan of CANONICAL_PLANS) {
    const updated = await prisma.plan.updateMany({
      where: { slug: plan.slug },
      data: {
        name: plan.name,
        isActive: true,
        isFeatured: plan.isFeatured,
        sortOrder: plan.sortOrder,
      },
    });
    console.log(
      `  • ${plan.slug} → "${plan.name}" (${updated.count} linha${updated.count === 1 ? "" : "s"} atualizada${updated.count === 1 ? "" : "s"})`
    );
  }

  // 2. Desativa qualquer plano fora dos 3 canônicos.
  const stale = await prisma.plan.findMany({
    where: {
      slug: { notIn: [...canonicalSlugs] },
      isActive: true,
    },
    select: { id: true, slug: true, name: true },
  });

  if (stale.length === 0) {
    console.log("✅ Nenhum plano legado ativo. Tudo limpo.");
  } else {
    console.log(`\n⚠️  ${stale.length} plano(s) legado(s) ativo(s) serão desativados:`);
    for (const plan of stale) {
      console.log(`  • ${plan.slug} — "${plan.name}"`);
    }

    const result = await prisma.plan.updateMany({
      where: {
        slug: { notIn: [...canonicalSlugs] },
        isActive: true,
      },
      data: { isActive: false },
    });
    console.log(`\n✅ ${result.count} plano(s) desativado(s).`);
  }

  // 3. Lista o estado final.
  const active = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { slug: true, name: true, priceMonthly: true, isFeatured: true },
  });

  console.log(`\n📋 Planos ativos agora (${active.length}):`);
  for (const plan of active) {
    const price = Number(plan.priceMonthly).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const flag = plan.isFeatured ? " ⭐" : "";
    console.log(`  • ${plan.slug} — "${plan.name}" — ${price}${flag}`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Falha ao limpar planos:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
