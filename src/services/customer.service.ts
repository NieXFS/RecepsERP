import { db } from "@/lib/db";
import type { ActionResult } from "@/types";

/**
 * Lista todos os clientes do tenant com busca por nome/telefone/email.
 * Retorna dados resumidos para a tabela de listagem com LTV e visitas.
 */
export async function listCustomers(
  tenantId: string,
  search?: string
) {
  const where: Record<string, unknown> = { tenantId, deletedAt: null };

  if (search && search.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { phone: { contains: search.trim(), mode: "insensitive" } },
      { email: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    orderBy: { name: "asc" },
    take: 200,
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    totalSpent: Number(c.totalSpent),
    visitCount: c.visitCount,
    createdAt: c.createdAt.toISOString(),
  }));
}

/**
 * Busca o perfil completo de um cliente para a página de detalhes.
 * Retorna dados demográficos, estatísticas e todos os relacionamentos.
 */
export async function getCustomerProfile(tenantId: string, customerId: string) {
  const customer = await db.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
  });

  if (!customer) return null;

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    document: customer.document,
    birthDate: customer.birthDate?.toISOString() ?? null,
    gender: customer.gender,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zipCode: customer.zipCode,
    notes: customer.notes,
    totalSpent: Number(customer.totalSpent),
    visitCount: customer.visitCount,
    createdAt: customer.createdAt.toISOString(),
  };
}

/**
 * Busca o histórico de atendimentos finalizados de um cliente
 * ordenado do mais recente ao mais antigo (timeline).
 */
export async function getCustomerAppointments(tenantId: string, customerId: string) {
  const appointments = await db.appointment.findMany({
    where: { tenantId, customerId },
    include: {
      professional: { select: { user: { select: { name: true } }, specialty: true } },
      services: { include: { service: { select: { name: true } } } },
      room: { select: { name: true } },
    },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  return appointments.map((a) => ({
    id: a.id,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status,
    professionalName: a.professional.user.name,
    professionalSpecialty: a.professional.specialty,
    roomName: a.room?.name ?? null,
    totalPrice: Number(a.totalPrice),
    services: a.services.map((s) => s.service.name),
    notes: a.notes,
  }));
}

/**
 * Busca registros de prontuário/anamnese do cliente (notas clínicas + evolução).
 */
export async function getCustomerClinicalRecords(tenantId: string, customerId: string) {
  const records = await db.anamnesisRecord.findMany({
    where: { tenantId, customerId },
    include: {
      form: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return records.map((r) => ({
    id: r.id,
    formTitle: r.form.title,
    notes: r.notes,
    answers: r.answers as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Busca arquivos de mídia (fotos antes/depois) do cliente.
 */
export async function getCustomerMedia(tenantId: string, customerId: string) {
  return db.media.findMany({
    where: { tenantId, customerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      fileType: true,
      fileName: true,
      description: true,
      category: true,
      createdAt: true,
    },
  });
}

/**
 * Busca pacotes comprados pelo cliente com progresso de sessões.
 */
export async function getCustomerPackages(tenantId: string, customerId: string) {
  const packages = await db.customerPackage.findMany({
    where: { tenantId, customerId },
    include: {
      package: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return packages.map((p) => ({
    id: p.id,
    packageName: p.package.name,
    packagePrice: Number(p.package.price),
    totalSessions: p.totalSessions,
    usedSessions: p.usedSessions,
    isActive: p.isActive,
    purchaseDate: p.purchaseDate.toISOString(),
    expiresAt: p.expiresAt?.toISOString() ?? null,
  }));
}

/**
 * Busca transações financeiras vinculadas a agendamentos deste cliente.
 */
export async function getCustomerTransactions(tenantId: string, customerId: string) {
  // Busca appointments deste cliente que possuem transactions
  const appointments = await db.appointment.findMany({
    where: { tenantId, customerId },
    select: { id: true },
  });

  const appointmentIds = appointments.map((a) => a.id);

  const transactions = await db.transaction.findMany({
    where: {
      tenantId,
      appointmentId: { in: appointmentIds },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return transactions.map((t) => ({
    id: t.id,
    type: t.type,
    paymentMethod: t.paymentMethod,
    paymentStatus: t.paymentStatus,
    amount: Number(t.amount),
    description: t.description,
    installmentNumber: t.installmentNumber,
    totalInstallments: t.totalInstallments,
    paidAt: t.paidAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  }));
}

/**
 * Adiciona uma nota de evolução clínica ao prontuário do paciente.
 * Cria um AnamnesisRecord vinculado a um AnamnesisForm genérico "Evolução Clínica".
 */
export async function addClinicalNote(
  tenantId: string,
  customerId: string,
  notes: string
): Promise<ActionResult<{ recordId: string }>> {
  if (!notes.trim()) {
    return { success: false, error: "A nota clínica não pode ser vazia." };
  }

  // Busca ou cria um form genérico de "Evolução Clínica" para o tenant
  let form = await db.anamnesisForm.findFirst({
    where: { tenantId, title: "Evolução Clínica", deletedAt: null },
  });

  if (!form) {
    form = await db.anamnesisForm.create({
      data: {
        tenantId,
        title: "Evolução Clínica",
        fields: [],
        isActive: true,
      },
    });
  }

  const record = await db.anamnesisRecord.create({
    data: {
      tenantId,
      customerId,
      formId: form.id,
      answers: {},
      notes,
    },
  });

  return { success: true, data: { recordId: record.id } };
}

/**
 * Registra um arquivo de mídia para o cliente.
 * Em produção, o upload iria para S3/Cloudinary. Aqui salvamos apenas o registro
 * com URL simulada — o ponto de integração com bucket está documentado no código.
 */
export async function addCustomerMedia(
  tenantId: string,
  customerId: string,
  data: {
    fileName: string;
    fileType: string;
    description?: string;
    category?: string;
    // Em produção: URL do S3/Cloudinary. Aqui usamos placeholder.
    url: string;
  }
): Promise<ActionResult<{ mediaId: string }>> {
  const media = await db.media.create({
    data: {
      tenantId,
      customerId,
      url: data.url,
      fileType: data.fileType,
      fileName: data.fileName,
      description: data.description ?? null,
      category: data.category ?? null,
    },
  });

  return { success: true, data: { mediaId: media.id } };
}
