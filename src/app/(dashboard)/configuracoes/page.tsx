import { redirect } from "next/navigation";
import { getAuthUserForModule } from "@/lib/session";

/** Redireciona /configuracoes para a sub-rota mais relevante por perfil. */
export default async function SettingsIndexPage() {
  const user = await getAuthUserForModule("CONFIGURACOES");

  redirect(user.role === "ADMIN" ? "/configuracoes/negocio" : "/configuracoes/aparencia");
}
