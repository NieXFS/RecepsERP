import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Scissors,
  UserRound,
  WalletCards,
} from "lucide-react";
import { CountUpStat } from "@/components/marketing/count-up-stat";

const appointments = [
  {
    time: "09:00",
    customer: "Mariana",
    service: "Limpeza de pele",
    accent: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    time: "10:30",
    customer: "Paulo",
    service: "Corte + barba",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    time: "13:00",
    customer: "Julia",
    service: "Design de sobrancelha",
    accent: "bg-sky-50 text-sky-700 border-sky-100",
  },
  {
    time: "15:00",
    customer: "Dr. Ricardo",
    service: "Avaliação odonto",
    accent: "bg-amber-50 text-amber-700 border-amber-100",
  },
];

export function ErpDashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[36rem]">
      <div className="absolute left-5 top-5 z-10 hidden rounded-full border border-emerald-200 bg-white/95 px-4 py-2 text-sm font-medium text-emerald-700 shadow-lg backdrop-blur lg:block">
        Caixa do dia fechado em 1 clique
      </div>
      <div className="absolute right-5 top-5 z-10 rounded-full border border-violet-200 bg-white/95 px-4 py-2 text-sm font-medium text-violet-700 shadow-lg backdrop-blur">
        Agenda, clientes e financeiro
      </div>

      <div className="rounded-[2rem] border border-white/80 bg-white/85 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="rounded-[1.6rem] border border-[#EFEFEF] bg-[#fdfdfd] p-4 pt-20 shadow-inner lg:pt-24">
          <div className="mb-4 flex items-center justify-between rounded-[1.3rem] bg-[#f5f5f7] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/15 text-violet-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[#0A0A0A]">ERP Receps</p>
                <p className="text-sm text-[#525252]">Bella &amp; Co</p>
              </div>
            </div>
            <div className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
              sincronizado
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#f5f3ff_0%,#ffffff_22%,#ffffff_100%)] p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0A0A0A]">Agenda de hoje</p>
                  <p className="text-xs text-[#737373]">Sexta-feira • 12 atendimentos</p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm">
                  sem conflito
                </div>
              </div>

              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={`${appointment.time}-${appointment.customer}`}
                    className={`flex items-center gap-3 rounded-[1.2rem] border px-3 py-3 shadow-sm ${appointment.accent}`}
                  >
                    <div className="rounded-[0.9rem] bg-white px-2.5 py-1.5 text-xs font-bold text-[#0A0A0A] shadow-sm">
                      {appointment.time}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{appointment.customer}</p>
                      <p className="truncate text-xs text-[#525252]">{appointment.service}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_100%)] p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0A0A0A]">
                  <WalletCards className="h-4 w-4 text-violet-600" />
                  Faturamento do dia
                </div>
                <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0A0A0A]">
                  <CountUpStat value={2340} prefix="R$ " decimals={2} />
                </p>
                <p className="mt-2 text-sm text-[#525252]">Entradas atualizadas em tempo real</p>
              </div>

              <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#f0fdf4_0%,#ffffff_100%)] p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0A0A0A]">Próximo cliente</p>
                    <p className="text-sm text-[#525252]">Aline Souza • 16:00</p>
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-medium text-emerald-700 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmado
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricCard
              icon={CalendarDays}
              label="Hoje"
              value="12 atendimentos"
            />
            <MetricCard
              icon={DollarSign}
              label="Semana"
              value="R$ 14,2k"
            />
            <MetricCard
              icon={Clock3}
              label="Comissões"
              value="Calculadas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[#EAEAEA] bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#737373]">
        <Icon className="h-3.5 w-3.5 text-violet-600" />
        {label}
      </div>
      <p className="mt-2 text-lg font-bold text-[#0A0A0A]">{value}</p>
    </div>
  );
}
