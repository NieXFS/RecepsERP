import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccessRequestForm } from "@/components/onboarding/access-request-form";

/**
 * Página pública do novo fluxo comercial do ERP.
 * Substitui o antigo cadastro aberto por uma solicitação controlada de acesso.
 */
export default function SolicitarAcessoPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
      <div className="space-y-6">
        <Link
          href="/erp"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a página do ERP
        </Link>

        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
            Solicitar acesso
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Conte para a Receps como é a sua operação.
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Neste momento o ERP não cria tenants publicamente. Primeiro recebemos sua solicitação,
            entendemos o cenário e então liberamos um convite seguro para ativação do ambiente.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-5 text-sm leading-6 text-primary">
          <p className="font-medium">Essa página é para solicitações manuais.</p>
          <p className="mt-2 text-muted-foreground">
            Para assinar o Receps agora em self-service, siga para{" "}
            <Link href="/assinar" className="font-medium text-primary hover:underline">
              /assinar
            </Link>
            .
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
          <p className="font-medium text-foreground">O que acontece depois</p>
          <p className="mt-2">1. Seu pedido entra como lead pendente.</p>
          <p>2. O time interno aprova a implantação.</p>
          <p>3. Você recebe um link `/convite/[token]` para ativar o tenant.</p>
        </div>
      </div>

      <Card className="border-border/70 shadow-xl shadow-primary/8">
        <CardHeader>
          <CardTitle>Solicitação comercial do ERP</CardTitle>
          <CardDescription>
            Dados simples para avaliarmos contexto, porte e momento da operação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessRequestForm />
        </CardContent>
      </Card>
    </div>
  );
}
