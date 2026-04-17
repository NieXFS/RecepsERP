import { LoginShell } from "@/components/auth/login-shell";
import { ConfirmResetForm } from "@/components/auth/confirm-reset-form";

/**
 * Página de criação da nova senha.
 * O token só é validado no submit, para não queimá-lo em previews.
 */
export default async function ConfirmarRecuperarSenhaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <LoginShell>
      <ConfirmResetForm token={token} />
    </LoginShell>
  );
}
