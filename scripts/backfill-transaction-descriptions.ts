import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildAppointmentDescription } from "../src/services/financial.service";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * Regrava transactions antigas cuja description começa com "Agendamento #"
 * e que estão vinculadas a um appointment (1ª parcela ou pagamento à vista),
 * aplicando a descrição humana baseada em cliente + serviços.
 *
 * Uso:
 *   npx tsx scripts/backfill-transaction-descriptions.ts
 *
 * Parcelas subsequentes (appointmentId=null) NÃO são reescritas por este script
 * — match confiável via sibling exigiria heurística frágil; fica como TODO.
 */
async function main() {
  const candidates = await prisma.transaction.findMany({
    where: {
      description: { startsWith: "Agendamento #" },
      appointmentId: { not: null },
    },
    include: {
      appointment: {
        select: {
          customer: { select: { name: true } },
          services: {
            select: {
              service: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  console.log(`[backfill] ${candidates.length} transaction(s) candidata(s).`);

  let updated = 0;
  for (const transaction of candidates) {
    if (!transaction.appointment) continue;

    const nextDescription = buildAppointmentDescription({
      customerName: transaction.appointment.customer?.name,
      serviceNames: transaction.appointment.services.map((s) => s.service.name),
      installmentNumber: transaction.installmentNumber,
      totalInstallments: transaction.totalInstallments,
    });

    if (nextDescription === transaction.description) continue;

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { description: nextDescription },
    });
    updated += 1;
  }

  console.log(`[backfill] ${updated} transaction(s) atualizada(s).`);
  console.log(
    "[backfill] TODO: parcelas subsequentes (appointmentId=null) não foram tratadas."
  );
}

main()
  .catch((error) => {
    console.error("[backfill] Falha:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
