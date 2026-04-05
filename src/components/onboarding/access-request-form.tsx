"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAccessRequestAction } from "@/actions/onboarding.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Formulário público do novo funil comercial do ERP.
 * Captura a intenção de compra e envia apenas uma solicitação de acesso pendente.
 */
export function AccessRequestForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createAccessRequestAction({
        businessName,
        ownerName,
        email,
        phone,
        notes,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success("Solicitação enviada. Nosso time vai revisar seu pedido.");
      router.push("/aguarde-aprovacao");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="businessName" className="text-sm font-medium">
          Nome do negócio
        </label>
        <Input
          id="businessName"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          placeholder="Ex: Clínica Bella, Studio Aura, Odonto Prime"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="ownerName" className="text-sm font-medium">
          Responsável principal
        </label>
        <Input
          id="ownerName"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
          placeholder="Seu nome completo"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">
            Telefone
          </label>
          <Input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(11) 99999-0000"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          O que você quer organizar no ERP?
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Conte o cenário da sua operação, tamanho da equipe ou principais dores."
          rows={4}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Solicitar acesso ao ERP"}
      </Button>
    </form>
  );
}
