"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cancelTenantInvitationAction,
  regenerateTenantInvitationAction,
} from "@/actions/global-admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InvitationActionButtonsProps = {
  invitationId: string;
  tenantId: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
};

/**
 * Ações mínimas do ciclo do convite: cancelar o link atual ou gerar um novo.
 */
export function InvitationActionButtons({
  invitationId,
  status,
}: InvitationActionButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newInvitationUrl, setNewInvitationUrl] = useState<string | null>(null);

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelTenantInvitationAction(invitationId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Convite cancelado.");
      router.refresh();
    });
  }

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateTenantInvitationAction(invitationId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setNewInvitationUrl(result.data.invitationUrl);
      toast.success("Novo convite gerado.");
      router.refresh();
    });
  }

  async function copyInvitationUrl() {
    if (!newInvitationUrl) {
      return;
    }

    await navigator.clipboard.writeText(newInvitationUrl);
    toast.success("Novo convite copiado.");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {status === "PENDING" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        ) : null}

        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={handleRegenerate}
        >
          {isPending ? "Gerando..." : "Gerar novo convite"}
        </Button>
      </div>

      {newInvitationUrl ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={newInvitationUrl} readOnly />
          <Button type="button" size="sm" variant="outline" onClick={copyInvitationUrl}>
            Copiar link
          </Button>
        </div>
      ) : null}
    </div>
  );
}
