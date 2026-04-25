"use client";

import {
  type FormEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  KeyRound,
  Loader2,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  listSwitchableUsersAction,
  switchActiveUserAction,
  switchBackToMasterAction,
  type SwitchableUser,
} from "@/actions/account.actions";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChipUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
};

type UserAccountChipProps = {
  tenantName: string;
  currentUser: ChipUser & { hasPin: boolean };
  masterUser: ChipUser;
};

type DropdownMode = "list" | "pin-entry";

function sanitizePin(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function UserAccountChip({
  tenantName,
  currentUser,
  masterUser,
}: UserAccountChipProps) {
  const router = useRouter();
  const pinInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DropdownMode>("list");
  const [users, setUsers] = useState<SwitchableUser[]>([]);
  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [targetUser, setTargetUser] = useState<SwitchableUser | null>(null);
  const [pin, setPin] = useState("");
  const [retryAfterSec, setRetryAfterSec] = useState<number | null>(null);

  const isDelegated = currentUser.id !== masterUser.id;
  const visibleUsers = isDelegated
    ? users.filter((user) => user.id !== masterUser.id)
    : users;
  const pinDisabled = isSwitching || retryAfterSec !== null;

  useEffect(() => {
    if (mode === "pin-entry") {
      pinInputRef.current?.focus();
    }
  }, [mode, targetUser]);

  useEffect(() => {
    if (retryAfterSec === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRetryAfterSec((current) => {
        if (current === null || current <= 1) {
          return null;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [retryAfterSec]);

  async function loadUsers() {
    if (hasLoadedUsers || isLoadingUsers) {
      return;
    }

    setIsLoadingUsers(true);
    try {
      const nextUsers = await listSwitchableUsersAction();
      setUsers(nextUsers);
      setHasLoadedUsers(true);
    } catch {
      toast.error("Não foi possível carregar os usuários.");
    } finally {
      setIsLoadingUsers(false);
    }
  }

  function resetPinEntry() {
    setMode("list");
    setTargetUser(null);
    setPin("");
    setRetryAfterSec(null);
    setIsSwitching(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      void loadUsers();
      return;
    }

    resetPinEntry();
  }

  function openPinEntry(user: SwitchableUser) {
    if (user.id === currentUser.id) {
      return;
    }

    setTargetUser(user);
    setPin("");
    setRetryAfterSec(null);
    setMode("pin-entry");
  }

  async function handleSwitchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!targetUser || pin.length < 6 || pinDisabled) {
      return;
    }

    setIsSwitching(true);
    const result = await switchActiveUserAction({
      targetUserId: targetUser.id,
      pin,
    });
    setIsSwitching(false);

    if (result.success) {
      setOpen(false);
      resetPinEntry();
      toast.success(`Agora você está como ${result.activeUser.name}.`);
      router.refresh();
      return;
    }

    toast.error(result.error);
    setPin("");

    if (result.retryAfterSec) {
      setRetryAfterSec(result.retryAfterSec);
    }

    requestAnimationFrame(() => pinInputRef.current?.focus());
  }

  async function handleSwitchBackToMaster() {
    setIsSwitching(true);
    const result = await switchBackToMasterAction();
    setIsSwitching(false);

    if (result.success) {
      setOpen(false);
      resetPinEntry();
      toast.success(`Você voltou para ${masterUser.name}.`);
      router.refresh();
    }
  }

  async function handleLogout() {
    try {
      await switchBackToMasterAction();
    } finally {
      await signOut({ callbackUrl: "/login" });
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={
              "inline-flex min-w-0 max-w-[min(26rem,calc(100vw-6rem))] items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5 " +
              "transition-all duration-[180ms] hover:bg-[rgba(139,92,246,0.06)] hover:shadow-[0_8px_28px_rgba(139,92,246,0.16)] " +
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-[rgba(139,92,246,0.08)]"
            }
            title={`${tenantName} • ${currentUser.name}`}
          >
            <UserAvatar
              name={currentUser.name}
              avatarUrl={currentUser.avatarUrl}
              showOnline
            />
            <span className="flex min-w-0 flex-col text-left leading-[1.15]">
              <span className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {tenantName}
              </span>
              <span className="mt-px truncate text-[13.5px] font-bold tracking-normal text-foreground">
                {currentUser.name}
              </span>
            </span>
            <ChevronsUpDown
              aria-hidden="true"
              className="ml-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70"
            />
          </button>
        }
      />
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-[22rem] max-w-[calc(100vw-2rem)] p-2"
      >
        {mode === "pin-entry" && targetUser ? (
          <PinEntryView
            targetUser={targetUser}
            pin={pin}
            disabled={pinDisabled}
            isSwitching={isSwitching}
            retryAfterSec={retryAfterSec}
            inputRef={pinInputRef}
            onPinChange={setPin}
            onCancel={resetPinEntry}
            onSubmit={handleSwitchSubmit}
          />
        ) : (
          <>
            <div className="px-2 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Trocar usuário
            </div>

            <div className="max-h-72 space-y-1 overflow-y-auto">
              {isDelegated ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleSwitchBackToMaster()}
                    disabled={isSwitching}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-60"
                  >
                    <UserAvatar
                      name={masterUser.name}
                      avatarUrl={masterUser.avatarUrl}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        Voltar para {masterUser.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Master da sessão
                      </span>
                    </span>
                    {isSwitching ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <DropdownMenuSeparator />
                </>
              ) : null}

              {isLoadingUsers ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  Carregando usuários...
                </div>
              ) : null}

              {!isLoadingUsers && hasLoadedUsers && visibleUsers.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  Nenhum usuário ativo encontrado.
                </div>
              ) : null}

              {visibleUsers.map((user) => {
                const isCurrent = user.id === currentUser.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => openPinEntry(user)}
                    disabled={isCurrent}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      isCurrent && "cursor-default hover:bg-transparent disabled:opacity-100"
                    )}
                    aria-current={isCurrent ? "true" : undefined}
                  >
                    <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{user.name}</span>
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            atual
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {roleLabel(user.role)}
                        </span>
                        <Badge
                          variant={user.hasPin ? "secondary" : "outline"}
                          className="h-4 px-1.5 text-[10px]"
                        >
                          {user.hasPin ? "PIN configurado" : "Sem PIN"}
                        </Badge>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <DropdownMenuSeparator />
            {!currentUser.hasPin ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/configuracoes/conta#pin");
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <span>Configurar meu PIN</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <span>Sair</span>
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PinEntryView({
  targetUser,
  pin,
  disabled,
  isSwitching,
  retryAfterSec,
  inputRef,
  onPinChange,
  onCancel,
  onSubmit,
}: {
  targetUser: SwitchableUser;
  pin: string;
  disabled: boolean;
  isSwitching: boolean;
  retryAfterSec: number | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onPinChange: (pin: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center gap-3 px-2 pt-1">
        <UserAvatar name={targetUser.name} avatarUrl={targetUser.avatarUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Entrar como {targetUser.name}</p>
          <p className="text-xs text-muted-foreground">Digite o PIN de 6 dígitos</p>
        </div>
      </div>

      <div className="space-y-2 px-2">
        <Input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoComplete="off"
          value={pin}
          disabled={disabled}
          onChange={(event) => onPinChange(sanitizePin(event.target.value))}
          onKeyDown={(event) => event.stopPropagation()}
          placeholder="••••••"
          className="h-10 text-center text-lg font-semibold tracking-[0.18em]"
        />
        {retryAfterSec !== null ? (
          <p className="text-center text-xs font-medium text-destructive">
            Tente novamente em {retryAfterSec}s
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 px-2 pb-1">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pin.length < 6 || disabled}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Confirmar
        </button>
      </div>
    </form>
  );
}

function UserAvatar({
  name,
  avatarUrl,
  size = "default",
  showOnline = false,
}: {
  name: string;
  avatarUrl: string | null;
  size?: "default" | "sm";
  showOnline?: boolean;
}) {
  return (
    <Avatar size={size} className={size === "sm" ? "h-6 w-6" : "h-8 w-8"}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className="bg-[linear-gradient(135deg,#8B5CF6_0%,#6223CF_100%)] text-xs font-bold text-white">
        {getInitial(name)}
      </AvatarFallback>
      {showOnline ? <AvatarBadge className="h-2 w-2 bg-emerald-500" /> : null}
    </Avatar>
  );
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "R";
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: "Admin",
    RECEPTIONIST: "Recepcionista",
    PROFESSIONAL: "Profissional",
  };
  return labels[role] ?? role;
}
