import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { getInvitationPreview } from "@/services/onboarding.service";
import { InvitationAcceptForm } from "@/components/onboarding/invitation-accept-form";

const WRAPPER_CLASS =
  "flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,oklch(0.82_0.1_285/0.18),transparent_32%),linear-gradient(to_bottom,transparent,oklch(0.96_0.008_285/0.8))] px-6 py-12";

/**
 * Página pública de ativação por convite.
 * Valida o token e, quando válido, permite que o usuário defina a senha inicial.
 */
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitationPreview(token);

  if (invitation.status === "valid") {
    return (
      <div className={WRAPPER_CLASS}>
        <div className="w-full max-w-lg">
          <div className="rounded-[1.5rem] border border-border/70 bg-background p-8 shadow-xl shadow-primary/10">
            <div className="mb-6 space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Ativar acesso ao ERP</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {invitation.recipientName || "Responsável"}, este convite ativa o ambiente{" "}
                  <span className="font-medium text-foreground">{invitation.tenantName}</span>.
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              <p>Email: {invitation.email}</p>
              <p>Expira em: {formatDateTime(invitation.expiresAt)}</p>
            </div>

            <InvitationAcceptForm token={token} email={invitation.email} />
          </div>
        </div>
      </div>
    );
  }

  const stateConfig = {
    invalid: {
      title: "Convite inválido",
      description:
        "Esse link não foi encontrado ou já não corresponde a um convite ativo da Receps.",
      icon: AlertTriangle,
    },
    expired: {
      title: "Convite expirado",
      description:
        "O prazo deste link terminou. Solicite um novo convite ao time que aprovou seu acesso.",
      icon: Clock3,
    },
    used: {
      title: "Convite já utilizado",
      description:
        "Esta ativação já foi concluída. Se você já definiu a senha, basta seguir para o login.",
      icon: CheckCircle2,
    },
  } as const;

  const content = stateConfig[invitation.status];
  const Icon = content.icon;

  return (
    <div className={WRAPPER_CLASS}>
      <div className="w-full max-w-lg">
        <div className="rounded-[1.5rem] border border-border/70 bg-background p-8 text-center shadow-xl shadow-primary/10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-muted text-foreground">
            <Icon className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold">{content.title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{content.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Ir para o login
            </Link>
            <Link
              href="/assinar"
              className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Ver planos do Receps
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}
