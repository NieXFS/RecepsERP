import type { GlobalRole, Role, TenantModule } from "@/generated/prisma/enums";
import type { ModuleAccessMap } from "@/lib/tenant-modules";
import type { TenantCustomPermissions } from "@/lib/tenant-permissions";

/** Dados da sessão do usuário autenticado, disponível via NextAuth */
export type SessionUser = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  globalRole: GlobalRole | null;
  avatarUrl: string | null;
};

export type SessionUserWithAccess = SessionUser & {
  customPermissions: TenantCustomPermissions;
  moduleAccess: ModuleAccessMap;
  allowedModules: TenantModule[];
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
