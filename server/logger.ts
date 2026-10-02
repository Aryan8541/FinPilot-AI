const SENSITIVE_KEYS = /secret|token|password|api[_-]?key|authorization|cookie/i;

function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 8 ? "[redacted]" : value;
  }

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEYS.test(key) ? "[redacted]" : redactValue(nestedValue),
      ])
    );
  }

  return value;
}

export function logInfo(context: string, message: string, meta?: unknown) {
  console.info(JSON.stringify({ level: "info", context, message, meta: redactValue(meta) }));
}

export function logWarn(context: string, message: string, meta?: unknown) {
  console.warn(JSON.stringify({ level: "warn", context, message, meta: redactValue(meta) }));
}

export function logError(context: string, error: unknown, meta?: unknown) {
  const serialized = error instanceof Error ? { name: error.name, message: error.message } : redactValue(error);
  console.error(JSON.stringify({ level: "error", context, error: serialized, meta: redactValue(meta) }));
}
