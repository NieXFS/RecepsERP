import { LoginShell } from "@/components/auth/login-shell";
import { RequestResetForm } from "@/components/auth/request-reset-form";

/**
 * Página de solicitação de reset de senha.
 * Reaproveita o shell visual premium do /login.
 */
export default async function RecuperarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;

  return (
    <LoginShell>
      <RequestResetForm initialEmail={params.email} />
    </LoginShell>
  );
}
