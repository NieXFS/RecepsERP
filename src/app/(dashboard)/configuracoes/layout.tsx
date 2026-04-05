import { getAuthUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { SettingsNav } from "@/components/settings/settings-nav";

/**
 * Layout aninhado das Configurações — restringe acesso a ADMIN
 * e renderiza a sub-navegação (tabs) acima do conteúdo das sub-rotas.
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie aparência, equipe, serviços e recursos do estabelecimento.
        </p>
      </div>
      <SettingsNav />
      {children}
    </div>
  );
}
