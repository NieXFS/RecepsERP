import { redirect } from "next/navigation";

/**
 * Compatibilidade com rota legada em inglês.
 */
export default function LegacyServicesPage() {
  redirect("/servicos");
}
