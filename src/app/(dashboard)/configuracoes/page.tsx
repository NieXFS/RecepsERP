import { redirect } from "next/navigation";

/** Redireciona /configuracoes para a primeira sub-rota de aparência. */
export default function SettingsIndexPage() {
  redirect("/configuracoes/aparencia");
}
