import { redirect } from "next/navigation";

/**
 * Redirect legado: a aba "Equipe" foi removida das Configurações.
 * Redireciona para /profissionais (item próprio no menu lateral).
 */
export default function TeamSettingsRedirect() {
  redirect("/profissionais");
}
