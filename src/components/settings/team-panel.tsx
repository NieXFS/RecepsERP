"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
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

/**
 * Painel de equipe com criação, edição segura e desativação.
 * A edição reaproveita o mesmo registro de User/Professional para preservar históricos.
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
  const [role, setRole] = useState<"ADMIN" | "RECEPTIONIST" | "PROFESSIONAL">("RECEPTIONIST");
  const [specialty, setSpecialty] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [contractType, setContractType] = useState<"CLT" | "PJ">("PJ");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [isActive, setIsActive] = useState(true);

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
    setRole((member.role as typeof role) ?? "RECEPTIONIST");
    setSpecialty(member.professional?.specialty ?? "");
    setCommissionPercent(
      member.professional ? String(member.professional.commissionPercent) : ""
    );
    setContractType((member.professional?.contractType as "CLT" | "PJ") ?? "PJ");
    setRegistrationNumber(member.professional?.registrationNumber ?? "");
    setIsActive(member.isActive);
    setShowModal(true);
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

      toast.success(editingMember ? "Profissional atualizado com sucesso!" : "Membro criado com sucesso!");
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
                      {member.professional.specialty ?? "Profissional"} · {member.professional.contractType} ·
                      Comissão: {member.professional.commissionPercent}%
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Editar Membro da Equipe" : "Novo Membro da Equipe"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@clinica.com" />
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Telefone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cargo *</label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole((value as typeof role) ?? "RECEPTIONIST")}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium text-muted-foreground">Dados do Profissional</p>

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
                    <label className="text-sm font-medium">Taxa de Comissão (%)</label>
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
                      onValueChange={(value) => setContractType((value as "CLT" | "PJ") ?? "PJ")}
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
                  <label className="text-sm font-medium">Registro Profissional</label>
                  <Input
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="CRO, CREFITO, CRM, etc."
                  />
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando…" : editingMember ? "Salvar alterações" : "Criar membro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
