import { redirect } from "next/navigation";

/**
 * Compatibilidade com rota legada em inglês.
 */
export default function LegacyPackagesPage() {
  redirect("/pacotes");
}
