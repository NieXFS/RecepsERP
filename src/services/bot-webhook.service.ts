const DEFAULT_BOT_PROCESSOR_WEBHOOK_URL = "http://localhost:5001/webhook";

export function extractPhoneNumberIdFromWebhookPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const entry = (payload as { entry?: unknown[] }).entry;
  if (!Array.isArray(entry)) {
    return null;
  }

  for (const entryItem of entry) {
    const changes =
      entryItem && typeof entryItem === "object"
        ? (entryItem as { changes?: unknown[] }).changes
        : null;

    if (!Array.isArray(changes)) {
      continue;
    }

    for (const change of changes) {
      const value =
        change && typeof change === "object"
          ? (change as { value?: unknown }).value
          : null;

      if (!value || typeof value !== "object") {
        continue;
      }

      const metadata = (value as { metadata?: unknown }).metadata;
      if (!metadata || typeof metadata !== "object") {
        continue;
      }

      const phoneNumberId = (metadata as { phone_number_id?: unknown }).phone_number_id;

      if (typeof phoneNumberId === "string" && phoneNumberId.trim()) {
        return phoneNumberId.trim();
      }
    }
  }

  return null;
}

export async function forwardBotWebhookPayload(payload: unknown) {
  const targetUrl =
    process.env.BOT_PROCESSOR_WEBHOOK_URL ?? DEFAULT_BOT_PROCESSOR_WEBHOOK_URL;

  try {
    await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-receps-bot-forwarded": "true",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    console.error("❌ Erro ao encaminhar webhook para o processo do bot:", error);
  }
}
