import { notFound } from "next/navigation";
import { getAuthUserForModule } from "@/lib/session";
import {
  getCustomerProfile,
  getCustomerAppointments,
  getCustomerClinicalRecords,
  getCustomerMedia,
  getCustomerPackages,
  getCustomerTransactions,
} from "@/services/customer.service";
import { ProfileHeader } from "@/components/customer/profile-header";
import { ClientTabs } from "@/components/customer/client-tabs";

/**
 * Página de perfil completo do cliente/paciente (Server Component).
 * Busca todos os dados em paralelo via Prisma e passa ao ClientTabs
 * como props serializadas. O acesso ao conteúdo clínico é resolvido
 * no servidor antes de renderizar as abas do perfil.
 */
export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthUserForModule("CLIENTES");
  const { id: customerId } = await params;
  const tenantId = user.tenantId;

  // Busca perfil primeiro — se não existir, 404
  const profile = await getCustomerProfile(tenantId, customerId);
  if (!profile) notFound();

  // Busca todos os dados restantes em paralelo
  const [appointments, clinicalRecords, media, packages, transactions] =
    await Promise.all([
      getCustomerAppointments(tenantId, customerId),
      getCustomerClinicalRecords(tenantId, customerId),
      getCustomerMedia(tenantId, customerId),
      getCustomerPackages(tenantId, customerId),
      getCustomerTransactions(tenantId, customerId),
    ]);

  // Serializa media (Date → string)
  const serializedMedia = media.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <ProfileHeader profile={profile} />
      <ClientTabs
        customerId={customerId}
        canSeeClinical={user.moduleAccess.PRONTUARIOS}
        appointments={appointments}
        clinicalRecords={clinicalRecords}
        media={serializedMedia}
        packages={packages}
        transactions={transactions}
      />
    </div>
  );
}
