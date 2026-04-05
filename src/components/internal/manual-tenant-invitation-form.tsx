"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTenantInvitationAction } from "@/actions/onboarding.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Formulário para convite manual de um novo cliente sem passar por lead público.
 * Preserva o fluxo do PASSO 12, agora reposicionado dentro da área de convites.
 */
export function ManualTenantInvitationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [businessName, setBusinessName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [error, setError] = useState("");
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createTenantInvitationAction({
        businessName,
        recipientName,
        email,
        expiresInDays: Number(expiresInDays || "7"),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setInvitationUrl(result.data.invitationUrl);
      toast.success("Convite manual criado.");
      setBusinessName("");
      setRecipientName("");
      setEmail("");
      setExpiresInDays("7");
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
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="manual-business-name" className="text-sm font-medium">
            Nome do negócio
          </label>
          <Input
            id="manual-business-name"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Ex: Studio Aurora"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="manual-recipient-name" className="text-sm font-medium">
            Responsável
          </label>
          <Input
            id="manual-recipient-name"
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
            placeholder="Nome do administrador principal"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="manual-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="manual-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@cliente.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="manual-expiry" className="text-sm font-medium">
            Expiração
          </label>
          <Input
            id="manual-expiry"
            type="number"
            min={1}
            max={30}
            value={expiresInDays}
            onChange={(event) => setExpiresInDays(event.target.value)}
            required
          />
        </div>

        <div className="lg:col-span-2">
          <Button type="submit" className="w-full lg:w-auto" disabled={isPending}>
            {isPending ? "Gerando..." : "Criar convite manual"}
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
