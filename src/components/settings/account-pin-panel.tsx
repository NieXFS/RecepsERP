"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LockKeyhole, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeMyPinAction, setMyPinAction } from "@/actions/account.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccountPinPanelProps = {
  initialPinConfiguredAt: string | null;
};

function sanitizePin(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function AccountPinPanel({ initialPinConfiguredAt }: AccountPinPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pinConfiguredAt, setPinConfiguredAt] = useState(initialPinConfiguredAt);
  const [setupNewPin, setSetupNewPin] = useState("");
  const [setupConfirmPin, setSetupConfirmPin] = useState("");
  const [changeOpen, setChangeOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [changeNewPin, setChangeNewPin] = useState("");
  const [changeConfirmPin, setChangeConfirmPin] = useState("");
  const [removeCurrentPin, setRemoveCurrentPin] = useState("");

  useEffect(() => {
    setPinConfiguredAt(initialPinConfiguredAt);
  }, [initialPinConfiguredAt]);

  const hasPin = Boolean(pinConfiguredAt);

  function refreshPinState(nextConfiguredAt: string | null) {
    setPinConfiguredAt(nextConfiguredAt);
    router.refresh();
  }

  function handleSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await setMyPinAction({
        newPin: setupNewPin,
        confirmPin: setupConfirmPin,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setSetupNewPin("");
      setSetupConfirmPin("");
      toast.success("PIN configurado com sucesso.");
      refreshPinState(new Date().toISOString());
    });
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await setMyPinAction({
        currentPin,
        newPin: changeNewPin,
        confirmPin: changeConfirmPin,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setCurrentPin("");
      setChangeNewPin("");
      setChangeConfirmPin("");
      setChangeOpen(false);
      toast.success("PIN alterado com sucesso.");
      refreshPinState(pinConfiguredAt ?? new Date().toISOString());
    });
  }

  function handleRemove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await removeMyPinAction({ currentPin: removeCurrentPin });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setRemoveCurrentPin("");
      setRemoveOpen(false);
      toast.success("PIN removido com sucesso.");
      refreshPinState(null);
    });
  }

  return (
    <Card id="pin" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          PIN de troca rápida
        </CardTitle>
        <CardDescription>
          Configure um PIN de 6 dígitos pra trocar de usuário rapidamente sem precisar
          fazer logout. Útil pra estabelecimentos com várias pessoas operando o mesmo
          computador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasPin ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <p className="text-sm font-medium">
                PIN configurado em {formatDate(pinConfiguredAt!)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Você pode trocar ou remover o PIN a qualquer momento.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangeOpen(true)}
                disabled={isPending}
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Trocar PIN
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setRemoveOpen(true)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remover PIN
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSetup} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <PinField
              id="new-pin"
              label="Novo PIN"
              value={setupNewPin}
              onChange={setSetupNewPin}
            />
            <PinField
              id="confirm-pin"
              label="Confirmar PIN"
              value={setupConfirmPin}
              onChange={setSetupConfirmPin}
            />
            <Button type="submit" disabled={isPending}>
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Configurando..." : "Configurar PIN"}
            </Button>
          </form>
        )}
      </CardContent>

      <Dialog
        open={changeOpen}
        onOpenChange={(open) => {
          setChangeOpen(open);
          if (!open) {
            setCurrentPin("");
            setChangeNewPin("");
            setChangeConfirmPin("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar PIN</DialogTitle>
            <DialogDescription>
              Informe o PIN atual e defina um novo PIN de 6 dígitos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChange} className="space-y-4">
            <PinField
              id="current-pin"
              label="PIN atual"
              value={currentPin}
              onChange={setCurrentPin}
            />
            <PinField
              id="change-new-pin"
              label="Novo PIN"
              value={changeNewPin}
              onChange={setChangeNewPin}
            />
            <PinField
              id="change-confirm-pin"
              label="Confirmar PIN"
              value={changeConfirmPin}
              onChange={setChangeConfirmPin}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChangeOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar PIN"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removeOpen}
        onOpenChange={(open) => {
          setRemoveOpen(open);
          if (!open) {
            setRemoveCurrentPin("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover PIN</DialogTitle>
            <DialogDescription>
              Confirme seu PIN atual para desativar a troca rápida neste usuário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRemove} className="space-y-4">
            <PinField
              id="remove-current-pin"
              label="PIN atual"
              value={removeCurrentPin}
              onChange={setRemoveCurrentPin}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRemoveOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Removendo..." : "Remover PIN"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PinField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        inputMode="numeric"
        maxLength={6}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(sanitizePin(event.target.value))}
        placeholder="6 dígitos"
      />
    </div>
  );
}
