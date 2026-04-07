"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TenantModule } from "@/generated/prisma/enums";
import {
  getDefaultModuleAccess,
  TENANT_MODULE_DEFINITIONS,
} from "@/lib/tenant-modules";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectValueLabel,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Headset,
  Pencil,
  Plus,
  Shield,
  Stethoscope,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  createTeamMemberAction,
  deactivateTeamMemberAction,
  updateTeamMemberAction,
} from "@/actions/team.actions";

type TeamRole = "ADMIN" | "RECEPTIONIST" | "PROFESSIONAL";

type TeamPermission = {
  module: TenantModule;
  label: string;
  description: string;
  group: "main" | "management" | "config";
  defaultAllowed: boolean;
  isAllowed: boolean;
  isCustomized: boolean;
};

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
  modulePermissions: TeamPermission[];
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

const permissionGroupLabels: Record<TeamPermission["group"], string> = {
  main: "Operação principal",
  management: "Gestão",
  config: "Clínico e configurações",
};

const roleSelectOptions = [
  { value: "ADMIN", label: "Administrador" },
  { value: "RECEPTIONIST", label: "Recepcionista" },
  { value: "PROFESSIONAL", label: "Profissional" },
] as const;

const statusSelectOptions = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

function buildDefaultPermissions(role: TeamRole): TeamPermission[] {
  const defaults = getDefaultModuleAccess(role);

  return TENANT_MODULE_DEFINITIONS.map((module) => ({
    module: module.key,
    label: module.label,
    description: module.description,
    group: module.group,
    defaultAllowed: defaults[module.key],
    isAllowed: defaults[module.key],
    isCustomized: false,
  }));
}

function syncPermissionCustomization(permission: TeamPermission, isAllowed: boolean): TeamPermission {
  return {
    ...permission,
    isAllowed,
    isCustomized: isAllowed !== permission.defaultAllowed,
  };
}

/**
 * Painel de equipe com criação, edição segura e desativação.
 * A edição reaproveita o mesmo registro de User/Professional para preservar históricos
 * e agora inclui refinamento de acesso por módulo no contexto do tenant.
 */
export function TeamPanel({
  members,
  currentUserId,
}: {
  members: TeamMember[];
  currentUserId: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isPending, startTransition] = useTransition();
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
  const [modulePermissions, setModulePermissions] = useState<TeamPermission[]>(
    buildDefaultPermissions("RECEPTIONIST")
  );

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
    setModulePermissions(buildDefaultPermissions("RECEPTIONIST"));
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
    setModulePermissions(member.modulePermissions);
    setShowModal(true);
  }

  function handleRoleChange(nextRole: TeamRole) {
    setRole(nextRole);
    setModulePermissions((current) => {
      const defaults = getDefaultModuleAccess(nextRole);

      if (current.length === 0) {
        return buildDefaultPermissions(nextRole);
      }

      return current.map((permission) =>
        syncPermissionCustomization(
          {
            ...permission,
            defaultAllowed: defaults[permission.module],
          },
          permission.isAllowed
        )
      );
    });
  }

  function resetPermissionsToRoleDefaults() {
    setModulePermissions(buildDefaultPermissions(role));
  }

  function toggleModulePermission(module: TenantModule) {
    setModulePermissions((current) =>
      current.map((permission) =>
        permission.module === module
          ? syncPermissionCustomization(permission, !permission.isAllowed)
          : permission
      )
    );
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

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        specialty: role === "PROFESSIONAL" ? specialty.trim() || undefined : undefined,
        commissionPercent:
          role === "PROFESSIONAL" && commissionPercent
            ? parseFloat(commissionPercent)
            : undefined,
        contractType: role === "PROFESSIONAL" ? contractType : undefined,
        registrationNumber:
          role === "PROFESSIONAL" ? registrationNumber.trim() || undefined : undefined,
        isActive,
        modulePermissions: modulePermissions.map((permission) => ({
          module: permission.module,
          isAllowed: permission.isAllowed,
        })),
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
          ? "Profissional atualizado com sucesso!"
          : "Membro criado com sucesso!"
      );
      setShowModal(false);
      resetForm();
      router.refresh();
    });
  }

  function handleDeactivate(member: TeamMember) {
    if (!confirm(`Deseja realmente desativar ${member.name}?`)) return;

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

  const permissionGroups = Object.entries(permissionGroupLabels).map(
    ([groupKey, groupLabel]) => ({
      groupKey: groupKey as TeamPermission["group"],
      groupLabel,
      permissions: modulePermissions.filter(
        (permission) => permission.group === groupKey
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
          <Plus className="h-4 w-4" />
          Novo Membro
        </Button>
      </div>

      <div className="grid gap-3">
        {members.map((member) => {
          const rc = roleConfig[member.role] ?? roleConfig.RECEPTIONIST;
          const RoleIcon = rc.icon;
          const enabledModulesCount = member.modulePermissions.filter(
            (permission) => permission.isAllowed
          ).length;

          return (
            <Card key={member.id}>
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
                      <RoleIcon className="h-3 w-3" />
                      {rc.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={member.isActive ? "text-emerald-700" : "text-muted-foreground"}
                    >
                      {member.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {enabledModulesCount} módulo{enabledModulesCount !== 1 ? "s" : ""}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(member)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {member.id !== currentUserId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeactivate(member)}
                      disabled={isPending}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@clinica.com"
                  />
                </div>

                {!editingMember ? (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Senha *</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
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

              {role === "PROFESSIONAL" ? (
                <div className="space-y-4 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Dados do profissional
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Especialidade</label>
                    <Input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
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
                        onChange={(e) => setCommissionPercent(e.target.value)}
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
                      onChange={(e) => setRegistrationNumber(e.target.value)}
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
                    O cargo define um padrão inicial, e você pode liberar ou restringir módulos
                    específicos para este usuário.
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
                {permissionGroups.map(({ groupKey, groupLabel, permissions }) => (
                  <div key={groupKey} className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {groupLabel}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {permissions.map((permission) => (
                        <label
                          key={permission.module}
                          className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border bg-background px-4 py-3 transition-colors hover:border-primary/30"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{permission.label}</span>
                              {permission.isCustomized ? (
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
                              {permission.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={
                                permission.isAllowed
                                  ? "text-xs font-medium text-emerald-600"
                                  : "text-xs font-medium text-muted-foreground"
                              }
                            >
                              {permission.isAllowed ? "Liberado" : "Bloqueado"}
                            </span>
                            <input
                              type="checkbox"
                              checked={permission.isAllowed}
                              onChange={() => toggleModulePermission(permission.module)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                          </div>
                        </label>
                      ))}
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
