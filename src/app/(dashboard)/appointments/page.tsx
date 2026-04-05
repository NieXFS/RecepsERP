import { getAuthUserForModule } from "@/lib/session";

export default async function AppointmentsPage() {
  await getAuthUserForModule("AGENDA");

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Agendamentos</h2>
      <p className="text-muted-foreground">
        Gerencie a agenda da sua clínica.
      </p>
    </div>
  );
}
