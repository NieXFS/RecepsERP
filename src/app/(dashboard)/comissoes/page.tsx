import { redirect } from "next/navigation";

/**
 * Compatibilidade com a rota legada de comissões.
 */
export default function LegacyCommissionsPage() {
  redirect("/financeiro/comissoes");
}
