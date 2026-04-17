import { redirect } from "next/navigation";

/**
 * Redirect legado: a aba "Atendente IA" foi removida das Configurações.
 * Redireciona para /atendente-ia (item próprio no menu lateral).
 */
export default function BotSettingsRedirect() {
  redirect("/atendente-ia");
}
