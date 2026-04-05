"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveAccessRequestAction } from "@/actions/onboarding.actions";
import { rejectAccessRequestAction } from "@/actions/global-admin.actions";
import { Button } from "@/components/ui/button";

type LeadActionButtonsProps = {
  accessRequestId: string;
  canApprove?: boolean;
};

/**
 * Ações mínimas do funil de leads: aprovar ou rejeitar a solicitação.
 */
export function LeadActionButtons({
  accessRequestId,
  canApprove = true,
}: LeadActionButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastInvitationUrl, setLastInvitationUrl] = useState<string | null>(null);

  function handleApprove() {
    startTransition(async () => {
      const result = await approveAccessRequestAction(accessRequestId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setLastInvitationUrl(result.data.invitationUrl);
      toast.success("Lead aprovado e convite gerado.");
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectAccessRequestAction(accessRequestId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Lead rejeitado.");
      router.refresh();
    });
  }

  async function copyInvitationUrl() {
    if (!lastInvitationUrl) {
      return;
    }

    await navigator.clipboard.writeText(lastInvitationUrl);
    toast.success("Link do convite copiado.");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canApprove ? (
        <Button type="button" size="sm" disabled={isPending} onClick={handleApprove}>
          {isPending ? "Processando..." : "Aprovar"}
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleReject}
      >
        Rejeitar
      </Button>
      {lastInvitationUrl ? (
        <Button type="button" size="sm" variant="outline" onClick={copyInvitationUrl}>
          Copiar convite
        </Button>
      ) : null}
    </div>
  );
}
