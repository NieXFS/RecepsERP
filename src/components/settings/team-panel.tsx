"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TenantModule } from "@/generated/prisma/enums";
import { TENANT_MODULE_DEFINITIONS } from "@/lib/tenant-modules";
import {
  FINANCIAL_SUBMODULE_DEFINITIONS,
  getDefaultCustomPermissions,
  MODULE_KEY_BY_TENANT_MODULE,
  type FinanceSubmoduleKey,
  type PermissionAction,
  type PermissionModuleKey,
  type PermissionScope,
  type TenantCustomPermissions,
} from "@/lib/tenant-permissions";
import { resetUserPinAction } from "@/actions/account.actions";
import {
  createTeamMemberAction,
  deactivateTeamMemberAction,
  updateTeamMemberAction,
} from "@/actions/team.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedList } from "@/components/ui/animated-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectValueLabel,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Headset,
  KeyRound,
  Pencil,
  Plus,
  Shield,
  Stethoscope,
  UserCheck,
  UserX,
} from "lucide-react";

type TeamRole = "ADMIN" | "RECEPTIONIST" | "PROFESSIONAL";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: TeamRole;
  isActive: boolean;
  createdAt: string;
  professional: {
    id: string;
    specialty: string | null;
    contractType: string;
    commissionPercent: number;
    registrationNumber: string | null;
    isActive: boolean;
  } | null;
  customPermissions: TenantCustomPermissions;
  allowedModules: TenantModule[];
};

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  ADMIN: {
    label: "Administrador",
    icon: Shield,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  RECEPTIONIST: {
    label: "Recepcionista",
    icon: Headset,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  PROFESSIONAL: {
    label: "Profissional",
    icon: Stethoscope,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
};

const permissionGroupLabels = {
  main: "Operação principal",
  management: "Gestão",
  config: "Clínico e configurações",
} as const;

const roleSelectOptions = [
  { value: "ADMIN", label: "Administrador" },
  { value: "RECEPTIONIST", label: "Recepcionista" },
  { value: "PROFESSIONAL", label: "Profissional" },
] as const;

const statusSelectOptions = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

function clonePermissions(permissions: TenantCustomPermissions): TenantCustomPermissions {
  return structuredClone(permissions);
}

function updateScope(scope: PermissionScope, action: PermissionAction, checked: boolean) {
  if (action === "edit") {
    scope.edit = checked;
    if (checked) {
      scope.view = true;
    }
    return;
  }

  scope.view = checked;
  if (!checked) {
    scope.edit = false;
  }
}

function getPermissionScope(
  permissions: TenantCustomPermissions,
  moduleKey: PermissionModuleKey,
  submoduleKey?: FinanceSubmoduleKey
): PermissionScope {
  if (moduleKey === "financeiro" && submoduleKey) {
    return permissions.financeiro.sub[submoduleKey];
  }

  return permissions[moduleKey];
}

function isScopeCustomized(scope: PermissionScope, defaults: PermissionScope) {
  return scope.view !== defaults.view || scope.edit !== defaults.edit;
}

function countAccessibleAreas(permissions: TenantCustomPermissions) {
  const moduleCount = TENANT_MODULE_DEFINITIONS.reduce((count, module) => {
    const moduleKey = MODULE_KEY_BY_TENANT_MODULE[module.key];
    return count + (getPermissionScope(permissions, moduleKey).view ? 1 : 0);
  }, 0);

  const financeSubCount = FINANCIAL_SUBMODULE_DEFINITIONS.reduce(
    (count, item) => count + (permissions.financeiro.sub[item.key].view ? 1 : 0),
    0
  );

  return moduleCount + financeSubCount;
}

/**
 * Painel de equipe com criação, edição segura e desativação.
 * Mantém o vínculo histórico do usuário e agora edita permissões granulares
 * com leitura/escrita por módulo e submódulo.
 */
export function TeamPanel({
  members,
  currentUserId,
  currentUserRole,
}: {
  members: TeamMember[];
  currentUserId: string;
  currentUserRole: TeamRole;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [resetPinMember, setResetPinMember] = useState<TeamMember | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    financeiro: true,
  });
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<TeamRole>("RECEPTIONIST");
  const [specialty, setSpecialty] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [contractType, setContractType] = useState<"CLT" | "PJ">("PJ");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [actsAsProfessional, setActsAsProfessional] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<TenantCustomPermissions>(
    getDefaultCustomPermissions("RECEPTIONIST")
  );

  const defaultPermissions = useMemo(() => getDefaultCustomPermissions(role), [role]);

  function resetForm() {
    setEditingMember(null);
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setRole("RECEPTIONIST");
    setSpecialty("");
    setCommissionPercent("");
    setContractType("PJ");
    setRegistrationNumber("");
    setIsActive(true);
    setActsAsProfessional(false);
    setCustomPermissions(getDefaultCustomPermissions("RECEPTIONIST"));
    setExpandedModules({ financeiro: true });
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(member: TeamMember) {
    setEditingMember(member);
    setName(member.name);
    setEmail(member.email);
    setPassword("");
    setPhone(member.phone ?? "");
    setRole(member.role);
    setSpecialty(member.professional?.specialty ?? "");
    setCommissionPercent(
      member.professional ? String(member.professional.commissionPercent) : ""
    );
    setContractType((member.professional?.contractType as "CLT" | "PJ") ?? "PJ");
    setRegistrationNumber(member.professional?.registrationNumber ?? "");
    setIsActive(member.isActive);
    setActsAsProfessional(member.role === "PROFESSIONAL" || Boolean(member.professional?.isActive));
    setCustomPermissions(clonePermissions(member.customPermissions));
    setExpandedModules({ financeiro: true });
    setShowModal(true);
  }

  function handleRoleChange(nextRole: TeamRole) {
    setRole(nextRole);
    setActsAsProfessional((current) => {
      if (nextRole === "PROFESSIONAL") {
        return true;
      }

      if (nextRole === "RECEPTIONIST") {
        return false;
      }

      return current;
    });
    setCustomPermissions(getDefaultCustomPermissions(nextRole));
  }

  function resetPermissionsToRoleDefaults() {
    setCustomPermissions(getDefaultCustomPermissions(role));
  }

  function toggleModulePermission(
    moduleKey: PermissionModuleKey,
    action: PermissionAction,
    checked: boolean
  ) {
    setCustomPermissions((current) => {
      const next = clonePermissions(current);
      updateScope(getPermissionScope(next, moduleKey), action, checked);

      if (moduleKey === "financeiro") {
        updateScope(next.financeiro.sub.geral, action, checked);
      }

      return next;
    });
  }

  function toggleFinancialSubPermission(
    submoduleKey: FinanceSubmoduleKey,
    action: PermissionAction,
    checked: boolean
  ) {
    setCustomPermissions((current) => {
      const next = clonePermissions(current);
      updateScope(getPermissionScope(next, "financeiro", submoduleKey), action, checked);
      return next;
    });
  }

  function toggleModuleExpansion(moduleKey: PermissionModuleKey) {
    setExpandedModules((current) => ({
      ...current,
      [moduleKey]: !current[moduleKey],
    }));
  }

  function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      toast.error("Nome e email são obrigatórios.");
      return;
    }

    if (!editingMember && password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    const shouldShowProfessionalFields =
      role === "PROFESSIONAL" || (role === "ADMIN" && actsAsProfessional);

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        actsAsProfessional,
        specialty: shouldShowProfessionalFields ? specialty.trim() || undefined : undefined,
        commissionPercent:
          shouldShowProfessionalFields && commissionPercent
            ? parseFloat(commissionPercent)
            : undefined,
        contractType: shouldShowProfessionalFields ? contractType : undefined,
        registrationNumber:
          shouldShowProfessionalFields ? registrationNumber.trim() || undefined : undefined,
        isActive,
        customPermissions,
      };

      const result = editingMember
        ? await updateTeamMemberAction(editingMember.id, payload)
        : await createTeamMemberAction({
            ...payload,
            password,
          });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        editingMember
          ? "Membro atualizado com sucesso!"
          : "Membro criado com sucesso!"
      );
      setShowModal(false);
      resetForm();
      router.refresh();
    });
  }

  function handleDeactivate(member: TeamMember) {
    if (!confirm(`Deseja realmente desativar ${member.name}?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deactivateTeamMemberAction(member.id);
      if (result.success) {
        toast.success(`${member.name} foi desativado.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleResetPin() {
    if (!resetPinMember) {
      return;
    }

    startTransition(async () => {
      const result = await resetUserPinAction({ userId: resetPinMember.id });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`PIN de ${resetPinMember.name} resetado.`);
      setResetPinMember(null);
      router.refresh();
    });
  }

  const shouldShowProfessionalFields =
    role === "PROFESSIONAL" || (role === "ADMIN" && actsAsProfessional);
  const canResetUserPins = currentUserRole === "ADMIN";

  const permissionGroups = Object.entries(permissionGroupLabels).map(
    ([groupKey, groupLabel]) => ({
      groupKey,
      groupLabel,
      modules: TENANT_MODULE_DEFINITIONS.filter((module) => module.group === groupKey).map(
        (module) => ({
          ...module,
          permissionKey: MODULE_KEY_BY_TENANT_MODULE[module.key],
        })
      ),
    })
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {members.length} membro{members.length !== 1 ? "s" : ""} na equipe
        </p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo Membro
        </Button>
      </div>

      <AnimatedList className="grid gap-3" stagger={40}>
        {members.map((member) => {
          const rc = roleConfig[member.role] ?? roleConfig.RECEPTIONIST;
          const RoleIcon = rc.icon;
          const enabledAreasCount = countAccessibleAreas(member.customPermissions);

          return (
            <Card key={member.id} className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{member.name}</p>
                    <Badge className={`gap-1 text-xs ${rc.color}`} variant="outline">
                      <RoleIcon className="h-3 w-3" aria-hidden="true" />
                      {rc.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={member.isActive ? "text-emerald-700" : "text-muted-foreground"}
                    >
                      {member.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {enabledAreasCount} acesso{enabledAreasCount !== 1 ? "s" : ""}
                    </Badge>
                    {member.id === currentUserId ? (
                      <Badge variant="outline" className="text-xs">
                        Você
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  {member.phone ? (
                    <p className="text-xs text-muted-foreground">{member.phone}</p>
                  ) : null}
                  {member.professional ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {member.professional.specialty ?? "Profissional"} ·{" "}
                      {member.professional.contractType} · Comissão:{" "}
                      {member.professional.commissionPercent}%
                      {member.professional.registrationNumber
                        ? ` · Registro: ${member.professional.registrationNumber}`
                        : ""}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {canResetUserPins && member.id !== currentUserId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResetPinMember(member)}
                      disabled={isPending}
                    >
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      Resetar PIN
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(member)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  {member.id !== currentUserId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeactivate(member)}
                      disabled={isPending}
                    >
                      <UserX className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </AnimatedList>

      <Dialog
        open={Boolean(resetPinMember)}
        onOpenChange={(open) => {
          if (!open) {
            setResetPinMember(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar PIN</DialogTitle>
            <DialogDescription>
              Resetar o PIN de {resetPinMember?.name}? Ele(a) precisará configurar um
              novo PIN no próximo login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetPinMember(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleResetPin}
              disabled={isPending}
            >
              {isPending ? "Resetando..." : "Resetar PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] sm:max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Editar membro da equipe" : "Novo membro da equipe"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
              <div>
                <h3 className="text-sm font-semibold">Dados cadastrais</h3>
                <p className="text-xs text-muted-foreground">
                  Atualize o cadastro base sem recriar o usuário nem perder histórico.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@clinica.com"
                  />
                </div>

                {!editingMember ? (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Senha *</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Cargo *</label>
                  <Select value={role} onValueChange={(value) => handleRoleChange(value as TeamRole)}>
                    <SelectTrigger className="w-full">
                      <SelectValueLabel value={role} options={roleSelectOptions} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="RECEPTIONIST">Recepcionista</SelectItem>
                      <SelectItem value="PROFESSIONAL">Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={isActive ? "ACTIVE" : "INACTIVE"}
                    onValueChange={(value) => setIsActive(value === "ACTIVE")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValueLabel
                        value={isActive ? "ACTIVE" : "INACTIVE"}
                        options={statusSelectOptions}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">
                        <span className="flex items-center gap-2">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          Ativo
                        </span>
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        <span className="flex items-center gap-2">
                          <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                          Inativo
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {role === "ADMIN" ? (
                <div className="rounded-lg border bg-background p-4">
                  <label
                    htmlFor="acts-as-professional"
                    className="flex cursor-pointer items-start gap-3"
                  >
                    <input
                      id="acts-as-professional"
                      type="checkbox"
                      checked={actsAsProfessional}
                      onChange={(event) => setActsAsProfessional(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Este administrador tambem realiza atendimentos
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Quando ativado, o administrador ganha perfil assistencial, pode aparecer na
                        agenda e ser vinculado aos servicos.
                      </p>
                    </div>
                  </label>
                </div>
              ) : null}

              {shouldShowProfessionalFields ? (
                <div className="space-y-4 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Dados do profissional
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Especialidade</label>
                    <Input
                      value={specialty}
                      onChange={(event) => setSpecialty(event.target.value)}
                      placeholder="Ex: Esteticista, Barbeiro, Dentista"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Taxa de comissão (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={commissionPercent}
                        onChange={(event) => setCommissionPercent(event.target.value)}
                        placeholder="Ex: 40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Contrato</label>
                      <Select
                        value={contractType}
                        onValueChange={(value) =>
                          setContractType((value as "CLT" | "PJ") ?? "PJ")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PJ">PJ</SelectItem>
                          <SelectItem value="CLT">CLT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Registro profissional</label>
                    <Input
                      value={registrationNumber}
                      onChange={(event) => setRegistrationNumber(event.target.value)}
                      placeholder="CRO, CREFITO, CRM, etc."
                    />
                  </div>
                </div>
              ) : null}
            </section>

            <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Permissões de acesso</h3>
                  <p className="text-xs text-muted-foreground">
                    Defina separadamente o que a pessoa pode visualizar e o que pode editar ou criar.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetPermissionsToRoleDefaults}
                  disabled={isPending}
                >
                  Usar padrão do cargo
                </Button>
              </div>

              {editingMember?.id === currentUserId ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                  Alterações no seu próprio acesso passam por proteções para evitar bloqueio do
                  admin atual.
                </div>
              ) : null}

              <div className="space-y-5">
                {permissionGroups.map(({ groupKey, groupLabel, modules }) => (
                  <div key={groupKey} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {groupLabel}
                    </p>

                    <div className="grid gap-3">
                      {modules.map((module) => {
                        const permissionKey = module.permissionKey;
                        const scope = getPermissionScope(customPermissions, permissionKey);
                        const defaultScope = getPermissionScope(defaultPermissions, permissionKey);
                        const customized = isScopeCustomized(scope, defaultScope);
                        const hasSubmodules = permissionKey === "financeiro";
                        const isExpanded = expandedModules[permissionKey] ?? false;

                        return (
                          <div
                            key={module.key}
                            className="rounded-xl border bg-background px-4 py-3"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium">{module.label}</span>
                                  {customized ? (
                                    <Badge variant="outline" className="text-[10px]">
                                      Personalizado
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Padrão do cargo
                                    </Badge>
                                  )}
                                  {hasSubmodules ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => toggleModuleExpansion(permissionKey)}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-3.5 w-3.5" />
                                      ) : (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      )}
                                      Subáreas
                                    </Button>
                                  ) : null}
                                </div>
                                <p className="text-xs leading-5 text-muted-foreground">
                                  {module.description}
                                </p>
                              </div>

                              <PermissionCheckboxGroup
                                viewChecked={scope.view}
                                editChecked={scope.edit}
                                disabled={isPending}
                                onToggleView={(checked) =>
                                  toggleModulePermission(permissionKey, "view", checked)
                                }
                                onToggleEdit={(checked) =>
                                  toggleModulePermission(permissionKey, "edit", checked)
                                }
                              />
                            </div>

                            {hasSubmodules && isExpanded ? (
                              <div className="mt-4 space-y-2 border-t pt-4">
                                {FINANCIAL_SUBMODULE_DEFINITIONS.map((submodule) => {
                                  const subScope = getPermissionScope(
                                    customPermissions,
                                    "financeiro",
                                    submodule.key
                                  );
                                  const defaultSubScope = getPermissionScope(
                                    defaultPermissions,
                                    "financeiro",
                                    submodule.key
                                  );
                                  const subCustomized = isScopeCustomized(
                                    subScope,
                                    defaultSubScope
                                  );

                                  return (
                                    <div
                                      key={submodule.key}
                                      className="rounded-lg border bg-muted/10 px-3 py-3"
                                    >
                                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium">
                                              {submodule.label}
                                            </span>
                                            {subCustomized ? (
                                              <Badge variant="outline" className="text-[10px]">
                                                Personalizado
                                              </Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-[10px]">
                                                Padrão do cargo
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs leading-5 text-muted-foreground">
                                            {submodule.description}
                                          </p>
                                        </div>

                                        <PermissionCheckboxGroup
                                          viewChecked={subScope.view}
                                          editChecked={subScope.edit}
                                          disabled={isPending}
                                          onToggleView={(checked) =>
                                            toggleFinancialSubPermission(
                                              submodule.key,
                                              "view",
                                              checked
                                            )
                                          }
                                          onToggleEdit={(checked) =>
                                            toggleFinancialSubPermission(
                                              submodule.key,
                                              "edit",
                                              checked
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? "Salvando..."
                : editingMember
                  ? "Salvar alterações"
                  : "Criar membro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PermissionCheckboxGroup({
  viewChecked,
  editChecked,
  disabled,
  onToggleView,
  onToggleEdit,
}: {
  viewChecked: boolean;
  editChecked: boolean;
  disabled: boolean;
  onToggleView: (checked: boolean) => void;
  onToggleEdit: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 lg:justify-end">
      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <input
          type="checkbox"
          checked={viewChecked}
          onChange={(event) => onToggleView(event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        Visualizar
      </label>
      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <input
          type="checkbox"
          checked={editChecked}
          onChange={(event) => onToggleEdit(event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        Editar/Criar
      </label>
    </div>
  );
}
