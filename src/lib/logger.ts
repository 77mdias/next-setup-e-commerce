type LogLevel = "info" | "warn" | "error";

export type LoggerContext = {
  requestId?: string;
  route?: string;
  orderId?: number | string | null;
  eventId?: string | null;
  [key: string]: unknown;
};

type LogPayload = {
  context?: LoggerContext;
  data?: unknown;
  error?: unknown;
};

type StructuredLogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  route: string | null;
  requestId: string | null;
  orderId: number | string | null;
  eventId: string | null;
  context: Record<string, unknown> | null;
  data: unknown;
  error: unknown;
};

export type StructuredLogger = {
  info: (message: string, payload?: LogPayload) => void;
  warn: (message: string, payload?: LogPayload) => void;
  error: (message: string, payload?: LogPayload) => void;
  child: (context: LoggerContext) => StructuredLogger;
};

const REQUEST_ID_HEADERS = ["x-request-id", "x-correlation-id"] as const;

function createFallbackRequestId() {
  return `req_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function resolveRequestId(headers: Headers): string {
  for (const headerName of REQUEST_ID_HEADERS) {
    const headerValue = headers.get(headerName)?.trim();

    if (headerValue) {
      return headerValue;
    }
  }

  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return createFallbackRequestId();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeValue(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ?? null,
    };
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (isPlainObject(value)) {
    const normalizedEntries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([entryKey, entryValue]) => [entryKey, normalizeValue(entryValue)]);

    return Object.fromEntries(normalizedEntries);
  }

  return value;
}

function normalizeContext(context: LoggerContext): Record<string, unknown> {
  const contextEntries = Object.entries(context).filter(
    ([, value]) => value !== undefined,
  );

  if (contextEntries.length === 0) {
    return {};
  }

  return Object.fromEntries(
    contextEntries.map(([key, value]) => [key, normalizeValue(value)]),
  );
}

function normalizeStringField(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeOrderIdField(value: unknown): number | string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalizedStringValue = normalizeStringField(value);
  return normalizedStringValue ?? null;
}

function normalizeKnownContext(context: Record<string, unknown>) {
  return {
    route: normalizeStringField(context.route),
    requestId: normalizeStringField(context.requestId),
    orderId: normalizeOrderIdField(context.orderId),
    eventId: normalizeStringField(context.eventId),
  };
}

function buildLogEntry(
  level: LogLevel,
  message: string,
  context: LoggerContext,
  payload?: LogPayload,
): StructuredLogEntry {
  const mergedContext = normalizeContext({
    ...context,
    ...(payload?.context ?? {}),
  });
  const knownContext = normalizeKnownContext(mergedContext);
  const additionalContextEntries = Object.entries(mergedContext).filter(
    ([key]) =>
      key !== "route" &&
      key !== "requestId" &&
      key !== "orderId" &&
      key !== "eventId",
  );

  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    route: knownContext.route,
    requestId: knownContext.requestId,
    orderId: knownContext.orderId,
    eventId: knownContext.eventId,
    context:
      additionalContextEntries.length > 0
        ? Object.fromEntries(additionalContextEntries)
        : null,
    data: normalizeValue(payload?.data ?? null),
    error: normalizeValue(payload?.error ?? null),
  };
}

function writeStructuredLog(
  level: LogLevel,
  message: string,
  context: LoggerContext,
  payload?: LogPayload,
) {
  const logEntry = buildLogEntry(level, message, context, payload);
  const serializedLog = JSON.stringify(logEntry);

  if (level === "error") {
    console.error(serializedLog);
    return;
  }

  if (level === "warn") {
    console.warn(serializedLog);
    return;
  }

  console.info(serializedLog);
}

export function createLogger(baseContext: LoggerContext = {}): StructuredLogger {
  const logWithLevel =
    (level: LogLevel) =>
    (message: string, payload?: LogPayload): void => {
      writeStructuredLog(level, message, baseContext, payload);
    };

  return {
    info: logWithLevel("info"),
    warn: logWithLevel("warn"),
    error: logWithLevel("error"),
    child(context: LoggerContext) {
      return createLogger({
        ...baseContext,
        ...context,
      });
    },
  };
}

export function createRequestLogger(params: {
  headers: Headers;
  route: string;
  context?: LoggerContext;
}): StructuredLogger {
  return createLogger({
    route: params.route,
    requestId: resolveRequestId(params.headers),
    ...(params.context ?? {}),
  });
}
