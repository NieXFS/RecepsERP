import { getAuthUser } from "@/lib/session";
import { RecepsAccessDenied } from "@/components/internal/receps-access-denied";
import { RecepsPanelNav } from "@/components/internal/receps-panel-nav";

/**
 * Shell do painel global da Receps.
 * Centraliza a proteção SUPER_ADMIN e organiza a navegação interna do contexto global.
 */
export default async function RecepsPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (user.globalRole !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-muted/20 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <RecepsAccessDenied />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[2rem] border border-border/70 bg-background p-4 shadow-xl shadow-primary/8">
          <div className="mb-5 border-b border-border/70 px-2 pb-4">
            <p className="text-sm font-semibold">Receps</p>
            <p className="text-xs text-muted-foreground">Painel global da plataforma</p>
          </div>
          <RecepsPanelNav />
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
