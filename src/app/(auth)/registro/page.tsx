import { redirect } from "next/navigation";

/**
 * Rota legada de compatibilidade.
 * Redireciona para a vitrine de planos antes do novo cadastro self-service.
 */
export default function RegistroRedirectPage() {
  redirect("/assinar");
}
