import { redirect } from "next/navigation";

/**
 * Rota legada de compatibilidade.
 * O cadastro público foi descontinuado e agora redireciona para o fluxo comercial controlado.
 */
export default function RegistroRedirectPage() {
  redirect("/solicitar-acesso");
}
