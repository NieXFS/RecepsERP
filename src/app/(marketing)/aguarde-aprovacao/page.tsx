import Link from "next/link";
import { Clock3, MailCheck } from "lucide-react";

/**
 * Tela de confirmação após o envio da solicitação pública de acesso.
 */
export default function AguardeAprovacaoPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <MailCheck className="h-8 w-8" />
      </div>

      <p className="mt-8 text-sm font-medium uppercase tracking-[0.24em] text-primary">
        Solicitação recebida
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Seu acesso ao ERP entrou na fila de aprovação.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        Agora o time da Receps analisa o contexto da operação e, se aprovado, gera um convite
        seguro para ativação do tenant. Nenhuma conta é criada automaticamente nesta etapa.
      </p>

      <div className="mt-8 flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
        <Clock3 className="h-4 w-4" />
        Acompanhe seu email para receber o convite ou retorno comercial.
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/erp"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Voltar para o ERP
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          Ir para a página inicial
        </Link>
      </div>
    </div>
  );
}
