import {
  clearRuntimeDiagnostics,
  formatRuntimeDiagnostics,
  getRuntimeDiagnostics,
  installGlobalRuntimeDiagnostics,
  recordRuntimeDiagnostic,
} from './runtimeDiagnostics';

describe('runtimeDiagnostics', () => {
  beforeEach(() => {
    clearRuntimeDiagnostics();
    (window as Window & { __muwiRuntimeDiagnosticsInstalled?: boolean }).__muwiRuntimeDiagnosticsInstalled =
      false;
    vi.restoreAllMocks();
  });

  it('records diagnostics with explicit and inferred routes', () => {
    recordRuntimeDiagnostic('error', {
      message: 'explicit route',
      route: '/manual-route',
    });

    window.history.replaceState({}, '', '/diagnostics?tab=runtime#latest');
    recordRuntimeDiagnostic('unhandledrejection', {
      message: 'inferred route',
    });

    const diagnostics = getRuntimeDiagnostics();
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[0].route).toBe('/manual-route');
    expect(diagnostics[1].route).toBe('/diagnostics?tab=runtime#latest');
  });

  it('formats diagnostics and enforces minimum limit slice', () => {
    recordRuntimeDiagnostic('error', { message: 'first' });
    recordRuntimeDiagnostic('error', { message: 'second' });

    const formatted = formatRuntimeDiagnostics(0);
    expect(formatted).toContain('second');
    expect(formatted).not.toContain('first');
    expect(formatted).toContain('ERROR');
  });

  it('installs global handlers once and captures runtime/unhandled errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const cleanup = installGlobalRuntimeDiagnostics();
    const secondCleanup = installGlobalRuntimeDiagnostics();
    expect(typeof secondCleanup).toBe('function');

    window.dispatchEvent(
      new ErrorEvent('error', {
        message: 'error-event-message',
      })
    );

    window.dispatchEvent(
      new ErrorEvent('error', {
        error: new Error('instance-error-message'),
      })
    );

    const emptyMessageError = new Error('');
    const rejectionWithEmptyMessage = new Event('unhandledrejection') as Event & {
      reason: unknown;
    };
    rejectionWithEmptyMessage.reason = emptyMessageError;
    window.dispatchEvent(rejectionWithEmptyMessage);

    const rejectionWithString = new Event('unhandledrejection') as Event & {
      reason: unknown;
    };
    rejectionWithString.reason = 'string-rejection';
    window.dispatchEvent(rejectionWithString);

    const rejectionWithObject = new Event('unhandledrejection') as Event & {
      reason: unknown;
    };
    rejectionWithObject.reason = { source: 'object-rejection' };
    window.dispatchEvent(rejectionWithObject);

    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    const rejectionWithCyclic = new Event('unhandledrejection') as Event & {
      reason: unknown;
    };
    rejectionWithCyclic.reason = cyclic;
    window.dispatchEvent(rejectionWithCyclic);

    const diagnostics = getRuntimeDiagnostics();
    expect(diagnostics.length).toBeGreaterThanOrEqual(6);
    expect(diagnostics.some((entry) => entry.message === 'error-event-message')).toBe(true);
    expect(diagnostics.some((entry) => entry.message === 'instance-error-message')).toBe(true);
    expect(
      diagnostics.some((entry) => entry.message === 'Unhandled promise rejection')
    ).toBe(true);
    expect(diagnostics.some((entry) => entry.message === 'string-rejection')).toBe(true);
    expect(
      diagnostics.some((entry) => entry.message.includes('object-rejection'))
    ).toBe(true);
    expect(
      diagnostics.some((entry) => entry.message.includes('[object Object]'))
    ).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();

    cleanup();
    const previousCount = getRuntimeDiagnostics().length;
    window.dispatchEvent(
      new ErrorEvent('error', {
        message: 'after-cleanup',
      })
    );
    expect(getRuntimeDiagnostics()).toHaveLength(previousCount);
  });
});
