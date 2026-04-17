import { redirect } from "next/navigation";

/**
 * Redirect legado: a aba "Serviços" foi removida das Configurações.
 * Redireciona para /servicos (item próprio no menu lateral).
 */
export default function ServiceSettingsRedirect() {
  redirect("/servicos");
}
