const GRAPH_HOST = "https://graph.facebook.com";
const DEFAULT_TIMEOUT_MS = 15_000;

type SendTemplateParams = {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
  to: string;
  templateName: string;
  languageCode: string;
  bodyVariables: string[];
};

type CreateTemplateParams = {
  wabaId: string;
  accessToken: string;
  apiVersion: string;
  name: string;
  category: string;
  languageCode: string;
  bodyText: string;
  namedParams?: Array<{ name: string; example: string }>;
};

type DeleteTemplateParams = {
  wabaId: string;
  accessToken: string;
  apiVersion: string;
  name: string;
};

type GetTemplateStatusParams = {
  wabaId: string;
  accessToken: string;
  apiVersion: string;
  name: string;
};

type MetaErrorShape = {
  error?: {
    message?: string;
    error_user_title?: string;
    error_user_msg?: string;
    code?: number;
    type?: string;
  };
};

async function doFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function parseResponse(response: Response): Promise<{
  ok: boolean;
  status: number;
  body: unknown;
  rawText: string;
}> {
  const rawText = await response.text();
  let body: unknown = null;
  try {
    body = rawText.length > 0 ? JSON.parse(rawText) : null;
  } catch {
    body = null;
  }
  return { ok: response.ok, status: response.status, body, rawText };
}

function formatMetaError(
  status: number,
  body: unknown,
  rawText: string,
  fallback: string
): string {
  const err = (body as MetaErrorShape | null)?.error;
  if (err) {
    const parts = [
      err.error_user_title,
      err.error_user_msg ?? err.message,
      err.code ? `(code ${err.code})` : null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" — ");
  }
  const snippet = rawText.slice(0, 180).trim();
  return snippet.length > 0 ? `${fallback} [HTTP ${status}] ${snippet}` : `${fallback} [HTTP ${status}]`;
}

export async function sendTemplateMessage(
  params: SendTemplateParams
): Promise<{ messageId: string }> {
  const url = `${GRAPH_HOST}/${params.apiVersion}/${params.phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: params.to,
    type: "template",
    template: {
      name: params.templateName,
      language: { code: params.languageCode },
      components:
        params.bodyVariables.length > 0
          ? [
              {
                type: "body",
                parameters: params.bodyVariables.map((text) => ({
                  type: "text",
                  text,
                })),
              },
            ]
          : [],
    },
  };

  const response = await doFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse(response);

  if (!parsed.ok) {
    throw new Error(
      formatMetaError(
        parsed.status,
        parsed.body,
        parsed.rawText,
        "Falha ao enviar template WhatsApp."
      )
    );
  }

  const body = parsed.body as { messages?: Array<{ id?: string }> } | null;
  const messageId = body?.messages?.[0]?.id;
  if (!messageId) {
    throw new Error("Resposta do WhatsApp sem messageId.");
  }

  return { messageId };
}

export async function createMessageTemplate(
  params: CreateTemplateParams
): Promise<{ templateId: string; status: string }> {
  const url = `${GRAPH_HOST}/${params.apiVersion}/${params.wabaId}/message_templates`;
  const hasNamedParams = Boolean(
    params.namedParams && params.namedParams.length > 0
  );
  const bodyComponent: Record<string, unknown> = {
    type: "BODY",
    text: params.bodyText,
  };
  if (hasNamedParams) {
    bodyComponent.example = {
      body_text_named_params: params.namedParams!.map((p) => ({
        param_name: p.name,
        example: p.example,
      })),
    };
  }
  const payload: Record<string, unknown> = {
    name: params.name,
    language: params.languageCode,
    category: params.category,
    components: [bodyComponent],
  };
  if (hasNamedParams) {
    payload.parameter_format = "NAMED";
  }

  const response = await doFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse(response);

  if (!parsed.ok) {
    throw new Error(
      formatMetaError(
        parsed.status,
        parsed.body,
        parsed.rawText,
        "Falha ao criar template WhatsApp."
      )
    );
  }

  const body = parsed.body as { id?: string; status?: string } | null;
  if (!body?.id) {
    throw new Error("Resposta da Meta sem id do template.");
  }

  return {
    templateId: body.id,
    status: body.status ?? "PENDING",
  };
}

export async function getMessageTemplateStatus(
  params: GetTemplateStatusParams
): Promise<{ status: string; rejectionReason?: string } | null> {
  const qs = new URLSearchParams({
    name: params.name,
    fields: "name,status,rejected_reason",
  });
  const url = `${GRAPH_HOST}/${params.apiVersion}/${params.wabaId}/message_templates?${qs.toString()}`;

  const response = await doFetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  const parsed = await parseResponse(response);

  if (!parsed.ok) {
    throw new Error(
      formatMetaError(
        parsed.status,
        parsed.body,
        parsed.rawText,
        "Falha ao consultar status do template."
      )
    );
  }

  const body = parsed.body as {
    data?: Array<{ name?: string; status?: string; rejected_reason?: string }>;
  } | null;

  const match = body?.data?.find((row) => row.name === params.name);
  if (!match || !match.status) {
    return null;
  }

  return {
    status: match.status,
    rejectionReason:
      match.rejected_reason && match.rejected_reason !== "NONE"
        ? match.rejected_reason
        : undefined,
  };
}

export async function deleteMessageTemplate(
  params: DeleteTemplateParams
): Promise<void> {
  const qs = new URLSearchParams({ name: params.name });
  const url = `${GRAPH_HOST}/${params.apiVersion}/${params.wabaId}/message_templates?${qs.toString()}`;

  const response = await doFetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });

  const parsed = await parseResponse(response);

  if (parsed.ok) return;

  const err = (parsed.body as MetaErrorShape | null)?.error;
  const code = err?.code;
  const message = err?.message ?? "";
  const alreadyGone =
    parsed.status === 404 ||
    code === 100 ||
    /not\s*exist|no\s*template|was\s*not\s*found/i.test(message);
  if (alreadyGone) return;

  throw new Error(
    formatMetaError(
      parsed.status,
      parsed.body,
      parsed.rawText,
      "Falha ao deletar template WhatsApp."
    )
  );
}
