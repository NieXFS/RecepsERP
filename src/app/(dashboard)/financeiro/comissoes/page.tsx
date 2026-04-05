import { redirect } from "next/navigation";

/**
 * Compatibilidade com a rota antiga de comissões dentro de /financeiro.
 */
export default async function CommissionsPage() {
  redirect("/comissoes");
}
