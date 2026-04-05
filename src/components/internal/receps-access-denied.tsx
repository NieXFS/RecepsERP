import Link from "next/link";
import { ShieldCheck } from "lucide-react";

/**
 * Fallback amigável quando o usuário autenticado não pertence ao contexto global da Receps.
 */
export function RecepsAccessDenied() {
  return (
    <div className="rounded-[2rem] border border-border/70 bg-background px-8 py-10 text-center shadow-xl shadow-primary/8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <p className="mt-6 text-sm font-medium uppercase tracking-[0.24em] text-primary">
        Área interna Receps
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Acesso restrito ao time interno da Receps
      </h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Você está autenticado, mas sua conta atual não possui permissão global
        `SUPER_ADMIN` para acessar este painel central.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Ir para o dashboard
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          Entrar com outra conta
        </Link>
      </div>
    </div>
  );
}
