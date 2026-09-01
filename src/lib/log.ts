/**
 * Minimal structured logger. Emits one JSON object per line so Railway log
 * search can filter by level / event / any field. Swap the sink for Sentry or
 * a log drain later without touching call sites.
 */

type Level = "info" | "warn" | "error";

function emit(level: Level, event: string, data?: Record<string, unknown>, err?: unknown) {
  const line: Record<string, unknown> = {
    t: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  if (err instanceof Error) {
    line.error = err.message;
    line.stack = err.stack;
  } else if (err !== undefined) {
    line.error = String(err);
  }
  const out = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  try {
    out(JSON.stringify(line));
  } catch {
    out(`${level} ${event}`);
  }
}

export const log = {
  info: (event: string, data?: Record<string, unknown>) => emit("info", event, data),
  warn: (event: string, data?: Record<string, unknown>, err?: unknown) =>
    emit("warn", event, data, err),
  error: (event: string, err?: unknown, data?: Record<string, unknown>) =>
    emit("error", event, data, err),
};
