import { Badge } from "@/components/ui/badge";
import type {
  AccessRequestStatus,
  TenantSource,
  TenantInvitationStatus,
} from "@/generated/prisma/enums";
import type { GlobalTenantStatus } from "@/services/global-admin.service";

/**
 * Badge padronizado para status global do tenant no painel da Receps.
 */
export function TenantStatusBadge({ status }: { status: GlobalTenantStatus }) {
  const labelMap: Record<GlobalTenantStatus, string> = {
    ACTIVE: "Ativo",
    SUSPENDED: "Suspenso",
    INVITE_PENDING: "Convite pendente",
    INCOMPLETE: "Incompleto",
  };

  const variantMap: Record<
    GlobalTenantStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    ACTIVE: "default",
    SUSPENDED: "destructive",
    INVITE_PENDING: "secondary",
    INCOMPLETE: "outline",
  };

  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}

/**
 * Badge padronizado para status do lead comercial.
 */
export function LeadStatusBadge({ status }: { status: AccessRequestStatus }) {
  const labelMap: Record<AccessRequestStatus, string> = {
    PENDING: "Pendente",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    CONVERTED: "Convertido",
  };

  const variantMap: Record<
    AccessRequestStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PENDING: "secondary",
    APPROVED: "outline",
    REJECTED: "destructive",
    CONVERTED: "default",
  };

  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}

/**
 * Badge padronizado para status do convite.
 */
export function InvitationStatusBadge({
  status,
}: {
  status: TenantInvitationStatus;
}) {
  const labelMap: Record<TenantInvitationStatus, string> = {
    PENDING: "Pendente",
    ACCEPTED: "Aceito",
    EXPIRED: "Expirado",
    CANCELLED: "Cancelado",
  };

  const variantMap: Record<
    TenantInvitationStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PENDING: "secondary",
    ACCEPTED: "default",
    EXPIRED: "destructive",
    CANCELLED: "outline",
  };

  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}

/**
 * Badge para origem de cadastro do tenant.
 */
export function TenantSourceBadge({ source }: { source: TenantSource }) {
  const labelMap: Record<TenantSource, string> = {
    LEAD: "Lead",
    MANUAL_INVITE: "Convite manual",
    SEED: "Seed",
  };

  return <Badge variant="outline">{labelMap[source]}</Badge>;
}
