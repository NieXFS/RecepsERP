import { Check, X } from "lucide-react";

const beforeDay = [
  ["08:00", "Abrir planilha, conferir agenda"],
  ["08:30", "Responder mensagens acumuladas do fim de semana"],
  ["10:00", "Cliente liga pra remarcar, voce para tudo"],
  ["12:00", "Almoco atrasado porque nao deu tempo"],
  ["14:00", "Calcular comissao de 3 profissionais na mao"],
  ["17:00", "Fechar caixa no Excel"],
  ["19:00", "Ainda respondendo mensagem no WhatsApp pessoal"],
  ["22:00", "Perdeu 4 clientes porque nao viu as mensagens"],
];

const afterDay = [
  ["08:00", "Abre o Receps e ve que a Ana ja marcou 6 consultas no fim de semana"],
  ["08:15", "Confere o dia e vai atender"],
  ["12:00", "Almoca no horario"],
  ["17:00", "Fecha o caixa em 10 segundos, 1 clique"],
  ["17:15", "Vai embora"],
  ["22:00", "Dormindo. A Ana ta marcando consulta de quarta."],
];

export function DayComparison() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.02fr]">
      <div className="rounded-[2rem] border border-[#E6E6E6] bg-white/70 p-7 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#737373]">
            Sua segunda-feira hoje
          </p>
          <h3 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#0A0A0A]">
            O dia some em tarefa que nem precisava existir.
          </h3>
        </div>

        <div className="space-y-3">
          {beforeDay.map(([time, text]) => (
            <div
              key={`${time}-${text}`}
              className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-[1.2rem] border border-[#ECECEC] bg-[#FAFAFA] px-4 py-3"
            >
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#525252] shadow-sm">
                {time}
              </span>
              <p className="text-sm leading-6 text-[#525252]">{text}</p>
              <X className="mt-1 h-4 w-4 text-[#A3A3A3]" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-violet-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f3ff_100%)] p-7 shadow-[0_22px_60px_rgba(139,92,246,0.12)]">
        <div className="mb-6">
          <div className="inline-flex rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            Com Receps + Ana
          </div>
          <h3 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#0A0A0A]">
            Menos coisa pra fazer. Mais negocio rodando sozinho.
          </h3>
        </div>

        <div className="space-y-3">
          {afterDay.map(([time, text]) => (
            <div
              key={`${time}-${text}`}
              className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-[1.2rem] border border-violet-100 bg-white px-4 py-3 shadow-sm"
            >
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                {time}
              </span>
              <p className="text-sm leading-6 text-[#3F3F46]">{text}</p>
              <Check className="mt-1 h-4 w-4 text-emerald-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
