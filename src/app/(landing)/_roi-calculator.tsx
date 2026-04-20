"use client";

import { useMemo, useState } from "react";

const RECEPS_MONTHLY = 299.99;
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function RoiCalculator() {
  const [cost, setCost] = useState(2200);

  const { diff, paybackCopy } = useMemo(() => {
    const delta = cost - RECEPS_MONTHLY;
    let copy: string | null = null;
    if (delta > 0) {
      const days = Math.max(1, Math.round(RECEPS_MONTHLY / (delta / 30)));
      if (days <= 30) {
        copy = `O Receps se paga em ~${days} dias.`;
      } else if (days <= 90) {
        const weeks = Math.max(1, Math.round(days / 7));
        copy = `O Receps se paga em ~${weeks} semanas.`;
      }
    }
    return { diff: delta, paybackCopy: copy };
  }, [cost]);

  const caseA = cost >= RECEPS_MONTHLY;
  const caseC = cost === 0;
  const caseB = !caseA && !caseC;

  return (
    <section className="roi-calc" id="roi">
      <div className="container container-narrow">
        <div className="section-header reveal">
          <span className="section-tag">Conta rápida</span>
          <h2 className="section-title">
            Quanto você economiza
            <br />
            <span className="text-accent">deixando no piloto automático?</span>
          </h2>
          <p className="section-subtitle">
            Compare quanto custa atender hoje com a assinatura do Receps.
          </p>
        </div>

        <div className="roi-card reveal">
          <div className="roi-inputs">
            <label className="roi-field">
              <span className="roi-field-label">
                Quanto custa (ou custaria) atender por você hoje?
              </span>
              <div className="roi-field-control">
                <input
                  type="range"
                  min={0}
                  max={3500}
                  step={50}
                  value={cost}
                  onChange={(event) => setCost(Number(event.target.value))}
                  aria-label="Custo mensal de atendimento"
                />
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={cost}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isFinite(next) && next >= 0) {
                      setCost(Math.max(0, Math.round(next)));
                    }
                  }}
                  className="roi-number"
                  aria-label="Custo mensal (número)"
                />
              </div>
              <span className="roi-field-hint">
                Base típica: recepcionista custa entre R$ 1.800 e R$ 2.500/mês
              </span>
            </label>
          </div>

          <div className="roi-output" role="status" aria-live="polite">
            {!caseC && (
              <>
                <div className="roi-output-row">
                  <span className="roi-output-label">Você paga hoje</span>
                  <span className="roi-output-value">
                    {BRL.format(cost)}
                    <span className="roi-output-unit">/mês</span>
                  </span>
                </div>
                <div className="roi-output-row">
                  <span className="roi-output-label">Receps custa</span>
                  <span className="roi-output-value">
                    R$ 299,99<span className="roi-output-unit">/mês</span>
                  </span>
                </div>
                <hr className="roi-output-divider" />
              </>
            )}

            {caseA && (
              <div className="roi-output-row roi-output-highlight is-positive">
                <span className="roi-output-label">Você economiza</span>
                <span className="roi-output-value">
                  {BRL.format(diff)}
                  <span className="roi-output-unit">/mês</span>
                </span>
              </div>
            )}

            {caseB && (
              <div className="roi-output-row roi-output-highlight is-neutral">
                <span className="roi-output-label">Diferença</span>
                <span className="roi-output-value">
                  {BRL.format(Math.abs(diff))}
                  <span className="roi-output-unit">/mês</span>
                </span>
              </div>
            )}

            {caseC && (
              <div className="roi-output-row roi-output-highlight is-neutral">
                <span className="roi-output-label">Receps custa</span>
                <span className="roi-output-value">
                  R$ 299,99<span className="roi-output-unit">/mês</span>
                </span>
              </div>
            )}

            {caseA && paybackCopy && (
              <p className="roi-output-payback">{paybackCopy}</p>
            )}

            {caseB && (
              <p className="roi-output-payback">
                Por só {BRL.format(Math.abs(diff))}/mês a mais, você troca o
                atendimento na mão por IA 24h no WhatsApp, agenda e controle
                financeiro.
              </p>
            )}

            {caseC && (
              <p className="roi-output-payback">
                Por R$ 299,99/mês você tem uma atendente IA que responde 24h
                no WhatsApp, agenda e controle financeiro — sem precisar
                contratar.
              </p>
            )}

            <p className="roi-note">
              *Inclui IA 24h, agenda, financeiro e relatórios — o Receps não
              é só um substituto de recepcionista, é um sistema completo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
