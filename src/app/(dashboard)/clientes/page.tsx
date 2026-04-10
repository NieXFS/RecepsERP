import { getAuthUserForModule } from "@/lib/session";
import { listCustomers } from "@/services/customer.service";
import { CustomerList } from "@/components/customer/customer-list";

/**
 * Página de listagem de clientes (Server Component).
 * Busca todos os clientes do tenant e renderiza a lista com busca client-side.
 */
export default async function CustomersPage() {
  const user = await getAuthUserForModule("CLIENTES");
  const customers = await listCustomers(user.tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Gerencie os clientes e pacientes cadastrados.
        </p>
      </div>
      <CustomerList customers={customers} />
    </div>
  );
}
