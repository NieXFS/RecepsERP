"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomerAction } from "@/actions/customer.actions";

export type CreatedCustomer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
};

type CustomerCreateFormProps = {
  onSuccess?: (customer: CreatedCustomer) => void;
  onCancel?: () => void;
  refreshOnSuccess?: boolean;
  submitLabel?: string;
  className?: string;
};

/**
 * Formulário reutilizável de cadastro rápido de cliente.
 * Pode ser usado tanto em um Dialog quanto inline dentro de outros fluxos,
 * como o modal de agendamento.
 */
export function CustomerCreateForm({
  onSuccess,
  onCancel,
  refreshOnSuccess = true,
  submitLabel = "Salvar Cliente",
  className,
}: CustomerCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setDocument("");
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createCustomerAction({
        name,
        phone,
        email,
        document,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Cliente cadastrado!");
      const createdCustomer = result.data.customer;
      resetForm();
      onSuccess?.(createdCustomer);

      if (refreshOnSuccess) {
        router.refresh();
      }
    });
  }

  return (
    <div className={className}>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="customer-name">Nome Completo *</Label>
          <Input
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Ana Carolina Souza"
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="customer-phone">Telefone / WhatsApp *</Label>
          <Input
            id="customer-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="customer-email">Email</Label>
          <Input
            id="customer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@exemplo.com"
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="customer-document">CPF / Documento</Label>
          <Input
            id="customer-document"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            placeholder="000.000.000-00"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
        ) : null}
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
