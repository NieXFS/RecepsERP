"use client";

import { useMemo, useState } from "react";

const RECEPS_MONTHLY = 299.99;
const MONTHLY_WORK_HOURS = 160;
const WEEKS_PER_MONTH = 4.33;
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function RoiCalculator() {
  const [hours, setHours] = useState(15);
  const [salary, setSalary] = useState(2200);

  const result = useMemo(() => {
    const hourlyCost = salary / MONTHLY_WORK_HOURS;
    const monthlyCost = hours * WEEKS_PER_MONTH * hourlyCost;
    const savings = monthlyCost - RECEPS_MONTHLY;
    const dailySavings = savings / 30;
    const paybackDays = dailySavings > 0 ? RECEPS_MONTHLY / dailySavings : null;
    return {
      monthlyCost,
      savings,
      paybackDays,
    };
  }, [hours, salary]);

  const positive = result.savings > 0;

  return (
    <section className="roi-calc" id="roi">
      <div className="container container-narrow">
        <div className="section-header reveal">
          <span className="section-tag">Calculadora</span>
          <h2 className="section-title">
            Quanto você economiza
            <br />
            <span className="text-accent">deixando no piloto automático?</span>
          </h2>
          <p className="section-subtitle">
            Conta rápida do custo atual de atender no WhatsApp na mão versus a
            assinatura do Receps.
          </p>
        </div>

        <div className="roi-card reveal">
          <div className="roi-inputs">
            <label className="roi-field">
              <span className="roi-field-label">Horas por semana no WhatsApp</span>
              <div className="roi-field-control">
                <input
                  type="range"
                  min={1}
                  max={60}
                  step={1}
                  value={hours}
                  onChange={(event) => setHours(Number(event.target.value))}
                  aria-label="Horas por semana no WhatsApp"
                />
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={hours}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isFinite(next) && next >= 0) {
                      setHours(Math.min(168, Math.max(0, Math.round(next))));
                    }
                  }}
                  className="roi-number"
                  aria-label="Horas por semana (número)"
                />
              </div>
              <span className="roi-field-hint">{hours}h/sem · cerca de {Math.round(hours * WEEKS_PER_MONTH)}h/mês</span>
            </label>

            <label className="roi-field">
              <span className="roi-field-label">Salário médio de recepcionista</span>
              <div className="roi-field-control">
                <input
                  type="range"
                  min={1500}
                  max={5000}
                  step={50}
                  value={salary}
                  onChange={(event) => setSalary(Number(event.target.value))}
                  aria-label="Salário médio de recepcionista"
                />
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={salary}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isFinite(next) && next >= 0) {
                      setSalary(Math.round(next));
                    }
                  }}
                  className="roi-number"
                  aria-label="Salário (número)"
                />
              </div>
              <span className="roi-field-hint">Base: mês de 160h úteis</span>
            </label>
          </div>

          <div className="roi-output" role="status" aria-live="polite">
            <div className="roi-output-row">
              <span className="roi-output-label">Custo atual de atendimento manual</span>
              <span className="roi-output-value">{BRL.format(result.monthlyCost)}<span className="roi-output-unit">/mês</span></span>
            </div>
            <div className="roi-output-row">
              <span className="roi-output-label">Assinatura Receps (plano completo)</span>
              <span className="roi-output-value">{BRL.format(RECEPS_MONTHLY)}<span className="roi-output-unit">/mês</span></span>
            </div>
            <hr className="roi-output-divider" />
            <div className={`roi-output-row roi-output-highlight ${positive ? "is-positive" : "is-neutral"}`}>
              <span className="roi-output-label">
                {positive ? "Você economiza" : "Investimento mensal líquido"}
              </span>
              <span className="roi-output-value">
                {BRL.format(Math.abs(result.savings))}<span className="roi-output-unit">/mês</span>
              </span>
            </div>
            {positive && result.paybackDays !== null ? (
              <p className="roi-output-payback">
                ROI em aproximadamente <strong>{Math.max(1, Math.round(result.paybackDays))} dias</strong>.
              </p>
            ) : (
              <p className="roi-output-payback">
                Mesmo assim, você ganha IA, ERP, agenda e relatórios — que um salário sozinho não entrega.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
