"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { addClinicalNoteAction, uploadCustomerMediaAction } from "@/actions/customer.actions";
import {
  FileText,
  Image as ImageIcon,
  DollarSign,
  ClipboardList,
  Plus,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  Upload,
  Lock,
  Package,
  CreditCard,
  Calendar,
} from "lucide-react";

// ============================================================
// TIPOS
// ============================================================

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  professionalName: string;
  professionalSpecialty: string | null;
  roomName: string | null;
  totalPrice: number;
  services: string[];
  notes: string | null;
};

type ClinicalRecord = {
  id: string;
  formTitle: string;
  notes: string | null;
  answers: Record<string, unknown>;
  createdAt: string;
};

type MediaItem = {
  id: string;
  url: string;
  fileType: string;
  fileName: string | null;
  description: string | null;
  category: string | null;
  createdAt: string;
};

type CustomerPackageItem = {
  id: string;
  packageName: string;
  packagePrice: number;
  totalSessions: number;
  usedSessions: number;
  isActive: boolean;
  purchaseDate: string;
  expiresAt: string | null;
};

type TransactionItem = {
  id: string;
  type: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  description: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  paidAt: string | null;
  createdAt: string;
};

type ClientTabsProps = {
  customerId: string;
  userRole: string;
  appointments: Appointment[];
  clinicalRecords: ClinicalRecord[];
  media: MediaItem[];
  packages: CustomerPackageItem[];
  transactions: TransactionItem[];
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

/**
 * Componente de abas do perfil do cliente (Client Component).
 * 4 abas: Resumo, Prontuário Clínico, Galeria de Fotos, Financeiro & Pacotes.
 * RBAC: RECEPTIONIST não vê conteúdo do Prontuário Clínico.
 */
export function ClientTabs({
  customerId,
  userRole,
  appointments,
  clinicalRecords,
  media,
  packages,
  transactions,
}: ClientTabsProps) {
  const canSeeClinical = userRole === "ADMIN" || userRole === "PROFESSIONAL";

  return (
    <Tabs defaultValue="resumo" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="resumo" className="gap-1.5 text-xs sm:text-sm">
          <ClipboardList className="h-4 w-4 hidden sm:block" />
          Resumo
        </TabsTrigger>
        <TabsTrigger value="prontuario" className="gap-1.5 text-xs sm:text-sm">
          <Stethoscope className="h-4 w-4 hidden sm:block" />
          Prontuário
        </TabsTrigger>
        <TabsTrigger value="galeria" className="gap-1.5 text-xs sm:text-sm">
          <ImageIcon className="h-4 w-4 hidden sm:block" />
          Galeria
        </TabsTrigger>
        <TabsTrigger value="financeiro" className="gap-1.5 text-xs sm:text-sm">
          <DollarSign className="h-4 w-4 hidden sm:block" />
          Financeiro
        </TabsTrigger>
      </TabsList>

      {/* ---- ABA RESUMO ---- */}
      <TabsContent value="resumo" className="mt-4">
        <TabResumo appointments={appointments} />
      </TabsContent>

      {/* ---- ABA PRONTUÁRIO ---- */}
      <TabsContent value="prontuario" className="mt-4">
        {canSeeClinical ? (
          <TabProntuario
            customerId={customerId}
            appointments={appointments.filter((a) => a.status === "COMPLETED")}
            clinicalRecords={clinicalRecords}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Lock className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">Acesso Restrito</p>
              <p className="text-xs">Apenas profissionais e administradores podem ver prontuários.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* ---- ABA GALERIA ---- */}
      <TabsContent value="galeria" className="mt-4">
        <TabGaleria customerId={customerId} media={media} />
      </TabsContent>

      {/* ---- ABA FINANCEIRO ---- */}
      <TabsContent value="financeiro" className="mt-4">
        <TabFinanceiro packages={packages} transactions={transactions} />
      </TabsContent>
    </Tabs>
  );
}

// ============================================================
// ABA RESUMO — Timeline de todos os atendimentos
// ============================================================

function TabResumo({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">Nenhum atendimento registrado ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Atendimentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Linha vertical da timeline */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-6">
            {appointments.map((apt) => {
              const date = new Date(apt.startTime);
              const dateLabel = date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const timeLabel = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

              return (
                <div key={apt.id} className="relative pl-10">
                  {/* Dot da timeline */}
                  <div className={`absolute left-[10px] top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                    apt.status === "COMPLETED" ? "bg-emerald-500" :
                    apt.status === "CANCELLED" ? "bg-red-400" :
                    "bg-primary"
                  }`} />

                  <div className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{dateLabel}</span>
                        <span className="text-xs text-muted-foreground">{timeLabel}</span>
                        <StatusBadge status={apt.status} />
                      </div>
                      {apt.totalPrice > 0 && (
                        <span className="text-sm font-medium">
                          R$ {apt.totalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {apt.professionalName}
                        {apt.professionalSpecialty && ` · ${apt.professionalSpecialty}`}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {apt.services.map((svc, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {svc}
                        </Badge>
                      ))}
                    </div>

                    {apt.notes && (
                      <p className="mt-2 text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                        {apt.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ABA PRONTUÁRIO — Evolução clínica + adicionar notas
// ============================================================

function TabProntuario({
  customerId,
  appointments,
  clinicalRecords,
}: {
  customerId: string;
  appointments: Appointment[];
  clinicalRecords: ClinicalRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");

  /** Salva nota de evolução clínica via Server Action */
  function handleSaveNote() {
    if (!noteText.trim()) {
      toast.error("Digite o conteúdo da evolução.");
      return;
    }

    startTransition(async () => {
      const result = await addClinicalNoteAction(customerId, noteText);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Evolução clínica registrada.");
      setNoteText("");
      setShowNoteForm(false);
      router.refresh();
    });
  }

  // Mescla atendimentos finalizados + notas clínicas em uma timeline unificada
  type TimelineItem =
    | { type: "appointment"; date: string; data: Appointment }
    | { type: "clinical"; date: string; data: ClinicalRecord };

  const timeline: TimelineItem[] = [
    ...appointments.map((a) => ({ type: "appointment" as const, date: a.startTime, data: a })),
    ...clinicalRecords.map((r) => ({ type: "clinical" as const, date: r.createdAt, data: r })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {/* Botão adicionar evolução */}
      <div className="flex justify-end">
        <Button onClick={() => setShowNoteForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Evolução
        </Button>
      </div>

      {/* Formulário de evolução (colapsável) */}
      {showNoteForm && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="font-semibold">Nova Evolução Clínica</Label>
            <Textarea
              placeholder="Descreva o atendimento realizado, observações clínicas, procedimentos aplicados..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowNoteForm(false); setNoteText(""); }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveNote} disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar Evolução"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline unificada */}
      {timeline.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Stethoscope className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Nenhum registro clínico encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Linha do Tempo Clínica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-5">
                {timeline.map((item, idx) => {
                  const date = new Date(item.date);
                  const dateLabel = date.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const timeLabel = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

                  if (item.type === "clinical") {
                    return (
                      <div key={`c-${item.data.id}`} className="relative pl-10">
                        <div className="absolute left-[10px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                        <div className="rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">{item.data.formTitle}</span>
                            <span className="text-xs text-muted-foreground">{dateLabel} {timeLabel}</span>
                          </div>
                          {item.data.notes && (
                            <p className="text-sm whitespace-pre-wrap">{item.data.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Atendimento finalizado
                  return (
                    <div key={`a-${item.data.id}`} className="relative pl-10">
                      <div className="absolute left-[10px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-semibold">{dateLabel}</span>
                          <span className="text-xs text-muted-foreground">{timeLabel}</span>
                          <span className="text-xs text-muted-foreground">
                            · {item.data.professionalName}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {item.data.services.map((svc, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{svc}</Badge>
                          ))}
                        </div>
                        {item.data.notes && (
                          <p className="mt-2 text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                            {item.data.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// ABA GALERIA — Fotos antes/depois + upload
// ============================================================

function TabGaleria({ customerId, media }: { customerId: string; media: MediaItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Processa arquivo selecionado e gera preview */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione apenas arquivos de imagem.");
      return;
    }

    // Limita a 2MB para base64 local (em produção, upload direto para bucket)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB para armazenamento local.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  /** Envia a foto via Server Action */
  function handleUpload() {
    if (!selectedFile || !preview) {
      toast.error("Selecione uma imagem.");
      return;
    }

    startTransition(async () => {
      // Extrai o base64 puro (remove o prefixo "data:image/...;base64,")
      const base64 = preview.split(",")[1];

      const result = await uploadCustomerMediaAction(customerId, {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        description: description || undefined,
        category: category || undefined,
        base64Data: base64,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Foto adicionada ao prontuário.");
      resetUploadForm();
      setUploadOpen(false);
      router.refresh();
    });
  }

  function resetUploadForm() {
    setSelectedFile(null);
    setPreview(null);
    setDescription("");
    setCategory("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const CATEGORY_LABELS: Record<string, string> = {
    BEFORE: "Antes",
    AFTER: "Depois",
    DOCUMENT: "Documento",
    XRAY: "Raio-X",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Fazer Upload
        </Button>
      </div>

      {media.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ImageIcon className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Nenhuma foto registrada para este paciente.</p>
            <p className="text-xs mt-1">Adicione fotos de antes/depois para acompanhar a evolução.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {media.map((item) => {
            const date = new Date(item.createdAt).toLocaleDateString("pt-BR");
            const catLabel = item.category ? CATEGORY_LABELS[item.category] ?? item.category : null;

            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  {item.url.startsWith("data:image") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.description ?? "Foto do paciente"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-12 w-12 opacity-30" />
                    </div>
                  )}
                  {catLabel && (
                    <Badge className="absolute top-2 right-2 text-[10px]">
                      {catLabel}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  {item.description && (
                    <p className="text-sm truncate">{item.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---- Dialog de Upload ---- */}
      <Dialog open={uploadOpen} onOpenChange={(v) => { if (!isPending) { setUploadOpen(v); if (!v) resetUploadForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload de Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview da imagem */}
            {preview ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Clique para selecionar</span>
                <span className="text-xs text-muted-foreground">(max. 2MB)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}

            {preview && (
              <Button variant="outline" size="sm" onClick={resetUploadForm} className="w-full">
                Trocar imagem
              </Button>
            )}

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEFORE">Antes</SelectItem>
                  <SelectItem value="AFTER">Depois</SelectItem>
                  <SelectItem value="DOCUMENT">Documento</SelectItem>
                  <SelectItem value="XRAY">Raio-X</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Antes — Harmonização facial"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); resetUploadForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={isPending || !selectedFile}>
              {isPending ? "Enviando..." : "Salvar Foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// ABA FINANCEIRO — Pacotes + Transações
// ============================================================

function TabFinanceiro({
  packages,
  transactions,
}: {
  packages: CustomerPackageItem[];
  transactions: TransactionItem[];
}) {
  const PAYMENT_LABELS: Record<string, string> = {
    CASH: "Dinheiro",
    CREDIT_CARD: "Crédito",
    DEBIT_CARD: "Débito",
    PIX: "PIX",
    BANK_TRANSFER: "Transferência",
    BOLETO: "Boleto",
    OTHER: "Outro",
  };

  const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    PAID: { label: "Pago", variant: "default" },
    PENDING: { label: "Pendente", variant: "outline" },
    OVERDUE: { label: "Vencido", variant: "destructive" },
    CANCELLED: { label: "Cancelado", variant: "secondary" },
    REFUNDED: { label: "Estornado", variant: "secondary" },
  };

  return (
    <div className="space-y-6">
      {/* ---- PACOTES ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Pacotes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum pacote comprado.
            </p>
          ) : (
            <div className="space-y-4">
              {packages.map((pkg) => {
                const progressPercent = pkg.totalSessions > 0
                  ? Math.round((pkg.usedSessions / pkg.totalSessions) * 100)
                  : 0;
                const remaining = pkg.totalSessions - pkg.usedSessions;
                const purchaseDate = new Date(pkg.purchaseDate).toLocaleDateString("pt-BR");
                const expiresLabel = pkg.expiresAt
                  ? new Date(pkg.expiresAt).toLocaleDateString("pt-BR")
                  : "Sem expiração";

                return (
                  <div key={pkg.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-sm">{pkg.packageName}</p>
                        <p className="text-xs text-muted-foreground">
                          Compra: {purchaseDate} · Validade: {expiresLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive ? "Ativo" : "Encerrado"}
                        </Badge>
                        <span className="text-sm font-medium">
                          R$ {pkg.packagePrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar do pacote */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{pkg.usedSessions} de {pkg.totalSessions} sessões usadas</span>
                        <span>{remaining} restante(s)</span>
                      </div>
                      <Progress value={progressPercent} className="h-2.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- TRANSAÇÕES ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Histórico de Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma transação registrada.
            </p>
          ) : (
            <div className="divide-y">
              {transactions.map((txn) => {
                const date = new Date(txn.createdAt).toLocaleDateString("pt-BR");
                const statusInfo = STATUS_LABELS[txn.paymentStatus] ?? { label: txn.paymentStatus, variant: "outline" as const };
                const installmentLabel = txn.totalInstallments && txn.totalInstallments > 1
                  ? ` (${txn.installmentNumber}/${txn.totalInstallments})`
                  : "";

                return (
                  <div key={txn.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        {txn.description ?? "Pagamento"}
                        {installmentLabel}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{date}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {PAYMENT_LABELS[txn.paymentMethod] ?? txn.paymentMethod}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusInfo.variant} className="text-xs">
                        {statusInfo.label}
                      </Badge>
                      <span className={`text-sm font-semibold ${txn.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {txn.type === "INCOME" ? "+" : "-"} R$ {txn.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    SCHEDULED: { label: "Agendado", variant: "outline" },
    CONFIRMED: { label: "Confirmado", variant: "secondary" },
    CHECKED_IN: { label: "Check-in", variant: "secondary" },
    IN_PROGRESS: { label: "Em Atendimento", variant: "default" },
    COMPLETED: { label: "Finalizado", variant: "default" },
    CANCELLED: { label: "Cancelado", variant: "destructive" },
    NO_SHOW: { label: "Não compareceu", variant: "destructive" },
  };
  const c = config[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={c.variant} className="text-[10px]">{c.label}</Badge>;
}
