import { db } from "@/lib/db";
import type { ActionResult } from "@/types";

type CheckoutOptions = {
  paymentMethod?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO" | "OTHER";
  accountId?: string;
  installments?: number; // Quantidade de parcelas (ex: 3x no cartão)
};

/**
 * Finaliza um agendamento executando TODO o fluxo financeiro e operacional
 * em uma única transação ACID. Se qualquer etapa falhar, TUDO sofre rollback.
 *
 * Fluxo executado (nesta ordem, dentro de $transaction):
 *
 *  1. VALIDAÇÃO — Verifica se o agendamento existe, pertence ao tenant,
 *     e está em status que permite finalização.
 *
 *  2. COBRANÇA (condicional) — Se for serviço avulso (sem pacote), cria
 *     registro(s) de Transaction (INCOME). Se tiver parcelas, cria uma
 *     Transaction por parcela com dueDate escalonado. Se for sessão de
 *     pacote, pula esta etapa (receita já foi registrada na compra do pacote).
 *
 *  3. COMISSÕES (sempre) — Independente de ser avulso ou pacote, o profissional
 *     trabalhou. Busca a taxa de comissão na ProfessionalService (ou fallback
 *     para a taxa padrão do Professional). Cria um Commission por serviço
 *     com status PENDING, calculando o split clínica vs profissional.
 *
 *  4. BAIXA DE ESTOQUE (sempre) — Para cada serviço executado, busca a ficha
 *     técnica (ServiceMaterial). Decrementa o stockQuantity do Product e
 *     registra um InventoryMovement do tipo EXIT com referência ao appointmentId.
 *
 *  5. ATUALIZAÇÃO DO CLIENTE — Incrementa visitCount e totalSpent do Customer.
 *
 *  6. STATUS — Muda o appointment para COMPLETED.
 */
export async function checkoutAppointment(
  tenantId: string,
  appointmentId: string,
  options: CheckoutOptions = {}
): Promise<ActionResult<{ transactionIds: string[]; commissionIds: string[] }>> {
  const { paymentMethod = "CASH", accountId, installments = 1 } = options;

  // --- Busca o agendamento com todos os dados necessários para o checkout ---
  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: {
      services: {
        include: {
          service: {
            include: {
              // Ficha técnica: quais produtos são consumidos por este serviço
              materials: { include: { product: true } },
            },
          },
        },
      },
      professional: {
        include: {
          // Tabela de comissão customizada por serviço
          services: true,
        },
      },
      customer: true,
    },
  });

  if (!appointment) {
    return { success: false, error: "Agendamento não encontrado." };
  }

  if (appointment.status === "COMPLETED") {
    return { success: false, error: "Este agendamento já foi finalizado." };
  }

  if (appointment.status === "CANCELLED" || appointment.status === "NO_SHOW") {
    return { success: false, error: "Não é possível finalizar um agendamento cancelado ou no-show." };
  }

  const isPackageSession = !!appointment.customerPackageId;
  const totalAmount = Number(appointment.totalPrice);

  try {
    const result = await db.$transaction(async (tx) => {
      const createdTransactionIds: string[] = [];
      const createdCommissionIds: string[] = [];

      // ================================================================
      // ETAPA 1: COBRANÇA — Cria Transaction apenas se for serviço avulso
      // ================================================================
      if (!isPackageSession && totalAmount > 0) {
        if (installments > 1) {
          // Parcelamento: cria uma Transaction por parcela com vencimentos escalonados
          const installmentAmount = Math.round((totalAmount / installments) * 100) / 100;

          for (let i = 1; i <= installments; i++) {
            // Cada parcela vence 30 dias após a anterior
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30 * (i - 1));

            // Ajuste de centavos na última parcela para evitar diferença de arredondamento
            const isLastInstallment = i === installments;
            const amount = isLastInstallment
              ? totalAmount - installmentAmount * (installments - 1)
              : installmentAmount;

            const transaction = await tx.transaction.create({
              data: {
                tenantId,
                appointmentId: i === 1 ? appointmentId : null, // Apenas a 1ª parcela linka ao appointment (@unique)
                accountId: accountId ?? null,
                type: "INCOME",
                paymentMethod,
                paymentStatus: i === 1 ? "PAID" : "PENDING", // 1ª parcela paga na hora
                amount,
                installmentNumber: i,
                totalInstallments: installments,
                dueDate,
                paidAt: i === 1 ? new Date() : null,
                description: `Agendamento #${appointmentId.slice(-6)} — Parcela ${i}/${installments}`,
              },
            });
            createdTransactionIds.push(transaction.id);
          }
        } else {
          // Pagamento à vista: uma única Transaction marcada como PAID
          const transaction = await tx.transaction.create({
            data: {
              tenantId,
              appointmentId,
              accountId: accountId ?? null,
              type: "INCOME",
              paymentMethod,
              paymentStatus: "PAID",
              amount: totalAmount,
              installmentNumber: null,
              totalInstallments: null,
              dueDate: null,
              paidAt: new Date(),
              description: `Agendamento #${appointmentId.slice(-6)} — Pagamento à vista`,
            },
          });
          createdTransactionIds.push(transaction.id);
        }

        // Atualiza o saldo da conta financeira (se informada)
        if (accountId) {
          // À vista: credita o total. Parcelado: credita apenas a 1ª parcela
          const creditAmount = installments > 1
            ? Math.round((totalAmount / installments) * 100) / 100
            : totalAmount;

          await tx.financialAccount.update({
            where: { id: accountId },
            data: { balance: { increment: creditAmount } },
          });
        }
      }

      // ================================================================
      // ETAPA 2: COMISSÕES — Sempre geradas (pacote ou avulso)
      // O profissional trabalhou, então recebe comissão independentemente
      // de como o cliente pagou (à vista, parcelado, ou via pacote).
      // ================================================================
      for (const appointmentService of appointment.services) {
        const servicePrice = Number(appointmentService.price) * appointmentService.quantity;

        // Busca taxa de comissão customizada para este serviço específico.
        // Se não existir, usa a taxa padrão do profissional.
        const professionalService = appointment.professional.services.find(
          (ps) => ps.serviceId === appointmentService.serviceId
        );

        const commissionRate = professionalService?.customCommissionPercent
          ? Number(professionalService.customCommissionPercent)
          : Number(appointment.professional.commissionPercent);

        const commissionValue = Math.round((servicePrice * commissionRate) / 100 * 100) / 100;
        const clinicValue = Math.round((servicePrice - commissionValue) * 100) / 100;

        const commission = await tx.commission.create({
          data: {
            tenantId,
            professionalId: appointment.professionalId,
            appointmentId,
            serviceAmount: servicePrice,
            commissionRate,
            commissionValue,
            clinicValue,
            status: "PENDING", // Será PAID quando a clínica fizer o acerto com o profissional
          },
        });
        createdCommissionIds.push(commission.id);
      }

      // ================================================================
      // ETAPA 3: BAIXA DE ESTOQUE — Consome insumos da ficha técnica
      // Para cada serviço executado, busca os materiais e decrementa
      // o estoque. Se o estoque ficar negativo, a transação inteira
      // sofre rollback (erro propagado pelo throw).
      // ================================================================
      for (const appointmentService of appointment.services) {
        const materials = appointmentService.service.materials;

        for (const material of materials) {
          const quantityToConsume = Number(material.quantity) * appointmentService.quantity;
          const currentStock = Number(material.product.stockQuantity);

          // Validação: impede estoque negativo
          if (currentStock < quantityToConsume) {
            throw new Error(
              `Estoque insuficiente para "${material.product.name}". ` +
              `Disponível: ${currentStock} ${material.product.unit}, ` +
              `Necessário: ${quantityToConsume} ${material.product.unit}. ` +
              `Reponha o estoque antes de finalizar este agendamento.`
            );
          }

          // Decrementa o estoque do produto
          await tx.product.update({
            where: { id: material.productId },
            data: {
              stockQuantity: { decrement: quantityToConsume },
            },
          });

          // Registra a movimentação de saída para rastreabilidade
          await tx.inventoryMovement.create({
            data: {
              tenantId,
              productId: material.productId,
              type: "EXIT",
              quantity: -quantityToConsume, // Negativo para saída
              unitCost: material.product.costPrice,
              reason: `Consumo automático — Agendamento #${appointmentId.slice(-6)}, Serviço: ${appointmentService.service.name}`,
              referenceId: appointmentId,
            },
          });
        }
      }

      // ================================================================
      // ETAPA 4: ATUALIZAÇÃO DO CLIENTE — Incrementa LTV e visitas
      // ================================================================
      await tx.customer.update({
        where: { id: appointment.customerId },
        data: {
          visitCount: { increment: 1 },
          totalSpent: { increment: totalAmount }, // Mesmo em pacote, reflete o valor do serviço
        },
      });

      // ================================================================
      // ETAPA 5: FINALIZA O AGENDAMENTO — Status → COMPLETED
      // ================================================================
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED" },
      });

      return { transactionIds: createdTransactionIds, commissionIds: createdCommissionIds };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao finalizar agendamento.";
    return { success: false, error: message };
  }
}

/**
 * Marca comissões como PAID no acerto quinzenal/mensal com o profissional.
 * Recebe uma lista de IDs de comissões a serem pagas em lote.
 * Tudo dentro de transação: se uma falhar, nenhuma é marcada.
 */
export async function payCommissions(
  tenantId: string,
  commissionIds: string[]
): Promise<ActionResult<{ paidCount: number }>> {
  if (commissionIds.length === 0) {
    return { success: false, error: "Nenhuma comissão informada." };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // Verifica se todas as comissões existem, pertencem ao tenant e estão PENDING
      const commissions = await tx.commission.findMany({
        where: {
          id: { in: commissionIds },
          tenantId,
        },
      });

      if (commissions.length !== commissionIds.length) {
        throw new Error("Uma ou mais comissões não foram encontradas.");
      }

      const nonPending = commissions.filter((c) => c.status !== "PENDING");
      if (nonPending.length > 0) {
        throw new Error(
          `${nonPending.length} comissão(ões) não estão com status PENDING e não podem ser pagas.`
        );
      }

      // Atualiza todas as comissões para PAID em lote
      await tx.commission.updateMany({
        where: {
          id: { in: commissionIds },
          tenantId,
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      return { paidCount: commissions.length };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao pagar comissões.";
    return { success: false, error: message };
  }
}

/**
 * Lista comissões pendentes de um profissional para o acerto financeiro.
 * Retorna o total acumulado e os detalhes por agendamento.
 */
export async function getPendingCommissions(
  tenantId: string,
  professionalId: string
) {
  const commissions = await db.commission.findMany({
    where: {
      tenantId,
      professionalId,
      status: "PENDING",
    },
    include: {
      appointment: {
        select: {
          id: true,
          startTime: true,
          customer: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalPending = commissions.reduce(
    (sum, c) => sum + Number(c.commissionValue),
    0
  );

  return {
    commissions,
    totalPending: Math.round(totalPending * 100) / 100,
    count: commissions.length,
  };
}

/**
 * Lista todos os profissionais do tenant com resumo de comissões pendentes.
 * Usado na tela de Fechamento de Comissões para exibir o painel geral.
 * Para cada profissional, retorna a soma PENDING e a lista detalhada de serviços.
 */
export async function getCommissionsSummaryByProfessional(tenantId: string) {
  const professionals = await db.professional.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    include: {
      user: { select: { name: true, email: true } },
      commissions: {
        where: { status: "PENDING" },
        include: {
          appointment: {
            select: {
              id: true,
              startTime: true,
              customer: { select: { name: true } },
              services: {
                include: { service: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return professionals.map((p) => {
    const totalPending = p.commissions.reduce(
      (sum, c) => sum + Number(c.commissionValue),
      0
    );
    const totalClinic = p.commissions.reduce(
      (sum, c) => sum + Number(c.clinicValue),
      0
    );

    return {
      id: p.id,
      name: p.user.name,
      email: p.user.email,
      specialty: p.specialty,
      commissionPercent: Number(p.commissionPercent),
      totalPending: Math.round(totalPending * 100) / 100,
      totalClinic: Math.round(totalClinic * 100) / 100,
      commissionCount: p.commissions.length,
      commissions: p.commissions.map((c) => ({
        id: c.id,
        date: c.appointment.startTime.toISOString(),
        customerName: c.appointment.customer?.name ?? "—",
        services: c.appointment.services.map((s) => s.service.name).join(", "),
        serviceAmount: Number(c.serviceAmount),
        commissionRate: Number(c.commissionRate),
        commissionValue: Number(c.commissionValue),
        clinicValue: Number(c.clinicValue),
      })),
    };
  });
}

/**
 * Realiza o acerto financeiro de um profissional em transação ACID:
 *  1. Marca todas as comissões PENDING do profissional como PAID
 *  2. Cria uma Transaction do tipo EXPENSE no caixa da clínica
 *     para registrar a saída de dinheiro (pagamento ao profissional)
 *  3. Debita o saldo da conta financeira (se informada)
 *
 * Isso garante que o fluxo de caixa reflita corretamente o pagamento.
 */
export async function settleCommissions(
  tenantId: string,
  professionalId: string,
  accountId?: string
): Promise<ActionResult<{ paidCount: number; expenseTransactionId: string }>> {
  try {
    const result = await db.$transaction(async (tx) => {
      // Busca todas as comissões PENDING deste profissional
      const pendingCommissions = await tx.commission.findMany({
        where: { tenantId, professionalId, status: "PENDING" },
      });

      if (pendingCommissions.length === 0) {
        throw new Error("Este profissional não possui comissões pendentes para acerto.");
      }

      const totalToPay = pendingCommissions.reduce(
        (sum, c) => sum + Number(c.commissionValue),
        0
      );
      const roundedTotal = Math.round(totalToPay * 100) / 100;

      // Busca nome do profissional para a descrição da transação
      const professional = await tx.professional.findFirst({
        where: { id: professionalId, tenantId },
        include: { user: { select: { name: true } } },
      });

      const profName = professional?.user.name ?? "Profissional";

      // ETAPA 1: Marca todas as comissões como PAID
      const commissionIds = pendingCommissions.map((c) => c.id);
      await tx.commission.updateMany({
        where: { id: { in: commissionIds }, tenantId },
        data: { status: "PAID", paidAt: new Date() },
      });

      // ETAPA 2: Cria Transaction EXPENSE para registrar a saída no caixa
      const expenseTransaction = await tx.transaction.create({
        data: {
          tenantId,
          accountId: accountId ?? null,
          type: "EXPENSE",
          paymentMethod: "CASH",
          paymentStatus: "PAID",
          amount: roundedTotal,
          paidAt: new Date(),
          description: `Acerto de comissões — ${profName} (${commissionIds.length} serviço${commissionIds.length > 1 ? "s" : ""})`,
        },
      });

      // ETAPA 3: Debita o saldo da conta financeira (se informada)
      if (accountId) {
        await tx.financialAccount.update({
          where: { id: accountId },
          data: { balance: { decrement: roundedTotal } },
        });
      }

      return {
        paidCount: commissionIds.length,
        expenseTransactionId: expenseTransaction.id,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao realizar acerto de comissões.";
    return { success: false, error: message };
  }
}
