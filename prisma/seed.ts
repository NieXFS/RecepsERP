import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  DEFAULT_BOT_FALLBACK_MESSAGE,
  DEFAULT_BOT_GREETING_MESSAGE,
  DEFAULT_BOT_SYSTEM_PROMPT,
} from "../src/lib/bot-config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * Seed do banco de dados — cria dados iniciais para teste:
 *
 *  1. Tenant: "Clínica Bella Estética"
 *  2. Usuários: Admin, Recepcionista e Profissional (todos com senha "123456")
 *  3. Serviços: Limpeza de Pele, Depilação a Laser, Corte Masculino
 *  4. Produtos: Cera Depilatória, Ácido Glicólico (consumíveis)
 *  5. Ficha Técnica: liga serviços aos produtos consumidos
 *  6. Salas e Equipamentos
 *  7. Conta Financeira (Caixa)
 *  8. Pacote de exemplo: "10 Sessões Depilação"
 */
async function main() {
  console.log("🌱 Iniciando seed...");

  const passwordHash = await bcrypt.hash("123456", 10);

  // --- 0. CONTEXTO INTERNO RECEPS ---
  const internalTenant = await prisma.tenant.upsert({
    where: { slug: "receps-interno" },
    update: {
      isActive: true,
      source: "SEED",
      lifecycleStatus: "ACTIVE",
    },
    create: {
      name: "Receps Interno",
      slug: "receps-interno",
      source: "SEED",
      lifecycleStatus: "ACTIVE",
      email: "interno@receps.local",
      city: "São Paulo",
      state: "SP",
      isActive: true,
      notes: "Tenant interno da Receps para administração global da plataforma.",
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@receps.local" },
    update: {
      globalRole: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      tenantId: internalTenant.id,
      name: "Receps Super Admin",
      email: "superadmin@receps.local",
      passwordHash,
      role: "ADMIN",
      globalRole: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Super admin: ${superAdmin.email} / 123456`);

  const billingPlans = [
    {
      slug: "somente-atendente-ia",
      name: "Atendente IA",
      description: "Plano dedicado ao atendimento automatizado com IA.",
      priceMonthly: 149.99,
      currency: "brl",
      trialDays: 7,
      maxUsers: 3,
      maxAppointmentsMonth: null,
      features: ["Atendente IA", "Fluxos de atendimento", "Portal de billing"],
      isFeatured: false,
      sortOrder: 10,
    },
    {
      slug: "somente-erp",
      name: "ERP",
      description: "Plano focado na operação diária da clínica no Receps ERP.",
      priceMonthly: 219.99,
      currency: "brl",
      trialDays: 7,
      maxUsers: 10,
      maxAppointmentsMonth: 2000,
      features: ["Agenda", "CRM", "Financeiro", "Portal de billing"],
      isFeatured: true,
      sortOrder: 20,
    },
    {
      slug: "erp-atendente-ia",
      name: "ERP + Atendente IA",
      description: "Plano completo com operação e camada comercial com IA.",
      priceMonthly: 299.99,
      currency: "brl",
      trialDays: 7,
      maxUsers: 20,
      maxAppointmentsMonth: 5000,
      features: [
        "Agenda",
        "CRM",
        "Financeiro",
        "Estoque",
        "Atendente IA",
        "Referral program",
      ],
      isFeatured: true,
      sortOrder: 30,
    },
  ] as const;

  const canonicalPlanSlugs = billingPlans.map((plan) => plan.slug);

  for (const plan of billingPlans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        currency: plan.currency,
        trialDays: plan.trialDays,
        maxUsers: plan.maxUsers,
        maxAppointmentsMonth: plan.maxAppointmentsMonth,
        features: plan.features,
        isActive: true,
        isFeatured: plan.isFeatured,
        sortOrder: plan.sortOrder,
        stripeProductId: null,
        stripePriceId: null,
      },
      create: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        currency: plan.currency,
        trialDays: plan.trialDays,
        maxUsers: plan.maxUsers,
        maxAppointmentsMonth: plan.maxAppointmentsMonth,
        features: plan.features,
        isActive: true,
        isFeatured: plan.isFeatured,
        sortOrder: plan.sortOrder,
        stripeProductId: null,
        stripePriceId: null,
      },
    });
  }

  // Desativa qualquer plano fora dos 3 canônicos (evita cards duplicados em /assinar)
  const deactivated = await prisma.plan.updateMany({
    where: {
      slug: { notIn: [...canonicalPlanSlugs] },
      isActive: true,
    },
    data: { isActive: false },
  });

  console.log(
    `✅ Planos de billing seedados (3 canônicos ativos; ${deactivated.count} legados desativados)`
  );

  // --- 1. TENANT ---
  const tenant = await prisma.tenant.upsert({
    where: { slug: "clinica-bella" },
    update: {
      source: "SEED",
      lifecycleStatus: "ACTIVE",
      isActive: true,
    },
    create: {
      name: "Clínica Bella Estética",
      slug: "clinica-bella",
      source: "SEED",
      lifecycleStatus: "ACTIVE",
      document: "12.345.678/0001-90",
      phone: "(11) 99999-0000",
      email: "contato@clinicabella.com",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-000",
      notes: "Tenant seedado para testes locais e validação do app autenticado.",
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  await prisma.botConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      wabaId: "885963267804070",
      phoneNumberId: "1075428132314639",
      waAccessToken: process.env.WA_ACCESS_TOKEN_SEED || "token-de-teste",
      waVerifyToken: "111104VHps",
      botName: "Ana",
      systemPrompt: DEFAULT_BOT_SYSTEM_PROMPT,
      greetingMessage: DEFAULT_BOT_GREETING_MESSAGE,
      fallbackMessage: DEFAULT_BOT_FALLBACK_MESSAGE,
      aiModel: "gpt-4o-mini",
      aiTemperature: 0.4,
      aiMaxTokens: 500,
      botIsAlwaysActive: false,
      botActiveStart: "08:00",
      botActiveEnd: "20:00",
      timezone: "America/Sao_Paulo",
      isActive: true,
      activatedAt: new Date(),
    },
  });
  console.log("✅ BotConfig seedado para o tenant de teste");

  // --- 2. USUÁRIOS ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Carlos Admin",
      email: "admin@admin.com",
      passwordHash,
      role: "ADMIN",
      phone: "(11) 99999-0001",
    },
  });
  console.log(`✅ Admin: ${admin.email} / 123456`);

  const receptionist = await prisma.user.upsert({
    where: { email: "recepcao@admin.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Ana Recepcionista",
      email: "recepcao@admin.com",
      passwordHash,
      role: "RECEPTIONIST",
      phone: "(11) 99999-0002",
    },
  });
  console.log(`✅ Recepcionista: ${receptionist.email} / 123456`);

  const profUser = await prisma.user.upsert({
    where: { email: "dra.julia@admin.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Dra. Julia Santos",
      email: "dra.julia@admin.com",
      passwordHash,
      role: "PROFESSIONAL",
      phone: "(11) 99999-0003",
    },
  });

  // Cria o registro Professional vinculado ao user
  const professional = await prisma.professional.upsert({
    where: { userId: profUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: profUser.id,
      specialty: "Esteticista",
      contractType: "PJ",
      commissionPercent: 40, // 40% de comissão padrão
      registrationNumber: "CREFITO-12345",
    },
  });
  console.log(`✅ Profissional: ${profUser.email} / 123456 (comissão: 40%)`);

  // --- 3. SERVIÇOS ---
  const limpezaPele = await prisma.service.upsert({
    where: { id: "seed-svc-limpeza" },
    update: {},
    create: {
      id: "seed-svc-limpeza",
      tenantId: tenant.id,
      name: "Limpeza de Pele Profunda",
      description: "Limpeza completa com extração, esfoliação e máscara calmante.",
      durationMinutes: 60,
      price: 180.0,
    },
  });

  const depilacao = await prisma.service.upsert({
    where: { id: "seed-svc-depilacao" },
    update: {},
    create: {
      id: "seed-svc-depilacao",
      tenantId: tenant.id,
      name: "Depilação a Laser — Axilas",
      description: "Sessão de depilação a laser com tecnologia Alexandrite.",
      durationMinutes: 30,
      price: 250.0,
    },
  });

  const corte = await prisma.service.upsert({
    where: { id: "seed-svc-corte" },
    update: {},
    create: {
      id: "seed-svc-corte",
      tenantId: tenant.id,
      name: "Corte Masculino",
      description: "Corte com tesoura e máquina, inclui lavagem.",
      durationMinutes: 45,
      price: 80.0,
    },
  });
  console.log(`✅ Serviços: ${limpezaPele.name}, ${depilacao.name}, ${corte.name}`);

  // Vincula profissional aos serviços (com comissão custom na depilação)
  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: professional.id, serviceId: limpezaPele.id } },
    update: {},
    create: { professionalId: professional.id, serviceId: limpezaPele.id },
  });
  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: professional.id, serviceId: depilacao.id } },
    update: {},
    create: { professionalId: professional.id, serviceId: depilacao.id, customCommissionPercent: 35 },
  });
  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: professional.id, serviceId: corte.id } },
    update: {},
    create: { professionalId: professional.id, serviceId: corte.id },
  });
  console.log("✅ Profissional vinculado aos 3 serviços (depilação com comissão custom: 35%)");

  // --- 4. PRODUTOS (consumíveis) ---
  const cera = await prisma.product.upsert({
    where: { id: "seed-prod-cera" },
    update: {},
    create: {
      id: "seed-prod-cera",
      tenantId: tenant.id,
      name: "Cera Depilatória Roll-On",
      sku: "CERA-001",
      type: "CONSUMABLE",
      costPrice: 25.0,
      salePrice: 0,
      stockQuantity: 50,
      minStock: 10,
      unit: "un",
    },
  });

  const acidoGlicolico = await prisma.product.upsert({
    where: { id: "seed-prod-acido" },
    update: {},
    create: {
      id: "seed-prod-acido",
      tenantId: tenant.id,
      name: "Ácido Glicólico 10%",
      sku: "ACID-001",
      type: "CONSUMABLE",
      costPrice: 45.0,
      salePrice: 0,
      stockQuantity: 30,
      minStock: 5,
      unit: "ml",
    },
  });
  console.log(`✅ Produtos: ${cera.name} (${cera.stockQuantity}un), ${acidoGlicolico.name} (${acidoGlicolico.stockQuantity}ml)`);

  // --- 5. FICHA TÉCNICA (ServiceMaterial) ---
  await prisma.serviceMaterial.upsert({
    where: { serviceId_productId: { serviceId: limpezaPele.id, productId: acidoGlicolico.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      serviceId: limpezaPele.id,
      productId: acidoGlicolico.id,
      quantity: 15, // 15ml por sessão de limpeza de pele
    },
  });

  await prisma.serviceMaterial.upsert({
    where: { serviceId_productId: { serviceId: depilacao.id, productId: cera.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      serviceId: depilacao.id,
      productId: cera.id,
      quantity: 1, // 1 unidade de cera por sessão de depilação
    },
  });
  console.log("✅ Ficha técnica: Limpeza consome 15ml ácido, Depilação consome 1 cera");

  // --- 6. SALAS E EQUIPAMENTOS ---
  const sala1 = await prisma.room.upsert({
    where: { id: "seed-room-1" },
    update: {},
    create: { id: "seed-room-1", tenantId: tenant.id, name: "Sala 1 — Estética" },
  });

  const sala2 = await prisma.room.upsert({
    where: { id: "seed-room-2" },
    update: {},
    create: { id: "seed-room-2", tenantId: tenant.id, name: "Sala 2 — Laser" },
  });

  const laserMachine = await prisma.equipment.upsert({
    where: { id: "seed-equip-laser" },
    update: {},
    create: { id: "seed-equip-laser", tenantId: tenant.id, name: "Máquina de Laser Alexandrite" },
  });
  console.log(`✅ Salas: ${sala1.name}, ${sala2.name} | Equipamento: ${laserMachine.name}`);

  // --- 7. CONTA FINANCEIRA ---
  await prisma.financialAccount.upsert({
    where: { id: "seed-account-caixa" },
    update: {},
    create: {
      id: "seed-account-caixa",
      tenantId: tenant.id,
      name: "Caixa Principal",
      type: "CASH",
      balance: 0,
    },
  });
  console.log("✅ Conta financeira: Caixa Principal (saldo: R$ 0)");

  // --- 8. PACOTE DE EXEMPLO ---
  const pacoteDepilacao = await prisma.package.upsert({
    where: { id: "seed-pkg-depilacao" },
    update: {},
    create: {
      id: "seed-pkg-depilacao",
      tenantId: tenant.id,
      name: "10 Sessões — Depilação a Laser Axilas",
      description: "Pacote fechado com 10 sessões de depilação a laser com desconto.",
      totalSessions: 10,
      price: 2000.0, // 10 x 250 = 2500, pacote com desconto = 2000
    },
  });

  await prisma.packageService.upsert({
    where: { packageId_serviceId: { packageId: pacoteDepilacao.id, serviceId: depilacao.id } },
    update: {},
    create: {
      packageId: pacoteDepilacao.id,
      serviceId: depilacao.id,
      quantity: 10,
    },
  });
  console.log(`✅ Pacote: ${pacoteDepilacao.name} (R$ 2.000 / 10 sessões)`);

  // --- 9. CLIENTE DE EXEMPLO ---
  await prisma.customer.upsert({
    where: { id: "seed-customer-maria" },
    update: {},
    create: {
      id: "seed-customer-maria",
      tenantId: tenant.id,
      name: "Maria Oliveira",
      email: "maria@email.com",
      phone: "(11) 98765-4321",
      document: "123.456.789-00",
      birthDate: new Date("1990-05-15"),
      gender: "FEMALE",
    },
  });
  console.log("✅ Cliente: Maria Oliveira");

  // --- 10. LEAD DE EXEMPLO PARA O NOVO FUNIL ---
  const existingRequest = await prisma.accessRequest.findFirst({
    where: {
      email: "contato@studioaurora.com",
      status: "PENDING",
    },
    select: { id: true },
  });

  if (!existingRequest) {
    await prisma.accessRequest.create({
      data: {
        businessName: "Studio Aurora",
        ownerName: "Fernanda Lima",
        email: "contato@studioaurora.com",
        phone: "(11) 98888-7777",
        notes: "Quer implantar agenda, prontuário e financeiro em uma operação com 4 profissionais.",
        status: "PENDING",
      },
    });
    console.log("✅ Lead pendente: Studio Aurora");
  }

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\n📋 Credenciais de teste:");
  console.log("   Super Admin:   superadmin@receps.local / 123456");
  console.log("   Admin:         admin@admin.com / 123456");
  console.log("   Recepcionista: recepcao@admin.com / 123456");
  console.log("   Profissional:  dra.julia@admin.com / 123456");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
