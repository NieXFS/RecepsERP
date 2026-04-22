"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCustomerAction, updateCustomerAction } from "@/actions/customer.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CUSTOMER_GENDER_VALUES } from "@/lib/validators/customer";

export type SavedCustomer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
};

export type CustomerFormInitialData = {
  id?: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  birthDate?: string | null;
  gender?: (typeof CUSTOMER_GENDER_VALUES)[number] | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  optOutAutomations?: boolean | null;
};

type CustomerFormProps = {
  initialData?: CustomerFormInitialData;
  onSuccess?: (customer: SavedCustomer) => void;
  onCancel?: () => void;
  refreshOnSuccess?: boolean;
  submitLabel?: string;
  className?: string;
  mode?: "compact" | "full";
};

const GENDER_OPTIONS = [
  { value: "NOT_INFORMED", label: "Não informado" },
  { value: "FEMALE", label: "Feminino" },
  { value: "MALE", label: "Masculino" },
  { value: "OTHER", label: "Outro" },
] as const;

function formatDateInput(value?: string | null) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

export function CustomerForm({
  initialData,
  onSuccess,
  onCancel,
  refreshOnSuccess = true,
  submitLabel,
  className,
  mode = "full",
}: CustomerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialData?.name ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [document, setDocument] = useState(initialData?.document ?? "");
  const [birthDate, setBirthDate] = useState(formatDateInput(initialData?.birthDate));
  const [gender, setGender] = useState(
    initialData?.gender ?? "NOT_INFORMED"
  );
  const [zipCode, setZipCode] = useState(initialData?.zipCode ?? "");
  const [street, setStreet] = useState(initialData?.street ?? "");
  const [number, setNumber] = useState(initialData?.number ?? "");
  const [complement, setComplement] = useState(initialData?.complement ?? "");
  const [neighborhood, setNeighborhood] = useState(initialData?.neighborhood ?? "");
  const [city, setCity] = useState(initialData?.city ?? "");
  const [state, setState] = useState(initialData?.state ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [automationsOptIn, setAutomationsOptIn] = useState(
    !(initialData?.optOutAutomations ?? false)
  );

  const isEditing = Boolean(initialData?.id);
  const resolvedSubmitLabel =
    submitLabel ?? (isEditing ? "Salvar Alterações" : "Salvar Cliente");

  useEffect(() => {
    setName(initialData?.name ?? "");
    setPhone(initialData?.phone ?? "");
    setEmail(initialData?.email ?? "");
    setDocument(initialData?.document ?? "");
    setBirthDate(formatDateInput(initialData?.birthDate));
    setGender(initialData?.gender ?? "NOT_INFORMED");
    setZipCode(initialData?.zipCode ?? "");
    setStreet(initialData?.street ?? "");
    setNumber(initialData?.number ?? "");
    setComplement(initialData?.complement ?? "");
    setNeighborhood(initialData?.neighborhood ?? "");
    setCity(initialData?.city ?? "");
    setState(initialData?.state ?? "");
    setNotes(initialData?.notes ?? "");
    setAutomationsOptIn(!(initialData?.optOutAutomations ?? false));
  }, [initialData]);

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setDocument("");
    setBirthDate("");
    setGender("NOT_INFORMED");
    setZipCode("");
    setStreet("");
    setNumber("");
    setComplement("");
    setNeighborhood("");
    setCity("");
    setState("");
    setNotes("");
    setAutomationsOptIn(true);
  }

  function handleSubmit() {
    const payload = {
      name,
      phone,
      email,
      document,
      birthDate,
      gender,
      zipCode,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      notes,
      optOutAutomations: !automationsOptIn,
    };

    startTransition(async () => {
      const result =
        isEditing && initialData?.id
          ? await updateCustomerAction(initialData.id, payload)
          : await createCustomerAction(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Perfil do cliente atualizado!" : "Cliente cadastrado!");
      onSuccess?.(result.data.customer);

      if (!isEditing) {
        resetForm();
      }

      if (refreshOnSuccess) {
        router.refresh();
      }
    });
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="max-h-[70vh] overflow-y-auto pr-2">
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

          <div className="grid gap-1">
            <label
              htmlFor="customer-automations-opt-in"
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                automationsOptIn
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-muted/30",
                isPending && "cursor-not-allowed opacity-70"
              )}
            >
              <input
                id="customer-automations-opt-in"
                type="checkbox"
                checked={automationsOptIn}
                disabled={isPending}
                onChange={(e) => setAutomationsOptIn(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="flex-1">
                Receber automações da Ana no WhatsApp
              </span>
            </label>
            {!automationsOptIn ? (
              <p className="text-xs text-muted-foreground">
                Cliente optou por não receber automações.
              </p>
            ) : null}
          </div>

          {mode === "full" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="customer-birthdate">Data de Nascimento</Label>
                  <Input
                    id="customer-birthdate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Gênero</Label>
                  <Select
                    value={gender}
                    onValueChange={(value) => setGender(value ?? "NOT_INFORMED")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValueLabel
                        value={gender}
                        options={GENDER_OPTIONS}
                        placeholder="Selecionar gênero"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,180px)_120px_minmax(0,1fr)]">
                <div className="grid gap-2">
                  <Label htmlFor="customer-zipcode">CEP</Label>
                  <Input
                    id="customer-zipcode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="00000-000"
                    disabled={isPending}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customer-number">Número</Label>
                  <Input
                    id="customer-number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    disabled={isPending}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customer-street">Rua / Logradouro</Label>
                  <Input
                    id="customer-street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Rua das Acácias"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="customer-complement">Complemento</Label>
                  <Input
                    id="customer-complement"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Sala 3, bloco B"
                    disabled={isPending}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customer-neighborhood">Bairro</Label>
                  <Input
                    id="customer-neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Centro"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_100px]">
                <div className="grid gap-2">
                  <Label htmlFor="customer-city">Cidade</Label>
                  <Input
                    id="customer-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    disabled={isPending}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customer-state">Estado</Label>
                  <Input
                    id="customer-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="SP"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-notes">Observações Gerais</Label>
                <Textarea
                  id="customer-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações importantes sobre o cliente, preferências ou contexto do atendimento."
                  disabled={isPending}
                  className="min-h-28"
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
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
          {isPending ? "Salvando..." : resolvedSubmitLabel}
        </Button>
      </div>
    </div>
  );
}
