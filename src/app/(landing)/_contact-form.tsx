"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      subject: String(data.get("subject") ?? "").trim(),
      website: String(data.get("website") ?? ""),
    };

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
    if (!payload.name || !emailOk || payload.subject.length < 5) {
      setStatus("error");
      setErrorMessage("Confira nome, e-mail e mensagem antes de enviar.");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Não foi possível enviar agora.");
      }

      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível enviar agora."
      );
    }
  }

  if (status === "success") {
    return (
      <div className="contact-form-success" role="status" aria-live="polite">
        <div className="contact-form-success-icon" aria-hidden="true">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h4 className="contact-form-success-title">Recebemos sua mensagem</h4>
        <p className="contact-form-success-desc">
          Nossa equipe responde em até 24 horas úteis. Se preferir, continue pelo
          WhatsApp aqui do lado — costuma ser ainda mais rápido.
        </p>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setStatus("idle")}
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form className="contact-form" id="contactForm" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="contact-name">Nome</label>
        <input
          type="text"
          id="contact-name"
          name="name"
          placeholder="Seu nome completo"
          autoComplete="name"
          required
          disabled={submitting}
        />
      </div>
      <div className="form-group">
        <label htmlFor="contact-email">E-mail</label>
        <input
          type="email"
          id="contact-email"
          name="email"
          placeholder="seuemail@exemplo.com"
          autoComplete="email"
          required
          disabled={submitting}
        />
      </div>
      <div className="form-group">
        <label htmlFor="contact-subject">Mensagem</label>
        <textarea
          id="contact-subject"
          name="subject"
          placeholder="Descreva sua dúvida ou mensagem..."
          rows={4}
          required
          disabled={submitting}
        />
      </div>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="contact-form-honeypot"
      />
      {status === "error" && errorMessage ? (
        <p className="contact-form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? "Enviando..." : "Enviar mensagem"}
        <span className="btn-icon-wrap">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </button>
    </form>
  );
}
