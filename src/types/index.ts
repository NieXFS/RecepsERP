import type { GlobalRole, Role } from "@/generated/prisma/enums";

/** Dados da sessão do usuário autenticado, disponível via NextAuth */
export type SessionUser = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  globalRole: GlobalRole | null;
};

/** Resultado padrão de Server Actions — unifica sucesso e erro */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Parâmetros de paginação padrão */
export type PaginationParams = {
  page?: number;
  perPage?: number;
  search?: string;
};

/** Resposta paginada */
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
