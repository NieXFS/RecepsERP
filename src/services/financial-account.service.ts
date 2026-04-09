import { db } from "@/lib/db";
import type {
  CreateFinancialAccountInput,
  DeactivateFinancialAccountInput,
} from "@/lib/validators/financial";
import type { ActionResult } from "@/types";

export type FinancialAccountListItem = {
  id: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
};

export async function listFinancialAccounts(
  tenantId: string
): Promise<FinancialAccountListItem[]> {
  const accounts = await db.financialAccount.findMany({
    where: {
      tenantId,
    },
    orderBy: [{ isActive: "desc" }, { type: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      balance: true,
      isActive: true,
      createdAt: true,
    },
  });

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balance: Number(account.balance),
    isActive: account.isActive,
    createdAt: account.createdAt.toISOString(),
  }));
}

export async function createFinancialAccount(
  tenantId: string,
  data: CreateFinancialAccountInput
): Promise<ActionResult<{ accountId: string }>> {
  try {
    const account = await db.financialAccount.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        balance: data.initialBalance,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    return {
      success: true,
      data: {
        accountId: account.id,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("tenantId_name")
        ? "Ja existe uma conta com este nome."
        : error instanceof Error
          ? error.message
          : "Erro ao criar a conta financeira.";

    return {
      success: false,
      error: message,
    };
  }
}

export async function deactivateFinancialAccount(
  tenantId: string,
  input: DeactivateFinancialAccountInput
): Promise<ActionResult<{ accountId: string }>> {
  try {
    const result = await db.$transaction(async (tx) => {
      const account = await tx.financialAccount.findFirst({
        where: {
          id: input.accountId,
          tenantId,
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });

      if (!account) {
        throw new Error("Conta financeira nao encontrada.");
      }

      if (!account.isActive) {
        throw new Error("Esta conta ja esta desativada.");
      }

      const activeAccountsCount = await tx.financialAccount.count({
        where: {
          tenantId,
          isActive: true,
        },
      });

      if (activeAccountsCount <= 1) {
        throw new Error("Nao e possivel desativar a ultima conta ativa do sistema.");
      }

      const openCashSession = await tx.cashRegisterSession.findFirst({
        where: {
          tenantId,
          accountId: account.id,
          status: "OPEN",
        },
        select: {
          id: true,
        },
      });

      if (openCashSession) {
        throw new Error("Feche o caixa aberto desta conta antes de desativa-la.");
      }

      await tx.financialAccount.update({
        where: {
          id: account.id,
        },
        data: {
          isActive: false,
        },
      });

      return {
        accountId: account.id,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao desativar a conta financeira.",
    };
  }
}
