"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTenantAdminInvitationAction } from "@/actions/global-admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TenantAdminInvitationFormProps = {
  tenantId: string;
  initialEmail?: string | null;
  initialRecipientName?: string | null;
};

/**
 * Formulário enxuto para gerar novo convite administrativo em um tenant existente.
 */
export function TenantAdminInvitationForm({
  tenantId,
  initialEmail,
  initialRecipientName,
}: TenantAdminInvitationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [recipientName, setRecipientName] = useState(initialRecipientName ?? "");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [error, setError] = useState("");
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createTenantAdminInvitationAction({
        tenantId,
        email,
        recipientName,
        expiresInDays: Number(expiresInDays || "7"),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setInvitationUrl(result.data.invitationUrl);
      toast.success("Novo convite gerado.");
      router.refresh();
    });
  }

  async function copyInvitationUrl() {
    if (!invitationUrl) {
      return;
    }

    await navigator.clipboard.writeText(invitationUrl);
    toast.success("Link copiado.");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="tenant-invite-name" className="text-sm font-medium">
            Responsável
          </label>
          <Input
            id="tenant-invite-name"
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
            placeholder="Nome do responsável"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tenant-invite-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="tenant-invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@cliente.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tenant-invite-expiry" className="text-sm font-medium">
            Expiração
          </label>
          <Input
            id="tenant-invite-expiry"
            type="number"
            min={1}
            max={30}
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(event.target.value)}
            required
          />
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Gerando..." : "Gerar novo convite"}
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {invitationUrl ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={invitationUrl} readOnly />
          <Button type="button" variant="outline" onClick={copyInvitationUrl}>
            Copiar link
          </Button>
        </div>
      ) : null}
    </div>
  );
}
