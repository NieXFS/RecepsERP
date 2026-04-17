import { LoginForm } from "@/components/auth/login-form";
import { LoginShell } from "@/components/auth/login-shell";

/**
 * Página server-side de login.
 * Resolve os parâmetros da URL no servidor e delega a interação ao formulário client-side.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <LoginShell>
      <LoginForm initialEmail={params.email} callbackUrl={params.callbackUrl} />
    </LoginShell>
  );
}
