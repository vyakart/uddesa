export type RuntimeDiagnosticKind = 'error' | 'unhandledrejection';

export interface RuntimeDiagnosticEntry {
  id: number;
  kind: RuntimeDiagnosticKind;
  timestamp: string;
  route: string;
  message: string;
  stack?: string;
}

const MAX_RUNTIME_DIAGNOSTICS = 50;
const GLOBAL_INSTALL_KEY = '__muwiRuntimeDiagnosticsInstalled';
let nextDiagnosticId = 1;
let diagnostics: RuntimeDiagnosticEntry[] = [];

function getCurrentRoute(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function pushDiagnostic(entry: Omit<RuntimeDiagnosticEntry, 'id'>): RuntimeDiagnosticEntry {
  const nextEntry: RuntimeDiagnosticEntry = {
    id: nextDiagnosticId++,
    ...entry,
  };

  diagnostics = [...diagnostics, nextEntry].slice(-MAX_RUNTIME_DIAGNOSTICS);
  return nextEntry;
}

export function recordRuntimeDiagnostic(
  kind: RuntimeDiagnosticKind,
  payload: { message: string; stack?: string; route?: string }
): RuntimeDiagnosticEntry {
  return pushDiagnostic({
    kind,
    timestamp: new Date().toISOString(),
    route: payload.route ?? getCurrentRoute(),
    message: payload.message,
    stack: payload.stack,
  });
}

export function getRuntimeDiagnostics(): RuntimeDiagnosticEntry[] {
  return [...diagnostics];
}

export function clearRuntimeDiagnostics(): void {
  diagnostics = [];
}

export function formatRuntimeDiagnostics(limit = 10): string {
  const lines = getRuntimeDiagnostics()
    .slice(-Math.max(1, limit))
    .map((entry) =>
      [
        `[${entry.timestamp}] ${entry.kind.toUpperCase()} ${entry.route}`,
        entry.message,
        entry.stack ?? '',
      ]
        .filter(Boolean)
        .join('\n')
    );

  return lines.join('\n\n');
}

function normalizeReason(reason: unknown): { message: string; stack?: string } {
  if (reason instanceof Error) {
    return {
      message: reason.message || 'Unhandled promise rejection',
      stack: reason.stack,
    };
  }

  if (typeof reason === 'string') {
    return { message: reason };
  }

  try {
    return { message: JSON.stringify(reason) };
  } catch {
    return { message: String(reason) };
  }
}

export function installGlobalRuntimeDiagnostics(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const globalWindow = window as Window & { [GLOBAL_INSTALL_KEY]?: boolean };
  if (globalWindow[GLOBAL_INSTALL_KEY]) {
    return () => {};
  }
  globalWindow[GLOBAL_INSTALL_KEY] = true;

  const onError = (event: ErrorEvent) => {
    const message = event.error instanceof Error ? event.error.message : event.message || 'Unknown runtime error';
    const stack = event.error instanceof Error ? event.error.stack : undefined;
    const entry = recordRuntimeDiagnostic('error', { message, stack });
    console.error('[MUWI runtime]', entry.kind, entry.message, entry.stack ?? '');
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    const normalized = normalizeReason(event.reason);
    const entry = recordRuntimeDiagnostic('unhandledrejection', normalized);
    console.error('[MUWI runtime]', entry.kind, entry.message, entry.stack ?? '');
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    globalWindow[GLOBAL_INSTALL_KEY] = false;
  };
}
