"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  reactivateTenantAction,
  suspendTenantAction,
} from "@/actions/global-admin.actions";
import { Button } from "@/components/ui/button";

type TenantStateActionsProps = {
  tenantId: string;
  globalStatus: "ACTIVE" | "SUSPENDED" | "INVITE_PENDING" | "INCOMPLETE";
};

/**
 * Ações administrativas globais para o estado do tenant.
 */
export function TenantStateActions({
  tenantId,
  globalStatus,
}: TenantStateActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSuspend() {
    startTransition(async () => {
      const result = await suspendTenantAction(tenantId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Tenant suspenso.");
      router.refresh();
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      const result = await reactivateTenantAction(tenantId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.data.lifecycleStatus === "ACTIVE"
          ? "Tenant reativado e operacional."
          : "Tenant reativado, mas ainda incompleto."
      );
      router.refresh();
    });
  }

  if (globalStatus === "SUSPENDED") {
    return (
      <Button type="button" disabled={isPending} onClick={handleReactivate}>
        {isPending ? "Reativando..." : "Reativar tenant"}
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" disabled={isPending} onClick={handleSuspend}>
      {isPending ? "Suspendendo..." : "Suspender tenant"}
    </Button>
  );
}
