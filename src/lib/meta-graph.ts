const GRAPH_HOST = "https://graph.facebook.com";
const DEFAULT_TIMEOUT_MS = 15_000;

type MetaGraphErrorShape = {
  error?: {
    message?: string;
    error_user_title?: string;
    error_user_msg?: string;
    code?: number;
    error_subcode?: number;
    type?: string;
  };
};

type ParsedResponse = {
  ok: boolean;
  status: number;
  body: unknown;
  rawText: string;
};

type ExchangeCodeForTokenParams = {
  apiVersion: string;
  appId: string;
  appSecret: string;
  code: string;
  redirectUri: string;
};

type SubscribeAppToWabaParams = {
  apiVersion: string;
  wabaId: string;
  accessToken: string;
};

type RegisterPhoneNumberParams = {
  apiVersion: string;
  phoneNumberId: string;
  accessToken: string;
  pin: string;
};

export class MetaGraphRequestError extends Error {
  status: number;
  code?: number;
  subcode?: number;
  userTitle?: string;
  userMessage?: string;
  rawText: string;

  constructor(params: {
    message: string;
    status: number;
    rawText: string;
    code?: number;
    subcode?: number;
    userTitle?: string;
    userMessage?: string;
  }) {
    super(params.message);
    this.name = "MetaGraphRequestError";
    this.status = params.status;
    this.code = params.code;
    this.subcode = params.subcode;
    this.userTitle = params.userTitle;
    this.userMessage = params.userMessage;
    this.rawText = params.rawText;
  }
}

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

async function parseResponse(response: Response): Promise<ParsedResponse> {
  const rawText = await response.text();
  let body: unknown = null;

  try {
    body = rawText.length > 0 ? JSON.parse(rawText) : null;
  } catch {
    body = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
    rawText,
  };
}

function formatMetaGraphError(
  parsed: ParsedResponse,
  fallbackMessage: string
): MetaGraphRequestError {
  const error = (parsed.body as MetaGraphErrorShape | null)?.error;
  const parts = [
    error?.error_user_title,
    error?.error_user_msg ?? error?.message,
    error?.code ? `(code ${error.code})` : null,
  ].filter(Boolean);

  const message =
    parts.length > 0
      ? parts.join(" — ")
      : parsed.rawText.trim()
        ? `${fallbackMessage} [HTTP ${parsed.status}] ${parsed.rawText.slice(0, 180).trim()}`
        : `${fallbackMessage} [HTTP ${parsed.status}]`;

  return new MetaGraphRequestError({
    message,
    status: parsed.status,
    rawText: parsed.rawText,
    code: error?.code,
    subcode: error?.error_subcode,
    userTitle: error?.error_user_title,
    userMessage: error?.error_user_msg ?? error?.message,
  });
}

async function requestMetaGraph<T>({
  url,
  init,
  fallbackMessage,
}: {
  url: string;
  init: RequestInit;
  fallbackMessage: string;
}): Promise<T> {
  const response = await doFetch(url, init);
  const parsed = await parseResponse(response);

  if (!parsed.ok) {
    throw formatMetaGraphError(parsed, fallbackMessage);
  }

  return parsed.body as T;
}

export async function exchangeCodeForToken(
  params: ExchangeCodeForTokenParams
): Promise<{ accessToken: string }> {
  const url = new URL(`${GRAPH_HOST}/${params.apiVersion}/oauth/access_token`);
  url.searchParams.set("client_id", params.appId);
  url.searchParams.set("client_secret", params.appSecret);
  url.searchParams.set("code", params.code);
  url.searchParams.set("redirect_uri", params.redirectUri);

  const body = await requestMetaGraph<{ access_token?: string }>({
    url: url.toString(),
    init: { method: "GET" },
    fallbackMessage: "Falha ao trocar o código da Meta por access token.",
  });

  const accessToken =
    typeof body?.access_token === "string" ? body.access_token.trim() : "";

  if (!accessToken) {
    throw new Error("Resposta da Meta sem access_token.");
  }

  return { accessToken };
}

export async function subscribeAppToWaba(
  params: SubscribeAppToWabaParams
): Promise<{ success: boolean }> {
  return requestMetaGraph<{ success: boolean }>({
    url: `${GRAPH_HOST}/${params.apiVersion}/${params.wabaId}/subscribed_apps`,
    init: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    },
    fallbackMessage: "Falha ao inscrever o app na WABA.",
  });
}

export async function registerPhoneNumber(
  params: RegisterPhoneNumberParams
): Promise<{ success?: boolean }> {
  return requestMetaGraph<{ success?: boolean }>({
    url: `${GRAPH_HOST}/${params.apiVersion}/${params.phoneNumberId}/register`,
    init: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin: params.pin,
      }),
    },
    fallbackMessage: "Falha ao registrar o número no WhatsApp Cloud API.",
  });
}

export function isPhoneNumberRegisteredInAnotherAppError(error: unknown): boolean {
  if (!(error instanceof MetaGraphRequestError)) {
    return false;
  }

  const haystack = [
    error.userTitle,
    error.userMessage,
    error.rawText,
    error.message,
  ]
    .filter(Boolean)
    .join(" ");

  return /already registered in another app|registered to another app|registrado em outro app/i.test(
    haystack
  );
}
